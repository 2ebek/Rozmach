import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/session";

/** Panel administratora i jego API są dostępne wyłącznie po zalogowaniu. */
export async function middleware(req: NextRequest) {
  if (await isAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Brak uprawnień. Zaloguj się jako administrator." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/logowanie";
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
