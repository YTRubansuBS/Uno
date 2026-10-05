import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverAuth";
import { redisConfigured } from "@/lib/redis";
import { getRoom, publicRoom, saveRoom, type RedisRoom } from "@/lib/roomServer";
import { createRemoteState } from "@/lib/uno";


export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!redisConfigured) return NextResponse.json({ error: "Redis n'est pas configuré." }, { status: 503 });
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Session introuvable.");
    const { id } = await context.params;
    const room = await getRoom(id);
    if (!room) return NextResponse.json({ error: "Salon fermé." }, { status: 404 });
    if (!room.players.some((p) => p.id === user.id)) return NextResponse.json({ error: "Tu n'es plus dans ce salon." }, { status: 403 });
    return NextResponse.json(publicRoom(room, user.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Impossible de charger le salon." }, { status: 400 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!redisConfigured) return NextResponse.json({ error: "Redis n'est pas configuré." }, { status: 503 });
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Session introuvable.");
    const { id } = await context.params;
    const room = await getRoom(id);
    if (!room) throw new Error("Salon fermé.");
    if (room.hostId !== user.id) throw new Error("Seul l'hôte peut lancer la partie.");
    if (room.status !== "waiting") return NextResponse.json(publicRoom(room, user.id));
    if (room.players.length < 2) throw new Error("Il faut au moins 2 joueurs.");

    const ordered = [...room.players].sort((a, b) => a.seat - b.seat);
    const state = createRemoteState(ordered.map((p) => ({ id: p.id })));
    const hands: Record<string, import("@/lib/types").UnoCard[]> = Object.fromEntries(ordered.map((p) => [p.id, []]));
    const deck = [...state.deck];
    for (let round = 0; round < 7; round++) {
      for (const player of ordered) {
        const card = deck.pop();
        if (card) hands[player.id].push(card);
      }
    }
    state.deck = deck;
    room.state = state;
    room.status = "playing";
    room.players = ordered.map((p, index) => ({ ...p, seat: index, hand: hands[p.id] ?? [] }));
    await saveRoom(room);
    return NextResponse.json(publicRoom(room, user.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Impossible de lancer la partie." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!redisConfigured) return NextResponse.json({ error: "Redis n'est pas configuré." }, { status: 503 });
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Session introuvable.");
    const { id } = await context.params;
    const room = await getRoom(id);
    if (!room) return NextResponse.json({ ok: true });
    if (!room.players.some((p) => p.id === user.id)) return NextResponse.json({ ok: true });

    if (room.hostId === user.id) {
      room.status = "finished";
      room.state = { ...room.state, status: "finished", winnerId: null, currentPlayerId: null, version: room.state.version + 1 };
      await saveRoom(room);
      return NextResponse.json({ ok: true });
    }

    room.players = room.players.filter((p) => p.id !== user.id);
    if (room.status === "playing") {
      room.state.order = room.players.map((p) => p.id);
      if (room.state.currentPlayerId === user.id) {
        room.state.currentPlayerId = room.players[0]?.id ?? null;
      }
      if (room.players.length < 2) {
        room.status = "finished";
        room.state.status = "finished";
        room.state.currentPlayerId = null;
      }
      room.state.version += 1;
    }
    if (room.status === "waiting") {
      room.players.forEach((p, index) => { p.seat = index; });
    }
    await saveRoom(room);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Impossible de quitter le salon." }, { status: 400 });
  }
}
