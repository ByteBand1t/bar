import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export interface SessionData {
  role: "bar" | "admin" | null;
  loggedInAt: number;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET muss mindestens 32 Zeichen lang sein");
    }
    console.warn("[auth] SESSION_SECRET fehlt oder zu kurz – Dev-Fallback aktiv");
    return "dev-fallback-secret-do-not-use-in-prod!!";
  }
  return secret;
}

const sessionOptions = {
  cookieName: "bar.session",
  password: getSecret(),
  cookieOptions: {
    httpOnly: true,
    // Use TRUST_PROXY=true when TLS is terminated by an upstream reverse proxy
    secure: process.env.TRUST_PROXY === "true",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 12,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getSessionFromRequest(
  req: NextRequest,
  res: NextResponse
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, sessionOptions);
}

export async function requireRole(
  role: "bar" | "admin"
): Promise<SessionData> {
  const session = await getSession();
  const userRole = session.role;
  if (!userRole) {
    throw new Response(JSON.stringify({ error: "Nicht angemeldet" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (role === "admin" && userRole !== "admin") {
    throw new Response(JSON.stringify({ error: "Keine Berechtigung" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (role === "bar" && userRole !== "bar" && userRole !== "admin") {
    throw new Response(JSON.stringify({ error: "Keine Berechtigung" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session as SessionData;
}

export async function clearSession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
