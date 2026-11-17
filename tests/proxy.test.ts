import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";
const request = () => new NextRequest("http://site.test/cricket/live");
beforeEach(() => {
  process.env.API_BASE_URL = "http://backend.test/api/v1";
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.API_BASE_URL;
});
describe("redirect resolution", () => {
  it("keeps backend-specified 301 and same-origin target", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ toPath: "/cricket/live-scores", statusCode: 301 }),
          ),
        ),
    );
    const result = await proxy(request());
    expect(result.status).toBe(301);
    expect(result.headers.get("location")).toBe(
      "http://site.test/cricket/live-scores",
    );
  });
  it.each([302, 307, 308])(
    "preserves redirect status %i",
    async (statusCode) => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify({ toPath: "/news", statusCode })),
          ),
      );
      const result = await proxy(request());
      expect(result.status).toBe(statusCode);
      expect(result.headers.get("location")).toBe("http://site.test/news");
    },
  );
  it("passes through an unknown path on backend 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 404 })),
    );
    expect((await proxy(request())).headers.get("x-middleware-next")).toBe("1");
  });
  it("returns 410 for retired paths", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ statusCode: 410 }))),
    );
    expect((await proxy(request())).status).toBe(410);
  });
  it("refuses off-site redirects and does not turn an outage into a false 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ toPath: "//evil.test", statusCode: 302 }),
          ),
        )
        .mockRejectedValueOnce(new Error("offline")),
    );
    expect((await proxy(request())).status).toBe(503);
    expect((await proxy(request())).status).toBe(503);
  });
});
