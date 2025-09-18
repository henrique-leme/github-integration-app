import { NextRequest, NextResponse } from 'next/server';
import { createGitHubIntegrationService } from '@/lib/services/githubIntegrationService';
import { GitHubIntegrationRepository } from '@/lib/repositories/integrationRepository';
import { encrypt } from '@/lib/encryption';
import { githubCallbackRequestSchema, envSchema } from '@/lib/schemas';
import { withErrorHandling } from '@/lib/middleware/errorMiddleware';
import { validateSearchParams } from '@/lib/apiUtils';

async function handleGitHubAppInstallationCallback(request: NextRequest) {
  const environment = envSchema.parse(process.env);
  const urlSearchParams = request.nextUrl.searchParams;
  const callbackParameters = validateSearchParams(urlSearchParams, githubCallbackRequestSchema);

  if (callbackParameters.setup_action !== 'install') {
    const cancelledUrl = new URL('/integrations?error=setup_cancelled', environment.BETTER_AUTH_URL);
    return NextResponse.redirect(cancelledUrl);
  }

  const gitHubIntegrationService = createGitHubIntegrationService();
  const gitHubIntegrationRepository = new GitHubIntegrationRepository();

  const installationDetails = await gitHubIntegrationService.getInstallationDetails(
    callbackParameters.installation_id
  );
  const accessTokenResponse = await gitHubIntegrationService.getInstallationAccessToken(
    callbackParameters.installation_id
  );

  const encryptedAccessToken = encrypt(accessTokenResponse.token);
  const encryptedRefreshToken = accessTokenResponse.refresh_token
    ? encrypt(accessTokenResponse.refresh_token)
    : undefined;

  const newIntegrationData = {
    id: callbackParameters.installation_id,
    organization_id: callbackParameters.state || 'default',
    provider: 'github' as const,
    access_token: encryptedAccessToken,
    refresh_token: encryptedRefreshToken,
    metadata: {
      account: installationDetails.account,
      permissions: installationDetails.permissions,
      events: installationDetails.events,
      repository_selection: installationDetails.repository_selection,
    },
  };

  try {
    await gitHubIntegrationRepository.create(newIntegrationData);
  } catch (error) {
    await gitHubIntegrationRepository.update(callbackParameters.installation_id, {
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      metadata: newIntegrationData.metadata,
    });
  }

  const successUrl = new URL('/integrations?success=github_connected', environment.BETTER_AUTH_URL);
  return NextResponse.redirect(successUrl);
}

export const GET = withErrorHandling(handleGitHubAppInstallationCallback);