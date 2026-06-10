import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createRouteMatcher } from "@clerk/nextjs/server";
import { PROTECTED_ROUTES } from "@/proxy";

const isProtected = createRouteMatcher([...PROTECTED_ROUTES]);

function req(path: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`);
}

describe("route protection (proxy.ts matcher)", () => {
  it("protects every authenticated app surface", () => {
    for (const path of [
      "/dashboard",
      "/analyzer",
      "/analyses",
      "/analyses/abc",
      "/snippets",
      "/settings",
      "/settings/profile",
      "/settings/account",
    ]) {
      expect(isProtected(req(path)), `${path} should be protected`).toBe(true);
    }
  });

  it("leaves public surfaces open", () => {
    for (const path of ["/", "/sign-in", "/sign-up", "/sso-callback"]) {
      expect(isProtected(req(path)), `${path} should be public`).toBe(false);
    }
  });

  it("leaves the analyze API to its own auth guard (returns JSON 401, not a redirect)", () => {
    expect(isProtected(req("/api/analyze"))).toBe(false);
  });
});
