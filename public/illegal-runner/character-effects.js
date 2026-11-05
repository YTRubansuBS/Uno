(() => {
  'use strict'
  const RARITY={runner:0,ninja:0,robot:0,ghost:0,cyber:0,pilot:0,soldier:0,wizard:0,astronaut:0,skater:0,samurai:1,pirate:1,detective:1,vampire:1,zombie:1,alien:1,king:1,queen:1,knight:2,racer:2,dragon:2,phoenix:2,shadow:2,thunder:2,ice:3,flame:3,cosmic:3,cyborg:3,reaper:4,angel:4,demon:4,time:5,void:5,secret:6}
  const COLORS={
    runner:['#0b1220','#00e5ff'],ninja:['#090b14','#a78bfa'],robot:['#64748b','#00e5ff'],ghost:['#e8fbff','#7affd7'],cyber:['#131326','#ff3cf2'],pilot:['#263548','#9fe8ff'],soldier:['#30452d','#b7d27a'],wizard:['#312050','#c58cff'],astronaut:['#e8edf4','#64d9ff'],skater:['#ef4e85','#fff36b'],
    samurai:['#242936','#ff5c7a'],pirate:['#20222b','#d9a441'],detective:['#28323c','#e7cf9b'],vampire:['#25122d','#ff315f'],zombie:['#3e613a','#a5e66d'],alien:['#4aaa84','#e8ff77'],king:['#553c86','#ffd166'],queen:['#7b245f','#ffd6f7'],
    knight:['#6d7786','#a9e8ff'],racer:['#cf3e46','#ffffff'],dragon:['#4f161d','#ff6b35'],phoenix:['#8b2a16','#ffd166'],shadow:['#07070d','#8e5cff'],thunder:['#24324c','#f8ff3f'],
    ice:['#b9f4ff','#58dfff'],flame:['#7a1309','#ffb000'],cosmic:['#171047','#ff7bd5'],cyborg:['#30363f','#00f0ff'],reaper:['#101018','#b78cff'],angel:['#f5f2ff','#fff2a6'],demon:['#55111c','#ff4d7c'],time:['#382d1c','#ffd166'],void:['#030208','#ff4bd8'],secret:['#0a0712','#00f5ff']
  }
  const NAMES={runner:'RUNNER',ninja:'NINJA',robot:'ROBOT',ghost:'GHOST',cyber:'CYBER',pilot:'PILOT',soldier:'SOLDIER',wizard:'WIZARD',astronaut:'ASTRONAUT',skater:'SKATER',samurai:'SAMURAI',pirate:'PIRATE',detective:'DETECTIVE',vampire:'VAMPIRE',zombie:'ZOMBIE',alien:'ALIEN',king:'KING',queen:'QUEEN',knight:'KNIGHT',racer:'RACER',dragon:'DRAGON',phoenix:'PHOENIX',shadow:'SHADOW',thunder:'THUNDER',ice:'ICE',flame:'FLAME',cosmic:'COSMIC',cyborg:'CYBORG',reaper:'REAPER',angel:'ANGEL',demon:'DEMON',time:'TIME',void:'VOID',secret:'SECRET'}
  let selected='runner'
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v))
  const rect=(c,x,y,w,h,col,a=1,r=0)=>{c.globalAlpha=a;c.fillStyle=col;if(r){c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}else c.fillRect(x,y,w,h);c.globalAlpha=1}
  const strokeRect=(c,x,y,w,h,col,lw=2,a=1,r=0)=>{c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=lw;c.beginPath();if(r)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);c.stroke();c.globalAlpha=1}
  const circ=(c,x,y,r,col,a=1)=>{c.globalAlpha=a;c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.globalAlpha=1}
  const ring=(c,x,y,r,col,lw=2,a=1)=>{c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();c.globalAlpha=1}
  const line=(c,x1,y1,x2,y2,col,lw=2,a=1)=>{c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.globalAlpha=1}
  const poly=(c,p,col,a=1)=>{if(!p.length)return;c.globalAlpha=a;c.fillStyle=col;c.beginPath();c.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)c.lineTo(p[i][0],p[i][1]);c.closePath();c.fill();c.globalAlpha=1}
  const glowLine=(c,x1,y1,x2,y2,col,lw=2,blur=8,a=.8)=>{c.save();c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=lw;c.shadowBlur=blur;c.shadowColor=col;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore()}
  const glowCircle=(c,x,y,r,col,a=.5,blur=12)=>{c.save();c.globalAlpha=a;c.fillStyle=col;c.shadowBlur=blur;c.shadowColor=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.restore()}
  const particle=(c,x,y,s,col,a=.6)=>circ(c,x,y,s,col,a)

  function setCharacter(id){if(id&&COLORS[id])selected=id}

  function aura(c,r,accent,t){
    if(r<=0)return
    const p=.5+.5*Math.sin(t*.08)
    ring(c,21,31,25+r*1.5+p*2,accent,1+r*.35,.16+r*.035)
    if(r>=2)for(let i=0;i<4+r;i++){const a=t*.02+i*1.35,rr=27+(i%3)*4;particle(c,21+Math.cos(a)*rr,31+Math.sin(a)*rr,1+r*.1,accent,.22+r*.04)}
    if(r>=3){c.save();c.globalAlpha=.22;c.strokeStyle=accent;c.lineWidth=1.5;c.beginPath();c.ellipse(21,31,30,12,t*.004,0,Math.PI*2);c.stroke();c.restore()}
    if(r>=4)for(let i=0;i<4;i++)glowLine(c,4,8+i*15,38,10+i*15+Math.sin(t*.03+i)*3,accent,1,5,.11)
    if(r>=5){ring(c,21,31,33+p*3,accent,2,.28);ring(c,21,31,37-p*2,accent,1,.16)}
    if(r===6){const z=['#00f5ff','#ff4bd8','#7affd7','#ffd166','#a78bfa'];ring(c,21,31,40+p*2,z[Math.floor(t/4)%z.length],3,.82);ring(c,21,31,34+p*2,z[(Math.floor(t/4)+2)%z.length],1.5,.65)}
  }

  function base(c,body,accent,p){
    const run=Math.sin((p.run||0)*16)*(p.ground?5:2)
    glowLine(c,14,58,14-run,69,accent,4,6,.7);glowLine(c,28,58,28+run,69,accent,4,6,.7)
    rect(c,8,28,26,31,body,.98,8);circ(c,21,16,14,body);strokeRect(c,8,28,26,31,accent,2.2,.9,8)
  }

  function draw(c,id,body,accent,p,t){
    switch(id){
      case 'runner':
        base(c,body,accent,p);rect(c,12,12,18,5,accent,.95,2);line(c,13,48,29,48,accent,2,.55);break
      case 'ninja':
        base(c,'#070913',accent,p);poly(c,[[7,20],[35,20],[33,25],[9,25]],accent,.9);rect(c,12,13,18,4,'#0b0b12');line(c,11,27,31,27,accent,2);line(c,29,25,38,19,'#e9e9ef',2.3,.8)
        for(let i=0;i<3;i++)particle(c,4+(i*11+t*.05)%30,34+(i*7)%20,1.4,'#7b6cff',.28);break
      case 'robot':
        rect(c,7,6,28,23,'#6d7784',1,5);strokeRect(c,7,6,28,23,accent,2,.9,5);rect(c,11,12,18,7,'#111923',1,2);glowCircle(c,15,15,2,accent,.9,7);glowCircle(c,27,15,2,accent,.9,7);line(c,14,4,14,0,accent,2);circ(c,14,0,2,'#fff');rect(c,10,31,22,24,'#5b6672',1,3);line(c,12,38,30,38,accent,1.7,.65);line(c,21,31,21,55,accent,1.5,.45);circ(c,7,40,2,accent,.7);circ(c,35,47,2,accent,.7);break
      case 'ghost':
        poly(c,[[7,57],[7,29],[11,18],[16,11],[21,8],[27,11],[32,18],[35,29],[35,57],[30,52],[26,58],[21,52],[16,58],[12,52]],body,.85);ring(c,21,31,28,accent,1.5,.35);circ(c,16,25,3,'#111827');circ(c,26,25,3,'#111827');particle(c,12,48,1.5,accent,.35);particle(c,29,43,1.3,accent,.3);break
      case 'cyber':
        base(c,body,accent,p);rect(c,24,7,7,49,accent,.12,3);line(c,9,36,33,31,accent,2.5,.8);line(c,10,46,32,51,'#00e5ff',2,.6);circ(c,28,16,3,accent,.75);line(c,30,16,36,13,accent,1.5);break
      case 'pilot':
        base(c,body,accent,p);circ(c,21,14,15,'#2c394a');rect(c,8,18,26,7,'#fff',.95,3);rect(c,11,19,8,4,'#6ed9ff');rect(c,22,19,8,4,'#6ed9ff');line(c,10,9,5,6,'#d6e2ef',2,.8);line(c,32,9,37,6,'#d6e2ef',2,.8);for(let i=0;i<3;i++)glowLine(c,3,24+i*9,10,22+i*9,accent,1.5,5,.35);break
      case 'soldier':
        base(c,body,accent,p);poly(c,[[6,15],[9,6],[30,6],[36,15]],'#415138');rect(c,11,8,20,6,'#b7d27a');rect(c,29,32,7,15,'#26351f',1,2);line(c,12,35,8,43,accent,2,.5);line(c,30,35,34,43,accent,2,.5);break
      case 'wizard':
        base(c,body,accent,p);poly(c,[[6,13],[21,0],[36,13],[31,14],[11,14]],'#3b2565');line(c,21,0,18,-2,accent,2);line(c,29,31,36,26,'#7b5cff',2);glowCircle(c,37,25,2,'#ffd166',.8,8);for(let i=0;i<3;i++)particle(c,28+Math.sin(t*.03+i)*8,10+((t*.12+i*11)%35),1.1,'#ffd166',.55);break
      case 'astronaut':
        rect(c,8,6,26,22,'#eef3f8',1,9);strokeRect(c,8,6,26,22,accent,2,.8,9);rect(c,12,11,18,8,'#253448',1,3);rect(c,4,33,5,18,'#52627a',.9,2);rect(c,33,33,5,18,'#52627a',.9,2);line(c,10,36,7,48,accent,2,.55);line(c,32,36,35,48,accent,2,.55);rect(c,13,41,5,5,accent,.75,1);rect(c,25,41,5,5,accent,.75,1);particle(c,8,41,1,'#fff',.5);particle(c,34,47,1,'#fff',.4);break
      case 'skater':
        base(c,body,accent,p);rect(c,8,7,27,9,'#2a3140',1,5);rect(c,17,4,8,4,accent,.75,2);rect(c,7,57,28,4,'#69dfff',.95,2);circ(c,12,62,3,'#222a35');circ(c,30,62,3,'#222a35');line(c,10,59,30,59,'#eefcff',1.5,.7);break
      case 'samurai':
        base(c,body,accent,p);poly(c,[[7,14],[9,7],[13,2],[17,8],[21,5],[25,8],[29,2],[33,7],[35,14]],'#303949');poly(c,[[10,9],[13,3],[17,9],[21,5],[25,9],[29,3],[32,9]],'#c7d0df');line(c,12,24,31,24,accent,3,.85);line(c,30,12,38,5,'#e9eef7',2.2,.75);break
      case 'pirate':
        base(c,body,accent,p);rect(c,5,7,31,9,'#17151a',1,4);rect(c,9,12,24,4,'#d9a441');poly(c,[[12,18],[30,18],[33,23],[10,23]],'#f3e4b0',.82);rect(c,25,19,6,7,'#111',1,2);for(let i=0;i<3;i++)particle(c,6+(i*11),36+Math.sin(t*.03+i)*8,1.4,'#6b6b78',.22);break
      case 'detective':
        base(c,body,accent,p);poly(c,[[7,12],[12,5],[30,5],[35,12]],'#4b5663');rect(c,10,9,23,5,'#e7cf9b');rect(c,12,19,18,3,'#6b7a88',.8,2);circ(c,34,31,4,'#f2d37b',.6);line(c,34,35,38,42,accent,2,.7);particle(c,7+(t*.04%24),25,1,'#ffd166',.45);particle(c,29-(t*.03%22),43,1,'#9fe8ff',.42);break
      case 'vampire':
        base(c,body,accent,p);poly(c,[[8,30],[21,20],[34,30],[34,59],[8,59]],'#1d0f26',1);poly(c,[[9,33],[5,25],[8,18],[14,28]],'#e5d9ff',.7);poly(c,[[33,33],[37,25],[34,18],[28,28]],'#e5d9ff',.7);circ(c,15,20,2,'#ff315f',.9);circ(c,27,20,2,'#ff315f',.9);for(let i=0;i<3;i++)particle(c,6+(i*14+t*.03)%30,49-i*7,1.2,'#c51f53',.3);break
      case 'zombie':
        base(c,body,accent,p);circ(c,16,16,3,'#1b271d');circ(c,27,17,3,'#1b271d');line(c,14,31,30,29,accent,2);line(c,11,37,17,42,accent,2,.45);line(c,30,39,35,44,accent,2,.45);for(let i=0;i<4;i++)particle(c,8+(i*9),55-(i%2)*8,1,'#c7c78c',.24);break
      case 'alien':
        circ(c,21,15,16,'#56bf93');circ(c,14,16,5,'#142f2b');circ(c,28,16,5,'#142f2b');glowCircle(c,14,16,2.2,accent,.9,7);glowCircle(c,28,16,2.2,accent,.9,7);rect(c,10,31,22,26,body,.95,8);line(c,12,39,9,47,accent,1.5,.5);line(c,30,39,33,47,accent,1.5,.5);for(let i=0;i<3;i++)particle(c,8+((t*.03+i*10)%28),8+(i%2)*10,1,'#a8ffdd',.3);break
      case 'king':
        base(c,body,accent,p);poly(c,[[8,12],[11,2],[17,9],[21,1],[25,9],[31,2],[34,12]],accent);rect(c,14,22,14,4,'#f2d4ff',.9,2);circ(c,12,27,1.5,'#ffd166');circ(c,30,27,1.5,'#ffd166');for(let i=0;i<3;i++)particle(c,8+(i*13),11+((t*.05+i*7)%8),1.1,'#ffd166',.6);break
      case 'queen':
        base(c,body,accent,p);poly(c,[[8,13],[11,1],[16,9],[21,0],[26,9],[32,1],[34,13]],accent);line(c,13,31,29,31,'#7de8ff',3);rect(c,11,35,20,2,'#ffd6f7',.7);for(let i=0;i<4;i++)particle(c,8+(i*9),39+Math.sin(t*.04+i)*9,1,'#fff',.55);break
      case 'knight':
        base(c,body,accent,p);rect(c,7,8,28,21,'#8b96a6',1,7);strokeRect(c,7,8,28,21,'#d7efff',2,.85,7);rect(c,12,12,18,6,'#a9e8ff',.9,2);circ(c,5,45,7,'#5f7387',.95);ring(c,5,45,7,accent,1,.7);line(c,34,31,39,24,accent,2);line(c,38,24,42,20,'#fff',1.5,.6);break
      case 'racer':
        base(c,body,accent,p);rect(c,8,8,26,10,'#151a25',1,6);rect(c,12,11,18,4,'#fff');line(c,9,34,33,40,accent,3,.8);poly(c,[[8,40],[3,45],[9,47]],accent,.45);glowLine(c,4,36,0,34,accent,2,7,.35);break
      case 'dragon':
        base(c,body,accent,p);poly(c,[[7,13],[12,2],[17,10],[25,10],[30,2],[35,13]],'#7affd7');poly(c,[[9,36],[1,27],[6,48]],accent,.55);poly(c,[[33,36],[41,27],[36,48]],accent,.55);circ(c,16,18,2,'#ffcf70',.9);circ(c,26,18,2,'#ffcf70',.9);particle(c,35,22,1.3,'#ff6b35',.55);break
      case 'phoenix':
        base(c,body,accent,p);poly(c,[[8,43],[0,28],[9,32],[5,18],[17,28]],accent,.65);poly(c,[[34,43],[42,28],[33,32],[37,18],[25,28]],'#ff4d9d',.55);poly(c,[[15,8],[21,-1],[27,8],[23,6],[21,11],[19,6]],'#ffd166');for(let i=0;i<5;i++)particle(c,8+(i*7)%27,44-((t*.18+i*8)%32),1.2,i%2?'#ff6b35':'#ffd166',.55);break
      case 'shadow':
        poly(c,[[8,58],[8,28],[13,13],[21,6],[29,13],[35,28],[35,58],[28,53],[21,59],[14,53]],'#07070d');circ(c,15,25,3,accent,.9);circ(c,27,25,3,'#ff4bd8',.9);for(let i=0;i<5;i++)particle(c,5+(i*8+t*.02)%33,18+(i*9)%37,1.3,'#30224c',.45);break
      case 'thunder':
        base(c,body,accent,p);poly(c,[[9,8],[17,0],[19,7],[26,0],[33,9],[25,12],[29,18],[20,13],[15,20],[16,12],[8,14]],accent,.95);glowLine(c,9,36,4,30,accent,2,10,.8);glowLine(c,33,37,38,31,accent,2,10,.8);glowLine(c,13,49,8,55,accent,2,10,.7);glowLine(c,29,49,34,55,accent,2,10,.7);break
      case 'ice':
        poly(c,[[8,58],[8,30],[12,16],[21,7],[30,16],[34,30],[34,58]],'#b9f4ff',.9);strokeRect(c,8,30,26,28,accent,2,.7,6);line(c,8,30,21,7,accent,2,.75);line(c,34,30,21,7,accent,2,.75);poly(c,[[8,42],[2,35],[7,31]],accent,.45);poly(c,[[34,42],[40,35],[35,31]],accent,.45);for(let i=0;i<5;i++)particle(c,6+(i*8+t*.03)%32,8+(i*7)%38,1.1,'#e9ffff',.55);break
      case 'flame':
        poly(c,[[9,58],[7,38],[13,27],[11,15],[21,3],[24,17],[32,10],[30,27],[36,38],[33,58]],'#7a1309');poly(c,[[14,52],[13,39],[21,20],[29,39],[28,52]],'#fff1a1',.9);poly(c,[[17,50],[18,39],[22,28],[25,39],[25,50]],'#ff5b13',.9);for(let i=0;i<6;i++)particle(c,8+((t*.04+i*6)%27),14+((i*9+t*.05)%24),1.1,i%2?'#ffb000':'#ff4d27',.65);break
      case 'cosmic':
        base(c,body,accent,p);for(let i=0;i<12;i++)particle(c,10+(i*17)%23,9+(i*11)%42,1,'#fff',.75);c.save();c.strokeStyle=accent;c.lineWidth=1.8;c.globalAlpha=.75;c.beginPath();c.ellipse(21,31,27,9,t*.003,0,Math.PI*2);c.stroke();c.restore();circ(c,21,16,13,'#171047',.95);ring(c,21,16,13,accent,1.5,.75);circ(c,15,12,2,'#fff');circ(c,27,19,1.7,'#fff');break
      case 'cyborg':
        base(c,body,accent,p);rect(c,21,5,13,53,accent,.13,3);strokeRect(c,7,28,26,30,'#98eaff',1,.55,7);line(c,21,11,21,56,'#ff4bd8',2,.75);rect(c,22,12,10,5,accent,.9,2);rect(c,24,34,6,7,'#0d1015',1,1);rect(c,10,44,9,5,'#0d1015',1,1);glowCircle(c,28,17,2,accent,.9,9);break
      case 'reaper':
        poly(c,[[7,59],[7,24],[12,12],[21,5],[30,12],[35,24],[35,59]],'#0b0b12');poly(c,[[10,18],[21,7],[32,18],[29,24],[13,24]],'#161621');circ(c,21,25,10,'#d7d3dd',.96);circ(c,17,24,1.5,'#0d0c12');circ(c,25,24,1.5,'#0d0c12');glowLine(c,33,13,41,4,accent,3,11,.85);poly(c,[[39,4],[44,8],[39,11]],accent,.55);for(let i=0;i<4;i++)particle(c,7+(i*9+t*.02)%29,48-i*8,1.3,'#6d5c86',.3);break
      case 'angel':
        base(c,body,accent,p);poly(c,[[10,37],[0,27],[7,47],[13,43]],'#dff8ff',.82);poly(c,[[32,37],[42,27],[35,47],[29,43]],'#dff8ff',.82);circ(c,21,1,7,'#fff2a6',.4);ring(c,21,1,9,'#fff',2,.7);strokeRect(c,9,29,24,28,'#ffd166',2,.7,8);for(let i=0;i<6;i++)particle(c,5+(i*6+t*.025)%34,39+((i*7+t*.05)%20),1.1,'#fff',.55);break
      case 'demon':
        base(c,body,accent,p);poly(c,[[8,12],[12,0],[18,10],[24,10],[30,0],[34,12]],accent);poly(c,[[10,37],[0,27],[7,47],[14,42]],'#2b0711',.95);poly(c,[[32,37],[42,27],[35,47],[28,42]],'#2b0711',.95);circ(c,15,21,2,'#ffd166');circ(c,27,21,2,'#ffd166');poly(c,[[31,51],[40,55],[34,59]],'#ffb000',.7);for(let i=0;i<5;i++)particle(c,7+(i*8+t*.03)%30,24+((i*7+t*.04)%28),1.2,i%2?'#ff4d7c':'#ff7a3d',.48);break
      case 'time':
        base(c,body,accent,p);circ(c,21,16,14,'#e9d6ad');circ(c,21,16,9,'#423a2c');ring(c,21,16,12,'#ffd166',2,.75);for(let i=0;i<8;i++){const a=i*Math.PI/4;line(c,21+Math.cos(a)*7,16+Math.sin(a)*7,21+Math.cos(a)*9,16+Math.sin(a)*9,'#ffd166',1,.7)}line(c,21,16,21,10,accent,2);line(c,21,16,26,19,'#8fe9ff',2);circ(c,21,16,2,accent);for(let i=0;i<4;i++)particle(c,8+(i*10+t*.01)%27,35+(i*6)%20,1,'#ffd166',.5);break
      case 'void':
        circ(c,21,28,20,'#020106');circ(c,21,28,13,body);ring(c,21,28,21,accent,2,.8);circ(c,15,23,2,accent,.9);circ(c,27,23,2,'#7a5cff',.9);poly(c,[[10,42],[14,35],[18,42],[16,50]],'#000',.95);for(let i=0;i<6;i++){const a=t*.015+i*1.1,rr=24+(i%3)*4;particle(c,21+Math.cos(a)*rr,28+Math.sin(a)*rr,1.2,'#ff4bd8',.32)}break
      case 'secret':{
        const z=['#00f5ff','#ff4bd8','#7affd7','#ffd166','#a78bfa','#ff5c7a'],z1=z[Math.floor(t/3)%z.length],z2=z[(Math.floor(t/3)+2)%z.length]
        poly(c,[[8,58],[7,28],[12,12],[21,5],[30,12],[35,28],[35,58],[29,53],[21,59],[13,53]],'#080812',.98)
        ring(c,21,31,24,z1,2.2,.9);circ(c,21,18,9,z2,.22);circ(c,21,18,7,'#05050a')
        c.save();c.strokeStyle=z1;c.lineWidth=2.5;c.shadowBlur=10;c.shadowColor=z1;c.globalAlpha=.95;c.beginPath();c.ellipse(21,18,8,4,0,0,Math.PI*2);c.stroke();c.restore()
        circ(c,21,18,2.8,'#fff',.95);circ(c,21,18,1.2,z1,.95)
        poly(c,[[5,12],[9,4],[13,10]],z2,.65);poly(c,[[29,9],[34,3],[37,13]],z1,.65);poly(c,[[3,43],[0,37],[7,40]],'#ff4d7c',.5);poly(c,[[35,45],[42,39],[38,50]],'#ffd166',.5)
        for(let i=0;i<9;i++){const a=t*.018+i*.69,rr=26+(i%4)*3;particle(c,21+Math.cos(a)*rr,31+Math.sin(a)*rr,1+(i%2),z[i%z.length],.48)}
        for(let i=0;i<4;i++)glowLine(c,5,8+i*13,37,7+i*13+Math.sin(t*.05+i)*5,z[(i+1)%z.length],1,8,.24)
        break
      }
      default: draw(c,'runner',COLORS.runner[0],COLORS.runner[1],p,t);break
    }
  }

  function render(ctx,w,p,G,overrideId){
    const id=overrideId||selected||'runner', m=COLORS[id]||COLORS.runner, rarity=RARITY[id]||0, t=performance.now()/50
    ctx.save()
    // No generic Dash trail: Dash visuals are handled exclusively by the selected Dash style.
    ctx.globalAlpha=1;ctx.save();ctx.translate(p.x+p.w/2,p.y+p.h);const sy=clamp(p.sy,.6,1.25);ctx.scale(1/Math.sqrt(sy),sy);ctx.translate(-p.w/2,-p.h);ctx.scale(p.w/42,p.h/62)
    if(p.inv>0&&Math.floor(p.inv*12)%2)ctx.globalAlpha=.35
    aura(ctx,rarity,m[1],t);draw(ctx,id,m[0],m[1],p,t)
    if(G.shield){ctx.strokeStyle='#54ffc1';ctx.lineWidth=3;ctx.shadowBlur=18;ctx.shadowColor='#54ffc1';ctx.beginPath();ctx.arc(21,31,28,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0}
    ctx.restore();ctx.restore()
    const bar=document.getElementById('progressBar');if(G.level&&bar)bar.style.width=clamp((G.dist/G.goal)*100,0,100)+'%'
    return true
  }

  window.IR_CHARACTER_DRAW=render
  window.IR_CHARACTER_DRAW_SKIN=(ctx,w,p,G,id)=>render(ctx,w,p,G,id)
  window.IR_CHARACTER_DEFS={rarity:RARITY,names:NAMES}
  try{const p=JSON.parse(localStorage.getItem('irGuest')||'{}');if(p.selected_character&&COLORS[p.selected_character])selected=p.selected_character}catch(e){}
  window.addEventListener('ir:profileLoaded',e=>{const id=e&&e.detail&&e.detail.selected_character;if(id)setCharacter(id)})
  window.addEventListener('ir:customizationChanged',e=>{const id=e&&e.detail&&e.detail.selected_character;if(id)setCharacter(id)})
})()