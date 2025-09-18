import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { GitHubIntegrationRepository } from '@/lib/repositories/integrationRepository';
import { decrypt } from '@/lib/encryption';
import { createGitHubJWTGenerator } from '@/lib/services/githubJwtGenerator';

interface Deployment {
  id: number;
  environment: string;
  state: 'success' | 'failure' | 'pending' | 'in_progress';
  created_at: string;
  updated_at: string;
  creator: {
    login: string;
  };
  repository: {
    name: string;
    full_name: string;
    html_url: string;
  };
  description?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get GitHub installation for the user's organization
    const gitHubIntegrationRepository = new GitHubIntegrationRepository();
    const installation = await gitHubIntegrationRepository.findByOrganizationId(session.user.id);

    if (installation.length === 0) {
      return NextResponse.json({
        error: 'GitHub integration not found',
        deployments: [],
        total: 0,
        success: 0,
        failure: 0,
        pending: 0,
        in_progress: 0
      }, { status: 404 });
    }

    const installationData = installation[0];

    // Decrypt the access token
    const accessToken = decrypt(installationData.access_token);

    // The installation ID is the primary key, not in metadata
    const installationId = installationData.id;

    if (!installationId) {
      return NextResponse.json({
        error: 'Installation ID not found',
        deployments: [],
        total: 0,
        success: 0,
        failure: 0,
        pending: 0,
        in_progress: 0
      }, { status: 404 });
    }

    // Generate JWT for GitHub App authentication
    const generateJWT = createGitHubJWTGenerator();
    const jwt = generateJWT();

    // Get installation access token
    const tokenResponse = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'StarSling-GitHub-Integration'
      }
    });

    if (!tokenResponse.ok) {
      console.error('Failed to get installation token:', await tokenResponse.text());
      return NextResponse.json({
        error: 'Failed to authenticate with GitHub',
        deployments: [],
        total: 0,
        success: 0,
        failure: 0,
        pending: 0,
        in_progress: 0
      }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const installationToken = tokenData.token;

    // Fetch repositories accessible by the installation
    const reposResponse = await fetch(`https://api.github.com/installation/repositories`, {
      headers: {
        'Authorization': `Bearer ${installationToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'StarSling-GitHub-Integration'
      }
    });

    if (!reposResponse.ok) {
      console.error('Failed to fetch repositories:', await reposResponse.text());
      return NextResponse.json({
        error: 'Failed to fetch repositories',
        deployments: [],
        total: 0,
        success: 0,
        failure: 0,
        pending: 0,
        in_progress: 0
      }, { status: 500 });
    }

    const reposData = await reposResponse.json();
    const repositories = reposData.repositories || [];

    // Fetch deployments from all repositories
    const allDeployments: Deployment[] = [];

    await Promise.all(
      repositories.map(async (repo: any) => {
        try {
          // Fetch deployments for this repository
          const deploymentsResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/deployments?per_page=100`, {
            headers: {
              'Authorization': `Bearer ${installationToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'StarSling-GitHub-Integration'
            }
          });

          if (deploymentsResponse.ok) {
            const deploymentsData = await deploymentsResponse.json();

            // For each deployment, get its latest status
            const deploymentWithStatus = await Promise.all(
              deploymentsData.map(async (deployment: any) => {
                try {
                  const statusResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/deployments/${deployment.id}/statuses`, {
                    headers: {
                      'Authorization': `Bearer ${installationToken}`,
                      'Accept': 'application/vnd.github.v3+json',
                      'User-Agent': 'StarSling-GitHub-Integration'
                    }
                  });

                  let state = 'pending';
                  if (statusResponse.ok) {
                    const statuses = await statusResponse.json();
                    if (statuses.length > 0) {
                      state = statuses[0].state;
                    }
                  }

                  return {
                    id: deployment.id,
                    environment: deployment.environment || 'production',
                    state: state,
                    created_at: deployment.created_at,
                    updated_at: deployment.updated_at,
                    creator: deployment.creator,
                    description: deployment.description,
                    repository: {
                      name: repo.name,
                      full_name: repo.full_name,
                      html_url: repo.html_url
                    }
                  };
                } catch (error) {
                  console.error(`Error fetching deployment status for ${repo.name}:`, error);
                  return {
                    id: deployment.id,
                    environment: deployment.environment || 'production',
                    state: 'pending',
                    created_at: deployment.created_at,
                    updated_at: deployment.updated_at,
                    creator: deployment.creator,
                    description: deployment.description,
                    repository: {
                      name: repo.name,
                      full_name: repo.full_name,
                      html_url: repo.html_url
                    }
                  };
                }
              })
            );

            allDeployments.push(...deploymentWithStatus);
          }
        } catch (error) {
          console.error(`Error fetching deployments for repository ${repo.name}:`, error);
        }
      })
    );

    // Sort deployments by creation date (newest first)
    const sortedDeployments = allDeployments.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Count deployments by status
    const successCount = sortedDeployments.filter(d => d.state === 'success').length;
    const failureCount = sortedDeployments.filter(d => d.state === 'failure').length;
    const pendingCount = sortedDeployments.filter(d => d.state === 'pending').length;
    const inProgressCount = sortedDeployments.filter(d => d.state === 'in_progress').length;

    return NextResponse.json({
      deployments: sortedDeployments,
      total: sortedDeployments.length,
      success: successCount,
      failure: failureCount,
      pending: pendingCount,
      in_progress: inProgressCount
    });

  } catch (error) {
    console.error('Error in deployments API:', error);
    return NextResponse.json({
      error: 'Internal server error',
      deployments: [],
      total: 0,
      success: 0,
      failure: 0,
      pending: 0,
      in_progress: 0
    }, { status: 500 });
  }
}