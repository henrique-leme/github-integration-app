'use client';

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Github, Users, FolderGit2, Bug, Rocket } from 'lucide-react';
import { StatusCard } from '@/components/StatusCard';
import { FeatureCard } from '@/components/FeatureCard';

interface IntegrationStatus {
  connected: boolean;
  installation_id?: string;
  organization?: string;
  repository_count?: number;
  last_updated?: string;
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [githubStatus, setGithubStatus] = useState<IntegrationStatus>({ connected: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const checkGitHubStatus = async () => {
      if (!session) return;

      try {
        const response = await fetch('/api/integrations/github/status');
        if (response.ok) {
          const result = await response.json();
          console.log('Frontend received status:', result);
          setGithubStatus(result.data || result);
        } else {
          console.error('Status response not ok:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to check GitHub status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkGitHubStatus();
  }, [session]);


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
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">StarSling Dashboard</h1>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Welcome, {session.user.name || session.user.email}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {session.user.name || session.user.email?.split('@')[0]}!
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Here&apos;s an overview of your DevOps integrations and system status.
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatusCard
              title="GitHub Integration"
              value={
                <span className={`${githubStatus.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {loading ? 'Checking...' : githubStatus.connected ? 'Active' : 'Inactive'}
                </span>
              }
              icon={<Github className="h-6 w-6 text-gray-900 dark:text-white" />}
              clickable
              href="/integrations"
            />
            <StatusCard
              title="Repositories"
              value={loading ? '-' : githubStatus.repository_count || 'All'}
              icon={<FolderGit2 className="h-6 w-6 text-blue-500" />}
              clickable
              href="/repositories"
            />
            <StatusCard
              title="Organization"
              value={loading ? '-' : githubStatus.organization || session.user.name || 'Personal'}
              icon={<Users className="h-6 w-6 text-purple-500" />}
            />
          </div>

          {/* Main Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard
              title="Issues Management"
              description="Track and manage issues across all repositories"
              icon={<Bug className="h-10 w-10 text-red-500" />}
              status={
                githubStatus.connected ? (
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Ready to manage issues
                  </span>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Connect GitHub to view issues
                  </span>
                )
              }
              footer="View all issues • Open • Closed • Priority management"
              href="/issues"
            />
            <FeatureCard
              title="Deployments"
              description="Monitor deployment status and manage releases"
              icon={<Rocket className="h-10 w-10 text-blue-500" />}
              status={
                githubStatus.connected ? (
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Ready to track deployments
                  </span>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Connect GitHub to view deployments
                  </span>
                )
              }
              footer="View all deployments • Environments • Status monitoring"
              href="/deployments"
            />
          </div>

        </div>
      </main>
    </div>
  );
}