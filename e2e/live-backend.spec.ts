import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { z } from "zod";

// APIRequestContext runs in the Playwright test process, not in the browser.
// No app request should use the backend origin from the browser itself.
const apiBase = (
  process.env.E2E_API_BASE_URL || "http://localhost:8080/api/v1"
).replace(/\/$/, "");
const rows = <T extends z.ZodType>(item: T) =>
  z.object({ content: z.array(item), totalElements: z.number() });
const named = z.object({ slug: z.string(), name: z.string() });
const article = z.object({
  slug: z.string(),
  title: z.string(),
  path: z.string(),
  seo: z.object({ robots: z.string(), canonicalUrl: z.string() }).optional(),
});
const match = z.object({
  slug: z.string(),
  team1: z.object({ name: z.string() }),
  team2: z.object({ name: z.string() }),
  startTime: z.string(),
});
const video = z.object({
  slug: z.string(),
  title: z.string(),
  videoUrl: z.string(),
});
async function get<T>(
  request: APIRequestContext,
  path: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await request.get(`${apiBase}${path}`);
  expect(
    response.ok(),
    `Java API ${path} returned ${response.status()}`,
  ).toBeTruthy();
  return schema.parse(await response.json());
}
async function open(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), `${path} did not render`).toBe(200);
}

// Each page's browser traffic must stay away from the API. Server-side requests are not visible here.
test.beforeEach(async ({ page }) => {
  const backend = new URL(apiBase);
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.port === backend.port &&
      url.pathname.startsWith(new URL(apiBase).pathname + "/public/") &&
      (url.hostname === backend.hostname ||
        (["localhost", "127.0.0.1", "::1"].includes(url.hostname) &&
          ["localhost", "127.0.0.1", "::1"].includes(backend.hostname)))
    ) {
      throw new Error(
        `Browser requested the backend directly: ${url.origin}${url.pathname}`,
      );
    }
  });
});

test("database contains the requested published data", async ({ request }) => {
  const [news, teams, players, matches, videos, series, sections] =
    await Promise.all([
      get(request, "/public/news?size=100", rows(article)),
      get(request, "/public/teams?size=100", rows(named)),
      get(request, "/public/players?size=100", rows(named)),
      get(request, "/public/matches?size=100", rows(match)),
      get(request, "/public/videos?size=100", rows(video)),
      get(request, "/public/tournaments", z.array(named)),
      get(
        request,
        "/public/homepage",
        z.array(z.object({ key: z.string(), type: z.string() })),
      ),
    ]);
  expect(news.totalElements).toBeGreaterThanOrEqual(12);
  expect(teams.totalElements).toBeGreaterThanOrEqual(8);
  expect(players.totalElements).toBeGreaterThanOrEqual(24);
  expect(matches.totalElements).toBeGreaterThanOrEqual(8);
  expect(videos.totalElements).toBeGreaterThanOrEqual(6);
  expect(series.length).toBeGreaterThanOrEqual(2);
  expect(sections.length).toBeGreaterThanOrEqual(6);
});

test("homepage, news list, categories and article use API content and metadata", async ({
  page,
  request,
}) => {
  const [featured, news, categories] = await Promise.all([
    get(request, "/public/news/latest?limit=1&featured=true", z.array(article)),
    get(request, "/public/news?size=12", rows(article)),
    get(request, "/public/categories", z.array(z.object({ name: z.string() }))),
  ]);
  expect(featured.length).toBeGreaterThan(0);
  expect(news.content.length).toBeGreaterThan(0);
  expect(categories.length).toBeGreaterThan(0);
  await open(page, "/");
  await expect(
    page.getByRole("heading", { name: featured[0].title }).first(),
  ).toBeVisible();
  await open(page, "/news");
  await expect(page.getByText(news.content[0].title).first()).toBeVisible();
  await open(page, "/news/latest");
  await expect(page.getByText(news.content[0].title).first()).toBeVisible();
  await open(page, "/news/categories");
  await expect(
    page.getByText(categories[0].name, { exact: true }).first(),
  ).toBeVisible();
  const detail = await get(
    request,
    `/public/news/${encodeURIComponent(news.content[0].slug)}`,
    article,
  );
  await open(page, detail.path);
  await expect(
    page.getByRole("heading", { level: 1, name: detail.title }),
  ).toBeVisible();
  expect(await page.locator("link[rel=canonical]").getAttribute("href")).toBe(
    detail.seo?.canonicalUrl,
  );
});

test("fixtures, match centre, scorecard and commentary reflect the backend", async ({
  page,
  request,
}) => {
  const live = await get(
    request,
    "/public/matches?filter=live&size=100",
    rows(match),
  );
  expect(live.content.map((m) => m.slug)).toContain(
    "pakistan-vs-india-asia-cup-2026",
  );
  expect(live.content.map((m) => m.slug)).toContain(
    "new-zealand-vs-south-africa-tri-series-2026",
  );
  await open(page, "/cricket/live-scores");
  await expect(
    page.getByText(live.content[0].team1.name).first(),
  ).toBeVisible();
  await open(page, "/cricket/fixtures");
  const m = await get(
    request,
    "/public/matches/australia-vs-england-asia-cup-2026",
    match,
  );
  await open(page, `/cricket/match/${m.slug}`);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: `${m.team1.name} vs ${m.team2.name}`,
    }),
  ).toBeVisible();
  const innings = await get(
    request,
    `/public/matches/${m.slug}/scorecard`,
    z.array(z.object({ batting: z.array(z.object({ batter: z.string() })) })),
  );
  expect(innings.flatMap((i) => i.batting).length).toBeGreaterThan(0);
  await open(page, `/cricket/match/${m.slug}?tab=scorecard`);
  await expect(
    page.getByText(innings.flatMap((i) => i.batting)[0].batter).first(),
  ).toBeVisible();
  const comments = await get(
    request,
    `/public/matches/${m.slug}/commentary?size=20`,
    rows(z.object({ text: z.string() })),
  );
  expect(comments.content.length).toBeGreaterThan(0);
  await open(page, `/cricket/match/${m.slug}?tab=live-commentary`);
  await expect(page.getByText(comments.content[0].text).first()).toBeVisible();
  const day = m.startTime.slice(0, 10);
  const range = await get(
    request,
    `/public/matches?filter=all&from=${day}&to=${day}&size=20`,
    rows(match),
  );
  expect(range.content.some((x) => x.slug === m.slug)).toBe(true);
  await open(page, `/cricket/fixtures?filter=all&from=${day}&to=${day}`);
  await expect(page.getByText(m.team1.name).first()).toBeVisible();
});

test("series, teams, players, rankings, videos and search render API data", async ({
  page,
  request,
}) => {
  const [series, teams, players, rankings, videos, search] = await Promise.all([
    get(request, "/public/tournaments", z.array(named)),
    get(request, "/public/teams?size=100", rows(named)),
    get(request, "/public/players?size=100", rows(named)),
    get(request, "/public/rankings", z.object({ tournamentName: z.string() })),
    get(request, "/public/videos?size=100", rows(video)),
    get(
      request,
      "/public/search?q=pakistan&limit=5",
      z.object({ results: z.array(z.object({ title: z.string() })) }),
    ),
  ]);
  expect(
    series.length &&
      teams.content.length &&
      players.content.length &&
      videos.content.length &&
      search.results.length,
  ).toBeTruthy();
  await open(page, "/cricket/series");
  await expect(page.getByText(series[0].name).first()).toBeVisible();
  await open(page, `/cricket/series/${series[0].slug}?filter=points%20table`);
  await expect(
    page.getByRole("heading", { level: 1, name: new RegExp(series[0].name) }),
  ).toBeVisible();
  await open(page, "/teams");
  await expect(page.getByText(teams.content[0].name).first()).toBeVisible();
  await open(page, `/teams/${teams.content[0].slug}`);
  await expect(
    page.getByRole("heading", { level: 1, name: teams.content[0].name }),
  ).toBeVisible();
  await open(page, `/players/${players.content[0].slug}`);
  await expect(
    page.getByRole("heading", { level: 1, name: players.content[0].name }),
  ).toBeVisible();
  await open(page, "/rankings");
  await expect(
    page.getByText(rankings.tournamentName, { exact: false }).first(),
  ).toBeVisible();
  await open(page, "/videos");
  await expect(page.getByText(videos.content[0].title).first()).toBeVisible();
  await open(page, `/videos/${videos.content[0].slug}`);
  await expect(
    page.getByRole("heading", { level: 1, name: videos.content[0].title }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /open video/i })).toHaveAttribute(
    "href",
    videos.content[0].videoUrl,
  );
  await open(page, "/search?q=pakistan");
  await expect(page.getByText(search.results[0].title).first()).toBeVisible();
  await open(page, "/search?q=x");
  await expect(
    page.getByRole("main").getByText(/at least two characters/i),
  ).toBeVisible();
});

test("noindex article remains readable, is absent from sitemaps, and redirects preserve status", async ({
  page,
  request,
}) => {
  const noindex = await get(
    request,
    "/public/news/weather-forecast-for-final-week-in-lahore",
    article,
  );
  expect(noindex.seo?.robots).toMatch(/noindex/i);
  await open(page, noindex.path);
  expect(
    await page.locator("meta[name=robots]").getAttribute("content"),
  ).toMatch(/noindex/i);
  for (const path of ["/sitemap.xml", "/news-sitemap.xml"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(await response.text()).not.toContain(noindex.path);
  }
  for (const [path, status, target] of [
    ["/cricket/live", 301, "/cricket/live-scores"],
    ["/series", 301, "/cricket/series"],
    ["/match-centre", 302, "/cricket/live-scores"],
  ] as const) {
    const redirect = await request.get(path, { maxRedirects: 0 });
    expect(redirect.status()).toBe(status);
    expect(redirect.headers().location).toContain(target);
  }
  const missing = await request.get("/news/this-article-does-not-exist", {
    maxRedirects: 0,
  });
  expect(missing.status()).toBe(404);
});
