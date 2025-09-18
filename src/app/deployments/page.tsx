'use client';

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Github, Rocket, Calendar, User, ExternalLink, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

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

interface DeploymentsData {
  deployments: Deployment[];
  total: number;
  success: number;
  failure: number;
  pending: number;
  in_progress: number;
}

export default function DeploymentsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [deploymentsData, setDeploymentsData] = useState<DeploymentsData>({
    deployments: [],
    total: 0,
    success: 0,
    failure: 0,
    pending: 0,
    in_progress: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'success' | 'failure' | 'pending' | 'in_progress'>('all');

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const fetchDeployments = async () => {
      if (!session) return;

      try {
        setLoading(true);
        const response = await fetch('/api/github/deployments');

        if (!response.ok) {
          throw new Error('Failed to fetch deployments');
        }

        const data = await response.json();
        setDeploymentsData(data);
      } catch (error) {
        console.error('Failed to fetch deployments:', error);
        setError('Failed to load deployments. Please ensure your GitHub integration is properly configured.');
      } finally {
        setLoading(false);
      }
    };

    fetchDeployments();
  }, [session]);

  const getDeploymentIcon = (state: string) => {
    switch (state) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failure':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getDeploymentStatusColor = (state: string) => {
    switch (state) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'failure':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  const filteredDeployments = deploymentsData.deployments.filter(deployment => {
    if (filter === 'all') return true;
    return deployment.state === filter;
  });

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
                StarSling Dashboard / Deployments
              </button>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {deploymentsData.total} total deployments
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Success</h3>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{deploymentsData.success}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Failed</h3>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{deploymentsData.failure}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pending</h3>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{deploymentsData.pending + deploymentsData.in_progress}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center">
                <Rocket className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{deploymentsData.total}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setFilter('all')}
                  className={`py-3 px-6 text-sm font-medium border-b-2 ${
                    filter === 'all'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  All ({deploymentsData.total})
                </button>
                <button
                  onClick={() => setFilter('success')}
                  className={`py-3 px-6 text-sm font-medium border-b-2 ${
                    filter === 'success'
                      ? 'border-green-500 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Success ({deploymentsData.success})
                </button>
                <button
                  onClick={() => setFilter('failure')}
                  className={`py-3 px-6 text-sm font-medium border-b-2 ${
                    filter === 'failure'
                      ? 'border-red-500 text-red-600 dark:text-red-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Failed ({deploymentsData.failure})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`py-3 px-6 text-sm font-medium border-b-2 ${
                    filter === 'pending'
                      ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Pending ({deploymentsData.pending + deploymentsData.in_progress})
                </button>
              </nav>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading deployments...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error loading deployments</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/integrations')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Manage Integrations
                </button>
              </div>
            </div>
          ) : filteredDeployments.length === 0 ? (
            <div className="text-center py-12">
              <Rocket className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No deployments found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filter === 'all' ? 'No deployments available.' : `No ${filter} deployments found.`}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDeployments.map((deployment) => (
                  <div key={deployment.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getDeploymentIcon(deployment.state)}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {deployment.repository.name}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getDeploymentStatusColor(deployment.state)}`}>
                            {deployment.state.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {deployment.environment}
                          </span>
                        </div>
                        {deployment.description && (
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {deployment.description}
                          </h3>
                        )}
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {deployment.creator.login}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(deployment.created_at).toLocaleDateString()} at {new Date(deployment.created_at).toLocaleTimeString()}
                          </div>
                          <div className="flex items-center">
                            <Github className="h-4 w-4 mr-1" />
                            {deployment.repository.full_name}
                          </div>
                        </div>
                      </div>
                      <a
                        href={deployment.repository.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Repository
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}