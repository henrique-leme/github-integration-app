'use client';

import { useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useErrorHandler } from "@/lib/hooks/useErrorHandler";

interface IntegrationStatus {
  connected: boolean;
  installation_id?: string;
  organization?: string;
  repository_count?: number;
  last_updated?: string;
}

function IntegrationsPageContent() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleError, handleSuccess } = useErrorHandler();
  const [githubStatus, setGithubStatus] = useState<IntegrationStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const checkGitHubStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/integrations/github/status');
      if (response.ok) {
        const result = await response.json();
        setGithubStatus(result.data || result);
      } else {
        const errorData = await response.text();
        handleError(new Error(`Failed to check GitHub status: ${errorData}`));
        setGithubStatus({ connected: false });
      }
    } catch (error) {
      handleError(error, 'GitHub Status Check Failed');
      setGithubStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }

    const errorParam = searchParams?.get('error');
    const successParam = searchParams?.get('success');

    if (errorParam) {
      switch (errorParam) {
        case 'setup_cancelled':
          setError('GitHub App setup was cancelled');
          break;
        case 'connection_failed':
          setError('Failed to connect GitHub App');
          break;
        default:
          setError('An error occurred');
      }
    }

    if (successParam === 'github_connected') {
      setSuccess('GitHub App connected successfully!');
      checkGitHubStatus();
    }
  }, [session, isPending, router, searchParams, checkGitHubStatus]);

  useEffect(() => {
    if (session && !success) {
      checkGitHubStatus();
    }
  }, [session, success, checkGitHubStatus]);

  const handleConnectGitHub = () => {
    const orgId = session?.user?.id || 'default';
    window.location.href = `/api/github/auth?org_id=${orgId}`;
  };

  const handleDisconnectGitHub = async () => {
    try {
      const response = await fetch('/api/integrations/github/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setGithubStatus({ connected: false });
        handleSuccess('GitHub App disconnected successfully!');
        setSuccess('GitHub App disconnected successfully!');
      } else {
        const errorData = await response.text();
        handleError(new Error(`Failed to disconnect GitHub App: ${errorData}`));
        setError('Failed to disconnect GitHub App');
      }
    } catch (error) {
      handleError(error, 'GitHub Disconnect Failed');
      setError('Failed to disconnect GitHub App');
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
              <Link
                href="/dashboard"
                className="text-xl font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 mr-2"
              >
                StarSling Dashboard / Integrations
              </Link>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {session.user.name || session.user.email}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrations</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Connect external services to enhance your workflow
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
              <button
                onClick={() => setError(null)}
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
              >
                <span className="sr-only">Dismiss</span>
                ×
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded relative">
              <span className="block sm:inline">{success}</span>
              <button
                onClick={() => setSuccess(null)}
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
              >
                <span className="sr-only">Dismiss</span>
                ×
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-10 w-10 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">GitHub</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Access your repositories and manage issues
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${githubStatus.connected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                        <span className={`text-sm font-medium ${githubStatus.connected ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {githubStatus.connected ? 'Connected' : 'Not Connected'}
                        </span>
                      </div>

                      {githubStatus.connected ? (
                        <button
                          onClick={handleDisconnectGitHub}
                          className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={handleConnectGitHub}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out"
                        >
                          Connect
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {githubStatus.connected && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-3">
                    {githubStatus.organization && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Organization</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{githubStatus.organization}</dd>
                      </div>
                    )}
                    {githubStatus.repository_count !== undefined && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Repositories</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{githubStatus.repository_count}</dd>
                      </div>
                    )}
                    {githubStatus.last_updated && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {new Date(githubStatus.last_updated).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    }>
      <IntegrationsPageContent />
    </Suspense>
  );
}