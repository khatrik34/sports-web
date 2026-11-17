# Existing public frontend: integration audit

Status: **historical inventory and design proposal** for the frontend at the audited commit. For the subsequent integration work and its current limitations, see `public-api-integration.md`. Audited against `43ab649` on 2026-11-13. The public UI is unchanged by this audit. At audit time the named admin and backend repositories were inaccessible; they were later made public and the backend contract was reviewed for the subsequent website integration. Do not treat proposed contracts below as existing APIs.

## Baseline architecture

- Next.js App Router: `app/page.tsx` is the home page; `app/[...slug]/page.tsx` routes most sections and detail pages, produces metadata and renders server-side. The catch-all currently requests *all six* domain lists for every path before dispatching. The homepage and main sitemap are statically generated at build; the catch-all and news sitemap are dynamic.
- `types/index.ts` describes UI projections, not a normalized database model. `services/index.ts` exports async mock services but imports `mocks/data.ts` unconditionally. `lib/api.ts` is an unused generic Zod/fetch helper. `NEXT_PUBLIC_API_BASE_URL` currently does **not** change the data source.
- `components/cards.tsx` and `components/score-strip.tsx` consume domain projections; header and newsletter are client islands. `hooks/use-service-query.ts` and `features/query-provider.tsx` are opt-in scaffolding and are not wired into the public data flow.
- Metadata, canonical links and JSON-LD are in `app/layout.tsx` and the catch-all; XML sitemaps are in `app/sitemap.ts` and `app/news-sitemap.xml/route.ts`. Search is noindex. `NEXT_PUBLIC_SITE_URL` defaults to `https://boundary.example` and must be set to the real origin.
- `app/error.tsx` is a generic error boundary. There is no current route-level loading skeleton. Existing tests cover mock search/services, date formatting, and one score-strip interaction; there are no API, SEO integration, end-to-end, mobile browser, accessibility, or security tests.

## Mock data inventory and proposed replacement

No fixtures below are suitable for automatic import as factual production data. They are fictional, and external images in `public/images/` are locally generated demo assets. Author identities and dates are likewise illustrative. A production dataset must be independently supplied and verified.

| Existing source | Current shape/use | Candidate backend entities | Proposed public read → existing consumers |
| --- | --- | --- | --- |
| `mocks/data.ts` `teams` | six `Team` objects; short code, flag emoji, free-text description | `sports`, `countries`, `teams`, `media_assets` | `GET /public/teams`, `/teams/{slug}` → team cards, team profiles, match teams, sitemap |
| `players` | three players; country is a display string, no squad relationship | `players`, `countries`, `team_players`, optional player statistics | `GET /public/players/{slug}`, team squad → profiles/search; retain slug-based links |
| `tournaments` | three rows; `dates` is a display string, `teams` is slug array | `tournaments`, `tournament_seasons`, `tournament_teams` | `GET /public/tournaments`, `/tournaments/{slug}` → homepage, series, sitemap |
| `matches` | four matches; nested teams; display scores and note are preformatted strings | `matches`, `fixtures`, `match_innings`, score/participant tables, `tournament_seasons` | `GET /public/matches?status=…`, `/matches/{slug}` → score strip/cards, fixture and match pages |
| `scorecard` | one array not keyed by match or innings | `match_batting_scorecards`, `match_bowling_scorecards`, `match_innings`, `players` | `GET /public/matches/{slug}/scorecard` → match tabs; never return the same rows for unrelated matches |
| `commentary` | one array, free-form `over` text | `match_commentaries`, optionally ball events | `GET /public/matches/{slug}/commentary` → commentary tab; stable chronological pagination |
| `points` | one global array; `nrr` actually contains percentage values, not net run rate | `points_tables` keyed by season and team | `GET /public/tournaments/{slug}/points-table` → series page; rankings need a separate credible source, not this table |
| `articles` | eight articles; embedded paragraphs, text author/category, no publication workflow | `news_articles`, `news_authors`, `news_categories`, `news_tags`, `news_article_tags`, `news_article_revisions`, `media_assets`, SEO fields | `GET /public/news`, `/news/{slug}` → home/news/detail, metadata, news sitemap; public queries must enforce publication policy |
| `videos` | three records; thumbnail and duration strings, no source or status | `videos`, `video_categories`, `video_tags`, `video_media`, `media_assets` | `GET /public/videos`, `/videos/{slug}` → media cards/detail/metadata |
| `searchAll` in `services/index.ts` | fetches all five lists then filters titles in memory; no paging | indexed, published-only search projections from the above tables | `GET /public/search?q=…&page=…&size=…` → `/search`; types/links must be allowlisted |
| Home, nav, footer and `site` config | fixed arrays, branding, ordering and copy spread across components | `site_settings`, `navigation_menus`, `navigation_items`, `homepage_sections`, `homepage_section_items`, `seo_settings` | `GET /public/homepage` and narrowly scoped public settings/navigation → retain existing layout and styling |
| `public/images/*` | local demo imagery | `media_assets`, `media_folders`; bytes in configurable storage, never PostgreSQL | verified public URL + alt text → `next/image` allowlist/proxy with size limits |

`/api/v1` is omitted in the public column for readability. Exact DTOs must be agreed with the actual backend, versioned, and validated with Zod. Public endpoints expose DTOs, never persistence entities.

## Hardcoded values outside the mock module

1. `app/page.tsx`: indexes `articles[0]` and `articles[4]` without guards; assumes a minimum of five articles, selects content by array order, fixes hero/editorial image, date and section layout, and selects matches/videos/tournaments by slices. Empty or smaller API responses will crash or render the wrong hero. Convert to a validated homepage projection with optional sections and graceful empty states.
2. `app/[...slug]/page.tsx`: fixture/team/tournament/category filters are performed in memory; `/news/latest`, `/news/trending` and `/news/featured` currently share the same data; tournament statistics are links rather than actual statistics. Match detail contains a hardcoded featured match slug, run rate, partnership, fall of wickets, playing XI and profile links. Points are global, not keyed to a season. Search suggestions are preloaded from all lists. Several UI descriptions label data illustrative. Team/player links sometimes derive slugs from names rather than IDs. Scorecard links special-case one player. Replace with data-bound per-entity endpoints and explicit nullable/empty states.
3. `components/header.tsx` fixes navigation, date and demo edition. `components/footer.tsx` fixes copy, year, links and demo notice. `config/site.ts` fixes publisher identity and placeholder domain. Move *editable* settings to a public settings projection; static legal/product labels need not become database records merely to eliminate constants.
4. `components/newsletter.tsx` only validates locally and explicitly does not save submissions. Do not silently claim signup or add storage without a separate consent/privacy and provider design.
5. `app/[...slug]/page.tsx` displays video placeholders and profile statistics notices. Provide real published video metadata/source policy and player statistics or retain honest empty states. No streaming backend exists.
6. `app/sitemap.ts` is built statically from demo lists, and `app/news-sitemap.xml/route.ts` only filters mock dates. Both need bounded, paginated, published-only backend sources and an explicit freshness strategy; an API outage must not silently generate an empty cached sitemap.
7. `/rankings` labels WTC-style mock points as illustrative, not ICC rankings. Do not call them official rankings without a licensed source and appropriate attribution.

## Existing URL and compatibility requirements

Keep `/`, `/cricket`, `/cricket/live-scores`, `/cricket/fixtures`, `/cricket/match/{slug}`, `/cricket/series[/{slug}]`, `/news[/{slug}]`, `/videos[/{slug}]`, `/teams[/{slug}]`, `/players/{slug}`, `/rankings`, `/search`, `/about`, `/contact`, sitemap, robots and manifest stable. Existing `?filter`, `?tab`, `?team`, `?tournament`, `?date` and `?q` query parameters need compatibility tests. Backend IDs should be immutable; public slugs are unique lookup keys with a documented redirect policy on rename.

Current `MatchStatus = live | upcoming | recent` is a lossy view: map `LIVE`, `INNINGS_BREAK`, `STUMPS` deliberately, and separately represent completed, abandoned, cancelled and postponed states. Do not mark cancelled fixtures as completed wins. `score1`/`score2` are presentation strings, not numerical source of truth. Overs must be represented as legal-ball counts (not decimals) and formatted as `overs.balls`; wickets, innings and extras must have their own typed data. Similarly WTC percentage is not NRR. Never derive squad membership by matching player country to team name.

## Migration sequence and acceptance gates

1. Obtain and inspect the actual backend/admin repositories, access model and schema; settle contract/versioning and operational environment. Record incompatibilities before changing the website.
2. Create server-side API adapters behind service interfaces; runtime-validate payloads; map DTOs to existing card projections. Mock mode must be explicit and prohibited in production, never an automatic fallback on API errors. Browser code must use same-origin routes/proxy, not `localhost`.
3. Remove direct demo values incrementally by vertical slice. Fix empty datasets, 404 vs upstream 5xx handling, per-match/per-season lookups and server-side pagination/filtering before activating APIs. Do not cache an outage as a 404.
4. Keep article metadata and JSON-LD server-rendered, escaped and derived from published responses. Preserve canonicals, slugs, noindex and sitemap freshness. Require real publisher configuration.
5. Add contract tests with empty, partial, malformed, 404 and failed API responses; UI regression tests for all existing URLs, query tabs and filters; SEO schema/sitemap assertions and mobile browser checks. Confirm updates appear after bounded revalidation and live score freshness is not sacrificed.
6. Switch production only when backend authorization, publishing isolation, content migration, rollback and operational monitoring are verified end to end. This branch does not perform that switch.
