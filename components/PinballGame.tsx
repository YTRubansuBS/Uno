
"use client";

import { useEffect, useRef } from "react";

type Props = { color: string; onScore?: (n: number) => void };

type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  active: boolean;
  rail: "play" | "ramp" | "orbit";
  railT: number;
  railKind: "left" | "right";
  ballSave: number;
  bonusBall?: boolean;
};

type Flipper = {
  x: number;
  y: number;
  len: number;
  rest: number;
  up: number;
  angle: number;
  prevAngle: number;
  omega: number;
  side: -1 | 1;
  pressed: boolean;
};

type Point = { x: number; y: number };

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const closestPoint = (
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
) => {
  const dx = bx - ax;
  const dy = by - ay;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return { x: ax + dx * t, y: ay + dy * t, t };
};

const cubic = (a: Point, b: Point, c: Point, d: Point, t: number): Point => {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
};

const trianglePoint = (p: Point, a: Point, b: Point, c: Point) => {
  const area = (p1: Point, p2: Point, p3: Point) =>
    (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2;
  const A = Math.abs(area(a, b, c));
  const A1 = Math.abs(area(p, b, c));
  const A2 = Math.abs(area(a, p, c));
  const A3 = Math.abs(area(a, b, p));
  return Math.abs(A - (A1 + A2 + A3)) < 0.8;
};

export default function PinballGame({ color, onScore }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef<any>({});
  const scoreRef = useRef(onScore);
  scoreRef.current = onScore;

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let dpr = 1;
    let accumulator = 0;

    const keys = { left: false, right: false, nudge: false };
    const touch = { left: false, right: false };

    const makeBoard = () => {
      const q = c.getBoundingClientRect();
      const w = Math.max(320, Math.floor(q.width));
      const h = Math.max(620, Math.floor(q.height));
      const mid = w / 2;

      const b = {
        l: Math.max(18, w * 0.11),
        r: Math.min(w - 18, w * 0.89),
        t: 78,
        b: h - 54,
      };

      const fY = b.b - 92;
      const flippers: Flipper[] = [
        {
          x: mid - 18,
          y: fY,
          len: Math.min(118, w * 0.205),
          rest: 2.96,
          up: -0.42,
          angle: 2.96,
          prevAngle: 2.96,
          omega: 0,
          side: -1,
          pressed: false,
        },
        {
          x: mid + 18,
          y: fY,
          len: Math.min(118, w * 0.205),
          rest: 0.18,
          up: 3.56,
          angle: 0.18,
          prevAngle: 0.18,
          omega: 0,
          side: 1,
          pressed: false,
        },
      ];

      return {
        w,
        h,
        b,
        mid,
        t: 0,
        score: 0,
        best: (() => {
          try {
            return Number(localStorage.getItem("sg-best-pinball")) || 0;
          } catch {
            return 0;
          }
        })(),
        ballsRemaining: 3,
        balls: [] as Ball[],
        flippers,
        particles: [] as any[],
        popups: [] as any[],
        bumpers: [
          { x: mid - 67, y: b.t + 178, r: 27, color: "#65f7ff", value: 160, pulse: 0, cool: 0 },
          { x: mid + 67, y: b.t + 178, r: 27, color: "#ff57d8", value: 180, pulse: 0, cool: 0 },
          { x: mid, y: b.t + 246, r: 30, color: "#ffe66d", value: 220, pulse: 0, cool: 0 },
        ],
        targets: Array.from({ length: 6 }, (_, i) => ({
          x: mid - 104 + i * 41.6,
          y: b.t + 105 + Math.abs(2.5 - i) * 2,
          w: 31,
          h: 15,
          lit: false,
          cool: 0,
        })),
        rollovers: Array.from({ length: 3 }, (_, i) => ({
          x: mid - 62 + i * 62,
          y: b.t + 50,
          w: 44,
          h: 13,
          lit: false,
          cool: 0,
        })),
        slings: {
          left: [
            { x: b.l + 42, y: b.b - 267 },
            { x: b.l + 110, y: b.b - 267 },
            { x: b.l + 76, y: b.b - 200 },
          ],
          right: [
            { x: b.r - 42, y: b.b - 267 },
            { x: b.r - 110, y: b.b - 267 },
            { x: b.r - 76, y: b.b - 200 },
          ],
        },
        spinner: {
          left: { x: b.l + 56, y: b.t + 327, w: 52, h: 18, spin: 0, cool: 0 },
          right: { x: b.r - 108, y: b.t + 327, w: 52, h: 18, spin: 0, cool: 0 },
        },
        locks: 0,
        jackpot: 0,
        bonus: 0,
        bonusMult: 1,
        multiball: false,
        mode: "READY" as "READY" | "TARGET RUSH" | "RAMP RUSH" | "MULTIBALL" | "GAME OVER",
        modeT: 0,
        modeHits: 0,
        skill: true,
        skillT: 3.5,
        launched: false,
        launchCharge: 0,
        drainT: 0,
        shake: 0,
        flash: 0,
        targetFlash: 0,
        ballSaveFlash: 0,
        rampHits: 0,
        totalHits: 0,
        nudgeHeat: 0,
        nudgeCooldown: 0,
        laneCooldown: 0,
        lastEvent: 0,
        endBonus: null as null | { value: number; t: number },
      };
    };

    const reset = () => {
      const s = makeBoard();
      s.balls = [{
        x: s.b.r - 25,
        y: s.b.b - 34,
        vx: 0,
        vy: 0,
        r: clamp(s.w * 0.012, 8, 11),
        active: true,
        rail: "play",
        railT: 0,
        railKind: "right",
        ballSave: 5.2,
        bonusBall: false,
      }];
      state.current = s;
    };

    const saveBest = (s: any) => {
      if (s.score > s.best) {
        s.best = s.score;
        try {
          localStorage.setItem("sg-best-pinball", String(s.score));
        } catch {}
      }
    };

    const burst = (s: any, x: number, y: number, col: string, n = 18, power = 180) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = rnd(power * 0.3, power);
        s.particles.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: rnd(0.28, 0.72),
          max: 0.72,
          size: rnd(1.5, 4.2),
          color: col,
        });
      }
    };

    const popup = (s: any, text: string, x: number, y: number, col = "#fff", size = 13) => {
      s.popups.push({ text, x, y, life: 1, color: col, size });
    };

    const addScore = (
      s: any,
      amount: number,
      x: number,
      y: number,
      col = "#fff",
      chain = true
    ) => {
      const gain = Math.round(amount * (s.multiball ? 1.35 : 1) * s.bonusMult);
      s.score += gain;
      if (chain) {
        s.lastEvent = 2.0;
        s.shake = Math.max(s.shake, 0.08);
      }
      s.bonus = Math.min(999, s.bonus + Math.max(1, Math.round(amount / 80)));
      popup(s, "+" + gain.toLocaleString("fr-FR"), x, y, col);
      burst(s, x, y, col, amount > 900 ? 32 : 12, amount > 900 ? 260 : 155);
      saveBest(s);
      scoreRef.current?.(s.score);
    };

    const lightMode = (s: any, mode: "TARGET RUSH" | "RAMP RUSH") => {
      s.mode = mode;
      s.modeT = 9;
      s.modeHits = 0;
      s.flash = 0.11;
      popup(s, mode, s.mid, s.b.t + 420, "#ffe66d", 17);
      burst(s, s.mid, s.b.t + 420, "#ffe66d", 28, 250);
    };

    const startMultiball = (s: any) => {
      s.multiball = true;
      s.mode = "MULTIBALL";
      s.modeT = 16;
      s.jackpot = 3;
      s.locks = 0;
      if (s.balls.length < 3) {
        s.balls.push({ ...makeBoardBall(s), bonusBall: true });
        s.balls.push({ ...makeBoardBall(s), bonusBall: true });
      }
      s.balls.forEach((ball: Ball, i: number) => {
        ball.x = s.mid + (i - 1) * 22;
        ball.y = s.b.t - 24;
        ball.vx = (i - 1) * 100;
        ball.vy = 700 + i * 40;
        ball.rail = "play";
        ball.active = true;
        ball.ballSave = 5.5;
      });
      popup(s, "MULTIBALL!", s.mid, s.b.t + 415, "#ff57d8", 22);
      burst(s, s.mid, s.b.t + 415, "#ff57d8", 55, 340);
      s.flash = 0.3;
    };

    const makeBoardBall = (s: any, bonusBall = true): Ball => ({
      x: s.b.r - 25,
      y: s.b.t + 110,
      vx: rnd(-130, 130),
      vy: 620,
      r: clamp(s.w * 0.012, 8, 11),
      active: true,
      rail: "play",
      railT: 0,
      railKind: Math.random() > 0.5 ? "left" : "right",
      ballSave: 5.5,
      bonusBall,
    });

    const spawnNormalBall = (s: any) => {
      s.balls = [{ ...makeBoardBall(s, false), x: s.b.r - 25, y: s.b.b - 34, vx: 0, vy: 0 }];
      s.launched = false;
      s.mode = "READY";
      s.skill = true;
      s.skillT = 3.5;
      s.jackpot = 0;
    };

    const drainMainBall = (s: any) => {
      const main = s.balls.find((b: Ball) => !b.bonusBall) ?? s.balls[0];
      if (!main) return;

      if (main.ballSave > 0) {
        main.x = s.b.r - 25;
        main.y = s.b.b - 34;
        main.vx = 0;
        main.vy = 0;
        main.active = true;
        main.ballSave = 0;
        s.launched = false;
        s.ballSaveFlash = 1.5;
        popup(s, "BALL SAVE!", s.mid, s.b.b - 150, "#65f7ff", 18);
        burst(s, s.mid, s.b.b - 150, "#65f7ff", 36, 260);
        return;
      }

      if (s.multiball) {
        main.active = false;
        if (s.balls.some((b: Ball) => b.active)) return;
        s.multiball = false;
        s.mode = "READY";
        s.jackpot = 0;
      }

      s.ballsRemaining--;
      const bonus = Math.round(s.bonus * s.bonusMult);
      s.score += bonus;
      s.endBonus = { value: bonus, t: 1.8 };
      s.bonus = 0;
      s.bonusMult = 1;

      if (s.ballsRemaining <= 0) {
        s.mode = "GAME OVER";
        s.launched = false;
        s.endBonus = { value: bonus, t: 2.2 };
        saveBest(s);
        burst(s, s.mid, s.b.b - 130, "#ff57d8", 60, 340);
      } else {
        spawnNormalBall(s);
      }
    };

    const hitWall = (
      ball: Ball,
      ax: number,
      ay: number,
      bx: number,
      by: number,
      restitution = 0.78,
      thickness = 5
    ) => {
      const p = closestPoint(ball.x, ball.y, ax, ay, bx, by);
      let dx = ball.x - p.x;
      let dy = ball.y - p.y;
      let d = Math.hypot(dx, dy);
      const minDist = ball.r + thickness;

      if (d >= minDist) return false;
      if (d < 0.001) {
        dx = -(by - ay);
        dy = bx - ax;
        d = Math.hypot(dx, dy) || 1;
      }

      const nx = dx / d;
      const ny = dy / d;

      ball.x = p.x + nx * minDist;
      ball.y = p.y + ny * minDist;

      const vn = ball.vx * nx + ball.vy * ny;
      if (vn < 0) {
        ball.vx -= (1 + restitution) * vn * nx;
        ball.vy -= (1 + restitution) * vn * ny;
      }

      const tx = -ny;
      const ty = nx;
      const vt = ball.vx * tx + ball.vy * ty;
      ball.vx -= vt * 0.018 * tx;
      ball.vy -= vt * 0.018 * ty;
      return true;
    };

    const hitFlipper = (s: any, ball: Ball, f: Flipper) => {
      const ex = f.x + Math.cos(f.angle) * f.len;
      const ey = f.y + Math.sin(f.angle) * f.len;
      const p = closestPoint(ball.x, ball.y, f.x, f.y, ex, ey);
      let dx = ball.x - p.x;
      let dy = ball.y - p.y;
      let d = Math.hypot(dx, dy);
      const radius = ball.r + 11;
      if (d >= radius) return false;

      if (d < 0.001) {
        dx = f.side;
        dy = -1;
        d = Math.hypot(dx, dy);
      }

      const nx = dx / d;
      const ny = dy / d;
      ball.x = p.x + nx * radius;
      ball.y = p.y + ny * radius;

      const contactR = Math.hypot(p.x - f.x, p.y - f.y);
      const surfaceVx = -Math.sin(f.angle) * f.omega * contactR;
      const surfaceVy = Math.cos(f.angle) * f.omega * contactR;

      const relVx = ball.vx - surfaceVx;
      const relVy = ball.vy - surfaceVy;
      const relNormal = relVx * nx + relVy * ny;

      const launchPower = f.pressed
        ? clamp(Math.abs(f.omega) * Math.max(0.35, contactR / f.len) * 0.58, 0, 1480)
        : 0;

      const bounce = Math.max(120, -relNormal * 0.83 + launchPower);

      const tangentX = -ny;
      const tangentY = nx;
      const tangential = relVx * tangentX + relVy * tangentY;

      ball.vx = surfaceVx + tangentX * tangential * 0.72 + nx * bounce;
      ball.vy = surfaceVy + tangentY * tangential * 0.72 + ny * bounce;

      const speed = Math.hypot(ball.vx, ball.vy);
      if (f.pressed && speed < 540) {
        ball.vx += nx * 260;
        ball.vy += ny * 260;
      }

      const pointScore = f.pressed ? 25 : 10;
      if (Math.abs(f.omega) > 2 || f.pressed) {
        addScore(s, pointScore, ball.x, ball.y, f.side < 0 ? "#65f7ff" : "#ff57d8");
      }
      return true;
    };

    const hitBumper = (s: any, ball: Ball, q: any) => {
      if (q.cool > 0) return false;
      const dx = ball.x - q.x;
      const dy = ball.y - q.y;
      const d = Math.hypot(dx, dy);
      const rr = ball.r + q.r + q.pulse * 2;

      if (d >= rr) return false;

      const nx = d > 0.001 ? dx / d : 0;
      const ny = d > 0.001 ? dy / d : 1;

      ball.x = q.x + nx * rr;
      ball.y = q.y + ny * rr;

      const speed = Math.max(520, Math.hypot(ball.vx, ball.vy));
      const kick = clamp(speed + 350, 620, 980);
      ball.vx = nx * kick;
      ball.vy = ny * kick;

      q.pulse = 1;
      q.cool = 0.12;
      s.totalHits++;
      addScore(s, q.value, q.x, q.y, q.color);

      if (s.mode === "TARGET RUSH") {
        s.modeHits++;
        if (s.modeHits >= 5) {
          addScore(s, 3000, s.mid, s.b.t + 420, "#ffe66d");
          s.mode = "READY";
          s.modeT = 0;
          popup(s, "RUSH COMPLETE", s.mid, s.b.t + 445, "#ffe66d", 15);
        }
      }
      return true;
    };

    const hitTarget = (s: any, ball: Ball, q: any) => {
      if (q.cool > 0) return;
      const cx = clamp(ball.x, q.x, q.x + q.w);
      const cy = clamp(ball.y, q.y, q.y + q.h);
      const dx = ball.x - cx;
      const dy = ball.y - cy;
      if (dx * dx + dy * dy > (ball.r + 4) * (ball.r + 4)) return;

      q.cool = 0.12;
      q.lit = true;
      ball.vy = Math.abs(ball.vy) + 85;
      ball.vx += rnd(-55, 55);
      addScore(s, 320, q.x + q.w / 2, q.y, "#ffe66d");
      s.targetFlash = 0.12;

      if (s.mode === "TARGET RUSH") s.modeHits++;

      if (s.targets.every((t: any) => t.lit)) {
        addScore(s, 5000, s.mid, q.y + 32, "#ff57d8");
        popup(s, "BANK JACKPOT", s.mid, q.y + 58, "#ff57d8", 18);
        burst(s, s.mid, q.y + 58, "#ff57d8", 40, 300);
        s.targets.forEach((t: any) => (t.lit = false));
        s.locks = Math.min(2, s.locks + 1);
        s.bonusMult = Math.min(6, s.bonusMult + 1);
        if (!s.multiball && s.locks >= 2) startMultiball(s);
        else if (!s.multiball && s.mode !== "TARGET RUSH") lightMode(s, "TARGET RUSH");
      }
    };

    const hitRollover = (s: any, ball: Ball, q: any, index: number) => {
      if (q.cool > 0) return;
      if (
        ball.x > q.x - ball.r &&
        ball.x < q.x + q.w + ball.r &&
        ball.y > q.y - ball.r &&
        ball.y < q.y + q.h + ball.r &&
        ball.vy < 0
      ) {
        q.cool = 0.2;
        q.lit = true;
        addScore(s, s.skill && s.skillT > 0 ? 5000 : 220, q.x + q.w / 2, q.y - 5, "#65f7ff");
        if (s.skill && s.skillT > 0) {
          s.skill = false;
          popup(s, "SKILL SHOT!", s.mid, s.b.t + 34, "#65f7ff", 17);
          burst(s, s.mid, s.b.t + 34, "#65f7ff", 34, 230);
          s.bonusMult = Math.min(6, s.bonusMult + 1);
        }
        if (s.rollovers.every((x: any) => x.lit)) {
          addScore(s, 5000, s.mid, s.b.t + 82, "#ffe66d");
          popup(s, "LANE BONUS +1X", s.mid, s.b.t + 98, "#ffe66d");
          s.rollovers.forEach((x: any) => (x.lit = false));
          s.bonusMult = Math.min(6, s.bonusMult + 1);
        }
        if (index === 1) s.laneCooldown = 0.2;
      }
    };

    const hitSpinner = (s: any, ball: Ball, q: any) => {
      if (q.cool > 0) return;
      const inside =
        ball.x > q.x - ball.r &&
        ball.x < q.x + q.w + ball.r &&
        ball.y > q.y - ball.r &&
        ball.y < q.y + q.h + ball.r;
      if (!inside || Math.abs(ball.vx) < 170) return;

      q.cool = 0.05;
      q.spin += ball.vx > 0 ? 0.45 : -0.45;
      addScore(s, 90, q.x + q.w / 2, q.y, "#bba7ff");
    };

    const enterRail = (s: any, ball: Ball) => {
      if (ball.rail !== "play") return;

      const leftRampX = s.b.l + 128;
      const rightRampX = s.b.r - 128;

      const rampY = s.b.b - 305;
      const rampWidth = 38;

      if (
        ball.vy < -180 &&
        ball.y < rampY + 70 &&
        ball.y > rampY - 100 &&
        ball.x > leftRampX - rampWidth &&
        ball.x < leftRampX + rampWidth
      ) {
        ball.rail = "ramp";
        ball.railT = 0;
        ball.railKind = "left";
        s.rampHits++;
        addScore(s, 1100, leftRampX, rampY, "#65f7ff");
        if (!s.multiball && s.rampHits % 3 === 0) lightMode(s, "RAMP RUSH");
        return;
      }

      if (
        ball.vy < -180 &&
        ball.y < rampY + 70 &&
        ball.y > rampY - 100 &&
        ball.x > rightRampX - rampWidth &&
        ball.x < rightRampX + rampWidth
      ) {
        ball.rail = "ramp";
        ball.railT = 0;
        ball.railKind = "right";
        s.rampHits++;
        addScore(s, 1300, rightRampX, rampY, "#ff57d8");
        if (!s.multiball && s.rampHits % 3 === 0) lightMode(s, "RAMP RUSH");
        return;
      }

      const orbitY = s.b.t + 235;
      if (ball.x < s.b.l + 40 && ball.y < orbitY && ball.vy < -250) {
        ball.rail = "orbit";
        ball.railT = 0;
        ball.railKind = "left";
        addScore(s, 1600, s.b.l + 28, s.b.t + 175, "#65f7ff");
      } else if (ball.x > s.b.r - 40 && ball.y < orbitY && ball.vy < -250) {
        ball.rail = "orbit";
        ball.railT = 0;
        ball.railKind = "right";
        addScore(s, 1800, s.b.r - 28, s.b.t + 175, "#ff57d8");
      }
    };

    const updateRailBall = (s: any, ball: Ball, dt: number) => {
      if (ball.rail === "play") return false;

      ball.railT += dt * (ball.rail === "ramp" ? 0.78 : 0.62);

      const left = s.b.l;
      const right = s.b.r;
      const top = s.b.t;
      const bottom = s.b.b;

      if (ball.rail === "ramp") {
        const start = ball.railKind === "left"
          ? { x: left + 128, y: bottom - 305 }
          : { x: right - 128, y: bottom - 305 };
        const mid1 = ball.railKind === "left"
          ? { x: left + 88, y: top + 248 }
          : { x: right - 88, y: top + 248 };
        const mid2 = { x: s.mid, y: top + 78 };
        const end = ball.railKind === "left"
          ? { x: right - 140, y: bottom - 255 }
          : { x: left + 140, y: bottom - 255 };

        if (ball.railT < 0.48) {
          const t = ball.railT / 0.48;
          const p = cubic(start, mid1, mid2, mid2, t);
          ball.x = p.x;
          ball.y = p.y;
        } else {
          const t = clamp((ball.railT - 0.48) / 0.52, 0, 1);
          const p = cubic(mid2, mid2, end, end, t);
          ball.x = p.x;
          ball.y = p.y;
        }

        if (ball.railT >= 1) {
          ball.rail = "play";
          ball.vx = ball.railKind === "left" ? 260 : -260;
          ball.vy = 620;
          if (s.mode === "RAMP RUSH") {
            s.modeHits++;
            addScore(s, 2200, ball.x, ball.y, "#ffe66d");
            if (s.modeHits >= 3) {
              s.mode = "READY";
              s.modeT = 0;
              popup(s, "RAMP RUSH CLEAR", s.mid, top + 445, "#ffe66d", 16);
            }
          }
        }
        return true;
      }

      const centerX = s.mid;
      const radiusX = (right - left) * 0.42;
      const radiusY = (bottom - top) * 0.34;
      const theta = ball.railKind === "left"
        ? Math.PI * (1.18 - 0.9 * ball.railT)
        : Math.PI * (-0.18 + 0.9 * ball.railT);

      ball.x = centerX + Math.cos(theta) * radiusX;
      ball.y = top + 105 + (Math.sin(theta) * radiusY);

      if (ball.railT >= 1) {
        ball.rail = "play";
        ball.vx = ball.railKind === "left" ? 310 : -310;
        ball.vy = 640;
      }
      return true;
    };

    const nudge = (s: any, dir: -1 | 1 | 0) => {
      if (s.nudgeCooldown > 0 || s.over) return;
      const amount = dir === 0 ? -200 : dir * 190;
      for (const ball of s.balls) {
        if (!ball.active || ball.rail !== "play") continue;
        ball.vx += rnd(-45, 45) + amount;
        ball.vy -= 60;
      }
      s.nudgeHeat += 1;
      s.nudgeCooldown = 0.28;
      s.shake = 0.12;
      if (s.nudgeHeat >= 5) {
        s.nudgeHeat = 0;
        popup(s, "TILT WARNING", s.mid, s.b.b - 190, "#ff6d8d", 15);
        s.balls.forEach((ball: Ball) => {
          ball.vx *= 0.7;
          ball.vy *= 0.7;
        });
      }
    };

    const launch = (s: any) => {
      if (s.mode === "GAME OVER") {
        reset();
        return;
      }
      if (s.launched) return;

      s.launched = true;
      s.mode = s.mode === "READY" ? "READY" : s.mode;
      const charge = clamp(s.launchCharge, 0, 1);
      const ball = s.balls.find((b: Ball) => !b.bonusBall) ?? s.balls[0];
      if (!ball) return;

      ball.active = true;
      ball.x = s.b.r - 25;
      ball.y = s.b.b - 34;
      ball.vx = rnd(-35, 35) + (charge - 0.5) * 100;
      ball.vy = -820 - charge * 340;
      ball.ballSave = 5.2;
      s.skill = true;
      s.skillT = 3.5;
      s.launchCharge = 0;
      burst(s, ball.x, ball.y, "#ffffff", 26, 250);
    };

    const setCharge = (s: any, charging: boolean) => {
      if (s.launched || s.mode === "GAME OVER") return;
      if (charging) {
        s.launchCharge = clamp(s.launchCharge + 0.035, 0, 1);
      }
    };

    const update = (dt: number) => {
      const s = state.current;
      if (!s || !s.w) return;

      s.t += dt;
      s.lastEvent = Math.max(0, s.lastEvent - dt);
      s.modeT = Math.max(0, s.modeT - dt);
      s.skillT = Math.max(0, s.skillT - dt);
      s.shake = Math.max(0, s.shake - dt);
      s.flash = Math.max(0, s.flash - dt);
      s.targetFlash = Math.max(0, s.targetFlash - dt);
      s.ballSaveFlash = Math.max(0, s.ballSaveFlash - dt);
      s.nudgeCooldown = Math.max(0, s.nudgeCooldown - dt);
      s.laneCooldown = Math.max(0, s.laneCooldown - dt);

      if (s.mode !== "GAME OVER" && s.mode !== "READY" && s.modeT <= 0) {
        s.mode = s.multiball ? "MULTIBALL" : "READY";
      }

      for (const p of s.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 90 * dt;
        p.life -= dt;
      }
      s.particles = s.particles.filter((p: any) => p.life > 0);

      for (const p of s.popups) {
        p.y -= 28 * dt;
        p.life -= dt;
      }
      s.popups = s.popups.filter((p: any) => p.life > 0);

      for (const q of s.bumpers) q.cool = Math.max(0, q.cool - dt * 1);
      for (const q of s.bumpers) q.pulse = Math.max(0, q.pulse - dt * 4);
      for (const q of s.targets) q.cool = Math.max(0, q.cool - dt);
      for (const q of s.rollovers) q.cool = Math.max(0, q.cool - dt);
      s.spinner.left.cool = Math.max(0, s.spinner.left.cool - dt);
      s.spinner.right.cool = Math.max(0, s.spinner.right.cool - dt);
      s.spinner.left.spin *= Math.pow(0.18, dt);
      s.spinner.right.spin *= Math.pow(0.18, dt);

      const flipperInputs = [
        keys.left || touch.left,
        keys.right || touch.right,
      ];

      s.flippers.forEach((f: Flipper, i: number) => {
        f.pressed = flipperInputs[i];
        f.prevAngle = f.angle;
        const target = f.pressed ? f.up : f.rest;
        const speed = f.pressed ? 24 : 10.5;
        f.angle += (target - f.angle) * Math.min(1, speed * dt);
        f.omega = (f.angle - f.prevAngle) / Math.max(dt, 1 / 240);
      });

      if (keys.nudge) {
        nudge(s, 0);
        keys.nudge = false;
      }

      if (!s.launched) {
        const main = s.balls.find((b: Ball) => !b.bonusBall) ?? s.balls[0];
        if (main) {
          main.x = s.b.r - 25;
          main.y = s.b.b - 34;
          main.vx = 0;
          main.vy = 0;
          main.active = true;
          main.ballSave = 5.2;
        }
        setCharge(s, true);
      }

      if (s.mode === "GAME OVER") return;

      const fixed = 1 / 120;
      accumulator += Math.min(dt, 0.05);

      while (accumulator >= fixed) {
        accumulator -= fixed;

        for (const ball of s.balls) {
          if (!ball.active) continue;

          if (!s.launched && !ball.bonusBall) continue;

          if (updateRailBall(s, ball, fixed)) continue;

          ball.ballSave = Math.max(0, ball.ballSave - fixed);
          ball.vy += 1220 * fixed;
          ball.vx *= Math.pow(0.998, fixed * 60);
          ball.vy *= Math.pow(0.9985, fixed * 60);

          ball.x += ball.vx * fixed;
          ball.y += ball.vy * fixed;

          const b = s.b;
          const center = s.mid;

          hitWall(ball, b.l + 12, b.t + 18, b.l + 12, b.b - 202, 0.82, 6);
          hitWall(ball, b.r - 12, b.t + 18, b.r - 12, b.b - 202, 0.82, 6);
          hitWall(ball, b.l + 12, b.t + 18, b.r - 12, b.t + 18, 0.8, 6);

          const leftOutIn = [
            [b.l + 70, b.b - 34, b.l + 104, b.b - 181],
            [b.l + 118, b.b - 34, b.l + 169, b.b - 181],
            [b.r - 70, b.b - 34, b.r - 104, b.b - 181],
            [b.r - 118, b.b - 34, b.r - 169, b.b - 181],
          ] as const;

          for (const [ax, ay, bx, by] of leftOutIn) {
            hitWall(ball, ax, ay, bx, by, 0.72, 7);
          }

          hitWall(ball, b.l + 42, b.b - 200, b.l + 76, b.b - 267, 0.92, 7);
          hitWall(ball, b.l + 76, b.b - 267, b.l + 146, b.b - 267, 0.92, 7);
          hitWall(ball, b.r - 42, b.b - 200, b.r - 76, b.b - 267, 0.92, 7);
          hitWall(ball, b.r - 76, b.b - 267, b.r - 146, b.b - 267, 0.92, 7);

          for (const q of s.bumpers) hitBumper(s, ball, q);

          for (const q of s.targets) hitTarget(s, ball, q);

          s.rollovers.forEach((q: any, i: number) => hitRollover(s, ball, q, i));
          hitSpinner(s, ball, s.spinner.left);
          hitSpinner(s, ball, s.spinner.right);

          for (const f of s.flippers) hitFlipper(s, ball, f);

          const slLeft = s.slings.left;
          const slRight = s.slings.right;
          const p = { x: ball.x, y: ball.y };
          const leftTri = trianglePoint(p, slLeft[0], slLeft[1], slLeft[2]);
          const rightTri = trianglePoint(p, slRight[0], slRight[1], slRight[2]);

          if (leftTri || rightTri) {
            const dir = leftTri ? 1 : -1;
            ball.x += dir * 5;
            ball.vx += dir * 410;
            ball.vy = Math.min(ball.vy, -280);
            addScore(s, 90, ball.x, ball.y, leftTri ? "#65f7ff" : "#ff57d8");
          }

          enterRail(s, ball);

          const outlaneLeft = ball.x < b.l + 84 && ball.y > b.b - 48;
          const outlaneRight = ball.x > b.r - 84 && ball.y > b.b - 48;
          const centerDrain = ball.y > b.b - 34 && ball.x > center - 42 && ball.x < center + 42;
          const bottomDrain = ball.y > b.b + 24;

          if (outlaneLeft || outlaneRight || centerDrain || bottomDrain) {
            ball.active = false;
            s.shake = 0.18;
            burst(s, ball.x, Math.min(ball.y, b.b - 20), "#ffffff", 24, 230);
          }
        }

        const active = s.balls.filter((b: Ball) => b.active);
        const mainActive = active.some((b: Ball) => !b.bonusBall);

        if (!mainActive && !s.multiball && s.launched) {
          drainMainBall(s);
        } else if (s.multiball && active.length === 0) {
          drainMainBall(s);
        }
      }
    };

    const drawBolt = (x: number, y: number, r: number, col: string, alpha = 1) => {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.lineTo(x - r * 0.2, y);
      ctx.lineTo(x - r * 0.5, y + r * 0.8);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x + r * 0.2, y);
      ctx.lineTo(x + r * 0.5, y - r * 0.8);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const draw = () => {
      const s = state.current;
      if (!s || !s.w) return;

      ctx.save();

      if (s.shake > 0) {
        ctx.translate(rnd(-4, 4), rnd(-4, 4));
      }

      const bg = ctx.createRadialGradient(s.mid, s.h * 0.45, 40, s.mid, s.h * 0.5, s.h);
      bg.addColorStop(0, "#181039");
      bg.addColorStop(0.48, "#090b1f");
      bg.addColorStop(1, "#02030b");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, s.w, s.h);

      for (let i = 0; i < 48; i++) {
        ctx.fillStyle = i % 2 ? "#65f7ff" : "#ff57d8";
        ctx.globalAlpha = 0.04 + 0.05 * Math.sin(s.t * 1.6 + i);
        ctx.fillRect((i * 83) % s.w, (i * 137 + s.t * 8) % s.h, 2, 2);
      }
      ctx.globalAlpha = 1;

      const b = s.b;

      // Cabinet / outer frame
      ctx.shadowBlur = 32;
      ctx.shadowColor = "#65f7ff55";
      ctx.fillStyle = "#070912";
      ctx.beginPath();
      ctx.roundRect(b.l - 28, b.t - 26, b.r - b.l + 56, b.b - b.t + 55, 34);
      ctx.fill();
      ctx.shadowBlur = 0;

      const frame = ctx.createLinearGradient(b.l, b.t, b.r, b.b);
      frame.addColorStop(0, "#151b3b");
      frame.addColorStop(0.5, "#090b1b");
      frame.addColorStop(1, "#15122e");
      ctx.fillStyle = frame;
      ctx.beginPath();
      ctx.roundRect(b.l - 15, b.t - 15, b.r - b.l + 30, b.b - b.t + 30, 28);
      ctx.fill();

      // Playfield
      const field = ctx.createLinearGradient(b.l, b.t, b.r, b.b);
      field.addColorStop(0, "#111b42");
      field.addColorStop(0.37, "#1b0b3a");
      field.addColorStop(1, "#081b24");
      ctx.fillStyle = field;
      ctx.beginPath();
      ctx.roundRect(b.l, b.t, b.r - b.l, b.b - b.t, 22);
      ctx.fill();

      // Rails
      ctx.strokeStyle = "#8da0c8";
      ctx.lineWidth = 6;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(b.l + 12, b.t + 18);
      ctx.lineTo(b.l + 12, b.b - 202);
      ctx.moveTo(b.r - 12, b.t + 18);
      ctx.lineTo(b.r - 12, b.b - 202);
      ctx.stroke();

      ctx.strokeStyle = "#65f7ff";
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.l + 18, b.t + 18);
      ctx.lineTo(b.r - 18, b.t + 18);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Launch lane
      ctx.fillStyle = "#080b17";
      ctx.beginPath();
      ctx.roundRect(b.r - 63, b.t + 30, 45, b.b - b.t - 75, 18);
      ctx.fill();

      ctx.strokeStyle = "#65f7ff88";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.r - 41, b.t + 50);
      ctx.lineTo(b.r - 41, b.b - 83);
      ctx.stroke();

      // Decorative inserts / guides
      for (let i = 0; i < 11; i++) {
        const yy = b.t + 140 + i * 50;
        ctx.strokeStyle = i % 2 ? "#ff57d811" : "#65f7ff12";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(b.l + 25, yy);
        ctx.lineTo(b.r - 75, yy);
        ctx.stroke();
      }

      // Top rollovers
      for (const q of s.rollovers) {
        ctx.shadowBlur = q.lit ? 18 : 6;
        ctx.shadowColor = q.lit ? "#ffe66d" : "#65f7ff";
        ctx.fillStyle = q.lit ? "#ffe66d" : "#28305f";
        ctx.beginPath();
        ctx.roundRect(q.x, q.y, q.w, q.h, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = q.lit ? "#fff6b0" : "#96a6d8";
        ctx.font = "900 8px Inter,system-ui";
        ctx.textAlign = "center";
        ctx.fillText(String.fromCharCode(65 + s.rollovers.indexOf(q)), q.x + q.w / 2, q.y + 10);
      }

      // Target bank
      for (const q of s.targets) {
        ctx.shadowBlur = q.lit ? 16 : 5;
        ctx.shadowColor = q.lit ? "#ffe66d" : "#ff57d833";
        ctx.fillStyle = q.lit ? "#ffe66d" : "#222a54";
        ctx.beginPath();
        ctx.roundRect(q.x, q.y, q.w, q.h, 5);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = q.lit ? "#fff7a8" : "#7381b4";
        ctx.fillRect(q.x + 5, q.y + 4, q.w - 10, 3);
      }

      // Lock bank
      const lockY = b.t + 145;
      for (let i = 0; i < 2; i++) {
        ctx.fillStyle = i < s.locks ? "#ff57d8" : "#222847";
        ctx.shadowBlur = i < s.locks ? 16 : 0;
        ctx.shadowColor = "#ff57d8";
        ctx.beginPath();
        ctx.arc(s.mid - 18 + i * 36, lockY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Bumpers
      for (const q of s.bumpers) {
        const pulse = q.pulse;
        const g = ctx.createRadialGradient(q.x - 7, q.y - 8, 2, q.x, q.y, q.r + 12 + pulse * 6);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.18, q.color);
        g.addColorStop(0.55, q.color + "bb");
        g.addColorStop(1, q.color + "05");
        ctx.shadowBlur = 10 + pulse * 18;
        ctx.shadowColor = q.color;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r + pulse * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#ffffffaa";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r - 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#08101e";
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r * 0.38, 0, Math.PI * 2);
        ctx.fill();
      }

      // Slingshots
      const drawSlingshot = (pts: Point[], ccol: string) => {
        ctx.fillStyle = ccol + "20";
        ctx.strokeStyle = ccol;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 13;
        ctx.shadowColor = ccol;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
      };
      drawSlingshot(s.slings.left, "#65f7ff");
      drawSlingshot(s.slings.right, "#ff57d8");

      // Inlane / outlane markings
      ctx.font = "800 8px Inter,system-ui";
      ctx.textAlign = "center";
      ctx.fillStyle = "#65f7ff66";
      ctx.save();
      ctx.translate(b.l + 84, b.b - 110);
      ctx.rotate(-1.4);
      ctx.fillText("OUTLANE", 0, 0);
      ctx.restore();
      ctx.fillStyle = "#ff57d866";
      ctx.save();
      ctx.translate(b.l + 133, b.b - 112);
      ctx.rotate(-1.25);
      ctx.fillText("INLANE", 0, 0);
      ctx.restore();
      ctx.fillStyle = "#ff57d866";
      ctx.save();
      ctx.translate(b.r - 84, b.b - 110);
      ctx.rotate(1.4);
      ctx.fillText("OUTLANE", 0, 0);
      ctx.restore();
      ctx.fillStyle = "#65f7ff66";
      ctx.save();
      ctx.translate(b.r - 133, b.b - 112);
      ctx.rotate(1.25);
      ctx.fillText("INLANE", 0, 0);
      ctx.restore();

      // Ramps and orbits
      const drawRamp = (kind: "left" | "right", col: string) => {
        const start = kind === "left"
          ? { x: b.l + 128, y: b.b - 305 }
          : { x: b.r - 128, y: b.b - 305 };
        const mid1 = kind === "left"
          ? { x: b.l + 88, y: b.t + 248 }
          : { x: b.r - 88, y: b.t + 248 };
        const mid2 = { x: s.mid, y: b.t + 78 };
        const end = kind === "left"
          ? { x: b.r - 140, y: b.b - 255 }
          : { x: b.l + 140, y: b.b - 255 };

        ctx.strokeStyle = col + "22";
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.bezierCurveTo(mid1.x, mid1.y, mid2.x, mid2.y, end.x, end.y);
        ctx.stroke();

        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 14;
        ctx.shadowColor = col;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.bezierCurveTo(mid1.x, mid1.y, mid2.x, mid2.y, end.x, end.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      };
      drawRamp("left", "#65f7ff");
      drawRamp("right", "#ff57d8");

      // Spinner bars
      for (const q of [s.spinner.left, s.spinner.right]) {
        ctx.save();
        ctx.translate(q.x + q.w / 2, q.y + q.h / 2);
        ctx.rotate(q.spin);
        ctx.strokeStyle = "#bba7ff";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#bba7ff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(16, 0);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
        ctx.strokeStyle = "#bba7ff55";
        ctx.lineWidth = 1;
        ctx.strokeRect(q.x, q.y, q.w, q.h);
      }

      // Drain
      ctx.fillStyle = "#02040b";
      ctx.beginPath();
      ctx.roundRect(b.l + 38, b.b - 42, b.r - b.l - 76, 60, 20);
      ctx.fill();
      ctx.strokeStyle = "#ffffff22";
      ctx.stroke();

      // Flippers
      for (const f of s.flippers) {
        const ex = f.x + Math.cos(f.angle) * f.len;
        const ey = f.y + Math.sin(f.angle) * f.len;
        const col = f.side < 0 ? "#65f7ff" : "#ff57d8";

        ctx.lineCap = "round";
        ctx.lineWidth = 24;
        ctx.strokeStyle = "#090d18";
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        ctx.lineWidth = 15;
        const fg = ctx.createLinearGradient(f.x, f.y, ex, ey);
        fg.addColorStop(0, col);
        fg.addColorStop(0.55, "#ffffff");
        fg.addColorStop(1, col);
        ctx.strokeStyle = fg;
        ctx.shadowBlur = f.pressed ? 25 : 9;
        ctx.shadowColor = col;
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#0a0d18";
        ctx.strokeStyle = "#b7c5ff88";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Center post
      ctx.fillStyle = "#ffe66d";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#ffe66d";
      ctx.beginPath();
      ctx.arc(s.mid, s.b.b - 101, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Balls
      for (const ball of s.balls) {
        if (!ball.active) continue;
        ctx.shadowBlur = 18;
        ctx.shadowColor = "#ffffff";
        const ballGrad = ctx.createRadialGradient(ball.x - 3, ball.y - 4, 1, ball.x, ball.y, ball.r * 1.9);
        ballGrad.addColorStop(0, "#ffffff");
        ballGrad.addColorStop(0.45, "#edf8ff");
        ballGrad.addColorStop(1, "#7da9d8");
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Particles
      for (const p of s.particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Score / topper
      ctx.fillStyle = "#05060d";
      ctx.beginPath();
      ctx.roundRect(s.mid - 140, 7, 280, 58, 18);
      ctx.fill();
      ctx.strokeStyle = color + "66";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "900 27px Inter,system-ui";
      ctx.fillText(s.score.toLocaleString("fr-FR"), s.mid, 35);

      ctx.font = "800 9px Inter,system-ui";
      ctx.fillStyle = "#ffffff88";
      ctx.fillText(
        "BEST " + s.best.toLocaleString("fr-FR") +
          "  •  BALL " + Math.max(0, s.ballsRemaining) +
          "  •  X" + s.bonusMult,
        s.mid,
        51
      );

      // Mode / information panel
      const panelY = b.b - 29;
      ctx.fillStyle = "#060912dd";
      ctx.beginPath();
      ctx.roundRect(b.l + 14, panelY - 7, b.r - b.l - 28, 24, 10);
      ctx.fill();
      ctx.strokeStyle = s.mode === "MULTIBALL" ? "#ff57d8aa" : "#65f7ff44";
      ctx.stroke();

      ctx.font = "900 9px Inter,system-ui";
      ctx.fillStyle = s.mode === "MULTIBALL" ? "#ff57d8" : "#65f7ff";
      ctx.fillText(
        s.mode +
          (s.modeT > 0 && s.mode !== "READY" ? "  " + s.modeT.toFixed(1) + "s" : ""),
        s.mid,
        panelY + 9
      );

      // Launch / skill shot instructions
      if (!s.launched && s.mode !== "GAME OVER") {
        ctx.fillStyle = "#050612e8";
        ctx.beginPath();
        ctx.roundRect(s.mid - s.w * 0.29, s.h * 0.29, s.w * 0.58, 134, 24);
        ctx.fill();
        ctx.strokeStyle = "#ffffff1c";
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = "900 25px Inter,system-ui";
        ctx.fillText("NEON FLIPPER", s.mid, s.h * 0.29 + 38);

        ctx.font = "900 12px Inter,system-ui";
        ctx.fillStyle = "#ffe66d";
        ctx.fillText(
          "SKILL SHOT  •  CHARGE " + Math.round(s.launchCharge * 100) + "%",
          s.mid,
          s.h * 0.29 + 67
        );

        ctx.font = "800 11px Inter,system-ui";
        ctx.fillStyle = "#ffffffcc";
        ctx.fillText("ESPACE / TAP = PLUNGE", s.mid, s.h * 0.29 + 92);
        ctx.fillStyle = "#65f7ff";
        ctx.fillText("← / Z  FLIP GAUCHE   •   DROITE / X  FLIP DROIT", s.mid, s.h * 0.29 + 112);
      }

      if (s.lastEvent > 0) {
        ctx.fillStyle = "#ffffffaa";
        ctx.font = "800 9px Inter,system-ui";
        ctx.fillText("COMBO • " + s.totalHits + " HITS", s.mid, 72);
      }

      if (s.ballSaveFlash > 0) {
        ctx.globalAlpha = clamp(s.ballSaveFlash / 1.5, 0, 1);
        ctx.fillStyle = "#65f7ff";
        ctx.font = "900 19px Inter,system-ui";
        ctx.fillText("BALL SAVE", s.mid, s.b.b - 190);
        ctx.globalAlpha = 1;
      }

      if (s.skill && s.launched && s.skillT > 0) {
        ctx.fillStyle = "#ffe66d";
        ctx.font = "900 11px Inter,system-ui";
        ctx.fillText("SKILL SHOT  " + s.skillT.toFixed(1), s.mid, b.t + 90);
      }

      // Popups
      for (const p of s.popups) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.font = "900 " + p.size + "px Inter,system-ui";
        ctx.fillText(p.text, p.x, p.y - (1 - p.life) * 28);
      }
      ctx.globalAlpha = 1;

      if (s.endBonus && s.endBonus.t > 0) {
        s.endBonus.t -= 1 / 60;
        ctx.fillStyle = "#fff";
        ctx.font = "900 14px Inter,system-ui";
        ctx.fillText(
          "END BONUS  +" + s.endBonus.value.toLocaleString("fr-FR"),
          s.mid,
          s.h * 0.34
        );
      }

      if (s.mode === "GAME OVER") {
        ctx.fillStyle = "#010208e8";
        ctx.fillRect(0, 0, s.w, s.h);

        ctx.fillStyle = "#ff57d8";
        ctx.font = "900 38px Inter,system-ui";
        ctx.fillText("GAME OVER", s.mid, s.h * 0.42);

        ctx.fillStyle = "#ffe66d";
        ctx.font = "900 18px Inter,system-ui";
        ctx.fillText(
          "SCORE  " + s.score.toLocaleString("fr-FR"),
          s.mid,
          s.h * 0.48
        );

        ctx.fillStyle = "#ffffff99";
        ctx.font = "800 12px Inter,system-ui";
        ctx.fillText("TAP / ESPACE POUR REJOUER", s.mid, s.h * 0.56);

        ctx.fillStyle = "#65f7ff88";
        ctx.font = "700 10px Inter,system-ui";
        ctx.fillText("3 BILLES • SKILL SHOT • RAMPES • MULTIBALL", s.mid, s.h * 0.61);
      }

      if (s.flash > 0) {
        ctx.globalAlpha = s.flash;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, s.w, s.h);
        ctx.globalAlpha = 1;
      }

      if (s.targetFlash > 0) {
        ctx.globalAlpha = s.targetFlash * 2;
        ctx.fillStyle = "#ffe66d";
        ctx.fillRect(b.l, b.t, b.r - b.l, b.b - b.t);
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    };

    const pointerDown = (e: PointerEvent) => {
      const q = c.getBoundingClientRect();
      const x = e.clientX - q.left;
      const y = e.clientY - q.top;
      const s = state.current;
      if (!s.w) return;

      if (s.mode === "GAME OVER") {
        reset();
        return;
      }

      if (!s.launched) {
        launch(s);
        return;
      }

      if (y > s.b.b - 175) {
        if (x < s.mid) touch.left = true;
        else touch.right = true;
      } else if (x < s.mid * 0.65) {
        nudge(s, -1);
      } else if (x > s.mid * 1.35) {
        nudge(s, 1);
      }
    };

    const pointerUp = () => {
      touch.left = false;
      touch.right = false;
    };

    const keyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        launch(state.current);
      }
      if (e.code === "ArrowLeft" || e.key === "z" || e.key === "Z" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        keys.left = true;
      }
      if (e.code === "ArrowRight" || e.key === "x" || e.key === "X" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        keys.right = true;
      }
      if (e.code === "ShiftLeft" || e.code === "ShiftRight" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        keys.nudge = true;
      }
    };

    const keyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.key === "z" || e.key === "Z" || e.key === "a" || e.key === "A") keys.left = false;
      if (e.code === "ArrowRight" || e.key === "x" || e.key === "X" || e.key === "d" || e.key === "D") keys.right = false;
    };

    const resize = () => {
      const q = c.getBoundingClientRect();
      const w = Math.max(320, Math.floor(q.width));
      const h = Math.max(620, Math.floor(q.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const s = state.current;
      if (!s.w) return;

      const old = { w: s.w, h: s.h };
      s.w = w;
      s.h = h;
      s.b.l = Math.max(18, w * 0.11);
      s.b.r = Math.min(w - 18, w * 0.89);
      s.b.t = 78;
      s.b.b = h - 54;
      s.mid = w / 2;

      const sx = w / old.w;
      const sy = h / old.h;
      s.balls.forEach((ball: Ball) => {
        ball.x *= sx;
        ball.y *= sy;
      });
    };

    reset();
    resize();

    c.addEventListener("pointerdown", pointerDown);
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("resize", resize);

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      c.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("resize", resize);
    };
  }, [color]);

  return (
    <div className="arcade-shell">
      <canvas ref={canvas} aria-label="Neon Flipper pinball game" />
    </div>
  );
}
