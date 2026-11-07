"use client";
import { useCallback,useEffect,useMemo,useRef,useState } from "react";
import ArcadeGame from "../components/ArcadeGame";
import PressureEscape from "../components/PressureEscapeClassic";

type Game={id:string;color:string;name:string;tag:string};
const GAMES:Game[]=[
{id:"illegal-runner",color:"#00e5ff",name:"ILLEGAL RUNNER",tag:"CYBER RUN"},
{id:"tetris",color:"#a78bfa",name:"TETRIS",tag:"BLOCK MASTER"},
{id:"2048",color:"#f59e0b",name:"2048",tag:"MERGE LAB"},
{id:"snake",color:"#34d399",name:"SNAKE",tag:"NEON SERPENT"},
{id:"breakout",color:"#fb7185",name:"BREAKOUT",tag:"BRICK STORM"},
{id:"uno-fou",color:"#e5383b",name:"UNO FOU",tag:"CARD CHAOS"},
{id:"flappy-bird",color:"#63c9ff",name:"FLAPPY FLIGHT",tag:"SKY RUSH"},
{id:"pressure",color:"#63f6b5",name:"UNDER PRESSURE",tag:"REACTION ESCAPE"}];

const TUTORIALS:Record<string,{title:string;goal:string;controls:string[]}>={
"illegal-runner":{title:"ILLEGAL RUNNER",goal:"Cours le plus loin possible sans toucher les obstacles.",controls:["Tape / clique sur le jeu = SAUT","⚡ DASH = traverse les obstacles","Clavier : ESPACE / ↑ / W pour sauter"]},
"tetris":{title:"TETRIS",goal:"Place les pièces pour remplir des lignes et marquer un maximum de points.",controls:["← / → = déplacer","↑ = tourner • ↓ = descendre","ESPACE = chute instantanée • C = HOLD"]},
"2048":{title:"2048",goal:"Fusionne les mêmes nombres jusqu'à atteindre 2048.",controls:["Swipe = déplacer les cases","Flèches = déplacer","Double-tap = annuler le dernier coup"]},
"snake":{title:"SNAKE",goal:"Mange la nourriture, grandis et évite les murs, obstacles et ton propre corps.",controls:["Swipe = changer de direction","Flèches = diriger le serpent","🟡 = bonus spécial"]},
"breakout":{title:"BREAKOUT",goal:"Casse toutes les briques sans perdre tes 3 vies.",controls:["Glisse = déplacer la raquette","Tape = lancer la balle","Attrape les bonus qui tombent"]},
"uno-fou":{title:"UNO FOU",goal:"Joue au UNO contre des bots ou avec tes amis et gagne la partie.",controls:["Carte jouable = touche-la pour la sélectionner / jouer","Piocher = récupérer une carte","UNO ! = annonce quand il te reste 1 carte","Amis = créer ou rejoindre un salon avec un code"]},
"flappy-bird":{title:"FLAPPY FLIGHT",goal:"Passe entre les portes sans les toucher et bats ton meilleur score.",controls:["Tape / clique / ESPACE = battre des ailes","↑ = battre des ailes sur PC","Le jeu accélère progressivement"]},
"pressure":{title:"UNDER PRESSURE",goal:"Réagis aux consignes qui changent : timing, maintien, mémoire, comptage et pièges.",controls:["TAP / ESPACE = action","PRESS = zone verte • HOLD / RELEASE = timing précis","COUNT / MEMORY = exactement le bon nombre","WAIT / DON'T = ne touche pas quand il ne faut pas"]}};

function Tutorial({game,onDone}:{game:Game;onDone:()=>void}){
  const t=TUTORIALS[game.id];
  return <div className="game-tutorial-backdrop" role="dialog" aria-modal="true" aria-label={"Tutoriel "+t.title}>
    <div className="game-tutorial-card">
      <div className="game-tutorial-kicker">TUTORIEL • {t.title}</div>
      <h1>{t.title}</h1><p>{t.goal}</p>
      <div className="game-tutorial-controls">{t.controls.map((x,i)=><div className="game-tutorial-control" key={i}>{x}</div>)}</div>
      <button className="game-tutorial-start" onClick={onDone}>▶ J'AI COMPRIS — JOUER</button>
    </div>
  </div>;
}

export default function Page(){
  const [index,setIndex]=useState(0);
  const [tutorialOpen,setTutorialOpen]=useState(true);
  const startRef=useRef<{x:number;y:number}|null>(null);
  const current=GAMES[index];
  const tutorialKey=useMemo(()=>`scrollGameTutorials:v2:${current.id}`,[current.id]);

  useEffect(()=>{
    try{setTutorialOpen(localStorage.getItem(tutorialKey)!=="1")}catch{setTutorialOpen(true)}
  },[tutorialKey]);

  useEffect(()=>{
    const down=(e:PointerEvent)=>{
      if((e.target as HTMLElement|null)?.closest?.("canvas,button,input,a"))return;
      startRef.current={x:e.clientX,y:e.clientY};
    };
    const up=(e:PointerEvent)=>{
      const s=startRef.current;startRef.current=null;if(!s||tutorialOpen)return;
      const dx=e.clientX-s.x,dy=e.clientY-s.y;
      if(Math.abs(dy)<80||Math.abs(dy)<Math.abs(dx))return;
      setIndex(i=>Math.max(0,Math.min(GAMES.length-1,i+(dy<0?1:-1))));
    };
    const key=(e:KeyboardEvent)=>{
      const target=e.target as HTMLElement|null;
      if(tutorialOpen||target?.closest?.("canvas,button,input,textarea,select"))return;
      if(e.key==="ArrowDown"||e.key==="PageDown"){e.preventDefault();setIndex(i=>Math.min(GAMES.length-1,i+1))}
      if(e.key==="ArrowUp"||e.key==="PageUp"){e.preventDefault();setIndex(i=>Math.max(0,i-1))}
    };
    window.addEventListener("pointerdown",down,{passive:true});window.addEventListener("pointerup",up,{passive:true});window.addEventListener("keydown",key);
    return()=>{window.removeEventListener("pointerdown",down);window.removeEventListener("pointerup",up);window.removeEventListener("keydown",key)};
  },[tutorialOpen]);

  const complete=useCallback(()=>{try{localStorage.setItem(tutorialKey,"1")}catch{}setTutorialOpen(false)},[tutorialKey]);
  const go=useCallback((d:number)=>setIndex(i=>Math.max(0,Math.min(GAMES.length-1,i+d))),[]);
  const progress=((index)/(GAMES.length-1))*100;

  return <main className="games-only">
    <section className="games-feed" style={{["--accent" as string]:current.color} as any}>
      <article className="game-page" key={current.id}>
        {current.id==="illegal-runner" ? <iframe className="illegal-runner-frame" src="/illegal-runner/index.html?embed=1" title="Illegal Runner" allow="autoplay; fullscreen"/> :
         current.id==="uno-fou" ? <iframe className="illegal-runner-frame" src="/uno-fou/index.html" title="UNO FOU" allow="autoplay; fullscreen"/> :
         current.id==="pressure" ? <PressureEscape color={current.color} onScore={()=>{}}/> :
         <ArcadeGame id={current.id} color={current.color} onScore={()=>{}}/>}
      </article>
    </section>

    <div className="game-topbar">
      <div className="game-brand"><span className="game-live-dot" style={{background:current.color}}/><div><b>{current.name}</b><span>{current.tag}</span></div></div>
      <div className="game-index-pill"><strong>{String(index+1).padStart(2,"0")}</strong><span>/ {String(GAMES.length).padStart(2,"0")}</span></div>
      <button className="game-help-btn" onClick={()=>setTutorialOpen(true)}>?</button>
    </div>

    <div className="game-progress" aria-hidden="true"><i style={{width:progress+"%",background:current.color}}/></div>

    <nav className="game-nav" aria-label="Navigation des jeux">
      <button className="game-nav-btn" aria-label="Jeu précédent" disabled={index===0} onClick={()=>go(-1)}>↑</button>
      <div className="game-nav-count"><span>SWIPE</span><b>{index+1}</b></div>
      <button className="game-nav-btn" aria-label="Jeu suivant" disabled={index===GAMES.length-1} onClick={()=>go(1)}>↓</button>
    </nav>

    {tutorialOpen&&<Tutorial game={current} onDone={complete}/>}
  </main>;
}
