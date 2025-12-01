import { z } from 'zod';

/**
 * Environment variable validation schema
 * Ensures all required environment variables are present and valid at startup
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),

  // Public environment variables
  NEXT_PUBLIC_LOCALE: z.enum(['en', 'sl'], {
    message: 'NEXT_PUBLIC_LOCALE must be either "en" or "sl"',
  }),
  NEXT_PUBLIC_APP_NAME: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
});

/**
 * Validated environment variables
 * Throws an error if validation fails
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      console.error('❌ Environment variable validation failed:');
      issues.forEach((issue) => console.error(`  - ${issue}`));
      throw new Error('Invalid environment variables. Check the errors above.');
    }
    throw error;
  }
}

export const env = validateEnv();
