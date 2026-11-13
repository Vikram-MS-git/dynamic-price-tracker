import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import productRoutes from './routes/productRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { requireAuth } from './middleware/auth.js';

/** Builds the Express app without starting a server (the tests use this too). */
export function createApp() {
  const app = express();

  // Behind Railway/Vercel proxies: needed for correct client IPs (rate limiting).
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());

  // CORS: set CORS_ORIGINS=https://your-frontend.vercel.app (comma separated) in production.
  // Login uses an Authorization header (not cookies), so an open default is not a CSRF risk,
  // but restricting it is still recommended.
  const origins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!origins.length && process.env.NODE_ENV === 'production') {
    console.warn('[security] CORS_ORIGINS is not set: any website may call this API. Set it to your frontend URL.');
  }
  app.use(cors(origins.length ? { origin: origins } : undefined));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/auth', authRoutes);

  // Everything below belongs to a user and requires a valid login token.
  app.use('/products', requireAuth, productRoutes);
  app.use('/groups', requireAuth, groupRoutes);
  app.use('/analytics', requireAuth, analyticsRoutes);

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    // Malformed JSON bodies etc. carry their own 4xx status.
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({
      error: status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  });

  return app;
}
