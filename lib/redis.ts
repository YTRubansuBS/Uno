import { createClient, type RedisClientType } from "redis";

type RedisOptions = {
  ex?: number;
  nx?: boolean;
};

type RedisAdapter = {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: RedisOptions): Promise<string | null>;
  del(key: string): Promise<number>;
};

const redisUrl = process.env.STORAGE_REDIS_URL || process.env.REDIS_URL || "";

export const redisConfigured = Boolean(redisUrl);

let client: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType> | null = null;

async function getClient() {
  if (!redisUrl) throw new Error("Redis n'est pas configuré.");

  if (client?.isReady) return client;

  if (!client) {
    client = createClient({ url: redisUrl });

    client.on("error", (error) => {
      console.error("[Redis]", error);
    });
  }

  if (!connectPromise) {
    connectPromise = client.connect().then(() => client!);
  }

  return connectPromise;
}

const adapter: RedisAdapter = {
  async get<T>(key: string) {
    const value = await (await getClient()).get(key);
    if (value === null) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  async set(key, value, options) {
    const client = await getClient();
    const serialized = typeof value === "string" ? JSON.stringify(value) : JSON.stringify(value);
    const result = await client.set(key, serialized, {
      ...(options?.ex ? { EX: options.ex } : {}),
      ...(options?.nx ? { NX: true } : {})
    });
    return result;
  },

  async del(key) {
    return (await getClient()).del(key);
  }
};

export const redis = redisConfigured ? adapter : null;

export async function redisGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  return redis.get<T>(key);
}

export async function redisSet(key: string, value: unknown, options?: RedisOptions) {
  if (!redis) throw new Error("Redis n'est pas configuré.");
  return redis.set(key, value, options);
}
