# Deployment guide (viva demo)

Stack: **Neon** (PostgreSQL) + **Railway** or **Render** (API) + **Vercel** (frontend).

## 1. PostgreSQL (Neon)

1. Create account at https://neon.tech
2. New project → copy **connection string** (`postgresql://...`)
3. Use as `DATABASE_URL` for the backend

## 2. Backend (Railway)

1. Push repo to GitHub
2. https://railway.app → New Project → Deploy from GitHub
3. Set **root directory** to `backend`
4. Environment variables:

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | Neon connection string |
| `PORT` | `3001` (Railway sets `PORT` automatically — use `${{PORT}}` or leave unset) |
| `SCRAPE_CRON` | `0 */6 * * *` |
| `SCRAPE_USER_AGENT` | Browser user-agent string |

5. **Build command:** `npm install`
6. **Start command:** `npm start`
7. After deploy, open Railway shell or run locally against Neon:

```bash
cd backend
DATABASE_URL="your-neon-url" npm run migrate
DATABASE_URL="your-neon-url" npm run seed:demo
```

8. Copy public API URL (e.g. `https://your-app.up.railway.app`)

## 3. Frontend (Vercel)

1. https://vercel.com → Import GitHub repo
2. **Root directory:** `frontend`
3. Environment variable:

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | `https://your-app.up.railway.app` (no trailing slash) |

4. Build: `npm run build` · Output: `dist`
5. Deploy → open Vercel URL

## 4. Smoke test

- `GET https://your-api/health` → `{ "status": "ok" }`
- Open Vercel URL → Products list loads
- **Refresh all prices** (may fail on Amazon — use `seed:demo` on Neon)
- **Compare (RQ1)** → select group → chart + stats table

## 5. CORS

Backend enables CORS for all origins. For production you may restrict to your Vercel domain in `backend/src/index.js`.

## Alternative: Render

- Web Service, root `backend`, build `npm install`, start `npm start`
- Add PostgreSQL addon or use Neon `DATABASE_URL`
