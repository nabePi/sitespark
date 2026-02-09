import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),
  
  // Server
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_URL: z.string().default('http://localhost:3001'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // AI - Kimi
  KIMI_API_KEY: z.string().optional(),
  KIMI_API_URL: z.string().default('https://api.kimi.com/coding/'),
  KIMI_MODEL: z.string().default('kimi-k2'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  
  // Token Economy
  TOKENS_SIGNUP_BONUS: z.string().default('100').transform(Number),
  TOKENS_DAILY_LOGIN: z.string().default('10').transform(Number),
  TOKENS_WEBSITE_GENERATION: z.string().default('50').transform(Number),
  TOKENS_CONTENT_GENERATION: z.string().default('10').transform(Number),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:');
  parsedEnv.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsedEnv.data;

export type Env = z.infer<typeof envSchema>;