import { describe, expect, it } from "vitest";
import { ingenCacheMiddleware } from "./cache.server";

const kjør = (respons: Response) =>
  // oxlint-disable-next-line typescript/no-explicit-any -- middleware-argumentene brukes ikke
  ingenCacheMiddleware({} as any, async () => respons) as Promise<Response>;

describe("ingenCacheMiddleware", () => {
  it("setter Cache-Control: no-store", async () => {
    const respons = await kjør(new Response("hei"));
    expect(respons.headers.get("Cache-Control")).toBe("no-store");
  });

  it("overstyrer Cache-Control som tillater caching", async () => {
    const respons = await kjør(
      new Response("hei", { headers: { "Cache-Control": "public, max-age=3600" } }),
    );
    expect(respons.headers.get("Cache-Control")).toBe("no-store");
  });

  it("håndterer svar med låste headere", async () => {
    const respons = await kjør(Response.redirect("https://example.com/", 302));
    expect(respons.status).toBe(302);
    expect(respons.headers.get("Location")).toBe("https://example.com/");
    expect(respons.headers.get("Cache-Control")).toBe("no-store");
  });
});
