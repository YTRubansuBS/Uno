/* ILLEGAL RUNNER — Dash visual amplifier
   Visual only: runs while G.dashT > 0 and never changes physics, hitboxes or controls. */
(() => {
  'use strict'
  const NAMES=['classic','flame','ice','thunder','toxic','neon','rainbow','galaxy','cosmic','void','shadow','plasma','electric','inferno','frost','aqua','nature','wind','star','moon','sun','crystal','golden','royal','dragon','phoenix','cyber','glitch','portal','matrix','pink','quantum','infinite','secret']
  const palettes={
    classic:['#dbe7ff','#ffffff'],flame:['#ff4a1c','#fff0a6'],ice:['#7be9ff','#e8fbff'],thunder:['#fff338','#ffffff'],toxic:['#66ff33','#d7ff8a'],neon:['#00eaff','#ffffff'],rainbow:['#ff4d8d','#c58cff'],galaxy:['#9d6bff','#67d9ff'],cosmic:['#37efff','#ffd6ff'],void:['#20102f','#d66cff'],shadow:['#3f4658','#b7c4ff'],plasma:['#c45cff','#6df7ff'],electric:['#eaff3d','#ffffff'],inferno:['#ff5a19','#ffd27a'],frost:['#bff6ff','#ffffff'],aqua:['#28e7ff','#9cfff5'],nature:['#48ff87','#d8ff74'],wind:['#dff5ff','#ffffff'],star:['#fff27a','#ffffff'],moon:['#7594ff','#e5eeff'],sun:['#ffbd32','#fff3a8'],crystal:['#7ff3ff','#e2ccff'],golden:['#ffc928','#fff3a3'],royal:['#bd71ff','#ffe36e'],dragon:['#ff4938','#ffb45c'],phoenix:['#ff8a28','#fff06b'],cyber:['#31efff','#ff6cf0'],glitch:['#43f5ff','#ff72ef'],portal:['#b477ff','#6ffaff'],matrix:['#42ff84','#b5ffc9'],pink:['#ff63b6','#ffd0eb'],quantum:['#48f6ff','#ff8fd8'],infinite:['#55efff','#fff06a'],secret:['#5fefff','#ff80ec']
  }
  const $=id=>document.getElementById(id)
  let canvas,ctx,last=0
  let selectedDashId=''
  let dashWasActive=false
  let dashStartedAt=0
  function selected(){
    if(NAMES.includes(selectedDashId))return selectedDashId
    const keys=['irSelectedDash','ir_selected_dash','selectedDash','selected_dash','irDashSelected']
    for(const k of keys){try{const v=localStorage.getItem(k);if(v&&NAMES.includes(String(v).toLowerCase()))return String(v).toLowerCase()}catch(e){}}
    try{
      const p=JSON.parse(localStorage.getItem('irGuest')||'{}')
      if(p.selected_dash&&NAMES.includes(String(p.selected_dash).toLowerCase()))return String(p.selected_dash).toLowerCase()
    }catch(e){}
    try{
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i)||''
        if(k.startsWith('irSelectedDash_')){
          const v=localStorage.getItem(k)
          if(v&&NAMES.includes(String(v).toLowerCase()))return String(v).toLowerCase()
        }
      }
    }catch(e){}
    const el=document.querySelector('[data-selected-dash="true"],[data-dash-selected="true"].active,.dash-card.selected,.dash-item.selected')
    const v=el?.dataset?.dash||el?.dataset?.id
    return v&&NAMES.includes(v.toLowerCase())?v.toLowerCase():'classic'
  }
  window.addEventListener('ir:customizationChanged',e=>{
    const id=String(e.detail?.selected_dash||'').toLowerCase()
    if(NAMES.includes(id))selectedDashId=id
  })
  window.addEventListener('ir:profileLoaded',e=>{
    const id=String(e.detail?.selected_dash||'').toLowerCase()
    if(NAMES.includes(id))selectedDashId=id
  })
  function fit(){if(!canvas)return;const c=$('c');if(!c)return;const r=c.getBoundingClientRect();const d=devicePixelRatio||1;canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));canvas.style.width=r.width+'px';canvas.style.height=r.height+'px';ctx.setTransform(d,0,0,d,0,0)}
  function setup(){
    const c=$('c');if(!c)return setTimeout(setup,250)
    if(canvas)return
    canvas=document.createElement('canvas');canvas.id='dashFxOverlay';canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;'
    c.parentElement.appendChild(canvas);ctx=canvas.getContext('2d');fit();addEventListener('resize',fit)
    requestAnimationFrame(loop)
  }
  function dot(x,y,r,c,a=1){
    r=Math.max(0.35,r*0.22)
    ctx.save()
    ctx.globalCompositeOperation='lighter'
    ctx.globalAlpha=Math.min(1,a*1.55)
    ctx.fillStyle=c
    ctx.shadowBlur=6
    ctx.shadowColor=c
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()
    ctx.shadowBlur=0
    ctx.globalAlpha=Math.min(1,a*1.25)
    ctx.fillStyle='#ffffff'
    ctx.beginPath();ctx.arc(x,y,Math.max(0.18,r*.42),0,Math.PI*2);ctx.fill()
    ctx.restore()
  }
  function ring(x,y,r,c,w=3,a=.9){ctx.save();ctx.globalAlpha=Math.min(1,a*1.15);ctx.strokeStyle=c;ctx.lineWidth=w;ctx.shadowBlur=12;ctx.shadowColor=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.restore()}
  function line(x1,y1,x2,y2,c,w=3,a=.9){ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
  function burst(x,y,c1,c2,t,count=30,size=4){for(let i=0;i<count;i++){const a=i*2.399+t*(.8+(i%5)*.07),d=(i%9)*7+Math.abs(Math.sin(t*2+i))*25;dot(x-Math.cos(a)*d,y+Math.sin(a)*d,Math.max(1,size*.45)+(i%4)*.28,i%2?c1:c2,.78)}}
  function trail(x,y,c1,c2,t,count=18,spread=20){for(let i=0;i<count;i++){const a=t*(1.2+(i%4)*.12)+i*1.9;const d=18+i*5;const px=x-d;const py=y+Math.cos(a*1.35+i)*spread*.6;const len=10+(i%5)*5;line(px,py,px-len,py+Math.sin(a)*2.5,i%2?c1:c2,2.2+(i%3)*.9,.34-(i/count)*.16)}}
  function dashSpeedBurst(x,y,c1,c2,t,age){
    const intro=Math.max(0,1-age/0.22)
    const drift=((t*260)%34)
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round'
    for(let i=0;i<26;i++){
      const yy=y+(i-12)*4.2+Math.sin(t*18+i)*3
      const len=(42+(i%7)*18+drift)*(0.75+intro*.7)
      const xx=x-10-(i%5)*3
      ctx.globalAlpha=(.18+(i%4)*.08)*(0.6+intro*.9)
      ctx.strokeStyle=i%3===0?c2:c1
      ctx.lineWidth=2+(i%5)*.9+intro*2
      ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx-len,yy+((i%3)-1)*2);ctx.stroke()
    }
    // Strong white-hot impulse at the player, so it reads as a burst rather than a trail.
    ctx.globalAlpha=.18+.45*intro;ctx.fillStyle=c2;ctx.shadowBlur=30;ctx.shadowColor=c1
    ctx.beginPath();ctx.ellipse(x,y,30+intro*18,18+intro*12,0,0,Math.PI*2);ctx.fill()
    for(let k=0;k<3;k++){ctx.globalAlpha=(.28-k*.06)*(0.7+intro);ctx.strokeStyle=k%2?c1:c2;ctx.lineWidth=3-k*.6;ctx.beginPath();ctx.arc(x,y,24+k*14+intro*26,-.5,Math.PI*1.5);ctx.stroke()}
    ctx.restore()
  }

  function dashAfterimages(x,y,c1,c2,age){
    const fade=Math.max(0,1-age/0.34)
    ctx.save();ctx.globalCompositeOperation='lighter'
    for(let i=1;i<=3;i++){
      const ox=-i*17
      ctx.globalAlpha=fade*(.16-.035*i)
      ctx.strokeStyle=i%2?c1:c2;ctx.lineWidth=5-i
      ctx.shadowBlur=14;ctx.shadowColor=i%2?c1:c2
      ctx.beginPath();ctx.arc(x+ox,y,12+i*2,0,Math.PI*2);ctx.stroke()
    }
    ctx.restore()
  }

  function draw(id,x,y,t,age=0){
    const [c1,c2]=palettes[id]||palettes.classic
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.shadowBlur=18;ctx.shadowColor=c2
    // Short, sharp motion language: burst first, then a compact streak.
    dashSpeedBurst(x,y,c1,c2,t,age)
    dashAfterimages(x,y,c1,c2,age)
    trail(x,y,c1,c2,t,18,20)
    switch(id){
      case'classic': burst(x,y,c1,c2,t,42,4); ring(x,y,28+Math.sin(t*8)*5,c1,4); break
      case'flame': for(let i=0;i<28;i++){const a=i*.7+t*3;dot(x-12-i%8*8,y+Math.sin(a)*24-20,5+(i%4)*2,i%2?c1:c2,.9)} break
      case'ice': for(let i=0;i<14;i++){const a=i*.45+t;const px=x-Math.abs(Math.sin(i))*55-10,py=y+Math.sin(a)*45;ctx.fillStyle=i%2?c1:c2;ctx.globalAlpha=.72;ctx.beginPath();ctx.moveTo(px,py-7);ctx.lineTo(px+5,py);ctx.lineTo(px,py+7);ctx.lineTo(px-5,py);ctx.closePath();ctx.fill();ctx.globalAlpha=1} break
      case'thunder': for(let i=0;i<7;i++){const ox=Math.sin(t*9+i)*35,oy=Math.cos(t*7+i)*35;line(x+ox,y+oy,x+ox+Math.sin(i+t)*18,y+oy+45,c1,5,.9)} break
      case'toxic': for(let i=0;i<20;i++){const r=3+(i%5)*1.2;dot(x-i*8,y+Math.sin(t+i)*35,r,c1,.78);ring(x-i*8,y+Math.sin(t+i)*35,r,c2,1.2,.72)} break
      case'neon': ring(x,y,34+Math.sin(t*6)*8,c1,8);ring(x,y,48+Math.sin(t*4)*10,c2,3);break
      case'rainbow': {const cs=['#ef4444','#f97316','#facc15','#22c55e','#22d3ee','#3b82f6','#a855f7'];for(let i=0;i<35;i++)dot(x-i*9,y+Math.sin(t*4+i*.5)*28,5,cs[i%cs.length],.9);break}
      case'galaxy': ring(x,y,42,c2,3);for(let i=0;i<22;i++){const a=t*(.7+i*.02)+i*.8;dot(x+Math.cos(a)*35,y+Math.sin(a)*35,3+(i%3),i%2?c1:c2,.9)}break
      case'cosmic': for(let i=0;i<9;i++){const a=t*1.5+i*.8;line(x+Math.cos(a)*20,y+Math.sin(a)*20,x+Math.cos(a)*55,y+Math.sin(a)*55,c1,4);dot(x+Math.cos(a)*58,y+Math.sin(a)*58,4,c2)}break
      case'void': ring(x,y,40,c2,6);dot(x,y,27,'#000',1);ring(x,y,30,c1,3);break
      case'shadow': for(let i=0;i<7;i++){ctx.globalAlpha=.25;ctx.fillStyle=c1;ctx.beginPath();ctx.arc(x-i*15,y+Math.sin(t+i)*20,18+i*2,0,Math.PI*2);ctx.fill()}break
      case'plasma': for(let i=0;i<8;i++){const a=t*2+i*.8;const px=x+Math.cos(a)*35,py=y+Math.sin(a)*35;dot(px,py,9,c1,.8);line(px,py,x+Math.cos(a+.7)*35,y+Math.sin(a+.7)*35,c2,3)}break
      case'electric': for(let i=0;i<11;i++){const a=i*.57+t*3;line(x,y,x+Math.cos(a)*60,y+Math.sin(a)*60,i%2?c1:c2,4,.9)}break
      case'inferno': burst(x,y,c1,c2,t,65,5);ring(x,y,45,c1,7);break
      case'frost': for(let i=0;i<12;i++){const px=x-i*10,py=y+Math.sin(t*2+i)*38;ring(px,py,7,c1,3);line(px-8,py,px+8,py,c2,2)}break
      case'aqua': for(let i=0;i<24;i++){const px=x-i*10,py=y+Math.sin(t*2+i)*40;ring(px,py,4+(i%5),c1,2,.8)}ring(x,y,45,c2,5);break
      case'nature': for(let i=0;i<28;i++){const px=x-i*8,py=y+Math.sin(t+i)*35;dot(px,py,4,i%2?c1:c2,.8);line(px,py,px-7,py-12,c1,2)}break
      case'wind': for(let i=0;i<8;i++){ctx.globalAlpha=.7;ctx.strokeStyle=c1;ctx.lineWidth=5;ctx.beginPath();ctx.arc(x-25-i*8,y,i*5+18,-.8,.8);ctx.stroke()}break
      case'star': for(let i=0;i<24;i++){const a=t*1.5+i*.9,px=x+Math.cos(a)*(25+i%4*6),py=y+Math.sin(a)*(25+i%4*6);dot(px,py,5,c1,.95)}break
      case'moon': ring(x,y,46,c1,4);for(let i=0;i<10;i++){const a=t+i;dot(x+Math.cos(a)*40,y+Math.sin(a)*40,3,c2)}break
      case'sun': ring(x,y,38,c1,8);for(let i=0;i<12;i++){const a=i*Math.PI/6+t*.4;line(x+Math.cos(a)*42,y+Math.sin(a)*42,x+Math.cos(a)*70,y+Math.sin(a)*70,c2,5)}break
      case'crystal': for(let i=0;i<9;i++){const px=x-i*14,py=y+Math.sin(t+i)*35;ctx.fillStyle=i%2?c1:c2;ctx.beginPath();ctx.moveTo(px,py-16);ctx.lineTo(px+11,py);ctx.lineTo(px,py+16);ctx.lineTo(px-11,py);ctx.closePath();ctx.fill()}break
      case'golden': burst(x,y,c1,c2,t,40,4);for(let i=0;i<14;i++)ring(x-i*11,y+Math.sin(t+i)*25,5,c1,2);break
      case'royal': ring(x,y,48,c1,6);ring(x,y,34,c2,3);for(let i=0;i<12;i++)dot(x+Math.cos(t+i)*50,y+Math.sin(t+i)*50,5,c1);break
      case'dragon': {ctx.strokeStyle=c1;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x+20,y);ctx.bezierCurveTo(x-20,y-55,x-90,y+40,x-125,y);ctx.stroke();burst(x-100,y,c1,c2,t,30,5);break}
      case'phoenix': for(let s=-1;s<=1;s+=2){ctx.strokeStyle=c1;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+s*55,y-70,x+s*85,y);ctx.stroke()}burst(x,y,c1,c2,t,45,5);break
      case'cyber': for(let i=0;i<12;i++){const px=x-i*13,py=y+Math.sin(t*4+i)*35;ctx.strokeStyle=i%2?c1:c2;ctx.lineWidth=3;ctx.strokeRect(px-10,py-10,20,20);line(px-10,py+10,px+10,py-10,c1,2)}break
      case'glitch': for(let i=0;i<18;i++){const px=x-i*10+(i%3)*8,py=y+(i%2?1:-1)*(20+Math.sin(t*9+i)*30);ctx.fillStyle=i%2?c1:c2;ctx.fillRect(px,py,18+(i%4)*8,5+(i%3)*4)}break
      case'portal': for(let i=0;i<3;i++){ring(x-45-i*30,y,26+i*8,i%2?c1:c2,5);for(let k=0;k<8;k++){const a=t*2+k;dot(x-45-i*30+Math.cos(a)*22,y+Math.sin(a)*22,3,c2)}}break
      case'matrix': for(let i=0;i<15;i++){const px=x-i*10,py=y-40+((t*80+i*17)%100);line(px,py,px,py+20,c1,3,.8)}break
      case'pink': for(let i=0;i<45;i++){const px=x-i*7,py=y+Math.sin(t*3+i)*38;dot(px,py,5,i%2?c1:c2,.85)}break
      case'quantum': ring(x,y,32,c1,4);ring(x,y,54,c2,3);for(let i=0;i<20;i++){const a=t*3+i;dot(x+Math.cos(a)*55,y+Math.sin(a)*55,4,i%2?c1:c2,.9)}break
      case'infinite': for(let k=0;k<7;k++){const pp=Object.keys(palettes)[(k+Math.floor(t*2))%Object.keys(palettes).length];burst(x-k*14,y,palettes[pp][0],palettes[pp][1],t+k,14,4)}ring(x,y,58,c1,6);break
      case'secret': {const all=['flame','ice','thunder','galaxy','portal','glitch','crystal','cosmic','matrix'];for(let k=0;k<all.length;k++){const pp=palettes[all[(k+Math.floor(t*3))%all.length]];burst(x-k*15,y,pp[0],pp[1],t+k,12,4)}ring(x,y,70,c1,7);ring(x,y,46,c2,3);break}
    }
    ctx.restore();ctx.globalAlpha=1
  }
  function loop(now){
    requestAnimationFrame(loop);if(!ctx||!canvas)return
    const G=window.__IR_G;if(!G||!G.running||!(G.dashT>0)){ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);return}
    const p=G.player;if(!p){return}
    const d=devicePixelRatio||1;ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight)
    // The engine keeps the player in canvas coordinates; use its live position so the FX follows exactly.
    const x=p.x+p.w*.42,y=p.y+p.h*.5
    if(G.dashT>0 && !dashWasActive){dashWasActive=true;dashStartedAt=now}
    if(G.dashT<=0 && dashWasActive){dashWasActive=false}
    draw(selected(),x,y,now/1000,Math.max(0,(now-dashStartedAt)/1000))
    last=now
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup()
})()
