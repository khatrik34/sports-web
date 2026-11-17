import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { site } from "@/config/site";
import {
  matchService,
  playerService,
  sitemapService,
  teamService,
  tournamentService,
  videoService,
} from "@/services";
import type { PaginatedResponse } from "@/types";
async function allPages<T>(
  load: (page: number) => Promise<PaginatedResponse<T>>,
): Promise<T[]> {
  const first = await load(0);
  const items = [...first.content];
  for (let page = 1; page < first.totalPages; page++)
    items.push(...(await load(page)).content);
  return items;
}
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const [articles, videos, teams, players, matches, series] = await Promise.all(
    [
      sitemapService.articles(),
      allPages((page) => videoService.list({ size: 100, page })),
      allPages((page) => teamService.list({ size: 100, page })),
      allPages((page) => playerService.list({ size: 100, page })),
      allPages((page) => matchService.list({ size: 100, page })),
      tournamentService.list(),
    ],
  );
  const staticPaths = [
    "",
    "/cricket",
    "/cricket/live-scores",
    "/cricket/fixtures",
    "/cricket/series",
    "/news",
    "/news/categories",
    "/videos",
    "/teams",
    "/rankings",
    "/about",
    "/contact",
  ];
  return [
    ...staticPaths.map((p) => ({ url: site.url + p })),
    ...articles.map((a) => ({
      url: a.loc,
      lastModified: a.lastModified || undefined,
    })),
    ...videos.map((v) => ({ url: `${site.url}/videos/${v.slug}` })),
    ...teams.map((t) => ({ url: `${site.url}/teams/${t.slug}` })),
    ...players.map((p) => ({ url: `${site.url}/players/${p.slug}` })),
    ...matches.map((m) => ({ url: `${site.url}/cricket/match/${m.slug}` })),
    ...series.map((t) => ({ url: `${site.url}/cricket/series/${t.slug}` })),
  ];
}
