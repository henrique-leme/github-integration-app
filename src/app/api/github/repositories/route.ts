import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { GitHubIntegrationRepository } from '@/lib/repositories/integrationRepository';
import { decrypt } from '@/lib/encryption';
import { createGitHubJWTGenerator } from '@/lib/services/githubJwtGenerator';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description?: string;
  default_branch: string;
  updated_at: string;
}

interface PullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'draft';
  html_url: string;
  created_at: string;
  user: {
    login: string;
  };
}

interface Issue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  user: {
    login: string;
  };
}

interface DeploymentStatus {
  environment: string;
  state: 'success' | 'failure' | 'pending' | 'in_progress';
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gitHubIntegrationRepository = new GitHubIntegrationRepository();
    const installation = await gitHubIntegrationRepository.findByOrganizationId(session.user.id);

    if (installation.length === 0) {
      return NextResponse.json({
        error: 'GitHub integration not found',
        repositories: []
      }, { status: 404 });
    }

    const installationData = installation[0];

    const accessToken = decrypt(installationData.access_token);

    const installationId = installationData.id;

    if (!installationId) {
      return NextResponse.json({
        error: 'Installation ID not found',
        repositories: []
      }, { status: 404 });
    }

    const generateJWT = createGitHubJWTGenerator();
    const jwt = generateJWT();

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
        repositories: []
      }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const installationToken = tokenData.token;

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
        repositories: []
      }, { status: 500 });
    }

    const reposData = await reposResponse.json();
    const repositories: Repository[] = reposData.repositories || [];

    const repositoriesWithData = await Promise.all(
      repositories.map(async (repo) => {
        try {
          const [openPRsResponse, closedPRsResponse, openIssuesResponse, closedIssuesResponse] = await Promise.all([
            fetch(`https://api.github.com/repos/${repo.full_name}/pulls?state=open&per_page=100`, {
              headers: {
                'Authorization': `Bearer ${installationToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'StarSling-GitHub-Integration'
              }
            }),
            fetch(`https://api.github.com/repos/${repo.full_name}/pulls?state=closed&per_page=100`, {
              headers: {
                'Authorization': `Bearer ${installationToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'StarSling-GitHub-Integration'
              }
            }),
            fetch(`https://api.github.com/repos/${repo.full_name}/issues?state=open&per_page=100`, {
              headers: {
                'Authorization': `Bearer ${installationToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'StarSling-GitHub-Integration'
              }
            }),
            fetch(`https://api.github.com/repos/${repo.full_name}/issues?state=closed&per_page=100`, {
              headers: {
                'Authorization': `Bearer ${installationToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'StarSling-GitHub-Integration'
              }
            })
          ]);

          const openPRs: PullRequest[] = openPRsResponse.ok ? await openPRsResponse.json() : [];
          const closedPRs: PullRequest[] = closedPRsResponse.ok ? await closedPRsResponse.json() : [];
          const openIssues: Issue[] = openIssuesResponse.ok ? await openIssuesResponse.json() : [];
          const closedIssues: Issue[] = closedIssuesResponse.ok ? await closedIssuesResponse.json() : [];

          const filteredOpenIssues = openIssues.filter(issue => !issue.html_url.includes('/pull/'));
          const filteredClosedIssues = closedIssues.filter(issue => !issue.html_url.includes('/pull/'));

          const deploymentsResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/deployments?per_page=10`, {
            headers: {
              'Authorization': `Bearer ${installationToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'StarSling-GitHub-Integration'
            }
          });

          let deployments: DeploymentStatus[] = [];
          if (deploymentsResponse.ok) {
            const deploymentsData = await deploymentsResponse.json();

            deployments = await Promise.all(
              deploymentsData.slice(0, 5).map(async (deployment: any) => {
                try {
                  const statusResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/deployments/${deployment.id}/statuses`, {
                    headers: {
                      'Authorization': `Bearer ${installationToken}`,
                      'Accept': 'application/vnd.github.v3+json',
                      'User-Agent': 'StarSling-GitHub-Integration'
                    }
                  });

                  if (statusResponse.ok) {
                    const statuses = await statusResponse.json();
                    const latestStatus = statuses[0];

                    return {
                      environment: deployment.environment || 'production',
                      state: latestStatus?.state || 'pending',
                      created_at: deployment.created_at
                    };
                  }

                  return {
                    environment: deployment.environment || 'production',
                    state: 'pending',
                    created_at: deployment.created_at
                  };
                } catch (error) {
                  console.error(`Error fetching deployment status for ${repo.name}:`, error);
                  return {
                    environment: deployment.environment || 'production',
                    state: 'pending',
                    created_at: deployment.created_at
                  };
                }
              })
            );
          }

          return {
            repository: repo,
            pullRequests: {
              open: openPRs,
              closed: closedPRs,
              total: openPRs.length + closedPRs.length
            },
            issues: {
              open: filteredOpenIssues,
              closed: filteredClosedIssues,
              total: filteredOpenIssues.length + filteredClosedIssues.length
            },
            deployments
          };
        } catch (error) {
          console.error(`Error fetching data for repository ${repo.name}:`, error);
          return {
            repository: repo,
            pullRequests: {
              open: [],
              closed: [],
              total: 0
            },
            issues: {
              open: [],
              closed: [],
              total: 0
            },
            deployments: []
          };
        }
      })
    );

    const sortedRepositories = repositoriesWithData.sort((a, b) => {
      const dateA = new Date(a.repository.updated_at);
      const dateB = new Date(b.repository.updated_at);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({
      repositories: sortedRepositories,
      total: repositories.length
    });

  } catch (error) {
    console.error('Error in repositories API:', error);
    return NextResponse.json({
      error: 'Internal server error',
      repositories: []
    }, { status: 500 });
  }
}