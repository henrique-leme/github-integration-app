import { githubTokenResponseSchema, githubInstallationSchema, GitHubInstallation, GitHubTokenResponse } from '../schemas';
import { createGitHubJWTGenerator } from './githubJwtGenerator';
import { createGitHubAPIClient } from './githubApiClient';

type GitHubIntegrationService = {
  getInstallationAccessToken(installationId: string): Promise<GitHubTokenResponse>;
  getInstallationDetails(installationId: string): Promise<GitHubInstallation>;
  revokeInstallationAccessToken(accessToken: string): Promise<boolean>;
};

export function createGitHubIntegrationService(): GitHubIntegrationService {
  const generateGitHubAppJWT = createGitHubJWTGenerator();
  const gitHubApiClient = createGitHubAPIClient();

  return {
    async getInstallationAccessToken(installationId: string): Promise<GitHubTokenResponse> {
      const jwtToken = generateGitHubAppJWT();
      const apiResponse = await gitHubApiClient.postToGitHubAPI(
        `/app/installations/${installationId}/access_tokens`,
        undefined,
        jwtToken
      );

      return githubTokenResponseSchema.parse(apiResponse);
    },

    async getInstallationDetails(installationId: string): Promise<GitHubInstallation> {
      const jwtToken = generateGitHubAppJWT();
      const apiResponse = await gitHubApiClient.getFromGitHubAPI(
        `/app/installations/${installationId}`,
        jwtToken
      );

      return githubInstallationSchema.parse(apiResponse);
    },

    async revokeInstallationAccessToken(accessToken: string): Promise<boolean> {
      const tokenWithPrefix = `token ${accessToken}`;
      return gitHubApiClient.deleteFromGitHubAPI('/installation/token', tokenWithPrefix);
    }
  };
}