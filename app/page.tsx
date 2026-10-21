"use client";

import { useEffect, useRef, useState } from "react";
import ArcadeGame from "../components/ArcadeGame";

type Game={id:string;color:string};
const GAMES:Game[]=[
{id:"flappy-bird",color:"#38bdf8"},{id:"tetris",color:"#8b5cf6"},{id:"pong",color:"#22c55e"},{id:"snake",color:"#10b981"},
{id:"2048",color:"#f59e0b"},{id:"minesweeper",color:"#64748b"},{id:"doodle-jump",color:"#06b6d4"},{id:"aim-trainer",color:"#ef4444"},
{id:"helicopter",color:"#eab308"},{id:"memory",color:"#ec4899"},{id:"reaction-time",color:"#14b8a6"},{id:"breakout",color:"#f97316"},
{id:"endless-racer",color:"#dc2626"},{id:"rps",color:"#6366f1"},{id:"connect-five",color:"#2563eb"},{id:"pinball",color:"#a855f7"},{id:"tower-stack",color:"#f43f5e"},{id:"perfect-timing",color:"#22d3ee"},{id:"coin-rush",color:"#fbbf24"},{id:"target-rush",color:"#fb7185"},{id:"sequence",color:"#818cf8"},{id:"orbit-dodge",color:"#a78bfa"},{id:"color-switch",color:"#34d399"}
];

export default function Page(){
 const feed=useRef<HTMLElement>(null);
 const [index,setIndex]=useState(0);

 useEffect(()=>{
  const el=feed.current;if(!el)return;
  const sync=()=>setIndex(Math.round(el.scrollTop/Math.max(1,el.clientHeight)));
  const onWheel=(e:WheelEvent)=>{
   if(Math.abs(e.deltaY)<8)return;
   e.preventDefault();
   el.scrollTo({top:Math.max(0,Math.min((GAMES.length-1)*innerHeight,el.scrollTop+(e.deltaY>0?innerHeight:-innerHeight))),behavior:"smooth"});
  };
  el.addEventListener("scroll",sync,{passive:true});
  el.addEventListener("wheel",onWheel,{passive:false});
  return()=>{el.removeEventListener("scroll",sync);el.removeEventListener("wheel",onWheel)};
 },[]);

 const go=(delta:number)=>{
  const el=feed.current;if(!el)return;
  const next=Math.max(0,Math.min(GAMES.length-1,index+delta));
  el.scrollTo({top:next*el.clientHeight,behavior:"smooth"});
  setIndex(next);
 };

 return <main className="games-only">
  <section className="games-feed" ref={feed}>
   {GAMES.map(g=><article className="game-page" key={g.id}><ArcadeGame id={g.id} color={g.color} onScore={()=>{}}/></article>)}
  </section>
  <nav className="game-nav" aria-label="Navigation des jeux">
   <button className="game-nav-btn" onClick={()=>go(-1)} aria-label="Jeu précédent">↑</button>
   <div className="game-nav-count">{index+1}/{GAMES.length}</div>
   <button className="game-nav-btn" onClick={()=>go(1)} aria-label="Jeu suivant">↓</button>
  </nav>
 </main>;
}
