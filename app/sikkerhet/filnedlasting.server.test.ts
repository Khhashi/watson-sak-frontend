import { describe, expect, it } from "vitest";
import { filtrerFilrespons } from "./filnedlasting.server";

const backendSvar = (headers: Record<string, string>) =>
  new Response("innhold", { status: 200, headers });

describe("filtrerFilrespons", () => {
  it("beholder inline for trygge typer", () => {
    const respons = filtrerFilrespons(
      backendSvar({
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="rapport.pdf"`,
      }),
    );
    expect(respons.headers.get("Content-Disposition")).toBe(`inline; filename="rapport.pdf"`);
  });

  it("tvinger attachment for SVG selv om backend sier inline", () => {
    const respons = filtrerFilrespons(
      backendSvar({
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `inline; filename="bilde.svg"`,
      }),
    );
    expect(respons.headers.get("Content-Disposition")).toBe(`attachment; filename="bilde.svg"`);
  });

  it("tvinger attachment for HTML", () => {
    const respons = filtrerFilrespons(
      backendSvar({ "Content-Type": "text/html; charset=utf-8", "Content-Disposition": "inline" }),
    );
    expect(respons.headers.get("Content-Disposition")).toBe("attachment");
  });

  it("bruker attachment og octet-stream når headere mangler", () => {
    const respons = filtrerFilrespons(new Response("innhold"));
    expect(respons.headers.get("Content-Disposition")).toBe("attachment");
    expect(respons.headers.get("Content-Type")).toContain("text/plain");
  });

  it("legger til sikkerhetsheadere", () => {
    const respons = filtrerFilrespons(backendSvar({ "Content-Type": "image/png" }));
    expect(respons.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(respons.headers.get("Content-Security-Policy")).toBe("sandbox");
    expect(respons.headers.get("Cache-Control")).toBe("no-store");
  });

  it("fjerner headere som ikke står på allowlisten", () => {
    const respons = filtrerFilrespons(
      backendSvar({
        "Content-Type": "image/png",
        "Set-Cookie": "sesjon=hijack",
        Server: "Apache-Coyote",
        "X-Powered-By": "Spring",
        "Access-Control-Allow-Origin": "*",
      }),
    );
    expect(respons.headers.get("Set-Cookie")).toBeNull();
    expect(respons.headers.get("Server")).toBeNull();
    expect(respons.headers.get("X-Powered-By")).toBeNull();
    expect(respons.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("dropper Content-Length når svaret var komprimert", () => {
    const respons = filtrerFilrespons(
      backendSvar({
        "Content-Type": "image/png",
        "Content-Length": "10",
        "Content-Encoding": "gzip",
      }),
    );
    expect(respons.headers.get("Content-Length")).toBeNull();
    expect(respons.headers.get("Content-Encoding")).toBeNull();
  });

  it("beholder Content-Length for ukomprimerte svar", () => {
    const respons = filtrerFilrespons(
      backendSvar({ "Content-Type": "image/png", "Content-Length": "8" }),
    );
    expect(respons.headers.get("Content-Length")).toBe("8");
  });
});
