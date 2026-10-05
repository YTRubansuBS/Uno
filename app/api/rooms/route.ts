import { NextResponse } from "next/server";
import { getCurrentUser, createGuest } from "@/lib/serverAuth";
import { redisConfigured, redis } from "@/lib/redis";
import { codeKey, createRoomId, getRoomByCode, makeRoomCode, publicRoom, saveRoom, type RedisRoom } from "@/lib/roomServer";
import { createRemoteState } from "@/lib/uno";

export const runtime = "nodejs";

async function ensureUser(username?: string) {
  const current = await getCurrentUser();
  if (current) return current;
  if (!username) throw new Error("Choisis un pseudo avant de créer ou rejoindre un salon.");
  if (!redis) throw new Error("Redis n'est pas configuré.");
  const guest = await createGuest(username);
  return guest.user;
}

export async function POST(request: Request) {
  if (!redisConfigured) return NextResponse.json({ error: "Redis n'est pas configuré sur Vercel." }, { status: 503 });
  try {
    const body = await request.json().catch(() => ({}));
    const user = await ensureUser(String(body.username || "Invité"));

    if (body.action === "join") {
      const code = String(body.code || "").toUpperCase();
      if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error("Code invalide.");
      const room = await getRoomByCode(code);
      if (!room) return NextResponse.json({ error: "Salon introuvable." }, { status: 404 });
      if (room.status !== "waiting") throw new Error("Cette partie a déjà commencé.");
      if (room.players.some((p) => p.id === user.id)) return NextResponse.json(publicRoom(room, user.id));
      if (room.players.length >= 4) throw new Error("Salon complet.");
      const seat = room.players.length;
      room.players.push({ id: user.id, username: user.username, seat, isHost: false, hand: [] });
      await saveRoom(room);
      return NextResponse.json(publicRoom(room, user.id));
    }

    let code = "";
    for (let attempt = 0; attempt < 12; attempt++) {
      const candidate = makeRoomCode();
      const exists = await redis!.get(codeKey(candidate));
      if (!exists) { code = candidate; break; }
    }
    if (!code) throw new Error("Impossible de créer le code du salon.");
    const id = createRoomId();
    const player = { id: user.id, username: user.username, seat: 0, isHost: true, hand: [] };
    const state = createRemoteState([{ id: user.id }]);
    state.status = "waiting";
    state.currentPlayerId = null;
    state.deck = [];
    state.discard = [];
    state.currentColor = null;
    const room: RedisRoom = {
      id, code, hostId: user.id, status: "waiting", state,
      players: [player], createdAt: Date.now(), updatedAt: Date.now()
    };
    await saveRoom(room);
    return NextResponse.json(publicRoom(room, user.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Création impossible." }, { status: 400 });
  }
}

export async function GET(request: Request) {
  if (!redisConfigured) return NextResponse.json({ error: "Redis n'est pas configuré sur Vercel." }, { status: 503 });
  try {
    const current = await getCurrentUser();
    if (!current) throw new Error("Session introuvable.");
    const code = new URL(request.url).searchParams.get("code")?.toUpperCase() || "";
    if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error("Code invalide.");
    const room = await getRoomByCode(code);
    if (!room) return NextResponse.json({ error: "Salon introuvable." }, { status: 404 });
    return NextResponse.json(publicRoom(room, current.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Impossible de charger le salon." }, { status: 400 });
  }
}
