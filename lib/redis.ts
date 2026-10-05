import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

export const redisConfigured = Boolean(url && token);
export const redis = redisConfigured ? new Redis({ url, token }) : null;

export async function redisGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  const value = await redis.get<T>(key);
  return value ?? null;
}

export async function redisSet(key: string, value: unknown, options?: Parameters<Redis["set"]>[2]) {
  if (!redis) throw new Error("Redis n'est pas configuré.");
  return redis.set(key, value, options);
}
