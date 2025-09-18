import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { GitHubIntegrationRepository } from '@/lib/repositories/integrationRepository';
import { decrypt } from '@/lib/encryption';
import { createGitHubJWTGenerator } from '@/lib/services/githubJwtGenerator';

interface Issue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  user: {
    login: string;
  };
  repository: {
    name: string;
    full_name: string;
  };
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
        issues: [],
        total: 0,
        open: 0,
        closed: 0
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
        issues: [],
        total: 0,
        open: 0,
        closed: 0
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
        issues: [],
        total: 0,
        open: 0,
        closed: 0
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
        issues: [],
        total: 0,
        open: 0,
        closed: 0
      }, { status: 500 });
    }

    const reposData = await reposResponse.json();
    const repositories = reposData.repositories || [];

    // Fetch issues from all repositories
    const allIssues: Issue[] = [];

    await Promise.all(
      repositories.map(async (repo: any) => {
        try {
          // Fetch both open and closed issues
          const [openIssuesResponse, closedIssuesResponse] = await Promise.all([
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

          const openIssues = openIssuesResponse.ok ? await openIssuesResponse.json() : [];
          const closedIssues = closedIssuesResponse.ok ? await closedIssuesResponse.json() : [];

          // Filter out pull requests (GitHub API returns PRs as issues)
          const filteredOpenIssues = openIssues.filter((issue: any) => !issue.html_url.includes('/pull/'));
          const filteredClosedIssues = closedIssues.filter((issue: any) => !issue.html_url.includes('/pull/'));

          // Add repository info to each issue
          [...filteredOpenIssues, ...filteredClosedIssues].forEach((issue: any) => {
            allIssues.push({
              ...issue,
              repository: {
                name: repo.name,
                full_name: repo.full_name
              }
            });
          });
        } catch (error) {
          console.error(`Error fetching issues for repository ${repo.name}:`, error);
        }
      })
    );

    // Sort issues by creation date (newest first)
    const sortedIssues = allIssues.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Count open and closed issues
    const openCount = sortedIssues.filter(issue => issue.state === 'open').length;
    const closedCount = sortedIssues.filter(issue => issue.state === 'closed').length;

    return NextResponse.json({
      issues: sortedIssues,
      total: sortedIssues.length,
      open: openCount,
      closed: closedCount
    });

  } catch (error) {
    console.error('Error in issues API:', error);
    return NextResponse.json({
      error: 'Internal server error',
      issues: [],
      total: 0,
      open: 0,
      closed: 0
    }, { status: 500 });
  }
}