# Dynamic Price Tracker

Academic project: track product prices on **Amazon** and **Flipkart**, store time-series data in PostgreSQL, and analyze **cross-platform price fluctuations** (RQ1).

**Research question (RQ1):** *How do price fluctuations for selected products vary across different Indian e-commerce platforms over time?*

## Features

- **Accounts**: public home page, sign up / log in (JWT), and a profile page. Every user has their own private products, groups, alerts and dashboard
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

Also set `JWT_SECRET` in `.env` to a long random string (see [Accounts](#accounts-and-per-user-data)), then:

```bash
npm install
npm run migrate
npm run dev
```

### 2. Frontend (second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, click **Create free account**, and register. The home page is public; the dashboard, compare, alerts and profile pages require login.

### 3. Demo data

Demo data is created for a specific account, so register first, then run:

```bash
npm run seed:rq1 -- you@example.com   # 3 groups × Amazon + Flipkart + price history (for Compare page)
npm run seed:demo                     # fills any product still missing history (idempotent)
```

`seed:demo` inserts 15–30 sample price points per product over the last 14 days (skips products that already have enough history). Safe to re-run.

**Full checklist:** [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)

**Real Amazon/Flipkart URLs:** [docs/REAL_PRODUCTS.md](docs/REAL_PRODUCTS.md)

### 4. Cross-platform compare

1. Add the **same group name** for Amazon and Flipkart listings (e.g. group `boAt Headphones`).
2. Open **Compare (RQ1)** in the nav bar.
3. Select the group → multi-line chart + statistics table.

## Accounts and per-user data

- Sign up and log in at `/register` and `/login`. Passwords are hashed with bcrypt; sessions are signed JWTs (default 7 days, set `JWT_EXPIRES_IN` to change) that the frontend sends as `Authorization: Bearer <token>`.
- Each user only ever sees their own products, groups, price history, dashboard stats and alerts. Another user's product or group returns `404`.
- **Profile** page: change name, email and password, and see account stats.
- If you already had products from before accounts existed, the **first account you register claims them**.
- Set `JWT_SECRET` (required in production). Generate one with:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- Run `npm run migrate` after pulling this change (adds the `users` table and `user_id` columns).
- Pages: `/` home (public), `/login`, `/register`, `/dashboard`, `/compare`, `/alerts`, `/profile`.

## API endpoints

Everything except `/health`, `POST /auth/register` and `POST /auth/login` requires a login token.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account `{ name, email, password }` |
| POST | `/auth/login` | Log in `{ email, password }` → `{ user, token }` |
| GET | `/auth/me` | Current user + stats |
| PATCH | `/auth/me` | Update `{ name, email }` |
| PUT | `/auth/password` | Change `{ currentPassword, newPassword }` |

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

## Supported product links

Only `https://` links on these stores are accepted: **Amazon** (`amazon.in`, `amazon.com`, short links `amzn.in` / `amzn.to` / `a.co`) and **Flipkart** (`flipkart.com`, short links `dl.flipkart.com` / `fkrt.it`). The link must be a product page (Amazon `/dp/XXXXXXXXXX`, Flipkart `/p/itm…`), not a search or category page.

Links are cleaned (tracking parameters removed) and the same product cannot be tracked twice by one user. Anything else (other websites, `http://`, `localhost`, private/internal addresses, `file://`) is refused. This is the SSRF protection: the server re-checks the address on every redirect and on every connection.

## Scraper (cheerio + Puppeteer)

- First attempt: fast HTML parse (`priceExtractor.js`).
- On failure: **Puppeteer** headless Chrome if `SCRAPE_PUPPETEER_FALLBACK=true` (default in `.env.example`).
- Always Puppeteer: `SCRAPE_USE_PUPPETEER=true` (slower).
- After changing `.env`, restart the backend.
- Failed scrapes store `last_scrape_error` on the product row.
- The scraper reads the **selling price** (what you pay), never the struck-through MRP, and prefers failing with a clear error over guessing. Store pages change often, so **verify on your machine** (needs internet):
  ```bash
  cd backend
  npm run scrape:check -- "https://www.amazon.in/dp/XXXXXXXXXX"
  ```
  It prints the price and image it read. Compare the price with your browser. If it is wrong or missing, send me the output.
- "Refresh all" and the cron job pause `SCRAPE_DELAY_MS` between products, and only one refresh can run at a time.
- For viva: **`npm run seed:demo`** as backup; mention ethical/ToS limits in your report.

## Database migrations

`npm run migrate` applies each migration once and records it in `schema_migrations`, so it is safe to run again at any time. Migrations only add to the schema and keep your data. If your database already contained the same product more than once for one user, migration 006 leaves those extra rows untouched and lists them in the console so you can delete them in the app.

## Testing

```bash
cd backend
npm test
```

Runs the unit tests (URL safety / SSRF, price parsing against sample HTML). The API integration tests (login, per-user isolation, duplicates, password change, migrations) need a **separate, disposable** database because they wipe its tables:

```bash
# one time, in psql or pgAdmin:  CREATE DATABASE price_tracker_test;
# Windows (cmd):
set TEST_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/price_tracker_test
npm test
```

Without `TEST_DATABASE_URL` those tests are skipped. They refuse to run unless the database name contains `test`. The price-parsing tests use hand-written sample pages, so they prove the logic but not that Amazon/Flipkart still use the same markup (use `npm run scrape:check` for that).

## Deployment

See [docs/DEPLOY.md](docs/DEPLOY.md) for Neon + Railway + Vercel.

Production frontend: set `VITE_API_URL` to your API URL (see `frontend/.env.example`).

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 3001 | API port |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | — (required in production) | Signs login tokens |
| `JWT_EXPIRES_IN` | `7d` | Login lifetime |
| `CORS_ORIGINS` | any (dev) | Production: your frontend URL(s), comma separated |
| `SCRAPE_DELAY_MS` | `1500` | Pause between products when refreshing many |
| `SCRAPE_TIMEOUT_MS` | `90000` | Give up on one product after this long |
| `TEST_DATABASE_URL` | — | Disposable DB for `npm test` (name must contain `test`) |
| `SCRAPE_CRON` | `0 */6 * * *` | Cron schedule |
| `SCRAPE_USER_AGENT` | browser UA | HTTP header for scraper |
| `VITE_API_URL` | `/api` (dev proxy) | Frontend API base URL |

## Screenshots (add for report)

1. Home page, Login and Register
1. Dashboard — product list with latest prices  
2. Product detail — price chart  
3. Compare (RQ1) — dual-platform chart + stats table  

## Viva demo script (~2 min)

1. Show product list → **Refresh all prices** (or explain seed data).  
2. Open **Compare (RQ1)** → explain Amazon vs Flipkart stats.  
3. Mention scheduler + PostgreSQL schema.  
4. State scraping limitations and ethical considerations.
