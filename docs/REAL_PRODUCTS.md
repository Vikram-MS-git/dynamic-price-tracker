# Tracking real Amazon & Flipkart products

## Step-by-step

### 1. Find the same item on both sites

Example: **boAt Rockerz 450** on Amazon.in and Flipkart.

### 2. Add twice with the same Group name

| Field | Amazon listing | Flipkart listing |
|-------|----------------|------------------|
| Name | boAt Rockerz 450 (Amazon) | boAt Rockerz 450 (Flipkart) |
| URL | Full product page URL from browser | Full product page URL |
| Platform | amazon | flipkart |
| **Group name** | `boAt Rockerz 450` | `boAt Rockerz 450` (must match) |
| Category | Electronics | Electronics |

### 3. Fetch prices

1. Click **Refresh all prices** on the home page, or refresh one product on its chart page.
2. If you see **Scrape failed**, Amazon/Flipkart blocked the bot (common).

### 4. Compare

Open **Compare (RQ1)** → select your group → two lines + stats table.

---

## If live scraping fails

| Option | When to use |
|--------|-------------|
| `npm run seed:demo` | Demo charts for viva (sample history) |
| Update selectors | [`scraperService.js`](../backend/src/services/scraperService.js) when HTML changes |
| Puppeteer (enabled) | Set `SCRAPE_PUPPETEER_FALLBACK=true` in `backend/.env` — auto-retries Flipkart/Amazon with headless Chrome |
| Manual SQL insert | One-off price row in pgAdmin for testing |

---

## Tips for better results

- Use **short, clean product URLs** (open product page, copy address bar).
- Do not use search/category URLs — use the **single product** page.
- Scrape **once**, wait, scrape again over days for real fluctuation data.
- Scheduler runs every **6 hours** automatically while backend is running.

---

## Delete demo data

Remove "Wireless Earbuds" etc. from the list if you only want your real products, then add real URLs with the same group name.
