'use client';

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Github, GitBranch, GitPullRequest, Rocket, AlertCircle, CheckCircle, XCircle, Clock, Bug } from 'lucide-react';

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

interface RepositoryData {
  repository: Repository;
  pullRequests: {
    open: PullRequest[];
    closed: PullRequest[];
    total: number;
  };
  issues: {
    open: Issue[];
    closed: Issue[];
    total: number;
  };
  deployments: DeploymentStatus[];
}

export default function RepositoriesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [repositories, setRepositories] = useState<RepositoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const fetchRepositories = async () => {
      if (!session) return;

      try {
        setLoading(true);
        const response = await fetch('/api/github/repositories');

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error:', response.status, errorText);
          throw new Error(`Failed to fetch repositories: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        setRepositories(data.repositories || []);
      } catch (error) {
        console.error('Failed to fetch repositories:', error);
        setError('Failed to load repositories. Please ensure your GitHub integration is properly configured.');
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, [session]);

  const getDeploymentStatusIcon = (state: string) => {
    switch (state) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDeploymentStatusText = (state: string) => {
    switch (state) {
      case 'success':
        return 'Deployed';
      case 'failure':
        return 'Failed';
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'Deploying';
      default:
        return 'Unknown';
    }
  };

  const getDeploymentStatusColor = (state: string) => {
    switch (state) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'failure':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
      case 'in_progress':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-xl font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 mr-2"
              >
                StarSling Dashboard / Repositories
              </button>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {repositories.length} repositories
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading repositories...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error loading repositories</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/integrations')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Manage Integrations
                </button>
              </div>
            </div>
          ) : repositories.length === 0 ? (
            <div className="text-center py-12">
              <Github className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No repositories found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No repositories are available through your GitHub integration.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/integrations')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Manage Integrations
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {repositories.map((repoData) => (
                <div key={repoData.repository.id} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden flex flex-col">
                  {/* Repository Header */}
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Github className="h-5 w-5 text-gray-400 mr-2" />
                        <a
                          href={repoData.repository.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {repoData.repository.name}
                        </a>
                        {repoData.repository.private && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                            Private
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Description with fixed height */}
                    <div className="mt-1 h-5">
                      {repoData.repository.description ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {repoData.repository.description}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                          No description
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Repository Stats */}
                  <div className="px-6 py-4 flex-1">
                    <div className="grid grid-cols-3 gap-4">
                      {/* Issues */}
                      <div>
                        <div className="flex items-center mb-2">
                          <Bug className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Issues</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Open:</span>
                            <span className="font-medium text-red-600 dark:text-red-400">
                              {repoData.issues.open.length}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Closed:</span>
                            <span className="font-medium text-gray-600 dark:text-gray-400">
                              {repoData.issues.closed.length}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Total:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {repoData.issues.total}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pull Requests */}
                      <div>
                        <div className="flex items-center mb-2">
                          <GitPullRequest className="h-4 w-4 text-purple-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Pull Requests</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Open:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {repoData.pullRequests.open.length}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Closed:</span>
                            <span className="font-medium text-gray-600 dark:text-gray-400">
                              {repoData.pullRequests.closed.length}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Total:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {repoData.pullRequests.total}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Deployments */}
                      <div>
                        <div className="flex items-center mb-2">
                          <Rocket className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Deployments</span>
                        </div>
                        <div className="space-y-1">
                          {repoData.deployments.length > 0 ? (
                            repoData.deployments.slice(0, 3).map((deployment, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400 truncate">
                                  {deployment.environment}
                                </span>
                                <div className="flex items-center ml-2">
                                  {getDeploymentStatusIcon(deployment.state)}
                                  <span className={`ml-1 text-xs font-medium ${getDeploymentStatusColor(deployment.state)}`}>
                                    {getDeploymentStatusText(deployment.state)}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">No deployments</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Repository Footer */}
                  <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <GitBranch className="h-4 w-4 mr-1" />
                        <span>{repoData.repository.default_branch}</span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Updated {new Date(repoData.repository.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}