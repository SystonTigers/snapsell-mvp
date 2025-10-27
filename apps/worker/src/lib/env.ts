import { z } from 'zod';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  'https://*.vercel.app'
];

const RawEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE: z.string().min(20),
  JWT_SECRET: z.string().min(16),
  EBAY_CLIENT_ID: z.string().optional(),
  EBAY_CLIENT_SECRET: z.string().optional(),
  EBAY_REDIRECT_URI: z.string().url().optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional()
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
  const merged = dedupe([...DEFAULT_ALLOWED_ORIGINS, ...normalizeOrigins(parsed.CORS_ALLOWED_ORIGINS)]);
  return {
    ...parsed,
    allowedOrigins: merged
  };
};
