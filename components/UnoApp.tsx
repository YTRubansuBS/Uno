"use client";

import { Bot, Copy, Gamepad2, Globe2, LogIn, Plus, Sparkles, Users, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AccountModal from "@/components/AccountModal";
import { ColorPicker, LocalGameBoard, RemoteGameBoard } from "@/components/GameBoard";
import { chooseAiCard, createLocalGame, drawLocal, localPlayableCards, playLocal, playLocalCards } from "@/lib/uno";
import { clearLocalAccount, createLocalAccount, getLocalAccount } from "@/lib/storage";
import type { Color, Difficulty, LocalAccount, LocalGame, RemoteGameState, UnoCard } from "@/lib/types";

type View = "home" | "ai" | "create" | "join" | "room" | "remote";
type Notice = { kind: "info" | "success" | "error"; text: string } | null;
type SessionUser = { id: string; username: string; kind: "account" | "guest" };
type RoomPlayer = { id: string; username: string; seat: number; cardCount: number; isHost: boolean };
type PublicRoom = {
  id: string;
  code: string;
  hostId: string;
  status: "waiting" | "playing" | "finished";
  players: RoomPlayer[];
  state: RemoteGameState & { deckCount?: number };
  hand: UnoCard[];
};

function dLabel(d: Difficulty) {
  return d === "easy" ? "Facile" : d === "normal" ? "Normal" : "Difficile";
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(data.error || "Erreur serveur."));
  return data as T;
}

export default function UnoApp() {
  const [view, setView] = useState<View>("home");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [local, setLocal] = useState<LocalAccount | null>(null);
  const [redisReady, setRedisReady] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [aiCount, setAiCount] = useState(2);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [localGame, setLocalGame] = useState<LocalGame | null>(null);
  const [localWild, setLocalWild] = useState<UnoCard | null>(null);

  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [joiningCode, setJoiningCode] = useState("");
  const [remoteWild, setRemoteWild] = useState<UnoCard | null>(null);
  const [movePending, setMovePending] = useState(false);
  const gameRef = useRef<LocalGame | null>(null);

  const display = user?.username || local?.username || "Invité";
  const remoteTurn = Boolean(user && room?.status === "playing" && room.state.currentPlayerId === user.id);
  const inGame = Boolean((view === "ai" && localGame) || view === "remote");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = getLocalAccount();
      if (saved) setLocal(saved);
    }, 0);

    void apiJson<{ configured: boolean; user: SessionUser | null }>("/api/auth")
      .then((data) => { setRedisReady(data.configured); setUser(data.user); })
      .catch(() => setRedisReady(false));

    const code = new URLSearchParams(window.location.search).get("room");
    if (code) {
      window.setTimeout(() => {
        setJoiningCode(code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
        setView("join");
      }, 0);
    }
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => { gameRef.current = localGame; }, [localGame]);

  useEffect(() => {
    if (!localGame || localGame.status !== "playing") return;
    const current = localGame.players[localGame.currentPlayerIndex];
    if (!current?.isAI) return;
    const timer = window.setTimeout(() => {
      const game = gameRef.current;
      if (!game || game.status !== "playing") return;
      const ai = game.players[game.currentPlayerIndex];
      if (!ai?.isAI) return;
      const pick = chooseAiCard(game, ai.id);
      setLocalGame(pick.card ? playLocal(game, ai.id, pick.card.id, pick.color) : drawLocal(game, ai.id));
    }, difficulty === "hard" ? 650 : difficulty === "normal" ? 850 : 1050);
    return () => window.clearTimeout(timer);
  }, [localGame, difficulty]);

  useEffect(() => {
    if ((view !== "remote" && view !== "room") || !room?.id) return;
    const timer = window.setInterval(() => {
      void refreshRoom(room.id, true);
    }, 700);
    return () => window.clearInterval(timer);
    // Polling intentionally calls the latest refreshRoom function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, room?.id]);

  function tell(text: string, kind: "info" | "success" | "error" = "info") {
    setNotice({ text, kind });
    window.setTimeout(() => setNotice(null), 3200);
  }

  async function ensureServerUser() {
    if (user) return user;
    const result = await apiJson<{ user: SessionUser }>("/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "guest", username: display })
    });
    setUser(result.user);
    setRedisReady(true);
    return result.user;
  }

  async function submitAuth() {
    setAuthBusy(true);
    try {
      const result = await apiJson<{ user: SessionUser }>("/api/auth", {
        method: "POST",
        body: JSON.stringify({
          action: authMode,
          username: authUsername,
          password: authPassword
        })
      });
      setUser(result.user);
      setAuthOpen(false);
      setAuthPassword("");
      tell(authMode === "signup" ? "Compte créé." : "Connexion réussie.", "success");
    } catch (error) {
      tell(error instanceof Error ? error.message : "Impossible de se connecter.", "error");
    } finally {
      setAuthBusy(false);
    }
  }

  async function activateLocal() {
    const chosen = window.prompt("Ton pseudo", local?.username || "Joueur");
    if (chosen === null) return;
    const account = createLocalAccount(chosen);
    setLocal(account);
    setUser(null);
    setAuthOpen(false);
    tell("Compte local activé.", "success");
  }

  function resetLocal() {
    clearLocalAccount();
    setLocal(null);
    tell("Compte local supprimé.", "success");
  }

  async function logout() {
    if (room) await leaveRoom();
    try { await apiJson<{ ok: boolean }>("/api/auth", { method: "POST", body: JSON.stringify({ action: "logout" }) }); } catch {}
    setUser(null);
    setAuthOpen(false);
    setView("home");
    tell("Déconnecté.", "success");
  }

  function startAi() {
    setLocalGame(createLocalGame(display, aiCount, difficulty));
    setLocalWild(null);
    setView("ai");
  }

  function playLocalCard(card: UnoCard) {
    if (!localGame || localGame.players[localGame.currentPlayerIndex]?.id !== "human") return;
    if (!localPlayableCards(localGame, "human").some((item) => item.id === card.id)) {
      tell("Tu ne peux pas jouer cette carte.", "error");
      return;
    }
    if (card.kind === "wild" || card.kind === "wild4") {
      setLocalWild(card);
      return;
    }
    const doubles = localGame.players.find((p) => p.id === "human")?.hand.filter(
      (item) => item.id !== card.id && item.kind === "number" && item.value === card.value
    ) ?? [];
    if (card.kind === "number" && doubles.length > 0) {
      setLocalGame(playLocalCards(localGame, "human", [card.id, doubles[0].id]));
    } else {
      setLocalGame(playLocal(localGame, "human", card.id));
    }
  }

  function pickLocalColor(color: Color) {
    if (!localGame || !localWild) return;
    setLocalGame(playLocal(localGame, "human", localWild.id, color));
    setLocalWild(null);
  }

  function applyRoom(data: PublicRoom) {
    setRoom(data);
    setMovePending(false);
    setRemoteWild(null);
    setView(data.status === "waiting" ? "room" : "remote");
  }

  async function createRoom() {
    try {
      await ensureServerUser();
      const data = await apiJson<PublicRoom>("/api/rooms", {
        method: "POST",
        body: JSON.stringify({ username: display })
      });
      applyRoom(data);
      tell("Salon créé. Envoie le code.", "success");
    } catch (error) {
      tell(error instanceof Error ? error.message : "Création impossible.", "error");
    }
  }

  async function joinRoom() {
    const code = joiningCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      tell("Le code doit contenir 6 caractères.", "error");
      return;
    }
    try {
      await ensureServerUser();
      const result = await apiJson<PublicRoom>("/api/rooms", {
        method: "POST",
        body: JSON.stringify({ action: "join", code, username: display })
      });
      applyRoom(result);
      tell("Salon rejoint.", "success");
    } catch (error) {
      tell(error instanceof Error ? error.message : "Impossible de rejoindre.", "error");
    }
  }

  async function refreshRoom(roomId: string, silent = false) {
    try {
      const data = await apiJson<PublicRoom>("/api/rooms/" + roomId);
      applyRoom(data);
    } catch (error) {
      if (!silent) tell(error instanceof Error ? error.message : "Salon introuvable.", "error");
    }
  }

  async function startRoom() {
    if (!room) return;
    try {
      const data = await apiJson<PublicRoom>("/api/rooms/" + room.id, {
        method: "POST",
        body: JSON.stringify({ action: "start" })
      });
      applyRoom(data);
    } catch (error) {
      tell(error instanceof Error ? error.message : "Impossible de lancer la partie.", "error");
    }
  }

  async function submitAction(action: { type: "play" | "draw" | "uno"; cardId?: string; cardIds?: string[]; chosenColor?: Color }) {
    if (!room || !user || !remoteTurn || movePending) return;
    setMovePending(true);
    try {
      const data = await apiJson<PublicRoom>("/api/rooms/" + room.id + "/action", {
        method: "POST",
        body: JSON.stringify(action)
      });
      applyRoom(data);
    } catch (error) {
      setMovePending(false);
      tell(error instanceof Error ? error.message : "Action impossible.", "error");
    }
  }

  async function leaveRoom() {
    if (!room) return;
    try { await apiJson<{ ok: boolean }>("/api/rooms/" + room.id, { method: "DELETE" }); } catch {}
    setRoom(null);
    setMovePending(false);
    setRemoteWild(null);
    setView("home");
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      tell("Copié.", "success");
    } catch {
      tell(value);
    }
  }

  return <main className={"app-shell " + (inGame ? "app-in-game" : "")}>
    {!inGame && <>
      <div className="ambient ambient-red" />
      <div className="ambient ambient-yellow" />
      <div className="ambient ambient-blue" />
      <header className="topbar">
        <button className="brand" onClick={() => setView("home")}>
          <span className="brand-mark">U</span>
          <span><strong>UNO</strong><small>ONLINE</small></span>
        </button>
        <div className="topbar-actions">
          {user ? (
            <button className="account-chip" onClick={() => setAuthOpen(true)}>
              <span className="avatar">{display.slice(0, 1).toUpperCase()}</span>@{display}
            </button>
          ) : (
            <button className="ghost-btn compact" onClick={() => setAuthOpen(true)}>Compte</button>
          )}
        </div>
      </header>
    </>}

    {notice && <div className={"notice notice-" + notice.kind}>{notice.text}<button onClick={() => setNotice(null)}><X size={15} /></button></div>}

    {view === "home" && <section className="home-view">
      <div className="hero-copy">
        <div className="eyebrow"><Sparkles size={14} /> UNO SIMPLE</div>
        <h1>Joue. Pose. <span>UNO.</span></h1>
        <p>Une partie solo contre l’IA ou un salon privé avec tes potes. Rien de compliqué.</p>
        <div className="hero-actions">
          <button className="primary-btn" onClick={() => setView("ai")}><Bot size={19} /> Jouer contre l’IA</button>
          <button className="secondary-btn" onClick={() => setView("create")}><Plus size={19} /> Créer un salon</button>
          <button className="secondary-btn" onClick={() => setView("join")}><LogIn size={19} /> Rejoindre</button>
        </div>
        <div className={"config-banner " + (redisReady ? "ready" : "")}>
          <Globe2 size={16} />
          {redisReady ? "Multijoueur prêt avec Redis." : "Le multijoueur sera prêt dès que Redis est connecté sur Vercel."}
        </div>
      </div>
      <div className="hero-table">
        <div className="table-glow" />
        <div className="hero-card-stack">
          <div className="fake-card red">7</div>
          <div className="fake-card blue">↻</div>
          <div className="fake-card wild">+4</div>
        </div>
        <div className="table-caption"><Gamepad2 size={17} /> Partie instantanée</div>
      </div>
      <div className="feature-strip">
        <div><Bot size={19} /><b>IA</b><span>Facile · Normal · Difficile</span></div>
        <div><Globe2 size={19} /><b>Salon</b><span>Un code à partager</span></div>
        <div><Users size={19} /><b>4 joueurs</b><span>Toi + 3 amis</span></div>
        <div><Zap size={19} /><b>Local</b><span>Sans compte obligatoire</span></div>
      </div>
    </section>}

    {view === "ai" && !localGame && <section className="game-page">
      <div className="center-panel">
        <button className="back-link" onClick={() => setView("home")}>← Accueil</button>
        <div className="panel-icon"><Bot size={25} /></div>
        <h2>Contre l’IA</h2>
        <p>Choisis juste le nombre de bots et leur niveau.</p>
        <div className="field-block"><label>Bots</label><div className="segmented">{[1, 2, 3].map((n) => <button key={n} className={aiCount === n ? "selected" : ""} onClick={() => setAiCount(n)}>{n}</button>)}</div></div>
        <div className="field-block"><label>Niveau</label><div className="segmented">{(["easy", "normal", "hard"] as Difficulty[]).map((d) => <button key={d} className={difficulty === d ? "selected" : ""} onClick={() => setDifficulty(d)}>{dLabel(d)}</button>)}</div></div>
        <button className="primary-btn full" onClick={startAi}><Bot size={18} /> Commencer</button>
      </div>
    </section>}

    {view === "ai" && localGame && <LocalGameBoard
      game={localGame}
      pendingWild={localWild}
      onCard={playLocalCard}
      onDraw={() => { if (localGame.players[localGame.currentPlayerIndex]?.id === "human") setLocalGame(drawLocal(localGame, "human")); }}
      onColor={pickLocalColor}
      onBack={() => { setLocalGame(null); setView("home"); }}
      onRestart={startAi}
    />}

    {view === "create" && <section className="game-page"><div className="center-panel">
      <button className="back-link" onClick={() => setView("home")}>← Accueil</button>
      <div className="panel-icon"><Plus size={25} /></div>
      <h2>Créer un salon</h2>
      <p>Crée le salon, copie le code et envoie-le.</p>
      <button className="primary-btn full" onClick={() => void createRoom()}><Plus size={18} /> Créer le salon</button>
    </div></section>}

    {view === "join" && <section className="game-page"><div className="center-panel">
      <button className="back-link" onClick={() => setView("home")}>← Accueil</button>
      <div className="panel-icon"><LogIn size={25} /></div>
      <h2>Rejoindre</h2>
      <p>Entre le code reçu.</p>
      <input className="big-code-input" value={joiningCode} maxLength={6} onChange={(e) => setJoiningCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="ABC123" />
      <button className="primary-btn full" onClick={() => void joinRoom()}><LogIn size={18} /> Rejoindre</button>
    </div></section>}

    {view === "room" && room && <section className="game-page"><div className="room-panel">
      <div className="panel-head">
        <button className="back-link" onClick={() => void leaveRoom()}>← Quitter</button>
        <div className="room-code-card"><small>CODE</small><strong>{room.code}</strong><div><button onClick={() => void copy(room.code)}><Copy size={15} /></button><button onClick={() => void copy(window.location.origin + "?room=" + room.code)}><Copy size={15} /></button></div></div>
      </div>
      <div className="room-main">
        <div>
          <div className="eyebrow"><Users size={14} /> SALON</div>
          <h2>Envoie le code à tes potes.</h2>
          <p>{room.players.length}/4 joueurs</p>
          <div className="player-list">
            {[0, 1, 2, 3].map((seat) => {
              const player = room.players.find((p) => p.seat === seat);
              return <div className={"player-slot " + (player ? "filled" : "")} key={seat}>
                {player ? <><span className="slot-avatar">{player.username.slice(0, 1).toUpperCase()}</span><span><b>@{player.username}</b><small>{player.isHost ? "Hôte" : "Joueur"}</small></span></> : <><span className="slot-empty">+</span><span><b>Libre</b><small>Place {seat + 1}</small></span></>}
              </div>;
            })}
          </div>
        </div>
        <div className="room-side">
          {room.hostId === user?.id
            ? <button className="primary-btn full" onClick={() => void startRoom()} disabled={room.players.length < 2}><span>▶</span> Lancer</button>
            : <div className="waiting-box"><b>En attente…</b><span>L’hôte lancera la partie.</span></div>}
        </div>
      </div>
    </div></section>}

    {view === "remote" && room && user && <RemoteGameBoard
      roomState={room.state}
      players={room.players}
      hand={room.hand}
      isTurn={remoteTurn}
      pending={movePending}
      pendingWild={remoteWild}
      winnerName={room.state.winnerId ? (room.players.find((p) => p.id === room.state.winnerId)?.username || null) : null}
      onPlay={(card) => {
        if (!remoteTurn || movePending) return;
        if (card.kind === "wild" || card.kind === "wild4") {
          setRemoteWild(card);
          return;
        }
        const doubles = room.hand.filter(
          (item) => item.id !== card.id && item.kind === "number" && item.value === card.value
        );
        if (card.kind === "number" && doubles.length > 0) {
          void submitAction({ type: "play", cardIds: [card.id, doubles[0].id] });
        } else {
          void submitAction({ type: "play", cardId: card.id });
        }
      }}
      onColor={(color) => {
        if (!remoteWild) return;
        const card = remoteWild;
        setRemoteWild(null);
        void submitAction({ type: "play", cardId: card.id, chosenColor: color });
      }}
      onDraw={() => void submitAction({ type: "draw" })}
      onUno={() => void submitAction({ type: "uno" })}
      onLeave={() => void leaveRoom()}
      onHome={() => { setRoom(null); setView("home"); }}
    />}

    <AccountModal
      open={authOpen}
      mode={authMode}
      setMode={setAuthMode}
      username={authUsername}
      setUsername={setAuthUsername}
      password={authPassword}
      setPassword={setAuthPassword}
      busy={authBusy}
      user={user}
      localUsername={local?.username || null}
      onSubmit={() => void submitAuth()}
      onLocal={() => void activateLocal()}
      onLogout={() => void logout()}
      onResetLocal={resetLocal}
      onClose={() => setAuthOpen(false)}
    />
  </main>;
}
