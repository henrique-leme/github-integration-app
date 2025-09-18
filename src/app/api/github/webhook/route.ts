import { NextRequest } from 'next/server';
import { inngest } from '@/lib/inngest';
import { envSchema, githubWebhookEventSchema } from '@/lib/schemas';
import { withErrorHandling } from '@/lib/middleware/errorMiddleware';
import { createSuccessResponse, ApiErrorHandler } from '@/lib/apiUtils';
import crypto from 'crypto';

const environment = envSchema.parse(process.env);

class WebhookSignatureVerifier {
  static verify(body: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', environment.GITHUB_WEBHOOK_SECRET)
      .update(body, 'utf8')
      .digest('hex');

    const expectedSha = `sha256=${expectedSignature}`;

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSha, 'utf8')
    );
  }
}

class GitHubWebhookHandler {
  static async handleInstallation(payload: unknown) {
    const validatedPayload = githubWebhookEventSchema.parse(payload);

    await inngest.send({
      name: 'github/installation',
      data: {
        action: validatedPayload.action,
        installation: validatedPayload.installation,
        sender: validatedPayload.sender,
      },
    });
  }

  static async handleInstallationRepositories(payload: unknown) {
    const validatedPayload = githubWebhookEventSchema.parse(payload);

    await inngest.send({
      name: 'github/installation_repositories',
      data: {
        action: validatedPayload.action,
        installation: validatedPayload.installation,
        repositories_added: validatedPayload.repositories_added,
        repositories_removed: validatedPayload.repositories_removed,
        sender: validatedPayload.sender,
      },
    });
  }

  static async processEvent(event: string, payload: unknown) {
    switch (event) {
      case 'installation':
        await this.handleInstallation(payload);
        break;
      case 'installation_repositories':
        await this.handleInstallationRepositories(payload);
        break;
      case 'issues':
        break;
      default:
        break;
    }
  }
}

async function handleWebhook(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-hub-signature-256');
  const event = request.headers.get('x-github-event');

  if (!signature) {
    throw new ApiErrorHandler('Missing signature', 400, 'MISSING_SIGNATURE');
  }

  if (!event) {
    throw new ApiErrorHandler('Missing event header', 400, 'MISSING_EVENT');
  }

  if (!WebhookSignatureVerifier.verify(body, signature)) {
    throw new ApiErrorHandler('Invalid signature', 401, 'INVALID_SIGNATURE');
  }

  const payload = JSON.parse(body);
  await GitHubWebhookHandler.processEvent(event, payload);

  return createSuccessResponse({ message: 'Webhook processed successfully' });
}

export const POST = withErrorHandling(handleWebhook);