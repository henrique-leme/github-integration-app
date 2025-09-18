import { sign } from 'jsonwebtoken';
import { envSchema } from '../schemas';

type GitHubJWTGenerator = () => string;

export function createGitHubJWTGenerator(): GitHubJWTGenerator {
  const environment = envSchema.parse(process.env);

  return function generateGitHubAppJWT(): string {
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    const jwtExpirationTimeInMinutes = 5;

    const jwtPayload = {
      iat: currentTimeInSeconds - 60,
      exp: currentTimeInSeconds + (jwtExpirationTimeInMinutes * 60),
      iss: parseInt(environment.GITHUB_APP_ID, 10),
    };

    const privateKeyFormatted = environment.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n');

    return sign(jwtPayload, privateKeyFormatted, {
      algorithm: 'RS256'
    });
  };
}