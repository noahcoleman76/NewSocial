import { z } from 'zod';

if (process.env.NODE_ENV !== 'production') {
  const [{ default: dotenv }, { default: path }] = await Promise.all([
    import('dotenv'),
    import('node:path'),
  ]);

  dotenv.config({
    path: path.resolve(process.cwd(), '../.env'),
  });

  dotenv.config({
    path: path.resolve(process.cwd(), '.env'),
  });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  CLIENT_ORIGINS: z.string().default(''),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  COOKIE_DOMAIN: z.string().default(''),
  UPLOAD_DIR: z.string().default('server/uploads'),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  CLIENT_URL: parsedEnv.CLIENT_URL.replace(/\/+$/, ''),
  CLIENT_ORIGINS: parsedEnv.CLIENT_ORIGINS
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),
};
