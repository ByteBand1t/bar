import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getSession } from "@/lib/session";
import { checkLoginRateLimit, recordLoginFailure, recordLoginSuccess } from "@/lib/login-rate-limit";

function constantEqual(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ab.length !== bb.length) {
      // Still run the comparison to avoid timing differences revealing length
      timingSafeEqual(ab, ab);
      return false;
    }
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const rateCheck = checkLoginRateLimit(ip);
  if (!rateCheck.allowed) {
    const retryAfterSec = Math.ceil((rateCheck.retryAfterMs ?? 0) / 1000);
    return NextResponse.json(
      { error: "Zu viele Fehlversuche. Bitte später erneut versuchen." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      }
    );
  }

  let body: { pin?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const { pin, role } = body;

  if (typeof pin !== "string" || (role !== "bar" && role !== "admin")) {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const barPin = process.env.BAR_PIN ?? "1234";
  const adminPin = process.env.ADMIN_PIN ?? "9999";

  let authenticated = false;

  if (role === "admin") {
    authenticated = constantEqual(pin, adminPin);
  } else {
    // Bar accepts bar pin OR admin pin
    authenticated = constantEqual(pin, barPin) || constantEqual(pin, adminPin);
  }

  if (!authenticated) {
    recordLoginFailure(ip);
    return NextResponse.json({ error: "PIN falsch" }, { status: 401 });
  }

  recordLoginSuccess(ip);

  const session = await getSession();
  session.role = role;
  session.loggedInAt = Date.now();
  await session.save();

  return NextResponse.json({ ok: true });
}
