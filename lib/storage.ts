import type { LocalAccount } from "@/lib/types";

const KEY = "uno-local-account-v1";

export function getLocalAccount(): LocalAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalAccount;
  } catch {
    return null;
  }
}

export function createLocalAccount(username: string): LocalAccount {
  const safe = username.trim().replace(/\s+/g, " ").slice(0, 20);
  const account: LocalAccount = {
    id: "local-" + crypto.randomUUID(),
    username: safe || "Joueur",
    createdAt: new Date().toISOString(),
    kind: "local"
  };
  window.localStorage.setItem(KEY, JSON.stringify(account));
  return account;
}

export function clearLocalAccount() {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}