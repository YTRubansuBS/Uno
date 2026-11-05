/* ILLEGAL RUNNER — Dash visibility booster
   Visual only. Does not alter physics, controls, hitboxes or progression. */
(() => {
  'use strict'
  let canvas, ctx
  const $ = id => document.getElementById(id)
  function setup(){
    const game=$('c')
    if(!game) return setTimeout(setup,250)
    if(canvas) return
    canvas=document.createElement('canvas')
    canvas.id='dashVisibilityBooster'
    canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;'
    game.parentElement.appendChild(canvas)
    ctx=canvas.getContext('2d')
    fit()
    addEventListener('resize',fit)
    requestAnimationFrame(loop)
  }
  function fit(){
    if(!canvas)return
    const game=$('c');if(!game)return
    const r=game.getBoundingClientRect(),d=devicePixelRatio||1
    canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d))
    canvas.style.width=r.width+'px';canvas.style.height=r.height+'px'
    ctx.setTransform(d,0,0,d,0,0)
  }
  function loop(now){
    requestAnimationFrame(loop)
    if(!ctx||!canvas)return
    const G=window.__IR_G
    ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight)
    if(!G||!G.running||!(G.dashT>0)||!G.player)return
    const p=G.player,x=p.x+p.w*.42,y=p.y+p.h*.5,t=now/1000
    ctx.save();ctx.globalCompositeOperation='lighter'
    const pulse=1+Math.sin(t*14)*.08
    const glow=ctx.createRadialGradient(x,y,4,x,y,92*pulse)
    glow.addColorStop(0,'rgba(255,255,255,.46)')
    glow.addColorStop(.16,'rgba(255,255,255,.22)')
    glow.addColorStop(.42,'rgba(150,210,255,.12)')
    glow.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,92*pulse,0,Math.PI*2);ctx.fill()
    for(let i=0;i<26;i++){
      const yy=y+(i-13)*3.8+Math.sin(t*16+i)*2.5
      const len=35+(i%8)*16
      ctx.globalAlpha=.16+(i%4)*.045
      ctx.strokeStyle=i%5===0?'#ffffff':'#b9dcff'
      ctx.lineWidth=1.8+(i%3)*.7
      ctx.shadowBlur=12;ctx.shadowColor=ctx.strokeStyle
      ctx.beginPath();ctx.moveTo(x-8-(i%4)*3,yy);ctx.lineTo(x-len,yy+Math.sin(t*3+i)*2);ctx.stroke()
    }
    for(let i=0;i<14;i++){
      const a=t*2.4+i*2.7,r=34+(i%5)*8,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.65
      ctx.globalAlpha=.32+(i%3)*.08;ctx.fillStyle=i%4===0?'#ffffff':'#d5ebff';ctx.shadowBlur=14;ctx.shadowColor=ctx.fillStyle
      ctx.beginPath();ctx.arc(px,py,1.4+(i%2)*.7,0,Math.PI*2);ctx.fill()
    }
    ctx.restore()
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup()
})()
