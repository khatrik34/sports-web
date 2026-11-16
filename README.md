# The Boundary

A cricket-first sports media frontend built with Next.js App Router, React, strict TypeScript and Tailwind CSS. The editorial and match data is fictional demonstration content: scores are **not live**, videos do not stream, and newsletter submissions are not stored. Generated original imagery is included locally. No backend, database or authentication is included.

## Run locally

```sh
npm install
cp .env.example .env.local
npm run dev
```

Visit http://localhost:3000. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` for verification. Node 20.9+ is required.

Set `NEXT_PUBLIC_SITE_URL` to the production origin for canonical URLs, structured data, robots and sitemap. `NEXT_PUBLIC_API_BASE_URL` is reserved for the future public API origin; the app currently uses mock services regardless of its value. Never put secrets in public environment variables.

## Architecture

- `app/` — App Router pages, metadata, SEO routes, and error/loading boundaries. The catch-all route implements the content-driven section and detail routes.
- `components/` — shared server-rendered presentation and small interactive client islands.
- `types/` — domain models and future response/error contracts.
- `mocks/` — centralized sample content.
- `services/` — asynchronous typed service interfaces and mock implementations. Pages consume services, not mock arrays.
- `lib/`, `config/` — formatting, shared helpers and environment configuration.
- `tests/` — service and utility tests.

## Connecting a Java API

Implement the `ContentService<T>` interface for each domain using `fetch` against `NEXT_PUBLIC_API_BASE_URL`, validate responses with Zod, map DTOs into the existing domain types, and replace the exports in `services/index.ts`. Keep credentials and authorization decisions on the backend; do not store tokens or secrets in this frontend. Extend `PaginatedResponse` and query parameters as the backend contract is finalized. Choose caching and revalidation according to the endpoint: live scores must not be cached like editorial content. Use `lib/api.ts` for centralized error mapping and Zod response validation. For client-refetched features, wrap only that feature in `features/query-provider.tsx` and use `hooks/use-service-query.ts`; add endpoint-specific loading states and cancellation when integrating. The current asynchronous contract allows pages to remain independent of the mock storage.

Metadata, canonical URLs, robots, sitemap and JSON-LD are generated from content. Before deployment, configure a real domain and publisher identity, replace illustrative content, implement an actual subscription service, review structured data and review the Google News sitemap using real eligible publication dates. Google News inclusion or ranking is not guaranteed. Lighthouse targets depend on deployment and real data; no score is guaranteed.

## Backend and admin integration planning

The existing frontend has not yet been connected to a backend. See [the frontend integration audit](docs/frontend-integration-audit.md), [architecture proposal](docs/platform-architecture-proposal.md), and [development progress](docs/development-progress.md) for the inventory, risks, proposed boundaries, and verification status. No admin authentication, database, or Java service is implemented in this repository.
