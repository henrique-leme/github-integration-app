import { ApiErrorHandler } from '../apiUtils';

type GitHubAPIClient = {
  getFromGitHubAPI(urlPath: string, authorizationToken?: string): Promise<unknown>;
  postToGitHubAPI(urlPath: string, requestBody?: unknown, authorizationToken?: string): Promise<unknown>;
  deleteFromGitHubAPI(urlPath: string, authorizationToken?: string): Promise<boolean>;
};

export function createGitHubAPIClient(): GitHubAPIClient {
  const gitHubApiBaseUrl = 'https://api.github.com';
  const userAgentHeader = 'StarSling GitHub App';

  function createRequestHeaders(authorizationToken?: string): Record<string, string> {
    const baseHeaders: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': userAgentHeader,
    };

    if (authorizationToken) {
      const formattedToken = authorizationToken.startsWith('Bearer ')
        ? authorizationToken
        : `Bearer ${authorizationToken}`;
      baseHeaders.Authorization = formattedToken;
    }

    return baseHeaders;
  }

  async function makeHttpRequest(
    method: 'GET' | 'POST' | 'DELETE',
    urlPath: string,
    requestBody?: unknown,
    authorizationToken?: string
  ): Promise<Response> {
    const requestHeaders = createRequestHeaders(authorizationToken);

    if (requestBody && method === 'POST') {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    };

    return fetch(`${gitHubApiBaseUrl}${urlPath}`, requestOptions);
  }

  return {
    async getFromGitHubAPI(urlPath: string, authorizationToken?: string): Promise<unknown> {
      const response = await makeHttpRequest('GET', urlPath, undefined, authorizationToken);

      if (!response.ok) {
        throw new ApiErrorHandler(
          `GitHub API GET request failed: ${response.statusText}`,
          response.status,
          'GITHUB_API_GET_ERROR'
        );
      }

      return response.json();
    },

    async postToGitHubAPI(
      urlPath: string,
      requestBody?: unknown,
      authorizationToken?: string
    ): Promise<unknown> {
      const response = await makeHttpRequest('POST', urlPath, requestBody, authorizationToken);

      if (!response.ok) {
        throw new ApiErrorHandler(
          `GitHub API POST request failed: ${response.statusText}`,
          response.status,
          'GITHUB_API_POST_ERROR'
        );
      }

      return response.json();
    },

    async deleteFromGitHubAPI(urlPath: string, authorizationToken?: string): Promise<boolean> {
      const response = await makeHttpRequest('DELETE', urlPath, undefined, authorizationToken);
      return response.ok;
    }
  };
}