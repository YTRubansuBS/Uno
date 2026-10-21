"use client";

import { useEffect, useRef } from "react";
import ArcadeGame from "../components/ArcadeGame";

type Game={id:string;color:string};
const GAMES:Game[]=[
{id:"flappy-bird",color:"#38bdf8"},{id:"tetris",color:"#8b5cf6"},{id:"pong",color:"#22c55e"},{id:"snake",color:"#10b981"},
{id:"2048",color:"#f59e0b"},{id:"minesweeper",color:"#64748b"},{id:"doodle-jump",color:"#06b6d4"},{id:"aim-trainer",color:"#ef4444"},
{id:"helicopter",color:"#eab308"},{id:"memory",color:"#ec4899"},{id:"reaction-time",color:"#14b8a6"},{id:"breakout",color:"#f97316"},
{id:"endless-racer",color:"#dc2626"},{id:"rps",color:"#6366f1"},{id:"connect-four",color:"#2563eb"},{id:"pinball",color:"#a855f7"}
];

export default function Page(){
 const feed=useRef<HTMLElement>(null);
 useEffect(()=>{
  const el=feed.current;if(!el)return;
  const onWheel=(e:WheelEvent)=>{if(Math.abs(e.deltaY)<8)return;e.preventDefault();el.scrollBy({top:e.deltaY>0?innerHeight:-innerHeight,behavior:"smooth"})};
  el.addEventListener("wheel",onWheel,{passive:false});
  return()=>el.removeEventListener("wheel",onWheel);
 },[]);
 return <main className="games-only"><section className="games-feed" ref={feed}>
  {GAMES.map(g=><article className="game-page" key={g.id}><ArcadeGame id={g.id} color={g.color} onScore={()=>{}}/></article>)}
 </section></main>;
}
