"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  born: boolean;
  merged: boolean;
};

type Direction = "left" | "up" | "right" | "down";

const SIZE = 4;
const TARGET = 2048;
const STORAGE_KEY = "scroll-game-2048-v3";
const BEST_KEY = "sg-best-2048";
const INPUT_LOCK_MS = 105;

const directionDelta: Record<Direction, { row: number; col: number }> = {
  left: { row: 0, col: -1 },
  up: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
};

const tileColor = (value: number) => {
  const colors: Record<number, { background: string; foreground: string; shadow: string }> = {
    2: { background: "#eee4da", foreground: "#776e65", shadow: "#fff3" },
    4: { background: "#ede0c8", foreground: "#776e65", shadow: "#fff2" },
    8: { background: "#f2b179", foreground: "#fff", shadow: "#f2b17966" },
    16: { background: "#f59563", foreground: "#fff", shadow: "#f5956355" },
    32: { background: "#f67c5f", foreground: "#fff", shadow: "#f67c5f55" },
    64: { background: "#f65e3b", foreground: "#fff", shadow: "#f65e3b55" },
    128: { background: "#edcf72", foreground: "#fff", shadow: "#edcf7270" },
    256: { background: "#edcc61", foreground: "#fff", shadow: "#edcc6170" },
    512: { background: "#edc850", foreground: "#fff", shadow: "#edc85080" },
    1024: { background: "#edc53f", foreground: "#fff", shadow: "#edc53f90" },
    2048: { background: "#edc22e", foreground: "#fff", shadow: "#ffdc4d" },
  };
  if (colors[value]) return colors[value];
  const power = Math.max(0, Math.min(20, Math.log2(value) - 11));
  return {
    background: `hsl(${38 + power * 3} 82% ${52 - power * 1.2}%)`,
    foreground: "#fff",
    shadow: "#ffc14d88",
  };
};

const fontSizeFor = (value: number) => {
  if (value >= 100000) return "clamp(16px, 3.8vw, 23px)";
  if (value >= 10000) return "clamp(18px, 4.5vw, 27px)";
  if (value >= 1000) return "clamp(20px, 5.3vw, 31px)";
  if (value >= 100) return "clamp(24px, 6.2vw, 36px)";
  return "clamp(28px, 7vw, 44px)";
};

function compressLine(line: Tile[]) {
  const sorted = [...line].sort((a, b) => a.col - b.col);
  const result: Tile[] = [];
  const mergedIds: number[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (next && current.value === next.value) {
      const merged: Tile = {
        id: current.id,
        value: current.value * 2,
        row: current.row,
        col: current.col,
        born: false,
        merged: true,
      };
      result.push(merged);
      mergedIds.push(current.id, next.id);
      i++;
    } else {
      result.push({ ...current });
    }
  }

  return { result, mergedIds };
}

function buildMovedTiles(tiles: Tile[], direction: Direction) {
  const { row: dr, col: dc } = directionDelta[direction];
  const groups: Tile[][] = [];

  if (direction === "left" || direction === "right") {
    for (let row = 0; row < SIZE; row++) {
      groups.push(
        tiles
          .filter((t) => t.row === row)
          .sort((a, b) => (direction === "left" ? a.col - b.col : b.col - a.col)),
      );
    }
  } else {
    for (let col = 0; col < SIZE; col++) {
      groups.push(
        tiles
          .filter((t) => t.col === col)
          .sort((a, b) => (direction === "up" ? a.row - b.row : b.row - a.row)),
      );
    }
  }

  const moved: Tile[] = [];
  let scoreGain = 0;
  const mergedIds: number[] = [];

  for (const group of groups) {
    let cursor = direction === "left" || direction === "up" ? 0 : SIZE - 1;

    const line = group.map((tile) => ({ ...tile, born: false, merged: false }));
    const cells = direction === "left" || direction === "right"
      ? line.map((tile) => ({ ...tile, col: tile.col }))
      : line.map((tile) => ({ ...tile, col: tile.row }));

    if (direction === "right" || direction === "down") cells.reverse();

    const { result, mergedIds: localMerged } = compressLine(
      cells.map((tile, index) => ({ ...tile, col: index })),
    );

    const restored = result.map((tile) => {
      const next = { ...tile };
      if (direction === "left" || direction === "right") {
        next.row = group[0]?.row ?? 0;
        next.col = direction === "left" ? cursor : SIZE - 1 - cursor;
      } else {
        next.col = group[0]?.col ?? 0;
        next.row = direction === "up" ? cursor : SIZE - 1 - cursor;
      }
      cursor += 1;
      scoreGain += next.merged ? next.value : 0;
      return next;
    });

    moved.push(...restored);
    for (const id of localMerged) mergedIds.push(id);
  }

  const oldSignature = tiles
    .map((t) => `${t.row},${t.col},${t.value},${t.id}`)
    .sort()
    .join("|");
  const newSignature = moved
    .map((t) => `${t.row},${t.col},${t.value},${t.id}`)
    .sort()
    .join("|");

  const changed =
    oldSignature !== newSignature ||
    moved.length !== tiles.length ||
    moved.some((tile) => tile.merged);

  return {
    tiles: moved.map((tile) => ({ ...tile, born: false })),
    scoreGain,
    mergedIds: [...new Set(mergedIds)],
    changed,
    delta: { dr, dc },
  };
}

function canMove(tiles: Tile[]) {
  if (tiles.length < SIZE * SIZE) return true;
  const map = new Map(tiles.map((tile) => [`${tile.row},${tile.col}`, tile.value]));

  for (const tile of tiles) {
    if (tile.col < SIZE - 1 && map.get(`${tile.row},${tile.col + 1}`) === tile.value) return true;
    if (tile.row < SIZE - 1 && map.get(`${tile.row + 1},${tile.col}`) === tile.value) return true;
  }
  return false;
}

function highestTile(tiles: Tile[]) {
  return tiles.reduce((max, tile) => Math.max(max, tile.value), 0);
}

function createTileId() {
  return Date.now() + Math.floor(Math.random() * 1000000);
}

function spawnTile(tiles: Tile[]): Tile | null {
  const occupied = new Set(tiles.map((tile) => `${tile.row},${tile.col}`));
  const empty: Array<{ row: number; col: number }> = [];

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (!occupied.has(`${row},${col}`)) empty.push({ row, col });
    }
  }

  if (!empty.length) return null;

  const spot = empty[Math.floor(Math.random() * empty.length)];
  return {
    id: createTileId(),
    value: Math.random() < 0.9 ? 2 : 4,
    row: spot.row,
    col: spot.col,
    born: true,
    merged: false,
  };
}

function makeFreshGame() {
  const tiles: Tile[] = [];
  const first = spawnTile(tiles);
  if (first) tiles.push(first);
  const second = spawnTile(tiles);
  if (second) tiles.push(second);
  return { tiles, score: 0, moves: 0, won: false, continued: false };
}

export default function Game2048() {
  const [game, setGame] = useState(() => makeFreshGame());
  const [best, setBest] = useState(0);
  const [phase, setPhase] = useState<"playing" | "won" | "gameover">("playing");
  const [tip, setTip] = useState("SWIPE OU UTILISE LES FLÈCHES");
  const inputLocked = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      const storedBest = Number(localStorage.getItem(BEST_KEY)) || 0;
      setBest(storedBest);
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        Array.isArray(parsed.tiles) &&
        parsed.tiles.length > 0 &&
        typeof parsed.score === "number" &&
        typeof parsed.moves === "number"
      ) {
        setGame({
          tiles: parsed.tiles.map((t: Tile) => ({ ...t, born: false, merged: false })),
          score: parsed.score,
          moves: parsed.moves,
          won: Boolean(parsed.won),
          continued: Boolean(parsed.continued),
        });
        if (parsed.score > storedBest) {
          setBest(parsed.score);
          try { localStorage.setItem(BEST_KEY, String(parsed.score)); } catch {}
        }
        if (parsed.won && !parsed.continued) setPhase("won");
        else if (!canMove(parsed.tiles)) setPhase("gameover");
      }
    } catch {}
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            tiles: game.tiles,
            score: game.score,
            moves: game.moves,
            won: game.won,
            continued: game.continued,
          }),
        );
      } catch {}
    }, 120);
    saveTimer.current = id;
    return () => window.clearTimeout(id);
  }, [game]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      try {
        audioRef.current?.close();
      } catch {}
    };
  }, []);

  const beep = useCallback((freq: number, duration = 0.06, gain = 0.025) => {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const audio = audioRef.current;
      if (audio.state === "suspended") void audio.resume();
      const oscillator = audio.createOscillator();
      const gainNode = audio.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = freq;
      gainNode.gain.setValueAtTime(0.0001, audio.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(gain, audio.currentTime + 0.008);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
      oscillator.connect(gainNode).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration + 0.01);
    } catch {}
  }, []);

  const newGame = useCallback(() => {
    inputLocked.current = false;
    setPhase("playing");
    setGame(makeFreshGame());
    setTip("NOUVELLE PARTIE • À TOI");
    beep(520, 0.07, 0.02);
  }, [beep]);

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement | null)?.closest("button")) {
      pointerStart.current = null;
      return;
    }
    const start = pointerStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    pointerStart.current = null;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const distance = Math.max(Math.abs(dx), Math.abs(dy));

    if (distance >= 30) {
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
      else move(dy > 0 ? "down" : "up");
      return;
    }

  };

  const onPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStart.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
  };

  const occupied = useMemo(
    () => new Set(game.tiles.map((tile) => `${tile.row},${tile.col}`)),
    [game.tiles],
  );

  const emptyCount = SIZE * SIZE - occupied.size;
  const maxTile = highestTile(game.tiles);
  const progress = Math.max(0, Math.min(100, (Math.log2(Math.max(2, maxTile)) / 11) * 100));

  return (
    <div className="sg2048-root" data-game-surface="true">
      <div className="sg2048-aura sg2048-aura-a" />
      <div className="sg2048-aura sg2048-aura-b" />

      <div className="sg2048-header">
        <div className="sg2048-title-wrap">
          <div className="sg2048-kicker">MERGE LAB • CLASSIC 4×4</div>
          <h1>2048</h1>
          <p>Fusionne. Prévois. Garde ton espace.</p>
        </div>
        <button className="sg2048-new-btn" onClick={newGame} type="button">
          <span>↻</span>
          NOUVELLE
        </button>
      </div>

      <div className="sg2048-stats">
        <div className="sg2048-stat">
          <span>SCORE</span>
          <strong>{game.score.toLocaleString("fr-FR")}</strong>
        </div>
        <div className="sg2048-stat sg2048-stat-best">
          <span>MEILLEUR</span>
          <strong>{best.toLocaleString("fr-FR")}</strong>
        </div>
        <div className="sg2048-stat">
          <span>COUPS</span>
          <strong>{game.moves}</strong>
        </div>
      </div>

      <div className="sg2048-tip" aria-live="polite">
        <i />
        <span>{tip}</span>
      </div>

      <div
        ref={boardRef}
        className={`sg2048-board ${phase !== "playing" ? "sg2048-board-paused" : ""}`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        role="application"
        aria-label="Plateau de 2048 en grille 4 par 4. Balaye pour déplacer les tuiles ou utilise les touches du clavier."
      >
        <div className="sg2048-grid" aria-hidden="true">
          {Array.from({ length: 16 }, (_, index) => (
            <div className="sg2048-cell" key={index} />
          ))}
        </div>

        <div className="sg2048-tiles">
          {game.tiles.map((tile) => {
            const colors = tileColor(tile.value);
            return (
              <div
                key={tile.id}
                className={`sg2048-tile ${tile.born ? "sg2048-tile-born" : ""} ${tile.merged ? "sg2048-tile-merged" : ""}`}
                style={{
                  left: `calc(${tile.col} * ((100% - 18px) / 4 + 6px))`,
                  top: `calc(${tile.row} * ((100% - 18px) / 4 + 6px))`,
                  width: `calc((100% - 18px) / 4)`,
                  height: `calc((100% - 18px) / 4)`,
                  background: colors.background,
                  color: colors.foreground,
                  boxShadow: `0 10px 26px ${colors.shadow}, inset 0 1px 0 #ffffff55`,
                  fontSize: fontSizeFor(tile.value),
                }}
              >
                <span>{tile.value}</span>
              </div>
            );
          })}
        </div>

        {phase !== "playing" && (
          <div className={`sg2048-overlay ${phase === "won" ? "sg2048-overlay-win" : ""}`}>
            <div className="sg2048-overlay-card">
              {phase === "won" ? (
                <>
                  <span className="sg2048-overlay-kicker">OBJECTIF ATTEINT</span>
                  <strong>2048</strong>
                  <p>Énorme. Maintenant, vise 4096.</p>
                  <div className="sg2048-overlay-actions">
                    <button type="button" onClick={continueGame}>CONTINUER</button>
                    <button type="button" className="secondary" onClick={newGame}>NOUVELLE PARTIE</button>
                  </div>
                </>
              ) : (
                <>
                  <span className="sg2048-overlay-kicker">PLUS DE COUPS</span>
                  <strong>GAME OVER</strong>
                  <p>Score : {game.score.toLocaleString("fr-FR")}</p>
                  <div className="sg2048-overlay-actions">
                    <button type="button" onClick={newGame}>REJOUER</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="sg2048-progress">
        <div>
          <span>MEILLEURE TUILE</span>
          <strong>{maxTile}</strong>
        </div>
        <div className="sg2048-progress-track">
          <i style={{ width: `${progress}%` }} />
        </div>
        <span>{emptyCount} CASES LIBRES</span>
      </div>

      <div className="sg2048-bottom-hint">
        <span>SWIPE</span><b>← ↑ → ↓</b><span>OU</span><b>W A S D</b><span>POUR JOUER</span>
      </div>
    </div>
  );
}
