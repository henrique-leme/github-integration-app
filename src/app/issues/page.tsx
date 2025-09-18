'use client';

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Github, Bug, User, Calendar, ExternalLink, AlertCircle } from 'lucide-react';

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

interface IssuesData {
  issues: Issue[];
  total: number;
  open: number;
  closed: number;
}

export default function IssuesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [issuesData, setIssuesData] = useState<IssuesData>({ issues: [], total: 0, open: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const fetchIssues = async () => {
      if (!session) return;

      try {
        setLoading(true);
        const response = await fetch('/api/github/issues');

        if (!response.ok) {
          throw new Error('Failed to fetch issues');
        }

        const data = await response.json();
        setIssuesData(data);
      } catch (error) {
        console.error('Failed to fetch issues:', error);
        setError('Failed to load issues. Please ensure your GitHub integration is properly configured.');
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [session]);

  const filteredIssues = issuesData.issues.filter(issue => {
    if (filter === 'all') return true;
    return issue.state === filter;
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
                StarSling Dashboard / Issues
              </button>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {issuesData.total} total issues
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center">
                <Bug className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Open Issues</h3>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{issuesData.open}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center">
                <Bug className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Closed Issues</h3>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{issuesData.closed}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center">
                <Bug className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Issues</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{issuesData.total}</p>
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
                  All Issues ({issuesData.total})
                </button>
                <button
                  onClick={() => setFilter('open')}
                  className={`py-3 px-6 text-sm font-medium border-b-2 ${
                    filter === 'open'
                      ? 'border-red-500 text-red-600 dark:text-red-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Open ({issuesData.open})
                </button>
                <button
                  onClick={() => setFilter('closed')}
                  className={`py-3 px-6 text-sm font-medium border-b-2 ${
                    filter === 'closed'
                      ? 'border-green-500 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Closed ({issuesData.closed})
                </button>
              </nav>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading issues...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error loading issues</h3>
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
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-12">
              <Bug className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No issues found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filter === 'all' ? 'No issues available.' : `No ${filter} issues found.`}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredIssues.map((issue) => (
                  <div key={issue.number} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Bug className={`h-4 w-4 ${issue.state === 'open' ? 'text-red-500' : 'text-green-500'}`} />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {issue.repository.name}#{issue.number}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            issue.state === 'open'
                              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          }`}>
                            {issue.state}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          {issue.title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {issue.user.login}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(issue.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Github className="h-4 w-4 mr-1" />
                            {issue.repository.full_name}
                          </div>
                        </div>
                      </div>
                      <a
                        href={issue.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on GitHub
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