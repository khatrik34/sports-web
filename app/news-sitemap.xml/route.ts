import { sitemapService } from "@/services";
import { site } from "@/config/site";
const escapeXml = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
export async function GET() {
  const articles = await sitemapService.news();
  const entries = articles
    .map(
      (a) =>
        `<url><loc>${escapeXml(a.loc)}</loc><news:news><news:publication><news:name>${escapeXml(site.name)}</news:name><news:language>${escapeXml(a.language)}</news:language></news:publication><news:publication_date>${escapeXml(a.publishedAt)}</news:publication_date><news:title>${escapeXml(a.title)}</news:title></news:news></url>`,
    )
    .join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${entries}</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    },
  );
}
