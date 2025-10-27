import { z } from 'zod';

const DEFAULT_ALLOWED = [
  'http://localhost:3000',
  'https://localhost:3000',
  'https://*.vercel.app'
];

const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE: z.string().min(1),
  JWT_SECRET: z.string().min(12),
  EBAY_CLIENT_ID: z.string().optional(),
  EBAY_CLIENT_SECRET: z.string().optional(),
  EBAY_REDIRECT_URI: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional()
});

export type RawEnv = Record<string, string | undefined>;
export type ValidatedEnv = z.infer<typeof EnvSchema> & {
  allowedOrigins: string[];
};

function normalizeList(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function createEnvConfig(env: RawEnv): ValidatedEnv {
  const parsed = EnvSchema.parse(env);
  const allowed = dedupe([...DEFAULT_ALLOWED, ...normalizeList(parsed.ALLOWED_ORIGINS)]);
  return {
    ...parsed,
    allowedOrigins: allowed
  };
}
