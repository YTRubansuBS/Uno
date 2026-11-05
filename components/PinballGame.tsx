
"use client";
import { useEffect, useRef } from "react";

type Props = { color: string; onScore?: (n: number) => void };
type Ball = { x:number;y:number;vx:number;vy:number;r:number };
type Flipper = { x:number;y:number;len:number;angle:number;side:-1|1;pressed:boolean };

const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const rnd=(a:number,b:number)=>a+Math.random()*(b-a);
const cp=(px:number,py:number,ax:number,ay:number,bx:number,by:number)=>{
  const dx=bx-ax,dy=by-ay,t=clamp(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1),0,1);
  return{x:ax+dx*t,y:ay+dy*t};
};

export default function PinballGame({color,onScore}:Props){
  const canvas=useRef<HTMLCanvasElement>(null),S=useRef<any>({});
  const scoreRef=useRef(onScore);scoreRef.current=onScore;

  useEffect(()=>{
    const c=canvas.current;if(!c)return;const ctx=c.getContext("2d");if(!ctx)return;
    let raf=0,last=performance.now(),dpr=1;
    const keys={l:false,r:false},touch={l:false,r:false};

    const resize=()=>{
      const q=c.getBoundingClientRect(),w=Math.max(1,Math.floor(q.width)),h=Math.max(1,Math.floor(q.height));
      dpr=Math.min(devicePixelRatio||1,2);c.width=Math.floor(w*dpr);c.height=Math.floor(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      if(S.current.w){S.current.w=w;S.current.h=h;S.current.b={l:w*.18,r:w*.82,t:64,b:h-58};}
    };
    const saveBest=(s:any)=>{if(s.score>s.best){s.best=s.score;try{localStorage.setItem("sg-best-pinball",String(s.score))}catch{}}};
    const burst=(s:any,x:number,y:number,col:string,n=18,pow=180)=>{
      for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=rnd(pow*.35,pow);s.p.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rnd(.35,.8),max:.8,size:rnd(1.5,4),col})}
    };
    const pop=(s:any,txt:string,x:number,y:number,col="#fff")=>s.pop.push({txt,x,y,life:1,col});
    const addScore=(s:any,n:number,x:number,y:number,col:string)=>{
      const gain=Math.round(n*s.mult);s.score+=gain;s.combo++;s.comboT=2.3;s.shake=.13;s.flash=.08;
      pop(s,"+"+gain,x,y,col);burst(s,x,y,col,14,190);saveBest(s.score);scoreRef.current?.(s.score);
      if(s.combo%5===0){s.mult=Math.min(8,s.mult+1);pop(s,"x"+s.mult+" FEVER",s.w/2,s.h*.28,"#ffe66d");burst(s,s.w/2,s.h*.28,"#ffe66d",32,260)}
    };
    const reset=()=>{
      const q=c.getBoundingClientRect(),w=Math.max(1,Math.floor(q.width)),h=Math.max(1,Math.floor(q.height)),mid=w/2;
      let best=0;try{best=Number(localStorage.getItem("sg-best-pinball"))||0}catch{}
      const b={l:w*.18,r:w*.82,t:64,b:h-58};
      S.current={w,h,b,best,score:0,t:0,p:[],pop:[],shake:0,flash:0,combo:0,comboT:0,mult:1,launched:false,over:false,lives:3,hit:0,
        ball:{x:b.r-24,y:b.b-34,vx:0,vy:0,r:Math.max(8,Math.min(12,w*.012))} as Ball,
        targets:Array.from({length:6},(_,i)=>({x:mid-112+i*45,y:b.t+93+(Math.abs(2.5-i)*4),w:32,h:13,on:false,value:100})),
        bumpers:[
          {x:mid-72,y:b.t+188,r:25,col:"#65f7ff",value:70,p:0},
          {x:mid+72,y:b.t+188,r:25,col:"#ff57d8",value:75,p:0},
          {x:mid,y:b.t+278,r:29,col:"#ffe66d",value:110,p:0},
          {x:b.l+58,y:b.t+350,r:19,col:"#77ff8a",value:50,p:0},
          {x:b.r-58,y:b.t+350,r:19,col:"#9b7cff",value:50,p:0}
        ],
        flippers:[
          {x:mid-18,y:b.b-78,len:Math.min(105,w*.19),angle:-.52,side:-1,pressed:false},
          {x:mid+18,y:b.b-78,len:Math.min(105,w*.19),angle:Math.PI+.52,side:1,pressed:false}
        ]
      };
    };
    const launch=(s:any)=>{if(s.over){reset();return}if(s.launched)return;s.launched=true;s.ball.vx=rnd(-85,-45);s.ball.vy=-660;burst(s,s.ball.x,s.ball.y,"#fff",24,230)};
    const ends=(f:any)=>({ax:f.x,ay:f.y,bx:f.x+Math.cos(f.angle)*f.len,by:f.y+Math.sin(f.angle)*f.len});
    const hitFlipper=(s:any,f:any)=>{
      const e=ends(f),p=cp(s.ball.x,s.ball.y,e.ax,e.ay,e.bx,e.by),dx=s.ball.x-p.x,dy=s.ball.y-p.y,d=Math.hypot(dx,dy),rr=s.ball.r+10;
      if(d>=rr)return;
      const nx=d>.001?dx/d:0,ny=d>.001?dy/d:-1;s.ball.x=p.x+nx*rr;s.ball.y=p.y+ny*rr;
      const v=Math.max(520,Math.hypot(s.ball.vx,s.ball.vy)+(f.pressed?150:0));
      s.ball.vx=nx*v+(f.side<0?120:-120);s.ball.vy=ny*v-120;addScore(s,30,s.ball.x,s.ball.y,"#fff");
    };

    const draw=()=>{
      const s=S.current;if(!s.w)return;ctx.save();
      if(s.shake>0)ctx.translate(rnd(-4,4),rnd(-4,4));
      const bg=ctx.createLinearGradient(0,0,s.w,s.h);bg.addColorStop(0,"#060816");bg.addColorStop(.5,"#170b31");bg.addColorStop(1,"#020309");ctx.fillStyle=bg;ctx.fillRect(0,0,s.w,s.h);
      for(let i=0;i<30;i++){ctx.globalAlpha=.15+.12*Math.sin(s.t*2+i);ctx.fillStyle=i%3===0?"#65f7ff":i%3===1?"#ff57d8":"#ffe66d";ctx.beginPath();ctx.arc((i*81)%s.w,(i*141+s.t*12)%s.h,1+(i%2),0,7);ctx.fill()}ctx.globalAlpha=1;
      const b=s.b;
      ctx.shadowBlur=35;ctx.shadowColor="#6d63ff55";ctx.fillStyle="#080a16";ctx.beginPath();ctx.roundRect(b.l-17,b.t-17,b.r-b.l+34,b.b-b.t+34,30);ctx.fill();ctx.shadowBlur=0;
      const fld=ctx.createLinearGradient(b.l,b.t,b.r,b.b);fld.addColorStop(0,"#10183d");fld.addColorStop(.5,"#170c35");fld.addColorStop(1,"#071625");ctx.fillStyle=fld;ctx.beginPath();ctx.roundRect(b.l,b.t,b.r-b.l,b.b-b.t,26);ctx.fill();
      ctx.save();ctx.clip();ctx.strokeStyle="#ffffff0c";for(let i=0;i<10;i++){const y=b.t+42+i*61;ctx.beginPath();ctx.moveTo(b.l+20,y);ctx.lineTo(b.r-20,y);ctx.stroke()}
      ctx.strokeStyle="#65f7ff12";ctx.beginPath();ctx.moveTo((b.l+b.r)/2,b.t+20);ctx.lineTo((b.l+b.r)/2,b.b-115);ctx.stroke();

      for(const t of s.targets){ctx.shadowBlur=t.on?22:7;ctx.shadowColor=t.on?"#ffe66d":"#6875d555";ctx.fillStyle=t.on?"#ffe66d":"#26305f";ctx.beginPath();ctx.roundRect(t.x,t.y,t.w,t.h,5);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle=t.on?"#fff8bf":"#8d99c7";ctx.fillRect(t.x+4,t.y+3,t.w-8,2)}
      for(const x of [b.l+40,b.r-40]){ctx.strokeStyle="#65f7ff15";ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x,b.t+25);ctx.lineTo(x,b.b-95);ctx.stroke()}

      for(const q of s.bumpers){
        ctx.shadowBlur=15+q.p*30;ctx.shadowColor=q.col;const g=ctx.createRadialGradient(q.x-6,q.y-7,2,q.x,q.y,q.r*1.5);g.addColorStop(0,"#fff");g.addColorStop(.2,q.col);g.addColorStop(1,q.col+"15");ctx.fillStyle=g;ctx.beginPath();ctx.arc(q.x,q.y,q.r+q.p*6,0,7);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle="#ffffffaa";ctx.lineWidth=2;ctx.beginPath();ctx.arc(q.x,q.y,q.r-4,0,7);ctx.stroke()
      }
      for(const f of s.flippers){const e=ends(f);ctx.lineCap="round";ctx.lineWidth=17;const g=ctx.createLinearGradient(e.ax,e.ay,e.bx,e.by);g.addColorStop(0,f.side<0?"#65f7ff":"#ff57d8");g.addColorStop(.55,"#fff");g.addColorStop(1,f.side<0?"#448fff":"#a84eff");ctx.strokeStyle=g;ctx.shadowBlur=f.pressed?25:10;ctx.shadowColor=f.side<0?"#65f7ff":"#ff57d8";ctx.beginPath();ctx.moveTo(e.ax,e.ay);ctx.lineTo(e.bx,e.by);ctx.stroke();ctx.shadowBlur=0}
      const ball=s.ball as Ball;ctx.shadowBlur=20;ctx.shadowColor="#fff";const bg2=ctx.createRadialGradient(ball.x-3,ball.y-4,1,ball.x,ball.y,ball.r*1.8);bg2.addColorStop(0,"#fff");bg2.addColorStop(.45,"#eaf6ff");bg2.addColorStop(1,"#8bb5ff");ctx.fillStyle=bg2;ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,7);ctx.fill();ctx.shadowBlur=0;
      for(const p of s.p){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,7);ctx.fill()}ctx.globalAlpha=1;
      for(const p of s.pop){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.col;ctx.font="900 13px Inter,system-ui";ctx.textAlign="center";ctx.fillText(p.txt,p.x,p.y-(1-p.life)*28)}ctx.globalAlpha=1;ctx.restore();

      ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="900 30px Inter,system-ui";ctx.fillText(String(s.score),s.w/2,37);ctx.font="800 10px Inter,system-ui";ctx.fillStyle="#ffffff88";ctx.fillText("BEST "+s.best+"  •  BALLS "+s.lives+"  •  x"+Math.round(s.mult),s.w/2,54);
      if(s.comboT>0){ctx.font="900 12px Inter,system-ui";ctx.fillStyle=s.mult>=4?"#ffe66d":"#ffffffcc";ctx.fillText("COMBO "+s.combo+"  •  "+(s.mult>=4?"FEVER MODE":"KEEP IT HOT"),s.w/2,78)}
      if(!s.launched&&!s.over){ctx.fillStyle="#050712cc";ctx.beginPath();ctx.roundRect(s.w*.17,s.h*.31,s.w*.66,122,22);ctx.fill();ctx.strokeStyle="#ffffff18";ctx.stroke();ctx.fillStyle="#fff";ctx.font="900 28px Inter";ctx.fillText("NEON FLIPPER",s.w/2,s.h*.31+39);ctx.font="800 13px Inter";ctx.fillStyle="#ffffffcc";ctx.fillText("ESPACE / TAP = LANCER",s.w/2,s.h*.31+69);ctx.fillStyle="#65f7ff";ctx.fillText("← / Z  GAUCHE     DROITE  X / →",s.w/2,s.h*.31+94)}
      if(s.over){ctx.fillStyle="#02030bdf";ctx.fillRect(0,0,s.w,s.h);ctx.fillStyle="#fff";ctx.font="900 36px Inter";ctx.fillText("GAME OVER",s.w/2,s.h*.43);ctx.fillStyle="#ffe66d";ctx.font="800 16px Inter";ctx.fillText("SCORE "+s.score+"  •  BEST "+s.best,s.w/2,s.h*.49);ctx.fillStyle="#ffffff99";ctx.font="800 12px Inter";ctx.fillText("TAP / ESPACE POUR REJOUER",s.w/2,s.h*.56)}
      if(s.flash>0){ctx.globalAlpha=s.flash;ctx.fillStyle="#fff";ctx.fillRect(0,0,s.w,s.h);ctx.globalAlpha=1}
      ctx.restore();
    };

    const update=(dt:number)=>{
      const s=S.current;if(!s)return;s.t+=dt;s.shake=Math.max(0,s.shake-dt);s.flash=Math.max(0,s.flash-dt);s.comboT=Math.max(0,s.comboT-dt);
      for(const p of s.p){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;p.life-=dt}s.p=s.p.filter((p:any)=>p.life>0);
      for(const p of s.pop){p.y-=24*dt;p.life-=dt}s.pop=s.pop.filter((p:any)=>p.life>0);
      for(const q of s.bumpers)q.p=Math.max(0,q.p-dt*3);
      s.flippers[0].pressed=keys.l||touch.l;s.flippers[1].pressed=keys.r||touch.r;
      const rest=[-.52,Math.PI+.52],act=[.30,Math.PI-.30];
      s.flippers.forEach((f:any,i:number)=>{const target=f.pressed?act[i]:rest[i];f.angle+=(target-f.angle)*Math.min(1,dt*(f.pressed?17:10))});
      if(s.over)return;
      const b=s.b,ball=s.ball as Ball;
      if(!s.launched){ball.x=b.r-24;ball.y=b.b-34;ball.vx=0;ball.vy=0;return}
      ball.vy+=1120*dt;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
      if(ball.x-ball.r<b.l+12){ball.x=b.l+12+ball.r;ball.vx=Math.abs(ball.vx)*.98}
      if(ball.x+ball.r>b.r-12){ball.x=b.r-12-ball.r;ball.vx=-Math.abs(ball.vx)*.98}
      if(ball.y-ball.r<b.t+12){ball.y=b.t+12+ball.r;ball.vy=Math.abs(ball.vy)*.98}

      for(const t of s.targets)if(!t.on){const x=clamp(ball.x,t.x,t.x+t.w),y=clamp(ball.y,t.y,t.y+t.h);if((ball.x-x)**2+(ball.y-y)**2<(ball.r+5)**2){t.on=true;ball.vy=Math.abs(ball.vy)+45;addScore(s,t.value,t.x+t.w/2,t.y,"#ffe66d");if(s.targets.every((z:any)=>z.on)){s.targets.forEach((z:any)=>z.on=false);addScore(s,750,(b.l+b.r)/2,b.t+120,"#ff57d8");pop(s,"TARGET JACKPOT!",(b.l+b.r)/2,b.t+145,"#ff57d8");burst(s,(b.l+b.r)/2,b.t+145,"#ff57d8",34,260)}}}

      for(const q of s.bumpers){const dx=ball.x-q.x,dy=ball.y-q.y,d=Math.hypot(dx,dy),rr=ball.r+q.r;if(d<rr){const nx=d>.001?dx/d:0,ny=d>.001?dy/d:-1;ball.x=q.x+nx*rr;ball.y=q.y+ny*rr;const v=Math.min(880,Math.max(470,Math.hypot(ball.vx,ball.vy))+130);ball.vx=nx*v;ball.vy=ny*v;q.p=1;s.hit++;addScore(s,q.value,q.x,q.y,q.col)}}}
      for(const f of s.flippers)hitFlipper(s,f);
      if(s.hit>0&&s.hit%16===0){s.hit++;addScore(s,250,b.l+45,b.t+45,"#65f7ff");pop(s,"HYPER BOUNCE",b.l+80,b.t+70,"#65f7ff");}
      if(ball.y>b.b+32){s.lives--;s.combo=0;s.mult=Math.max(1,s.mult-1);if(s.lives<=0){s.over=true;saveBest(s.score);burst(s,b.r-70,b.b-45,"#ff57d8",45,260)}else{s.launched=false;s.ball={x:b.r-24,y:b.b-34,vx:0,vy:0,r:ball.r};s.flash=.24}}
    };

    const pd=(e:PointerEvent)=>{
      const q=c.getBoundingClientRect(),x=e.clientX-q.left,y=e.clientY-q.top,s=S.current;
      if(s.over){reset();return}
      if(!s.launched){launch(s);return}
      if(y>s.b.b-155){if(x<(s.b.l+s.b.r)/2)touch.l=true;else touch.r=true}
      else launch(s);
    };
    const pu=()=>{touch.l=false;touch.r=false};
    const kd=(e:KeyboardEvent)=>{
      if(e.code==="Space"){e.preventDefault();launch(S.current)}
      if(e.code==="ArrowLeft"||e.key==="z"||e.key==="Z"){e.preventDefault();keys.l=true}
      if(e.code==="ArrowRight"||e.key==="x"||e.key==="X"){e.preventDefault();keys.r=true}
    };
    const ku=(e:KeyboardEvent)=>{if(e.code==="ArrowLeft"||e.key==="z"||e.key==="Z")keys.l=false;if(e.code==="ArrowRight"||e.key==="x"||e.key==="X")keys.r=false};

    resize();reset();c.addEventListener("pointerdown",pd);window.addEventListener("pointerup",pu);window.addEventListener("keydown",kd);window.addEventListener("keyup",ku);window.addEventListener("resize",resize);
    const loop=(now:number)=>{const dt=Math.min(.032,(now-last)/1000);last=now;update(dt);draw();raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(raf);c.removeEventListener("pointerdown",pd);window.removeEventListener("pointerup",pu);window.removeEventListener("keydown",kd);window.removeEventListener("keyup",ku);window.removeEventListener("resize",resize)};
  },[color]);

  return <div className="arcade-shell"><canvas ref={canvas}/></div>;
}
