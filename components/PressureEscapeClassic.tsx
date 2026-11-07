"use client";

import { useEffect, useRef } from "react";

type Props = { color: string; onScore?: (n: number) => void };

type Phase =
  | "INTRO" | "TIMING" | "SHAPE" | "HOLD" | "NUMBER" | "CATS"
  | "SPIDER" | "WAIT" | "DOUBLE" | "DONT" | "RAT" | "END" | "FAIL";

type Shape = "STAR" | "SQUARE" | "TRIANGLE" | "CIRCLE";

const W = 390;
const H = 844;
const clamp = (n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));

export default function PressureEscapeClassic({color,onScore}:Props){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const onScoreRef=useRef(onScore);
  onScoreRef.current=onScore;

  useEffect(()=>{
    const c=canvasRef.current;
    if(!c)return;
    const ctx=c.getContext("2d");
    if(!ctx)return;

    let raf=0,last=performance.now(),dead=false;
    let dpr=1,scale=1,ox=0,oy=0;
    let audio:AudioContext|null=null;

    const s:any={
      t:0,phase:"INTRO" as Phase,phaseT:0,runScore:0,best:0,
      failures:0,presses:0,shape:null as Shape|null,shapeNeed:0,
      number:5,cats:0,catsShown:0,memoryVisible:true,
      flash:0,shake:0,msg:"",msgT:0,buttonDown:false,
      finished:false, round:0, lastChallenge:"", timer:3.2, targetPresses:0, waitPassed:false
    };

    try{s.best=Number(localStorage.getItem("sg-best-pressure"))||0}catch{}

    const sound=(freq:number,d=.07)=>{
      try{
        if(!audio)audio=new AudioContext();
        if(audio.state==="suspended")void audio.resume();
        const o=audio.createOscillator(),g=audio.createGain();
        o.type="sine";o.frequency.value=freq;
        g.gain.setValueAtTime(.0001,audio.currentTime);
        g.gain.exponentialRampToValueAtTime(.035,audio.currentTime+.01);
        g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+d);
        o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d+.01);
      }catch{}
    };

    const vibrate=(n:number|number[])=>{try{navigator.vibrate?.(n)}catch{}};

    const save=()=>{
      if(s.runScore>s.best){
        s.best=s.runScore;
        try{localStorage.setItem("sg-best-pressure",String(s.best))}catch{}
      }
    };

    const addScore=(n:number)=>{
      s.runScore+=n;
      onScoreRef.current?.(s.runScore);
    };

    const fail=(text:string)=>{
      s.phase="FAIL";s.phaseT=0;s.failures++;s.flash=.5;s.shake=.28;s.msg=text;s.msgT=1;
      save();sound(120,.14);vibrate([18,24,36]);
    };

    const challenges:Phase[]=["TIMING","SHAPE","HOLD","NUMBER","CATS","SPIDER","WAIT","DOUBLE","DONT"];
    const pickNext=()=>{
      const available=challenges.filter((p)=>p!==s.lastChallenge);
      const phase=available[Math.floor(Math.random()*available.length)];
      s.lastChallenge=phase;
      return phase;
    };

    const startRun=()=>{
      s.runScore=0;s.pressures=0;s.failures=0;s.phase="TIMING";s.phaseT=0;s.flash=0;s.shake=0;s.msg="";s.number=2+Math.floor(Math.random()*8);
      s.cats=0;s.catsShown=0;s.memoryVisible=true;s.finished=false;s.round=0;s.lastChallenge="TIMING";s.timer=2.8;
      sound(260,.06);vibrate(15);
    };

    const next=()=>{
      s.round++;
      if(s.round>=10){s.phase="RAT";s.phaseT=0;s.timer=3.4;s.buttonDown=false;return;}
      const phase=pickNext();
      s.phase=phase;s.phaseT=0;s.buttonDown=false;s.pressures=0;s.flash=0;s.msg="";s.msgT=0;
      s.timer=phase==="TIMING"||phase==="SPIDER"?2.4:phase==="HOLD"?1.8:phase==="WAIT"?2.8:phase==="DOUBLE"?1.8:phase==="DONT"?2.2:3.4;
      if(phase==="SHAPE"){
        const pool:Shape[]=["STAR","SQUARE","TRIANGLE"];
        s.shape=pool[Math.floor(Math.random()*pool.length)];
        s.shapeNeed=shapeData(s.shape).need;
      }
      if(phase==="NUMBER"){s.number=2+Math.floor(Math.random()*8);s.memoryVisible=true;}
      if(phase==="CATS"){s.cats=0;s.catsShown=0;}
      sound(320,.04);
    };

    const shapeData=(shape:Shape)=>{
      if(shape==="STAR")return{label:"★",need:10};
      if(shape==="SQUARE")return{label:"■",need:4};
      if(shape==="TRIANGLE")return{label:"▲",need:3};
      return{label:"●",need:0};
    };

    const hitTest=(x:number,y:number)=>{
      const bx=W/2,by=585,br=92;
      if(Math.hypot(x-bx,y-by)<=br)return "BUTTON";
      if(s.phase==="RAT"&&x>285&&y>490&&x<370&&y<585)return "RAT";
      return "NONE";
    };

    const action=(down:boolean,x?:number,y?:number)=>{
      const phase=s.phase as Phase;
      if(phase==="INTRO"){if(down)startRun();return;}
      if(phase==="FAIL"){if(down){startRun()}return;}
      if(phase==="END")return;

      if(phase==="RAT"){
        if(!down)return;
        if(hitTest(x??0,y??0)==="RAT"){addScore(700);next();save();sound(760,.2);vibrate(25);}
        return;
      }

      if(down){
        s.buttonDown=true;
        if(phase==="TIMING"){
          const p=clamp(s.phaseT/1.8,0,1);
          if(p>.52&&p<.74){addScore(120);s.flash=.18;next();return;}
          fail(p<.52?"TOO SOON":"TOO LATE");return;
        }
        if(phase==="SHAPE"){
          s.pressures++;
          if(s.pressures===s.shapeNeed){addScore(180);next();return;}
          if(s.pressures>s.shapeNeed)fail("TOO MANY");return;
        }
        if(phase==="DOUBLE"){
          s.pressures++;
          if(s.pressures===2){addScore(130);next();return;}
          if(s.pressures>2)fail("TOO MANY");
          return;
        }
        if(phase==="WAIT"){
          fail("TOO SOON");return;
        }
        if(phase==="DONT"){
          fail("DON'T PRESS");return;
        }
        if(phase==="HOLD"){return;}
        if(phase==="NUMBER"){
          addScore(160);next();return;
        }
        if(phase==="CATS"){
          const target=s.cats;
          s.pressures++;
          if(s.pressures===target){addScore(220);next();return;}
          if(s.pressures>target)fail("TOO MANY");return;
        }
        if(phase==="SPIDER"){
          const p=clamp(s.phaseT/s.timer,0,1);
          if(p>.5){addScore(240);next();return;}
          fail("TOO SOON");return;
        }
      }else{
        s.buttonDown=false;
        if(phase==="HOLD"){
          if(s.phaseT>1.05&&s.phaseT<1.45){addScore(180);next();}
          else fail(s.phaseT<1.05?"LET GO TOO SOON":"HOLD TOO LONG");
        }
      }
    };

    const resize=()=>{
      const r=c.getBoundingClientRect();
      dpr=Math.min(window.devicePixelRatio||1,2);
      const w=Math.max(1,r.width),h=Math.max(1,r.height);
      scale=Math.min(w/W,h/H);
      ox=(w-W*scale)/2;
      oy=(h-H*scale)/2;
      c.width=Math.floor(w*dpr);
      c.height=Math.floor(h*dpr);
      ctx.setTransform(dpr*scale,0,0,dpr*scale,ox*dpr,oy*dpr);
    };

    const update=(dt:number)=>{
      s.t+=dt;s.phaseT+=dt;s.flash=Math.max(0,s.flash-dt);s.shake=Math.max(0,s.shake-dt);s.msgT=Math.max(0,s.msgT-dt);

      if(["TIMING","SPIDER","WAIT","DOUBLE","DONT","HOLD"].includes(s.phase) && s.phaseT>s.timer){
        if(s.phase==="WAIT"||s.phase==="DONT"){addScore(110);next();}
        else fail("TOO LATE");
      }
      s.timer=Math.max(0,s.timer);
      if(s.phase==="SHAPE"&&s.phaseT<.5&&s.shape===null){
        const pool:Shape[]=["STAR","SQUARE","TRIANGLE","CIRCLE"];
        s.shape=pool[Math.floor(Math.random()*pool.length)];
        s.shapeNeed=shapeData(s.shape).need;
      }
      if(s.phase==="SHAPE"&&s.phaseT>3.4)fail("TOO SLOW");

      if(s.phase==="HOLD"&&s.phaseT>1.8&&!s.buttonDown)fail("LET GO TOO SOON");


      if(s.phase==="CATS"){
        const total=3+((s.round*7)%4);
        if(s.catsShown<total&&s.phaseT>(s.catsShown+1)*.28){s.catsShown++;s.cats++}
        if(s.catsShown>=total&&s.phaseT>total*.28+.7){s.msg="NOW PRESS ONCE FOR EACH CAT";s.msgT=.8}
      }

      if(s.phase==="NUMBER"&&s.phaseT>1.15)s.memoryVisible=false;
      if(s.phase==="CATS"&&s.catsShown>=3 && s.phaseT>3.4)fail("TOO SLOW");
    };

    const rr=(x:number,y:number,w:number,h:number,r:number,fill:string)=>{
      ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
    };

    const drawShape=(shape:Shape|null)=>{
      if(!shape)return;
      const cx=W/2,cy=430;
      ctx.save();ctx.translate(cx,cy);
      ctx.strokeStyle="#63f6b5";ctx.fillStyle="#63f6b5";ctx.lineWidth=8;
      if(shape==="STAR"){
        ctx.beginPath();
        for(let i=0;i<10;i++){
          const a=-Math.PI/2+i*Math.PI/5;
          const r=i%2?64:135;
          const x=Math.cos(a)*r,y=Math.sin(a)*r;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }
        ctx.closePath();ctx.stroke();
      }else if(shape==="SQUARE"){
        ctx.strokeRect(-105,-105,210,210);
      }else if(shape==="TRIANGLE"){
        ctx.beginPath();ctx.moveTo(0,-120);ctx.lineTo(115,90);ctx.lineTo(-115,90);ctx.closePath();ctx.stroke();
      }else{
        ctx.beginPath();ctx.arc(0,0,110,0,Math.PI*2);ctx.stroke();
      }
      ctx.restore();
    };

    const drawTimerRing=()=>{
      if(["INTRO","FAIL","END"].includes(s.phase as string))return;
      const cx=W/2,cy=585,r=112;
      const total=Math.max(.1,s.phase==="HOLD"?1.8:s.timer);
      const p=clamp(s.phaseT/total,0,1);
      ctx.save();
      ctx.lineWidth=9;
      ctx.lineCap="round";
      ctx.strokeStyle="#ffffff12";
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle=p>.82?"#ff637f":"#63f6b5";
      ctx.shadowBlur=16;ctx.shadowColor=p>.82?"#ff637f":"#63f6b5";
      ctx.beginPath();ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-p));ctx.stroke();
      ctx.shadowBlur=0;
      ctx.fillStyle="#ffffff75";ctx.font="900 10px Inter,system-ui";ctx.textAlign="center";
      ctx.fillText((total-s.phaseT).toFixed(1)+"s",cx,cy-r-13);
      ctx.restore();
    };

    const drawButton=(label:string)=>{
      const cx=W/2,cy=585,r=92;
      const g=ctx.createRadialGradient(cx-r*.35,cy-r*.4,4,cx,cy,r*1.1);
      g.addColorStop(0,s.buttonDown?"#ffffff":"#eafff7");g.addColorStop(.22,"#58e7af");g.addColorStop(.78,"#0b825b");g.addColorStop(1,"#043d2c");
      ctx.shadowBlur=30;ctx.shadowColor="#63f6b5";
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      ctx.strokeStyle="#ffffff58";ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,r-7,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="950 28px Inter,system-ui";ctx.fillText(label,cx,cy+9);
      ctx.fillStyle="#ffffff55";ctx.font="800 9px Inter,system-ui";ctx.fillText("ONE BUTTON",cx,cy+r+24);
    };

    const draw=()=>{
      const shake=s.shake?(Math.random()-.5)*8:0;
      ctx.save();ctx.translate(shake,shake);
      ctx.fillStyle="#05080e";ctx.fillRect(-10,-10,W+20,H+20);

      const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,"#071426");sky.addColorStop(.56,"#0b1728");sky.addColorStop(1,"#02050a");
      ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);

      for(let i=0;i<14;i++){ctx.fillStyle=i%2?"#63f6b50a":"#ffffff08";ctx.fillRect((i*37)%W,120+((i*71)%600),1,1)}

      ctx.textAlign="center";ctx.fillStyle="#e9fff7";ctx.font="950 12px Inter,system-ui";ctx.fillText("PRESSING UNDER PRESSURE",W/2,33);
      ctx.fillStyle="#ffffff46";ctx.font="800 8px Inter,system-ui";ctx.fillText("ONE BUTTON • READ EVERYTHING",W/2,49);

      rr(20,68,350,66,18,"#03070ddf");
      ctx.fillStyle="#fff";ctx.font="900 23px Inter,system-ui";ctx.fillText(String(s.runScore),112,99);
      ctx.fillStyle="#ffffff4f";ctx.font="800 8px Inter,system-ui";ctx.fillText("SCORE",112,118);
      ctx.fillStyle="#63f6b5";ctx.font="900 23px Inter,system-ui";ctx.fillText(String(s.best),278,99);
      ctx.fillStyle="#ffffff4f";ctx.font="800 8px Inter,system-ui";ctx.fillText("BEST",278,118);

      if(s.phase==="INTRO"){
        ctx.fillStyle="#fff";ctx.font="950 36px Inter,system-ui";ctx.fillText("READ. THINK. PRESS.",W/2,287);
        ctx.fillStyle="#63f6b5";ctx.font="850 13px Inter,system-ui";ctx.fillText("Le bouton n'est pas toujours la bonne réponse.",W/2,318);
        ctx.fillStyle="#ffffff7a";ctx.font="700 11px Inter,system-ui";ctx.fillText("Chaque erreur remet ton run à zéro.",W/2,345);
        drawButton("START");
      }else if(s.phase==="TIMING"){
        ctx.fillStyle="#fff";ctx.font="950 31px Inter,system-ui";ctx.fillText("PRESS AFTER HALF-TIME",W/2,245);
        ctx.fillStyle="#ffffff82";ctx.font="700 11px Inter,system-ui";ctx.fillText("Attends le bon moment.",W/2,274);
        const bx=40,bw=310,p=clamp(s.phaseT/1.8,0,1);
        rr(bx,335,bw,12,6,"#ffffff10");
        ctx.fillStyle="#63f6b5";ctx.fillRect(bx+bw*.5,330,bw*.22,22);
        ctx.fillStyle="#ffffff";ctx.fillRect(bx+bw*p-2,326,4,30);
        drawButton("PRESS");
      }else if(s.phase==="SHAPE"){
        ctx.fillStyle="#fff";ctx.font="950 29px Inter,system-ui";ctx.fillText("COUNT THE CORNERS",W/2,235);
        ctx.fillStyle="#ffffff82";ctx.font="700 11px Inter,system-ui";ctx.fillText("Appuie autant de fois qu'il y a de coins.",W/2,264);
        drawShape(s.shape);drawButton(String(s.pressures));
      }else if(s.phase==="HOLD"){
        ctx.fillStyle="#fff";ctx.font="950 31px Inter,system-ui";ctx.fillText("HOLD",W/2,245);
        ctx.fillStyle="#ffffff82";ctx.font="700 11px Inter,system-ui";ctx.fillText("Maintiens. Relâche au bon moment.",W/2,274);
        const p=clamp(s.phaseT/1.8,0,1);
        rr(55,335,280,10,5,"#ffffff10");ctx.fillStyle="#63f6b5";ctx.fillRect(55,335,280*.75,10);ctx.fillStyle="#fff";ctx.fillRect(55+280*p-2,330,4,20);
        drawButton(s.buttonDown?"HOLDING":"PRESS");
      }else if(s.phase==="NUMBER"){
        ctx.fillStyle="#fff";ctx.font="950 28px Inter,system-ui";ctx.fillText("REMEMBER THIS",W/2,240);
        ctx.fillStyle=s.memoryVisible?"#63f6b5":"#ffffff20";ctx.font="950 86px Inter,system-ui";ctx.fillText(s.memoryVisible?String(s.number):"?",W/2,430);
        ctx.fillStyle="#ffffff70";ctx.font="700 11px Inter,system-ui";ctx.fillText(s.memoryVisible?"MÉMORISE LE NOMBRE":"PLUS TARD, ON VERRA SI TU T'EN SOUVIENS",W/2,474);
        drawButton("OK");
      }else if(s.phase==="CATS"){
        ctx.fillStyle="#fff";ctx.font="950 28px Inter,system-ui";ctx.fillText("MEMORY",W/2,235);
        ctx.fillStyle="#ffffff82";ctx.font="700 11px Inter,system-ui";ctx.fillText("Regarde bien les chats.",W/2,264);
        for(let i=0;i<s.catsShown;i++){ctx.font="46px system-ui";ctx.fillText("🐱",70+i*80,385)}
        if(s.catsShown>=4){ctx.fillStyle="#63f6b5";ctx.font="850 13px Inter,system-ui";ctx.fillText("UN APPUI POUR CHAQUE CHAT",W/2,450)}
        drawButton(String(s.pressures));
      }else if(s.phase==="WAIT"){
        ctx.fillStyle="#fff";ctx.font="950 29px Inter,system-ui";ctx.fillText("WAIT.",W/2,235);
        ctx.fillStyle="#ffffff82";ctx.font="700 11px Inter,system-ui";ctx.fillText("Ne touche à rien. Attends la fin du timer.",W/2,264);
        ctx.fillStyle="#63f6b5";ctx.font="900 14px Inter,system-ui";ctx.fillText("DO NOTHING",W/2,390);
        drawButton("WAIT");
      }else if(s.phase==="DOUBLE"){
        ctx.fillStyle="#fff";ctx.font="950 29px Inter,system-ui";ctx.fillText("PRESS IT TWICE",W/2,235);
        ctx.fillStyle="#ffffff82";ctx.font="700 11px Inter,system-ui";ctx.fillText("Deux pressions. Pas une de plus.",W/2,264);
        drawButton(String(s.pressures));
      }else if(s.phase==="DONT"){
        ctx.fillStyle="#fff";ctx.font="950 28px Inter,system-ui";ctx.fillText("DO NOT PRESS",W/2,235);
        ctx.fillStyle="#ffffff82";ctx.font="700 11px Inter,system-ui";ctx.fillText("Le bouton est là pour te faire réagir.",W/2,264);
        ctx.fillStyle="#ff637f";ctx.font="950 15px Inter,system-ui";ctx.fillText("DON'T TOUCH IT.",W/2,390);
        drawButton("NO");
      }else if(s.phase==="SPIDER"){
        ctx.fillStyle="#fff";ctx.font="950 28px Inter,system-ui";ctx.fillText("PRESS AFTER HALF-TIME",W/2,230);
        ctx.fillStyle="#ffffff82";ctx.font="700 11px Inter,system-ui";ctx.fillText("Ne te laisse pas distraire.",W/2,258);
        ctx.font="68px system-ui";ctx.fillText("🕷️",W/2,370);
        const p=clamp(s.phaseT/2,0,1);rr(55,415,280,10,5,"#ffffff10");ctx.fillStyle="#63f6b5";ctx.fillRect(55+140,411,56,18);ctx.fillStyle="#fff";ctx.fillRect(55+280*p-2,406,4,28);
        drawButton("PRESS");
      }else if(s.phase==="RAT"){
        ctx.fillStyle="#fff";ctx.font="950 28px Inter,system-ui";ctx.fillText("DO NOT PRESS THE BUTTON",W/2,225);
        ctx.fillStyle="#ffffff82";ctx.font="700 11px Inter,system-ui";ctx.fillText("Trouve ce qu'il faut vraiment presser.",W/2,254);
        ctx.font="64px system-ui";ctx.fillText("🐭",328,540);
        ctx.fillStyle="#63f6b5";ctx.font="850 11px Inter,system-ui";ctx.fillText("PRESSE LA SOURIS",W/2,455);
        drawButton("NO");
      }else if(s.phase==="FAIL"){
        ctx.fillStyle="#ff5f7a";ctx.font="950 44px Inter,system-ui";ctx.fillText("RUN FAILED",W/2,320);
        ctx.fillStyle="#fff";ctx.font="900 19px Inter,system-ui";ctx.fillText(String(s.runScore),W/2,364);
        ctx.fillStyle="#ffffff70";ctx.font="800 10px Inter,system-ui";ctx.fillText(s.msg,W/2,392);
        ctx.fillStyle="#63f6b5";ctx.font="900 13px Inter,system-ui";ctx.fillText("TAPE POUR RECOMMENCER",W/2,470);
        drawButton("RETRY");
      }else{
        ctx.fillStyle="#63f6b5";ctx.font="950 44px Inter,system-ui";ctx.fillText("THE END",W/2,315);
        ctx.fillStyle="#fff";ctx.font="900 18px Inter,system-ui";ctx.fillText("TU AS SURVÉCU.",W/2,355);
        ctx.fillStyle="#ffffff68";ctx.font="800 10px Inter,system-ui";ctx.fillText("VERSION SCROLL GAME",W/2,382);
        ctx.fillStyle="#fff";ctx.font="900 18px Inter,system-ui";ctx.fillText("SCORE  "+s.runScore,W/2,435);
        ctx.fillStyle="#63f6b5";ctx.font="900 12px Inter,system-ui";ctx.fillText("TAPE POUR REJOUER",W/2,505);
        drawButton("PLAY");
      }

      drawTimerRing();
      if(s.msgT>0&&s.phase!=="FAIL"){ctx.globalAlpha=Math.min(1,s.msgT);ctx.fillStyle="#63f6b5";ctx.font="950 18px Inter,system-ui";ctx.fillText(s.msg,W/2,525);ctx.globalAlpha=1}
      if(s.flash>0){ctx.globalAlpha=s.flash*.38;ctx.fillStyle=s.phase==="FAIL"?"#ff5f7a":"#63f6b5";ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}

      ctx.fillStyle="#ffffff35";ctx.font="800 8px Inter,system-ui";ctx.fillText("ONE-BUTTON PUZZLE • MOBILE READY",W/2,808);
      ctx.restore();
    };

    const pointerDown=(e:PointerEvent)=>{
      e.preventDefault();
      const r=c.getBoundingClientRect();
      const x=(e.clientX-r.left-ox)/scale,y=(e.clientY-r.top-oy)/scale;
      const target=hitTest(x,y);
      if(target==="BUTTON")action(true,x,y);
      else if(s.phase==="RAT")action(true,x,y);
    };
    const pointerUp=(e:PointerEvent)=>{
      e.preventDefault();
      action(false,0,0);
    };
    const keyDown=(e:KeyboardEvent)=>{
      if(e.code==="Space"||e.code==="Enter"){e.preventDefault();action(true,W/2,585)}
    };
    const keyUp=(e:KeyboardEvent)=>{
      if(e.code==="Space"||e.code==="Enter"){e.preventDefault();action(false,W/2,585)}
    };

    resize();
    window.addEventListener("resize",resize);
    c.addEventListener("pointerdown",pointerDown);
    c.addEventListener("pointerup",pointerUp);
    c.addEventListener("pointercancel",pointerUp);
    window.addEventListener("keydown",keyDown);
    window.addEventListener("keyup",keyUp);

    raf=requestAnimationFrame(function loop(now){
      if(dead)return;
      const dt=Math.min(.033,(now-last)/1000);last=now;
      update(dt);draw();raf=requestAnimationFrame(loop);
    });

    return()=>{
      dead=true;cancelAnimationFrame(raf);window.removeEventListener("resize",resize);
      c.removeEventListener("pointerdown",pointerDown);c.removeEventListener("pointerup",pointerUp);c.removeEventListener("pointercancel",pointerUp);
      window.removeEventListener("keydown",keyDown);window.removeEventListener("keyup",keyUp);try{audio?.close()}catch{}
    };
  },[color]);

  return <div style={{position:"absolute",inset:0,width:"100%",height:"100%",overflow:"hidden",background:"#05080e"}}>
    <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",display:"block",touchAction:"none"}} aria-label="Pressing Under Pressure"/>
  </div>;
}
