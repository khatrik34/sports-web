import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiRequest, optional404, query } from "@/lib/api";

const redirectSchema = z.object({
  statusCode: z.number().int(),
  toPath: z.string().nullish(),
});
// Resolve editor-managed redirects on the server via the shared API client.
export async function proxy(request: NextRequest) {
  const unavailable = () =>
    new NextResponse("The service is temporarily unavailable.", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "60",
      },
    });
  try {
    const item = await optional404(() =>
      apiRequest(
        `/public/redirects${query({ path: request.nextUrl.pathname })}`,
        redirectSchema,
        { fresh: true, timeoutMs: 3000 },
      ),
    );
    if (!item) return NextResponse.next();
    if (item.statusCode === 410)
      return new NextResponse("This page is no longer available.", {
        status: 410,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    if (
      typeof item.toPath === "string" &&
      item.toPath.startsWith("/") &&
      !item.toPath.startsWith("//") &&
      !item.toPath.includes("\\") &&
      [301, 302, 307, 308].includes(item.statusCode)
    )
      return NextResponse.redirect(
        new URL(item.toPath, request.url),
        item.statusCode,
      );
    return unavailable();
  } catch {
    return unavailable();
  }
}
export const config = {
  matcher: [
    "/((?!_next/|api/|images/|favicon.ico|icon.svg|robots.txt|sitemap.xml|news-sitemap.xml|manifest.webmanifest).*)",
  ],
};
