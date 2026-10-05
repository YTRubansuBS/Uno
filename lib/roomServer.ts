import { randomBytes } from "node:crypto";
import type { RemoteGameState, UnoCard } from "@/lib/types";
import { redis, redisGet, redisSet } from "@/lib/redis";

export type RedisPlayer = {
  id: string;
  username: string;
  seat: number;
  isHost: boolean;
  hand: UnoCard[];
};

export type RedisRoom = {
  id: string;
  code: string;
  hostId: string;
  status: "waiting" | "playing" | "finished";
  state: RemoteGameState;
  players: RedisPlayer[];
  createdAt: number;
  updatedAt: number;
};

const ROOM_TTL = 60 * 60 * 8;

export function roomKey(id: string) {
  return "uno:room:" + id;
}

export function codeKey(code: string) {
  return "uno:room-code:" + code.toUpperCase();
}

export function createRoomId() {
  return "r_" + randomBytes(12).toString("hex");
}

export function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function getRoom(id: string) {
  return redisGet<RedisRoom>(roomKey(id));
}

export async function getRoomByCode(code: string) {
  if (!redis) return null;
  const roomId = await redis.get<string>(codeKey(code));
  return roomId ? getRoom(roomId) : null;
}

export async function saveRoom(room: RedisRoom) {
  if (!redis) throw new Error("Redis n'est pas configuré.");
  room.updatedAt = Date.now();
  await redisSet(roomKey(room.id), room, { ex: ROOM_TTL });
  await redisSet(codeKey(room.code), room.id, { ex: ROOM_TTL });
}

export function publicRoom(room: RedisRoom, userId: string) {
  return {
    id: room.id,
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    players: room.players.map((p) => ({
      id: p.id,
      username: p.username,
      seat: p.seat,
      cardCount: p.hand.length,
      isHost: p.id === room.hostId
    })),
    state: {
      status: room.state.status,
      version: room.state.version,
      order: room.state.order,
      currentPlayerId: room.state.currentPlayerId,
      direction: room.state.direction,
      discard: room.state.discard,
      currentColor: room.state.currentColor,
      winnerId: room.state.winnerId,
      deck: [],
      deckCount: room.state.deck.length
    },
    hand: room.players.find((p) => p.id === userId)?.hand ?? []
  };
}

export async function acquireRoomLock(roomId: string) {
  if (!redis) return null;
  const token = randomBytes(18).toString("base64url");
  const result = await redis.set("uno:lock:" + roomId, token, { nx: true, ex: 4 });
  return result === "OK" ? token : null;
}

export async function releaseRoomLock(roomId: string, token: string | null) {
  if (!redis || !token) return;
  await redis.del("uno:lock:" + roomId);
}
