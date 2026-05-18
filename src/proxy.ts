import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/session";

const SESSION_COOKIE = "bar.session";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return "dev-fallback-secret-do-not-use-in-prod!!";
  }
  return secret;
}

async function getRole(req: NextRequest, res: NextResponse): Promise<"bar" | "admin" | null> {
  try {
    const session = await getIronSession<SessionData>(req, res, {
      cookieName: SESSION_COOKIE,
      password: getSecret(),
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 12,
      },
    });
    return session.role ?? null;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();
  const role = await getRole(req, res);

  // Admin API routes
  if (pathname.startsWith("/api/admin/")) {
    if (role !== "admin") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return res;
  }

  // Bar API routes
  if (pathname.startsWith("/api/bar/")) {
    if (role !== "bar" && role !== "admin") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return res;
  }

  // Admin pages
  if (pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login") return res;
    if (role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return res;
  }

  // Bar pages
  if (pathname.startsWith("/bar/")) {
    if (pathname === "/bar/login") return res;
    if (role !== "bar" && role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/bar/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return res;
  }

  return res;
}

export const config = {
  matcher: [
    "/bar/:path*",
    "/admin/:path*",
    "/api/bar/:path*",
    "/api/admin/:path*",
  ],
};
