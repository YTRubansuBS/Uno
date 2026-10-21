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
const categories = ["Pour toi","Tendance","Nouveaux","Arcade","Réflexe","Puzzle","Sport","Runner","Classique"];\nconst CATS = categories;

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


export default function Page(){
  const feed=useRef<HTMLElement>(null);
  const [cat,setCat]=useState("Pour toi");
  const [q,setQ]=useState("");
  const [liked,setLiked]=usePersistent<string[]>("sg-liked",[]);
  const [saved,setSaved]=usePersistent<string[]>("sg-saved",[]);
  const [scores,setScores]=usePersistent<Record<string,number>>("sg-scores",{});
  const [profile,setProfile]=useState(false);
  const [comments,setComments]=useState<string[]>([]);
  const [commentsOpen,setCommentsOpen]=useState(false);
  const [comment,setComment]=useState("");
  const [muted,setMuted]=useState(true);

  const games=useMemo(
    ()=>GAMES.filter(g=>
      (cat==="Pour toi"||cat==="Tendance"||cat==="Nouveaux"||g.category===cat) &&
      (!q||g.title.toLowerCase().includes(q.toLowerCase()))
    ).sort((a,b)=>cat==="Tendance"?b.plays-a.plays:0),
    [cat,q]
  );

  const record=(id:string,n:number)=>setScores(v=>({...v,[id]:Math.max(v[id]||0,n)}));
  const scrollToGame=(direction:number)=>{
    const el=feed.current;
    if(!el)return;
    el.scrollBy({top:direction*window.innerHeight,behavior:"smooth"});
  };
  const submitComment=(e:React.FormEvent)=>{
    e.preventDefault();
    const value=comment.trim();
    if(!value)return;
    setComments(v=>[...v,value]);
    setComment("");
  };

  return <main className="shorts-app">
    <header className="shorts-top">
      <button className="shorts-logo" onClick={()=>feed.current?.scrollTo({top:0,behavior:"smooth"})} aria-label="Accueil">
        <span className="shorts-logo-mark">▶</span><b>SCROLL GAME</b>
      </button>
      <label className="shorts-search">
        <span>⌕</span>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher" aria-label="Rechercher un jeu"/>
        <kbd>⌕</kbd>
      </label>
      <div className="shorts-top-actions">
        <button onClick={()=>setProfile(true)} aria-label="Profil">●</button>
      </div>
    </header>

    <nav className="shorts-categories" aria-label="Catégories">
      {CATS.map(c=><button key={c} className={cat===c?"active":""} onClick={()=>setCat(c)}>{c}</button>)}
    </nav>

    <section className="shorts-feed" ref={feed}>
      {games.map(g=><article className="short-card" key={g.id} id={g.id}>
        <div className="short-player">
          <MiniGame game={g} onScore={n=>record(g.id,n)}/>
          <div className="player-top">
            <span className="live-pill">JEU</span>
            <button className="player-icon" onClick={()=>setMuted(v=>!v)} aria-label={muted?"Activer le son":"Couper le son"}>{muted?"🔇":"🔊"}</button>
          </div>
          <div className="player-vignette"/>
        </div>

        <div className="short-bottom">
          <div className="short-creator">
            <div className="creator-avatar">{g.emoji}</div>
            <div>
              <div className="creator-name">{g.creator}</div>
              <div className="creator-meta">{formatCount(g.plays)} parties · {g.category}</div>
            </div>
            <button className="follow-btn">S'abonner</button>
          </div>
          <h1>{g.title}</h1>
          <p>{g.description}</p>
          <button className="audio-row" onClick={()=>setMuted(v=>!v)}>
            <span>♫</span> Son du jeu · {muted?"Muet":"Activé"} <span>›</span>
          </button>
        </div>

        <aside className="short-actions" aria-label="Actions">
          <button className={liked.includes(g.id)?"selected":""} onClick={()=>setLiked(v=>v.includes(g.id)?v.filter(x=>x!==g.id):[...v,g.id])}>
            <span>{liked.includes(g.id)?"♥":"♡"}</span><small>{formatCount(g.likes+(liked.includes(g.id)?1:0))}</small>
          </button>
          <button onClick={()=>setCommentsOpen(true)}>
            <span>☁</span><small>Commentaires</small>
          </button>
          <button className={saved.includes(g.id)?"selected":""} onClick={()=>setSaved(v=>v.includes(g.id)?v.filter(x=>x!==g.id):[...v,g.id])}>
            <span>🔖</span><small>Enregistrer</small>
          </button>
          <button onClick={()=>navigator.clipboard?.writeText(location.href+"#"+g.id)}>
            <span>↗</span><small>Partager</small>
          </button>
          <button onClick={()=>setProfile(true)}>
            <span className="action-avatar">{g.emoji}</span><small>Profil</small>
          </button>
        </aside>
      </article>)}

      {!games.length&&<div className="short-empty"><b>🎮</b><p>Aucun jeu trouvé.</p></div>}
    </section>

    <div className="shorts-nav-arrows" aria-hidden="true">
      <button onClick={()=>scrollToGame(-1)}>↑</button>
      <button onClick={()=>scrollToGame(1)}>↓</button>
    </div>

    <nav className="shorts-bottom-nav">
      <button onClick={()=>feed.current?.scrollTo({top:0,behavior:"smooth"})}><span>⌂</span><small>Accueil</small></button>
      <button className="active"><span>▶</span><small>Jeux</small></button>
      <button onClick={()=>setProfile(true)}><span>●</span><small>Vous</small></button>
    </nav>

    {commentsOpen&&<div className="shorts-sheet-backdrop" onClick={()=>setCommentsOpen(false)}>
      <section className="comments-sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div className="sheet-head"><b>Commentaires</b><button onClick={()=>setCommentsOpen(false)}>×</button></div>
        <div className="sheet-comments">
          {comments.length?comments.map((c,i)=><p key={i}><b>@joueur</b>{c}</p>):<p className="empty-comment">Aucun commentaire pour le moment.</p>}
        </div>
        <form onSubmit={submitComment}>
          <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Ajouter un commentaire..." maxLength={180}/>
          <button>Publier</button>
        </form>
      </section>
    </div>}

    {profile&&<div className="overlay" onClick={()=>setProfile(false)}>
      <section className="panel profile-panel" onClick={e=>e.stopPropagation()}>
        <button className="close" onClick={()=>setProfile(false)}>×</button>
        <div className="big-avatar">🎮</div>
        <h2>Votre profil</h2>
        <div className="profile-stats">
          <div><b>{liked.length}</b><span>J'aime</span></div>
          <div><b>{saved.length}</b><span>Enregistrés</span></div>
          <div><b>{Object.keys(scores).length}</b><span>Records</span></div>
        </div>
      </section>
    </div>}
  </main>
}
