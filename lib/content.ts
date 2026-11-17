import sanitizeHtml from "sanitize-html";
import { marked } from "marked";
import type { NewsArticle } from "@/types";
export function safePath(path: string, fallback: string) {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
    ? path
    : fallback;
}
export function mediaUrl(url: string): string | undefined {
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\"))
    return url;
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}
export function externalUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}
export function renderArticleBody(article: NewsArticle): string {
  const input =
    article.bodyFormat === "MARKDOWN"
      ? marked.parse(article.body, { async: false })
      : article.bodyFormat === "PLAIN"
        ? article.body
            .split(/\n\s*\n/)
            .map(
              (p) =>
                `<p>${sanitizeHtml(p, { allowedTags: [], allowedAttributes: {} })}</p>`,
            )
            .join("")
        : article.body;
  return sanitizeHtml(input, {
    allowedTags: [
      "p",
      "br",
      "h2",
      "h3",
      "h4",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
    ],
    allowedAttributes: { a: ["href", "title"] },
    allowedSchemes: ["https", "http", "mailto"],
    allowProtocolRelative: false,
  });
}
