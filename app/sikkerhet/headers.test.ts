import { describe, expect, it } from "vitest";
import { lagContentSecurityPolicy, sikkerhetHeaders } from "./headers";
import { lagNonce } from "./nonce.server";

const csp = (ekstraFormActionUrls?: string[]) =>
  lagContentSecurityPolicy({ nonce: "testnonce", ekstraFormActionUrls });

describe("lagContentSecurityPolicy", () => {
  it("tillater kun skript fra egne filer, cdn.nav.no og riktig nonce", () => {
    expect(csp()).toContain("script-src 'self' https://cdn.nav.no 'nonce-testnonce';");
  });

  it("tillater ikke unsafe-inline eller unsafe-eval for skript", () => {
    const scriptSrc = csp()
      .split(";")
      .find((d) => d.trim().startsWith("script-src"));
    expect(scriptSrc).not.toContain("unsafe-inline");
    expect(scriptSrc).not.toContain("unsafe-eval");
  });

  it("blokkerer eksterne bilder", () => {
    expect(csp()).toContain("img-src 'self' data:;");
    expect(csp()).not.toMatch(/img-src[^;]*https:/);
  });

  it("blokkerer object og embed", () => {
    expect(csp()).toContain("object-src 'none';");
  });

  it("tillater analytics-kall til reops event proxy i connect-src", () => {
    expect(csp()).toContain(
      "connect-src 'self' telemetry.nav.no telemetry.ekstern.dev.nav.no umami.nav.no reops-event-proxy.nav.no reops-event-proxy.ekstern.dev.nav.no;",
    );
  });

  it("tillater lokale PDF-blobber i iframes", () => {
    expect(csp()).toContain("frame-src 'self' blob:;");
  });

  it("inkluderer kun 'self' i form-action som standard", () => {
    expect(csp()).toContain("form-action 'self'");
  });

  it("legger til ekstra form-action URL-er når angitt", () => {
    expect(csp(["https://watson-sok.intern.nav.no"])).toContain(
      "form-action 'self' https://watson-sok.intern.nav.no",
    );
  });
});

describe("sikkerhetHeaders", () => {
  it("setter ikke CSP, den settes med nonce i entry.server", () => {
    expect(sikkerhetHeaders()).not.toHaveProperty("Content-Security-Policy");
  });
});

describe("lagNonce", () => {
  it("lager en ny nonce med minst 128 bit hver gang", () => {
    const a = lagNonce();
    const b = lagNonce();
    expect(a).not.toBe(b);
    expect(Buffer.from(a, "base64")).toHaveLength(16);
  });
});
