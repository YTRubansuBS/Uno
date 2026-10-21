"use client";

import { useMemo, useRef, useState } from "react";
import ArcadeGame from "../components/ArcadeGame";

type Game={id:string;title:string;creator:string;category:string;plays:number;likes:number;color:string;emoji:string;description:string;difficulty:string};
const GAMES:Game[]=[
{id:"flappy-bird",title:"Flappy Bird",creator:"@scroll",category:"Arcade",plays:1284000,likes:184000,color:"#38bdf8",emoji:"🐦",description:"Traverse les tuyaux sans toucher les obstacles. Chaque passage rapporte un point.",difficulty:"Difficile"},
{id:"tetris",title:"Tetris",creator:"@blocks",category:"Puzzle",plays:986000,likes:143000,color:"#8b5cf6",emoji:"🧱",description:"Fais tomber les pièces, complète des lignes et accélère progressivement.",difficulty:"Difficile"},
{id:"pong",title:"Pong",creator:"@classic",category:"Classique",plays:742000,likes:99000,color:"#22c55e",emoji:"🏓",description:"Affronte une IA au premier à 7 points. Contrôle ta raquette au doigt ou à la souris.",difficulty:"Moyen"},
{id:"snake",title:"Snake",creator:"@retro",category:"Classique",plays:1150000,likes:176000,color:"#10b981",emoji:"🐍",description:"Mange les pommes, grandis et évite les murs et ton propre corps.",difficulty:"Difficile"},
{id:"2048",title:"2048",creator:"@numbers",category:"Puzzle",plays:932000,likes:132000,color:"#f59e0b",emoji:"🔢",description:"Glisse les tuiles, fusionne les mêmes nombres et atteins 2048.",difficulty:"Difficile"},
{id:"minesweeper",title:"Minesweeper",creator:"@logic",category:"Puzzle",plays:613000,likes:87000,color:"#64748b",emoji:"💣",description:"Déduis les cases sûres grâce aux chiffres et marque les mines.",difficulty:"Expert"},
{id:"doodle-jump",title:"Doodle Jump",creator:"@jump",category:"Runner",plays:841000,likes:119000,color:"#06b6d4",emoji:"🤖",description:"Rebondis de plateforme en plateforme et monte toujours plus haut.",difficulty:"Difficile"},
{id:"aim-trainer",title:"Aim Trainer",creator:"@aim",category:"Réflexe",plays:1540000,likes:221000,color:"#ef4444",emoji:"🎯",description:"Détruis les cibles qui apparaissent pendant 30 secondes.",difficulty:"Expert"},
{id:"helicopter",title:"Helicopter",creator:"@fly",category:"Arcade",plays:687000,likes:96000,color:"#eab308",emoji:"🚁",description:"Maintiens ton hélicoptère dans le tunnel et va le plus loin possible.",difficulty:"Difficile"},
{id:"memory",title:"Memory",creator:"@brain",category:"Puzzle",plays:528000,likes:71000,color:"#ec4899",emoji:"🧠",description:"Retourne les cartes et retrouve les 8 paires.",difficulty:"Moyen"},
{id:"reaction-time",title:"Reaction Time",creator:"@fast",category:"Réflexe",plays:1260000,likes:189000,color:"#14b8a6",emoji:"⚡",description:"Attends le vert. Dès qu'il apparaît, touche le plus vite possible.",difficulty:"Expert"},
{id:"breakout",title:"Breakout",creator:"@arcade",category:"Arcade",plays:773000,likes:108000,color:"#f97316",emoji:"🧱",description:"Déplace la raquette et détruis les 48 briques.",difficulty:"Moyen"},
{id:"endless-racer",title:"Endless Racer",creator:"@drive",category:"Runner",plays:904000,likes:127000,color:"#dc2626",emoji:"🏎️",description:"Change de voie, évite le trafic et établis la plus grande distance.",difficulty:"Difficile"},
{id:"rps",title:"Rock Paper Scissors",creator:"@duel",category:"Classique",plays:456000,likes:62000,color:"#6366f1",emoji:"✊",description:"Affronte une IA en manches rapides et construis ta série de victoires.",difficulty:"Facile"},
{id:"connect-four",title:"Connect Four",creator:"@board",category:"Classique",plays:388000,likes:53000,color:"#2563eb",emoji:"🟡",description:"Aligne quatre pions avant l'IA sur une grille de 7 colonnes.",difficulty:"Moyen"},
{id:"pinball",title:"Pinball",creator:"@arcade",category:"Arcade",plays:619000,likes:91000,color:"#a855f7",emoji:"🎯",description:"Lance la bille, touche les bumpers et garde-la en jeu.",difficulty:"Moyen"}];
const CATS=["Pour toi","Tendance","Nouveaux","Arcade","Réflexe","Puzzle","Classique","Runner"];
const fmt=(n:number)=>n>=1e6?(n/1e6).toFixed(1).replace(".0","")+" M":n>=1e3?(n/1e3).toFixed(n>=1e4?0:1).replace(".0","")+" k":String(n);

export default function Page(){
 const feed=useRef<HTMLElement>(null);
 const [cat,setCat]=useState("Pour toi"),[q,setQ]=useState(""),[liked,setLiked]=useState<string[]>([]),[saved,setSaved]=useState<string[]>([]),[profile,setProfile]=useState(false),[commentsOpen,setCommentsOpen]=useState(false),[comment,setComment]=useState(""),[comments,setComments]=useState<string[]>([]);
 const [scores,setScores]=useState<Record<string,number>>({});
 const games=useMemo(()=>GAMES.filter(g=>(cat==="Pour toi"||cat==="Tendance"||cat==="Nouveaux"||g.category===cat)&&(!q||g.title.toLowerCase().includes(q.toLowerCase()))).sort((a,b)=>cat==="Tendance"?b.plays-a.plays:0),[cat,q]);
 const record=(id:string,n:number)=>setScores(v=>({...v,[id]:Math.max(v[id]||0,n)}));
 return <main className="shorts-app">
  <header className="shorts-top"><button className="shorts-logo" onClick={()=>feed.current?.scrollTo({top:0,behavior:"smooth"})}><span className="shorts-logo-mark">▶</span><b>SCROLL GAME</b></button><label className="shorts-search"><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher un jeu"/><kbd>⌕</kbd></label><button className="profile-mini" onClick={()=>setProfile(true)}>●</button></header>
  <nav className="shorts-categories">{CATS.map(c=><button key={c} className={cat===c?"active":""} onClick={()=>setCat(c)}>{c}</button>)}</nav>
  <section className="shorts-feed" ref={feed}>
   {games.map(g=><article className="short-card" key={g.id}>
    <div className="short-player"><ArcadeGame id={g.id} color={g.color} onScore={n=>record(g.id,n)}/><div className="player-vignette"/></div>
    <div className="short-bottom"><div className="short-creator"><div className="creator-avatar">{g.emoji}</div><div><div className="creator-name">{g.creator}</div><div className="creator-meta">{fmt(g.plays)} parties · {g.category} · {g.difficulty}</div></div><button className="follow-btn">Suivre</button></div><h1>{g.title}</h1><p>{g.description}</p><div className="audio-row">✦ Jeu instantané · aucun téléchargement</div></div>
    <aside className="short-actions"><button className={liked.includes(g.id)?"selected":""} onClick={()=>setLiked(v=>v.includes(g.id)?v.filter(x=>x!==g.id):[...v,g.id])}><span>{liked.includes(g.id)?"♥":"♡"}</span><small>{fmt(g.likes+(liked.includes(g.id)?1:0))}</small></button><button onClick={()=>setCommentsOpen(true)}><span>☁</span><small>Commentaires</small></button><button className={saved.includes(g.id)?"selected":""} onClick={()=>setSaved(v=>v.includes(g.id)?v.filter(x=>x!==g.id):[...v,g.id])}><span>🔖</span><small>Enregistrer</small></button><button onClick={()=>navigator.clipboard?.writeText(location.href)}><span>↗</span><small>Partager</small></button><button onClick={()=>setProfile(true)}><span className="action-avatar">{g.emoji}</span><small>Profil</small></button></aside>
   </article>)}
   {!games.length&&<div className="short-empty"><b>🎮</b><p>Aucun jeu trouvé.</p></div>}
  </section>
  <div className="shorts-nav-arrows"><button onClick={()=>feed.current?.scrollBy({top:-innerHeight,behavior:"smooth"})}>↑</button><button onClick={()=>feed.current?.scrollBy({top:innerHeight,behavior:"smooth"})}>↓</button></div>
  <nav className="shorts-bottom-nav"><button onClick={()=>feed.current?.scrollTo({top:0,behavior:"smooth"})}>⌂<small>Accueil</small></button><button className="active">▶<small>Jeux</small></button><button onClick={()=>setProfile(true)}>●<small>Vous</small></button></nav>
  {commentsOpen&&<div className="shorts-sheet-backdrop" onClick={()=>setCommentsOpen(false)}><section className="comments-sheet" onClick={e=>e.stopPropagation()}><div className="sheet-handle"/><div className="sheet-head"><b>Commentaires</b><button onClick={()=>setCommentsOpen(false)}>×</button></div><div className="sheet-comments">{comments.length?comments.map((c,i)=><p key={i}><b>@joueur</b>{c}</p>):<p className="empty-comment">Aucun commentaire pour le moment.</p>}</div><form onSubmit={e=>{e.preventDefault();if(comment.trim()){setComments(v=>[...v,comment.trim()]);setComment("")}}}><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Ajouter un commentaire..." maxLength={180}/><button>Publier</button></form></section></div>}
  {profile&&<div className="overlay" onClick={()=>setProfile(false)}><section className="panel profile-panel" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setProfile(false)}>×</button><div className="big-avatar">🎮</div><h2>Votre profil</h2><div className="profile-stats"><div><b>{liked.length}</b><span>J'aime</span></div><div><b>{saved.length}</b><span>Enregistrés</span></div><div><b>{Object.keys(scores).length}</b><span>Records</span></div></div></section></div>}
 </main>;
}
