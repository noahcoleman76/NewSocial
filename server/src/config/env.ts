import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

dotenv.config({
  path: path.resolve(process.cwd(), '../.env'),
});

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
  override: true,
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  UPLOAD_DIR: z.string().default('server/uploads'),
});

export const env = envSchema.parse(process.env);
