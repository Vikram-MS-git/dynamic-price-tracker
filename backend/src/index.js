import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { requireAuth } from './middleware/auth.js';
import { closeBrowser } from './services/puppeteerScraper.js';
import { startScheduler } from './jobs/scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Behind Railway/Vercel proxies: needed for correct client IPs (rate limiting).
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);

// Everything below belongs to a user and requires a valid login token.
app.use('/products', requireAuth, productRoutes);
app.use('/groups', requireAuth, groupRoutes);
app.use('/analytics', requireAuth, analyticsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
});

const server = app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  const puppeteerMode = process.env.SCRAPE_USE_PUPPETEER === 'true' ? 'always' : 'fallback';
  console.log(`[scraper] Puppeteer mode: ${puppeteerMode}`);
  startScheduler();
});

async function shutdown() {
  await closeBrowser();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
