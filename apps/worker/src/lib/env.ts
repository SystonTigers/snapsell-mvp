import { z } from 'zod';

const commaSeparatedOrigins = z
  .string()
  .trim()
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )
  .refine((list) => list.length > 0, {
    message: 'Provide at least one allowed origin or remove the variable.',
  });

export const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE: z.string().min(20),
  JWT_SECRET: z.string().min(16),
  EBAY_CLIENT_ID: z.string().optional(),
  EBAY_CLIENT_SECRET: z.string().optional(),
  EBAY_REDIRECT_URI: z.string().url().optional(),
  CORS_ALLOWED_ORIGINS: commaSeparatedOrigins.optional(),
});

export type EnvChecked = z.infer<typeof EnvSchema>;

export const checkEnv = (env: unknown): EnvChecked => EnvSchema.parse(env);
