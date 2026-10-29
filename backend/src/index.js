import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { closeBrowser } from './services/puppeteerScraper.js';
import { startScheduler } from './jobs/scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/products', productRoutes);
app.use('/groups', groupRoutes);
app.use('/analytics', analyticsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
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
