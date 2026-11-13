import 'dotenv/config';
import { createApp } from './app.js';
import { closeBrowser } from './services/puppeteerScraper.js';
import { startScheduler } from './jobs/scheduler.js';

const PORT = process.env.PORT || 3001;
const app = createApp();

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
