import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  matchService,
  newsService,
  searchAll,
  matchDetailsService,
} from "../services";
import { ServiceError } from "../lib/api";
import { renderArticleBody } from "../lib/content";
import { formatDate } from "../lib/utils";
const article = {
  slug: "story",
  title: "A story",
  categoryName: "Cricket",
  summary: "Summary",
  coverImageUrl: null,
  coverImageAlt: null,
  authorDisplayName: "Writer",
  publishedAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  readTime: 2,
  featured: false,
  path: "/news/story",
  body: "<p>Hello</p><script>alert(1)</script>",
  bodyFormat: "HTML",
  seo: null,
};
const page = (content: unknown[]) => ({
  content,
  page: 0,
  size: 12,
  totalElements: content.length,
  totalPages: 1,
  first: true,
  last: true,
});
function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
beforeEach(() => {
  process.env.API_BASE_URL = "http://backend.test/api/v1";
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.API_BASE_URL;
});
describe("public API adapter", () => {
  it("maps real article fields and requests a paginated response with revalidation", async () => {
    const fetcher = vi.fn().mockResolvedValue(response(page([article])));
    vi.stubGlobal("fetch", fetcher);
    const result = await newsService.list({ page: 0 });
    expect(result.content[0]).toMatchObject({
      slug: "story",
      excerpt: "Summary",
      category: "Cricket",
      image: "",
    });
    expect(String(fetcher.mock.calls[0][0])).toContain(
      "/public/news?size=12&page=0",
    );
    expect(fetcher.mock.calls[0][1].next).toEqual({ revalidate: 60 });
  });
  it("treats a real 404 as missing, not an outage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ code: "not_found" }, 404)),
    );
    expect(await newsService.get("missing")).toBeUndefined();
  });
  it("does not silently fall back on upstream errors or invalid responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ code: "upstream" }, 503)),
    );
    await expect(newsService.list()).rejects.toMatchObject({ status: 503 });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ wrong: "shape" })),
    );
    await expect(newsService.list()).rejects.toMatchObject({
      code: "invalid_response",
    });
  });
  it("forwards inclusive date ranges and paging to the backend", async () => {
    const fetcher = vi.fn().mockResolvedValue(response(page([])));
    vi.stubGlobal("fetch", fetcher);
    await matchService.list({
      filter: "upcoming",
      from: "2026-08-01",
      to: "2026-08-31",
      page: 2,
    });
    const url = new URL(String(fetcher.mock.calls[0][0]));
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      filter: "upcoming",
      from: "2026-08-01",
      to: "2026-08-31",
      page: "2",
    });
    expect(fetcher.mock.calls[0][1].cache).toBe("no-store");
  });
  it("uses no-store for matches, scorecards, and commentary", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response(page([])))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response(page([])));
    vi.stubGlobal("fetch", fetcher);
    await matchService.list();
    await matchDetailsService.scorecard("test");
    await matchDetailsService.commentary("test");
    expect(fetcher.mock.calls.every((c) => c[1].cache === "no-store")).toBe(
      true,
    );
  });
  it("maps one search response and preserves the short-query error code", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          response({
            query: "in",
            total: 1,
            results: [
              {
                type: "team",
                title: "India",
                subtitle: null,
                path: "/teams/india",
              },
            ],
          }),
        )
        .mockResolvedValueOnce(response({ code: "query_too_short" }, 400)),
    );
    expect((await searchAll("in")).results[0].title).toBe("India");
    await expect(searchAll("i")).rejects.toMatchObject({
      code: "query_too_short",
      status: 400,
    });
  });
  it("sanitizes untrusted HTML and formats editorial dates", () => {
    const cleaned = renderArticleBody({
      ...article,
      category: "Cricket",
      excerpt: "Summary",
      image: "",
      imageAlt: "",
      author: "Writer",
      published: article.publishedAt,
      updated: article.updatedAt,
      bodyFormat: "HTML",
      seo: undefined,
    });
    expect(cleaned).not.toContain("<script");
    expect(cleaned).toContain("<p>Hello</p>");
    expect(formatDate("2026-11-13T09:00:00Z")).toBe("13 Nov 2026");
  });
  it("requires a server API origin", async () => {
    delete process.env.API_BASE_URL;
    await expect(newsService.list()).rejects.toBeInstanceOf(ServiceError);
  });
});
