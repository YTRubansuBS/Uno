// @ts-nocheck
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Game = {
  id: string; title: string; creator: string; category: string; plays: number; likes: number;
  color: string; emoji: string; description: string; difficulty: string;
};

const GAMES: Game[] = [
  { id:"flappy-bird", title:"Flappy Bird", creator:"@scroll", category:"Arcade", plays:1284000, likes:184000, color:"#38bdf8", emoji:"🐦", description:"Passe entre les tuyaux et bats ton meilleur score.", difficulty:"Difficile" },
  { id:"tetris", title:"Tetris", creator:"@blocks", category:"Puzzle", plays:986000, likes:143000, color:"#8b5cf6", emoji:"🧱", description:"Empile les pièces, complète des lignes et survive le plus longtemps possible.", difficulty:"Difficile" },
  { id:"pong", title:"Pong", creator:"@classic", category:"1v1", plays:742000, likes:99000, color:"#22c55e", emoji:"🏓", description:"Renvoyez la balle et soyez le premier à marquer.", difficulty:"Moyen" },
  { id:"snake", title:"Snake", creator:"@retro", category:"Classique", plays:1150000, likes:176000, color:"#10b981", emoji:"🐍", description:"Mange les pommes, grandis et ne te touche jamais.", difficulty:"Difficile" },
  { id:"2048", title:"2048", creator:"@numbers", category:"Puzzle", plays:932000, likes:132000, color:"#f59e0b", emoji:"🟦", description:"Fusionne les nombres et atteins la tuile 2048.", difficulty:"Difficile" },
  { id:"minesweeper", title:"Minesweeper", creator:"@logic", category:"Puzzle", plays:613000, likes:87000, color:"#64748b", emoji:"💣", description:"Déduis les cases sûres sans toucher une mine.", difficulty:"Difficile" },
  { id:"doodle-jump", title:"Doodle Jump", creator:"@jump", category:"Runner", plays:841000, likes:119000, color:"#06b6d4", emoji:"🏃", description:"Saute de plateforme en plateforme et monte le plus haut possible.", difficulty:"Difficile" },
  { id:"aim-trainer", title:"Aim Trainer", creator:"@aim", category:"Réflexe", plays:1540000, likes:221000, color:"#ef4444", emoji:"🎯", description:"Clique les cibles le plus vite possible et bats ton record.", difficulty:"Expert" },
  { id:"helicopter", title:"Helicopter Game", creator:"@fly", category:"Arcade", plays:687000, likes:96000, color:"#eab308", emoji:"🪂", description:"Contrôle ton hélicoptère et évite les obstacles.", difficulty:"Difficile" },
  { id:"memory", title:"Memory", creator:"@brain", category:"Puzzle", plays:528000, likes:71000, color:"#ec4899", emoji:"🧠", description:"Retourne les cartes et retrouve toutes les paires.", difficulty:"Moyen" },
  { id:"reaction-time", title:"Reaction Time", creator:"@fast", category:"Réflexe", plays:1260000, likes:189000, color:"#14b8a6", emoji:"🔴", description:"Attends le signal puis clique le plus vite possible.", difficulty:"Expert" },
  { id:"breakout", title:"Breakout", creator:"@arcade", category:"Arcade", plays:773000, likes:108000, color:"#f97316", emoji:"🧱", description:"Fais rebondir la balle et détruis toutes les briques.", difficulty:"Moyen" },
  { id:"endless-racer", title:"Endless Racer", creator:"@drive", category:"Course", plays:904000, likes:127000, color:"#dc2626", emoji:"🏎️", description:"Évite les voitures et va toujours plus loin.", difficulty:"Difficile" },
  { id:"rps", title:"Rock Paper Scissors", creator:"@duel", category:"1v1", plays:456000, likes:62000, color:"#6366f1", emoji:"✂️", description:"Pierre, feuille ou ciseaux ? Construis ta série de victoires.", difficulty:"Facile" },
  { id:"connect-four", title:"Connect Four", creator:"@board", category:"1v1", plays:388000, likes:53000, color:"#2563eb", emoji:"🟡", description:"Aligne quatre pions avant ton adversaire.", difficulty:"Moyen" },
  { id:"pinball", title:"Pinball", creator:"@arcade", category:"Arcade", plays:619000, likes:91000, color:"#a855f7", emoji:"🌈", description:"Garde la bille en jeu et fais le meilleur score possible.", difficulty:"Moyen" },
];
const categories = ["Pour toi","Tendance","Nouveaux","Arcade","Réflexe","Puzzle","Sport","Runner","Classique"];

function formatCount(n:number){ if(n>=1_000_000)return (n/1_000_000).toFixed(1).replace(".0","")+" M"; if(n>=1000)return (n/1000).toFixed(n>=10000?0:1).replace(".0","")+" k"; return String(n); }
function usePersistent<T>(key:string, initial:T){ const [value,setValue]=useState<T>(initial); useEffect(()=>{try{const raw=localStorage.getItem(key);if(raw)setValue(JSON.parse(raw))}catch{}},[key]); useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}},[key,value]); return [value,setValue] as const; }
function GameShell({children,color}:{children:React.ReactNode;color:string}){ return <div className="game-stage" style={{background:"radial-gradient(circle at 50% 25%, "+color+"66, transparent 48%), linear-gradient(145deg,#111827,#050507)"}}>{children}</div>; }

function TapFrenzy({onScore}:{onScore:(n:number)=>void}){ const [score,setScore]=useState(0); const [time,setTime]=useState(10); const [x,setX]=useState(50); const [y,setY]=useState(50); const started=useRef(false); useEffect(()=>{if(!started.current)return;const id=setInterval(()=>setTime(t=>{if(t<=1){clearInterval(id);onScore(score);return 0}return t-1}),1000);return()=>clearInterval(id)},[started.current]); return <GameShell color="#8b5cf6"><div className="game-hud"><b>{score}</b><span>{time}s</span></div><button className="target" style={{left:x+"%",top:y+"%"}} onClick={()=>{if(!started.current){started.current=true;setTime(9)}setScore(s=>s+1);setX(12+Math.random()*76);setY(20+Math.random()*62)}}>TAP</button><p className="game-tip">Tape la cible le plus vite possible</p></GameShell>; }
function StackGame({onScore}:{onScore:(n:number)=>void}){ const [score,setScore]=useState(0); const [pos,setPos]=useState(15); const [dir,setDir]=useState(1); useEffect(()=>{const id=setInterval(()=>setPos(p=>{let n=p+dir*3;if(n>82){setDir(-1);n=82}if(n<15){setDir(1);n=15}return n}),60);return()=>clearInterval(id)},[dir]); return <GameShell color="#ff6b6b"><div className="game-hud"><b>{score} blocs</b><span>BEST {Math.max(score,12)}</span></div><div className="stack-area"><div className="stack-base"/><div className="moving-block" style={{left:pos+"%"}}/></div><button className="game-main-btn" onClick={()=>{setScore(s=>s+1);onScore(score+1)}}>POSER</button><p className="game-tip">Tape au bon moment</p></GameShell>; }
function ColorRush({onScore}:{onScore:(n:number)=>void}){ const colors=["ROUGE","BLEU","VERT","JAUNE"]; const [word,setWord]=useState(colors[0]); const [score,setScore]=useState(0); const next=()=>{const n=colors[Math.floor(Math.random()*colors.length)];setWord(n);setScore(s=>s+1);onScore(score+1)}; return <GameShell color="#f59e0b"><div className="game-hud"><b>{score}</b><span>COLOR RUSH</span></div><div className="color-word">{word}</div><div className="choice-row">{colors.map(c=><button key={c} onClick={next} className="choice" style={{background:c==="ROUGE"?"#ef4444":c==="BLEU"?"#3b82f6":c==="VERT"?"#22c55e":"#eab308"}}>{c}</button>)}</div></GameShell>; }
function GoalMachine({onScore}:{onScore:(n:number)=>void}){ const [score,setScore]=useState(0); const [message,setMessage]=useState("Tire !"); const shoot=()=>{const ok=Math.random()>.25;setMessage(ok?"BUT ! 🔥":"ARRÊT 🧤");const n=score+(ok?1:0);setScore(n);onScore(n)}; return <GameShell color="#22c55e"><div className="game-hud"><b>{score} buts</b><span>⚽ 30s</span></div><div className="goal"><div className="keeper">🧤</div><div className="ball">⚽</div></div><button className="game-main-btn" onClick={shoot}>TIRER</button><p className="game-tip">{message}</p></GameShell>; }
function MemoryGame({onScore}:{onScore:(n:number)=>void}){ const [cards]=useState(["🍕","🚀","🐸","⚽","🍕","🚀","🐸","⚽"].sort(()=>Math.random()-.5)); const [open,setOpen]=useState<number[]>([]); const [found,setFound]=useState<number[]>([]); const tap=(i:number)=>{if(open.includes(i)||found.includes(i)||open.length===2)return;const next=[...open,i];setOpen(next);if(next.length===2){if(cards[next[0]]===cards[next[1]]){setFound(f=>[...f,...next]);onScore(found.length+2)}setTimeout(()=>setOpen([]),450)}}; return <GameShell color="#ec4899"><div className="game-hud"><b>{found.length/2}/4</b><span>MEMORY</span></div><div className="memory-grid">{cards.map((c,i)=><button key={i} className={"memory-card "+(open.includes(i)||found.includes(i)?"open":"")} onClick={()=>tap(i)}>{open.includes(i)||found.includes(i)?c:"?"}</button>)}</div></GameShell>; }
function QuickMath({onScore}:{onScore:(n:number)=>void}){ const [a]=useState(()=>Math.floor(Math.random()*9)+2); const [b]=useState(()=>Math.floor(Math.random()*9)+2); const [score,setScore]=useState(0); const [input,setInput]=useState(""); const submit=()=>{if(Number(input)===a+b){setScore(s=>s+1);onScore(score+1);setInput("")}else setInput("")}; return <GameShell color="#14b8a6"><div className="game-hud"><b>{score}</b><span>QUICK MATH</span></div><div className="math-question">{a} + {b} = ?</div><input autoFocus className="math-input" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} inputMode="numeric"/><button className="game-main-btn" onClick={submit}>VALIDER</button></GameShell>; }
function FlappyGame({onScore}:{onScore:(n:number)=>void}){ const [score,setScore]=useState(0); const [y,setY]=useState(50); const [playing,setPlaying]=useState(false); useEffect(()=>{if(!playing)return;const id=setInterval(()=>setY(v=>Math.min(82,v+4)),100);return()=>clearInterval(id)},[playing]); return <GameShell color="#38bdf8"><div className="game-hud"><b>{score}</b><span>⭐ FLAPPY</span></div><div className="flappy-world"><div className="bird" style={{top:y+"%"}}>⭐</div><div className="pipe p1"/><div className="pipe p2"/></div><button className="game-main-btn" onClick={()=>{setPlaying(true);setY(v=>Math.max(10,v-14));setScore(s=>s+1);onScore(score+1)}}>TAPER POUR VOLER</button></GameShell>; }
function NeonDash({onScore}:{onScore:(n:number)=>void}){ const [score,setScore]=useState(0); const [jump,setJump]=useState(false); return <GameShell color="#6d5dfc"><div className="game-hud"><b>{score} m</b><span>NEON DASH</span></div><div className="dash-world"><div className={"runner "+(jump?"jump":"")}>🟦</div><div className="obstacle">🔺</div></div><button className="game-main-btn" onClick={()=>{setJump(true);setScore(s=>s+10);onScore(score+10);setTimeout(()=>setJump(false),350)}}>SAUTER</button><p className="game-tip">Évite les triangles</p></GameShell>; }
function BrickBlast({onScore}:{onScore:(n:number)=>void}){ const [score,setScore]=useState(0); const [broken,setBroken]=useState<number[]>([]); return <GameShell color="#ef4444"><div className="game-hud"><b>{score}</b><span>BRICK BLAST</span></div><div className="bricks">{Array.from({length:12},(_,i)=><button key={i} className={"brick "+(broken.includes(i)?"broken":"")} onClick={()=>{if(!broken.includes(i)){setBroken(b=>[...b,i]);setScore(s=>s+10);onScore(score+10)}}}>▰</button>)}</div><p className="game-tip">Détruis toutes les briques</p></GameShell>; }
function SnakeGame({onScore}:{onScore:(n:number)=>void}){ const [score,setScore]=useState(0); const [food,setFood]=useState(4); const eat=()=>{setScore(s=>s+10);onScore(score+10);setFood(Math.floor(Math.random()*20))}; return <GameShell color="#10b981"><div className="game-hud"><b>{score}</b><span>🐍 SNAKE ZONE</span></div><div className="snake-board">{Array.from({length:25},(_,i)=><button key={i} className={"snake-cell "+(i===food?"food":"")} onClick={i===food?eat:undefined}>{i===food?"🍎":""}</button>)}</div><p className="game-tip">Attrape la pomme</p></GameShell>; }
function JumpCity({onScore}:{onScore:(n:number)=>void}){ const [score,setScore]=useState(0); const [jump,setJump]=useState(false); return <GameShell color="#0ea5e9"><div className="game-hud"><b>{score} m</b><span>🏃 RUN</span></div><div className="jump-city"><span className={"runner-person "+(jump?"jump":"")}>🏃</span><span className="city-obstacle">🚧</span></div><button className="game-main-btn" onClick={()=>{setJump(true);setScore(s=>s+25);onScore(score+25);setTimeout(()=>setJump(false),500)}}>SAUT</button></GameShell>; }
function RocketRun({onScore}:{onScore:(n:number)=>void}){ const [score,setScore]=useState(0); return <GameShell color="#f97316"><div className="game-hud"><b>{score}</b><span>🚀 ROCKET RUN</span></div><div className="rocket-field"><button onClick={()=>{setScore(s=>s+1);onScore(score+1)}}>🚀</button><span>☄️</span><span>⭐</span><span>☄️</span></div><p className="game-tip">Collecte les étoiles</p></GameShell>; }

function FlappyBird({onScore}:{onScore:(n:number)=>void}){const [y,setY]=useState(50);const [score,setScore]=useState(0);const [started,setStarted]=useState(false);return <GameShell color="#38bdf8"><div className="game-hud"><b>{score}</b><span>🐦 FLAPPY</span></div><div className="flappy-world"><div className="bird" style={{top:y+"%"}}>🐦</div><div className="pipe p1"/><div className="pipe p2"/></div><button className="game-main-btn" onClick={()=>{setStarted(true);setY(v=>Math.max(10,v-14));const n=score+1;setScore(n);onScore(n)}}>{started?"TAPER":"COMMENCER"}</button></GameShell>}
function Tetris({onScore}:{onScore:(n:number)=>void}){const [cells,setCells]=useState<number[]>([]);const [score,setScore]=useState(0);return <GameShell color="#8b5cf6"><div className="game-hud"><b>{score}</b><span>🧱 TETRIS</span></div><div className="tetris-board">{Array.from({length:120},(_,i)=><button key={i} className={cells.includes(i)?"tet-cell filled":"tet-cell"} onClick={()=>{if(!cells.includes(i)){setCells(c=>[...c,i]);const n=score+10;setScore(n);onScore(n)}}}/>)}</div><p className="game-tip">Place les blocs pour remplir des lignes</p></GameShell>}
function Pong({onScore}:{onScore:(n:number)=>void}){const [p,setP]=useState(50);const [score,setScore]=useState(0);return <GameShell color="#22c55e"><div className="game-hud"><b>{score}</b><span>🏓 1V1</span></div><div className="pong-board"><div className="pong-paddle enemy"/><div className="pong-ball" style={{top:p+"%"}}>●</div><button className="pong-paddle player" onClick={()=>{setP(v=>Math.max(12,Math.min(88,v-12)));const n=score+1;setScore(n);onScore(n)}}/></div><p className="game-tip">Clique pour renvoyer la balle</p></GameShell>}
function Snake({onScore}:{onScore:(n:number)=>void}){const [score,setScore]=useState(0);const [food,setFood]=useState(4);return <GameShell color="#10b981"><div className="game-hud"><b>{score}</b><span>🐍 SNAKE</span></div><div className="snake-board">{Array.from({length:25},(_,i)=><button key={i} className={"snake-cell "+(i===food?"food":"")} onClick={i===food?()=>{const n=score+10;setScore(n);onScore(n);setFood(Math.floor(Math.random()*25))}:undefined}>{i===food?"🍎":""}</button>)}</div></GameShell>}
function Game2048({onScore}:{onScore:(n:number)=>void}){const [tiles,setTiles]=useState([2,4,8,16]);const merge=()=>{setTiles(t=>[...t, t[t.length-1]*2]);const n=(tiles.length)*10;onScore(n)};return <GameShell color="#f59e0b"><div className="game-hud"><b>2048</b><span>🟦 PUZZLE</span></div><div className="board2048">{[...Array(16)].map((_,i)=><button key={i} onClick={merge}>{tiles[i%tiles.length]||""}</button>)}</div><button className="game-main-btn" onClick={merge}>FUSIONNER</button></GameShell>}
function Minesweeper({onScore}:{onScore:(n:number)=>void}){const mines=new Set([2,7,13]);const [open,setOpen]=useState<number[]>([]);return <GameShell color="#64748b"><div className="game-hud"><b>{open.length}</b><span>💣 MINES</span></div><div className="mine-board">{[...Array(20)].map((_,i)=><button key={i} className={open.includes(i)?"revealed":""} onClick={()=>{if(mines.has(i)){setOpen([])}else{setOpen(o=>o.includes(i)?o:[...o,i]);onScore(open.length+1)}}}>{open.includes(i)?(i%3+1):"?"}</button>)}</div><p className="game-tip">Évite les mines</p></GameShell>}
function DoodleJump({onScore}:{onScore:(n:number)=>void}){const [height,setHeight]=useState(0);return <GameShell color="#06b6d4"><div className="game-hud"><b>{height} m</b><span>🏃 DOODLE</span></div><div className="platforms">{[0,1,2,3,4].map(i=><button key={i} style={{left:(10+i*17)+"%",bottom:(i*15+5)+"%"}} onClick={()=>{const n=height+10;setHeight(n);onScore(n)}}>━</button>)}</div><div className="jumper">●</div></GameShell>}
function AimTrainer({onScore}:{onScore:(n:number)=>void}){const [score,setScore]=useState(0);const [pos,setPos]=useState({x:50,y:50});return <GameShell color="#ef4444"><div className="game-hud"><b>{score}</b><span>🎯 AIM</span></div><button className="aim-target" style={{left:pos.x+"%",top:pos.y+"%"}} onClick={()=>{const n=score+1;setScore(n);onScore(n);setPos({x:10+Math.random()*80,y:20+Math.random()*60})}}>+</button></GameShell>}
function Helicopter({onScore}:{onScore:(n:number)=>void}){const [y,setY]=useState(50);const [score,setScore]=useState(0);return <GameShell color="#eab308"><div className="game-hud"><b>{score}</b><span>🪂 HELICOPTER</span></div><div className="heli-world"><button className="heli" style={{top:y+"%"}} onClick={()=>{setY(v=>Math.max(8,v-10));const n=score+1;setScore(n);onScore(n)}}>🚁</button><div className="wall top"/><div className="wall bottom"/></div><p className="game-tip">Clique pour monter</p></GameShell>}
function Memory({onScore}:{onScore:(n:number)=>void}){const cards=["🍕","🚀","🐸","⚽","🍕","🚀","🐸","⚽"].sort(()=>Math.random()-.5);const [open,setOpen]=useState<number[]>([]),[found,setFound]=useState<number[]>([]);return <GameShell color="#ec4899"><div className="game-hud"><b>{found.length/2}/4</b><span>🧠 MEMORY</span></div><div className="memory-grid">{cards.map((c,i)=><button key={i} className={open.includes(i)||found.includes(i)?"memory-card open":"memory-card"} onClick={()=>{if(open.length===2||open.includes(i)||found.includes(i))return;const n=[...open,i];setOpen(n);if(n.length===2){if(cards[n[0]]===cards[n[1]]){setFound(f=>[...f,...n]);onScore(found.length+2)}setTimeout(()=>setOpen([]),400)}}}>{open.includes(i)||found.includes(i)?c:"?"}</button>)}</div></GameShell>}
function ReactionTime({onScore}:{onScore:(n:number)=>void}){const [ready,setReady]=useState(false);const [start,setStart]=useState(0);const [best,setBest]=useState(9999);const go=()=>{if(!ready){setReady(true);setTimeout(()=>{setStart(performance.now());setReady(false)},1000+Math.random()*2500)}else{const ms=Math.round(performance.now()-start);setBest(ms);onScore(Math.max(1,1000-ms));setReady(false)}};return <GameShell color="#14b8a6"><div className="game-hud"><b>{best===9999?"—":best+" ms"}</b><span>🔴 REACTION</span></div><button className={"reaction "+(ready?"wait":"")} onClick={go}>{ready?"ATTENDS...":"CLIQUE"}</button></GameShell>}
function Breakout({onScore}:{onScore:(n:number)=>void}){const [broken,setBroken]=useState<number[]>([]);return <GameShell color="#f97316"><div className="game-hud"><b>{broken.length*10}</b><span>🧱 BREAKOUT</span></div><div className="bricks">{[...Array(12)].map((_,i)=><button key={i} className={"brick "+(broken.includes(i)?"broken":"")} onClick={()=>{if(!broken.includes(i)){setBroken(b=>[...b,i]);onScore((broken.length+1)*10)}}}>▰</button>)}</div><div className="breakout-ball">●</div><p className="game-tip">Casse les briques</p></GameShell>}
function EndlessRacer({onScore}:{onScore:(n:number)=>void}){const [lane,setLane]=useState(1);const [distance,setDistance]=useState(0);return <GameShell color="#dc2626"><div className="game-hud"><b>{distance} m</b><span>🏎️ RACER</span></div><div className="road"><button style={{left:(lane*30+5)+"%"}} onClick={()=>{setLane(l=>l===0?1:l-1);const n=distance+25;setDistance(n);onScore(n)}}>🏎️</button><span className="car c1">🚗</span><span className="car c2">🚙</span></div><p className="game-tip">Évite le trafic</p></GameShell>}
function RPS({onScore}:{onScore:(n:number)=>void}){const choices=["✊","✋","✌️"];const [result,setResult]=useState("Choisis");const [wins,setWins]=useState(0);return <GameShell color="#6366f1"><div className="game-hud"><b>{wins} 🔥</b><span>✂️ RPS</span></div><div className="rps-result">{result}</div><div className="rps-row">{choices.map(c=><button key={c} onClick={()=>{const bot=choices[Math.floor(Math.random()*3)];const win=(c==="✊"&&bot==="✌️")||(c==="✋"&&bot==="✊")||(c==="✌️"&&bot==="✋");setResult(win?"GAGNÉ 🔥":c===bot?"ÉGALITÉ":"PERDU");if(win){const n=wins+1;setWins(n);onScore(n)}}}>{c}</button>)}</div></GameShell>}
function ConnectFour({onScore}:{onScore:(n:number)=>void}){const [moves,setMoves]=useState<number[]>([]);return <GameShell color="#2563eb"><div className="game-hud"><b>{moves.length}</b><span>🟡 CONNECT 4</span></div><div className="connect-board">{[...Array(42)].map((_,i)=><button key={i} className={moves.includes(i)?"disc":""} onClick={()=>{if(!moves.includes(i)){setMoves(m=>[...m,i]);onScore(moves.length+1)}}}>{moves.includes(i)?"●":""}</button>)}</div></GameShell>}
function Pinball({onScore}:{game?:Game;onScore:(n:number)=>void}){const [score,setScore]=useState(0),[balls,setBalls]=useState(3);return <GameShell color="#a855f7"><div className="game-hud"><b>{score}</b><span>🌈 PINBALL · {balls} BILLES</span></div><div className="pinball"><button onClick={()=>{if(balls>0){const n=score+100;setScore(n);onScore(n)}}}>●</button><span>★</span><span>◆</span><span>★</span></div><button className="game-main-btn" onClick={()=>setBalls(b=>Math.max(0,b-1))}>LANCER LA BILLE</button></GameShell>}
function MiniGame({game,onScore}:{game:Game;onScore:(score:number)=>void}){switch(game.id){case"flappy-bird":return <FlappyBird onScore={onScore}/>;case"tetris":return <Tetris onScore={onScore}/>;case"pong":return <Pong onScore={onScore}/>;case"snake":return <Snake onScore={onScore}/>;case"2048":return <Game2048 onScore={onScore}/>;case"minesweeper":return <Minesweeper onScore={onScore}/>;case"doodle-jump":return <DoodleJump onScore={onScore}/>;case"aim-trainer":return <AimTrainer onScore={onScore}/>;case"helicopter":return <Helicopter onScore={onScore}/>;case"memory":return <Memory onScore={onScore}/>;case"reaction-time":return <ReactionTime onScore={onScore}/>;case"breakout":return <Breakout onScore={onScore}/>;case"endless-racer":return <EndlessRacer onScore={onScore}/>;case"rps":return <RPS onScore={onScore}/>;case"connect-four":return <ConnectFour onScore={onScore}/>;default:return <Pinball onScore={onScore}/>;}}


export default function Page() {
  const [category, setCategory] = useState("Pour toi");
  const [query, setQuery] = useState("");
  const [liked, setLiked] = usePersistent<string[]>("scroll-liked", []);
  const [saved, setSaved] = usePersistent<string[]>("scroll-saved", []);
  const [scores, setScores] = usePersistent<Record<string, number>>("scroll-scores", {});
  const [profileOpen, setProfileOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GAMES.filter((game) => {
      const matchesCategory =
        category === "Pour toi" ||
        category === "Tendance" ||
        category === "Nouveaux" ||
        game.category === category;
      const matchesQuery =
        !q ||
        game.title.toLowerCase().includes(q) ||
        game.creator.toLowerCase().includes(q) ||
        game.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    }).sort((a, b) => {
      if (category === "Tendance") return b.plays - a.plays;
      if (category === "Nouveaux") return GAMES.indexOf(a) - GAMES.indexOf(b);
      return 0;
    });
  }, [category, query]);

  const toggleLike = (id: string) => {
    setLiked((items) => items.includes(id) ? items.filter((x) => x !== id) : [...items, id]);
  };

  const toggleSave = (id: string) => {
    setSaved((items) => items.includes(id) ? items.filter((x) => x !== id) : [...items, id]);
  };

  const recordScore = (id: string, score: number) => {
    setScores((current) => ({ ...current, [id]: Math.max(current[id] || 0, score) }));
  };

  return (
    <main className="scroll-page">
      <header className="scroll-header">
        <div className="brand">
          <span className="brand-mark">↕</span>
          <span>SCROLL GAME</span>
        </div>
        <div className="header-actions">
          <input
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un jeu..."
            aria-label="Rechercher un jeu"
          />
          <button className="profile-button" onClick={() => setProfileOpen(true)}>👤</button>
        </div>
      </header>

      <nav className="category-bar" aria-label="Catégories">
        {categories.map((item) => (
          <button
            key={item}
            className={"category-pill " + (category === item ? "active" : "")}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <section className="game-feed">
        {filtered.map((game, index) => (
          <article className="game-card" key={game.id} id={game.id}>
            <div className="game-card-top">
              <div>
                <span className="game-category">{game.category}</span>
                <h1>{game.emoji} {game.title}</h1>
                <p>{game.description}</p>
              </div>
              <div className="game-meta">
                <span>{game.difficulty}</span>
                <span>{formatCount(game.plays)} parties</span>
              </div>
            </div>

            <MiniGame
              game={game}
              onScore={(score) => recordScore(game.id, score)}
            />

            <aside className="game-actions">
              <button onClick={() => toggleLike(game.id)} className={liked.includes(game.id) ? "active" : ""}>
                {liked.includes(game.id) ? "❤️" : "🤍"}<small>{formatCount(game.likes + (liked.includes(game.id) ? 1 : 0))}</small>
              </button>
              <button onClick={() => toggleSave(game.id)} className={saved.includes(game.id) ? "active" : ""}>
                {saved.includes(game.id) ? "🔖" : "📑"}<small>Enregistrer</small>
              </button>
              <button onClick={() => {
                navigator.clipboard?.writeText(window.location.href + "#" + game.id);
              }}>
                ↗️<small>Partager</small>
              </button>
            </aside>

            <footer className="creator-row">
              <div>
                <strong>{game.creator}</strong>
                <span> · {index + 1}/{filtered.length}</span>
              </div>
              <span>🏆 Meilleur score : {scores[game.id] ?? 0}</span>
            </footer>
          </article>
        ))}
        {!filtered.length && <div className="empty-state">Aucun jeu trouvé.</div>}
      </section>

      {profileOpen && (
        <div className="modal-backdrop" onClick={() => setProfileOpen(false)}>
          <section className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setProfileOpen(false)}>×</button>
            <div className="profile-avatar">🎮</div>
            <h2>Mon profil</h2>
            <p>{liked.length} jeux aimés · {saved.length} jeux enregistrés</p>
            <p>{Object.keys(scores).length} jeux joués</p>
            <button className="game-main-btn" onClick={() => { setLiked([]); setSaved([]); setScores({}); }}>
              Réinitialiser mes données
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
function Shell({g,children,score}:{g:Game;children:ReactNode;score?:ReactNode}){return <div className="game-stage" style={{background:"radial-gradient(circle at 50% 10%,"+g.color+"66,transparent 50%),linear-gradient(145deg,#151522,#050507)"}}>{score!==undefined&&<div className="game-score">{score}</div>}{children}</div>}
function Start({children,onClick}:{children:string;onClick:()=>void}){return <button className="start-btn" onClick={onClick}>{children}</button>}
function Over({score,restart}:{score:number;restart:()=>void}){return <div className="game-over"><b>GAME OVER</b><span>Score {score}</span><button onClick={restart}>REJOUER</button></div>}

function Flappy({g,onScore}:{g:Game;onScore:(n:number)=>void}){
 const [run,setRun]=useState(false),[dead,setDead]=useState(false),[y,setY]=useState(50),[score,setScore]=useState(0),[pipes,setPipes]=useState([{x:85,g:45},{x:135,g:62}]);const vy=useRef(0);
 const reset=()=>{setRun(true);setDead(false);setY(50);setScore(0);setPipes([{x:85,g:45},{x:135,g:62}]);vy.current=-2};
 useEffect(()=>{if(!run)return;const id=setInterval(()=>{vy.current+=.16;setY(v=>v+vy.current);setPipes(ps=>ps.map(p=>({...p,x:p.x-1.1})).filter(p=>p.x>-12).concat(ps.length<2?[{x:120,g:25+Math.random()*50}]:[]))},30);return()=>clearInterval(id)},[run]);
 useEffect(()=>{if(!run)return;if(y<3||y>96||pipes.some(p=>p.x<28&&p.x>17&&(y<p.g-17||y>p.g+17))){setDead(true);setRun(false)};const passed=pipes.filter(p=>p.x<=17&&p.x>-1).length;if(passed>score){setScore(passed);onScore(passed)}},[y,pipes,run,score,onScore]);
 return <Shell g={g} score={score}><div className="flappy-world"><div className="bird" style={{top:y+"%"}}>🐦</div>{pipes.map((p,i)=><div className="pipe" key={i} style={{left:p.x+"%"}}><i/><i/></div>)}</div>{!run&&!dead&&<Start onClick={reset}>JOUER</Start>}{dead&&<Over score={score} restart={reset}/>}<button className="tap-zone" onPointerDown={()=>run&&(vy.current=-2.2)}>TAP</button></Shell>
}

function Snake({g,onScore}:{g:Game;onScore:(n:number)=>void}){
 const [body,setBody]=useState([44,43,42]),[food,setFood]=useState(24),[run,setRun]=useState(false),[score,setScore]=useState(0);const dir=useRef(1);
 const reset=()=>{setBody([44,43,42]);setFood(24);dir.current=1;setScore(0);setRun(true)};
 useEffect(()=>{const h=(e:KeyboardEvent)=>{const m:any={ArrowUp:-10,ArrowDown:10,ArrowLeft:-1,ArrowRight:1};if(m[e.key]&&m[e.key]+dir.current!==0)dir.current=m[e.key]};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h)},[]);
 useEffect(()=>{if(!run)return;const id=setInterval(()=>setBody(old=>{let h=old[0],r=Math.floor(h/10),c=h%10;if(dir.current===1)c++;else if(dir.current===-1)c--;else if(dir.current===10)r++;else r--;if(r<0||r>9||c<0||c>9||old.includes(r*10+c)){setRun(false);return old}const nh=r*10+c,eat=nh===food,n=eat?[nh,...old]:[nh,...old.slice(0,-1)];if(eat){const sc=score+10;setScore(sc);onScore(sc);let f;do f=Math.floor(Math.random()*100);while(n.includes(f));setFood(f)}return n}),120);return()=>clearInterval(id)},[run,food,score,onScore]);
 return <Shell g={g} score={score}><div className="snake-grid">{Array.from({length:100},(_,i)=><span key={i} className={body.includes(i)?"snake":""}>{i===food?"🍎":""}</span>)}</div>{!run&&<Start onClick={reset}>{score?"REJOUER":"JOUER"}</Start>}<div className="dpad"><button onClick={()=>{if(dir.current!==10)dir.current=-10}}>↑</button><button onClick={()=>{if(dir.current!==-10)dir.current=10}}>↓</button><button onClick={()=>{if(dir.current!==1)dir.current=-1}}>←</button><button onClick={()=>{if(dir.current!==-1)dir.current=1}}>→</button></div></Shell>
}

function Game2048({g,onScore}:{g:Game;onScore:(n:number)=>void}){
 const spawn=(a:number[])=>{const free=a.map((v,i)=>v?null:i).filter((x):x is number=>x!==null);if(!free.length)return a;const n=[...a];n[free[Math.floor(Math.random()*free.length)]]=Math.random()<.9?2:4;return n};const [board,setBoard]=useState(()=>spawn(spawn(Array(16).fill(0)))),[score,setScore]=useState(0),[dead,setDead]=useState(false);
 const move=(d:string)=>{let rows=d==="L"||d==="R"?Array.from({length:4},(_,r)=>board.slice(r*4,r*4+4)):Array.from({length:4},(_,c)=>[board[c],board[c+4],board[c+8],board[c+12]]);if(d==="R"||d==="D")rows=rows.map(r=>r.reverse());let gain=0;rows=rows.map(r=>{const q=r.filter(Boolean),o:number[]=[];for(let i=0;i<q.length;i++){if(q[i]===q[i+1]){o.push(q[i]*2);gain+=q[i]*2;i++}else o.push(q[i])}while(o.length<4)o.push(0);return d==="R"||d==="D"?o.reverse():o});const n=Array(16).fill(0);rows.forEach((r,i)=>r.forEach((v,j)=>d==="L"||d==="R"?n[i*4+j]=v:n[j*4+i]=v));if(n.every((v,i)=>v===board[i]))return;const nb=spawn(n),sc=score+gain;setBoard(nb);setScore(sc);onScore(sc);if(!nb.includes(0)&&!nb.some((v,i)=>(i%4<3&&nb[i+1]===v)||(i<12&&nb[i+4]===v)))setDead(true)};
 useEffect(()=>{const h=(e:KeyboardEvent)=>{const m:any={ArrowLeft:"L",ArrowRight:"R",ArrowUp:"U",ArrowDown:"D"};if(m[e.key])move(m[e.key])};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h)});
 return <Shell g={g} score={score}><div className="grid2048">{board.map((v,i)=><button key={i} data-v={v}>{v||""}</button>)}</div><div className="dpad"><button onClick={()=>move("U")}>↑</button><button onClick={()=>move("D")}>↓</button><button onClick={()=>move("L")}>←</button><button onClick={()=>move("R")}>→</button></div>{dead&&<Over score={score} restart={()=>{setBoard(spawn(spawn(Array(16).fill(0))));setScore(0);setDead(false)}}/>}</Shell>
}

function Reaction({g,onScore}:{g:Game;onScore:(n:number)=>void}){
 const [state,setState]=useState("idle"),[ms,setMs]=useState<number|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),start=useRef(0);useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 const click=()=>{if(state==="idle"){setState("wait");timer.current=setTimeout(()=>{start.current=performance.now();setState("go")},800+Math.random()*2400)}else if(state==="wait"){if(timer.current)clearTimeout(timer.current);setState("idle")}else{const n=Math.round(performance.now()-start.current);setMs(n);onScore(Math.max(1,1000-n));setState("idle")}};
 return <Shell g={g} score={ms===null?"—":ms+" ms"}><button className={"reaction "+state} onClick={click}>{state==="idle"?"CLIQUE":state==="wait"?"ATTENDS...":"MAINTENANT !"}</button></Shell>
}

function Aim({g,onScore}:{g:Game;onScore:(n:number)=>void}){
 const [run,setRun]=useState(false),[time,setTime]=useState(10),[hits,setHits]=useState(0),[x,setX]=useState(50),[y,setY]=useState(50);useEffect(()=>{if(!run)return;const id=setInterval(()=>setTime(t=>{if(t<=1){setRun(false);return 0}return t-1}),1000);return()=>clearInterval(id)},[run]);
 const start=()=>{setHits(0);setTime(10);setX(50);setY(50);setRun(true)};return <Shell g={g} score={hits+" · "+time+"s"}><button className="aim" disabled={!run} style={{left:x+"%",top:y+"%"}} onClick={()=>{const n=hits+1;setHits(n);onScore(n);setX(8+Math.random()*84);setY(20+Math.random()*60)}}>+</button>{!run&&<Start onClick={start}>{hits?"REJOUER":"10 SECONDES"}</Start>}</Shell>
}

function Memory({g,onScore}:{g:Game;onScore:(n:number)=>void}){
 const cards=useMemo(()=>["🍕","🚀","🐸","⚽","🌈","🎮","🍕","🚀","🐸","⚽","🌈","🎮"].sort(()=>Math.random()-.5),[]),[open,setOpen]=useState<number[]>([]),[found,setFound]=useState<number[]>([]);const tap=(i:number)=>{if(open.length===2||open.includes(i)||found.includes(i))return;const n=[...open,i];setOpen(n);if(n.length===2){if(cards[n[0]]===cards[n[1]]){setFound(f=>[...f,...n]);onScore(found.length+2)}setTimeout(()=>setOpen([]),450)}};return <Shell g={g} score={found.length/2+" / 6"}><div className="memory">{cards.map((c,i)=><button key={i} className={open.includes(i)||found.includes(i)?"open":""} onClick={()=>tap(i)}>{open.includes(i)||found.includes(i)?c:"?"}</button>)}</div></Shell>
}

function RPS({g,onScore}:{g:Game;onScore:(n:number)=>void}){
 const choices=["✊","✋","✌️"],[st,setSt]=useState(0),[msg,setMsg]=useState("Choisis");const play=(i:number)=>{const b=Math.floor(Math.random()*3),win=(i-b+3)%3===1;setMsg(win?"Gagné ! "+choices[i]+" vs "+choices[b]:i===b?"Égalité":"Perdu ! "+choices[i]+" vs "+choices[b]);const n=win?st+1:0;setSt(n);if(win)onScore(n)};return <Shell g={g} score={st+" 🔥"}><div className="rps-msg">{msg}</div><div className="rps">{choices.map((x,i)=><button key={x} onClick={()=>play(i)}>{x}</button>)}</div></Shell>
}

function Pong({g,onScore}:{g:Game;onScore:(n:number)=>void}){
 const[run,setRun]=useState(false),[p,setP]=useState(50),[ai,setAi]=useState(50),[ball,setBall]=useState({x:50,y:50,vx:.8,vy:.5}),[score,setScore]=useState([0,0]);useEffect(()=>{if(!run)return;const id=setInterval(()=>setBall(b=>{let x=b.x+b.vx,y=b.y+b.vy,vx=b.vx,vy=b.vy;if(y<4||y>96)vy=-vy;if(x<9&&Math.abs(y-p)<14)vx=Math.abs(vx)*1.03;if(x>91&&Math.abs(y-ai)<14)vx=-Math.abs(vx)*1.03;setAi(a=>a+(y-a)*.08);if(x<0||x>100){const me=x>100;setScore(s=>{const n=[s[0]+(me?1:0),s[1]+(me?0:1)];if(Math.max(...n)>=7){setRun(false);onScore(Math.max(...n))}return n});return{x:50,y:50,vx:me?-0.8:.8,vy:(Math.random()-.5)*.8}}return{x,y,vx,vy}}),16);return()=>clearInterval(id)},[run,p,ai,onScore]);const start=()=>{setScore([0,0]);setP(50);setAi(50);setBall({x:50,y:50,vx:.8,vy:.5});setRun(true)};return <Shell g={g}><div className="pong"><b>{score[0]} — {score[1]}</b><span className="paddle left" style={{top:p+"%"}}/><span className="paddle right" style={{top:ai+"%"}}/><i className="pongball" style={{left:ball.x+"%",top:ball.y+"%"}}/></div>{!run&&<Start onClick={start}>{score[0]||score[1]?"REJOUER":"JOUER · 7 POINTS"}</Start>}<div className="dpad"><button onClick={()=>setP(v=>Math.max(8,v-10))}>↑</button><button onClick={()=>setP(v=>Math.min(92,v+10))}>↓</button></div></Shell>
}

function Breakout({g,onScore}:{g:Game;onScore:(n:number)=>void}){
 const[run,setRun]=useState(false),[p,setP]=useState(50),[ball,setBall]=useState({x:50,y:80,vx:.7,vy:-.8}),[br,setBr]=useState(()=>Array(24).fill(true)),[score,setScore]=useState(0);useEffect(()=>{if(!run)return;const id=setInterval(()=>setBall(b=>{let x=b.x+b.vx,y=b.y+b.vy,vx=b.vx,vy=b.vy;if(x<3||x>97)vx=-vx;if(y<5)vy=Math.abs(vy);if(y>88&&Math.abs(x-p)<14)vy=-Math.abs(vy);const col=Math.floor(x/12.5),row=Math.floor(y/8),i=row*8+col;if(row<3&&col>=0&&br[i]){setBr(q=>{const n=[...q];n[i]=false;return n});vy=Math.abs(vy);const n=score+10;setScore(n);onScore(n)}if(y>105)setRun(false);return{x,y,vx,vy}}),16);return()=>clearInterval(id)},[run,p,br,score,onScore]);const start=()=>{setRun(true);setP(50);setBall({x:50,y:80,vx:.7,vy:-.8});setBr(Array(24).fill(true));setScore(0)};return <Shell g={g} score={score}><div className="breakout"><div className="bricks">{br.map((v,i)=><span key={i} className={v?"":"gone"}/>)}</div><i className="breakball" style={{left:ball.x+"%",top:ball.y+"%"}}/><span className="breakpaddle" style={{left:p+"%"}}/></div>{!run&&<Start onClick={start}>{score?"REJOUER":"JOUER"}</Start>}<div className="dpad"><button onClick={()=>setP(v=>Math.max(10,v-8))}>←</button><button onClick={()=>setP(v=>Math.min(90,v+8))}>→</button></div></Shell>
}

function Racer({g,onScore}:{g:Game;onScore:(n:number)=>void}){
 const[run,setRun]=useState(false),[lane,setLane]=useState(1),[cars,setCars]=useState<{l:number;y:number}[]>([]),[distance,setDistance]=useState(0);useEffect(()=>{if(!run)return;const id=setInterval(()=>{setCars(q=>{const n=q.map(c=>({...c,y:c.y+2.3})).filter(c=>c.y<110);if(n.some(c=>c.y>80&&c.y<94&&c.l===lane)){setRun(false);return n}if(Math.random()<.05)n.push({l:Math.floor(Math.random()*3),y:-10});return n});setDistance(d=>{const n=d+1;onScore(n);return n})},45);return()=>clearInterval(id)},[run,lane,onScore]);return <Shell g={g} score={distance+" m"}><div className="road"><b style={{left:(lane*31+4)+"%"}}>🏎️</b>{cars.map((c,i)=><i key={i} style={{left:(c.l*31+4)+"%",top:c.y+"%"}}>🚗</i>)}</div>{!run&&<Start onClick={()=>{setDistance(0);setCars([]);setLane(1);setRun(true)}}>{distance?"REJOUER":"JOUER"}</Start>}<div className="dpad"><button onClick={()=>setLane(v=>Math.max(0,v-1))}>←</button><button onClick={()=>setLane(v=>Math.min(2,v+1))}>→</button></div></Shell>
}

function Mines({g,onScore}:{g:Game;onScore:(n:number)=>void}){
 const mines=useMemo(()=>{const s=new Set<number>();while(s.size<15)s.add(Math.floor(Math.random()*100));return s},[]),[open,setOpen]=useState<Set<number>>(new Set()),[dead,setDead]=useState(false);const count=(i:number)=>{let n=0,r=Math.floor(i/10),c=i%10;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<10&&cc>=0&&cc<10&&mines.has(rr*10+cc))n++}return n};const click=(i:number)=>{if(dead||open.has(i))return;if(mines.has(i)){setDead(true);return}const n=new Set(open),q=[i];while(q.length){const x=q.pop()!;if(n.has(x)||mines.has(x))continue;n.add(x);if(count(x)===0){const r=Math.floor(x/10),c=x%10;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<10&&cc>=0&&cc<10)q.push(rr*10+cc)}}}setOpen(n);onScore(n.size)};const reset=()=>location.reload();return <Shell g={g} score={open.size}><div className="mines">{Array.from({length:100},(_,i)=><button className={open.has(i)?"open":""} key={i} onClick={()=>click(i)}>{dead&&mines.has(i)?"💣":open.has(i)?count(i)||"":""}</button>)}</div>{dead&&<Over score={open.size} restart={reset}/>}</Shell>
}

function Doodle({g,onScore}:{g:Game;onScore:(n:number)=>void}){
 const[run,setRun]=useState(false),[x,setX]=useState(50),[y,setY]=useState(78),[score,setScore]=useState(0),vy=useRef(-2.5);const platforms=[84,67,50,33,16];useEffect(()=>{if(!run)return;const id=setInterval(()=>{setY(v=>{vy.current+=.12;let n=v+vy.current;if(n>92){setRun(false);return 92}for(let i=0;i<platforms.length;i++){const left=i*19+5;if(v<=platforms[i]&&n>=platforms[i]&&x>left-6&&x<left+24){n=platforms[i]-6;vy.current=-2.5;const s=score+1;setScore(s);onScore(s)}}return n})},30);return()=>clearInterval(id)},[run,x,score,onScore]);return <Shell g={g} score={score+" m"}><div className="doodle">{platforms.map((p,i)=><span key={i} style={{top:p+"%",left:(i*19+5)+"%"}}/>)}<b style={{left:x+"%",top:y+"%"}}>●</b></div>{!run&&<Start onClick={()=>{setX(50);setY(78);setScore(0);vy.current=-2.5;setRun(true)}}>{score?"REJOUER":"JOUER"}</Start>}<div className="dpad"><button onClick={()=>setX(v=>Math.max(5,v-8))}>←</button><button onClick={()=>setX(v=>Math.min(90,v+8))}>→</button></div></Shell>
}

function Helicopter({g,onScore}:{g:Game;onScore:(n:number)=>void}){
 const[run,setRun]=useState(false),[y,setY]=useState(50),[distance,setDistance]=useState(0);useEffect(()=>{if(!run)return;const id=setInterval(()=>{setY(v=>v+1.05);setDistance(d=>{const n=d+1;onScore(n);return n})},35);return()=>clearInterval(id)},[run,onScore]);useEffect(()=>{if(run&&(y<30||y>70))setRun(false)},[run,y]);return <Shell g={g} score={distance}><div className="heli-world"><div className="heli-player" style={{top:y+"%"}}>🚁</div><div className="heli-top"/><div className="heli-bottom"/></div>{!run&&<Start onClick={()=>{setY(50);setDistance(0);setRun(true)}}>{distance?"REJOUER":"JOUER"}</Start>}<button className="tap-zone" onPointerDown={()=>run&&setY(v=>Math.max(2,v-5))}>MAINTENIR</button></Shell>
}

function Connect({g,onScore}:{g:Game;onScore:(n:number)=>void}){
 const[b,setB]=useState<(0|1|2)[]>(Array(42).fill(0)),[winner,setWinner]=useState(0);const check=(a:(0|1|2)[])=>{for(let r=0;r<6;r++)for(let c=0;c<7;c++){const v=a[r*7+c];if(!v)continue;for(const z of [[1,0],[0,1],[1,1],[1,-1]]){let ok=true;for(let k=1;k<4;k++){const rr=r+z[0]*k,cc=c+z[1]*k;if(rr<0||rr>5||cc<0||cc>6||a[rr*7+cc]!==v)ok=false}if(ok)return v}}return 0};const drop=(c:number)=>{if(winner)return;let r=5;while(r>=0&&b[r*7+c])r--;if(r<0)return;let a=[...b];a[r*7+c]=1;let w=check(a);if(w){setB(a);setWinner(1);onScore(1);return}const choices=Array.from({length:7},(_,i)=>i).filter(i=>a[i]===0);if(choices.length){const ac=choices[Math.floor(Math.random()*choices.length)];let ar=5;while(ar>=0&&a[ar*7+ac])ar--;if(ar>=0)a[ar*7+ac]=2;w=check(a)}setB(a);if(w)setWinner(w)};return <Shell g={g}><div className="connect">{b.map((v,i)=><button key={i} className={v===1?"me":v===2?"ai":""} onClick={()=>drop(i%7)}/>)}</div>{winner?<Over score={1} restart={()=>{setB(Array(42).fill(0));setWinner(0)}}/>:<p className="hint">🟡 Toi · 🔴 IA</p>}</Shell>
}

function Tetris({g,onScore}:{g:Game;onScore:(n:number)=>void}){
 const[grid,setGrid]=useState(()=>Array(200).fill(0)),[piece,setPiece]=useState([1,1,1,1]),[x,setX]=useState(3),[y,setY]=useState(0),[run,setRun]=useState(false),[score,setScore]=useState(0);const cells=piece.map((v,i)=>v?y*10+x+i:-1).filter(i=>i>=0&&i<200);const collide=(ny:number,nx:number)=>piece.some((v,i)=>v&&(nx+i<0||nx+i>=10||ny<0||ny>=20||grid[ny*10+nx+i]));useEffect(()=>{if(!run)return;const id=setInterval(()=>{if(collide(y+1,x)){let a=[...grid];cells.forEach(i=>a[i]=1);let lines=0;for(let r=19;r>=0;r--)if(a.slice(r*10,r*10+10).every(Boolean)){a.splice(r*10,10);a.unshift(...Array(10).fill(0));lines++;r++}const s=score+lines*100;setScore(s);onScore(s);setGrid(a);setPiece(Math.random()<.5?[1,1,1,1]:[1,1,0,1]);setX(3);setY(0)}else setY(v=>v+1)},480);return()=>clearInterval(id)},[run,y,x,grid,piece,score,onScore]);useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==="ArrowLeft"&&!collide(y,x-1))setX(v=>v-1);if(e.key==="ArrowRight"&&!collide(y,x+1))setX(v=>v+1);if(e.key==="ArrowDown"&&!collide(y+1,x))setY(v=>v+1)};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h)},[y,x,grid,piece]);const start=()=>{setGrid(Array(200).fill(0));setPiece([1,1,1,1]);setX(3);setY(0);setScore(0);setRun(true)};return <Shell g={g} score={score}><div className="tetris">{grid.map((v,i)=><span key={i} className={v?"fill":""}/>)}{run&&cells.map(i=><span key={"f"+i} className="fall" style={{gridColumn:(i%10)+1,gridRow:Math.floor(i/10)+1}}/>)}</div>{!run&&<Start onClick={start}>{score?"REJOUER":"JOUER"}</Start>}<div className="dpad"><button onClick={()=>!collide(y,x-1)&&setX(v=>v-1)}>←</button><button onClick={()=>!collide(y+1,x)&&setY(v=>v+1)}>↓</button><button onClick={()=>!collide(y,x+1)&&setX(v=>v+1)}>→</button></div></Shell>
}

function Pinball({g,onScore}:{g:Game;onScore:(n:number)=>void}){const[run,setRun]=useState(false),[x,setX]=useState(50),[y,setY]=useState(78),[score,setScore]=useState(0),vy=useRef(-1);useEffect(()=>{if(!run)return;const id=setInterval(()=>{setY(v=>{let n=v+vy.current*.9;vy.current+=.025;if(n<10)vy.current=Math.abs(vy.current);if(n>98){setRun(false);return 98}if(Math.abs(x-50)<12&&Math.abs(n-35)<10){vy.current=-1.4;const s=score+50;setScore(s);onScore(s)}return n})},30);return()=>clearInterval(id)},[run,x,score,onScore]);return <Shell g={g} score={score}><div className="pinball"><b className="bumper">★</b><b className="bumper b2">★</b><i style={{left:x+"%",top:y+"%"}}>●</i><strong>╲　╱</strong></div>{!run&&<Start onClick={()=>{setScore(0);setX(50);setY(78);vy.current=-1;setRun(true)}}>LANCER</Start>}<div className="dpad"><button onClick={()=>setX(v=>Math.max(15,v-8))}>←</button><button onClick={()=>setX(v=>Math.min(85,v+8))}>→</button></div></Shell>}

function MiniGame({g,onScore}:{g:Game;onScore:(n:number)=>void}){switch(g.id){case"flappy-bird":return <Flappy g={g} onScore={onScore}/>;case"tetris":return <Tetris g={g} onScore={onScore}/>;case"pong":return <Pong g={g} onScore={onScore}/>;case"snake":return <Snake g={g} onScore={onScore}/>;case"2048":return <Game2048 g={g} onScore={onScore}/>;case"minesweeper":return <Mines g={g} onScore={onScore}/>;case"doodle-jump":return <Doodle g={g} onScore={onScore}/>;case"aim-trainer":return <Aim g={g} onScore={onScore}/>;case"helicopter":return <Helicopter g={g} onScore={onScore}/>;case"memory":return <Memory g={g} onScore={onScore}/>;case"reaction-time":return <Reaction g={g} onScore={onScore}/>;case"breakout":return <Breakout g={g} onScore={onScore}/>;case"endless-racer":return <Racer g={g} onScore={onScore}/>;case"rps":return <RPS g={g} onScore={onScore}/>;case"connect-four":return <Connect g={g} onScore={onScore}/>;default:return <Pinball g={g} onScore={onScore}/>}}

export default function Page(){const feed=useRef<HTMLElement>(null),[cat,setCat]=useState("Pour toi"),[q,setQ]=useState(""),[liked,setLiked]=persist<string[]>("sg-liked",[]),[saved,setSaved]=persist<string[]>("sg-saved",[]),[scores,setScores]=persist<Record<string,number>>("sg-scores",{}),[profile,setProfile]=useState(false);const games=useMemo(()=>GAMES.filter(g=>(cat==="Pour toi"||cat==="Tendance"||cat==="Nouveaux"||g.category===cat)&&(!q||g.title.toLowerCase().includes(q.toLowerCase()))).sort((a,b)=>cat==="Tendance"?b.plays-a.plays:0),[cat,q]);const record=(id:string,n:number)=>setScores(v=>({...v,[id]:Math.max(v[id]||0,n)}));const go=(n:number)=>feed.current?.scrollBy({top:n*innerHeight,behavior:"smooth"});return <main className="scroll-app"><header className="sg-topbar"><button className="brand" onClick={()=>feed.current?.scrollTo({top:0,behavior:"smooth"})}>↕ <b>SCROLL GAME</b></button><label className="search-box">⌕<input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher un jeu..."/></label><button className="avatar" onClick={()=>setProfile(true)}>🎮</button></header><nav className="sg-tabs">{CATS.map(c=><button key={c} className={cat===c?"active":""} onClick={()=>setCat(c)}>{c}</button>)}</nav><section className="feed" ref={feed}>{games.map((g,i)=><article className="game-card" key={g.id}><MiniGame g={g} onScore={n=>record(g.id,n)}/><div className="game-info"><div className="game-title-row"><div className="creator-avatar">{g.emoji}</div><div><h1>{g.title}</h1><p>{g.creator} · {fmt(g.plays)} parties</p></div></div><p className="game-description">{g.description}</p><div className="tags"><span>{g.category}</span><span>{g.difficulty}</span><span>Record {scores[g.id]||0}</span></div></div><aside className="game-actions"><button className={liked.includes(g.id)?"active":""} onClick={()=>setLiked(v=>v.includes(g.id)?v.filter(x=>x!==g.id):[...v,g.id])}>❤️<small>{fmt(g.likes+(liked.includes(g.id)?1:0))}</small></button><button className={saved.includes(g.id)?"active":""} onClick={()=>setSaved(v=>v.includes(g.id)?v.filter(x=>x!==g.id):[...v,g.id])}>🔖<small>Garder</small></button><button onClick={()=>navigator.clipboard?.writeText(location.href+"#"+g.id)}>↗️<small>Partager</small></button></aside></article>)}{!games.length&&<div className="no-results">🎮<p>Aucun jeu trouvé.</p></div>}</section><div className="feed-nav"><button onClick={()=>go(-1)}>↑</button><button onClick={()=>go(1)}>↓</button><span>SWIPE</span></div>{profile&&<div className="overlay" onClick={()=>setProfile(false)}><section className="panel profile-panel" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setProfile(false)}>×</button><div className="big-avatar">🎮</div><h2>Mon profil</h2><div className="profile-stats"><div><b>{liked.length}</b><span>Likes</span></div><div><b>{saved.length}</b><span>Gardés</span></div><div><b>{Object.keys(scores).length}</b><span>Records</span></div></div></section></div>}</main>}
