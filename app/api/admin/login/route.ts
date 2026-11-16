import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSession,
  verifyPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; reset: number }>();

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  const now = Date.now();
  const record = attempts.get(ip);
  if (record && record.reset > now && record.count >= 8) {
    return NextResponse.json({ error: "尝试次数过多，稍后再试" }, { status: 429 });
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password || "";
  } catch {
    return NextResponse.json({ error: "请求格式不对" }, { status: 400 });
  }

  if (!verifyPassword(password)) {
    attempts.set(ip, {
      count: record && record.reset > now ? record.count + 1 : 1,
      reset: record && record.reset > now ? record.reset : now + 5 * 60 * 1000,
    });
    return NextResponse.json({ error: "密码不对" }, { status: 401 });
  }

  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSession(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE === "1",
  });
  return res;
}
