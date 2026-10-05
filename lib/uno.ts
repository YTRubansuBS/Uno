import type {
  Color,
  Difficulty,
  LocalGame,
  LocalPlayer,
  RemoteGameState,
  RoomAction,
  UnoCard
} from "@/lib/types";

export const COLORS: Color[] = ["red", "yellow", "green", "blue"];

function makeId(prefix: string) {
  return prefix + "-" + crypto.randomUUID();
}

export function buildDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  for (const color of COLORS) {
    deck.push({ id: makeId("card"), color, kind: "number", value: 0 });
    for (let value = 1; value <= 9; value++) {
      deck.push({ id: makeId("card"), color, kind: "number", value });
      deck.push({ id: makeId("card"), color, kind: "number", value });
    }
    for (let i = 0; i < 2; i++) {
      deck.push({ id: makeId("card"), color, kind: "skip", value: null });
      deck.push({ id: makeId("card"), color, kind: "reverse", value: null });
      deck.push({ id: makeId("card"), color, kind: "draw2", value: null });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ id: makeId("card"), color: null, kind: "wild", value: null });
    deck.push({ id: makeId("card"), color: null, kind: "wild4", value: null });
  }
  return deck;
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function colorLabel(color: Color | null) {
  return color === "red"
    ? "Rouge"
    : color === "yellow"
      ? "Jaune"
      : color === "green"
        ? "Vert"
        : color === "blue"
          ? "Bleu"
          : "—";
}

export function cardLabel(card: UnoCard) {
  if (card.kind === "number") return String(card.value);
  if (card.kind === "skip") return "⊘";
  if (card.kind === "reverse") return "↻";
  if (card.kind === "draw2") return "+2";
  if (card.kind === "wild") return "WILD";
  return "+4";
}

export function cardClass(card: UnoCard) {
  return card.color ?? "wild";
}

export function canPlay(card: UnoCard, top: UnoCard, currentColor: Color) {
  return (
    card.kind === "wild" ||
    card.kind === "wild4" ||
    card.color === currentColor ||
    (card.kind === "number" && top.kind === "number" && card.value === top.value) ||
    ((card.kind === "skip" || card.kind === "reverse" || card.kind === "draw2") && card.kind === top.kind)
  );
}

function refillDeck(deck: UnoCard[], discard: UnoCard[]) {
  if (deck.length > 0) return { deck, discard };
  if (discard.length <= 1) return { deck, discard };
  const top = discard[discard.length - 1];
  const refill = shuffle(discard.slice(0, -1).map((card) => ({ ...card })));
  return { deck: refill, discard: [top] };
}

function drawMany(deck: UnoCard[], discard: UnoCard[], count: number) {
  let nextDeck = [...deck];
  let nextDiscard = [...discard];
  const drawn: UnoCard[] = [];
  for (let i = 0; i < count; i++) {
    const refilled = refillDeck(nextDeck, nextDiscard);
    nextDeck = refilled.deck;
    nextDiscard = refilled.discard;
    if (!nextDeck.length) break;
    drawn.push(nextDeck.pop()!);
  }
  return { nextDeck, nextDiscard, drawn };
}

function nextIndex(index: number, direction: 1 | -1, length: number, steps = 1) {
  let result = index;
  for (let i = 0; i < steps; i++) {
    result = (result + direction + length) % length;
  }
  return result;
}

export function createLocalGame(
  humanName: string,
  opponentCount: number,
  difficulty: Difficulty
): LocalGame {
  const players: LocalPlayer[] = [
    { id: "human", name: humanName || "Toi", isAI: false, hand: [] }
  ];
  for (let i = 0; i < opponentCount; i++) {
    players.push({
      id: "ai-" + String(i + 1),
      name: "IA " + String(i + 1),
      isAI: true,
      difficulty,
      hand: []
    });
  }

  let deck = shuffle(buildDeck());
  for (let round = 0; round < 7; round++) {
    for (const player of players) player.hand.push(deck.pop()!);
  }

  let starter = deck.pop()!;
  while (starter.kind === "wild4" || starter.kind === "wild") {
    deck.unshift(starter);
    deck = shuffle(deck);
    starter = deck.pop()!;
  }

  return {
    mode: "local",
    status: "playing",
    players,
    deck,
    discard: [starter],
    currentColor: starter.color!,
    currentPlayerIndex: 0,
    direction: 1,
    winnerId: null
  };
}

export function localPlayableCards(game: LocalGame, playerId: string) {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) return [];
  const top = game.discard[game.discard.length - 1];
  return player.hand.filter((card) => canPlay(card, top, game.currentColor));
}

export function playLocal(
  game: LocalGame,
  playerId: string,
  cardId: string,
  chosenColor?: Color
): LocalGame {
  if (game.status !== "playing") return game;
  const playerIndex = game.players.findIndex((p) => p.id === playerId);
  if (playerIndex !== game.currentPlayerIndex) return game;
  const player = game.players[playerIndex];
  const top = game.discard[game.discard.length - 1];
  const cardIndex = player.hand.findIndex((card) => card.id === cardId);
  if (cardIndex < 0) return game;
  const card = player.hand[cardIndex];
  if (!canPlay(card, top, game.currentColor)) return game;
  if ((card.kind === "wild" || card.kind === "wild4") && !chosenColor) return game;

  const next = structuredClone(game);
  const nextPlayer = next.players[playerIndex];
  const [played] = nextPlayer.hand.splice(cardIndex, 1);
  next.discard.push(played);
  next.currentColor =
    played.kind === "wild" || played.kind === "wild4"
      ? chosenColor!
      : played.color!;

  if (nextPlayer.hand.length === 0) {
    next.status = "finished";
    next.winnerId = playerId;
    return next;
  }

  let steps = 1;
  if (played.kind === "skip") steps = 2;
  if (played.kind === "reverse") {
    if (next.players.length === 2) steps = 2;
    else next.direction = next.direction === 1 ? -1 : 1;
  }
  if (played.kind === "draw2") {
    const targetIndex = nextIndex(playerIndex, next.direction, next.players.length);
    const draw = drawMany(next.deck, next.discard, 2);
    next.deck = draw.nextDeck;
    next.discard = draw.nextDiscard;
    next.players[targetIndex].hand.push(...draw.drawn);
    steps = 2;
  }
  if (played.kind === "wild4") {
    const targetIndex = nextIndex(playerIndex, next.direction, next.players.length);
    const draw = drawMany(next.deck, next.discard, 4);
    next.deck = draw.nextDeck;
    next.discard = draw.nextDiscard;
    next.players[targetIndex].hand.push(...draw.drawn);
    steps = 2;
  }

  next.currentPlayerIndex = nextIndex(
    playerIndex,
    next.direction,
    next.players.length,
    steps
  );
  return next;
}

export function drawLocal(game: LocalGame, playerId: string): LocalGame {
  if (game.status !== "playing") return game;
  const playerIndex = game.players.findIndex((p) => p.id === playerId);
  if (playerIndex !== game.currentPlayerIndex) return game;

  const next = structuredClone(game);
  const draw = drawMany(next.deck, next.discard, 1);
  next.deck = draw.nextDeck;
  next.discard = draw.nextDiscard;
  next.players[playerIndex].hand.push(...draw.drawn);
  next.currentPlayerIndex = nextIndex(
    playerIndex,
    next.direction,
    next.players.length
  );
  return next;
}

function chooseColorForAi(hand: UnoCard[]): Color {
  const counts: Record<Color, number> = { red: 0, yellow: 0, green: 0, blue: 0 };
  for (const card of hand) if (card.color) counts[card.color]++;
  return COLORS.reduce((best, color) => (counts[color] > counts[best] ? color : best), "red");
}

export function chooseAiCard(game: LocalGame, playerId: string): { card: UnoCard | null; color?: Color } {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) return { card: null };
  const playable = localPlayableCards(game, playerId);
  if (!playable.length) return { card: null };

  const difficulty = player.difficulty ?? "normal";
  let chosen = playable[0];

  if (difficulty === "easy") {
    chosen = playable[Math.floor(Math.random() * playable.length)];
  } else if (difficulty === "normal") {
    chosen = [...playable].sort((a, b) => {
      const score = (card: UnoCard) =>
        card.kind === "wild4" ? 80 : card.kind === "wild" ? 60 : card.kind === "draw2" ? 40 : card.kind === "skip" || card.kind === "reverse" ? 30 : 10;
      return score(b) - score(a);
    })[0];
  } else {
    const handBefore = player.hand.length;
    chosen = [...playable].sort((a, b) => {
      const strategic = (card: UnoCard) => {
        let value = card.kind === "wild4" ? 100 : card.kind === "wild" ? 70 : card.kind === "draw2" ? 45 : card.kind === "skip" || card.kind === "reverse" ? 28 : 10;
        if (card.kind === "number" && card.value !== null) value += Math.max(0, 15 - card.value);
        if (handBefore <= 2 && card.kind === "wild4") value += 25;
        return value;
      };
      return strategic(b) - strategic(a);
    })[0];
  }

  const color = chosen.kind === "wild" || chosen.kind === "wild4"
    ? chooseColorForAi(player.hand.filter((card) => card.id !== chosen.id))
    : undefined;

  return { card: chosen, color };
}

export function createRemoteState(players: { id: string }[]): RemoteGameState {
  const deck = shuffle(buildDeck());
  let starter = deck.pop()!;
  while (starter.kind === "wild4" || starter.kind === "wild") {
    deck.unshift(starter);
    starter = deck.pop()!;
  }
  return {
    status: "playing",
    version: 1,
    order: players.map((p) => p.id),
    currentPlayerId: players[0]?.id ?? null,
    direction: 1,
    deck,
    discard: [starter],
    currentColor: starter.color,
    winnerId: null
  };
}

export function applyRemoteAction(
  state: RemoteGameState,
  hands: Record<string, UnoCard[]>,
  action: RoomAction
): { state: RemoteGameState; hands: Record<string, UnoCard[]> } | null {
  if (state.status !== "playing" || state.currentPlayerId !== action.userId) return null;
  const actorHand = hands[action.userId] ?? [];
  const top = state.discard[state.discard.length - 1];

  if (action.type === "draw") {
    const next = structuredClone(state);
    const nextHands = structuredClone(hands);
    const draw = drawMany(next.deck, next.discard, 1);
    next.deck = draw.nextDeck;
    next.discard = draw.nextDiscard;
    nextHands[action.userId] = [...actorHand, ...draw.drawn];
    const index = state.order.indexOf(action.userId);
    next.currentPlayerId = state.order[nextIndex(index, state.direction, state.order.length)];
    next.version += 1;
    return { state: next, hands: nextHands };
  }

  if (action.type === "uno") {
    return { state: { ...state, version: state.version + 1 }, hands };
  }

  if (!action.cardId) return null;
  const cardIndex = actorHand.findIndex((card) => card.id === action.cardId);
  if (cardIndex < 0) return null;
  const card = actorHand[cardIndex];
  if (!canPlay(card, top, state.currentColor!)) return null;
  if ((card.kind === "wild" || card.kind === "wild4") && !action.chosenColor) return null;

  const next = structuredClone(state);
  const nextHands = structuredClone(hands);
  const hand = [...actorHand];
  const [played] = hand.splice(cardIndex, 1);
  nextHands[action.userId] = hand;
  next.discard.push(played);
  next.currentColor =
    played.kind === "wild" || played.kind === "wild4"
      ? action.chosenColor!
      : played.color!;

  if (hand.length === 0) {
    next.status = "finished";
    next.winnerId = action.userId;
    next.currentPlayerId = action.userId;
    next.version += 1;
    return { state: next, hands: nextHands };
  }

  const currentIndex = state.order.indexOf(action.userId);
  let steps = 1;

  if (played.kind === "skip") steps = 2;
  if (played.kind === "reverse") {
    if (state.order.length === 2) steps = 2;
    else next.direction = state.direction === 1 ? -1 : 1;
  }

  if (played.kind === "draw2" || played.kind === "wild4") {
    const drawCount = played.kind === "draw2" ? 2 : 4;
    const targetId = state.order[nextIndex(currentIndex, next.direction, state.order.length)];
    const draw = drawMany(next.deck, next.discard, drawCount);
    next.deck = draw.nextDeck;
    next.discard = draw.nextDiscard;
    nextHands[targetId] = [...(nextHands[targetId] ?? []), ...draw.drawn];
    steps = 2;
  }

  next.currentPlayerId = state.order[nextIndex(currentIndex, next.direction, state.order.length, steps)];
  next.version += 1;
  return { state: next, hands: nextHands };
}

export function publicPlayerCounts(
  order: string[],
  hands: Record<string, UnoCard[]>
): Record<string, number> {
  return Object.fromEntries(order.map((id) => [id, (hands[id] ?? []).length]));
}