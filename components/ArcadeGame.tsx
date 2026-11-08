"use client";
import { useEffect,useRef } from "react";
type Props={id:string;color:string;onScore:(n:number)=>void};
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const rnd=(a:number,b:number)=>a+Math.random()*(b-a);
const shuffle=<T,>(a:T[])=>[...a].sort(()=>Math.random()-.5);
export default function ArcadeGame({id,color,onScore}:Props){
 const canvas=useRef<HTMLCanvasElement>(null);const S=useRef<any>({});const touch=useRef<{x:number;y:number;hold?:boolean}|null>(null);const alive=useRef(true);const best=useRef(0);const onScoreRef=useRef(onScore);
 useEffect(()=>{onScoreRef.current=onScore},[onScore]);
 useEffect(()=>{const c=canvas.current;if(!c)return;const ctx=c.getContext("2d");if(!ctx)return;let raf=0,last=performance.now();
  let dpr=1;
  const resizeCanvas=()=>{const rect=c.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,2);const w=Math.max(1,Math.floor(rect.width));const h=Math.max(1,Math.floor(rect.height));c.width=Math.floor(w*dpr);c.height=Math.floor(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);const current=S.current;if(current?.w){current.w=w;current.h=h;if(id==="illegal-runner"){current.ground=current.h*.76;current.y=Math.min(current.y,current.ground)}if(id==="flappy-bird"){current.ground=current.h*.88;current.bird.x=current.w*.34;current.bird.y=Math.min(current.bird.y,current.ground-current.bird.r)}}};
  resizeCanvas();
  window.addEventListener("resize",resizeCanvas);
  try{best.current=Number(localStorage.getItem("sg-best-"+id))||0}catch{best.current=0}
 const saveBest=(s:any)=>{if(s.score>best.current){best.current=s.score;try{localStorage.setItem("sg-best-"+id,String(s.score))}catch{}}};
 const pts=(s:any,x:number,y:number,col:string,n=14)=>{for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=rnd(40,220);s.p.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.5,max:.5,size:rnd(2,5),col})}};
 const setScore=(s:any,n:number)=>{const next=Math.max(0,Math.floor(n));if(s.score===next)return;s.score=next;saveBest(s);onScoreRef.current(s.score)};
 const end=(s:any)=>{alive.current=false;s.over=true;s.shake=.25;saveBest(s)};
 const spawn2048=(s:any)=>{const e=s.board.map((v:number,i:number)=>v? -1:i).filter((i:number)=>i>=0);if(e.length)s.board[e[Math.floor(Math.random()*e.length)]]=Math.random()<.9?2:4};
 const move2048=(s:any,d:number)=>{const before=s.board.slice(),b=Array(16).fill(0);let gain=0,changed=false;
  for(let l=0;l<4;l++){const idx=d===0?[0,1,2,3].map(r=>r*4+l):d===1?[0,1,2,3].map(x=>l*4+x):d===2?[3,2,1,0].map(r=>r*4+l):[3,2,1,0].map(x=>l*4+x);const a=idx.map(i=>s.board[i]).filter(Boolean) as number[],o:number[]=[];
   for(let i=0;i<a.length;i++){if(a[i]===a[i+1]){o.push(a[i]*2);gain+=a[i]*2;i++}else o.push(a[i])}while(o.length<4)o.push(0);idx.forEach((i,j)=>b[i]=o[j])}
  for(let i=0;i<16;i++)if(b[i]!==before[i])changed=true;if(!changed)return;s.history.push({board:before.slice(),score:s.score,moves:s.moves,combo:s.combo,won:s.won});s.history=s.history.slice(-3);s.board=b;s.moves++;setScore(s,s.score+gain+(gain&&s.combo?20*s.combo:0));s.combo=gain?s.combo+1:0;if(gain)pts(s,s.w/2,s.h/2,"#fbbf24",20);spawn2048(s);
  if(b.some((v:number)=>v>=2048)&&!s.won){s.won=true;setScore(s,s.score+1000);pts(s,s.w/2,s.h/2,"#fff",40)}
  const ok=b.some((v:number)=>v===0)||b.some((v:number,i:number)=>(i%4<3&&v===b[i+1])||(i<12&&v===b[i+4]));if(!ok)end(s);
 };
 const undo2048=(s:any)=>{const h=s.history.pop();if(!h)return;s.board=h.board.slice();s.score=h.score;s.moves=h.moves;s.combo=h.combo;s.won=h.won;alive.current=true;s.over=false;s.shake=0;};
 const pieces=[[[0,1],[1,1],[2,1],[3,1]],[[0,0],[1,0],[0,1],[1,1]],[[1,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[0,1],[1,1]],[[0,0],[1,0],[1,1],[2,1]],[[0,0],[0,1],[1,1],[2,1]],[[2,0],[0,1],[1,1],[2,1]]];
 const coll=(s:any,x:number,y:number,cells:any[])=>cells.some((p:any)=>x+p[0]<0||x+p[0]>=10||y+p[1]>=20||(y+p[1]>=0&&s.board[(y+p[1])*10+x+p[0]]));
 const spawnT=(s:any)=>{if(!s.bag.length)s.bag=shuffle([0,1,2,3,4,5,6]);const t=s.bag.pop();s.piece={type:t,x:3,y:0,cells:pieces[t]};s.canHold=true;s.lock=0;if(coll(s,s.piece.x,s.piece.y,s.piece.cells))end(s)};
 const rotateT=(s:any)=>{if(!s.piece)return;const r=s.piece.cells.map((p:any)=>[-p[1],p[0]]);for(const q of [[0,0],[-1,0],[1,0],[0,-1]])if(!coll(s,s.piece.x+q[0],s.piece.y+q[1],r)){s.piece.x+=q[0];s.piece.y+=q[1];s.piece.cells=r;return}};
 const holdT=(s:any)=>{if(!s.piece||!s.canHold)return;const current=s.piece.type;if(s.hold===null){s.hold=current;s.piece=null;spawnT(s)}else{const swap=s.hold;s.hold=current;s.piece={type:swap,x:3,y:0,cells:pieces[swap]};s.lock=0;if(coll(s,s.piece.x,s.piece.y,s.piece.cells))end(s)}s.canHold=false;};
 const lockT=(s:any)=>{for(const p of s.piece.cells){const x=s.piece.x+p[0],y=s.piece.y+p[1];if(y>=0)s.board[y*10+x]=s.piece.type+1}let n=0;for(let y=19;y>=0;y--)if(s.board.slice(y*10,y*10+10).every(Boolean)){s.board.splice(y*10,10);s.board.unshift(...Array(10).fill(0));n++;y++}if(n){s.lines+=n;s.combo++;setScore(s,s.score+[0,100,300,500,800][n]*s.level+s.combo*25);pts(s,s.w/2,100,"#c4b5fd",n*12)}else s.combo=0;s.level=1+Math.floor(s.lines/10);s.piece=null;s.lock=0};
 const makeBricks=(s:any)=>{s.bricks=[];const rows=Math.min(9,5+s.level);for(let r=0;r<rows;r++)for(let x=0;x<8;x++){const active=s.level%3===1||((x+r)%2===0)||r===0;s.bricks.push({r,x,on:active,hp:r<2&&s.level>2?2:1})}};
 const flapFB=(s:any)=>{if(!s.bird)return;if(!s.started){s.started=true;s.startT=s.t}s.bird.vy=-455;s.bird.rot=-.42;s.flapT=.16;pts(s,s.bird.x-10,s.bird.y+4,"#fff7c2",6)};
 const init=()=>{const rect=c.getBoundingClientRect();const s:any={w:Math.max(1,Math.floor(rect.width)),h:Math.max(1,Math.floor(rect.height)),score:0,t:0,p:[],shake:0,over:false};
  if(id==="illegal-runner"){s.lane=1;s.y=s.h*.76;s.ground=s.h*.76;s.vy=0;s.speed=300;s.dist=0;s.coins=0;s.dash=1;s.dashT=0;s.inv=0;s.spawn=.55;s.obs=[];s.coinsArr=[];s.scroll=0}
  if(id==="tetris"){s.board=Array(200).fill(0);s.bag=[];s.piece=null;s.hold=null;s.canHold=true;s.next=[];s.drop=0;s.lock=0;s.lines=0;s.level=1;s.combo=0}
  if(id==="2048"){s.board=Array(16).fill(0);s.history=[];s.moves=0;s.combo=0;s.won=false;spawn2048(s);spawn2048(s)}
  if(id==="snake"){s.cols=20;s.rows=20;s.snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10},{x:7,y:10}];s.dir={x:1,y:0};s.queue=[];s.move=0;s.combo=0;s.level=1;s.food=null;s.special=null;s.obstacles=[];placeFood(s)}
  if(id==="breakout"){s.level=1;s.lives=3;s.paddle=s.w*.5;s.ball={x:s.w*.5,y:s.h*.72,vx:210,vy:-300,stuck:true};s.bricks=[];s.power=[];s.mult=1;s.wide=0;makeBricks(s)}
  if(id==="flappy-bird"){s.ground=s.h*.88;s.started=false;s.bird={x:s.w*.34,y:s.h*.44,vy:0,r:18,rot:0,flap:0};s.pipes=[];s.pipeT=.8;s.speed=205;s.gap=192;s.combo=0;s.flash=0;s.milestone=0;s.streak=0}
  S.current=s;alive.current=true;setScore(s,0)
 };
 const cellUsed=(s:any,x:number,y:number)=>s.snake.some((q:any)=>q.x===x&&q.y===y)||s.obstacles.some((q:any)=>q.x===x&&q.y===y)||(s.special&&s.special.x===x&&s.special.y===y);
 const randomFreeCell=(s:any)=>{const cells:any[]=[];for(let y=0;y<s.rows;y++)for(let x=0;x<s.cols;x++)if(!cellUsed(s,x,y)&&!(s.food&&s.food.x===x&&s.food.y===y))cells.push({x,y});return cells.length?cells[Math.floor(Math.random()*cells.length)]:null};
 const placeFood=(s:any)=>{s.food=randomFreeCell(s);return Boolean(s.food)};
 const placeSpecial=(s:any)=>{const cell=randomFreeCell(s);if(cell)s.special={...cell,life:7}};
 const placeObstacle=(s:any)=>{const cell=randomFreeCell(s);if(cell)s.obstacles.push(cell)}
 const left=(s:any)=>s.w*.08,right=(s:any)=>s.w*.92,paddleHalf=(s:any)=>s.wide>0?75:48;
 const draw=()=>{const s=S.current;if(!s.w)return;ctx.save();if(s.shake>0)ctx.translate(rnd(-4,4),rnd(-4,4));
  const bg=ctx.createLinearGradient(0,0,s.w,s.h);bg.addColorStop(0,color+"44");bg.addColorStop(.45,"#080b18");bg.addColorStop(1,"#020308");ctx.fillStyle=bg;ctx.fillRect(0,0,s.w,s.h);
  for(let i=0;i<22;i++){ctx.fillStyle="#fff1";ctx.beginPath();ctx.arc((i*97+s.t*18)%s.w,(i*53)%s.h,1.4,0,7);ctx.fill()}
  const hud=(a:string,b:string)=>{ctx.fillStyle="#fff";ctx.font="900 13px Inter,system-ui";ctx.textAlign="left";ctx.fillText(a,18,30);ctx.textAlign="right";ctx.fillStyle="#ffffff99";ctx.fillText(b,s.w-18,30);ctx.textAlign="center"};
  if(id==="illegal-runner"){
   const h=s.h*.43;ctx.fillStyle="#050817";ctx.fillRect(0,h,s.w,s.h-h);ctx.strokeStyle="#00e5ff22";
   const lw=Math.min(150,s.w*.22),ox=s.w/2-lw*1.5;
   for(let i=0;i<9;i++){const y=h+Math.pow(i/8,1.7)*(s.h-h);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(s.w,y);ctx.stroke()}for(let lane=0;lane<3;lane++){const x=ox+(lane+.5)*lw;ctx.strokeStyle="#00e5ff18";ctx.beginPath();ctx.moveTo(x,s.ground);ctx.lineTo(x,h);ctx.stroke()}ctx.fillStyle="#07111f";ctx.fillRect(0,h,s.w,s.h-h);ctx.fillStyle="#0b2035";ctx.fillRect(0,s.ground,s.w,s.h-s.ground);
   for(const o of s.obs){const x=ox+(o.lane+.5)*lw;ctx.fillStyle=o.kind==="wall"?"#ff375f":"#ff7a3d";ctx.shadowBlur=18;ctx.shadowColor=ctx.fillStyle;ctx.fillRect(x-lw*.32,o.y-28,lw*.64,28);ctx.shadowBlur=0}
   for(const q of s.coinsArr){if(q.got)continue;const x=ox+(q.lane+.5)*lw;ctx.fillStyle="#ffd166";ctx.shadowBlur=14;ctx.shadowColor="#ffd166";ctx.beginPath();ctx.arc(x,q.y,8,0,7);ctx.fill();ctx.shadowBlur=0}
   const px=ox+(s.lane+.5)*lw;ctx.fillStyle="#00e5ff";ctx.shadowBlur=24;ctx.shadowColor="#00e5ff";ctx.beginPath();ctx.roundRect(px-16,s.y-42,32,42,8);ctx.fill();ctx.fillStyle="#ff37c7";ctx.beginPath();ctx.roundRect(px-10,s.y-60,20,18,6);ctx.fill();ctx.fillStyle="#fff";ctx.fillRect(px-7,s.y-53,4,4);ctx.fillRect(px+3,s.y-53,4,4);ctx.shadowBlur=0;ctx.fillStyle="#00e5ff";ctx.fillRect(0,s.ground,s.w,2);
   hud("DIST "+Math.floor(s.dist)+"m  •  🪙 "+s.coins,"BEST "+best.current+"  •  ⚡ "+(s.dash?"READY":"CHARGING"));
  }
  if(id==="tetris"){
   const cw=Math.min(31,(s.h-145)/20,(s.w-90)/10),ox=(s.w-cw*10)/2,oy=58;ctx.fillStyle="#050713";ctx.fillRect(ox-7,oy-7,cw*10+14,cw*20+14);
   const cs=["#00e5ff","#facc15","#a78bfa","#34d399","#fb7185","#60a5fa","#f97316"];
   for(let i=0;i<200;i++){ctx.fillStyle=s.board[i]?cs[(s.board[i]-1)%7]+"dd":"#ffffff08";ctx.fillRect(ox+(i%10)*cw+1,oy+Math.floor(i/10)*cw+1,cw-2,cw-2)}
   if(s.piece){let gy=s.piece.y;while(!coll(s,s.piece.x,gy+1,s.piece.cells))gy++;for(const p of s.piece.cells){ctx.strokeStyle="#fff3";ctx.strokeRect(ox+(s.piece.x+p[0])*cw+3,oy+(gy+p[1])*cw+3,cw-6,cw-6);ctx.fillStyle=cs[s.piece.type];ctx.fillRect(ox+(s.piece.x+p[0])*cw+1,oy+(s.piece.y+p[1])*cw+1,cw-2,cw-2)}}
   hud("LINES "+s.lines+"  •  LV "+s.level,"BEST "+best.current);ctx.fillStyle="#fff8";ctx.font="700 11px Inter";ctx.fillText("SWIPE • TAP ROTATE • SPACE DROP • C / TAP HOLD",s.w/2,s.h-20);
  }
  if(id==="2048"){
   const z=Math.min(390,s.w*.82,s.h*.62),gap=8,cell=(z-gap*3)/4,ox=(s.w-z)/2,oy=(s.h-z)/2+14,map:any={2:"#eee4da",4:"#ede0c8",8:"#f2b179",16:"#f59563",32:"#f67c5f",64:"#f65e3b",128:"#edcf72",256:"#edcc61",512:"#edc850",1024:"#edc53f",2048:"#edc22e"};
   s.board.forEach((v:number,i:number)=>{const x=ox+(i%4)*(cell+gap),y=oy+Math.floor(i/4)*(cell+gap);ctx.fillStyle=v?(map[v]||"#3c3a32"):"#ffffff10";ctx.beginPath();ctx.roundRect(x,y,cell,cell,14);ctx.fill();if(v){ctx.fillStyle=v<=4?"#776e65":"#fff";ctx.font="900 "+(v>999?21:v>99?26:32)+"px Inter";ctx.fillText(String(v),x+cell/2,y+cell/2+10)}});
   hud("SCORE "+s.score+"  •  MOVES "+s.moves,"BEST "+best.current+(s.won?"  •  2048!":""));ctx.fillStyle="#fff8";ctx.font="700 11px Inter";ctx.fillText("SWIPE TO MERGE • DOUBLE TAP = UNDO",s.w/2,s.h-20);
  }
  if(id==="snake"){
   const z=Math.min(s.w*.82,s.h*.66),cell=z/s.cols,ox=(s.w-z)/2,oy=(s.h-z)/2+18;ctx.fillStyle="#04120f";ctx.fillRect(ox,oy,z,z);ctx.strokeStyle="#ffffff08";
   for(let i=0;i<=20;i++){ctx.beginPath();ctx.moveTo(ox+i*cell,oy);ctx.lineTo(ox+i*cell,oy+z);ctx.stroke();ctx.beginPath();ctx.moveTo(ox,oy+i*cell);ctx.lineTo(ox+z,oy+i*cell);ctx.stroke()}
   s.obstacles.forEach((q:any)=>{ctx.fillStyle="#ef444466";ctx.fillRect(ox+q.x*cell+2,oy+q.y*cell+2,cell-4,cell-4)});
   if(s.food){ctx.fillStyle="#34d399";ctx.shadowBlur=18;ctx.shadowColor="#34d399";ctx.beginPath();ctx.arc(ox+(s.food.x+.5)*cell,oy+(s.food.y+.5)*cell,cell*.31,0,7);ctx.fill();ctx.shadowBlur=0}
   s.snake.forEach((q:any,i:number)=>{ctx.fillStyle=i?"#10b981":"#a7f3d0";ctx.beginPath();ctx.roundRect(ox+q.x*cell+2,oy+q.y*cell+2,cell-4,cell-4,5);ctx.fill()});
   if(s.special){ctx.fillStyle="#facc15";ctx.beginPath();ctx.arc(ox+(s.special.x+.5)*cell,oy+(s.special.y+.5)*cell,cell*.36,0,7);ctx.fill()}
   hud("LENGTH "+s.snake.length+"  •  ×"+Math.max(1,s.combo),"LV "+s.level+"  •  BEST "+best.current);ctx.fillStyle="#fff8";ctx.font="700 11px Inter";ctx.fillText("SWIPE ANYWHERE TO TURN • GOLD = BONUS",s.w/2,s.h-20);
  }
  if(id==="flappy-bird"){
   const sky=ctx.createLinearGradient(0,0,0,s.h);sky.addColorStop(0,"#63c9ff");sky.addColorStop(.58,"#c9f4ff");sky.addColorStop(1,"#f6fdff");ctx.fillStyle=sky;ctx.fillRect(0,0,s.w,s.h);
   const sunX=s.w*.78,sunY=s.h*.18;ctx.save();ctx.globalAlpha=.8;ctx.shadowBlur=40;ctx.shadowColor="#fff5ae";ctx.fillStyle="#fff7c7";ctx.beginPath();ctx.arc(sunX,sunY,Math.min(48,s.w*.075),0,Math.PI*2);ctx.fill();ctx.restore();
   ctx.fillStyle="#ffffffaa";for(let i=0;i<5;i++){const cx=(i*220-(s.t*24)%(s.w+260))-70,cy=90+(i%3)*56;ctx.beginPath();ctx.arc(cx,cy,20,0,Math.PI*2);ctx.arc(cx+25,cy-8,28,0,Math.PI*2);ctx.arc(cx+56,cy+2,18,0,Math.PI*2);ctx.fill()}
   ctx.fillStyle="#6ca9c4aa";ctx.beginPath();ctx.moveTo(0,s.h*.68);ctx.lineTo(s.w*.18,s.h*.51);ctx.lineTo(s.w*.31,s.h*.66);ctx.lineTo(s.w*.48,s.h*.47);ctx.lineTo(s.w*.65,s.h*.68);ctx.lineTo(s.w*.82,s.h*.5);ctx.lineTo(s.w,s.h*.67);ctx.lineTo(s.w,s.ground);ctx.lineTo(0,s.ground);ctx.closePath();ctx.fill();
   ctx.fillStyle="#4f8a72aa";ctx.beginPath();ctx.moveTo(0,s.h*.75);ctx.lineTo(s.w*.16,s.h*.62);ctx.lineTo(s.w*.32,s.h*.75);ctx.lineTo(s.w*.5,s.h*.6);ctx.lineTo(s.w*.72,s.h*.76);ctx.lineTo(s.w*.87,s.h*.64);ctx.lineTo(s.w,s.h*.75);ctx.lineTo(s.w,s.ground);ctx.lineTo(0,s.ground);ctx.closePath();ctx.fill();
   const ps=s.pipes;for(const pipe of ps){const topH=pipe.gapY-pipe.gap/2,bottomY=pipe.gapY+pipe.gap/2;const g1=ctx.createLinearGradient(pipe.x,0,pipe.x+pipe.w,0);g1.addColorStop(0,"#0a9f63");g1.addColorStop(.25,"#28d47f");g1.addColorStop(.7,"#18b56a");g1.addColorStop(1,"#087b4d");ctx.fillStyle=g1;ctx.shadowBlur=14;ctx.shadowColor="#17d97b66";ctx.fillRect(pipe.x,0,pipe.w,topH);ctx.fillRect(pipe.x,bottomY,pipe.w,s.ground-bottomY);ctx.shadowBlur=0;ctx.fillStyle="#7ef3b4";ctx.fillRect(pipe.x-6,topH-14,pipe.w+12,14);ctx.fillRect(pipe.x-6,bottomY,pipe.w+12,14);ctx.fillStyle="#ffffff3f";ctx.fillRect(pipe.x+7,0,6,topH);ctx.fillRect(pipe.x+7,bottomY,6,s.ground-bottomY)}
   ctx.fillStyle="#8edb77";ctx.fillRect(0,s.ground,s.w,s.h-s.ground);ctx.fillStyle="#d9f27f";for(let x=(s.t*110)%34-34;x<s.w+34;x+=34)ctx.fillRect(x,s.ground,20,6);ctx.fillStyle="#6db55a";ctx.fillRect(0,s.ground+8,s.w,s.h-s.ground-8);
   const b=s.bird;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rot);ctx.shadowBlur=20;ctx.shadowColor="#fff0a855";const bg=ctx.createRadialGradient(-5,-8,2,0,0,b.r*1.4);bg.addColorStop(0,"#fff8c7");bg.addColorStop(.55,"#ffd34d");bg.addColorStop(1,"#ff9c28");ctx.fillStyle=bg;ctx.beginPath();ctx.arc(0,0,b.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;const wingY=Math.sin(s.t*18)*3+(b.flap>0?-6:0);ctx.fillStyle="#ffb92f";ctx.beginPath();ctx.ellipse(-8,wingY+6,13,8,-.35,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(7,-7,6,0,Math.PI*2);ctx.fill();ctx.fillStyle="#1b2430";ctx.beginPath();ctx.arc(8,-7,2.4,0,Math.PI*2);ctx.fill();ctx.fillStyle="#ff6b2c";ctx.beginPath();ctx.moveTo(b.r-1,-1);ctx.lineTo(b.r+14,3);ctx.lineTo(b.r-1,8);ctx.closePath();ctx.fill();ctx.restore();
   ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="900 42px Inter,system-ui";ctx.shadowBlur=10;ctx.shadowColor="#003b5588";ctx.fillText(String(s.score),s.w/2,72);ctx.shadowBlur=0;ctx.font="800 11px Inter,system-ui";ctx.fillStyle="#123047aa";ctx.fillText("BEST  "+best.current,s.w/2,92);ctx.textAlign="left";
   if(!s.started&&alive.current){ctx.fillStyle="#062038aa";ctx.roundRect?.(s.w*.12,s.h*.38,s.w*.76,112,22);ctx.fill();ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="900 25px Inter";ctx.fillText("FLAPPY FLIGHT",s.w/2,s.h*.38+38);ctx.font="700 14px Inter";ctx.fillStyle="#ffffffcc";ctx.fillText("TAPE / CLIQUE / ESPACE POUR VOLER",s.w/2,s.h*.38+70);ctx.font="800 11px Inter";ctx.fillStyle="#fff8";ctx.fillText("Passe entre les portes • bats ton record",s.w/2,s.h*.38+92);ctx.textAlign="left"}
   if(s.flash>0){ctx.fillStyle="#fff";ctx.globalAlpha=Math.min(.45,s.flash);ctx.fillRect(0,0,s.w,s.h);ctx.globalAlpha=1}
  }
  if(id==="breakout"){
   const l=left(s),r=right(s),top=70,bottom=s.h-90,bw=(r-l)/8;ctx.strokeStyle="#fff2";ctx.strokeRect(l,top,r-l,bottom-top);
   const cs=["#00e5ff","#a78bfa","#fb7185","#facc15","#34d399","#60a5fa"];
   s.bricks.forEach((b:any)=>{if(!b.on)return;const x=l+b.x*bw+3,y=top+b.r*24+3;ctx.fillStyle=cs[b.r%cs.length];ctx.shadowBlur=9;ctx.shadowColor=ctx.fillStyle;ctx.beginPath();ctx.roundRect(x,y,bw-6,18,5);ctx.fill();ctx.shadowBlur=0});
   s.power.forEach((p:any)=>{ctx.fillStyle=p.type==="wide"?"#60a5fa":p.type==="multi"?"#facc15":"#f472b6";ctx.beginPath();ctx.arc(p.x,p.y,9,0,7);ctx.fill()});
   ctx.fillStyle="#fff";ctx.beginPath();ctx.roundRect(s.paddle-paddleHalf(s),s.h-62,paddleHalf(s)*2,12,7);ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(s.ball.x,s.ball.y,7,0,7);ctx.fill();
   hud("LV "+s.level+"  •  ❤️ "+s.lives+"  •  ×"+s.mult,"SCORE "+s.score+"  •  BEST "+best.current);ctx.fillStyle="#fff8";ctx.font="700 11px Inter";ctx.fillText("DRAG TO AIM • TAP TO LAUNCH",s.w/2,s.h-20);
  }
  for(const p of s.p){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,7);ctx.fill()}ctx.globalAlpha=1;
  if(!alive.current){ctx.fillStyle="#000b";ctx.fillRect(0,0,s.w,s.h);ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="900 34px Inter";ctx.fillText(id==="flappy-bird"?"FLIGHT OVER":"RUN OVER",s.w/2,s.h*.43);ctx.font="800 17px Inter";ctx.fillText("SCORE "+s.score+"  •  BEST "+best.current,s.w/2,s.h*.49);ctx.font="700 12px Inter";ctx.fillStyle="#fff9";ctx.fillText(id==="flappy-bird"?"TAP / ESPACE POUR REJOUER":"TAP POUR REJOUER",s.w/2,s.h*.56);ctx.textAlign="left"}
  ctx.restore();
 };
 const update=(dt:number)=>{
  const s=S.current;if(!s)return;s.t+=dt;s.shake=Math.max(0,s.shake-dt);for(const p of s.p){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=160*dt;p.life-=dt}s.p=s.p.filter((p:any)=>p.life>0);
  if(!alive.current)return;
  if(id==="illegal-runner"){
   s.dist+=s.speed*dt*.1;s.speed=Math.min(760,330+s.dist*.72);setScore(s,Math.floor(s.dist));s.y+=s.vy*dt;s.vy+=1750*dt;if(s.y>s.ground){s.y=s.ground;s.vy=0}
   s.spawn+=dt;if(s.spawn>Math.max(.46,.82-s.dist/7000)){s.spawn=0;const lane=Math.floor(Math.random()*3);s.obs.push({lane,y:-30,kind:Math.random()<.25?"wall":"bar"});if(Math.random()<.9)for(let i=0;i<3;i++)s.coinsArr.push({lane:(lane+i)%3,y:-90-i*34})}
   for(const o of s.obs)o.y+=s.speed*dt;for(const q of s.coinsArr)q.y+=s.speed*dt;
   for(const q of s.coinsArr)if(!q.got&&q.lane===s.lane&&Math.abs(q.y-s.y)<42){q.got=true;s.coins++;setScore(s,s.score+10);pts(s,s.w/2,s.y,"#ffd166",8)}
   for(const o of s.obs)if(!o.hit&&o.lane===s.lane&&Math.abs(o.y-s.y)<42&&s.y>s.ground-64){o.hit=true;if(s.dashT<=0&&s.inv<=0)end(s);else pts(s,s.w/2,s.y,"#ff37c7",24)}
   s.obs=s.obs.filter((o:any)=>o.y<s.h+80);s.coinsArr=s.coinsArr.filter((q:any)=>q.y<s.h+40);s.inv=Math.max(0,s.inv-dt);
   if(s.dashT>0){s.dashT-=dt;s.speed=Math.max(330,s.speed-1100*dt)}else if(!s.dash&&Math.random()<dt*.05)s.dash=1;
  }
  if(id==="tetris"){
   if(!s.piece)spawnT(s);s.drop+=dt;const fall=Math.max(.055,.72-(s.level-1)*.055);
   if(!coll(s,s.piece.x,s.piece.y+1,s.piece.cells)){if(s.drop>fall){s.drop=0;s.piece.y++;s.lock=0}}else{s.lock+=dt;if(s.lock>.42)lockT(s)}
  }
  if(id==="snake"){
   if(Math.random()<dt*.055&&!s.special)placeSpecial(s);if(s.special){s.special.life-=dt;if(s.special.life<=0)s.special=null}
   s.move+=dt;if(s.move>Math.max(.055,.13-s.level*.006)){s.move=0;if(s.queue.length)s.dir=s.queue.shift();const h={x:s.snake[0].x+s.dir.x,y:s.snake[0].y+s.dir.y};if(h.x<0||h.y<0||h.x>=20||h.y>=20||s.obstacles.some((q:any)=>q.x===h.x&&q.y===h.y))return end(s);const eat=s.food&&h.x===s.food.x&&h.y===s.food.y,bonus=s.special&&h.x===s.special.x&&h.y===s.special.y;const body=eat||bonus?s.snake:s.snake.slice(0,-1);if(body.some((q:any)=>q.x===h.x&&q.y===h.y))return end(s);s.snake.unshift(h);if(eat||bonus){s.combo++;setScore(s,s.score+(bonus?75:10+s.combo*3));pts(s,(h.x+.5)*s.w/20,(h.y+.5)*s.h/20,bonus?"#facc15":"#34d399",14);if(eat)placeFood(s);if(bonus)s.special=null;if(s.snake.length%7===0){s.level++;placeObstacle(s)}}else{s.snake.pop();s.combo=0}}
  }
  if(id==="flappy-bird"){
   s.flash=Math.max(0,s.flash-dt);s.bird.flap=Math.max(0,s.bird.flap-dt);
   if(!s.started){s.bird.y=s.h*.44+Math.sin(s.t*3)*7;s.bird.rot=Math.sin(s.t*3)*.05;}
   else{
    s.bird.vy+=1180*dt;s.bird.y+=s.bird.vy*dt;s.bird.rot=clamp(s.bird.vy/620,-.45,1.15);
    s.pipeT-=dt;if(s.pipeT<=0){const gap=Math.max(118,s.gap-s.score*1.6);const min=90+gap*.5,max=s.ground-90-gap*.5;s.pipes.push({x:s.w+70,gapY:rnd(min,Math.max(min,max)),gap,w:76,passed:false});s.pipeT=Math.max(.78,1.25-s.score*.012)}
    for(const pipe of s.pipes){pipe.x-=s.speed*dt;if(!pipe.passed&&pipe.x+pipe.w<s.bird.x){pipe.passed=true;s.combo++;s.streak++;setScore(s,s.score+1);pts(s,s.bird.x,s.bird.y,"#fff2a6",12);if(s.combo>0&&s.combo%5===0){s.flash=.16;pts(s,s.bird.x,s.bird.y,"#65f7ff",24)}}}
    s.speed=Math.min(360,205+s.score*2.3);s.pipes=s.pipes.filter((pipe:any)=>pipe.x>-100);
    const b=s.bird,br= b.r*.82; if(b.y-br<0||b.y+br>s.ground){s.flash=.45;end(s)}
    for(const pipe of s.pipes){const topH=pipe.gapY-pipe.gap/2,bottomY=pipe.gapY+pipe.gap/2;const nx=clamp(b.x,pipe.x,pipe.x+pipe.w),nyTop=clamp(b.y,0,topH),nyBot=clamp(b.y,bottomY,s.ground);const d1=(b.x-nx)**2+(b.y-nyTop)**2,d2=(b.x-nx)**2+(b.y-nyBot)**2;if(Math.min(d1,d2)<br*br){s.flash=.5;end(s);break}}
   }
  }
  if(id==="breakout"){
   if(s.ball.stuck)return;s.ball.x+=s.ball.vx*dt;s.ball.y+=s.ball.vy*dt;if(s.ball.x<left(s)){s.ball.x=left(s);s.ball.vx=Math.abs(s.ball.vx)}if(s.ball.x>right(s)){s.ball.x=right(s);s.ball.vx=-Math.abs(s.ball.vx)}if(s.ball.y<55){s.ball.y=55;s.ball.vy=Math.abs(s.ball.vy)}
   const py=s.h-62;if(s.ball.y>py-18&&s.ball.y<py+12&&Math.abs(s.ball.x-s.paddle)<paddleHalf(s)&&s.ball.vy>0){s.ball.y=py-18;s.ball.vy=-Math.abs(s.ball.vy);s.ball.vx=clamp(s.ball.vx+(s.ball.x-s.paddle)*3,-450,450);s.mult=Math.min(8,s.mult+1);setScore(s,s.score+5*s.mult)}
   const l=left(s),bw=(right(s)-l)/8,top=70;for(const b of s.bricks)if(b.on){const bx=l+b.x*bw,by=top+b.r*24;if(s.ball.x>bx&&s.ball.x<bx+bw&&s.ball.y>by&&s.ball.y<by+18){b.hp--;s.ball.vy*=-1;setScore(s,s.score+10*s.mult);pts(s,bx+bw/2,by+9,color,12);if(b.hp<=0){b.on=false;if(Math.random()<.2)s.power.push({x:bx+bw/2,y:by+9,type:Math.random()<.65?"wide":"slow"})}break}}
   for(const p of s.power){p.y+=130*dt;if(Math.abs(p.x-s.paddle)<paddleHalf(s)&&p.y>py-18){p.y=s.h+100;if(p.type==="wide")s.wide=8;if(p.type==="slow"){s.ball.vx*=.7;s.ball.vy*=.7}}}s.power=s.power.filter((p:any)=>p.y<s.h+40);if(s.wide>0)s.wide-=dt;
   if(s.ball.y>s.h+20){s.lives--;s.mult=1;if(s.lives<=0)return end(s);s.ball={x:s.paddle,y:s.h*.72,vx:rnd(-190,190),vy:-300,stuck:true}}
   if(s.bricks.every((b:any)=>!b.on)){s.level++;setScore(s,s.score+500);pts(s,s.w/2,s.h*.3,"#fff",35);makeBricks(s);s.ball={x:s.paddle,y:s.h*.72,vx:rnd(-230,230),vy:-330,stuck:true}}
  }
 };
 const pointerDown=(e:PointerEvent)=>{const r=c.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,s=S.current;if(!alive.current){init();if(id==="flappy-bird")flapFB(S.current);return}touch.current={x:e.clientX,y:e.clientY,hold:id==="tetris"&&y<58&&x<100};
  if(id==="illegal-runner"){const now=performance.now();if(now-(s.lastTap||0)<260&&s.dash){s.dash=0;s.dashT=.28;s.inv=.35;pts(s,s.w/2,s.y,"#ff37c7",30)}else if(s.y>=s.ground-5)s.vy=-650;s.lastTap=now}
  if(id==="tetris"){if(y<58&&x<100)holdT(s)}
  if(id==="flappy-bird"){flapFB(s)}
  if(id==="breakout"){s.paddle=clamp(x,left(s)+48,right(s)-48);if(s.ball.stuck){s.ball.x=s.paddle;s.ball.stuck=false}}
  if(id==="2048"){const now=performance.now();if(now-(s.lastTap||0)<280&&s.history.length)undo2048(s);s.lastTap=now}
 };
 const pointerMove=(e:PointerEvent)=>{if(id!=="breakout")return;const r=c.getBoundingClientRect(),s=S.current;s.paddle=clamp(e.clientX-r.left,left(s)+48,right(s)-48);if(s.ball.stuck)s.ball.x=s.paddle};
 const pointerUp=(e:PointerEvent)=>{const p=touch.current;if(!p)return;touch.current=null;const dx=e.clientX-p.x,dy=e.clientY-p.y,s=S.current;if(!alive.current)return;
  if(id==="2048"&&Math.max(Math.abs(dx),Math.abs(dy))>28)move2048(s,Math.abs(dx)>Math.abs(dy)?(dx>0?2:0):(dy>0?3:1));
  if(id==="snake"&&Math.max(Math.abs(dx),Math.abs(dy))>25){const n=Math.abs(dx)>Math.abs(dy)?(dx>0?{x:1,y:0}:{x:-1,y:0}):(dy>0?{x:0,y:1}:{x:0,y:-1});if(!(n.x===-s.dir.x&&n.y===-s.dir.y)){s.queue.push(n);if(s.queue.length>2)s.queue.shift()}}
  if(id==="tetris"&&s.piece){if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)){const dir=dx>0?1:-1;if(!coll(s,s.piece.x+dir,s.piece.y,s.piece.cells))s.piece.x+=dir}else if(dy>35&&dy>Math.abs(dx)){while(!coll(s,s.piece.x,s.piece.y+1,s.piece.cells))s.piece.y++;s.lock=.5}else if(!p.hold&&Math.abs(dx)<12&&Math.abs(dy)<12)rotateT(s)}
 };
 const key=(e:KeyboardEvent)=>{const s=S.current;if(e.code==="Space"){e.preventDefault();if(id==="illegal-runner"&&s.y>=s.ground-5)s.vy=-650;if(id==="breakout"&&s.ball.stuck)s.ball.stuck=false;if(id==="flappy-bird")flapFB(s)}
  if(id==="tetris"&&s.piece){if(e.key==="c"||e.key==="C"){holdT(s);return}if(e.key==="ArrowLeft"&&!coll(s,s.piece.x-1,s.piece.y,s.piece.cells))s.piece.x--;if(e.key==="ArrowRight"&&!coll(s,s.piece.x+1,s.piece.y,s.piece.cells))s.piece.x++;if(e.key==="ArrowDown"&&!coll(s,s.piece.x,s.piece.y+1,s.piece.cells))s.piece.y++;if(e.key==="ArrowUp")rotateT(s);if(e.code==="Space"){while(!coll(s,s.piece.x,s.piece.y+1,s.piece.cells))s.piece.y++;s.lock=.5}}
  if(id==="2048"){const m:any={ArrowLeft:0,ArrowUp:1,ArrowRight:2,ArrowDown:3};if(m[e.key]!==undefined){e.preventDefault();move2048(s,m[e.key])}if((e.key==="z"||e.key==="Z")&&s.history.length)undo2048(s)}
  if(id==="flappy-bird"&&e.key==="ArrowUp"){e.preventDefault();flapFB(s)}
  if(id==="snake"){const n=e.key==="ArrowUp"?{x:0,y:-1}:e.key==="ArrowDown"?{x:0,y:1}:e.key==="ArrowLeft"?{x:-1,y:0}:e.key==="ArrowRight"?{x:1,y:0}:null;if(n&&!(n.x===-s.dir.x&&n.y===-s.dir.y)){s.queue.push(n);if(s.queue.length>2)s.queue.shift()}}
 };
 const loop=(now:number)=>{const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);draw();raf=requestAnimationFrame(loop)};
 init();raf=requestAnimationFrame(loop);c.addEventListener("pointerdown",pointerDown);c.addEventListener("pointermove",pointerMove);c.addEventListener("pointerup",pointerUp);c.addEventListener("pointercancel",()=>{touch.current=null});window.addEventListener("keydown",key);return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resizeCanvas);c.removeEventListener("pointerdown",pointerDown);c.removeEventListener("pointermove",pointerMove);c.removeEventListener("pointerup",pointerUp);window.removeEventListener("keydown",key)};
 },[id,color]);
 return <div className="arcade-shell"><canvas ref={canvas}/></div>;
}