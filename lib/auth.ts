import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE } from "./taxonomy";

const MAX_AGE = 60 * 60 * 24 * 7;

function secret(): string {
  return process.env.ADMIN_SECRET || "phantom-archive-local-secret";
}

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "phantom2026";
}

export function verifyPassword(candidate: string): boolean {
  const expected = Buffer.from(adminPassword());
  const got = Buffer.from(candidate || "");
  if (expected.length !== got.length) return false;
  return timingSafeEqual(expected, got);
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSession(): string {
  const exp = Date.now() + MAX_AGE * 1000;
  const payload = String(exp);
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const exp = Number(payload);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySession(jar.get(ADMIN_COOKIE)?.value);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export const SESSION_COOKIE = ADMIN_COOKIE;
export const SESSION_MAX_AGE = MAX_AGE;
