import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url(),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_APP_ID: z.string().min(1),
  GITHUB_APP_CLIENT_ID: z.string().min(1),
  GITHUB_APP_CLIENT_SECRET: z.string().min(1),
  GITHUB_APP_PRIVATE_KEY: z.string().min(1),
  GITHUB_WEBHOOK_SECRET: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(32),
  INNGEST_EVENT_KEY: z.string().min(1),
  INNGEST_SIGNING_KEY: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const githubAccountSchema = z.object({
  login: z.string(),
  id: z.number(),
  type: z.enum(['User', 'Organization']),
});

export const githubInstallationSchema = z.object({
  id: z.number(),
  account: githubAccountSchema,
  permissions: z.record(z.string(), z.string()),
  events: z.array(z.string()),
  repository_selection: z.enum(['all', 'selected']),
});

export const githubTokenResponseSchema = z.object({
  token: z.string(),
  expires_at: z.string(),
  permissions: z.record(z.string(), z.string()),
  refresh_token: z.string().optional(),
});

export const githubWebhookEventSchema = z.object({
  action: z.string(),
  installation: githubInstallationSchema,
  sender: githubAccountSchema,
  repositories_added: z.array(z.unknown()).optional(),
  repositories_removed: z.array(z.unknown()).optional(),
});

export const githubCallbackRequestSchema = z.object({
  installation_id: z.string(),
  setup_action: z.enum(['install', 'cancelled']),
  state: z.string().optional(),
});

export const integrationStatusSchema = z.object({
  connected: z.boolean(),
  installation_id: z.string().optional(),
  organization: z.string().optional(),
  repository_count: z.number().optional(),
  last_updated: z.string().optional(),
});

export type GitHubWebhookEvent = z.infer<typeof githubWebhookEventSchema>;
export type GitHubCallbackRequest = z.infer<typeof githubCallbackRequestSchema>;
export type GitHubTokenResponse = z.infer<typeof githubTokenResponseSchema>;
export type GitHubInstallation = z.infer<typeof githubInstallationSchema>;
export type IntegrationStatus = z.infer<typeof integrationStatusSchema>;