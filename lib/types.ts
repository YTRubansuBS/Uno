export type Color = "red" | "yellow" | "green" | "blue";
export type CardKind = "number" | "skip" | "reverse" | "draw2" | "wild" | "wild4";
export type Difficulty = "easy" | "normal" | "hard";

export interface UnoCard {
  id: string;
  color: Color | null;
  kind: CardKind;
  value: number | null;
}

export interface LocalPlayer {
  id: string;
  name: string;
  isAI: boolean;
  difficulty?: Difficulty;
  hand: UnoCard[];
}

export interface LocalGame {
  mode: "local";
  status: "playing" | "finished";
  players: LocalPlayer[];
  deck: UnoCard[];
  discard: UnoCard[];
  currentColor: Color;
  currentPlayerIndex: number;
  direction: 1 | -1;
  winnerId: string | null;
  deckCount?: number;
}

export interface RemotePlayer {
  id: string;
  username: string;
  seat: number;
  cardCount: number;
  ready: boolean;
  isHost: boolean;
}

export interface RemoteGameState {
  status: "waiting" | "playing" | "finished";
  version: number;
  order: string[];
  currentPlayerId: string | null;
  direction: 1 | -1;
  deck: UnoCard[];
  discard: UnoCard[];
  currentColor: Color | null;
  winnerId: string | null;
}

export interface LocalAccount {
  id: string;
  username: string;
  createdAt: string;
  kind: "local";
}

export interface RoomAction {
  type: "play" | "draw" | "uno";
  userId: string;
  cardId?: string;
  chosenColor?: Color;
}