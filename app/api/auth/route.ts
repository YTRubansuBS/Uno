import { NextResponse } from "next/server";
import { authCookies, createGuest, getCurrentUser, loginAccount, registerAccount } from "@/lib/serverAuth";
import { redisConfigured } from "@/lib/redis";

export async function GET() {
  if (!redisConfigured) return NextResponse.json({ configured: false, user: null }, { status: 503 });
  return NextResponse.json({ configured: true, user: await getCurrentUser() });
}

export async function POST(request: Request) {
  if (!redisConfigured) return NextResponse.json({ error: "Redis n'est pas configuré sur Vercel." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");

  try {
    if (action === "signup") {
      const user = await registerAccount(String(body.username || ""), String(body.password || ""));
      const response = NextResponse.json({ user });
      const token = crypto.randomUUID() + crypto.randomUUID();
      const { redisSet } = await import("@/lib/redis");
      await redisSet("uno:session:" + token, user, { ex: authCookies.SESSION_TTL });
      response.cookies.set(authCookies.SESSION_COOKIE, token, {
        httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: authCookies.SESSION_TTL
      });
      return response;
    }

    if (action === "login") {
      const user = await loginAccount(String(body.username || ""), String(body.password || ""));
      const response = NextResponse.json({ user });
      const token = crypto.randomUUID() + crypto.randomUUID();
      const { redisSet } = await import("@/lib/redis");
      await redisSet("uno:session:" + token, user, { ex: authCookies.SESSION_TTL });
      response.cookies.set(authCookies.SESSION_COOKIE, token, {
        httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: authCookies.SESSION_TTL
      });
      response.cookies.set(authCookies.GUEST_COOKIE, "", { expires: new Date(0), path: "/" });
      return response;
    }

    if (action === "guest") {
      const { user, token } = await createGuest(String(body.username || "Invité"));
      const response = NextResponse.json({ user });
      response.cookies.set(authCookies.GUEST_COOKIE, token, {
        httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: authCookies.SESSION_TTL
      });
      return response;
    }

    if (action === "logout") {
      const response = NextResponse.json({ ok: true });
      response.cookies.set(authCookies.SESSION_COOKIE, "", { expires: new Date(0), path: "/" });
      response.cookies.set(authCookies.GUEST_COOKIE, "", { expires: new Date(0), path: "/" });
      return response;
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
