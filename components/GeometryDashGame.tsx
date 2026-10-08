"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Coins, Crown, Gamepad2, Home, Lock, Pause, Play, RotateCcw, Shield, ShoppingBag, Sparkles, Trophy, Volume2, VolumeX, Zap } from "lucide-react";
import { LEVELS, SHOP_ITEMS, UPGRADES, type GDLevel, type ShopItem, type UpgradeId } from "@/lib/geometryData";

type View = "home" | "levels" | "shop" | "upgrades" | "play";
type Tab = "skin" | "background" | "trail";
type Save = { coins:number; unlockedLevel:number; completed:number[]; best:Record<number,number>; secretCoins:string[]; owned:string[]; skin:string; background:string; trail:string; upgrades:Record<UpgradeId,number> };
type Run = { x:number; y:number; vy:number; rotation:number; onGround:boolean; deaths:number; coins:number; collected:string[]; shieldUsed:boolean; done:boolean; won:boolean; percent:number };
type Particle = {x:number;y:number;vx:number;vy:number;life:number;size:number;hue:number};

const KEY="geometry-dash-uno-v2";
const DEFAULT:Save={coins:0,unlockedLevel:1,completed:[],best:{},secretCoins:[],owned:["skin-classic","bg-day","trail-none"],skin:"skin-classic",background:"bg-day",trail:"trail-none",upgrades:{jump:0,magnet:0,shield:0,multiplier:0}};
const THEMES:any={neon:["#10153b","#23407d","#55e7ff"],sunset:["#30133a","#ae4145","#ffd166"],forest:["#0d2b28","#21715d","#7dffb2"],void:["#090817","#261553","#cf9cff"],ice:["#102d45","#61afd9","#dffaff"],lava:["#25080d","#86251c","#ffcf55"]};
const item=(id:string)=>SHOP_ITEMS.find(x=>x.id===id)||SHOP_ITEMS[0];
const diff=(x:string)=>x==="Démoniaque"?"DEMON":x==="Expert"?"INSANE":x==="Difficile"?"HARD":"NORMAL";
const cls=(x:string)=>x.toLowerCase().replace(/é/g,"e");

function cube(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,skin:ShopItem,r:number){ctx.save();ctx.translate(x+size/2,y+size/2);ctx.rotate(r);const c=skin.color||"#fff",a=skin.accent||"#55e7ff";ctx.shadowBlur=18;ctx.shadowColor=a;ctx.fillStyle=c;ctx.fillRect(-size/2,-size/2,size,size);ctx.shadowBlur=0;ctx.lineWidth=3;ctx.strokeStyle=a;ctx.strokeRect(-size/2,-size/2,size,size);ctx.fillStyle=a;ctx.fillRect(-size*.18,-size*.1,size*.1,size*.1);ctx.fillRect(size*.08,-size*.1,size*.1,size*.1);ctx.strokeStyle=a;ctx.beginPath();ctx.moveTo(-size*.18,size*.17);ctx.lineTo(0,size*.24);ctx.lineTo(size*.18,size*.17);ctx.stroke();ctx.restore()}
function bg(ctx:CanvasRenderingContext2D,w:number,h:number,id:string,theme:string,camera:number){const b=item(id),t=THEMES[theme]||THEMES.neon;let c1=b.color||t[0],c2=b.accent||t[1];if(id==="bg-day"){c1="#63cbff";c2="#b8efff"}if(id==="bg-space"){c1="#070716";c2="#34205e"}if(id==="bg-lava"){c1="#21070a";c2="#76231b"}const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);for(let i=0;i<20;i++){const x=((i*317-camera*.16)%(w+140))-70,y=60+(i*83%380);ctx.globalAlpha=.2;ctx.fillStyle=i%2?"#fff":t[2];ctx.beginPath();ctx.arc(x,y,12+i%4*7,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
function rounded(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function sound(kind:string){try{const AC=window.AudioContext||((window as any).webkitAudioContext as typeof AudioContext);if(!AC)return;const a=new AC(),o=a.createOscillator(),g=a.createGain();const f=kind==="jump"?360:kind==="coin"?760:kind==="win"?560:130;o.type=kind==="death"?"sawtooth":"square";o.frequency.value=f;g.gain.value=.04;o.connect(g);g.connect(a.destination);o.start();o.frequency.exponentialRampToValueAtTime(f*(kind==="death"?.45:1.6),a.currentTime+.09);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.14);o.stop(a.currentTime+.15);setTimeout(()=>a.close(),220)}catch{}}

export default function GeometryDashGame(){
 const [view,setView]=useState<View>("home"),[save,setSave]=useState<Save>(DEFAULT),[ready,setReady]=useState(false),[levelId,setLevelId]=useState(1),[run,setRun]=useState<Run|null>(null),[paused,setPaused]=useState(false),[muted,setMuted]=useState(false),[tab,setTab]=useState<Tab>("skin"),[toast,setToast]=useState(""),[help,setHelp]=useState(false);
 const say=useCallback((s:string)=>{setToast(s);setTimeout(()=>setToast(""),2200)},[]);
 useEffect(()=>{try{const raw=localStorage.getItem(KEY);if(raw)setSave({...DEFAULT,...JSON.parse(raw)})}catch{}setReady(true)},[]); useEffect(()=>{if(ready)localStorage.setItem(KEY,JSON.stringify(save))},[ready,save]);
 useEffect(()=>{const k=(e:KeyboardEvent)=>{if(view==="play"&&(e.code==="Space"||e.code==="ArrowUp"||e.code==="KeyW")){e.preventDefault();dispatchEvent(new CustomEvent("gd-jump"))}if(view==="play"&&e.code==="Escape")setPaused(x=>!x)};addEventListener("keydown",k);return()=>removeEventListener("keydown",k)},[view]);
 const start=(id:number)=>{if(id>save.unlockedLevel)return;setLevelId(id);setRun({x:180,y:430,vy:0,rotation:0,onGround:true,deaths:0,coins:0,collected:[],shieldUsed:false,done:false,won:false,percent:0});setPaused(false);setView("play")};
 const buy=(it:ShopItem)=>{if((it.unlockLevel||1)>save.unlockedLevel){say(`Niveau ${it.unlockLevel} requis.`);return}if(save.owned.includes(it.id)){setSave(s=>({...s,...(it.category==="skin"?{skin:it.id}:it.category==="background"?{background:it.id}:{trail:it.id})}));say("Équipé ✨");return}if(save.coins<it.price){say("Pas assez de pièces.");return}setSave(s=>({...s,coins:s.coins-it.price,owned:[...s.owned,it.id],...(it.category==="skin"?{skin:it.id}:it.category==="background"?{background:it.id}:{trail:it.id})}));say(`${it.name} acheté 🔥`)};
 const upgrade=(id:UpgradeId)=>{const u=UPGRADES.find(x=>x.id===id),lv=save.upgrades[id]||0;if(!u||lv>=u.max)return;if(save.coins<u.costs[lv]){say("Pas assez de pièces.");return}setSave(s=>({...s,coins:s.coins-u.costs[lv],upgrades:{...s.upgrades,[id]:lv+1}}));say(`${u.name} niveau ${lv+1} ⚡`)};
 const finish=(l:GDLevel,r:Run)=>{const reward=Math.round(80+l.id*25+r.coins*(1+save.upgrades.multiplier*.1)+120);setSave(s=>({...s,coins:s.coins+reward,unlockedLevel:Math.max(s.unlockedLevel,Math.min(LEVELS.length,l.id+1)),completed:s.completed.includes(l.id)?s.completed:[...s.completed,l.id],best:{...s.best,[l.id]:100},secretCoins:[...new Set([...s.secretCoins,...r.collected])]}));if(!muted)sound("win");setRun({...r,done:true,won:true,percent:100})};
 if(!ready)return <div className="gd-loading"><div className="gd-loader-cube"/><b>CHARGEMENT DU MONDE…</b></div>;
 const current=LEVELS.find(l=>l.id===levelId)||LEVELS[0],featured=LEVELS[Math.min(save.unlockedLevel-1,3)]||LEVELS[0];
