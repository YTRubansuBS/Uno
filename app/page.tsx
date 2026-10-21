"use client";
import { useEffect, useRef, useState } from "react";
import ArcadeGame from "../components/ArcadeGame";
type Game={id:string;color:string;name:string;tag:string};
const GAMES:Game[]=[
{id:"illegal-runner",color:"#00e5ff",name:"ILLEGAL RUNNER",tag:"CYBER RUN"},
{id:"tetris",color:"#a78bfa",name:"TETRIS",tag:"BLOCK MASTER"},
{id:"2048",color:"#f59e0b",name:"2048",tag:"MERGE LAB"},
{id:"snake",color:"#34d399",name:"SNAKE",tag:"NEON SERPENT"},
{id:"breakout",color:"#fb7185",name:"BREAKOUT",tag:"BRICK STORM"}];
export default function Page(){
 const feed=useRef<HTMLElement>(null);const [index,setIndex]=useState(0);
 useEffect(()=>{const el=feed.current;if(!el)return;const sync=()=>setIndex(Math.round(el.scrollTop/Math.max(1,el.clientHeight)));
 const wheel=(e:WheelEvent)=>{if(Math.abs(e.deltaY)<8)return;e.preventDefault();const n=Math.max(0,Math.min(GAMES.length-1,Math.round(el.scrollTop/Math.max(1,el.clientHeight))+(e.deltaY>0?1:-1)));el.scrollTo({top:n*el.clientHeight,behavior:"smooth"})};
 el.addEventListener("scroll",sync,{passive:true});el.addEventListener("wheel",wheel,{passive:false});return()=>{el.removeEventListener("scroll",sync);el.removeEventListener("wheel",wheel)}},[]);
 const go=(d:number)=>{const el=feed.current;if(!el)return;const n=Math.max(0,Math.min(GAMES.length-1,index+d));el.scrollTo({top:n*el.clientHeight,behavior:"smooth"});setIndex(n)};
 return <main className="games-only"><section className="games-feed" ref={feed}>{GAMES.map(g=><article className="game-page" key={g.id}><ArcadeGame id={g.id} color={g.color} onScore={()=>{}}/></article>)}</section>
 <div className="game-title-overlay"><b>{GAMES[index].name}</b><span>{GAMES[index].tag}</span></div>
 <nav className="game-nav"><button className="game-nav-btn" onClick={()=>go(-1)}>↑</button><div className="game-nav-count">{index+1} / {GAMES.length}</div><button className="game-nav-btn" onClick={()=>go(1)}>↓</button></nav></main>;
}