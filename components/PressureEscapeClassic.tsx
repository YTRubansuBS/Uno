"use client";

import { useEffect, useRef } from "react";

type Props = {
  color: string;
  onScore?: (n: number) => void;
};

type Shape = "TRIANGLE" | "SQUARE" | "STAR" | "CIRCLE" | "WEIRD";
type CommandKind =
  | "PRESS"
  | "DONT"
  | "COUNT_WORDS"
  | "LESS_TWO"
  | "MORE_FIVE"
  | "CORNERS"
  | "HUMAN"
  | "ROBOT"
  | "DOUBLE"
  | "HOLD"
  | "MATH_COUNT"
  | "QUICK_DONT"
  | "RANDOM_COUNT"
  | "SPIDER_COUNT"
  | "SPIDER_DONT"
  | "HOLD_LONG"
  | "SAME_AS_LAST"
  | "RAT_CUE"
  | "CATS_EVEN"
  | "CATS_EARLIER"
  | "NEXT_LIE"
  | "RESPECT"
  | "WAIT"
  | "KEEP_PRESSING"
  | "HALF_TIME"
  | "MORE_THAN_CORNERS"
  | "MEMORY_SHOW"
  | "MEMORY_CHECK"
  | "CLOCK"
  | "FINAL";

type Phase = "INTRO" | "COMMAND" | "FAIL" | "END";

type Command = {
  id: string;
  kind: CommandKind;
  duration: number;
  title: string;
  detail?: string;
  variant?: number;
};

type GameState = {
  phase: Phase;
  commandIndex: number;
  commands: Command[];
  commandT: number;
  score: number;
  best: number;
  presses: number;
  buttonDown: boolean;
  started: boolean;
  failedText: string;
  failFlash: number;
  successFlash: number;
  timerSegments: number;
  lastKind: CommandKind | null;
  lastRequiredPress: boolean | null;
  previousRequiredPress: boolean | null;
  memoryNumber: number;
  memoryCats: number;
  currentCats: number;
  currentShape: Shape;
  shapeNeed: number;
  rememberedNumberStage: boolean;
  clockHour: number;
  weirdCorners: number;
  ratVisible: boolean;
  spiderVisible: boolean;
  spiderTriggered: boolean;
  humanAnswer: boolean | null;
  lieArmed: boolean;
  inputLockedUntil: number;
  holdStart: number | null;
  phaseLabel: string;
  combo: number;
  maxCombo: number;
  feedback: string;
  feedbackT: number;
  totalClears: number;
};

const W = 390;
const H = 844;
const BUTTON_X = 195;
const BUTTON_Y = 604;
const BUTTON_R = 82;
const RING_R = 112;
const SEGMENTS = 40;

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

export default function PressureEscapeClassic({ color, onScore }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef(onScore);
  scoreRef.current = onScore;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let dead = false;
    let last = performance.now();
    let dpr = 1;
    let scale = 1;
    let ox = 0;
    let oy = 0;
    let audio: AudioContext | null = null;

    const s: GameState = {
      phase: "INTRO",
      commandIndex: -1,
      commands: [],
      commandT: 0,
      score: 0,
      best: 0,
      presses: 0,
      buttonDown: false,
      started: false,
      failedText: "",
      failFlash: 0,
      successFlash: 0,
      timerSegments: SEGMENTS,
      lastKind: null,
      lastRequiredPress: null,
      previousRequiredPress: null,
      memoryNumber: 0,
      memoryCats: 0,
      currentCats: 0,
      currentShape: "TRIANGLE",
      shapeNeed: 3,
      rememberedNumberStage: false,
      clockHour: 3,
      weirdCorners: 10,
      ratVisible: false,
      spiderVisible: false,
      spiderTriggered: false,
      humanAnswer: null,
      lieArmed: false,
      inputLockedUntil: 0,
      holdStart: null,
      phaseLabel: "READY",
      combo: 0,
      maxCombo: 0,
      feedback: "",
      feedbackT: 0,
      totalClears: 0,
    };

    type Particle = { x:number; y:number; vx:number; vy:number; life:number; maxLife:number; size:number; };
    const particles: Particle[] = [];

    try {
      s.best = Number(localStorage.getItem("sg-best-pressure")) || 0;
    } catch {}

    const tone = (freq: number, duration = 0.06, gain = 0.035) => {
      try {
        if (!audio) audio = new AudioContext();
        if (audio.state === "suspended") void audio.resume();
        const osc = audio.createOscillator();
        const g = audio.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, audio.currentTime);
        g.gain.exponentialRampToValueAtTime(gain, audio.currentTime + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
        osc.connect(g).connect(audio.destination);
        osc.start();
        osc.stop(audio.currentTime + duration + 0.015);
      } catch {}
    };

    const buzz = (value: number | number[]) => {
      try {
        navigator.vibrate?.(value);
      } catch {}
    };

    const saveBest = () => {
      if (s.score > s.best) {
        s.best = s.score;
        try {
          localStorage.setItem("sg-best-pressure", String(s.best));
        } catch {}
      }
    };

    const addScore = (base: number) => {
      const c = s.commands[s.commandIndex];
      const remaining = c ? Math.max(0, c.duration - s.commandT) : 0;
      const speedBonus = Math.min(140, Math.round(remaining * 7));
      const multiplier = 1 + Math.min(1.5, s.combo * 0.05);
      s.score += Math.round((base + speedBonus) * multiplier);
      scoreRef.current?.(s.score);
    };

    const shapeInfo = (shape: Shape) => {
      if (shape === "TRIANGLE") return { need: 3, label: "TRIANGLE" };
      if (shape === "SQUARE") return { need: 4, label: "SQUARE" };
      if (shape === "STAR") return { need: 10, label: "STAR" };
      if (shape === "CIRCLE") return { need: 0, label: "CIRCLE" };
      return { need: 10, label: "WEIRD" };
    };

    const randomShape = (): Shape => {
      const pool: Shape[] = ["TRIANGLE", "SQUARE", "STAR", "CIRCLE", "WEIRD"];
      return pool[Math.floor(Math.random() * pool.length)];
    };

    const countCatsForRun = () => 2 + Math.floor(Math.random() * 5);

    const pickVariant = (variants: Command[]): Command => {
      const filtered = variants.filter((v) => v.kind !== s.lastKind);
      const pool = filtered.length ? filtered : variants;
      const chosen = { ...pool[Math.floor(Math.random() * pool.length)] };
      s.lastKind = chosen.kind;
      return chosen;
    };

    const buildCommands = () => {
      const memoryNumber = Math.floor(Math.random() * 90) + 10;
      const cats = countCatsForRun();
      const clockHour = 1 + Math.floor(Math.random() * 12);
      const shape = randomShape();
      const info = shapeInfo(shape);
      s.memoryNumber = memoryNumber;
      s.memoryCats = cats;
      s.currentShape = shape;
      s.shapeNeed = info.need;
      s.currentCats = cats;
      s.clockHour = clockHour;
      s.humanAnswer = null;
      s.lieArmed = false;

      const groups: Command[][] = [
        [
          { id: "g1a", kind: "PRESS", duration: 6, title: "PRESS", detail: "Appuie une fois.", variant: 0 },
          { id: "g1b", kind: "DONT", duration: 4.5, title: "DO NOT PRESS", detail: "Ne touche pas au bouton.", variant: 1 },
        ],
        [
          { id: "g2a", kind: "COUNT_WORDS", duration: 15, title: "COUNT THE WORDS", detail: "Une pression par mot.", variant: 0 },
          { id: "g2b", kind: "LESS_TWO", duration: 6, title: "LESS THAN TWO", detail: "Termine avec moins de 2 pressions.", variant: 1 },
          { id: "g2c", kind: "MORE_FIVE", duration: 9, title: "MORE THAN FIVE", detail: "Termine avec plus de 5 pressions.", variant: 2 },
        ],
        [
          { id: "g3a", kind: "CORNERS", duration: 9, title: "COUNT THE CORNERS", detail: "Une pression par coin.", variant: 0 },
          { id: "g3b", kind: "CORNERS", duration: 12, title: "COUNT THE CORNERS", detail: "Une pression par coin.", variant: 1 },
          { id: "g3c", kind: "CORNERS", duration: 15, title: "COUNT THE CORNERS", detail: "Une pression par coin.", variant: 2 },
        ],
        [
          { id: "g4a", kind: "HUMAN", duration: 6, title: "ARE YOU HUMAN?", detail: "Réponds avec le bouton.", variant: 0 },
          { id: "g4b", kind: "ROBOT", duration: 6, title: "ARE YOU A ROBOT?", detail: "Ta réponse doit être cohérente avec la précédente.", variant: 1 },
        ],
        [
          { id: "g5a", kind: "DOUBLE", duration: 6, title: "DOUBLE PRESS", detail: "Deux pressions exactes.", variant: 0 },
          { id: "g5b", kind: "HOLD", duration: 6, title: "PRESS AND HOLD", detail: "Maintiens jusqu'à la fin.", variant: 1 },
          { id: "g5c", kind: "MATH_COUNT", duration: 12, title: "QUICK MATH", detail: "Résous le calcul avec des pressions.", variant: 2 },
          { id: "g5d", kind: "QUICK_DONT", duration: 3, title: "DON'T REACT", detail: "Le piège est volontairement court.", variant: 3 },
        ],
        [
          { id: "g6a", kind: "RANDOM_COUNT", duration: 6, title: "PRESS THE NUMBER", detail: "Le compteur t'indique combien de fois.", variant: 0 },
          { id: "g6b", kind: "RANDOM_COUNT", duration: 6, title: "COUNT DOWN", detail: "Compte les pressions restantes.", variant: 1 },
        ],
        [
          { id: "g7a", kind: "HOLD_LONG", duration: 9, title: "HOLD LONGER", detail: "Maintiens pendant plus de 2 secondes.", variant: 0 },
          { id: "g7b", kind: "RELEASE_SPIDER" as CommandKind, duration: 15, title: "HOLD • WAIT • RELEASE", detail: "Maintiens. Relâche seulement quand le signal apparaît.", variant: 1 },
        ],
        [
          { id: "g8", kind: "SAME_AS_LAST", duration: 4.5, title: "SAME AS LAST", detail: "Fais exactement comme au dernier piège.", variant: 0 },
        ],
        [
          { id: "g9", kind: "RAT_CUE", duration: 4.5, title: "WATCH THE SIDE", detail: "Quelque chose va apparaître. Attends le signal.", variant: 0 },
        ],
        [
          { id: "g10", kind: "DONT", duration: 6, title: "DON'T PRESS", detail: "Le visuel est là pour te faire réagir.", variant: 0 },
        ],
        [
          { id: "g11", kind: "CATS_EVEN", duration: 7.2, title: "WATCH THE CATS", detail: "Ils vont apparaître. Compte-les.", variant: 0 },
        ],
        [
          { id: "g12", kind: "CATS_EARLIER", duration: 9, title: "REMEMBER THE CATS", detail: "Une pression pour chaque chat vu plus tôt.", variant: 0 },
        ],
        [
          { id: "g13", kind: "SPIDER_DONT", duration: 4.5, title: "SPIDER DISTRACTION", detail: "Une araignée arrive. NE CLIQUE PAS. Attends.", variant: 0 },
        ],
        [
          { id: "g14", kind: "COUNT_WORDS", duration: 9, title: "MEMORY + COUNT", detail: "Lis toute la phrase avant de toucher.", variant: 0 },
        ],
        [
          { id: "g15", kind: "NEXT_LIE", duration: 4.5, title: "READ THE NEXT LINE", detail: "La prochaine consigne sera spéciale.", variant: 0 },
        ],
        [
          { id: "g16", kind: "PRESS", duration: 12, title: "DO PRESS", detail: "Cette fois, l'instruction est honnête.", variant: 0 },
        ],
        [
          { id: "g17", kind: "RESPECT", duration: 6, title: "PAY RESPECT", detail: "Une pression quand tu es prêt.", variant: 0 },
        ],
        [
          { id: "g18", kind: "DONT", duration: 7.5, title: "DO NOT PRESS", detail: "Attends la fin du timer.", variant: 0 },
        ],
        [
          { id: "g19", kind: "KEEP_PRESSING", duration: 18, title: "KEEP PRESSING", detail: "Continue jusqu'au signal final.", variant: 0 },
        ],
        [
          { id: "g20", kind: "HALF_TIME", duration: 20, title: "PRESS AFTER HALF-TIME", detail: "Attends la moitié du temps. Une araignée peut apparaître.", variant: 0 },
        ],
        [
          { id: "g21", kind: "MORE_THAN_CORNERS", duration: 24, title: "MORE THAN ONCE PER CORNER", detail: "La forme change. Fais suffisamment de pressions.", variant: 0 },
        ],
        [
          { id: "g22", kind: "PRESS", duration: 6, title: "ASCEND", detail: "Une pression pour avancer.", variant: 0 },
        ],
        [
          { id: "g23", kind: "CLOCK", duration: 10.5, title: "WHAT TIME IS IT?", detail: "Presse une fois par heure affichée.", variant: 0 },
        ],
        [
          { id: "g24", kind: "NEXT_LIE", duration: 4.5, title: "THE NEXT COMMAND", detail: "Lis jusqu'au bout.", variant: 0 },
        ],
        [
          { id: "g25", kind: "MEMORY_SHOW", duration: 4.5, title: "REMEMBER THIS", detail: "Un nombre va apparaître. Mémorise-le.", variant: 0 },
        ],
        [
          { id: "g26", kind: "MEMORY_CHECK", duration: 6, title: "GOOD MEMORY?", detail: "Appuie si tu as retenu le nombre.", variant: 0 },
        ],
        [
          { id: "g27", kind: "RANDOM_COUNT", duration: 6, title: "CHOOSE YOUR ANSWER", detail: "Lis toute la phrase avant d'appuyer.", variant: 0 },
        ],
        [
          { id: "g28", kind: "RANDOM_COUNT", duration: 12, title: "FINAL COUNT", detail: "Le compteur descend à chaque pression.", variant: 0 },
        ],
        [
          { id: "g29", kind: "PRESS", duration: 6, title: "ONE MORE", detail: "Une pression.", variant: 0 },
        ],
        [
          { id: "g30", kind: "DONT", duration: 4.5, title: "DON'T PANIC", detail: "Ne réagis pas au premier visuel.", variant: 0 },
        ],
      ];

      const groupOrder = [
        0,1,1,8,25,5,9,3,10,2,11,5,3,12,2,13,4,27,23,14,5,5,28,3,15,24,16,6,5,17,7,3,18,4,2,7,19,4,20,21,26,22
      ];

      const commands: Command[] = [];
      let humanRobotSeen = 0;
      for (const groupIndex of groupOrder) {
        if (!groups[groupIndex]) continue;
        if (groupIndex === 4) {
          humanRobotSeen += 1;
          const forced = humanRobotSeen === 1
            ? groups[groupIndex].find((v) => v.kind === "HUMAN")!
            : groups[groupIndex].find((v) => v.kind === "ROBOT")!;
          const chosen = { ...forced };
          s.lastKind = chosen.kind;
          commands.push(chosen);
        } else {
          commands.push(pickVariant(groups[groupIndex]));
        }
      }

      // Add a few clearly distinct Scroll Game variations while keeping the same progression rhythm.
      const tail = [
        { id: "tail1", kind: "SPIDER_DONT" as CommandKind, duration: 4.5, title: "IGNORE IT", detail: "Une araignée arrive. NE CLIQUE PAS.", variant: 0 },
        { id: "tail2", kind: "MEMORY_CHECK" as CommandKind, duration: 6, title: "REMEMBER?", detail: "Une pression si tu as retenu le nombre.", variant: 0 },
        { id: "tail3", kind: "FINAL" as CommandKind, duration: 8, title: "PRESS TO ASCEND", detail: "Le dernier bouton.", variant: 0 },
      ];
      commands.push(tail[0], tail[1], tail[2]);

      return commands;
    };

    const current = () => s.commands[s.commandIndex];

    const fail = (text: string) => {
      if (s.phase !== "COMMAND") return;
      s.phase = "FAIL";
      s.failedText = text;
      s.combo = 0;
      s.feedback = "RUN OVER";
      s.feedbackT = 1.2;
      s.failFlash = 0.9;
      saveBest();
      tone(95, 0.28, 0.05);
      buzz([20, 28, 60]);
    };

    const spawnBurst = (count = 16, power = 1) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const speed = (80 + Math.random() * 170) * power;
        const life = 0.35 + Math.random() * 0.45;
        particles.push({
          x: BUTTON_X + (Math.random() - 0.5) * 24,
          y: BUTTON_Y + (Math.random() - 0.5) * 24,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          life,
          maxLife: life,
          size: 2 + Math.random() * 4,
        });
      }
    };

    const finishCommand = (bonus = 0) => {
      s.previousRequiredPress = s.lastRequiredPress;
      s.combo += 1;
      s.maxCombo = Math.max(s.maxCombo, s.combo);
      s.totalClears += 1;
      const active = current();
      const ratio = active ? s.commandT / active.duration : 0;
      s.feedback = ratio < 0.34 ? "PERFECT" : ratio > 0.82 ? "CLUTCH" : "CLEAR";
      s.feedbackT = 0.65;
      spawnBurst(ratio < 0.34 ? 28 : 18, ratio < 0.34 ? 1.25 : 1);
      addScore(bonus);
      s.successFlash = 0.45;
      tone(ratio < 0.34 ? 820 : 660, 0.07, 0.035);
      buzz(10);
      if (s.commandIndex >= s.commands.length - 1) {
        s.phase = "END";
        saveBest();
        tone(980, 0.18, 0.045);
        buzz([20, 30, 80]);
        return;
      }
      s.commandIndex += 1;
      s.commandT = 0;
      s.presses = 0;
      s.buttonDown = false;
      s.timerSegments = SEGMENTS;
      s.holdStart = null;
      s.ratVisible = false;
      s.spiderVisible = false;
      s.spiderTriggered = false;
      s.inputLockedUntil = performance.now() + 220;
      setupCommand();
    };

    const setupCommand = () => {
      const c = current();
      if (!c) return;
      s.phaseLabel = "READ";
      s.lastRequiredPress =
        c.kind === "PRESS" ||
        c.kind === "DOUBLE" ||
        c.kind === "COUNT_WORDS" ||
        c.kind === "LESS_TWO" ||
        c.kind === "MORE_FIVE" ||
        c.kind === "CORNERS" ||
        c.kind === "HUMAN" ||
        c.kind === "ROBOT" ||
        c.kind === "MATH_COUNT" ||
        c.kind === "RANDOM_COUNT" ||
        c.kind === "SPIDER_COUNT" ||
        c.kind === "HOLD" ||
        c.kind === "HOLD_LONG" ||
        c.kind === "RAT_CUE" ||
        c.kind === "CATS_EVEN" ||
        c.kind === "CATS_EARLIER" ||
        c.kind === "RESPECT" ||
        c.kind === "KEEP_PRESSING" ||
        c.kind === "HALF_TIME" ||
        c.kind === "MORE_THAN_CORNERS" ||
        c.kind === "MEMORY_CHECK" ||
        c.kind === "CLOCK" ||
        c.kind === "FINAL";

      if (c.kind === "CORNERS") {
        const shape = randomShape();
        s.currentShape = shape;
        s.shapeNeed = shapeInfo(shape).need;
      }
      if (c.kind === "RANDOM_COUNT") {
        c.variant = 3 + Math.floor(Math.random() * 6);
      }
      if (c.kind === "MATH_COUNT") {
        c.variant = 3 + Math.floor(Math.random() * 3);
      }
      if (c.kind === "MORE_THAN_CORNERS") {
        s.weirdCorners = 8 + Math.floor(Math.random() * 4);
      }
      if (c.kind === "CLOCK") {
        s.clockHour = 1 + Math.floor(Math.random() * 12);
      }
      if (c.kind === "CATS_EVEN") {
        s.currentCats = countCatsForRun();
        s.memoryCats = s.currentCats;
      }
      if (c.kind === "CATS_EARLIER") {
        s.currentCats = s.memoryCats;
      }
      if (c.kind === "MEMORY_SHOW") {
        s.memoryNumber = Math.floor(Math.random() * 90) + 10;
        s.rememberedNumberStage = false;
      }

      tone(320, 0.045, 0.025);
    };

    const resetRun = () => {
      s.phase = "COMMAND";
      s.started = true;
      s.commandIndex = 0;
      s.commandT = 0;
      s.score = 0;
      s.failedText = "";
      s.failFlash = 0;
      s.successFlash = 0;
      s.timerSegments = SEGMENTS;
      s.lastKind = null;
      s.previousRequiredPress = null;
      s.buttonDown = false;
      s.presses = 0;
      s.humanAnswer = null;
      s.memoryCats = countCatsForRun();
      s.currentCats = s.memoryCats;
      s.memoryNumber = Math.floor(Math.random() * 90) + 10;
      s.clockHour = 1 + Math.floor(Math.random() * 12);
      s.combo = 0;
      s.maxCombo = 0;
      s.feedback = "";
      s.feedbackT = 0;
      s.totalClears = 0;
      particles.length = 0;
      s.inputLockedUntil = performance.now() + 350;
      s.commands = buildCommands();
      setupCommand();
      buzz(15);
      tone(260, 0.08, 0.03);
    };

    const buttonHit = (x: number, y: number) =>
      Math.hypot(x - BUTTON_X, y - BUTTON_Y) <= BUTTON_R + 8;

    const ratHit = (x: number, y: number) =>
      s.ratVisible && x > 270 && x < 370 && y > 430 && y < 565;

    const countTarget = (c: Command) => {
      if (c.kind === "COUNT_WORDS") return c.id === "g2a" ? 8 : 7;
      if (c.kind === "MATH_COUNT") return Number(c.variant) + 2;
      if (c.kind === "RANDOM_COUNT") return Number(c.variant) || 4;
      if (c.kind === "SPIDER_COUNT") return Number(c.variant) || 3;
      return 0;
    };

    const onPress = (x: number, y: number) => {
      const now = performance.now();
      if (now < s.inputLockedUntil) return;
      if (s.phase === "INTRO") {
        resetRun();
        return;
      }
      if (s.phase === "FAIL") {
        resetRun();
        return;
      }
      if (s.phase !== "COMMAND") return;

      const c = current();
      if (!c) return;

      if (c.kind === "RAT_CUE" && ratHit(x, y)) {
        finishCommand(180);
        return;
      }

      if (!buttonHit(x, y)) return;

      s.buttonDown = true;
      s.presses += 1;

      switch (c.kind) {
        case "PRESS":
          finishCommand(100);
          return;
        case "DONT":
        case "QUICK_DONT":
        case "WAIT":
          fail("TOO SOON");
          return;
        case "COUNT_WORDS":
          if (s.presses > countTarget(c)) fail("TOO MANY");
          return;
        case "LESS_TWO":
          if (s.presses >= 2) fail("TOO MANY");
          return;
        case "MORE_FIVE":
          return;
        case "CORNERS":
          if (s.presses > s.shapeNeed) fail("TOO MANY");
          if (s.presses === s.shapeNeed) finishCommand(150);
          return;
        case "HUMAN":
          s.humanAnswer = true;
          finishCommand(110);
          return;
        case "ROBOT":
          if (s.humanAnswer === null) {
            fail("NO PREVIOUS ANSWER");
          } else if (s.humanAnswer) {
            fail("INCONSISTENT");
          } else {
            finishCommand(110);
          }
          return;
        case "DOUBLE":
          if (s.presses > 2) fail("TOO MANY");
          if (s.presses === 2) finishCommand(130);
          return;
        case "HOLD":
          return;
        case "MATH_COUNT":
        case "RANDOM_COUNT":
        case "SPIDER_COUNT":
          if (s.presses > countTarget(c)) fail("TOO MANY");
          return;
        case "SPIDER_DONT":
          fail("NEVER PRESS");
          return;
        case "HOLD_LONG":
          if (s.holdStart === null) s.holdStart = s.commandT;
          return;
        case "SAME_AS_LAST":
          if (s.previousRequiredPress === true) finishCommand(120);
          else fail("THIS ONE WAS A NO-PRESS");
          return;
        case "RAT_CUE":
          fail("WRONG TARGET");
          return;
        case "CATS_EVEN":
          if (s.currentCats % 2 === 1) fail("ODD — DO NOTHING");
          else finishCommand(140);
          return;
        case "CATS_EARLIER":
          if (s.presses > s.memoryCats) fail("TOO MANY");
          return;
        case "NEXT_LIE":
          fail("YOU PRESSED BEFORE READING");
          return;
        case "RESPECT":
          finishCommand(120);
          return;
        case "KEEP_PRESSING":
          return;
        case "HALF_TIME":
          if (s.commandT < c.duration * 0.5) fail("TOO SOON");
          else finishCommand(170);
          return;
        case "MORE_THAN_CORNERS":
          return;
        case "MEMORY_SHOW":
          fail("LOOK FIRST");
          return;
        case "MEMORY_CHECK":
          if (s.memoryNumber % 2 === 0) finishCommand(120);
          else fail("MEMORY TRAP");
          return;
        case "CLOCK":
          if (s.presses > s.clockHour) fail("TOO MANY");
          return;
        case "FINAL":
          finishCommand(250);
          return;
        default:
          return;
      }
    };

    const onRelease = () => {
      if (performance.now() < s.inputLockedUntil) return;
      if (s.phase !== "COMMAND") return;
      const c = current();
      if (!c) return;
      s.buttonDown = false;

      if (c.kind === "HOLD") {
        if (s.commandT < c.duration - 0.15) {
          fail("RELEASED TOO SOON");
        }
      }
      if (c.kind === "HOLD_LONG") {
        const held = s.holdStart === null ? 0 : s.commandT - s.holdStart;
        if (held < 2) fail("HOLD LONGER");
        else finishCommand(150);
      }
    };

    const updateCommand = (dt: number) => {
      const c = current();
      if (!c) return;

      s.commandT += dt;

      const remaining = clamp(1 - s.commandT / c.duration, 0, 1);
      const seg = Math.ceil(remaining * SEGMENTS);
      if (seg < s.timerSegments) {
        s.timerSegments = seg;
        if (seg <= 8) tone(430, 0.025, 0.022);
        else tone(560, 0.018, 0.012);
      }

      if (c.kind === "RAT_CUE") {
        s.ratVisible = s.commandT >= 1.5;
      }

      if (c.kind === "SPIDER_COUNT") {
        s.spiderVisible = s.commandT >= 1.3 && s.commandT <= 3.8;
      }

      if (c.kind === "HALF_TIME") {
        s.spiderVisible = s.commandT >= 7 && s.commandT < 12;
      }
      if (c.kind === "SPIDER_DONT") {
        s.spiderVisible = s.commandT >= 1.2 && s.commandT < c.duration - 0.35;
      }

      if (c.kind === "HOLD_LONG" && s.buttonDown && s.holdStart === null) {
        s.holdStart = s.commandT;
      }

      if (c.kind === "HOLD_LONG" && s.buttonDown && s.holdStart !== null && s.commandT - s.holdStart >= 2) {
        s.phaseLabel = "RELEASE NOW";
      } else if (c.kind !== "MEMORY_SHOW") {
        s.phaseLabel = s.commandT < 0.75 ? "READ" : "ACT";
      }

      if (c.kind === "MEMORY_SHOW") {
        s.phaseLabel = s.commandT < 1.5 ? "MEMORIZE" : "LOCKED";
      }

      if (c.kind === "CATS_EVEN" && s.commandT >= 1.6) {
        s.phaseLabel = s.currentCats % 2 === 0 ? "EVEN → PRESS" : "ODD → DON'T";
      }

      if (c.kind === "CATS_EARLIER" && s.commandT >= c.duration * 0.45) {
        s.phaseLabel = String(s.memoryCats) + " CATS EARLIER";
      }

      if (c.kind === "MORE_THAN_CORNERS") {
        s.phaseLabel = s.presses >= 16 ? "ENOUGH" : "KEEP GOING";
      }

      // Automatic outcomes.
      if (s.commandT >= c.duration) {
        switch (c.kind) {
          case "DONT":
          case "QUICK_DONT":
          case "WAIT":
            finishCommand(90);
            return;
          case "COUNT_WORDS":
          case "MATH_COUNT":
          case "RANDOM_COUNT":
          case "SPIDER_COUNT":
            if (s.presses === countTarget(c)) finishCommand(120);
            else fail("WRONG COUNT");
            return;
          case "SPIDER_DONT":
            finishCommand(100);
            return;
          case "LESS_TWO":
            if (s.presses < 2) finishCommand(110);
            else fail("TOO MANY");
            return;
          case "MORE_FIVE":
            if (s.presses > 5) finishCommand(110);
            else fail("NOT ENOUGH");
            return;
          case "HOLD":
            if (s.buttonDown) finishCommand(140);
            else fail("NOT HELD");
            return;
          case "HUMAN":
            if (s.presses === 0) {
              s.humanAnswer = false;
              finishCommand(110);
            } else {
              finishCommand(110);
            }
            return;
          case "ROBOT":
            if (s.humanAnswer === true && s.presses === 0) finishCommand(110);
            else if (s.humanAnswer === false && s.presses > 0) finishCommand(110);
            else fail("INCONSISTENT");
            return;
          case "DOUBLE":
            if (s.presses === 2) finishCommand(110);
            else fail("NOT TWO");
            return;
          case "CORNERS":
            if (s.presses === s.shapeNeed) finishCommand(150);
            else fail("WRONG CORNERS");
            return;
          case "HOLD_LONG":
            if (s.buttonDown) {
              const held = s.holdStart === null ? 0 : s.commandT - s.holdStart;
              if (held >= 2) finishCommand(150);
              else fail("NOT LONG ENOUGH");
            } else fail("LET GO");
            return;
          case "SAME_AS_LAST":
            if (s.previousRequiredPress === false) finishCommand(120);
            else fail("THIS ONE WAS PRESS");
            return;
          case "RAT_CUE":
            fail("MISSED THE TARGET");
            return;
          case "CATS_EVEN":
            if (s.currentCats % 2 === 1 && s.presses === 0) finishCommand(130);
            else fail("WRONG CAT ANSWER");
            return;
          case "CATS_EARLIER":
            if (s.presses === s.memoryCats) finishCommand(150);
            else fail("WRONG MEMORY COUNT");
            return;
          case "NEXT_LIE":
            finishCommand(90);
            return;
          case "RESPECT":
            fail("TOO LATE");
            return;
          case "KEEP_PRESSING":
            finishCommand(130);
            return;
          case "HALF_TIME":
            fail("TOO LATE");
            return;
          case "MORE_THAN_CORNERS":
            if (s.presses >= 16) finishCommand(190);
            else fail("KEEP PRESSING");
            return;
          case "CLOCK":
            if (s.presses === s.clockHour) finishCommand(140);
            else fail("WRONG TIME");
            return;
          case "MEMORY_SHOW":
            s.phaseLabel = "REMEMBERED";
            finishCommand(100);
            return;
          case "MEMORY_CHECK":
            if (s.memoryNumber % 2 === 1 && s.presses === 0) finishCommand(120);
            else fail("MEMORY TRAP");
            return;
          case "FINAL":
            fail("TOO LATE");
            return;
        }
      }
    };

    const drawRounded = (x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    };

    const text = (value: string, x: number, y: number, size: number, fill = "#f2fff8", weight = 900) => {
      ctx.fillStyle = fill;
      ctx.font = weight + " " + size + "px Inter,system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(value, x, y);
    };

    const drawParticles = () => {
      for (const p of particles) {
        const alpha = clamp(p.life / p.maxLife, 0, 1);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#7dffad";
        ctx.shadowBlur = 14;
        ctx.shadowColor = "#2aff72";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha + 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const drawGlowDot = (x: number, y: number, r: number, fill: string) => {
      ctx.save();
      ctx.shadowBlur = r * 1.8;
      ctx.shadowColor = fill;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawGrid = () => {
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = "#00ff7b";
      ctx.lineWidth = 1;
      for (let x = -20; x < W + 20; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 140);
        ctx.lineTo(x - 45, H);
        ctx.stroke();
      }
      for (let y = 170; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawNoise = () => {
      ctx.save();
      for (let i = 0; i < 60; i++) {
        const x = (i * 83 + s.commandIndex * 17) % W;
        const y = 90 + ((i * 47) % 690);
        ctx.fillStyle = i % 3 === 0 ? "#00ff7b10" : "#ffffff09";
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.restore();
    };

    const drawTunnel = () => {
      const g = ctx.createRadialGradient(BUTTON_X, 420, 30, BUTTON_X, 420, 330);
      g.addColorStop(0, "#0a2e1a");
      g.addColorStop(0.35, "#061d13");
      g.addColorStop(0.75, "#03100b");
      g.addColorStop(1, "#010404");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.strokeStyle = "#00ff7b12";
      for (let r = 80; r < 360; r += 28) {
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(BUTTON_X, 420, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      drawGrid();
      drawNoise();
    };

    const drawTimer = () => {
      if (s.phase !== "COMMAND") return;
      const c = current();
      if (!c) return;

      const p = clamp(1 - s.commandT / c.duration, 0, 1);
      const lit = Math.ceil(p * SEGMENTS);

      ctx.save();
      for (let i = 0; i < SEGMENTS; i++) {
        const a = -Math.PI / 2 + (i / SEGMENTS) * Math.PI * 2;
        const x = BUTTON_X + Math.cos(a) * RING_R;
        const y = BUTTON_Y + Math.sin(a) * RING_R;
        const on = i < lit;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a + Math.PI / 2);

        let fill = on ? "#12ef4e" : "#0d2b19";
        if (on && p < 0.2) fill = "#ff3352";
        else if (on && p < 0.38) fill = "#ffb22e";

        ctx.fillStyle = fill;
        ctx.shadowBlur = on ? 10 : 0;
        ctx.shadowColor = fill;
        ctx.beginPath();
        ctx.roundRect(-5.5, -15, 11, 30, 5);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();

      text(Math.max(0, c.duration - s.commandT).toFixed(1) + "s", BUTTON_X, BUTTON_Y - 132, 15, p < 0.2 ? "#ff6b7f" : "#c8f6d8", 950);
      if (p < 0.2) {
        ctx.globalAlpha = 0.25 + Math.sin(s.commandT * 18) * 0.08;
        ctx.fillStyle = "#ff2f4d";
        ctx.fillRect(12, 74, W - 24, H - 88);
        ctx.globalAlpha = 1;
      }
    };

    const drawButton = (label: string) => {
      const y = BUTTON_Y + (s.buttonDown ? 4 : 0);
      const glow = s.buttonDown ? "#aaffd0" : "#00ff59";
      const grd = ctx.createRadialGradient(BUTTON_X - 23, y - 24, 6, BUTTON_X, y, BUTTON_R + 30);
      grd.addColorStop(0, "#ffffff");
      grd.addColorStop(0.18, "#7cffad");
      grd.addColorStop(0.62, "#16cf4e");
      grd.addColorStop(0.92, "#087a2c");
      grd.addColorStop(1, "#033b18");

      ctx.save();
      ctx.shadowBlur = 34;
      ctx.shadowColor = glow;
      ctx.globalAlpha = 0.88;
      ctx.strokeStyle = "#55ff9a55";
      ctx.lineWidth = 2 + Math.sin(performance.now() / 170) * 0.8;
      ctx.beginPath();
      ctx.arc(BUTTON_X, y, BUTTON_R + 12 + Math.sin(performance.now() / 220) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(BUTTON_X, y, BUTTON_R, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#baffcd68";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(BUTTON_X, y, BUTTON_R - 7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#03210d";
      ctx.font = "950 18px Inter,system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, BUTTON_X, y + 1);

      ctx.fillStyle = "#c8ffda70";
      ctx.font = "800 8px Inter,system-ui,sans-serif";
      ctx.fillText("ONE BUTTON", BUTTON_X, y + BUTTON_R + 21);
      ctx.restore();
    };

    const drawPanel = (title: string, detail: string) => {
      drawRounded(18, 70, 354, 98, 22, "#020806d9", "#0cff6a20");
      text("UNDER PRESSURE", BUTTON_X, 88, 9, "#42ff89", 900);
      text(title, BUTTON_X, 120, title.length > 22 ? 19 : 25, "#f4fff7", 950);
      text(detail, BUTTON_X, 148, 10, "#b2c9bc", 700);
    };

    const drawShape = (shape: Shape) => {
      const cx = BUTTON_X;
      const cy = 365;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = "#ffffff";
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#00ff71";
      ctx.lineWidth = 7;

      if (shape === "TRIANGLE") {
        ctx.beginPath();
        ctx.moveTo(0, -95);
        ctx.lineTo(108, 78);
        ctx.lineTo(-108, 78);
        ctx.closePath();
        ctx.stroke();
      } else if (shape === "SQUARE") {
        ctx.strokeRect(-92, -92, 184, 184);
      } else if (shape === "STAR") {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          const r = i % 2 === 0 ? 108 : 48;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (shape === "CIRCLE") {
        ctx.beginPath();
        ctx.arc(0, 0, 92, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        const points = 10;
        for (let i = 0; i < points; i++) {
          const a = -Math.PI / 2 + (i * Math.PI * 2) / points;
          const r = 62 + ((i * 31) % 5) * 16;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (!i) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();

      if (shape === "STAR") text("10 coins / corners", BUTTON_X, 485, 10, "#66ff9c", 800);
      else text(String(shapeInfo(shape).need) + " coins / corners", BUTTON_X, 485, 10, "#66ff9c", 800);
    };

    const drawCat = (x: number, y: number, scaleFactor: number, phase: number) => {
      ctx.save();
      ctx.translate(x, y + Math.sin(s.commandT * 5 + phase) * 3);
      ctx.scale(scaleFactor, scaleFactor);
      ctx.fillStyle = "#e7fff0";
      ctx.strokeStyle = "#1ce968";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-14, -14);
      ctx.lineTo(-20, -29);
      ctx.lineTo(-5, -20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(14, -14);
      ctx.lineTo(20, -29);
      ctx.lineTo(5, -20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#03210d";
      ctx.beginPath();
      ctx.arc(-7, -2, 2, 0, Math.PI * 2);
      ctx.arc(7, -2, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawSpider = () => {
      const x = BUTTON_X + Math.sin(s.commandT * 3) * 50;
      const y = 280 + (s.commandT * 80) % 110;
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = "#c4d9cc";
      ctx.fillStyle = "#06100a";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 15, Math.sin(a) * 15);
        ctx.lineTo(Math.cos(a) * 46, Math.sin(a) * 34);
        ctx.stroke();
      }
      ctx.fillStyle = "#ff2e49";
      ctx.beginPath();
      ctx.arc(-7, -5, 3, 0, Math.PI * 2);
      ctx.arc(7, -5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawRat = () => {
      const x = 318;
      const y = 500 + Math.sin(s.commandT * 7) * 8;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = "#d9e8df";
      ctx.strokeStyle = "#36ff87";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 42, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-33, -13, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ff6d85";
      ctx.beginPath();
      ctx.arc(-45, -15, 4, 0, Math.PI * 2);
      ctx.arc(-20, -33, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#c7d9cf";
      ctx.beginPath();
      ctx.moveTo(38, 7);
      ctx.quadraticCurveTo(65, 25, 76, 5);
      ctx.stroke();
      ctx.fillStyle = "#03210d";
      ctx.beginPath();
      ctx.arc(-36, -16, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawClock = (hour: number) => {
      const cx = BUTTON_X;
      const cy = 370;
      const r = 92;
      ctx.save();
      ctx.fillStyle = "#07130b";
      ctx.strokeStyle = "#5bff9a";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6 - Math.PI / 2;
        const x = cx + Math.cos(a) * (r - 12);
        const y = cy + Math.sin(a) * (r - 12);
        text(String(i + 1), x, y, 10, "#d8ffe6", 800);
      }
      const angle = (hour % 12) * Math.PI / 6 - Math.PI / 2;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * 54, cy + Math.sin(angle) * 54);
      ctx.stroke();
      ctx.fillStyle = "#21ee63";
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawWeirdShape = () => {
      const cx = BUTTON_X;
      const cy = 350;
      const n = s.weirdCorners;
      ctx.save();
      ctx.strokeStyle = "#fff";
      ctx.shadowBlur = 16;
      ctx.shadowColor = "#00ff71";
      ctx.lineWidth = 6;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
        const r = 92 + Math.sin(i * 9.7 + s.commandT * 3) * 24;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (!i) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      text("16+ PRESSIONS", BUTTON_X, 485, 12, "#65ff9e", 900);
    };

    const drawCommand = (c: Command) => {
      drawPanel(c.title, c.detail || "Lis tout avant d'agir.");

      switch (c.kind) {
        case "PRESS":
          text("UNE PRESSION", BUTTON_X, 330, 19, "#7dffad", 900);
          break;
        case "DONT":
        case "QUICK_DONT":
        case "WAIT":
          text("NE TOUCHE À RIEN", BUTTON_X, 330, 19, "#ffda7d", 900);
          break;
        case "COUNT_WORDS":
          drawRounded(42, 235, 306, 96, 18, "#06170d", "#1cff7028");
          text("LIRE", BUTTON_X, 250, 9, "#57ff92", 900);
          text(c.id === "g2a" ? "COUNT  THE  WORDS  IN  THIS  SENTENCE" : "READ  EVERY  WORD  BEFORE  YOU  PRESS", BUTTON_X, 286, 14, "#ecfff4", 800);
          text(String(countTarget(c)) + " MOTS À COMPTER", BUTTON_X, 485, 11, "#65ff9e", 900);
          break;
        case "LESS_TWO":
          text("0 ou 1 PRESSION", BUTTON_X, 350, 24, "#6cff9f", 950);
          break;
        case "MORE_FIVE":
          text("6+ PRESSIONS", BUTTON_X, 350, 24, "#6cff9f", 950);
          break;
        case "CORNERS":
          if (s.commandT < 0.85) {
            text("UNE FORME ARRIVE...", BUTTON_X, 365, 16, "#8affb1", 850);
          } else {
            drawShape(s.currentShape);
          }
          break;
        case "HUMAN":
        case "ROBOT":
          text("OUI = PRESS", 115, 350, 13, "#aaffc5", 800);
          text("NON = WAIT", 275, 350, 13, "#ffd797", 800);
          break;
        case "DOUBLE":
          text(String(s.presses) + " / 2", BUTTON_X, 350, 32, "#75ffa7", 950);
          break;
        case "HOLD":
          text("MAINTIENS", BUTTON_X, 350, 28, "#75ffa7", 950);
          text("JUSQU'À LA FIN", BUTTON_X, 390, 12, "#c9ded1", 800);
          break;
        case "MATH_COUNT":
          text("1 + 2 + " + String(Number(c.variant) || 3), BUTTON_X, 345, 35, "#ffffff", 950);
          text("UNE PRESSION PAR UNITÉ", BUTTON_X, 392, 11, "#69ff9f", 800);
          break;
        case "QUICK_DONT":
          text("RÉAGIS PAS", BUTTON_X, 350, 30, "#ffd77d", 950);
          break;
        case "RANDOM_COUNT":
        case "SPIDER_COUNT":
          text(String(countTarget(c) - s.presses) + " RESTANT(S)", BUTTON_X, 350, 26, "#75ffa7", 950);
          break;
        case "SPIDER_DONT":
          if (s.spiderVisible) drawSpider();
          else text("L'ARAIGNÉE ARRIVE...", BUTTON_X, 365, 15, "#ffda7d", 900);
          break;
        case "HOLD_LONG":
          text(s.holdStart !== null && s.buttonDown ? "MAINTIENS..." : "PLUS DE 2 SEC", BUTTON_X, 350, 26, "#75ffa7", 950);
          if (s.phaseLabel === "RELEASE NOW") text("RELÂCHE", BUTTON_X, 410, 18, "#ffda7d", 950);
          break;
        case "SAME_AS_LAST":
          text("COPIE LE DERNIER", BUTTON_X, 345, 24, "#75ffa7", 950);
          text("PRESS = PRESS • WAIT = WAIT", BUTTON_X, 390, 10, "#c8d8cf", 800);
          break;
        case "RAT_CUE":
          text("UN RAT VA ARRIVER À DROITE", BUTTON_X, 325, 15, "#dfffe8", 800);
          text("PRESSE LE RAT, PAS LE BOUTON", BUTTON_X, 365, 13, "#65ff9e", 900);
          if (s.ratVisible) drawRat();
          else text("ATTENDS...", BUTTON_X, 430, 13, "#b8cfc2", 800);
          break;
        case "CATS_EVEN":
          text("LES CHATS VONT ARRIVER", BUTTON_X, 300, 14, "#65ff9e", 900);
          if (s.commandT >= 1.0) {
            for (let i = 0; i < s.currentCats; i++) drawCat(62 + i * 53, 380, 0.9, i * 0.5);
            text("PAIR = PRESS • IMPAIR = WAIT", BUTTON_X, 485, 11, "#d9e9df", 800);
          } else {
            text("COMPTE-LES QUAND ILS ARRIVENT", BUTTON_X, 385, 12, "#c7d9ce", 800);
          }
          break;
        case "CATS_EARLIER":
          text("COMBIEN DE CHATS PLUS TÔT ?", BUTTON_X, 330, 18, "#ffffff", 900);
          text(String(s.presses) + " PRESSIONS", BUTTON_X, 375, 27, "#65ff9e", 950);
          text("LE NOMBRE EST CACHÉ : SOUVIENS-TOI.", BUTTON_X, 415, 10, "#bfd4c6", 800);
          break;
        case "NEXT_LIE":
          text("UNE CONSIGNE PIÉGEUSE", BUTTON_X, 330, 18, "#ffcf7e", 900);
          text("LIS JUSQU'AU BOUT", BUTTON_X, 370, 14, "#e7f4ec", 800);
          break;
        case "RESPECT":
          text("UNE PRESSION", BUTTON_X, 350, 20, "#65ff9e", 900);
          break;
        case "KEEP_PRESSING":
          text("CONTINUE", BUTTON_X, 350, 24, "#65ff9e", 950);
          text(String(s.presses) + " PRESSIONS", BUTTON_X, 394, 12, "#cfe8d9", 800);
          break;
        case "HALF_TIME":
          text("ATTENDS 10 SEC", BUTTON_X, 300, 20, "#65ff9e", 950);
          text("PUIS PRESSE", BUTTON_X, 338, 20, "#ffffff", 950);
          text("ARAIGNÉE = DISTRACTION, PAS UNE CONSIGNE", BUTTON_X, 382, 10, "#ffd68a", 800);
          if (s.spiderVisible) drawSpider();
          break;
        case "MORE_THAN_CORNERS":
          drawWeirdShape();
          break;
        case "CLOCK":
          drawClock(s.clockHour);
          break;
        case "MEMORY_SHOW":
          if (s.commandT < 0.85) {
            text("UN NOMBRE VA APPARAÎTRE", BUTTON_X, 350, 15, "#65ff9e", 900);
            text("MÉMORISE-LE", BUTTON_X, 390, 18, "#ffffff", 900);
          } else {
            text(String(s.memoryNumber), BUTTON_X, 350, 72, "#65ff9e", 950);
            text("MÉMORISE CE NOMBRE", BUTTON_X, 430, 13, "#d9f4e3", 800);
          }
          break;
        case "MEMORY_CHECK":
          text("LE NOMBRE ÉTAIT-IL PAIR ?", BUTTON_X, 335, 18, "#fff", 900);
          text("PAIR = PRESS • IMPAIR = WAIT", BUTTON_X, 382, 12, "#65ff9e", 900);
          text("MÉMOIRE > RÉFLEXE", BUTTON_X, 420, 10, "#b8d3c2", 800);
          break;
        case "FINAL":
          text("PRESS TO ASCEND", BUTTON_X, 350, 25, "#65ff9e", 950);
          break;
      }
    };

    const drawIntro = () => {
      text("UNDER PRESSURE", BUTTON_X, 210, 31, "#f2fff8", 950);
      text("ONE BUTTON • MANY TRAPS", BUTTON_X, 252, 11, "#52ff91", 900);
      drawRounded(32, 294, 326, 138, 24, "#020806d8", "#00ff7022");
      text("LIS TOUT.", BUTTON_X, 322, 20, "#ffffff", 950);
      text("LE CERCLE AUTOUR DU BOUTON EST LE TIMER.", BUTTON_X, 356, 11, "#b9d0c1", 750);
      text("LES VISUELS PIÈGES SONT TOUJOURS ANNONCÉS.", BUTTON_X, 380, 11, "#b9d0c1", 750);
      text("UNE ERREUR = RUN TERMINÉ.", BUTTON_X, 404, 11, "#ff9f9f", 800);
      text("CHAQUE CLEAR AUGMENTE TON COMBO.", BUTTON_X, 428, 10, "#70ffa5", 850);
      text("TAPE POUR ENTRER.", BUTTON_X, 470, 12, "#ffffff", 950);
    };

    const drawFail = () => {
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = "#210509";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      text("RUN FAILED", BUTTON_X, 265, 42, "#ff5c73", 950);
      text(s.failedText, BUTTON_X, 320, 15, "#fff", 850);
      text("SCORE", BUTTON_X, 370, 10, "#8eb19e", 800);
      text(String(s.score), BUTTON_X, 408, 30, "#ffffff", 950);
      text("TAPE POUR RECOMMENCER", BUTTON_X, 488, 13, "#65ff9e", 900);
    };

    const drawEnd = () => {
      text("ASCENSION COMPLETE", BUTTON_X, 240, 31, "#65ff9e", 950);
      text("TU AS SURVÉCU AUX 43 COMMANDES.", BUTTON_X, 284, 12, "#d6f6e1", 800);
      drawRounded(44, 320, 302, 104, 24, "#020b05e8", "#13ff6a26");
      text("SCORE", BUTTON_X, 350, 9, "#7db893", 800);
      text(String(s.score), BUTTON_X, 390, 38, "#ffffff", 950);
      text("MEILLEUR  " + String(s.best), BUTTON_X, 452, 11, "#65ff9e", 850);
      text("MAX COMBO ×" + String(s.maxCombo), BUTTON_X, 477, 11, "#8ed8ab", 850);
      text("TAPE POUR REJOUER", BUTTON_X, 510, 13, "#ffffff", 900);
    };

    const drawHud = () => {
      drawRounded(18, 18, 170, 36, 15, "#020706cc", "#0cff6a20");
      text(String(Math.max(0, s.commandIndex + 1)).padStart(2, "0") + " / " + String(s.commands.length).padStart(2, "0"), 103, 36, 11, "#bde8cb", 850);
      drawRounded(198, 18, 174, 36, 15, "#020706cc", "#0cff6a20");
      text("SCORE " + String(s.score), 285, 36, 11, "#bde8cb", 850);
      if (s.combo > 1) {
        drawRounded(132, 61, 126, 24, 12, "#092615dd", "#35ff7828");
        text("COMBO ×" + String(s.combo), 195, 73, 10, "#71ffab", 950);
      }
    };

    const draw = () => {
      const jx = s.failFlash > 0 ? (Math.random() - 0.5) * 8 : 0;
      const jy = s.failFlash > 0 ? (Math.random() - 0.5) * 8 : 0;

      ctx.save();
      ctx.translate(jx, jy);

      drawTunnel();
      drawHud();

      if (s.phase === "INTRO") {
        drawIntro();
        drawButton("START");
      } else if (s.phase === "FAIL") {
        drawFail();
      } else if (s.phase === "END") {
        drawEnd();
      } else {
        const c = current();
        if (c) drawCommand(c);
        drawParticles();
        drawTimer();
        drawButton(c?.kind === "DONT" || c?.kind === "WAIT" || c?.kind === "QUICK_DONT" ? "DON'T" : "PRESS");
        text(s.phaseLabel, BUTTON_X, 535, 9, s.phaseLabel === "RELEASE NOW" ? "#ffcf73" : "#7ae99b", 900);
        if (s.feedbackT > 0) {
          ctx.globalAlpha = clamp(s.feedbackT / 0.65, 0, 1);
          text(s.feedback, BUTTON_X, 210 - (0.65 - s.feedbackT) * 24, 26, s.feedback === "PERFECT" ? "#8dffb6" : "#ffffff", 950);
          ctx.globalAlpha = 1;
        }
      }

      if (s.successFlash > 0) {
        ctx.save();
        ctx.globalAlpha = s.successFlash * 0.16;
        ctx.fillStyle = "#24ff72";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      ctx.restore();
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      scale = Math.min(w / W, h / H);
      ox = (w - W * scale) / 2;
      oy = (h - H * scale) / 2;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, ox * dpr, oy * dpr);
    };

    const pointerDown = (e: PointerEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - ox) / scale;
      const y = (e.clientY - rect.top - oy) / scale;

      if (s.phase === "COMMAND" && current()?.kind === "RAT_CUE" && ratHit(x, y)) {
        onPress(x, y);
        return;
      }
      onPress(x, y);
    };

    const pointerUp = (e: PointerEvent) => {
      e.preventDefault();
      onRelease();
    };

    const keyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      e.preventDefault();
      onPress(BUTTON_X, BUTTON_Y);
    };

    const keyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      e.preventDefault();
      onRelease();
    };

    const loop = (now: number) => {
      if (dead) return;
      const dt = Math.min(0.033, Math.max(0, (now - last) / 1000));
      last = now;

      if (s.phase === "COMMAND") updateCommand(dt);
      s.successFlash = Math.max(0, s.successFlash - dt);
      s.failFlash = Math.max(0, s.failFlash - dt);
      s.feedbackT = Math.max(0, s.feedbackT - dt);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.pow(0.02, dt);
        p.vy += 170 * dt;
        if (p.life <= 0) particles.splice(i, 1);
      }
      draw();

      raf = requestAnimationFrame(loop);
    };

    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("resize", resize);

    resize();
    raf = requestAnimationFrame(loop);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("resize", resize);
      try {
        audio?.close();
      } catch {}
    };
  }, [color]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#000",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          touchAction: "none",
        }}
        aria-label="Under Pressure"
      />
    </div>
  );
}
