import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, middleware } from "./middleware";
import { ADMIN_COOKIE, isAdminToken, tokenFor } from "./lib/session";

const req = (path: string, token?: string) => {
  const r = new NextRequest(new URL(path, "http://localhost:3000"));
  if (token) r.cookies.set(ADMIN_COOKIE, token);
  return r;
};

describe("sesja administratora", () => {
  it("akceptuje tylko token z poprawnego hasła", async () => {
    expect(await isAdminToken(await tokenFor("demo"))).toBe(true);
    expect(await isAdminToken(await tokenFor("zle-haslo"))).toBe(false);
    expect(await isAdminToken(undefined)).toBe(false);
    expect(await isAdminToken("")).toBe(false);
  });
});

describe("middleware – dostęp tylko dla administratorów", () => {
  it("chroni panel, aplikację administratora i API administratora", () => {
    expect(config.matcher).toEqual(expect.arrayContaining(["/admin/:path*", "/api/admin/:path*"]));
  });

  it.each(["/admin", "/admin/app", "/admin/app/idea-1", "/admin/wiedza"])("strona %s bez logowania → przekierowanie do logowania", async (path) => {
    const res = await middleware(req(path));
    expect(res.status).toBe(307);
    const to = new URL(res.headers.get("location")!);
    expect(to.pathname).toBe("/logowanie");
    expect(to.searchParams.get("next")).toBe(path);
  });

  it.each(["/api/admin", "/api/admin/push"])("API %s bez logowania → 401", async (path) => {
    const res = await middleware(req(path));
    expect(res.status).toBe(401);
  });

  it("odrzuca podrobiony token", async () => {
    const res = await middleware(req("/admin/app", "podrobiony-token"));
    expect(res.status).toBe(307);
  });

  it("przepuszcza zalogowanego administratora", async () => {
    const res = await middleware(req("/admin/app", await tokenFor("demo")));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
