export type Difficulty = "Normal" | "Difficile" | "Expert" | "Démoniaque";
export type LevelTheme = "neon" | "sunset" | "forest" | "void" | "ice" | "lava";

export type Platform = { x: number; y: number; w: number; h: number };
export type Spike = { x: number; y: number; count?: number };
export type Collectible = { id: string; x: number; y: number };
export type Orb = { x: number; y: number; color: "yellow" | "pink" | "blue"; power: number };
export type Pad = { x: number; y: number; color: "yellow" | "pink"; power: number };

export type GDLevel = {
  id: number;
  name: string;
  difficulty: Difficulty;
  theme: LevelTheme;
  speed: number;
  length: number;
  platforms: Platform[];
  spikes: Spike[];
  coins: Collectible[];
  orbs: Orb[];
  pads: Pad[];
};

const ground = (length: number): Platform[] => [{ x: 0, y: 510, w: length, h: 140 }];

function makeLevel(id: number, name: string, difficulty: Difficulty, theme: LevelTheme, speed: number, length: number, pattern: string, coinXs: number[], elevated: number[] = []): GDLevel {
  const platforms = ground(length);
  const spikes: Spike[] = [];
  const orbs: Orb[] = [];
  const pads: Pad[] = [];
  let x = 420;

  for (const token of pattern) {
    if (token === "^") spikes.push({ x, y: 492, count: 1 });
    if (token === "S") spikes.push({ x, y: 492, count: 2 });
    if (token === "M") spikes.push({ x, y: 492, count: 3 });
    if (token === "o") orbs.push({ x, y: 375, color: "yellow", power: 930 });
    if (token === "p") orbs.push({ x, y: 385, color: "pink", power: 1050 });
    if (token === "b") pads.push({ x: x - 8, y: 497, color: "yellow", power: 1070 });
    if (token === "r") pads.push({ x: x - 8, y: 497, color: "pink", power: 1200 });
    if (token === "G") platforms.push({ x: x - 30, y: 420, w: 150, h: 90 });
    if (token === "H") platforms.push({ x: x - 30, y: 350, w: 135, h: 160 });
    x += 110;
  }

  elevated.forEach((ey, idx) => {
    const px = 720 + idx * 620;
    platforms.push({ x: px, y: ey, w: 300, h: 510 - ey + 140 });
    const secondY = Math.max(300, ey + (idx % 2 ? 70 : -70));
    platforms.push({ x: px + 430, y: secondY, w: 230, h: 650 - secondY });
  });

  const coins = coinXs.map((cx, idx) => ({ id: `${id}-${idx + 1}`, x: cx, y: idx % 3 === 0 ? 410 : idx % 3 === 1 ? 350 : 440 }));
  return { id, name, difficulty, theme, speed, length, platforms, spikes, coins, orbs, pads };
}

export const LEVELS: GDLevel[] = [
  makeLevel(1, "Stereo Sunrise", "Normal", "neon", 330, 9800, "...^....G..^..o..S....^..G...b..^....p...S....^....G..^..o..^...", [1000, 3300, 6800]),
  makeLevel(2, "Neon Rush", "Normal", "sunset", 350, 11200, "..^..S...G..^..^..o...S..b..^..G...^....M...p..^..S...G..^..r...", [1400, 4650, 8600], [430, 360]),
  makeLevel(3, "Chromatic Pulse", "Difficile", "forest", 370, 12600, "^..S...G..^..M...o.^..S..b..G.^...p...M..^..G...^..S..r..^...", [2100, 5600, 10100], [400, 330, 410]),
  makeLevel(4, "Gravity District", "Difficile", "void", 390, 14000, "..S..G..^..o..M...^..p..S..G..^..r..M...^..G..S..o..^..p..M..", [2600, 6500, 11800], [390, 330, 390]),
  makeLevel(5, "Frozen Circuit", "Expert", "ice", 410, 15400, "^..M..G..^..o..S...p..G..r...M..^..S..G..o..^..p..M..S...G..", [3000, 7900, 13100], [350, 430, 320]),
  makeLevel(6, "Inferno Drive", "Expert", "lava", 430, 16800, "M..S..G..^..o..r..M..^..p..S..G..M..^..o..S..r..G..^..M...p..", [3500, 8800, 14500], [380, 315, 390]),
  makeLevel(7, "Nightmare Engine", "Démoniaque", "void", 455, 18500, "M..G..S..^..p..M..r..G..^..S..o..M..^..p..S..r..G..M..^..S..", [4100, 9800, 16000], [340, 410, 300, 390]),
  makeLevel(8, "The Last Dash", "Démoniaque", "neon", 480, 20500, "M..S..G..^..p..M..r..^..S..o..G..M..^..p..S..r..M..G..^..S..M", [4800, 11200, 18100], [360, 300, 380, 320]),
];

export type ShopItem = {
  id: string;
  category: "skin" | "background" | "trail";
  name: string;
  price: number;
  color?: string;
  accent?: string;
  description: string;
  unlockLevel?: number;
};

export const SHOP_ITEMS: ShopItem[] = [
  { id: "skin-classic", category: "skin", name: "Pulse", price: 0, color: "#f7f7ff", accent: "#42e8ff", description: "Le cube de départ." },
  { id: "skin-coral", category: "skin", name: "Corail", price: 150, color: "#ff6f61", accent: "#ffd166", description: "Un cube chaud et agressif." },
  { id: "skin-violet", category: "skin", name: "Vortex", price: 350, color: "#a78bfa", accent: "#6d5dfc", description: "Un style violet électrique." },
  { id: "skin-gold", category: "skin", name: "Golden", price: 700, color: "#ffe16b", accent: "#ff9f1c", description: "Doré premium.", unlockLevel: 3 },
  { id: "skin-cyber", category: "skin", name: "Cyber", price: 1200, color: "#e8fff9", accent: "#00ffa8", description: "Le cube cybernétique.", unlockLevel: 5 },
  { id: "skin-void", category: "skin", name: "Void", price: 2200, color: "#e9ddff", accent: "#8d5cff", description: "Un look venu du vide.", unlockLevel: 7 },
  { id: "bg-day", category: "background", name: "Blue Sky", price: 0, color: "#5cc8ff", accent: "#dff8ff", description: "Ciel bleu classique." },
  { id: "bg-sunset", category: "background", name: "Sunset", price: 250, color: "#ff7a5c", accent: "#ffcf70", description: "Coucher de soleil brûlant." },
  { id: "bg-aurora", category: "background", name: "Aurora", price: 550, color: "#1ee3cf", accent: "#8d5cff", description: "Un ciel boréal électrique.", unlockLevel: 2 },
  { id: "bg-space", category: "background", name: "Deep Space", price: 950, color: "#1f153c", accent: "#7b5cff", description: "Nebuleuses et étoiles.", unlockLevel: 4 },
  { id: "bg-lava", category: "background", name: "Magma", price: 1500, color: "#451015", accent: "#ffb703", description: "Une atmosphère infernale.", unlockLevel: 6 },
  { id: "trail-none", category: "trail", name: "Aucun", price: 0, color: "#ffffff", accent: "#ffffff", description: "Pas de traînée." },
  { id: "trail-cyan", category: "trail", name: "Cyan", price: 200, color: "#46edff", accent: "#46edff", description: "Particules cyan." },
  { id: "trail-pink", category: "trail", name: "Pink", price: 500, color: "#ff63cb", accent: "#ff63cb", description: "Particules roses." },
  { id: "trail-rainbow", category: "trail", name: "Rainbow", price: 1000, color: "#fff", accent: "#fff", description: "Traînée arc-en-ciel.", unlockLevel: 5 },
  { id: "skin-crystal", category: "skin", name: "Prism", price: 1600, color: "#c8fff8", accent: "#ff8ce8", description: "Un cube prismatique irisé.", unlockLevel: 4 },
  { id: "skin-glitch", category: "skin", name: "Glitch Core", price: 2400, color: "#17152c", accent: "#ff4b91", description: "Un noyau instable qui clignote.", unlockLevel: 6 },
  { id: "skin-comet", category: "skin", name: "Comet", price: 3200, color: "#fff0c2", accent: "#ff8b35", description: "Le cube météore des runs parfaites.", unlockLevel: 8 },
  { id: "bg-emerald", category: "background", name: "Emerald Abyss", price: 1250, color: "#082923", accent: "#39ffc5", description: "Un abysse vert rempli d'énergie.", unlockLevel: 4 },
  { id: "bg-pink", category: "background", name: "Pink Dimension", price: 1800, color: "#35102e", accent: "#ff5edb", description: "Une dimension rose ultra vive.", unlockLevel: 5 },
  { id: "trail-ember", category: "trail", name: "Ember", price: 850, color: "#ff884b", accent: "#ffd166", description: "Une traînée de braises.", unlockLevel: 4 },
  { id: "trail-void", category: "trail", name: "Void Pulse", price: 1450, color: "#bda0ff", accent: "#774bff", description: "Des éclats venus du vide.", unlockLevel: 7 },
];

export type UpgradeId = "jump" | "magnet" | "shield" | "multiplier";
export const UPGRADES: { id: UpgradeId; name: string; icon: string; max: number; costs: number[]; text: string }[] = [
  { id: "jump", name: "Super Jump", icon: "↟", max: 4, costs: [250, 500, 950, 1700], text: "+7% de puissance de saut par niveau." },
  { id: "magnet", name: "Aimant", icon: "◉", max: 4, costs: [300, 650, 1200, 2100], text: "Attire les pièces dans un rayon plus grand." },
  { id: "shield", name: "Bouclier", icon: "◇", max: 2, costs: [750, 1800], text: "Protège une fois par tentative." },
  { id: "multiplier", name: "Combo Coins", icon: "×", max: 4, costs: [400, 800, 1400, 2400], text: "+10% de pièces gagnées." },
];
