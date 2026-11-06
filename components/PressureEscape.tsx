"use client";

import { useEffect, useRef, useState } from "react";

type Props = { color: string; onScore?: (n: number) => void };
type Kind = "PRESS" | "HOLD" | "RELEASE" | "WAIT" | "DONT" | "COUNT" | "MEMORY" | "FOCUS";
type Challenge = { kind: Kind; title: string; hint: string; duration: number; target?: number; window?: number; count?: number };

const clamp = (n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));

export default function PressureEscape({color,onScore}:Props){
  const canvas=useRef<HTMLCanvasElement>(null);
  const scoreRef=useRef(onScore); scoreRef.current=onScore;
  const [muted,setMuted]=useState(false);
  const mutedRef=useRef(false); mutedRef.current=muted;

  useEffect(()=>{
    const c=canvas.current;if(!c)return;const ctx=c.getContext("2d");if(!ctx)return;
    let raf=0,last=performance.now(),dpr=1,dead=false,audio:AudioContext|null=null;
    const bestKey="sg-best-pressure";
    const beep=(f:number,g=.025,d=.05)=>{
      if(mutedRef.current)return;
      try{
        audio ||= new AudioContext(); if(audio.state==="suspended")void audio.resume();
        const o=audio.createOscillator(),gain=audio.createGain();
        o.frequency.value=f;o.type="sine";gain.gain.setValueAtTime(.0001,audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(g,audio.currentTime+.01);
        gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+d);
        o.connect(gain).connect(audio.destination);o.start();o.stop(audio.currentTime+d+.01);
      }catch{}
    };
    const vibe=(x:number|number[])=>{try{if(navigator.vibrate)navigator.vibrate(x)}catch{}};
    const getBest=()=>{try{return Number(localStorage.getItem(bestKey))||0}catch{return 0}};
    const make=(level:number,lastKind:Kind|null):Challenge=>{
      const pool:Kind[]=["PRESS","HOLD","RELEASE","WAIT","DONT","COUNT","MEMORY","FOCUS"];
      const kind=pool.filter(k=>k!==lastKind)[Math.floor(Math.random()*(pool.length-(lastKind?1:0)))];
      const fast=Math.min(.38,(level-1)*.018);
      if(kind==="PRESS")return{kind,title:"PRESS",hint:"UNE TAPE DANS LA ZONE VERTE",duration:Math.max(.72,1.3-fast),target:.58+Math.random()*.14,window:Math.max(.08,.15-fast*.35)};
      if(kind==="HOLD")return{kind,title:"HOLD",hint:"MAINTIENS PUIS RELÂCHE AU SIGNAL",duration:Math.max(1.05,1.7-fast),target:.78,window:.12};
      if(kind==="RELEASE")return{kind,title:"RELEASE",hint:"GARDE LE BOUTON • RELÂCHE DANS LA ZONE JAUNE",duration:Math.max(.9,1.45-fast),target:.64,window:.1};
      if(kind==="WAIT")return{kind,title:"WAIT",hint:"ATTENDS LE VERT AVANT D'APPUYER",duration:Math.max(.95,1.6-fast),target:.68,window:.1};
      if(kind==="DONT")return{kind,title:"DON'T",hint:"NE TOUCHE À RIEN",duration:Math.max(.9,1.3-fast)};
      if(kind==="COUNT")return{kind,title:"COUNT",hint:"TAPE EXACTEMENT LE NOMBRE AFFICHÉ",duration:Math.max(1.05,1.7-fast),count:2+Math.floor(Math.random()*Math.min(4,1+Math.floor(level/3)))};
      if(kind==="MEMORY")return{kind,title:"MEMORY",hint:"MÉMORISE • PUIS REFAIS LE MÊME NOMBRE",duration:Math.max(1.5,2.35-fast),count:2+Math.floor(Math.random()*3)};
      return{kind,title:"FOCUS",hint:"IGNORE LES FAUX SIGNAUX • SUIS LA ZONE VERTE",duration:Math.max(.78,1.35-fast),target:.55+(Math.random()-.5)*.12,window:Math.max(.07,.12-fast*.3)};
    };
    const r=c.getBoundingClientRect();
    const s:any={w:Math.max(320,Math.floor(r.width)),h:Math.max(620,Math.floor(r.height)),t:0,score:0,best:getBest(),level:1,combo:1,streak:0,ch:null,prev:null,timer:0,pressed:false,pressAt:0,taps:0,over:false,started:false,lock:false,flash:0,shake:0,particles:[],notice:"",noticeT:0,memoryVisible:true};

    const save=()=>{if(s.score>s.best){s.best=s.score;try{localStorage.setItem(bestKey,String(s.best))}catch{}}};
    const burst=(x:number,y:number,col:string,n=24)=>{for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=80+Math.random()*260;s.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.6,max:.6,size:2+Math.random()*4,col})}};
    const next=()=>{s.level=1+Math.floor(s.score/450);s.ch=make(s.level,s.prev);s.prev=s.ch.kind;s.timer=0;s.pressed=false;s.pressAt=0;s.taps=0;s.lock=false;s.memoryVisible=s.ch.kind==="MEMORY";};
    const success=(quality=1)=>{
      if(s.lock||s.over)return;s.lock=true;
      const gain=Math.round((95+s.level*12+quality*130)*s.combo);s.score+=gain;s.streak++;s.combo=Math.min(8,1+Math.floor(s.streak/3));
      s.flash=.2;s.shake=.1;s.notice="✓ PERFECT  +"+gain;s.noticeT=.7;save();scoreRef.current?.(s.score);beep(520+s.level*10,.035,.08);vibe(14);burst(s.w/2,s.h*.57,"#63f6b5",30);
      window.setTimeout(()=>{if(!dead)next()},280);
    };
    const fail=(msg:string)=>{
      if(s.lock||s.over)return;s.lock=true;s.over=true;s.streak=0;s.combo=1;s.flash=.55;s.shake=.3;s.notice=msg;s.noticeT=1;save();beep(120,.07,.14);vibe([14,22,30]);burst(s.w/2,s.h*.57,"#ff5f7a",34);
    };
    const act=(down:boolean)=>{
      if(s.over){s.over=false;s.started=false;s.score=0;s.level=1;s.combo=1;s.streak=0;s.prev=null;s.ch=null;s.timer=0;s.taps=0;s.notice="";s.lock=false;return;}
      if(!s.started){s.started=true;next();beep(260,.02);return;}
      if(s.lock||!s.ch)return;
      const ch=s.ch as Challenge;
      if(down){
        if(s.pressed)return;s.pressed=true;s.pressAt=s.timer;
        const p=clamp(s.timer/ch.duration,0,1);
        if(ch.kind==="DONT")return fail("TOUCHÉ = PERDU");
        if(ch.kind==="WAIT"&&p<(ch.target||.68)-(ch.window||.1))return fail("TOO SOON");
        if(ch.kind==="PRESS"||ch.kind==="FOCUS"){
          const q=1-Math.abs(p-(ch.target||.58))/(ch.window||.12);
          if(q>=0)success(q);else fail(p<(ch.target||.58)?"TOO SOON":"TOO LATE");
        }
        if(ch.kind==="COUNT"||ch.kind==="MEMORY"){s.taps++;beep(330+s.taps*45,.02,.03);if(s.taps>=(ch.count||2))success(1);}
      }else{
        if(!s.pressed)return;s.pressed=false;
        const p=clamp(s.timer/ch.duration,0,1);
        if(ch.kind==="HOLD"||ch.kind==="RELEASE"){
          const q=1-Math.abs(p-(ch.target||.7))/(ch.window||.11);
          if(q>=0)success(q);else fail(ch.kind==="HOLD"?(p<(ch.target||.7)?"HOLD TOO SHORT":"HOLD TOO LONG"):"RELEASE MISSED");
        }
      }
    };

    const resize=()=>{const rr=c.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,2);s.w=Math.max(320,Math.floor(rr.width));s.h=Math.max(620,Math.floor(rr.height));c.width=s.w*dpr;c.height=s.h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)};
    const down=(e:PointerEvent)=>{if(e.pointerType==="mouse"&&e.button!==0)return;e.preventDefault();act(true)};
    const up=(e:PointerEvent)=>{e.preventDefault();act(false)};
    const key=(e:KeyboardEvent)=>{if(e.code!=="Space"&&e.code!=="Enter")return;e.preventDefault();act(true)};
    const keyup=(e:KeyboardEvent)=>{if(e.code!=="Space"&&e.code!=="Enter")return;e.preventDefault();act(false)};

    const update=(dt:number)=>{
      s.t+=dt;s.flash=Math.max(0,s.flash-dt);s.shake=Math.max(0,s.shake-dt);s.noticeT=Math.max(0,s.noticeT-dt);
      for(const p of s.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=280*dt;p.life-=dt}s.particles=s.particles.filter((p:any)=>p.life>0);
      if(!s.started||s.over||!s.ch||s.lock)return;
      s.timer+=dt;const ch=s.ch as Challenge,p=clamp(s.timer/ch.duration,0,1);
      if(ch.kind==="MEMORY"&&s.timer>.82)s.memoryVisible=false;
      if((ch.kind==="COUNT"||ch.kind==="MEMORY")&&p>=1)return fail(ch.kind==="COUNT"?"COUNT MISSED":"MEMORY LOST");
      if((ch.kind==="PRESS"||ch.kind==="FOCUS")&&p>=1)return fail("TOO LATE");
      if(ch.kind==="WAIT"&&p>=1)return success(1);
      if(ch.kind==="DONT"&&p>=1)return success(1);
      if((ch.kind==="HOLD"||ch.kind==="RELEASE")&&p>=1)return fail(ch.kind==="HOLD"?"HOLD TOO LONG":"RELEASE MISSED");
    };

    const draw=()=>{
      const w=s.w,h=s.h,cx=w/2,by=h*.57,br=Math.min(108,w*.225),prog=s.ch?clamp(s.timer/s.ch.duration,0,1):0;
      ctx.save();ctx.translate(s.shake?(Math.random()-.5)*8:0,s.shake?(Math.random()-.5)*8:0);
      const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,"#050a13");bg.addColorStop(.6,"#0a1322");bg.addColorStop(1,"#020408");ctx.fillStyle=bg;ctx.fillRect(-10,-10,w+20,h+20);
      const glow=ctx.createRadialGradient(cx,by,0,cx,by,br*2.3);glow.addColorStop(0,"#63f6b520");glow.addColorStop(1,"#0000");ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,by,br*2.3,0,Math.PI*2);ctx.fill();
      ctx.textAlign="center";ctx.fillStyle="#dffdf4";ctx.font="950 11px Inter,system-ui";ctx.fillText("UNDER PRESSURE",cx,31);ctx.fillStyle="#ffffff4d";ctx.font="800 8px Inter,system-ui";ctx.fillText("ONE BUTTON • REACTION • NO MERCY",cx,47);
      ctx.fillStyle="#050a12df";ctx.beginPath();ctx.roundRect(16,64,w-32,68,18);ctx.fill();ctx.strokeStyle="#ffffff13";ctx.stroke();
      ctx.fillStyle="#fff";ctx.font="900 27px Inter,system-ui";ctx.fillText(String(s.score),w*.27,98);ctx.font="800 8px Inter,system-ui";ctx.fillStyle="#ffffff50";ctx.fillText("SCORE",w*.27,116);
      ctx.font="900 27px Inter,system-ui";ctx.fillStyle="#63f6b5";ctx.fillText("×"+s.combo,w*.73,98);ctx.font="800 8px Inter,system-ui";ctx.fillStyle="#ffffff50";ctx.fillText("COMBO",w*.73,116);
      if(s.ch){
        ctx.font="950 "+Math.max(29,Math.min(44,w*.095))+"px Inter,system-ui";ctx.fillStyle="#fff";ctx.fillText(s.ch.title,cx,h*.245);
        ctx.font="700 11px Inter,system-ui";ctx.fillStyle="#ffffff99";ctx.fillText(s.ch.hint,cx,h*.285);
        const bx=w*.11,bw=w*.78,by2=h*.345;ctx.fillStyle="#ffffff0f";ctx.beginPath();ctx.roundRect(bx,by2,bw,9,5);ctx.fill();
        const g=ctx.createLinearGradient(bx,0,bx+bw,0);g.addColorStop(0,"#63f6b5");g.addColorStop(1,color);ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(bx,by2,bw*prog,9,5);ctx.fill();
        if(s.ch.target!==undefined){ctx.fillStyle=s.ch.kind==="RELEASE"?"#ffe07a":"#63f6b5";ctx.globalAlpha=.8;const tx=bx+bw*s.ch.target,tw=bw*(s.ch.window||.1)*2;ctx.beginPath();ctx.roundRect(tx-tw/2,by2-4,tw,17,7);ctx.fill();ctx.globalAlpha=1}
        if(s.ch.kind==="MEMORY"){ctx.font="950 34px Inter,system-ui";ctx.fillStyle=s.memoryVisible?"#63f6b5":"#ffffff25";ctx.fillText(s.memoryVisible?String(s.ch.count):"•••",cx,h*.425);ctx.font="800 9px Inter,system-ui";ctx.fillStyle="#ffffff55";ctx.fillText(s.memoryVisible?"MÉMORISE":"REFAIS-LE",cx,h*.455)}
        if(s.ch.kind==="COUNT"){ctx.font="950 34px Inter,system-ui";ctx.fillStyle="#fff";ctx.fillText(String(s.ch.count),cx,h*.425);ctx.font="800 9px Inter,system-ui";ctx.fillStyle="#ffffff55";ctx.fillText(s.taps+" / "+s.ch.count,cx,h*.455)}
      }
      ctx.strokeStyle="#ffffff12";ctx.lineWidth=8;ctx.beginPath();ctx.arc(cx,by,br+17,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=s.ch?.kind==="DONT"?"#ffcf66":"#63f6b5";ctx.beginPath();ctx.arc(cx,by,br+17,-Math.PI/2,-Math.PI/2+Math.PI*2*prog);ctx.stroke();
      const gg=ctx.createRadialGradient(cx-br*.3,by-br*.4,4,cx,by,br*1.1);gg.addColorStop(0,s.pressed?"#fff":"#e7fff7");gg.addColorStop(.2,"#55e3ad");gg.addColorStop(.74,s.pressed?"#0c9e70":"#087554");gg.addColorStop(1,"#033a2a");ctx.shadowBlur=28;ctx.shadowColor="#63f6b5";ctx.fillStyle=gg;ctx.beginPath();ctx.arc(cx,by,br,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle="#ffffff55";ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,by,br-7,0,Math.PI*2);ctx.stroke();
      ctx.font="950 "+Math.max(18,br*.28)+"px Inter,system-ui";ctx.fillStyle="#fff";ctx.fillText(s.over?"RETRY":s.pressed?"HOLD":s.started?"PRESS":"START",cx,by+8);ctx.font="800 9px Inter,system-ui";ctx.fillStyle="#ffffff55";ctx.fillText("TAP / SPACE",cx,by+br+28);
      const fy=h*.78;ctx.fillStyle="#050a12e8";ctx.beginPath();ctx.roundRect(20,fy,w-40,82,18);ctx.fill();ctx.strokeStyle="#ffffff10";ctx.stroke();ctx.font="850 10px Inter,system-ui";ctx.fillStyle="#fff";ctx.fillText(s.over?"TAP POUR REJOUER":"UNE ERREUR = RUN TERMINÉ",cx,fy+29);ctx.font="800 8px Inter,system-ui";ctx.fillStyle="#ffffff45";ctx.fillText("BEST "+s.best+"   •   STREAK "+s.streak+"   •   LV "+s.level,cx,fy+51);
      if(!s.started&&!s.over){ctx.fillStyle="#02060ce6";ctx.fillRect(0,0,w,h);ctx.fillStyle="#fff";ctx.font="950 "+Math.max(30,Math.min(46,w*.105))+"px Inter,system-ui";ctx.fillText("UNDER PRESSURE",cx,h*.39);ctx.font="850 13px Inter,system-ui";ctx.fillStyle="#63f6b5";ctx.fillText("RÉAGIS. NE PANIQUE PAS.",cx,h*.445);ctx.font="700 11px Inter,system-ui";ctx.fillStyle="#ffffff74";ctx.fillText("Les règles changent. Le bouton reste le même.",cx,h*.485);ctx.font="850 9px Inter,system-ui";ctx.fillStyle="#ffffff48";ctx.fillText("TAPE LE BOUTON POUR COMMENCER",cx,h*.54)}
      if(s.over){ctx.fillStyle="#02040af0";ctx.fillRect(0,0,w,h);ctx.font="950 "+Math.max(34,Math.min(50,w*.11))+"px Inter,system-ui";ctx.fillStyle="#ff5f7a";ctx.fillText("RUN FAILED",cx,h*.39);ctx.font="900 22px Inter,system-ui";ctx.fillStyle="#fff";ctx.fillText(String(s.score),cx,h*.47);ctx.font="800 10px Inter,system-ui";ctx.fillStyle="#ffffff60";ctx.fillText("SCORE   •   BEST "+s.best,cx,h*.51);ctx.font="900 12px Inter,system-ui";ctx.fillStyle="#63f6b5";ctx.fillText("TAPE POUR REJOUER",cx,h*.59)}
      if(s.noticeT>0){ctx.globalAlpha=Math.min(1,s.noticeT);ctx.font="950 17px Inter,system-ui";ctx.fillStyle=s.over?"#ff5f7a":"#63f6b5";ctx.fillText(s.notice,cx,h*.52);ctx.globalAlpha=1}
      for(const p of s.particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
      if(s.flash>0){ctx.globalAlpha=s.flash*(s.over?.35:.5);ctx.fillStyle=s.over?"#ff5f7a":"#63f6b5";ctx.fillRect(0,0,w,h);ctx.globalAlpha=1}
      ctx.restore();
    };

    resize();window.addEventListener("resize",resize);c.addEventListener("pointerdown",down);c.addEventListener("pointerup",up);c.addEventListener("pointercancel",up);window.addEventListener("keydown",key);window.addEventListener("keyup",keyup);
    raf=requestAnimationFrame(function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);draw();raf=requestAnimationFrame(loop)});
    return()=>{dead=true;cancelAnimationFrame(raf);window.removeEventListener("resize",resize);c.removeEventListener("pointerdown",down);c.removeEventListener("pointerup",up);c.removeEventListener("pointercancel",up);window.removeEventListener("keydown",key);window.removeEventListener("keyup",keyup);try{audio?.close()}catch{}};
  },[color]);

  return <div className="pressure-shell">
    <canvas ref={canvas} aria-label="Under Pressure"/>
    <button className="pressure-mute" onClick={()=>setMuted(v=>!v)} aria-label={muted?"Activer le son":"Couper le son"}>{muted?"MUTE":"VOL"}</button>
  </div>;
}
