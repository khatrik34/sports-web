import "server-only";
import { z } from "zod";
import { apiRequest, optional404, query } from "@/lib/api";
import type {
  Commentary,
  HomepageSection,
  Innings,
  Match,
  NewsArticle,
  PaginatedResponse,
  Player,
  PointsTable,
  SearchHit,
  Team,
  Tournament,
  Video,
} from "@/types";

const text = z
  .string()
  .nullish()
  .transform((v) => v ?? "");
const teamRef = z
  .object({
    slug: z.string(),
    name: z.string(),
    shortName: text,
    flag: text,
    logoUrl: text,
    description: text,
  })
  .transform((x): Team => ({
    slug: x.slug,
    name: x.name,
    short: x.shortName,
    flag: x.flag,
    description: x.description,
    logoUrl: x.logoUrl,
  }));
const match = z
  .object({
    slug: z.string(),
    tournamentName: text,
    tournamentSlug: text,
    format: text,
    category: z.enum(["International", "Domestic", "League"]).nullish(),
    venue: text,
    startTime: z.string(),
    status: z.enum(["live", "upcoming", "recent"]),
    state: z.string(),
    team1: teamRef,
    team2: teamRef,
    team1Score: text,
    team2Score: text,
    note: text,
    resultText: text,
  })
  .transform((x): Match => ({
    slug: x.slug,
    tournament: x.tournamentName,
    tournamentSlug: x.tournamentSlug,
    format: x.format,
    category: x.category ?? "",
    venue: x.venue,
    date: x.startTime,
    status: x.status,
    state: x.state,
    team1: x.team1,
    team2: x.team2,
    score1: x.team1Score,
    score2: x.team2Score,
    note: x.note || x.resultText,
  }));
const seo = z.object({
  metaTitle: text,
  metaDescription: text,
  canonicalUrl: text,
  robots: text,
  ogTitle: text,
  ogDescription: text,
  ogImageUrl: text,
});
const article = z
  .object({
    slug: z.string(),
    title: z.string(),
    categoryName: text,
    summary: text,
    coverImageUrl: text,
    coverImageAlt: text,
    authorDisplayName: text,
    publishedAt: z.string(),
    updatedAt: z.string(),
    readTime: z.number(),
    featured: z.boolean(),
    body: text,
    bodyFormat: z.enum(["HTML", "MARKDOWN", "PLAIN"]).nullish(),
    path: z.string(),
    seo: seo.nullish(),
  })
  .transform((x): NewsArticle => ({
    slug: x.slug,
    title: x.title,
    category: x.categoryName,
    excerpt: x.summary,
    image: x.coverImageUrl,
    imageAlt: x.coverImageAlt,
    author: x.authorDisplayName,
    published: x.publishedAt,
    updated: x.updatedAt,
    readTime: x.readTime,
    featured: x.featured,
    body: x.body,
    bodyFormat: x.bodyFormat ?? "PLAIN",
    path: x.path,
    seo: x.seo ?? undefined,
  }));
const player = z
  .object({
    slug: z.string(),
    name: z.string(),
    country: text,
    role: text,
    battingStyle: text,
    bowlingStyle: text,
    description: text,
    team: teamRef.nullish(),
    imageUrl: text,
  })
  .transform((x): Player => ({
    slug: x.slug,
    name: x.name,
    country: x.country,
    role: x.role,
    batting: x.battingStyle,
    bowling: x.bowlingStyle,
    description: x.description,
    teamSlug: x.team?.slug,
    imageUrl: x.imageUrl,
  }));
const tournament = z
  .object({
    slug: z.string(),
    name: z.string(),
    shortName: text,
    description: text,
    datesText: text,
    teamSlugs: z.array(z.string()),
  })
  .transform((x): Tournament => ({
    slug: x.slug,
    name: x.name,
    short: x.shortName,
    description: x.description,
    dates: x.datesText,
    teams: x.teamSlugs,
  }));
const video = z
  .object({
    slug: z.string(),
    title: z.string(),
    category: text,
    image: text,
    duration: text,
    description: text,
    published: z.string(),
    videoUrl: text,
  })
  .transform((x): Video => x);
const standing = z
  .object({
    team: teamRef,
    played: z.number(),
    won: z.number(),
    lost: z.number(),
    points: z.number(),
    nrr: text,
  })
  .transform((x): PointsTable => ({ ...x, team: x.team.name }));
const innings = z
  .object({
    inningsNumber: z.number(),
    battingTeam: teamRef,
    runs: z.number(),
    wickets: z.number(),
    overs: text,
    declared: z.boolean(),
    batting: z.array(
      z.object({
        batter: z.string(),
        dismissal: text,
        runs: z.number(),
        balls: z.number(),
        fours: z.number(),
        sixes: z.number(),
        notOut: z.boolean(),
      }),
    ),
    bowling: z.array(
      z.object({
        bowler: z.string(),
        overs: text,
        maidens: z.number(),
        runsConceded: z.number(),
        wickets: z.number(),
        economy: text,
      }),
    ),
  })
  .transform((x): Innings => x);
const comment = z
  .object({ over: text, kind: text, text: z.string(), createdAt: z.string() })
  .transform((x): Commentary => x);
const category = z.object({ slug: z.string(), name: z.string(), filter: text });
const homepage = z
  .array(
    z.object({
      key: z.string(),
      type: z.string(),
      title: text,
      sortOrder: z.number(),
      enabled: z.boolean(),
      config: z
        .record(z.string(), z.unknown())
        .nullish()
        .transform((v) => v ?? {}),
    }),
  )
  .transform((x): HomepageSection[] => x);
const hit = z
  .object({
    type: z.string(),
    title: z.string(),
    subtitle: text,
    path: z.string(),
  })
  .transform((x): SearchHit => x);
const page = <T>(schema: z.ZodType<T>) =>
  z.object({
    content: z.array(schema),
    page: z.number(),
    size: z.number(),
    totalElements: z.number(),
    totalPages: z.number(),
    first: z.boolean(),
    last: z.boolean(),
  });
const enc = encodeURIComponent;
const get = <T>(path: string, schema: z.ZodType<T>, fresh = false) =>
  apiRequest(path, schema, { fresh });
const detail = <T>(path: string, schema: z.ZodType<T>, fresh = false) =>
  optional404(() => get(path, schema, fresh));
export const newsService = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    get(`/public/news${query({ size: 12, ...params })}`, page(article)),
  latest: (featured = false, limit = 10) =>
    get(
      `/public/news/latest${query({ limit, featured: String(featured) })}`,
      z.array(article),
    ),
  get: (slug: string) => detail(`/public/news/${enc(slug)}`, article),
  categories: () => get("/public/categories", z.array(category)),
};
export const matchService = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    get(`/public/matches${query({ size: 20, ...params })}`, page(match), true),
  get: (slug: string) => detail(`/public/matches/${enc(slug)}`, match, true),
};
export const teamService = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    get(`/public/teams${query({ size: 100, ...params })}`, page(teamRef)),
  get: (slug: string) => detail(`/public/teams/${enc(slug)}`, teamRef),
};
export const playerService = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    get(`/public/players${query({ size: 100, ...params })}`, page(player)),
  get: (slug: string) => detail(`/public/players/${enc(slug)}`, player),
};
export const tournamentService = {
  list: () => get("/public/tournaments", z.array(tournament)),
  get: (slug: string) => detail(`/public/tournaments/${enc(slug)}`, tournament),
  points: (slug: string) =>
    get(`/public/tournaments/${enc(slug)}/standings`, z.array(standing)),
};
export const videoService = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    get(`/public/videos${query({ size: 12, ...params })}`, page(video)),
  get: (slug: string) => detail(`/public/videos/${enc(slug)}`, video),
};
export const matchDetailsService = {
  scorecard: (slug: string) =>
    get(`/public/matches/${enc(slug)}/scorecard`, z.array(innings), true),
  commentary: (slug: string, pageNumber = 0) =>
    get(
      `/public/matches/${enc(slug)}/commentary${query({ size: 20, page: pageNumber })}`,
      page(comment),
      true,
    ),
};
export const homepageService = {
  list: () => get("/public/homepage", homepage),
};
export const searchAll = async (q: string) =>
  get(
    `/public/search${query({ q, limit: 5 })}`,
    z.object({ query: z.string(), total: z.number(), results: z.array(hit) }),
  );
export const rankingsService = {
  get: (format?: string) =>
    optional404(() =>
      get(
        `/public/rankings${query({ format })}`,
        z.object({ tournamentName: z.string(), rows: z.array(standing) }),
      ),
    ),
};
export const sitemapService = {
  articles: () =>
    get(
      "/public/sitemap",
      z.array(
        z.object({ loc: z.string(), lastModified: z.string().nullish() }),
      ),
    ),
  news: () =>
    get(
      "/public/news-sitemap?hours=48",
      z.array(
        z.object({
          loc: z.string(),
          title: z.string(),
          publishedAt: z.string(),
          language: z.string(),
        }),
      ),
    ),
};
export type Page<T> = PaginatedResponse<T>;
