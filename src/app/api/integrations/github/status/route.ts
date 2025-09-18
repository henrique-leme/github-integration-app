import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { GitHubIntegrationRepository } from '@/lib/repositories/integrationRepository';
import { withErrorHandling } from '@/lib/middleware/errorMiddleware';
import { createSuccessResponse, ApiErrorHandler } from '@/lib/apiUtils';
import { integrationStatusSchema } from '@/lib/schemas';

async function getGitHubIntegrationStatus(_request: NextRequest) {
  const userSession = await auth.api.getSession({
    headers: await headers(),
  });

  if (!userSession) {
    throw new ApiErrorHandler('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
  }

  const gitHubIntegrationRepository = new GitHubIntegrationRepository();
  const latestIntegration = await gitHubIntegrationRepository.findLatestByProvider('github');

  if (!latestIntegration) {
    const disconnectedStatus = integrationStatusSchema.parse({ connected: false });
    return createSuccessResponse(disconnectedStatus);
  }

  const integrationMetadata = latestIntegration.metadata as Record<string, unknown>;
  const account = integrationMetadata.account as { login?: string } | undefined;
  const repositories = integrationMetadata.repositories as unknown[] | undefined;

  const connectedStatus = integrationStatusSchema.parse({
    connected: true,
    installation_id: latestIntegration.id,
    organization: account?.login || 'Unknown Organization',
    repository_count: repositories?.length || 0,
    last_updated: latestIntegration.updated_at.toISOString(),
  });

  return createSuccessResponse(connectedStatus);
}

export const GET = withErrorHandling(getGitHubIntegrationStatus);