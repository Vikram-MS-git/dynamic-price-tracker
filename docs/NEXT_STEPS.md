# Next steps (after code is complete)

## A. Local demo (15 minutes)

### 1. Start servers

**Terminal 1 — backend**

```powershell
cd C:\Users\kaush\dynamic-price-tracker\backend
npm run dev
```

**Terminal 2 — frontend**

```powershell
cd C:\Users\kaush\dynamic-price-tracker\frontend
npm run dev
```

### 2. Load RQ1 demo data (3 groups × 2 platforms)

```powershell
cd C:\Users\kaush\dynamic-price-tracker\backend
npm run migrate
npm run seed:rq1
```

Also refresh existing products:

```powershell
npm run seed:demo
```

### 3. Verify in browser

| URL | What to check |
|-----|----------------|
| http://localhost:5173 | Product list with prices |
| http://localhost:5173/compare | 3 groups, **two lines** per chart, stats table |
| http://localhost:3001/health | `{"status":"ok"}` |

### 4. Optional — real product URLs

Replace demo URLs by adding real Amazon/Flipkart links with the **same Group name** in the form. Then **Refresh all prices** (live scrape may fail — seed data is fine for viva).

---

## B. Cloud deploy (viva URL)

Follow [DEPLOY.md](./DEPLOY.md) in order:

1. **Neon** — create DB, copy `DATABASE_URL`
2. **Railway** — deploy `backend/`, set env vars, run migrate + `npm run seed:rq1` + `npm run seed:demo` against Neon
3. **Vercel** — deploy `frontend/`, set `VITE_API_URL` to Railway URL

Smoke test: open Vercel URL → Compare page → pick "Wireless Earbuds".

---

## C. Report & viva (your work)

1. Screenshot: home, product chart, compare page
2. Copy SQL from [SAMPLE_QUERIES.sql](./SAMPLE_QUERIES.sql) into DBMS chapter
3. Explain RQ1 using compare stats (std dev, % change per platform)
4. Limitations: scraping blocks, demo seed vs live data, ethics/ToS

---

## D. Demo script (2–3 min)

1. Show deployed or local URL — list of tracked products  
2. **Compare (RQ1)** → Wireless Earbuds → Amazon vs Flipkart chart + table  
3. One product detail chart — price over time  
4. Mention PostgreSQL tables + 6-hour scheduler + manual refresh  
5. Honest limitations slide
