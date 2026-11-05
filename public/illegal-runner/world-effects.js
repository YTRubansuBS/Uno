(() => {
  'use strict'

  const DEFS = {
    city:{emoji:'🌃',name:'CITY',rarity:0,sky:['#08213f','#03060f'],accent:'#00e5ff',ground:'#04070c',coin:'#ffd84a',far:'#0b2c4e',mid:'#123f6e',theme:'city'},
    forest:{emoji:'🌲',name:'FOREST',rarity:0,sky:['#0d3b2a','#02100e'],accent:'#54ffc1',ground:'#03110d',coin:'#b6ff5a',far:'#0d3a34',mid:'#155248',theme:'forest'},
    desert:{emoji:'🏜️',name:'DESERT',rarity:0,sky:['#5a3045','#160a16'],accent:'#ff8a3d',ground:'#160a12',coin:'#ffd84a',far:'#5a2748',mid:'#7a3355',theme:'desert'},
    space:{emoji:'🚀',name:'SPACE',rarity:0,sky:['#180a3a','#02020c'],accent:'#a14dff',ground:'#05030f',coin:'#7fd8ff',far:'#241155',mid:'#331a6e',theme:'space'},
    dark:{emoji:'🌑',name:'DARK',rarity:0,sky:['#0a0a14','#000000'],accent:'#ff2f7d',ground:'#050509',coin:'#ff5aa0',far:'#141425',mid:'#1e1e38',theme:'dark'},
    volcano:{emoji:'🌋',name:'VOLCANO',rarity:0,sky:['#4a120c','#0f0303'],accent:'#ff6a2c',ground:'#160604',coin:'#ffcf4a',far:'#5c1a10',mid:'#7d2515',theme:'volcano'},
    ice:{emoji:'❄️',name:'ICE',rarity:0,sky:['#123c56','#020b13'],accent:'#8fe9ff',ground:'#04121b',coin:'#eafcff',far:'#17516e',mid:'#216f92',theme:'ice'},
    neon:{emoji:'🌌',name:'NEON',rarity:0,sky:['#18052e','#03000a'],accent:'#ff3cf2',ground:'#08020d',coin:'#ffeb3b',far:'#2a0d4a',mid:'#55127d',theme:'neon'},
    ocean:{emoji:'🌊',name:'OCEAN',rarity:0,sky:['#032f5e','#020814'],accent:'#25d9ff',ground:'#02101b',coin:'#6fffe9',far:'#06456b',mid:'#0878a8',theme:'ocean'},
    sky:{emoji:'☁️',name:'SKY',rarity:0,sky:['#4d91d0','#182b50'],accent:'#e9f7ff',ground:'#111a2c',coin:'#fff2a6',far:'#4c8fc2',mid:'#6ab0e0',theme:'sky'},

    sunset:{emoji:'🌇',name:'SUNSET',rarity:1,sky:['#ff6b35','#28102d'],accent:'#ffd166',ground:'#180914',coin:'#ffe066',far:'#7c3046',mid:'#b34a52',theme:'sunset'},
    jungle:{emoji:'🌴',name:'JUNGLE',rarity:1,sky:['#0a4b35','#02140e'],accent:'#7dff6a',ground:'#06140b',coin:'#d7ff5c',far:'#116044',mid:'#198457',theme:'jungle'},
    candy:{emoji:'🍬',name:'CANDY',rarity:1,sky:['#ff74c8','#35145c'],accent:'#7df9ff',ground:'#1c0b26',coin:'#fff',far:'#7b3d82',mid:'#b75a9c',theme:'candy'},
    lava:{emoji:'🔥',name:'LAVA',rarity:1,sky:['#7b160d','#190203'],accent:'#ffb000',ground:'#120303',coin:'#ffe66d',far:'#4a100c',mid:'#8a2314',theme:'lava'},
    moon:{emoji:'🌙',name:'MOON',rarity:1,sky:['#18224d','#03030d'],accent:'#c9d6ff',ground:'#070914',coin:'#f8f1a9',far:'#222d5f',mid:'#35458c',theme:'moon'},
    storm:{emoji:'⛈️',name:'STORM',rarity:1,sky:['#18233b','#05060d'],accent:'#a78bfa',ground:'#080a12',coin:'#d8e6ff',far:'#26395b',mid:'#405b82',theme:'storm'},
    cyber:{emoji:'💻',name:'CYBER',rarity:1,sky:['#071f2b','#02070a'],accent:'#00ff9d',ground:'#030b0b',coin:'#00ffcc',far:'#0c3944',mid:'#12606d',theme:'cyber'},
    crystal:{emoji:'💎',name:'CRYSTAL',rarity:1,sky:['#24135c','#060318'],accent:'#d8a7ff',ground:'#09051b',coin:'#bff8ff',far:'#38217a',mid:'#5939a4',theme:'crystal'},

    toxic:{emoji:'☢️',name:'TOXIC',rarity:2,sky:['#244f14','#071006'],accent:'#b6ff00',ground:'#071006',coin:'#d4ff3f',far:'#315c1a',mid:'#4e8a25',theme:'toxic'},
    void:{emoji:'🕳️',name:'VOID',rarity:2,sky:['#16091f','#000000'],accent:'#ff4bd8',ground:'#030105',coin:'#ff7ae8',far:'#251033',mid:'#42185a',theme:'void'},
    aurora:{emoji:'🌌',name:'AURORA',rarity:2,sky:['#073b4c','#120b35'],accent:'#7affd7',ground:'#041019',coin:'#c4fff0',far:'#0a5662',mid:'#14847c',theme:'aurora'},
    matrix:{emoji:'🟩',name:'MATRIX',rarity:2,sky:['#001b0a','#000501'],accent:'#39ff14',ground:'#020b03',coin:'#39ff14',far:'#063a13',mid:'#087022',theme:'matrix'},
    rainbow:{emoji:'🌈',name:'RAINBOW',rarity:2,sky:['#54218c','#082b55'],accent:'#ffffff',ground:'#090714',coin:'#fff',far:'#743ca0',mid:'#9b5bc2',theme:'rainbow'},
    galaxy:{emoji:'🌠',name:'GALAXY',rarity:2,sky:['#26105a','#02020c'],accent:'#b98cff',ground:'#05030f',coin:'#f0cfff',far:'#38207b',mid:'#5d36a6',theme:'galaxy'},

    temple:{emoji:'🏛️',name:'TEMPLE',rarity:3,sky:['#4a3515','#100b05'],accent:'#ffd166',ground:'#120c05',coin:'#ffe29a',far:'#6a4c1e',mid:'#936b2b',theme:'temple'},
    castle:{emoji:'🏰',name:'CASTLE',rarity:3,sky:['#241d4d','#070510'],accent:'#ff5ca8',ground:'#080611',coin:'#ffd1e7',far:'#3c2e6b',mid:'#59459a',theme:'castle'},
    volcanic:{emoji:'🌋',name:'VOLCANIC',rarity:3,sky:['#5b1608','#110201'],accent:'#ff6b35',ground:'#100302',coin:'#ffd166',far:'#731d0b',mid:'#a72b0e',theme:'volcanic'},
    quantum:{emoji:'⚛️',name:'QUANTUM',rarity:3,sky:['#0b3150','#100b3d'],accent:'#5ee7ff',ground:'#050914',coin:'#9ffff0',far:'#124c70',mid:'#1d75a0',theme:'quantum'},

    dream:{emoji:'💫',name:'DREAM',rarity:4,sky:['#5b2d73','#101d4d'],accent:'#ffb7ff',ground:'#0d0716',coin:'#ffe1ff',far:'#76458b',mid:'#a65db8',theme:'dream'},
    glitch:{emoji:'👾',name:'GLITCH',rarity:4,sky:['#21114a','#050510'],accent:'#ff00ff',ground:'#07050d',coin:'#00ffff',far:'#3d1d69',mid:'#7135a8',theme:'glitch'},
    dragon:{emoji:'🐉',name:'DRAGON',rarity:4,sky:['#4a160f','#100307'],accent:'#ff3b30',ground:'#0e0303',coin:'#ffcf4a',far:'#641e17',mid:'#912a1f',theme:'dragon'},

    portal:{emoji:'🌀',name:'PORTAL',rarity:5,sky:['#0b3761','#25063e'],accent:'#00f5ff',ground:'#050713',coin:'#b5ffff',far:'#12527d',mid:'#1d76a1',theme:'portal'},
    cosmic:{emoji:'☄️',name:'COSMIC',rarity:5,sky:['#30104e','#03030d'],accent:'#ff7bd5',ground:'#08030e',coin:'#ffd0f3',far:'#481a6d',mid:'#6d2998',theme:'cosmic'},
    secret:{emoji:'🗝️',name:'SECRET',rarity:6,sky:['#050505','#000000'],accent:'#00ffff',ground:'#020204',coin:'#ff00ff',far:'#111122',mid:'#202040',theme:'secret'}
  }

  let selected='city'
  let frame=0

  const rng = seed => {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
    return x - Math.floor(x)
  }
  const rect = (c,x,y,w,h,fill,a=1) => { c.globalAlpha=a; c.fillStyle=fill; c.fillRect(x,y,w,h); c.globalAlpha=1 }
  const circle = (c,x,y,r,fill,a=1) => { c.globalAlpha=a; c.fillStyle=fill; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill(); c.globalAlpha=1 }
  const line = (c,x1,y1,x2,y2,stroke,w=2,a=1) => { c.globalAlpha=a; c.strokeStyle=stroke; c.lineWidth=w; c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke(); c.globalAlpha=1 }
  const txt = (c,s,x,y,size,fill,a=.8) => { c.globalAlpha=a; c.fillStyle=fill; c.font=(size+'px system-ui'); c.textAlign='center'; c.textBaseline='middle'; c.fillText(s,x,y); c.globalAlpha=1 }
  const poly = (c,pts,fill,a=1) => { c.globalAlpha=a; c.fillStyle=fill; c.beginPath(); c.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) c.lineTo(pts[i][0],pts[i][1]); c.closePath(); c.fill(); c.globalAlpha=1 }

  function applyWorld(id){
    if(!DEFS[id]) id='city'
    selected=id
    const g=window.__IR_G
    if(g && g.world) g.world={...g.world,...DEFS[id]}
  }

  function loadSaved(){
    try{
      const p=JSON.parse(localStorage.getItem('irGuest')||'{}')
      if(p.selected_background && DEFS[p.selected_background]) selected=p.selected_background
    }catch(e){}
  }

  function syncWorld(){
    const g=window.__IR_G
    if(!g) return
    if(!DEFS[selected]) selected='city'
    if(!g.world || g.world.theme!==selected) g.world={...(g.world||{}),...DEFS[selected]}
  }

  function drawWorld(ctx,W,H,w){
    const id=(w&&w.theme&&DEFS[w.theme])?w.theme:selected
    const d=DEFS[id]||DEFS.city
    const t=performance.now()/1000
    const gy=H-118
    frame++

    ctx.save()
    ctx.globalCompositeOperation='source-over'

    if(id==='city'){
      for(let i=-1;i<8;i++){const x=i*180-((frame*.15)%180),h=120+rng(i+2)*180;rect(ctx,x,gy-h,105,h,d.far,.95);for(let y=gy-h+16;y<gy-18;y+=24)if(rng(i+y*.01)>.25)rect(ctx,x+12,y,14,6,'#9ceaff',.55);rect(ctx,x+72,gy-h+10,18,8,d.accent,.75)}
      for(let i=0;i<5;i++)rect(ctx,80+i*220-((frame*.22)%220),gy-34,70,16,i%2?'#ff3e63':'#1a2638',.95)
      for(let i=0;i<7;i++)line(ctx,70+i*150-((frame*.17)%150),gy-180,70+i*150-((frame*.17)%150),gy-40,d.accent,3,.35)
      txt(ctx,'CITY',W*.78,gy-210,15,d.accent,.8)
    }else if(id==='forest'){
      for(let i=0;i<8;i++){const x=i*145-((frame*.10)%145);rect(ctx,x+52,gy-170,18,170,'#5a3d26');circle(ctx,x+60,gy-190,58,i%2?'#0e5b39':'#136b43',.95);circle(ctx,x+18,gy-142,30,'#1a7b4c',.9)}
      for(let i=0;i<28;i++)txt(ctx,i%3?'🍃':'🍂',(i*87+frame*.08)%W,65+(i*31)%200,12,'#b6ff8a',.6)
      txt(ctx,'🐦',W*.72,90+Math.sin(t)*12,16,'#fff',.8);txt(ctx,'🐦',W*.83,120+Math.cos(t*.8)*10,12,'#fff',.7)
    }else if(id==='desert'){
      rect(ctx,0,gy-135,W,135,'#d2905c',.7)
      for(let i=0;i<7;i++){const x=i*210-((frame*.06)%210);circle(ctx,x,gy-80,95,'#efb267',.65)}
      for(let i=0;i<5;i++){const x=70+i*210-((frame*.08)%210);rect(ctx,x,gy-78,10,78,'#4a3825');rect(ctx,x-13,gy-62,16,10,'#4a3825');rect(ctx,x+7,gy-45,16,10,'#4a3825')}
      circle(ctx,W*.8,85,44,'#ffd56b',.9);txt(ctx,'☀️',W*.8,85,44,'#fff',.8)
      for(let i=0;i<20;i++)circle(ctx,(i*83+frame*.22)%W,70+(i*41)%220,1.8,'#ffd9a0',.45)
    }else if(id==='space'){
      for(let i=0;i<85;i++)circle(ctx,(i*97+frame*.03)%W,25+(i*53)%(gy-25),1+(i%3)*.5,'#fff',.45+.4*rng(i))
      circle(ctx,W*.76,120,48,'#8f6bff',.55);circle(ctx,W*.76,120,35,'#33205d',.9)
      for(let i=0;i<5;i++)circle(ctx,(i*230+frame*.12)%W,70+i*40,10+i*2,'#6f778a',.65)
    }else if(id==='dark'){
      const g=ctx.createRadialGradient(W*.42,gy*.38,20,W*.42,gy*.38,W*.82);g.addColorStop(0,'#20203a');g.addColorStop(.55,'#080814');g.addColorStop(1,'#000');ctx.globalAlpha=.95;ctx.fillStyle=g;ctx.fillRect(0,0,W,gy);ctx.globalAlpha=1
      for(let i=0;i<6;i++){const x=(i*180+frame*.02)%W;circle(ctx,x,gy-110,32,'#101022',.95);circle(ctx,x-8,gy-128,3,d.accent,.75);circle(ctx,x+8,gy-128,3,d.accent,.75)}
    }else if(id==='volcano'){
      for(let i=0;i<3;i++)poly(ctx,[[i*W/3-40,gy],[i*W/3+100,gy-150],[i*W/3+210,gy]],'#1b1110',1)
      poly(ctx,[[W*.32,gy],[W*.45,gy-220],[W*.56,gy]],'#160909',1)
      line(ctx,W*.45,gy-85,W*.49,gy,'#ff5a16',10,.9);line(ctx,W*.47,gy-120,W*.52,gy-45,'#ff9d2e',5,.75)
      for(let i=0;i<22;i++)circle(ctx,(i*71+frame*.12)%W,gy-40-((t*40+i*31)%220),2,'#ff8b2e',.8)
    }else if(id==='ice'){
      poly(ctx,[[0,gy],[W*.12,gy-145],[W*.24,gy],[W*.38,gy-190],[W*.56,gy],[W*.72,gy-150],[W,gy]],'#a9def0',.9)
      for(let i=0;i<65;i++)txt(ctx,'❄',(i*71+frame*.04)%W,45+(i*47)%(gy-55),10,'#fff',.65)
    }else if(id==='neon'){
      for(let y=45;y<gy;y+=34)line(ctx,0,y,W,y,d.accent,1,.18)
      for(let x=-((frame*.25)%70);x<W;x+=70)line(ctx,x,45,x,gy,d.accent,1,.14)
      for(let i=0;i<7;i++){const x=(i*150-frame*.2)%W;rect(ctx,x,70+(i%4)*45,95,42,i%2?'#2b0c54':'#071c48',.92);txt(ctx,i%2?'NOVA':'X',x+48,92+(i%4)*45,16,d.accent,.85)}
      txt(ctx,'NEON',W*.5,gy-175,20,'#ff6cf7',.85)
    }else if(id==='ocean'){
      rect(ctx,0,gy-85,W,85,'#0a6a86',.8)
      for(let y=gy-55;y<gy;y+=18)for(let x=-20;x<W;x+=60)line(ctx,x+(frame*.25%60),y,x+35+(frame*.25%60),y,'#6fffe9',2,.28)
      for(let i=0;i<5;i++){const x=i*220-((frame*.05)%220);circle(ctx,x+60,gy-150,50,'#224d67',.95);circle(ctx,x+100,gy-164,36,'#2e6b80',.85)}
      for(let i=0;i<5;i++)txt(ctx,'🐦',(i*180+frame*.08)%W,75+i%2*35,12,'#fff',.75)
    }else if(id==='sky'){
      for(let i=0;i<6;i++){const x=(i*220-frame*.08)%W,y=90+(i%3)*55;circle(ctx,x,y,34,'#fff',.75);circle(ctx,x+32,y+8,25,'#fff',.75);circle(ctx,x+60,y,30,'#fff',.7)}
      for(let i=0;i<4;i++)poly(ctx,[[i*220+60,gy-45],[i*220+120,gy-85],[i*220+200,gy-45]],'#d9ecff',.85)
      for(let i=0;i<4;i++)txt(ctx,'🐦',(i*230+frame*.14)%W,75+i*30,11,'#fff',.7)
    }else if(id==='sunset'){
      const g=ctx.createLinearGradient(0,0,0,gy);g.addColorStop(0,'#5e2d87');g.addColorStop(.55,'#ff7e4f');g.addColorStop(1,'#ffd66b');ctx.globalAlpha=.55;ctx.fillStyle=g;ctx.fillRect(0,0,W,gy);ctx.globalAlpha=1
      circle(ctx,W*.78,gy*.28,48,'#ffd66b',.95)
      for(let i=0;i<6;i++)line(ctx,W*.78,gy*.28,W*.78+Math.cos(i)*130,gy*.28+Math.sin(i)*75,'#ffe7a2',3,.18)
      poly(ctx,[[0,gy],[W*.25,gy-120],[W*.45,gy],[W*.68,gy-95],[W,gy]],'#5c3244',.8)
    }else if(id==='jungle'){
      for(let i=0;i<6;i++){const x=i*190-((frame*.11)%190);rect(ctx,x+68,gy-205,16,205,'#513a20');circle(ctx,x+76,gy-215,52,'#0e6337',.9);for(let a=0;a<5;a++)line(ctx,x+76,gy-190,x+76+Math.cos(a)*70,gy-145+Math.sin(a)*25,'#4dbb5c',4,.7)}
      rect(ctx,W*.72,80,18,190,'#7b5a31',.65);rect(ctx,W*.74,95,8,175,'#54c8ff',.45)
      for(let i=0;i<18;i++)txt(ctx,i%2?'🦋':'🌺',(i*91+frame*.12)%W,70+(i*37)%220,11,'#fff',.75)
    }else if(id==='candy'){
      for(let i=0;i<5;i++){const x=50+i*190-((frame*.06)%190);rect(ctx,x,gy-165,10,165,'#fff',.75);circle(ctx,x+5,gy-185,38,i%2?'#ff71be':'#68dcff',.92);line(ctx,x-15,gy-210,x+24,gy-160,'#fff',6,.8)}
      poly(ctx,[[0,gy-45],[W*.24,gy-110],[W*.45,gy-45],[W*.72,gy-125],[W,gy-50],[W,gy]],'#6b314c',.8)
      for(let i=0;i<16;i++)txt(ctx,i%2?'🍬':'🍭',(i*103+frame*.08)%W,65+(i%5)*48,14,'#fff',.85)
    }else if(id==='lava'){
      const g=ctx.createLinearGradient(0,gy-170,0,gy);g.addColorStop(0,'#3b0806');g.addColorStop(1,'#ff3b00');ctx.globalAlpha=.55;ctx.fillStyle=g;ctx.fillRect(0,gy-175,W,175);ctx.globalAlpha=1
      for(let i=0;i<5;i++)line(ctx,i*210-((frame*.12)%210),gy-140,i*210+120-((frame*.12)%210),gy-55,'#ffb000',12,.7)
      for(let i=0;i<20;i++)circle(ctx,(i*73+frame*.17)%W,gy-20-(i*31)%170,3,'#ffcf5a',.85)
    }else if(id==='moon'){
      circle(ctx,W*.78,110,72,'#d7def7',.8);for(let i=0;i<9;i++)circle(ctx,W*.74+rng(i)*60,80+rng(i+3)*70,5+rng(i+6)*8,'#9ea8c8',.35)
      for(let i=0;i<7;i++)circle(ctx,(i*170+frame*.04)%W,gy-80-(i%3)*40,18+i%3*5,'#8f95aa',.7)
      for(let i=0;i<35;i++)circle(ctx,(i*79+frame*.06)%W,45+(i*31)%220,1.8,'#fff',.75)
    }else if(id==='storm'){
      for(let i=0;i<8;i++){circle(ctx,(i*160-frame*.05)%W,80+(i%2)*30,55,'#111a2a',.95);circle(ctx,30+(i*160-frame*.05)%W,84+(i%2)*30,42,'#17243a',.95)}
      for(let i=0;i<32;i++)line(ctx,(i*48+frame*.18)%W,125,(i*48+frame*.18)%W+14,gy-25,'#a7c7ff',1,.28)
      if(Math.floor(t*3)%7===0){ctx.globalAlpha=.25;ctx.fillStyle='#fff';ctx.fillRect(0,0,W,gy);ctx.globalAlpha=1}
      line(ctx,W*.74,70,W*.68,150,'#fff',4,.9);line(ctx,W*.68,150,W*.62,210,'#fff',3,.65)
    }else if(id==='cyber'){
      for(let y=50;y<gy;y+=32)line(ctx,0,y,W,y,'#00ffb8',1,.15)
      for(let x=-((frame*.22)%55);x<W;x+=55)line(ctx,x,50,x,gy,'#00ffb8',1,.1)
      for(let i=0;i<8;i++){const x=(i*140-frame*.14)%W;rect(ctx,x,65+(i%4)*43,90,31,'#0a2730',.95);rect(ctx,x+7,72+(i%4)*43,18,4,'#00ffb8',.8);txt(ctx,i%2?'DATA':'LINK',x+53,80+(i%4)*43,9,'#9effe2',.85)}
    }else if(id==='crystal'){
      rect(ctx,0,0,W,gy,'#170d3b',.35)
      for(let i=0;i<12;i++){const x=(i*130-frame*.09)%W,h=85+(i%5)*28,cc=i%3===0?'#66e9ff':i%3===1?'#b174ff':'#ff74da';poly(ctx,[[x,gy],[x+26,gy-h],[x+51,gy],[x+26,gy-h+28]],cc,.34);circle(ctx,x+26,gy-h,5,cc,.9)}
      line(ctx,0,gy-36,W,gy-36,'#fff',1,.18);line(ctx,0,gy-82,W,gy-82,'#bff8ff',1,.15)
    }else if(id==='toxic'){
      rect(ctx,0,40,W,gy-40,'#193c0d',.5);circle(ctx,W*.77,95,58,'#c4ff43',.16)
      for(let i=0;i<6;i++)circle(ctx,i*190+80,gy-34,34,'#7bb52d',.22)
      for(let i=0;i<30;i++){const x=(i*67+frame*.09)%W,y=55+(i*41)%220;circle(ctx,x,y,2.5,i%2?'#b6ff00':'#7dff55',.65)}
      for(let i=0;i<9;i++)txt(ctx,'☢',(i*130+frame*.06)%W,100+(i%4)*45,17,'#c5ff54',.4)
    }else if(id==='void'){
      rect(ctx,0,0,W,gy,'#000',.9)
      for(let i=0;i<14;i++){const x=(i*107+frame*.04)%W,y=55+(i*67)%220,s=15+(i%5)*8;poly(ctx,[[x,y],[x+s,y+5],[x+s-8,y+s],[x-6,y+s-3]],'#51305f',.55);circle(ctx,x,y,2,d.accent,.8)}
      circle(ctx,W*.5,gy*.42,95,'#020105',1);circle(ctx,W*.5,gy*.42,100,d.accent,.08)
    }else if(id==='aurora'){
      poly(ctx,[[0,gy],[W*.16,gy-120],[W*.31,gy],[W*.5,gy-155],[W*.69,gy],[W*.84,gy-115],[W,gy]],'#bfe6f2',.75)
      for(let i=0;i<8;i++){ctx.strokeStyle=i%2?'#7affd7':'#ad7aff';ctx.globalAlpha=.20;ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(0,70+i*20);ctx.bezierCurveTo(W*.28,20+i*30,W*.66,170-i*10,W,70+i*16);ctx.stroke();ctx.globalAlpha=1}
      for(let i=0;i<45;i++)circle(ctx,(i*89+frame*.02)%W,35+(i*43)%240,1.6,'#d7fff5',.7)
    }else if(id==='matrix'){
      for(let i=0;i<24;i++){const x=(i*57+frame*.02)%W,y=(t*(28+(i%5)*8)+i*27)%Math.max(gy,1);txt(ctx,String((i*17)%10),x,y,14,'#39ff14',.75)}
      for(let y=gy-120;y<gy;y+=24)line(ctx,0,y,W,y,'#39ff14',1,.10)
      for(let x=-((frame*.17)%70);x<W;x+=70)line(ctx,x,gy-120,x,gy,'#39ff14',1,.08)
    }else if(id==='rainbow'){
      const colors=['#ff4d6d','#ff9f43','#ffe66d','#54ff8a','#4dd9ff','#7a5cff','#ff4bd8']
      for(let i=0;i<7;i++){ctx.strokeStyle=colors[i];ctx.lineWidth=15;ctx.globalAlpha=.28;ctx.beginPath();ctx.arc(W*.52,gy+10,95+i*28,Math.PI,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
      for(let i=0;i<7;i++){circle(ctx,(i*180+frame*.06)%W,95+(i%3)*45,28,colors[i],.18);circle(ctx,(i*180+frame*.06)%W+26,101+(i%3)*45,20,colors[i],.18)}
      for(let i=0;i<35;i++)circle(ctx,(i*73+frame*.03)%W,45+(i*37)%240,2,colors[i%7],.62)
    }else if(id==='galaxy'){
      const g=ctx.createLinearGradient(0,80,W,gy);g.addColorStop(0,'#2e1760');g.addColorStop(.5,'#d64fc9');g.addColorStop(1,'#20104e');ctx.globalAlpha=.18;ctx.fillStyle=g;ctx.fillRect(0,0,W,gy);ctx.globalAlpha=1
      for(let i=0;i<90;i++)circle(ctx,(i*91+frame*.02)%W,35+(i*47)%(gy-40),1.2+(i%3),'#fff',.55)
      circle(ctx,W*.76,100,44,'#5c8cff',.5);circle(ctx,W*.76,100,22,'#e8f0ff',.55)
      for(let i=0;i<7;i++)line(ctx,(i*160+frame*.3)%W,55+i*24,(i*160+frame*.3)%W-40,75+i*24,d.accent,2,.35)
    }else if(id==='temple'){
      for(let i=0;i<6;i++){const x=i*180-((frame*.08)%180);rect(ctx,x+38,gy-185,44,185,'#80602f',.95);rect(ctx,x+29,gy-190,62,10,'#c3974f',.95)}
      poly(ctx,[[W*.22,gy-185],[W*.5,gy-250],[W*.78,gy-185]],'#9d7738',.95)
      txt(ctx,'𓂀',W*.5,gy-214,34,'#ffd166',.65)
      for(let i=0;i<12;i++)circle(ctx,(i*107+frame*.06)%W,50+(i%4)*38,2,'#ffd166',.85)
    }else if(id==='castle'){
      rect(ctx,0,gy-150,W,150,'#2b2450',.8)
      for(let i=0;i<4;i++){const x=i*260-((frame*.10)%260);rect(ctx,x,gy-180,62,180,'#403567',.98);rect(ctx,x+50,gy-220,55,220,'#403567',.98);poly(ctx,[[x+22,gy-180],[x+31,gy-215],[x+40,gy-180]],'#ff5c9c',.9)}
      circle(ctx,W*.78,95,46,'#eee7ff',.35)
      for(let i=0;i<4;i++)txt(ctx,'🐦',W*.15+i*200,75+(i%2)*28,12,'#111',.65)
    }else if(id==='volcanic'){
      for(let i=0;i<3;i++){const x=100+i*W/3;poly(ctx,[[x-150,gy],[x,gy-260-(i%2)*70],[x+150,gy]],'#160706',1);line(ctx,x-8,gy-130,x+18,gy-20,'#ff4a00',10,.85)}
      for(let i=0;i<28;i++)circle(ctx,(i*59+frame*.35)%W,gy-50-((t*75+i*29)%260),2.5,'#ff7a1a',.9)
    }else if(id==='quantum'){
      for(let i=0;i<11;i++){const x=(i*137+Math.sin(t+i)*60)%W,y=50+(i*43)%240,s=18+Math.sin(t*2+i)*6;ctx.strokeStyle=i%2?'#5ee7ff':'#b47aff';ctx.lineWidth=2;ctx.globalAlpha=.75;ctx.strokeRect(x-s,y-s,s*2,s*2);ctx.globalAlpha=1;circle(ctx,x,y,3,'#fff',.9)}
      for(let i=0;i<5;i++){const x=(i*220-frame*.17)%W;ctx.save();ctx.translate(x,gy-105-(i%3)*35);ctx.rotate(t+i);ctx.strokeStyle=d.accent;ctx.strokeRect(-22,-22,44,44);ctx.restore()}
      txt(ctx,'⚛',W*.5,100,24,'#b7faff',.8)
    }else if(id==='dream'){
      for(let i=0;i<7;i++){const x=(i*185-frame*.05)%W,y=gy-150-(i%3)*55;circle(ctx,x,y,52,i%2?'#ff9be7':'#9e8cff',.55);circle(ctx,x+42,y+7,35,i%2?'#ffb7ef':'#b1a7ff',.45)}
      for(let i=0;i<6;i++){const x=(i*205+Math.sin(t*.5+i)*35)%W;rect(ctx,x,gy-235-(i%2)*50,25,95,'#ffd1ff',.25);circle(ctx,x+12,gy-245-(i%2)*50,22,'#fff',.45)}
      for(let i=0;i<9;i++)txt(ctx,'★',(i*103+frame*.03)%W,55+(i%4)*44,16,'#fff',.75)
    }else if(id==='glitch'){
      for(let i=0;i<30;i++){const x=(i*83-frame*.22)%W,y=40+(i*37)%240;rect(ctx,x,y,20+(i%5)*18,3+(i%4)*2,i%2?'#ff00ff':'#00ffff',.5)}
      for(let i=0;i<7;i++){const y=65+i*32,shift=Math.sin(t*18+i)*12;rect(ctx,shift,y,W*.34,9,'#ff006a',.18);rect(ctx,-shift+W*.2,y+5,W*.31,6,'#00e5ff',.18)}
      txt(ctx,'ERROR 404',W*.5,125,24,'#fff',.42)
    }else if(id==='dragon'){
      for(let i=0;i<4;i++){const x=i*240-((frame*.07)%240);poly(ctx,[[x,gy],[x+90,gy-200],[x+180,gy-90],[x+250,gy-220],[x+320,gy]],'#14251b',.95)}
      for(let i=0;i<3;i++){rect(ctx,120+i*300,gy-135,90,135,'#34243d',.95);poly(ctx,[[120+i*300,gy-135],[165+i*300,gy-195],[210+i*300,gy-135]],'#4d315b',.95)}
      txt(ctx,'🐉',W*.75,120+Math.sin(t)*22,34,'#111',.9);txt(ctx,'🐉',W*.88,165+Math.cos(t*.8)*18,24,'#111',.8)
      for(let i=0;i<18;i++)circle(ctx,(i*67+frame*.16)%W,gy-45-(i*27)%175,2,'#ff8a3d',.85)
    }else if(id==='portal'){
      const colors=['#00f5ff','#ff4bd8','#7affd7','#a78bfa']
      for(let i=0;i<6;i++){const x=(i*180+Math.sin(t*.7+i)*45)%W,y=85+(i%3)*62;ctx.strokeStyle=colors[i%4];ctx.lineWidth=7;ctx.globalAlpha=.7;ctx.beginPath();ctx.ellipse(x,y,42,67,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,24,45,0,0,Math.PI*2);ctx.stroke()}
      for(let i=0;i<8;i++)txt(ctx,['🌃','🌲','🚀','🌌','🐉','🌀','☄️','🏰'][i],(i*145-frame*.04)%W,55+(i%4)*50,14,'#fff',.45)
    }else if(id==='cosmic'){
      for(let i=0;i<115;i++)circle(ctx,(i*83+frame*.02)%W,25+(i*53)%(gy-25),1+(i%4)*.55,'#fff',.72)
      const bx=W*.72,by=115;circle(ctx,bx,by,78,'#7d4bff',.12);circle(ctx,bx,by,42,'#07020c',1);ctx.strokeStyle='#ff7bd5';ctx.lineWidth=6;ctx.globalAlpha=.8;ctx.beginPath();ctx.ellipse(bx,by,74,19,-.22,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1
      for(let i=0;i<6;i++){const x=(i*220-frame*.18)%W;line(ctx,x,50+i*32,x-55,76+i*32,'#ffd1f3',2,.55)}
      txt(ctx,'☄️',W*.2,90+Math.sin(t)*20,28,'#ffb7ea',.8)
    }else if(id==='secret'){
      const mix=[['#00e5ff','🌃'],['#54ffc1','🌲'],['#a14dff','🚀'],['#ff6a2c','🌋'],['#ffb7ff','💫'],['#7affd7','🌀'],['#ffd166','☄️']]
      const g=ctx.createLinearGradient(0,0,W,gy);g.addColorStop(0,'#07152b');g.addColorStop(.5,'#21102f');g.addColorStop(1,'#030304');ctx.globalAlpha=.62;ctx.fillStyle=g;ctx.fillRect(0,0,W,gy);ctx.globalAlpha=1
      for(let i=0;i<mix.length;i++){const x=(i*170+Math.sin(t*.4+i)*40)%W,y=58+(i%4)*52;ctx.strokeStyle=mix[i][0];ctx.lineWidth=3;ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(x,y,22+i%4*6,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;txt(ctx,mix[i][1],x,y,17,'#fff',.8)}
      for(let i=0;i<10;i++)line(ctx,(i*129-frame*.10)%W,45,(i*129-frame*.10)%W+25,gy-60,'#fff',1,.14)
      txt(ctx,'YOU FOUND IT',W*.5,110,18,'#fff',.45)
    }

    // Atmosphère de rareté : plus le monde est rare, plus l'écran devient spectaculaire.
    if(d.rarity>=1){
      const amount = [0,18,28,40,55,75,95][d.rarity]
      for(let i=0;i<amount;i++){
        const x=(i*137+frame*(0.08+d.rarity*.025))%W
        const y=34+(i*53)%(Math.max(gy-55,1))
        const r=1.2+(i%4)*.8+d.rarity*.25
        circle(ctx,x,y,r,d.accent,.18+d.rarity*.025)
      }
    }
    if(d.rarity>=2){
      const glowA=.055+d.rarity*.018
      const grd=ctx.createRadialGradient(W*.5,gy*.34,20,W*.5,gy*.34,W*.82)
      grd.addColorStop(0,d.accent)
      grd.addColorStop(1,'transparent')
      ctx.globalAlpha=glowA
      ctx.fillStyle=grd
      ctx.fillRect(0,0,W,gy)
      ctx.globalAlpha=1
      if(d.rarity>=3){
        for(let i=0;i<4+d.rarity;i++){
          const x=(i*190+frame*(0.16+d.rarity*.03))%W
          const y=gy-70-(i%4)*48
          ctx.save()
          ctx.translate(x,y)
          ctx.rotate(frame*.002*(i%2?1:-1))
          ctx.strokeStyle=d.accent
          ctx.lineWidth=1.5+d.rarity*.35
          ctx.globalAlpha=.16+d.rarity*.025
          ctx.strokeRect(-18-d.rarity*2,-18-d.rarity*2,36+d.rarity*4,36+d.rarity*4)
          ctx.restore()
        }
      }
    }
    if(d.rarity>=4){
      ctx.save()
      ctx.globalAlpha=.10+d.rarity*.02
      ctx.strokeStyle=d.accent
      ctx.lineWidth=2+d.rarity*.5
      for(let i=0;i<5;i++){
        const y=55+i*55+Math.sin(performance.now()*.001+i)*10
        ctx.beginPath()
        ctx.moveTo(0,y)
        ctx.bezierCurveTo(W*.25,y-25,W*.7,y+25,W,y-4)
        ctx.stroke()
      }
      ctx.restore()
    }
    if(d.rarity===5){
      // Mythique : portail cosmique permanent, sans toucher au gameplay.
      const px=W*.5, py=gy*.36
      ctx.save()
      ctx.globalAlpha=.24
      for(let i=0;i<4;i++){
        ctx.strokeStyle=i%2? '#ff4bd8':'#00f5ff'
        ctx.lineWidth=3+i
        ctx.beginPath()
        ctx.ellipse(px,py,95+i*22,48+i*12,Math.sin(performance.now()*.00035)*.3,0,Math.PI*2)
        ctx.stroke()
      }
      ctx.restore()
    }
    if(d.rarity===6){
      // SECRET : mélange vivant de dimensions + pulsation multicolore.
      const pulse=.5+.5*Math.sin(performance.now()*.0022)
      const colors=['#00f5ff','#ff4bd8','#7affd7','#ffd166','#a78bfa']
      const sg=ctx.createRadialGradient(W*.5,gy*.38,15,W*.5,gy*.38,W*.9)
      sg.addColorStop(0,'#ffffff')
      sg.addColorStop(.18,colors[(frame>>3)%colors.length])
      sg.addColorStop(.55,'#16051e')
      sg.addColorStop(1,'#000')
      ctx.save()
      ctx.globalAlpha=.10+.10*pulse
      ctx.fillStyle=sg
      ctx.fillRect(0,0,W,gy)
      ctx.globalAlpha=1
      for(let i=0;i<12;i++){
        const a=frame*.003*(i%2?1:-1)+i*.5
        const rr=45+i*18+Math.sin(frame*.01+i)*8
        const x=W*.5+Math.cos(a)*rr
        const y=gy*.38+Math.sin(a)*rr*.42
        ctx.strokeStyle=colors[i%colors.length]
        ctx.lineWidth=2+pulse*2
        ctx.globalAlpha=.35+.2*pulse
        ctx.beginPath()
        ctx.arc(x,y,8+(i%4)*4,0,Math.PI*2)
        ctx.stroke()
      }
      ctx.globalAlpha=.75
      ctx.strokeStyle=colors[frame%colors.length]
      ctx.lineWidth=2+pulse*2
      ctx.beginPath()
      ctx.arc(W*.5,gy*.38,62+pulse*14,0,Math.PI*2)
      ctx.stroke()
      ctx.restore()
    }
    ctx.restore()
  }

  window.IR_WORLD_DEFS=DEFS
  window.IR_WORLD_BG_DRAW=drawWorld

  loadSaved()

  window.addEventListener('ir:profileLoaded',e=>{
    const id=e?.detail?.selected_background
    if(id&&DEFS[id])selected=id
    applyWorld(selected)
  })
  window.addEventListener('ir:customizationChanged',e=>{
    const id=e?.detail?.selected_background
    if(id&&DEFS[id])applyWorld(id)
  })

  setInterval(syncWorld,100)

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncWorld)
  else syncWorld()
})()