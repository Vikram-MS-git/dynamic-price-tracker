# Dynamic Price Tracker

Academic project: track product prices on **Amazon** and **Flipkart**, store time-series data in PostgreSQL, and analyze **cross-platform price fluctuations** (RQ1).

**Research question (RQ1):** *How do price fluctuations for selected products vary across different Indian e-commerce platforms over time?*

## Features

- Add products with **product groups** (same item on Amazon + Flipkart)
- Scheduled scraping (node-cron) + **manual refresh**
- Per-product price charts and **cross-platform compare** page with stats (min, max, avg, std dev, % change)
- Demo seed data for viva when live scraping is blocked

## Project structure

```
dynamic-price-tracker/
├── backend/           # Express API, scraper, scheduler
├── frontend/          # React + Vite + Recharts
└── docs/
    ├── DEPLOY.md      # Neon + Railway + Vercel
    └── SAMPLE_QUERIES.sql
```

## Prerequisites

- Node.js 18+
- PostgreSQL (local or Neon)

## Quick start (local)

### 1. Database

```sql
CREATE DATABASE price_tracker;
```

```bash
cd backend
copy .env.example .env
```

Edit `DATABASE_URL` in `.env`, then:

```bash
npm install
npm run migrate
npm run seed:demo
npm run dev
```

### 2. Frontend (second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### 3. Demo data

```bash
npm run seed:rq1    # 3 groups × Amazon + Flipkart + price history (for Compare page)
npm run seed:demo   # fills any product still missing history (idempotent)
```

`seed:demo` inserts 15–30 sample price points per product over the last 14 days (skips products that already have enough history). Safe to re-run.

**Full checklist:** [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)

**Real Amazon/Flipkart URLs:** [docs/REAL_PRODUCTS.md](docs/REAL_PRODUCTS.md)

### 4. Cross-platform compare

1. Add the **same group name** for Amazon and Flipkart listings (e.g. group `boAt Headphones`).
2. Open **Compare (RQ1)** in the nav bar.
3. Select the group → multi-line chart + statistics table.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/products` | Add product `{ name, url, platform, category?, groupName? }` |
| GET | `/products` | List products (with `latest_price`, `last_scraped_at`) |
| GET | `/products/:id` | Single product |
| DELETE | `/products/:id` | Delete product + price history |
| GET | `/products/:id/prices?from=&to=` | Price history |
| POST | `/products/scrape-all` | Scrape all products now |
| POST | `/products/:id/scrape` | Scrape one product |
| GET | `/groups` | List groups with products |
| GET | `/groups/:id/compare?from=&to=` | Cross-platform series + stats |

## RQ1 methodology

1. **Group** equivalent listings (same `groupName` on Amazon and Flipkart).
2. **Collect** `price_history` over time (scheduler every 6h, manual refresh, or `seed:demo`).
3. **Compare** via `GET /groups/:id/compare` — per-platform min, max, average, standard deviation, and % change (first vs last point in range).
4. **Interpret** higher std dev / % change as greater fluctuation on that platform for the selected period.

Sample SQL for your report: [docs/SAMPLE_QUERIES.sql](docs/SAMPLE_QUERIES.sql)

## Scraper (cheerio + Puppeteer)

- First attempt: fast HTML parse (`priceExtractor.js`).
- On failure: **Puppeteer** headless Chrome if `SCRAPE_PUPPETEER_FALLBACK=true` (default in `.env.example`).
- Always Puppeteer: `SCRAPE_USE_PUPPETEER=true` (slower).
- After changing `.env`, restart the backend.
- Failed scrapes store `last_scrape_error` on the product row.
- For viva: **`npm run seed:demo`** as backup; mention ethical/ToS limits in your report.

## Deployment

See [docs/DEPLOY.md](docs/DEPLOY.md) for Neon + Railway + Vercel.

Production frontend: set `VITE_API_URL` to your API URL (see `frontend/.env.example`).

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 3001 | API port |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `SCRAPE_CRON` | `0 */6 * * *` | Cron schedule |
| `SCRAPE_USER_AGENT` | browser UA | HTTP header for scraper |
| `VITE_API_URL` | `/api` (dev proxy) | Frontend API base URL |

## Screenshots (add for report)

1. Home — product list with latest prices  
2. Product detail — price chart  
3. Compare (RQ1) — dual-platform chart + stats table  

## Viva demo script (~2 min)

1. Show product list → **Refresh all prices** (or explain seed data).  
2. Open **Compare (RQ1)** → explain Amazon vs Flipkart stats.  
3. Mention scheduler + PostgreSQL schema.  
4. State scraping limitations and ethical considerations.
