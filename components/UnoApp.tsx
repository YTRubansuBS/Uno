"use client";

import { Bot, Clipboard, Copy, Crown, Gamepad2, Globe2, LogIn, Plus, RefreshCw, Sparkles, Users, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import AccountModal from "@/components/AccountModal";
import FriendsModal, { type FriendItem, type FriendSearchItem } from "@/components/FriendsModal";
import { ColorPicker, LocalGameBoard, RemoteGameBoard } from "@/components/GameBoard";
import { applyRemoteAction, createLocalGame, createRemoteState, drawLocal, localPlayableCards, playLocal, publicPlayerCounts, chooseAiCard } from "@/lib/uno";
import { createLocalAccount, clearLocalAccount, getLocalAccount } from "@/lib/storage";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Color, Difficulty, LocalAccount, LocalGame, RemoteGameState, RoomAction, UnoCard } from "@/lib/types";

type View = "home" | "ai" | "create" | "join" | "room" | "remote";
type NoticeKind = "info" | "success" | "error";
type Notice = { kind: NoticeKind; text: string } | null;
type Room = { id: string; code: string; host_id: string; status: "waiting" | "playing" | "finished"; state: RemoteGameState; settings: { maxPlayers?: number } };
type PlayerRow = { id: string; room_id: string; user_id: string; username: string; seat: number; card_count: number; ready: boolean };
type FriendRowDb = { id: string; requester_id: string; addressee_id: string; status: "pending" | "accepted" | "blocked" };

const emptyState: RemoteGameState = { status: "waiting", version: 0, order: [], currentPlayerId: null, direction: 1, deck: [], discard: [], currentColor: null, winnerId: null };

function code6() { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]; return s; }
function errText(error: unknown) { return error && typeof error === "object" && "message" in error ? String((error as { message?: unknown }).message || "Erreur") : "Erreur inconnue"; }
function dLabel(d: Difficulty) { return d === "easy" ? "Facile" : d === "normal" ? "Normal" : "Difficile"; }

export default function UnoApp() {
  const [view, setView] = useState<View>("home");
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [local, setLocal] = useState<LocalAccount | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [aiCount, setAiCount] = useState(3);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [localGame, setLocalGame] = useState<LocalGame | null>(null);
  const [localWild, setLocalWild] = useState<UnoCard | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [remoteHand, setRemoteHand] = useState<UnoCard[]>([]);
  const [remoteWild, setRemoteWild] = useState<UnoCard | null>(null);
  const [joiningCode, setJoiningCode] = useState("");
  const [movePending, setMovePending] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [friendResults, setFriendResults] = useState<FriendSearchItem[]>([]);
  const [friendItems, setFriendItems] = useState<FriendItem[]>([]);
  const [friendBusy, setFriendBusy] = useState(false);
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);
  const queueRef = useRef(Promise.resolve());
  const lockedActions = useRef(new Set<string>());
  const roomRef = useRef<Room | null>(null);
  const gameRef = useRef<LocalGame | null>(null);

  const online = Boolean(isSupabaseConfigured && supabase);
  const display = user ? name || user.user_metadata?.username || "Joueur" : local?.username || "Invité";
  const remoteTurn = Boolean(room && user && room.status === "playing" && room.state.currentPlayerId === user.id);

  useEffect(() => {
    const localTimer = window.setTimeout(() => setLocal(getLocalAccount()), 0);
    if (!supabase) return () => window.clearTimeout(localTimer);
    supabase.auth.getSession().then(async ({ data }) => { setUser(data.session?.user ?? null); if (data.session?.user) await loadProfile(data.session.user); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); if (session?.user) void loadProfile(session.user); else setName(""); });
    return () => { window.clearTimeout(localTimer); listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => { gameRef.current = localGame; }, [localGame]);
  useEffect(() => { roomRef.current = room; }, [room]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("room");
      if (code) { setJoiningCode(code.toUpperCase().slice(0, 6)); setView("join"); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!localGame || localGame.status !== "playing") return;
    const current = localGame.players[localGame.currentPlayerIndex];
    if (!current?.isAI) return;
    const timer = window.setTimeout(() => {
      const currentGame = gameRef.current; if (!currentGame || currentGame.status !== "playing") return;
      const ai = currentGame.players[currentGame.currentPlayerIndex]; if (!ai?.isAI) return;
      const pick = chooseAiCard(currentGame, ai.id); setLocalGame(pick.card ? playLocal(currentGame, ai.id, pick.card.id, pick.color) : drawLocal(currentGame, ai.id));
    }, difficulty === "hard" ? 700 : 1000);
    return () => window.clearTimeout(timer);
  }, [localGame, difficulty]);

  useEffect(() => {
    if (!room || !supabase) return;
    const channel = supabase.channel("uno-room-" + room.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: "id=eq." + room.id }, () => void refreshRoom(room.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: "room_id=eq." + room.id }, () => void refreshRoom(room.id))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_actions", filter: "room_id=eq." + room.id }, (payload) => { if (user?.id === roomRef.current?.host_id) { const id = String((payload.new as { id: string }).id); queueRef.current = queueRef.current.then(() => processAction(id)).catch(() => undefined); } })
      .subscribe();
    channelRef.current = channel;
    if (user?.id === room.host_id) void queuePending(room.id);
    return () => { if (supabase && channelRef.current) void supabase.removeChannel(channelRef.current); channelRef.current = null; };
  // The room subscription intentionally keys off room id/status/user id; callbacks use current refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id, room?.status, user?.id]);

  function tell(text: string, kind: NoticeKind = "info") { setNotice({ text, kind }); window.setTimeout(() => setNotice(null), 3500); }

  async function loadProfile(u: User) {
    if (!supabase) return;
    const { data } = await supabase.from("profiles").select("username").eq("id", u.id).maybeSingle();
    if (data?.username) { setName(data.username); return; }
    const base = String(u.user_metadata?.username || "player").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 16) || "player";
    const value = base + "_" + u.id.slice(0, 4);
    await supabase.from("profiles").upsert({ id: u.id, username: value, display_name: value }, { onConflict: "id" });
    setName(value);
  }

  async function submitAuth() {
    if (!supabase) return;
    setAuthBusy(true);
    try {
      if (authMode === "signup") {
        const pseudo = authUsername.trim().replace(/\s+/g, " ").slice(0, 20); if (!pseudo) throw new Error("Choisis un pseudo.");
        const exists = await supabase.from("profiles").select("id").eq("username", pseudo).maybeSingle(); if (exists.data) throw new Error("Pseudo déjà utilisé.");
        const result = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { username: pseudo } } });
        if (result.error) throw result.error;
        if (!result.data.session) tell("Compte créé. Vérifie ton e-mail si Supabase demande une confirmation.", "success"); else tell("Compte créé.", "success");
      } else { const result = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (result.error) throw result.error; tell("Connexion réussie.", "success"); }
      setAuthOpen(false);
    } catch (error) { tell(errText(error), "error"); } finally { setAuthBusy(false); }
  }

  function useLocal() { const chosen = window.prompt("Ton pseudo local", local?.username || ""); if (chosen === null) return; void supabase?.auth.signOut(); const account = createLocalAccount(chosen); setLocal(account); setUser(null); setAuthOpen(false); tell("Compte local activé.", "success"); }
  function resetLocal() { clearLocalAccount(); setLocal(null); tell("Compte local supprimé.", "success"); }
  async function logout() { if (room && user) await leaveRoom(); if (supabase) await supabase.auth.signOut(); setUser(null); setName(""); setFriendsOpen(false); setView("home"); tell("Déconnecté.", "success"); }

  function startAi() { setLocalGame(createLocalGame(display, aiCount, difficulty)); setView("ai"); setLocalWild(null); }
  function playLocalCard(card: UnoCard) {
    if (!localGame || localGame.players[localGame.currentPlayerIndex]?.id !== "human") return;
    if (!localPlayableCards(localGame, "human").some((c) => c.id === card.id)) { tell("Carte impossible à jouer.", "error"); return; }
    if (card.kind === "wild" || card.kind === "wild4") setLocalWild(card); else setLocalGame(playLocal(localGame, "human", card.id));
  }
  function pickLocalColor(color: Color) { if (!localGame || !localWild) return; setLocalGame(playLocal(localGame, "human", localWild.id, color)); setLocalWild(null); }

  async function createRoom() {
    if (!supabase || !user) { setAuthOpen(true); tell("Connecte-toi pour créer un salon.", "info"); return; }
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = code6();
      const result = await supabase.from("rooms").insert({ code, host_id: user.id, status: "waiting", state: emptyState, settings: { maxPlayers: 4 } }).select("id, code, host_id, status, state, settings").single();
      if (result.error?.code === "23505") continue;
      if (result.error) { tell(result.error.message, "error"); return; }
      const roomRow = result.data as Room;
      const player = await supabase.from("room_players").insert({ room_id: roomRow.id, user_id: user.id, username: display, seat: 0, card_count: 0, ready: true });
      const hand = await supabase.from("room_hands").insert({ room_id: roomRow.id, user_id: user.id, hand: [] });
      if (player.error || hand.error) { await supabase.from("rooms").delete().eq("id", roomRow.id); tell(player.error?.message || hand.error?.message || "Création impossible.", "error"); return; }
      await refreshRoom(roomRow.id); tell("Salon créé : " + code, "success"); return;
    }
    tell("Impossible de générer un code.", "error");
  }

  async function joinRoom() {
    if (!supabase || !user) { setAuthOpen(true); tell("Connecte-toi pour rejoindre un salon.", "info"); return; }
    const code = joiningCode.trim().toUpperCase(); if (!/^[A-Z0-9]{6}$/.test(code)) { tell("Code invalide : 6 caractères.", "error"); return; }
    const result = await supabase.from("rooms").select("id, code, host_id, status, state, settings").eq("code", code).maybeSingle();
    if (result.error) { tell(result.error.message, "error"); return; } if (!result.data) { tell("Salon introuvable.", "error"); return; }
    const target = result.data as Room; if (target.status !== "waiting") { tell("Cette partie a déjà commencé.", "error"); return; }
    const members = await supabase.from("room_players").select("id, room_id, user_id, username, seat, card_count, ready").eq("room_id", target.id).order("seat");
    if (members.error) { tell(members.error.message, "error"); return; }
    if ((members.data || []).some((p) => p.user_id === user.id)) { await refreshRoom(target.id); return; }
    const rows = (members.data || []) as PlayerRow[]; if (rows.length >= (target.settings.maxPlayers || 4)) { tell("Salon complet.", "error"); return; }
    const seat = rows.length ? Math.max(...rows.map((p) => p.seat)) + 1 : 0;
    const player = await supabase.from("room_players").insert({ room_id: target.id, user_id: user.id, username: display, seat, card_count: 0, ready: true });
    if (player.error) { tell(player.error.message, "error"); return; }
    const hand = await supabase.from("room_hands").insert({ room_id: target.id, user_id: user.id, hand: [] });
    if (hand.error) { await supabase.from("room_players").delete().eq("room_id", target.id).eq("user_id", user.id); tell(hand.error.message, "error"); return; }
    await refreshRoom(target.id); tell("Tu as rejoint " + code + ".", "success");
  }

  async function refreshRoom(roomId: string) {
    if (!supabase || !user) return;
    const [r, p, h] = await Promise.all([
      supabase.from("rooms").select("id, code, host_id, status, state, settings").eq("id", roomId).maybeSingle(),
      supabase.from("room_players").select("id, room_id, user_id, username, seat, card_count, ready").eq("room_id", roomId).order("seat"),
      supabase.from("room_hands").select("hand").eq("room_id", roomId).eq("user_id", user.id).maybeSingle()
    ]);
    if (r.error) { tell(r.error.message, "error"); return; } if (!r.data) { setRoom(null); setView("home"); return; }
    const nextRoom = r.data as Room; setRoom(nextRoom); roomRef.current = nextRoom; setPlayers((p.data || []) as PlayerRow[]); setRemoteHand((h.data?.hand || []) as UnoCard[]); setMovePending(false); setView(nextRoom.status === "waiting" ? "room" : "remote");
  }

  async function startRoom() {
    if (!supabase || !user || !room || room.host_id !== user.id || players.length < 2) { if (players.length < 2) tell("Il faut au moins 2 joueurs.", "error"); return; }
    const ordered = [...players].sort((a, b) => a.seat - b.seat);
    const state = createRemoteState(ordered.map((p) => ({ id: p.user_id })));
    const hands: Record<string, UnoCard[]> = Object.fromEntries(ordered.map((p) => [p.user_id, []]));
    let deck = [...state.deck];
    for (let round = 0; round < 7; round++) for (const p of ordered) { const card = deck.pop(); if (card) hands[p.user_id].push(card); }
    state.deck = deck;
    const handRows = ordered.map((p) => ({ room_id: room.id, user_id: p.user_id, hand: hands[p.user_id] }));
    const hr = await supabase.from("room_hands").upsert(handRows, { onConflict: "room_id,user_id" }); if (hr.error) { tell(hr.error.message, "error"); return; }
    const pr = await supabase.from("room_players").upsert(ordered.map((p) => ({ ...p, card_count: hands[p.user_id].length })), { onConflict: "room_id,user_id" }); if (pr.error) { tell(pr.error.message, "error"); return; }
    const rr = await supabase.from("rooms").update({ status: "playing", state }).eq("id", room.id).eq("host_id", user.id); if (rr.error) { tell(rr.error.message, "error"); return; }
    await refreshRoom(room.id);
  }

  async function submitAction(action: Omit<RoomAction, "userId">) {
    if (!supabase || !user || !room || !remoteTurn || movePending) return; setMovePending(true);
    const result = await supabase.from("room_actions").insert({ room_id: room.id, user_id: user.id, action: { ...action, userId: user.id } });
    if (result.error) { setMovePending(false); tell(result.error.message, "error"); }
  }

  async function processAction(actionId: string) {
    if (!supabase || !user || !roomRef.current || lockedActions.current.has(actionId)) return;
    lockedActions.current.add(actionId);
    try {
      const actionRow = await supabase.from("room_actions").select("id, room_id, user_id, action, processed_at").eq("id", actionId).maybeSingle();
      if (actionRow.error || !actionRow.data || actionRow.data.processed_at) return;
      const [rr, hh, pp] = await Promise.all([
        supabase.from("rooms").select("id, code, host_id, status, state, settings").eq("id", actionRow.data.room_id).single(),
        supabase.from("room_hands").select("user_id, hand").eq("room_id", actionRow.data.room_id),
        supabase.from("room_players").select("id, room_id, user_id, username, seat, card_count, ready").eq("room_id", actionRow.data.room_id).order("seat")
      ]);
      if (rr.error || hh.error || pp.error) return; const latest = rr.data as Room; if (latest.host_id !== user.id || latest.status !== "playing") return;
      const hands: Record<string, UnoCard[]> = {}; for (const row of hh.data || []) hands[row.user_id] = (row.hand || []) as UnoCard[];
      const action = actionRow.data.action as RoomAction; const result = applyRemoteAction(latest.state, hands, action);
      if (!result) { await supabase.from("room_actions").update({ processed_at: new Date().toISOString() }).eq("id", actionId); return; }
      const counts = publicPlayerCounts(result.state.order, result.hands);
      const upHand = await supabase.from("room_hands").upsert(result.state.order.map((id) => ({ room_id: latest.id, user_id: id, hand: result.hands[id] || [] })), { onConflict: "room_id,user_id" }); if (upHand.error) return;
      const upPlayers = await supabase.from("room_players").upsert((pp.data || []).map((p) => ({ ...p, card_count: counts[p.user_id] || 0 })), { onConflict: "room_id,user_id" }); if (upPlayers.error) return;
      const upRoom = await supabase.from("rooms").update({ status: result.state.status, state: result.state }).eq("id", latest.id).eq("host_id", user.id); if (upRoom.error) return;
      await supabase.from("room_actions").update({ processed_at: new Date().toISOString() }).eq("id", actionId); await refreshRoom(latest.id);
    } finally { lockedActions.current.delete(actionId); }
  }

  async function queuePending(roomId: string) {
    if (!supabase || !user || user.id !== roomRef.current?.host_id) return;
    const rows = await supabase.from("room_actions").select("id").eq("room_id", roomId).is("processed_at", null).order("created_at");
    for (const row of rows.data || []) queueRef.current = queueRef.current.then(() => processAction(row.id)).catch(() => undefined);
  }

  async function leaveRoom() {
    if (!supabase || !user || !room) return;
    if (room.host_id === user.id) await supabase.from("rooms").update({ status: "finished", state: { ...room.state, status: "finished", winnerId: null, version: room.state.version + 1 } }).eq("id", room.id);
    else { await supabase.from("room_players").delete().eq("room_id", room.id).eq("user_id", user.id); await supabase.from("room_hands").delete().eq("room_id", room.id).eq("user_id", user.id); }
    if (supabase && channelRef.current) await supabase.removeChannel(channelRef.current); setRoom(null); setPlayers([]); setRemoteHand([]); setView("home");
  }

  async function copy(text: string) { try { await navigator.clipboard.writeText(text); tell("Copié.", "success"); } catch { tell(text, "info"); } }

  async function loadFriends() {
    if (!supabase || !user) return;
    const rows = await supabase.from("friendships").select("id, requester_id, addressee_id, status").or("requester_id.eq." + user.id + ",addressee_id.eq." + user.id);
    if (rows.error) { tell(rows.error.message, "error"); return; }
    const list = (rows.data || []) as FriendRowDb[]; const ids = Array.from(new Set(list.flatMap((r) => [r.requester_id, r.addressee_id]).filter((id) => id !== user.id)));
    const profiles = ids.length ? await supabase.from("profiles").select("id, username, display_name").in("id", ids) : { data: [] };
    const map = new Map((profiles.data || []).map((p) => [p.id, p]));
    setFriendItems(list.map((r) => { const id = r.requester_id === user.id ? r.addressee_id : r.requester_id; const p = map.get(id) || { id, username: "joueur", display_name: null }; return { ...p, friendshipId: r.id, incoming: r.addressee_id === user.id, status: r.status }; }));
  }
  async function searchFriends() { if (!supabase || !user || !friendSearch.trim()) return; setFriendBusy(true); const r = await supabase.from("profiles").select("id, username, display_name").ilike("username", "%" + friendSearch.trim() + "%").neq("id", user.id).limit(8); setFriendBusy(false); if (r.error) tell(r.error.message, "error"); else setFriendResults((r.data || []) as FriendSearchItem[]); }
  async function addFriend(item: FriendSearchItem) { if (!supabase || !user) return; const r = await supabase.from("friendships").insert({ requester_id: user.id, addressee_id: item.id, status: "pending" }); if (r.error?.code === "23505") tell("Demande déjà présente.", "info"); else if (r.error) tell(r.error.message, "error"); else { tell("Demande envoyée.", "success"); await loadFriends(); } }
  async function acceptFriend(id: string) { if (!supabase || !user) return; const r = await supabase.from("friendships").update({ status: "accepted" }).eq("id", id).eq("addressee_id", user.id); if (r.error) tell(r.error.message, "error"); else await loadFriends(); }
  async function removeFriend(id: string) { if (!supabase) return; const r = await supabase.from("friendships").delete().eq("id", id); if (r.error) tell(r.error.message, "error"); else await loadFriends(); }

  return <main className="app-shell">
    <div className="ambient ambient-red"/> <div className="ambient ambient-yellow"/> <div className="ambient ambient-blue"/>
    <header className="topbar">
      <button className="brand" onClick={() => setView("home")}><span className="brand-mark">U</span><span><strong>UNO</strong><small>ONLINE</small></span></button>
      <div className="topbar-actions">{user ? <><button className="ghost-btn compact" onClick={() => { setFriendsOpen(true); void loadFriends(); }}><Users size={17}/> Amis</button><button className="account-chip" onClick={() => setAuthOpen(true)}><span className="avatar">{display.slice(0,1).toUpperCase()}</span>@{display}</button></> : <button className="ghost-btn compact" onClick={() => setAuthOpen(true)}>Compte</button>}</div>
    </header>
    {notice && <div className={"notice notice-" + notice.kind}>{notice.text}<button onClick={() => setNotice(null)}><X size={15}/></button></div>}

    {view === "home" && <section className="home-view"><div className="hero-copy"><div className="eyebrow"><Sparkles size={14}/> UNO, SIMPLE ET PROPRE</div><h1>Le bon moment pour dire <span>UNO.</span></h1><p>Joue solo contre une IA à ton niveau ou retrouve tes potes dans un salon privé avec un code.</p><div className="hero-actions"><button className="primary-btn" onClick={() => setView("ai")}><Bot size={19}/> Jouer contre l IA</button><button className="secondary-btn" onClick={() => setView("create")} disabled={!online}><Plus size={19}/> Créer un salon</button><button className="secondary-btn" onClick={() => setView("join")} disabled={!online}><LogIn size={19}/> Rejoindre</button></div>{!online && <div className="config-banner"><Globe2 size={17}/> Mode local actif. Configure Supabase pour le multijoueur et les amis.</div>}</div><div className="hero-table"><div className="table-glow"/><div className="hero-card-stack"><div className="fake-card red">7</div><div className="fake-card blue">↻</div><div className="fake-card wild">+4</div></div><div className="table-caption"><Gamepad2 size={17}/> Partie prête à jouer</div></div><div className="feature-strip"><div><Bot size={19}/><b>3 niveaux IA</b><span>Facile · Normal · Difficile</span></div><div><Globe2 size={19}/><b>Salons privés</b><span>Code + lien d invite</span></div><div><Users size={19}/><b>Amis</b><span>Recherche par pseudo</span></div><div><Zap size={19}/><b>Local</b><span>Sans compte</span></div></div></section>}

    {view === "ai" && !localGame && <section className="game-page"><div className="center-panel"><button className="back-link" onClick={() => setView("home")}>← Accueil</button><div className="panel-icon"><Bot size={25}/></div><h2>Contre l IA</h2><p>Choisis tes adversaires.</p><div className="field-block"><label>Nombre d IA</label><div className="segmented">{[1,2,3].map((n) => <button key={n} className={aiCount===n?"selected":""} onClick={() => setAiCount(n)}>{n}</button>)}</div></div><div className="field-block"><label>Difficulté</label><div className="segmented">{(["easy","normal","hard"] as Difficulty[]).map((d) => <button key={d} className={difficulty===d?"selected":""} onClick={() => setDifficulty(d)}>{dLabel(d)}</button>)}</div></div><button className="primary-btn full" onClick={startAi}><Bot size={18}/> Lancer la partie</button></div></section>}
    {view === "ai" && localGame && <LocalGameBoard game={localGame} pendingWild={localWild} onCard={playLocalCard} onDraw={() => { if (localGame.players[localGame.currentPlayerIndex]?.id === "human") setLocalGame(drawLocal(localGame, "human")); }} onColor={pickLocalColor} onBack={() => { setLocalGame(null); setView("home"); }} onRestart={startAi}/>}

    {view === "create" && <section className="game-page"><div className="center-panel"><button className="back-link" onClick={() => setView("home")}>← Accueil</button><div className="panel-icon"><Plus size={25}/></div><h2>Créer un salon</h2><p>Jusqu’à 4 joueurs. Tu es l hôte.</p>{user ? <button className="primary-btn full" onClick={() => void createRoom()}><Plus size={18}/> Créer le salon</button> : <button className="primary-btn full" onClick={() => setAuthOpen(true)}>Se connecter</button>}</div></section>}
    {view === "join" && <section className="game-page"><div className="center-panel"><button className="back-link" onClick={() => setView("home")}>← Accueil</button><div className="panel-icon"><LogIn size={25}/></div><h2>Rejoindre</h2><p>Entre le code de 6 caractères.</p><input className="big-code-input" value={joiningCode} maxLength={6} onChange={(e) => setJoiningCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="ABC123"/>{user ? <button className="primary-btn full" onClick={() => void joinRoom()}><LogIn size={18}/> Rejoindre</button> : <button className="primary-btn full" onClick={() => setAuthOpen(true)}>Se connecter</button>}</div></section>}

    {view === "room" && room && <section className="game-page"><div className="room-panel"><div className="panel-head"><button className="back-link" onClick={() => void leaveRoom()}>← Quitter</button><div className="room-code-card"><small>CODE</small><strong>{room.code}</strong><div><button onClick={() => void copy(room.code)}><Copy size={15}/></button><button onClick={() => void copy(window.location.origin + "?room=" + room.code)}><Clipboard size={15}/></button></div></div></div><div className="room-main"><div><div className="eyebrow"><Users size={14}/> SALON PRIVÉ</div><h2>On attend tes potes.</h2><p>Envoie le code ou le lien.</p><div className="player-list">{[0,1,2,3].map((seat) => { const p = players.find((x) => x.seat === seat); return <div className={"player-slot " + (p ? "filled" : "")} key={seat}>{p ? <><span className="slot-avatar">{p.username.slice(0,1).toUpperCase()}</span><span><b>@{p.username}</b><small>{p.user_id===room.host_id?"Hôte":"Joueur"}</small></span>{p.user_id===room.host_id&&<Crown size={16}/>}</> : <><span className="slot-empty">+</span><span><b>En attente</b><small>Place {seat+1}</small></span></>}</div>; })}</div></div><div className="room-side">{room.host_id===user?.id?<button className="primary-btn full" onClick={() => void startRoom()} disabled={players.length<2}><Crown size={18}/> Lancer la partie</button>:<div className="waiting-box"><RefreshCw size={18}/><b>En attente de l hôte</b><span>Le créateur lancera la partie.</span></div>}</div></div></div></section>}

    {view === "remote" && room && user && <RemoteGameBoard roomState={room.state} players={players} hand={remoteHand} isTurn={remoteTurn} pending={movePending} pendingWild={remoteWild} winnerName={room.state.winnerId ? (players.find((p) => p.user_id === room.state.winnerId)?.username || null) : null} onPlay={(card) => { if (!remoteTurn || movePending) return; if (card.kind === "wild" || card.kind === "wild4") setRemoteWild(card); else void submitAction({ type: "play", cardId: card.id }); }} onColor={(color) => { if (!remoteWild) return; const card = remoteWild; setRemoteWild(null); void submitAction({ type: "play", cardId: card.id, chosenColor: color }); }} onDraw={() => void submitAction({ type: "draw" })} onUno={() => void submitAction({ type: "uno" })} onLeave={() => void leaveRoom()} onHome={() => { setRoom(null); setPlayers([]); setRemoteHand([]); setView("home"); }}/>}

    <AccountModal open={authOpen} mode={authMode} setMode={setAuthMode} email={email} setEmail={setEmail} password={password} setPassword={setPassword} username={authUsername} setUsername={setAuthUsername} busy={authBusy} canOnline={online} user={user} localUsername={local?.username || null} onSubmit={() => void submitAuth()} onLocal={useLocal} onLogout={() => void logout()} onResetLocal={resetLocal} onClose={() => setAuthOpen(false)}/>
    <FriendsModal open={friendsOpen} search={friendSearch} setSearch={setFriendSearch} results={friendResults} friends={friendItems} busy={friendBusy} onSearch={() => void searchFriends()} onAdd={(item) => void addFriend(item)} onAccept={(id) => void acceptFriend(id)} onRemove={(id) => void removeFriend(id)} onClose={() => setFriendsOpen(false)}/>
  </main>;
}