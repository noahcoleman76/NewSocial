import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { env } from '@/config/env';
import { errorHandler } from '@/middleware/error-handler';
import { notFoundHandler } from '@/middleware/not-found';
import { resolveUploadDir } from '@/modules/uploads/upload-path';
import { registerRoutes } from '@/routes';

const allowedOrigins = () => new Set([env.CLIENT_URL, ...env.CLIENT_ORIGINS]);

const isAllowedVercelPreview = (origin: string) => {
  if (env.NODE_ENV !== 'production') {
    return false;
  }

  try {
    const { hostname } = new URL(origin);
    return hostname === 'new-social-client.vercel.app' || hostname.startsWith('new-social-client-');
  } catch {
    return false;
  }
};

const isAllowedOrigin = (origin: string) => {
  const normalizedOrigin = origin.replace(/\/+$/, '');

  if (allowedOrigins().has(normalizedOrigin)) {
    return true;
  }

  return isAllowedVercelPreview(normalizedOrigin);
};

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use('/uploads', express.static(resolveUploadDir()));

  registerRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
