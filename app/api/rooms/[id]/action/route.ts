import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverAuth";
import { redisConfigured } from "@/lib/redis";
import { acquireRoomLock, getRoom, publicRoom, releaseRoomLock, saveRoom } from "@/lib/roomServer";
import { applyRemoteAction } from "@/lib/uno";
import type { RoomAction, UnoCard } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!redisConfigured) return NextResponse.json({ error: "Redis n'est pas configuré." }, { status: 503 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Session introuvable." }, { status: 401 });
  const { id } = await context.params;
  const lock = await acquireRoomLock(id);
  if (!lock) return NextResponse.json({ error: "Action en cours, réessaie." }, { status: 409 });

  try {
    const room = await getRoom(id);
    if (!room) return NextResponse.json({ error: "Salon fermé." }, { status: 404 });
    const player = room.players.find((p) => p.id === user.id);
    if (!player) return NextResponse.json({ error: "Tu n'es plus dans cette partie." }, { status: 403 });
    if (room.status !== "playing") return NextResponse.json(publicRoom(room, user.id), { status: 409 });
    if (room.state.currentPlayerId !== user.id) return NextResponse.json({ error: "Ce n'est pas ton tour." }, { status: 409 });

    const body = await request.json().catch(() => ({}));
    const action: RoomAction = {
      type: body.type,
      userId: user.id,
      cardId: typeof body.cardId === "string" ? body.cardId : undefined,
      cardIds: Array.isArray(body.cardIds) ? body.cardIds.filter((id: unknown): id is string => typeof id === "string") : undefined,
      chosenColor: body.chosenColor
    };

    if (!["play", "draw", "uno"].includes(action.type)) {
      return NextResponse.json({ error: "Action invalide." }, { status: 400 });
    }

    if (action.type === "uno" && player.hand.length !== 1) {
      return NextResponse.json({ error: "Tu peux dire UNO seulement avec 1 carte." }, { status: 400 });
    }

    const hands: Record<string, UnoCard[]> = Object.fromEntries(room.players.map((p) => [p.id, p.hand]));
    const result = applyRemoteAction(room.state, hands, action);
    if (!result) return NextResponse.json({ error: "Coup invalide." }, { status: 400 });

    room.state = result.state;
    room.status = result.state.status;
    room.players = room.players.map((p) => ({
      ...p,
      hand: result.hands[p.id] ?? p.hand
    }));
    await saveRoom(room);
    return NextResponse.json(publicRoom(room, user.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action impossible." }, { status: 400 });
  } finally {
    await releaseRoomLock(id, lock);
  }
}
