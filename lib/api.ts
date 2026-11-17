import "server-only";
import { z } from "zod";

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
/** Anonymous public API only. Never expose API_BASE_URL to a client bundle. */
export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  options: { fresh?: boolean; timeoutMs?: number } = {},
): Promise<T> {
  const base =
    process.env.API_BASE_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://127.0.0.1:8080/api/v1"
      : undefined);
  if (!base)
    throw new ServiceError(
      "API_BASE_URL is not configured.",
      undefined,
      "api_not_configured",
    );
  if (!path.startsWith("/public/") && path !== "/public/homepage")
    throw new ServiceError("Invalid public API path.");
  let url: URL;
  try {
    url = new URL(base.replace(/\/$/, "") + path);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    // In local development the backend commonly listens on IPv4 only. Keep
    // explicitly configured remote hosts and production settings untouched.
    if (process.env.NODE_ENV === "development" && url.hostname === "localhost")
      url.hostname = "127.0.0.1";
  } catch {
    throw new ServiceError(
      "API_BASE_URL is invalid.",
      undefined,
      "invalid_api_base_url",
    );
  }
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(options.timeoutMs ?? 10000),
      ...(options.fresh
        ? { cache: "no-store" as const }
        : { next: { revalidate: 60 } }),
    });
  } catch {
    throw new ServiceError(
      "The sports service is unavailable. Please try again shortly.",
      undefined,
      "upstream_unreachable",
    );
  }
  if (!response.ok) {
    let code: string | undefined;
    try {
      const problem = z
        .object({ code: z.string().optional() })
        .safeParse(await response.json());
      if (problem.success) code = problem.data.code;
    } catch {
      /* do not expose upstream error bodies */
    }
    throw new ServiceError(
      response.status === 429
        ? "Too many requests. Please try again shortly."
        : "The sports service could not complete the request.",
      response.status,
      code,
    );
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ServiceError(
      "The sports service returned invalid JSON.",
      response.status,
    );
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success)
    throw new ServiceError(
      "The sports service returned an unexpected response.",
      response.status,
      "invalid_response",
    );
  return parsed.data;
}
export async function optional404<T>(
  fn: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ServiceError && error.status === 404) return undefined;
    throw error;
  }
}
export function query(
  params: Record<string, string | number | undefined>,
): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v !== undefined && String(v) !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}
