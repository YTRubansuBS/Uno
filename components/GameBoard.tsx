"use client";

import { ArrowLeft, Bot, Crown, Sparkles } from "lucide-react";
import Card from "@/components/Card";
import { canPlay, colorLabel, localPlayableCards } from "@/lib/uno";
import type { Color, LocalGame, RemoteGameState, UnoCard } from "@/lib/types";

type RemotePlayer = {
  id: string;
  username: string;
  seat: number;
  cardCount: number;
  isHost: boolean;
};

const colors: Color[] = ["red", "yellow", "green", "blue"];

export function ColorPicker({ onColor }: { onColor: (color: Color) => void }) {
  const names: Record<Color, string> = { red: "Rouge", yellow: "Jaune", green: "Vert", blue: "Bleu" };
  return <div className="modal-backdrop color-modal">
    <div className="color-picker simple-color-picker">
      <b>Choisis une couleur</b>
      <div className="color-grid">
        {colors.map((color) => <button key={color} className={"color-choice color-" + color} onClick={() => onColor(color)}>{names[color]}</button>)}
      </div>
    </div>
  </div>;
}

function SimplePlayers(props: { players: { id: string; name: string; count: number; isTurn: boolean; isBot?: boolean }[] }) {
  return <div className="simple-players">
    {props.players.map((player) => <div className={"simple-player " + (player.isTurn ? "is-turn" : "")} key={player.id}>
      <span className="simple-avatar">{player.isBot ? <Bot size={15} /> : player.name.slice(0, 1).toUpperCase()}</span>
      <span><b>{player.name}</b><small>{player.isTurn ? "À son tour" : player.count + " cartes"}</small></span>
    </div>)}
  </div>;
}

export function LocalGameBoard(props: {
  game: LocalGame;
  pendingWild: UnoCard | null;
  onCard: (card: UnoCard) => void;
  onDraw: () => void;
  onColor: (color: Color) => void;
  onBack: () => void;
  onRestart: () => void;
}) {
  const { game, pendingWild, onCard, onDraw, onColor, onBack, onRestart } = props;
  const human = game.players.find((p) => p.id === "human");
  const current = game.players[game.currentPlayerIndex];
  const top = game.discard[game.discard.length - 1];
  const playable = localPlayableCards(game, "human");
  const isTurn = current?.id === "human";

  return <div className="simple-board">
    <header className="simple-bar">
      <button className="simple-quit" onClick={onBack}><ArrowLeft size={16} /> Quitter</button>
      <b className="simple-logo">UNO</b>
      <span className={"simple-turn-pill " + (isTurn ? "mine" : "")}>{isTurn ? "À TOI" : "TOUR DE " + current.name}</span>
    </header>

    <SimplePlayers players={game.players.filter((p) => p.id !== "human").map((p) => ({
      id: p.id, name: p.name, count: p.hand.length, isTurn: p.id === current.id, isBot: true
    }))} />

    <div className="simple-table">
      <div className="simple-pile">
        <button className="simple-deck-button" onClick={onDraw} disabled={!isTurn}><span>UNO</span><small>+1</small></button>
        <small>Pioche</small>
      </div>

      <div className="simple-center-message">
        <span className={"simple-color-dot color-" + game.currentColor}></span>
        <span>{colorLabel(game.currentColor)}</span>
      </div>

      <div className="simple-pile">
        <Card card={top} />
        <small>Carte jouée</small>
      </div>
    </div>

    <div className={"simple-help " + (isTurn ? "mine" : "")}>
      {isTurn ? "Joue une carte qui a la même couleur ou le même symbole." : current.name + " joue…"}
    </div>

    <div className="simple-hand-title"><b>Ta main</b><span>{human?.hand.length || 0} cartes</span></div>
    <div className="simple-hand">
      {human?.hand.map((card) => {
        const active = isTurn && playable.some((item) => item.id === card.id);
        return <div key={card.id} className={"simple-hand-card " + (active ? "can-play" : "")}><Card card={card} playable={active} onClick={() => onCard(card)} /></div>;
      })}
    </div>

    <div className="simple-actions">
      <button className="simple-draw" onClick={onDraw} disabled={!isTurn}>+1&nbsp; Pioche</button>
    </div>

    {game.status === "finished" && <div className="modal-backdrop">
      <div className="result-card simple-result">
        <div className="result-icon"><Crown size={30} /></div>
        <span>FIN DE PARTIE</span>
        <h2>{game.players.find((p) => p.id === game.winnerId)?.name} gagne 🎉</h2>
        <p>Bien joué.</p>
        <div className="result-actions"><button className="primary-btn" onClick={onRestart}><Sparkles size={17} /> Rejouer</button><button className="secondary-btn" onClick={onBack}>Accueil</button></div>
      </div>
    </div>}

    {pendingWild && <ColorPicker onColor={onColor} />}
  </div>;
}

export function RemoteGameBoard(props: {
  roomState: RemoteGameState;
  players: RemotePlayer[];
  hand: UnoCard[];
  isTurn: boolean;
  pending: boolean;
  pendingWild: UnoCard | null;
  winnerName: string | null;
  onPlay: (card: UnoCard) => void;
  onColor: (color: Color) => void;
  onDraw: () => void;
  onUno: () => void;
  onLeave: () => void;
  onHome: () => void;
}) {
  const { roomState, players, hand, isTurn, pending, pendingWild, winnerName, onPlay, onColor, onDraw, onUno, onLeave, onHome } = props;
  const top = roomState.discard[roomState.discard.length - 1];
  const currentColor = roomState.currentColor;
  const playable = isTurn && top && currentColor
    ? hand.filter((card) => canPlay(card, top, currentColor))
    : [];
  const current = players.find((player) => player.id === roomState.currentPlayerId);

  return <div className="simple-board">
    <header className="simple-bar">
      <button className="simple-quit" onClick={onLeave}><ArrowLeft size={16} /> Quitter</button>
      <b className="simple-logo">UNO</b>
      <span className={"simple-turn-pill " + (isTurn ? "mine" : "")}>{isTurn ? "À TOI" : "TOUR DE " + (current?.username || "...")}</span>
    </header>

    <SimplePlayers players={players.map((player) => ({
      id: player.id, name: player.username, count: player.cardCount, isTurn: player.id === roomState.currentPlayerId, isBot: false
    }))} />

    <div className="simple-table">
      <div className="simple-pile">
        <button className="simple-deck-button" onClick={onDraw} disabled={!isTurn || pending}><span>UNO</span><small>+1</small></button>
        <small>Pioche · {roomState.deckCount ?? roomState.deck.length}</small>
      </div>

      <div className="simple-center-message">
        <span className={"simple-color-dot color-" + (roomState.currentColor || "red")}></span>
        <span>{colorLabel(roomState.currentColor)}</span>
      </div>

      <div className="simple-pile">
        {top && <Card card={top} />}
        <small>Carte jouée</small>
      </div>
    </div>

    <div className={"simple-help " + (isTurn ? "mine" : "")}>
      {pending ? "Coup envoyé…" : isTurn ? "À toi : choisis une carte." : "Regarde la partie…"}
    </div>

    <div className="simple-hand-title"><b>Ta main</b><span>{hand.length} cartes</span></div>
    <div className="simple-hand">
      {hand.map((card) => {
        const active = playable.some((item) => item.id === card.id);
        return <div key={card.id} className={"simple-hand-card " + (active ? "can-play" : "")}><Card card={card} playable={active} onClick={() => onPlay(card)} /></div>;
      })}
    </div>

    <div className="simple-actions">
      <button className="simple-draw" onClick={onDraw} disabled={!isTurn || pending}>+1&nbsp; Pioche</button>
      {hand.length === 1 && <button className="simple-uno" onClick={onUno} disabled={pending}>UNO !</button>}
    </div>

    {roomState.status === "finished" && <div className="modal-backdrop">
      <div className="result-card simple-result">
        <div className="result-icon"><Crown size={30} /></div>
        <span>FIN DE PARTIE</span>
        <h2>{winnerName ? winnerName + " gagne 🎉" : "Partie terminée."}</h2>
        <p>GG.</p>
        <div className="result-actions"><button className="primary-btn" onClick={onHome}>Accueil</button></div>
      </div>
    </div>}

    {pendingWild && <ColorPicker onColor={onColor} />}
  </div>;
}
