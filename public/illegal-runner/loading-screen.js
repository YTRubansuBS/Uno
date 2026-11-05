(() => {
  'use strict'
  const DEFAULT_STEPS=[
    {id:'engine',label:'Ressources du jeu',icon:'🎮'},
    {id:'profile',label:'Profil et sauvegarde',icon:'👤'},
    {id:'coins',label:'Pièces du joueur',icon:'🪙'},
    {id:'best',label:'Meilleur score',icon:'🏆'},
    {id:'level',label:'Niveau du joueur',icon:'📈'},
    {id:'custom',label:'Personnalisations',icon:'🎨'},
    {id:'quests',label:'Quêtes',icon:'📋'},
    {id:'daily',label:'Cadeau quotidien',icon:'🎁'}
  ]
  let steps=DEFAULT_STEPS.map(s=>({...s})),overlay=null,list=null,bar=null,title=null,status=null,active=false,engineReady=false,sessionLoading=false
  function create(){
    if(overlay&&document.body.contains(overlay))return
    overlay=document.createElement('section');overlay.id='irLoadingScreen';overlay.setAttribute('aria-live','polite')
    overlay.innerHTML='<div class="ir-load-grid"></div><div class="ir-load-card"><div class="ir-load-logo">ILLEGAL<br><span>RUNNER</span></div><div class="ir-load-kicker">// INITIALISATION</div><h1 id="irLoadTitle">CHARGEMENT</h1><p id="irLoadStatus">Préparation du jeu…</p><div class="ir-load-progress"><i id="irLoadBar"></i></div><div id="irLoadSteps" class="ir-load-steps"></div><button id="irLoadSkip" type="button">PASSER ⏭</button></div>'
    const style=document.createElement('style')
    style.textContent=`
#irLoadingScreen{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 35%,#10182b 0,#050810 45%,#02040a 100%);color:#f4f7ff;font-family:Inter,system-ui,sans-serif;overflow:auto;padding:22px;box-sizing:border-box;transition:opacity .25s ease}
#irLoadingScreen .ir-load-grid{position:absolute;inset:0;opacity:.15;pointer-events:none;background-image:linear-gradient(rgba(0,229,255,.22) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.22) 1px,transparent 1px);background-size:42px 42px;transform:perspective(500px) rotateX(55deg) scale(1.35);transform-origin:center bottom}
#irLoadingScreen .ir-load-card{position:relative;width:min(620px,100%);padding:30px 26px;border:1px solid rgba(0,229,255,.32);border-radius:22px;background:rgba(4,7,14,.92);box-shadow:0 0 60px rgba(0,229,255,.12),inset 0 0 30px rgba(255,55,199,.05);backdrop-filter:blur(12px)}
#irLoadingScreen .ir-load-logo{font-weight:900;letter-spacing:3px;font-size:27px;line-height:.9}#irLoadingScreen .ir-load-logo span{color:#00e5ff}
#irLoadingScreen .ir-load-kicker{margin-top:18px;color:#ff4aa8;font-size:11px;font-weight:900;letter-spacing:2px}
#irLoadingScreen h1{margin:7px 0 4px;font-size:28px;letter-spacing:1px}#irLoadingScreen #irLoadStatus{margin:0 0 16px;color:#9aa8c2;font-size:14px;min-height:20px}
#irLoadingScreen .ir-load-progress{height:9px;border-radius:999px;background:#131b2c;overflow:hidden;border:1px solid rgba(255,255,255,.07)}#irLoadingScreen .ir-load-progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,#00e5ff,#ff37c7);box-shadow:0 0 18px rgba(0,229,255,.55);transition:width .28s ease}
#irLoadingScreen .ir-load-steps{display:grid;gap:7px;margin-top:18px}#irLoadingScreen .ir-load-step{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.055);font-size:13px}#irLoadingScreen .ir-load-step .ico{width:25px;text-align:center}#irLoadingScreen .ir-load-step .name{flex:1}#irLoadingScreen .ir-load-step .state{font-weight:900;color:#71809a;font-size:12px}
#irLoadingScreen .ir-load-step[data-state="loading"]{border-color:rgba(0,229,255,.3);background:rgba(0,229,255,.055)}#irLoadingScreen .ir-load-step[data-state="loading"] .state{color:#00e5ff}#irLoadingScreen .ir-load-step[data-state="done"] .state{color:#72ffb2}#irLoadingScreen #irLoadSkip{margin-top:16px;width:100%;min-height:46px;border:1px solid rgba(0,229,255,.5);border-radius:12px;background:rgba(0,229,255,.09);color:#fff;font-weight:900;font-size:14px;cursor:pointer}#irLoadingScreen #irLoadSkip:hover{background:rgba(0,229,255,.18)}#irLoadingScreen .ir-load-step[data-state="error"] .state{color:#ff668f}
@media(max-width:520px){#irLoadingScreen{padding:14px}#irLoadingScreen .ir-load-card{padding:22px 18px}#irLoadingScreen h1{font-size:23px}}
`
    document.head.appendChild(style);document.body.appendChild(overlay)
    list=overlay.querySelector('#irLoadSteps');bar=overlay.querySelector('#irLoadBar');title=overlay.querySelector('#irLoadTitle');status=overlay.querySelector('#irLoadStatus');const skip=overlay.querySelector('#irLoadSkip');if(skip)skip.onclick=hide;render()
    overlay.style.display='none';overlay.style.opacity='0';overlay.style.pointerEvents='none'
    if(engineReady&&!sessionLoading){overlay.style.display='none';overlay.style.opacity='0';overlay.style.pointerEvents='none'}
  }
  function render(){if(!list)return;list.innerHTML=steps.map(s=>{const st=s.state||'waiting';const t=st==='done'?'✓ CHARGÉ':st==='loading'?'… CHARGEMENT':st==='error'?'✕ ERREUR':'EN ATTENTE';return '<div class="ir-load-step" data-state="'+st+'"><span class="ico">'+s.icon+'</span><span class="name">'+s.label+'</span><span class="state">'+t+'</span></div>'}).join('');const n=steps.filter(s=>s.state==='done').length;if(bar)bar.style.width=Math.round(n/steps.length*100)+'%'}
  function show(){create();active=true;overlay.style.display='flex';overlay.style.opacity='1';overlay.style.pointerEvents='auto';document.documentElement.style.overflow='hidden';render()}
  function hide(){if(!overlay)return;active=false;overlay.style.opacity='0';overlay.style.pointerEvents='none';setTimeout(()=>{if(!active){overlay.style.display='none';document.documentElement.style.overflow=''}},260)}
  function setStep(id,state,message){const s=steps.find(x=>x.id===id);if(!s)return;s.state=state;if(message&&status)status.textContent=message;if(title)title.textContent=state==='error'?'ERREUR DE CHARGEMENT':state==='done'&&id==='daily'?'PRÊT !':'CHARGEMENT';render()}
  function startSession(){
    steps=DEFAULT_STEPS.map(s=>({...s,state:'waiting'}))
    const e=steps.find(s=>s.id==='engine')
    if(engineReady)e.state='done'
    sessionLoading=true
    show()
    setStep('profile','loading','Chargement…')
    // Progression visuelle autonome : aucune étape ne peut bloquer le démarrage.
    setTimeout(()=>{
      if(!active)return
      const order=['profile','coins','best','level','custom','quests','daily']
      let i=0
      const timer=setInterval(()=>{
        if(!active){clearInterval(timer);return}
        while(i<order.length && steps.find(s=>s.id===order[i])?.state==='done')i++
        if(i>=order.length){clearInterval(timer);finishSession();return}
        const id=order[i++]
        done(id,id==='coins'?'Pièces chargées.':id==='best'?'Meilleur score chargé.':id==='level'?'Niveau chargé.':id==='custom'?'Personnalisations chargées.':id==='quests'?'Quêtes chargées.':id==='daily'?'Cadeau quotidien vérifié.':'Profil chargé.')
        if(i>=order.length){clearInterval(timer);finishSession()}
      },180)
    },120)
  }
  function engineDone(){engineReady=true;const e=steps.find(s=>s.id==='engine');if(e)e.state='done';render();if(!sessionLoading)hide()}
  function engineError(message){engineReady=false;setStep('engine','error',message||'Impossible de charger le moteur du jeu.');sessionLoading=false}
  function done(id,message){setStep(id,'done',message)}
  function finishSession(){steps.forEach(s=>{if(s.state!=='done')s.state='done'});render();if(status)status.textContent='Tout est prêt. Bonne partie !';if(title)title.textContent='PRÊT !';sessionLoading=false;setTimeout(hide,260)}
  function addStep(step){if(!step||!step.id||steps.some(s=>s.id===step.id))return;steps.push({...step,state:'waiting'});render()}
  window.IR_LOADING={show,hide,startSession,done,setStep,finishSession,engineDone,engineError,addStep,isActive:()=>active}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',create,{once:true});else create()
})()