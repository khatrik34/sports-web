# The Boundary — public website

The existing Next.js public site now reads anonymous content from the sports backend's versioned public API. Pages render on the server; the browser does not fetch API endpoints or receive API credentials. There is no mock-data fallback. The backend is a separate application, and no authentication or database is implemented here.

## Local setup (Windows PowerShell)

1. Start PostgreSQL and the Java backend using its own README; verify `Invoke-RestMethod "http://localhost:8080/api/v1/public/news?size=2"` on the machine where it runs.
2. In this repository:

```powershell
npm install
Copy-Item .env.example .env.local
# Edit .env.local: API_BASE_URL must be reachable from the Next.js server.
npm run dev
# Alternative port: npm run dev -- -p 3002
```

Open `http://localhost:3001` (the admin can continue using port 3000). Both `npm run dev` and `npm start` default to 3001; an explicit `PORT` environment variable or `-p` argument overrides it. If you already have `.env.local`, update `NEXT_PUBLIC_SITE_URL=http://localhost:3001` there as well. Set `NEXT_PUBLIC_SITE_URL` to the actual website origin and configure backend `APP_PUBLIC_SITE_BASE_URL` to match, including the port. `API_BASE_URL=http://localhost:8080/api/v1` works only when Next.js and the backend run on the same machine/network namespace. It is **server-side only**; when deployed or previewed elsewhere, `localhost` on the user's computer is not reachable by the Next.js server. Use a reachable private backend hostname, not browser-side localhost calls. The API must be available at request time; outages produce errors, not invented scores.

## Verification

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Unit/contract tests use simulated HTTP responses; they do not demonstrate live backend integration. To run the real-backend browser suite on the same machine, first run `npx playwright install chromium`, start both services, then run `npm run test:e2e`. Optional `E2E_SITE_URL` and `E2E_API_BASE_URL` override the default local addresses. The suite expects the backend demo dataset. A manual end-to-end and responsive/accessibility check remains necessary. See [integration status](docs/public-api-integration.md) for endpoints, caveats and checks. Only published content returned by the backend is used; the site does not duplicate access-control logic.

## Architecture

- `app/` uses server-rendered routes, dynamic metadata, JSON-LD and sitemaps. Existing public URL structure is retained.
- `services/` maps backend public DTOs into UI view models using Zod. Server-side fetches use `API_BASE_URL`, 60-second revalidation for editorial/list data, and `no-store` for match data. Public API failures are not silently replaced with sample data.
- `proxy.ts` resolves editor-managed redirects via the backend for document paths; it accepts only relative destinations. Image URLs are rendered from API data without an image proxy; remote hosts must be reachable from visitors' browsers.
- `lib/content.ts` sanitizes backend article HTML and Markdown before rendering. `types/` contains the site's view models; `tests/` contains isolated fixtures and adapter/component tests.

Set the real public origin before production. Provide CSP and other deployment security headers appropriate for that origin. Newsletter submission remains a non-persisted demo. No external live data feed is provided: match scores are entered by staff. Google News inclusion and Lighthouse scores are not guaranteed.
