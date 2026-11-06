"use client";

import { useEffect, useRef } from "react";

type Props = { color: string; onScore?: (n: number) => void };

type Challenge = {
  kind: "PRESS" | "HOLD" | "RELEASE" | "WAIT" | "DONT";
  label: string;
  hint: string;
  duration: number;
};

const clamp = (n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));

export default function PressureEscape({ color, onScore }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef(onScore);
  scoreRef.current = onScore;

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let dpr = 1;

    const makeChallenge = (level:number):Challenge => {
      const pool:Challenge["kind"][] = ["PRESS","HOLD","RELEASE","WAIT","DONT"];
      const kind = pool[Math.floor(Math.random()*pool.length)];
      const names:Record<Challenge["kind"],[string,string]> = {
        PRESS:["PRESS","Appuie UNE fois au bon moment"],
        HOLD:["HOLD","Maintiens le bouton jusqu'au signal"],
        RELEASE:["RELEASE","Relâche quand la jauge atteint la zone"],
        WAIT:["WAIT","N'appuie surtout pas tout de suite"],
        DONT:["DON'T PRESS","Ne touche PAS au bouton"],
      };
      return { kind, label:names[kind][0], hint:names[kind][1], duration:Math.max(0.9,1.65-level*.035) };
    };

    const init = () => {
      const r=c.getBoundingClientRect();
      const w=Math.max(320,Math.floor(r.width));
      const h=Math.max(620,Math.floor(r.height));
      const best=(()=>{try{return Number(localStorage.getItem("sg-best-pressure"))||0}catch{return 0}})();
      return {
        w,h,t:0,score:0,best,level:1,streak:0,combo:1,
        challenge:makeChallenge(1) as Challenge, challengeT:0,
        phase:0,pressed:false,pressStarted:0,pressDuration:0,
        over:false,flash:0,shake:0,success:0,fail:0,
        particles:[] as any[],events:[] as any[],started:false,
      };
    };

    const s:any=init();

    const resize=()=>{
      const r=c.getBoundingClientRect();
      dpr=Math.min(window.devicePixelRatio||1,2);
      const w=Math.max(320,Math.floor(r.width)),h=Math.max(620,Math.floor(r.height));
      c.width=Math.floor(w*dpr);c.height=Math.floor(h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);s.w=w;s.h=h;
    };

    const save=()=>{if(s.score>s.best){s.best=s.score;try{localStorage.setItem("sg-best-pressure",String(s.best))}catch{}}};
    const burst=(x:number,y:number,col:string,n=18)=>{
      for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=80+Math.random()*260;s.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.55,max:.55,size:2+Math.random()*4,col})}
    };
    const event=(text:string,col:string)=>{
      s.events.push({text,col,life:1,x:s.w/2,y:s.h*.29});
    };
    const next=()=>{
      s.level=Math.max(1,1+Math.floor(s.score/5));
      s.challenge=makeChallenge(s.level);
      s.challengeT=0;s.phase=Math.random()*Math.PI*2;s.pressed=false;s.pressStarted=0;s.pressDuration=0;
    };
    const success=()=>{
      const gain=100*s.combo+Math.round(s.challengeT*25);
      s.score+=gain;s.streak++;s.combo=Math.min(9,1+Math.floor(s.streak/3));s.success=.34;s.flash=.12;
      save();scoreRef.current?.(s.score);
      event("✓ CORRECT  +"+gain,"#63f6b5");burst(s.w/2,s.h*.58,"#63f6b5",26);next();
    };
    const fail=()=>{
      s.fail=.55;s.flash=.28;s.shake=.22;s.streak=0;s.combo=1;event("✕ TOO LATE","#ff5d79");burst(s.w/2,s.h*.58,"#ff5d79",32);
      s.over=true;save();
    };

    const button=(x:number,y:number,r:number)=>{
      const dx=x-s.w/2,dy=y-s.h*.57;return Math.hypot(dx,dy)<r;
    };

    const press=(down:boolean)=>{
      if(s.over){Object.assign(s,init());return}
      if(!s.started){s.started=true;s.challengeT=0;s.challenge=makeChallenge(1);return}
      s.pressed=down;
      if(down&&!s.pressStarted)s.pressStarted=s.t;
      if(!down&&s.pressStarted){s.pressDuration=s.t-s.pressStarted;s.pressStarted=0}
    };

    const pointerDown=(e:PointerEvent)=>{
      const r=c.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
      if(button(x,y,Math.min(105,s.w*.22)))press(true);
    };
    const pointerUp=()=>press(false);
    const keyDown=(e:KeyboardEvent)=>{
      if(e.repeat)return;
      if(e.code==="Space"||e.code==="Enter"){e.preventDefault();press(true)}
    };
    const keyUp=(e:KeyboardEvent)=>{
      if(e.code==="Space"||e.code==="Enter"){e.preventDefault();press(false)}
    };

    const update=(dt:number)=>{
      s.t+=dt;s.flash=Math.max(0,s.flash-dt);s.shake=Math.max(0,s.shake-dt);
      for(const p of s.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=360*dt;p.life-=dt}
      s.particles=s.particles.filter((p:any)=>p.life>0);
      for(const e of s.events){e.life-=dt;e.y-=12*dt}
      s.events=s.events.filter((e:any)=>e.life>0);
      if(s.over||!s.started)return;

      s.challengeT+=dt;
      const c=s.challenge as Challenge;
      const progress=clamp(s.challengeT/c.duration,0,1);

      if(c.kind==="PRESS" && s.pressed){
        if(progress>.12&&progress<.78)success(); else fail();
      }
      if(c.kind==="WAIT" && s.pressed)fail();
      if(c.kind==="DONT" && s.pressed)fail();

      if(c.kind==="HOLD"){
        if(!s.pressed&&s.pressStarted===0&&progress>.05) { /* wait */ }
        if(s.pressed){
          if(progress>.78){success();return}
        } else if(s.pressDuration>0)fail();
      }

      if(c.kind==="RELEASE"){
        const target=.62;
        if(!s.pressed&&s.pressDuration>0){
          if(Math.abs(progress-target)<.13)success();else fail();
        }
      }

      if(progress>=1){
        if(c.kind==="WAIT"||c.kind==="DONT")success(); else fail();
      }
    };

    const draw=()=>{
      const shake=s.shake?((Math.random()-.5)*8):0;
      ctx.save();ctx.translate(shake,shake);
      const bg=ctx.createLinearGradient(0,0,0,s.h);
      bg.addColorStop(0,"#06101d");bg.addColorStop(.48,"#0b1220");bg.addColorStop(1,"#03060c");
      ctx.fillStyle=bg;ctx.fillRect(-10,-10,s.w+20,s.h+20);

      const pulse=.5+.5*Math.sin(s.t*2.8);
      ctx.globalAlpha=.12;
      ctx.fillStyle=color;ctx.beginPath();ctx.arc(s.w/2,s.h*.57,180+pulse*35,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;

      for(let i=0;i<26;i++){ctx.fillStyle=i%2?"#63f6b5":"#ffffff";ctx.globalAlpha=.04+.03*Math.sin(s.t*1.5+i);ctx.fillRect((i*97)%s.w,(i*173+s.t*8)%s.h,2,2)}ctx.globalAlpha=1;

      ctx.textAlign="center";
      ctx.fillStyle="#ffffff";ctx.font="900 12px Inter,system-ui";ctx.fillText("PRESSURE ESCAPE",s.w/2,34);
      ctx.fillStyle="#ffffff66";ctx.font="800 9px Inter,system-ui";ctx.fillText("REACTION PROTOCOL • LEVEL "+s.level,s.w/2,51);

      ctx.fillStyle="#050a12";ctx.beginPath();ctx.roundRect(18,70,s.w-36,76,18);ctx.fill();
      ctx.strokeStyle="#ffffff14";ctx.stroke();
      ctx.font="900 28px Inter,system-ui";ctx.fillStyle="#fff";ctx.fillText(String(s.score),s.w*.27,104);
      ctx.font="800 9px Inter,system-ui";ctx.fillStyle="#ffffff66";ctx.fillText("SCORE",s.w*.27,124);
      ctx.font="900 28px Inter,system-ui";ctx.fillStyle="#63f6b5";ctx.fillText("×"+s.combo,s.w*.73,104);
      ctx.font="800 9px Inter,system-ui";ctx.fillStyle="#ffffff66";ctx.fillText("COMBO",s.w*.73,124);

      const c=s.challenge as Challenge;
      ctx.fillStyle="#ffffff";ctx.font="1000 30px Inter,system-ui";ctx.fillText(c.label,s.w/2,s.h*.27);
      ctx.fillStyle="#ffffff99";ctx.font="700 12px Inter,system-ui";ctx.fillText(c.hint,s.w/2,s.h*.31);

      const barX=s.w*.12,barW=s.w*.76,barY=s.h*.37;
      ctx.fillStyle="#ffffff0d";ctx.beginPath();ctx.roundRect(barX,barY,barW,10,5);ctx.fill();
      const prog=clamp(s.challengeT/c.duration,0,1);
      const grad=ctx.createLinearGradient(barX,0,barX+barW,0);grad.addColorStop(0,"#63f6b5");grad.addColorStop(1,color);
      ctx.fillStyle=grad;ctx.beginPath();ctx.roundRect(barX,barY,barW*prog,10,5);ctx.fill();

      if(c.kind==="PRESS"||c.kind==="RELEASE"){
        const target=c.kind==="PRESS"?0.45:0.62;
        ctx.fillStyle="#ffe66d";ctx.fillRect(barX+barW*(target-.13),barY-5,2,20);ctx.fillRect(barX+barW*(target+.13),barY-5,2,20);
        ctx.font="700 9px Inter";ctx.fillStyle="#ffe66d";ctx.fillText("ZONE PARFAITE",barX+barW*target,barY-10);
      }

      const bx=s.w/2,by=s.h*.57,br=Math.min(105,s.w*.22);
      const g=ctx.createRadialGradient(bx-br*.3,by-br*.4,5,bx,by,br*1.1);
      g.addColorStop(0,s.pressed?"#ffffff":"#dffdf4");g.addColorStop(.18,s.pressed?"#63f6b5":"#39d89a");g.addColorStop(.7,s.pressed?"#0c9e70":"#087554");g.addColorStop(1,"#043c2c");
      ctx.shadowBlur=s.pressed?38:22;ctx.shadowColor="#63f6b5";ctx.fillStyle=g;ctx.beginPath();ctx.arc(bx,by,br,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      ctx.strokeStyle="#ffffff55";ctx.lineWidth=3;ctx.beginPath();ctx.arc(bx,by,br-8,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle="#fff";ctx.font="1000 "+Math.max(18,br*.28)+"px Inter";ctx.fillText(s.pressed?"REACT":"PRESS",bx,by+9);

      ctx.fillStyle="#ffffff55";ctx.font="800 10px Inter";ctx.fillText("TAP / SPACE",bx,by+br+27);

      const sideY=s.h*.78;
      ctx.fillStyle="#050a12";ctx.beginPath();ctx.roundRect(24,sideY,s.w-48,86,18);ctx.fill();
      ctx.strokeStyle="#ffffff10";ctx.stroke();
      ctx.fillStyle="#fff";ctx.font="900 11px Inter";ctx.fillText(
        c.kind==="HOLD"?"MAINTIENS JUSQU'AU SIGNAL":
        c.kind==="RELEASE"?"RELÂCHE DANS LA ZONE JAUNE":
        c.kind==="WAIT"?"ATTENDS. NE CLIQUE PAS":
        c.kind==="DONT"?"NE TOUCHE SURTOUT PAS":
        "UN SEUL CLIC, AU BON MOMENT",s.w/2,sideY+31);
      ctx.fillStyle="#ffffff55";ctx.font="700 9px Inter";ctx.fillText("UNE ERREUR = RUN TERMINÉ",s.w/2,sideY+55);

      if(!s.started&&!s.over){
        ctx.fillStyle="#000b";ctx.fillRect(0,0,s.w,s.h);
        ctx.fillStyle="#fff";ctx.font="1000 34px Inter";ctx.fillText("UNDER PRESSURE",s.w/2,s.h*.4);
        ctx.fillStyle="#63f6b5";ctx.font="800 13px Inter";ctx.fillText("RÉAGIS. NE PANIQUE PAS.",s.w/2,s.h*.45);
        ctx.fillStyle="#ffffffaa";ctx.font="700 11px Inter";ctx.fillText("Le bouton change de règle à chaque manche.",s.w/2,s.h*.51);
        ctx.fillStyle="#ffffff66";ctx.font="800 10px Inter";ctx.fillText("TAPE LE BOUTON POUR COMMENCER",s.w/2,s.h*.57);
      }

      if(s.over){
        ctx.fillStyle="#02040ae8";ctx.fillRect(0,0,s.w,s.h);
        ctx.fillStyle="#ff5d79";ctx.font="1000 38px Inter";ctx.fillText("PRESSURE FAILED",s.w/2,s.h*.4);
        ctx.fillStyle="#fff";ctx.font="900 18px Inter";ctx.fillText("SCORE  "+s.score,s.w/2,s.h*.47);
        ctx.fillStyle="#ffffff77";ctx.font="800 11px Inter";ctx.fillText("BEST  "+s.best,s.w/2,s.h*.51);
        ctx.fillStyle="#63f6b5";ctx.font="900 12px Inter";ctx.fillText("TAPE POUR RECOMMENCER",s.w/2,s.h*.58);
      }

      for(const p of s.particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
      for(const e of s.events){ctx.globalAlpha=Math.max(0,e.life);ctx.fillStyle=e.col;ctx.font="1000 16px Inter";ctx.fillText(e.text,e.x,e.y-(1-e.life)*24)}ctx.globalAlpha=1;

      if(s.flash>0){ctx.globalAlpha=s.flash;ctx.fillStyle="#fff";ctx.fillRect(0,0,s.w,s.h);ctx.globalAlpha=1}
      ctx.restore();
    };

    resize();
    window.addEventListener("resize",resize);
    c.addEventListener("pointerdown",pointerDown);
    window.addEventListener("pointerup",pointerUp);
    window.addEventListener("keydown",keyDown);
    window.addEventListener("keyup",keyUp);

    const frame=(now:number)=>{const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);draw();raf=requestAnimationFrame(frame)};
    raf=requestAnimationFrame(frame);

    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);c.removeEventListener("pointerdown",pointerDown);window.removeEventListener("pointerup",pointerUp);window.removeEventListener("keydown",keyDown);window.removeEventListener("keyup",keyUp)};
  },[color]);

  return <div className="arcade-shell"><canvas ref={canvas} aria-label="Pressure Escape reaction game"/></div>;
}
