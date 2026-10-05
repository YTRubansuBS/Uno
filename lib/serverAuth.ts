import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { redis, redisGet, redisSet } from "@/lib/redis";

export type ServerUser = {
  id: string;
  username: string;
  kind: "account" | "guest";
};

const SESSION_COOKIE = "uno_session";
const GUEST_COOKIE = "uno_guest";
const SESSION_TTL = 60 * 60 * 24 * 30;

function cleanUsername(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 20);
}

function usernameKey(username: string) {
  return "uno:user:username:" + username.trim().toLowerCase();
}

function userKey(id: string) {
  return "uno:user:" + id;
}

function sessionKey(token: string) {
  return "uno:session:" + token;
}

function guestKey(token: string) {
  return "uno:guest:" + token;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return salt + ":" + hash;
}

function checkPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function writeSession(response: Response, user: ServerUser) {
  if (!redis) return;
  const token = randomBytes(32).toString("base64url");
  await redisSet(sessionKey(token), user, { ex: SESSION_TTL });
  if ("cookies" in response) {
    // NextResponse is compatible with this branch; kept here only for type narrowing.
  }
  return token;
}

export async function registerAccount(usernameInput: string, password: string) {
  if (!redis) throw new Error("Redis n'est pas configuré.");
  const username = cleanUsername(usernameInput);
  if (username.length < 2) throw new Error("Le pseudo doit faire au moins 2 caractères.");
  if (password.length < 6) throw new Error("Le mot de passe doit faire au moins 6 caractères.");

  if (await redisGet<unknown>(usernameKey(username))) throw new Error("Ce pseudo est déjà utilisé.");

  const id = "u_" + randomBytes(12).toString("hex");
  const user = { id, username, passwordHash: hashPassword(password) };
  await redisSet(usernameKey(username), { id, username });
  await redisSet(userKey(id), user);
  return { id, username, kind: "account" as const };
}

export async function loginAccount(usernameInput: string, password: string) {
  if (!redis) throw new Error("Redis n'est pas configuré.");
  const username = cleanUsername(usernameInput);
  const found = await redisGet<{ id: string; username: string }>(usernameKey(username));
  if (!found) throw new Error("Pseudo ou mot de passe incorrect.");
  const user = await redisGet<{ id: string; username: string; passwordHash: string }>(userKey(found.id));
  if (!user || !checkPassword(password, user.passwordHash)) throw new Error("Pseudo ou mot de passe incorrect.");
  return { id: user.id, username: user.username, kind: "account" as const };
}

export async function createGuest(usernameInput: string) {
  if (!redis) throw new Error("Redis n'est pas configuré.");
  const username = cleanUsername(usernameInput) || "Invité";
  const token = randomBytes(32).toString("base64url");
  const user = { id: "g_" + token.slice(0, 12), username, kind: "guest" as const };
  await redisSet(guestKey(token), user, { ex: SESSION_TTL });
  return { user, token };
}

export async function getCurrentUser(): Promise<ServerUser | null> {
  if (!redis) return null;
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;
  if (session) {
    const user = await redisGet<ServerUser>(sessionKey(session));
    if (user?.id) return user;
  }
  const guest = store.get(GUEST_COOKIE)?.value;
  if (guest) {
    const user = await redisGet<ServerUser>(guestKey(guest));
    if (user?.id) return user;
  }
  return null;
}

export const authCookies = {
  SESSION_COOKIE,
  GUEST_COOKIE,
  SESSION_TTL
};
