import { z } from 'zod';

/**
 * Get default allowed origins based on environment
 * In production, only allow specific domains
 * In development, allow localhost
 */
function getDefaultAllowedOrigins(env: string | undefined): string[] {
  if (env === 'production') {
    // In production, only allow specific domains
    // Replace these with your actual production domains
    return [
      'https://snapsell.app',
      'https://www.snapsell.app',
    ];
  }

  // Development/staging: allow localhost and preview deployments
  return [
    'http://localhost:3000',
    'https://localhost:3000',
    // For preview deployments, use CORS_ALLOWED_ORIGINS env var instead of wildcard
  ];
}

const RawEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE: z.string().min(20),
  JWT_SECRET: z.string().min(16),
  EBAY_CLIENT_ID: z.string().optional(),
  EBAY_CLIENT_SECRET: z.string().optional(),
  EBAY_REDIRECT_URI: z.string().url().optional(),
  EBAY_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  DRY_RUN: z.string().optional(),
  WEB_URL: z.string().url().optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
  SENTRY_DSN: z.string().url().optional(),
});

export type EnvChecked = z.infer<typeof RawEnvSchema> & {
  allowedOrigins: string[];
};

function normalizeOrigins(input?: string | null): string[] {
  if (!input) {
    return [];
  }
  return input
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

export const checkEnv = (env: unknown): EnvChecked => {
  const parsed = RawEnvSchema.parse(env);
  const defaults = getDefaultAllowedOrigins(parsed.ENVIRONMENT);
  const merged = dedupe([...defaults, ...normalizeOrigins(parsed.CORS_ALLOWED_ORIGINS)]);
  return {
    ...parsed,
    allowedOrigins: merged
  };
};
