"use client";

import { ArrowLeft, Bot, Crown, RefreshCw, Zap } from "lucide-react";
import Card from "@/components/Card";
import { canPlay, colorLabel, localPlayableCards } from "@/lib/uno";
import type { Color, LocalGame, RemoteGameState, UnoCard } from "@/lib/types";

type RemotePlayer = { id: string; user_id: string; username: string; seat: number; card_count: number; ready: boolean };
const colors: Color[] = ["red", "yellow", "green", "blue"];

export function ColorPicker({ onColor }: { onColor: (color: Color) => void }) {
  const names: Record<Color, string> = { red: "Rouge", yellow: "Jaune", green: "Vert", blue: "Bleu" };
  return <div className="modal-backdrop"><div className="color-picker"><span>CHOISIS UNE COULEUR</span><h3>Joker</h3><div className="color-grid">{colors.map((color) => <button key={color} className={"color-choice color-" + color} onClick={() => onColor(color)}>{names[color]}</button>)}</div></div></div>;
}

export function LocalGameBoard(props: { game: LocalGame; pendingWild: UnoCard | null; onCard: (card: UnoCard) => void; onDraw: () => void; onColor: (color: Color) => void; onBack: () => void; onRestart: () => void }) {
  const { game, pendingWild, onCard, onDraw, onColor, onBack, onRestart } = props;
  const human = game.players.find((p) => p.id === "human");
  const current = game.players[game.currentPlayerIndex];
  const top = game.discard[game.discard.length - 1];
  const playable = localPlayableCards(game, "human");
  return <div className="uno-board">
    <div className="game-topline"><button className="back-link on-table" onClick={onBack}><ArrowLeft size={16}/> Quitter</button><div className="game-title-mini"><b>UNO</b><span>vs IA</span></div><div className="table-stat"><span>Tour</span><b>{current.name}</b></div></div>
    <div className="opponents-row">{game.players.filter((p) => p.id !== "human").map((player) => <div className={"opponent-chip " + (player.id === current.id ? "turning" : "")} key={player.id}><span className="opponent-avatar"><Bot size={15}/></span><b>{player.name}</b><span>{player.hand.length} cartes</span></div>)}</div>
    <div className="table-center"><div className="deck-pile"><div className="deck-back">UNO</div><small>{game.deck.length} restantes</small></div><div className="discard-pile"><Card card={top}/><div className={"color-pill color-" + game.currentColor}>Couleur : {colorLabel(game.currentColor)}</div></div></div>
    <div className={"turn-banner " + (current.id === "human" ? "your-turn" : "")}>{current.id === "human" ? <><Zap size={16}/> Ton tour</> : <><Bot size={16}/> {current.name} joue…</>}</div>
    <div className="human-hand">{human?.hand.map((card, index) => { const active = playable.some((item) => item.id === card.id); return <div key={card.id} className={"hand-card-wrap " + (active ? "active" : "")} style={{ ["--i" as string]: index }}><Card card={card} playable={active} onClick={() => onCard(card)} /></div>; })}</div>
    <div className="game-actions"><button className="draw-btn" onClick={onDraw} disabled={current.id !== "human"}><span>PIOCHE</span><b>+1</b></button><div className="color-readout"><span className={"color-dot color-" + game.currentColor}/>{colorLabel(game.currentColor)}</div></div>
    {game.status === "finished" && <div className="modal-backdrop"><div className="result-card"><div className="result-icon"><Crown size={30}/></div><span>PARTIE TERMINEE</span><h2>{game.players.find((p) => p.id === game.winnerId)?.name} gagne !</h2><p>Bien joue. Repars pour une revanche.</p><div className="result-actions"><button className="primary-btn" onClick={onRestart}>Rejouer</button><button className="secondary-btn" onClick={onBack}>Accueil</button></div></div></div>}
    {pendingWild && <ColorPicker onColor={onColor}/>}
  </div>;
}

export function RemoteGameBoard(props: { roomState: RemoteGameState; players: RemotePlayer[]; hand: UnoCard[]; isTurn: boolean; pending: boolean; pendingWild: UnoCard | null; winnerName: string | null; onPlay: (card: UnoCard) => void; onColor: (color: Color) => void; onDraw: () => void; onUno: () => void; onLeave: () => void; onHome: () => void }) {
  const { roomState, players, hand, isTurn, pending, pendingWild, winnerName, onPlay, onColor, onDraw, onUno, onLeave, onHome } = props;
  const top = roomState.discard[roomState.discard.length - 1];
  const playable = isTurn && top && roomState.currentColor ? hand.filter((card) => canPlay(card, top, roomState.currentColor!)) : [];
  const current = players.find((p) => p.user_id === roomState.currentPlayerId);
  return <div className="uno-board">
    <div className="game-topline"><button className="back-link on-table" onClick={onLeave}><ArrowLeft size={16}/> Quitter</button><div className="game-title-mini"><b>UNO</b><span>Multijoueur</span></div><div className="table-stat"><span>Tour</span><b>{current?.username || "..."}</b></div></div>
    <div className="online-strip"><span className="live-dot"/> En ligne · {players.length}/4 joueurs · Couleur {colorLabel(roomState.currentColor)}</div>
    <div className="opponents-row">{players.map((player) => <div key={player.id} className={"opponent-chip " + (player.user_id === roomState.currentPlayerId ? "turning" : "")}><span className="opponent-avatar">{player.user_id === roomState.order[0] ? <Crown size={14}/> : player.username.slice(0,1).toUpperCase()}</span><b>{player.username}</b><span>{player.card_count} cartes</span></div>)}</div>
    <div className="table-center"><div className="deck-pile"><div className="deck-back">UNO</div><small>{roomState.deck.length} restantes</small></div><div className="discard-pile"><Card card={top ?? {id:"empty",color:"red",kind:"number",value:0}}/><div className={"color-pill color-" + (roomState.currentColor || "red")}>Couleur : {colorLabel(roomState.currentColor)}</div></div></div>
    <div className={"turn-banner " + (isTurn ? "your-turn" : "")}>{isTurn ? <><Zap size={16}/> Ton tour</> : <><RefreshCw size={16}/> Tour de {current?.username || "..."}{pending ? " · envoi..." : ""}</>}</div>
    <div className="human-hand">{hand.map((card, index) => { const active = playable.some((item) => item.id === card.id); return <div key={card.id} className={"hand-card-wrap " + (active ? "active" : "")} style={{ ["--i" as string]: index }}><Card card={card} playable={active} onClick={() => onPlay(card)} /></div>; })}</div>
    <div className="game-actions"><button className="draw-btn" onClick={onDraw} disabled={!isTurn || pending}><span>PIOCHE</span><b>+1</b></button>{hand.length === 1 && <button className="uno-call-btn" onClick={onUno} disabled={pending}>UNO !</button>}<div className="color-readout"><span className={"color-dot color-" + (roomState.currentColor || "red")}/>{colorLabel(roomState.currentColor)}</div></div>
    {roomState.status === "finished" && <div className="modal-backdrop"><div className="result-card"><div className="result-icon"><Crown size={30}/></div><span>PARTIE TERMINEE</span><h2>{winnerName ? winnerName + " gagne !" : "Salon termine."}</h2><p>{winnerName ? "GG ! Merci pour la partie." : "L hote a quitte la partie."}</p><div className="result-actions"><button className="primary-btn" onClick={onHome}>Accueil</button></div></div></div>}
    {pendingWild && <ColorPicker onColor={onColor}/>}
  </div>;
}