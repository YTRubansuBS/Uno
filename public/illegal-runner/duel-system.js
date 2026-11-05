(() => {
  'use strict'
  const cfg=window.IR_CONFIG||{}
  const sb=window.supabase&&cfg.SUPABASE_URL?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null
  const S={user:null,requestId:null,sessionId:null,session:null,nameMap:{},timer:null,poll:null,sync:null,broadcast:null,channel:null,shown:null,ghost:0,ghostTarget:0,ghostFrom:0,ghostStart:0,ghostDuration:170,ghostPacketAt:0,ghostSpeed:420,sendBusy:false,opponentLives:2,opponentAction:'run',opponentY:0,opponentCharacter:'runner',opponentCharacterLoaded:false,opponentCharacterLoading:false,userCharacter:'runner'}
  const layer=document.createElement('div');layer.id='irDuelLayer';document.body.appendChild(layer)
  const hud=document.createElement('div');hud.id='irDuelHud';hud.className='duelHud';document.body.appendChild(hud);const pauseBox=document.createElement('div');pauseBox.id='irDuelPauseBox';document.body.appendChild(pauseBox)
  const style=document.createElement('style');style.textContent=`#irDuelLayer{position:fixed;inset:0;z-index:2147483590;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(2,5,12,.9);backdrop-filter:blur(10px);font-family:Inter,system-ui,sans-serif}#irDuelLayer .dm{width:min(820px,96vw);max-height:94vh;overflow:auto;background:#050b14;color:#fff;border:1px solid #00e5ff66;border-radius:22px;box-shadow:0 0 60px #00e5ff22}#irDuelLayer .dh{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid #ffffff14}#irDuelLayer .db{padding:18px}#irDuelLayer button{border:1px solid #274765;background:#0d1929;color:#fff;border-radius:9px;padding:10px 13px;font-weight:900;cursor:pointer}#irDuelLayer button.primary{background:linear-gradient(90deg,#00a7cf,#d72583);border:0}#irDuelLayer button.danger{color:#ff9bb0;border-color:#633244;background:#1a0d15}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.duelGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.duelCard{padding:14px;border:1px solid #ffffff14;border-radius:15px}.duelTimer,.duelCount,.duelResult{text-align:center;font-weight:900}.duelTimer{font-size:30px;color:#ffd45c;margin:12px}.duelCount{font-size:42px;color:#00e5ff;margin:10px}.duelResult{font-size:28px;margin:18px}.muted{color:#93a0b6}.duelHud{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483500;display:none;padding:9px 14px;border:1px solid #00e5ff66;border-radius:13px;background:#02050cdc;color:#fff;font:900 14px Inter,sans-serif;box-shadow:0 0 18px #00e5ff26;text-align:center}@media(max-width:700px){.duelGrid{grid-template-columns:1fr}}`;style.textContent+=`#irDuelPauseBox{position:fixed;left:50%;top:76px;transform:translateX(-50%);z-index:2147483585;min-width:300px;max-width:min(92vw,520px);padding:16px 18px;border:1px solid #00e5ff66;border-radius:16px;background:rgba(3,8,18,.96);color:#fff;box-shadow:0 0 32px #00e5ff22;font:900 14px Inter,sans-serif;text-align:center;display:none}#irDuelPauseBox h3{margin:0 0 8px;font-size:20px}#irDuelPauseBox p{margin:0;color:#93a0b6;font-weight:700}#irDuelPauseBox .pa{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px}#irDuelPauseBox button{border:1px solid #274765;background:#0d1929;color:#fff;border-radius:9px;padding:9px 13px;font-weight:900;cursor:pointer}#irDuelPauseBox button.primary{background:linear-gradient(90deg,#00a7cf,#d72583);border:0}`;document.head.appendChild(style)
  const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]))
  const show=h=>{layer.innerHTML=h;layer.style.display='flex'}
  const hide=()=>{layer.style.display='none';clearTimers()}
  const clearTimers=()=>{if(S.timer)clearInterval(S.timer);if(S.poll)clearInterval(S.poll);if(S.sync)clearInterval(S.sync);if(S.broadcast)clearInterval(S.broadcast);S.timer=S.poll=S.sync=S.broadcast=null;S.sendBusy=false;pauseBox.style.display='none';if(S.channel){try{sb.removeChannel(S.channel)}catch(_){}S.channel=null}}
  const rpc=async(name,args)=>{if(!sb)throw Error('Supabase indisponible');const r=await sb.rpc(name,args||{});if(r.error)throw r.error;return r.data}
  const meA=s=>s&&s.user_a===S.user.id
  const otherId=s=>meA(s)?s.user_b:s.user_a
  const otherName=s=>esc(S.nameMap[otherId(s)]||'Ton ami')
  const otherCharacter=s=>(meA(s)?s.character_b:s.character_a)||'runner'
  const remaining=d=>d?Math.max(0,(new Date(d).getTime()-Date.now())/1000):0

  async function refreshUser(){if(!sb)return;S.user=(await sb.auth.getSession()).data?.session?.user||null}
  async function requests(){
    if(!S.user)return []
    try{
      const rows=await rpc('duel_poll_requests')
      return Array.isArray(rows)?rows:[]
    }catch(err){
      const msg=String(err?.message||err||'')
      if(!/ambiguous|column reference/i.test(msg))return []
      try{
        const q=await sb.from('duel_requests')
          .select('id,sender_id,receiver_id,status,created_at,expires_at')
          .or('sender_id.eq.'+S.user.id+',receiver_id.eq.'+S.user.id)
          .order('created_at',{ascending:false})
          .limit(30)
        if(q.error)throw q.error
        const rows=Array.isArray(q.data)?q.data:[]
        const ids=rows.map(x=>x.id).filter(Boolean)
        let sessions=[]
        if(ids.length){
          const sq=await sb.from('duel_sessions').select('id,request_id').in('request_id',ids)
          if(!sq.error&&Array.isArray(sq.data))sessions=sq.data
        }
        const sm=new Map(sessions.map(x=>[String(x.request_id),x.id]))
        const out=rows.map(x=>({...x,session_id:sm.get(String(x.id))||null}))
        return out
      }catch(_){return []}
    }
  }
  function requestGui(r){
    const id=String(r?.id||'');if(!id||!S.user)return
    S.requestId=id
    const incoming=r.receiver_id===S.user.id
    const who=esc(incoming?(r.sender_username||'Ton ami'):(r.receiver_username||'Ton ami'))
    show(incoming?`<div class="dm"><div class="dh"><h2>⚔️ Demande de 1V1</h2><button id="dx">✕</button></div><div class="db"><h3>👤 ${who} veut faire un 1V1 avec toi.</h3><div id="rt" class="duelTimer"></div><p class="muted">Tu as 30 secondes pour répondre.</p><div class="actions"><button id="da" class="primary">✅ ACCEPTER</button><button id="dr" class="danger">❌ REFUSER</button></div></div></div>`:`<div class="dm"><div class="dh"><h2>⚔️ 1V1 contre ${who}</h2><button id="dx">✕</button></div><div class="db"><div class="duelCount">1 / 2</div><h3 style="text-align:center">⏳ En attente de ${who}</h3><div id="rt" class="duelTimer"></div><p class="muted" style="text-align:center">Demande envoyée.</p><div class="actions"><button id="dc" class="danger">❌ ANNULER</button></div></div></div>`)
    const da=document.getElementById('da'),dr=document.getElementById('dr'),dx=document.getElementById('dx'),dc=document.getElementById('dc')
    if(da)da.onclick=()=>respond(id,true);if(dr)dr.onclick=()=>respond(id,false);if(dx)dx.onclick=()=>respond(id,false);if(dc)dc.onclick=()=>cancel(id)
    const until=r.expires_at?new Date(r.expires_at).getTime():Date.now()+30000
    clearTimers();S.timer=setInterval(()=>{const e=document.getElementById('rt');const n=Math.ceil(Math.max(0,(until-Date.now())/1000));if(e)e.textContent=n+' s';if(n<=0)cancel(id,true)},200)
  }
  async function cancel(id,silent=false){try{await rpc('duel_cancel_request',{p_request_id:String(id)})}catch(_){}if(String(S.requestId)===String(id))S.requestId=null;if(!silent)hide()}
  async function respond(id,ok){
    try{const sid=await rpc('duel_respond_request',{p_request_id:String(id),p_accept:!!ok});S.requestId=null;if(!ok){hide();return}if(!sid)throw Error('La session 1V1 n’a pas été créée.');startSession(String(sid))}catch(e){alert('❌ '+(e.message||'Demande impossible'))}
  }
  async function challenge(friendId){
    await refreshUser();if(!S.user)return alert('❌ Connecte-toi pour faire un 1V1.');
    try{S.requestId=String(await rpc('duel_create_request',{p_friend_id:friendId}));const rows=await requests();const r=rows.find(x=>String(x.id)===S.requestId);requestGui(r||{id:S.requestId,sender_id:S.user.id,receiver_id:friendId,status:'pending',expires_at:new Date(Date.now()+30000).toISOString()})}catch(e){alert('❌ '+(e.message||'Impossible de lancer le 1V1'))}
  }
  window.IR_DUEL_CHALLENGE=challenge
  window.IR_DUEL_CANCEL=()=>{if(S.requestId)cancel(S.requestId)}

  async function setupRealtime(sessionId){
    if(!sb||!sessionId)return;
    await loadUserCharacter();
    if(S.channel&&S.channel.__irSessionId===String(sessionId))return;
    if(S.channel){try{await sb.removeChannel(S.channel)}catch(_){}S.channel=null}
    const channel=sb.channel('ir-duel-'+String(sessionId),{config:{broadcast:{ack:false}}});
    channel.__irSessionId=String(sessionId);
    channel.on('broadcast',{event:'duel_state'},msg=>{
      const p=msg?.payload||{};
      if(String(p.sessionId)!==String(sessionId)||String(p.userId)===String(S.user?.id))return;
      if(p.kind==='pause_offer'){
        showPauseOffer(p.username||'Ton ami',String(p.userId||''));
        return;
      }
      if(p.kind==='pause_accept'){
        applyDuelPause();
        return;
      }
      if(p.kind==='pause_decline'){
        showPauseNotice('❌ Demande de pause refusée.');
        return;
      } 
      if(p.kind==='pause_cancel'){
        hidePauseBox();
        return;
      }
      if(p.kind==='pause_resume'){
        releaseDuelPause();
        return;
      }
      const now=performance.now();
      const d=Number(p.distance);
      const y=Number(p.y);
      if(!Number.isFinite(d))return;
      const previousPacket=S.ghostPacketAt;
      const previousTarget=Number.isFinite(Number(S.ghostTarget))?Number(S.ghostTarget):d;
      const previousTargetY=Number.isFinite(Number(S.ghostTargetY))?Number(S.ghostTargetY):0;
      S.ghostFrom=previousTarget;
      S.ghostFromY=previousTargetY;
      S.ghostTarget=d;
      S.ghostTargetY=Number.isFinite(y)?Math.max(0,Math.min(1,y)):0;
      S.ghostStart=now;
      S.ghostPacketAt=now;
      const packetGap=previousPacket?Math.max(45,Math.min(100,now-previousPacket)):70;
      S.ghostDuration=packetGap;
      S.ghost= d;
      S.ghostSpeed=Number.isFinite(Number(p.speed))?Number(p.speed):420;
      S.opponentY=S.ghostTargetY;
      if(Number.isFinite(Number(p.lives)))S.opponentLives=Math.max(0,Math.floor(Number(p.lives)));
      if(p.action==='jump'||p.action==='dash'||p.action==='run')S.opponentAction=p.action;
      if(p.character)S.opponentCharacter=String(p.character);
    });
    try{await channel.subscribe()}catch(_){}
    S.channel=channel;
  }

  async function broadcastEvent(kind,extra={}){
    if(!S.channel||!S.user||!S.sessionId)return;
    try{
      await S.channel.send({type:'broadcast',event:'duel_state',payload:{sessionId:S.sessionId,userId:S.user.id,kind,username:S.nameMap[S.user.id]||'Ton ami',...extra}});
    }catch(_){}
  }

  async function broadcastOwnState(){
    if(!S.channel||!S.user||!S.sessionId||S.sendBusy)return;
    const G=window.__IR_G;
    if(!G||!G.player)return;
    const p=G.player;
    const y=Number.isFinite(Number(p.y))&&Number.isFinite(Number(p.h))&&Number.isFinite(Number(G.groundY))&&Number.isFinite(Number(G.H))?Math.max(0,Math.min(1,(G.groundY-(p.y+p.h))/G.H)):0;
    S.sendBusy=true;
    try{
      await S.channel.send({type:'broadcast',event:'duel_state',payload:{
        sessionId:S.sessionId,userId:S.user.id,distance:Math.max(0,Number(G.dist||0)),lives:Math.max(0,Number(G.lives||0)),
        y,action:G.dashT>0?'dash':(p.ground?'run':'jump'),character:S.userCharacter||'runner',speed:420
      }});
    }catch(_){ }
    finally{S.sendBusy=false}
  }

  function showPauseNotice(message){
    pauseBox.innerHTML='<h3>⏸️ PAUSE</h3><p>'+esc(message)+'</p>';
    pauseBox.style.display='block';
  }

  function hidePauseBox(){pauseBox.style.display='none';pauseBox.innerHTML=''}

  async function requestDuelPause(){
    if(!S.channel||!window.IR_DUEL_ACTIVE||window.IR_DUEL_PAUSED)return;
    showPauseNotice('⏳ Demande de pause envoyée…');
    pauseBox.innerHTML='<h3>⏸️ Pause proposée</h3><p>Ton adversaire doit accepter ou refuser.</p><div class="pa"><button id="irPauseCancel">ANNULER</button></div>';
    pauseBox.querySelector('#irPauseCancel').onclick=async()=>{hidePauseBox();await broadcastEvent('pause_cancel',{})};
    await broadcastEvent('pause_offer',{});
  }

  function showPauseOffer(name,userId){
    if(userId===String(S.user?.id||''))return;
    pauseBox.innerHTML='<h3>⏸️ Demande de pause</h3><p>'+esc(name)+' te propose de mettre le 1V1 en pause.</p><div class="pa"><button id="irPauseAccept" class="primary">✅ ACCEPTER</button><button id="irPauseDecline">❌ REFUSER</button></div>';
    pauseBox.style.display='block';
    pauseBox.querySelector('#irPauseAccept').onclick=async()=>{
      hidePauseBox();
      applyDuelPause();
      await broadcastEvent('pause_accept',{});
    };
    pauseBox.querySelector('#irPauseDecline').onclick=async()=>{
      hidePauseBox();
      await broadcastEvent('pause_decline',{});
    };
  }

  function applyDuelPause(){
    if(!window.IR_DUEL_PAUSED){
      window.IR_DUEL_PAUSED=true;
      window.dispatchEvent(new CustomEvent('ir:duelPauseApply'));
    }
    pauseBox.innerHTML='<h3>⏸️ DUEL EN PAUSE</h3><p>Les deux joueurs sont en pause.</p><div class="pa"><button id="irPauseResume" class="primary">▶ REPRENDRE</button></div>';
    pauseBox.style.display='block';
    pauseBox.querySelector('#irPauseResume').onclick=async()=>{
      hidePauseBox();
      releaseDuelPause();
      await broadcastEvent('pause_resume',{});
    };
  }

  function releaseDuelPause(){
    if(window.IR_DUEL_PAUSED){
      window.IR_DUEL_PAUSED=false;
      window.dispatchEvent(new CustomEvent('ir:duelPauseRelease'));
    }
    hidePauseBox();
  }

  window.addEventListener('ir:duelPauseRequest',requestDuelPause)


  async function startSession(id){
    const sessionId=String(id||'');
    if(!sessionId)return;
    if(S.sessionId===sessionId && S.sync)return;
    clearTimers();
    S.sessionId=sessionId;
    S.session=null;
    S.shown=null;
    S.ghost=0;
    S.ghostTarget=0;
    S.opponentAction='run';
    S.opponentCharacter='runner';
    S.opponentCharacterLoaded=false;
    await loadUserCharacter();
    S.opponentCharacterLoading=false;
    S.opponentLives=2;
    S.ghostPacketAt=0;
    await setupRealtime(sessionId);
    try{await sync()}catch(_){}
    if(!S.session || S.session.status==='lobby')showLobby();
    S.sync=setInterval(sync,140);
    S.broadcast=setInterval(broadcastOwnState,50)
  }
  async function joinSession(id){
    const sessionId=String(id||'');
    if(!sessionId)return;
    await startSession(sessionId);
  }
  window.IR_DUEL_JOIN_SESSION=joinSession;
  window.addEventListener('ir:duelAccepted',e=>{
    const sid=e?.detail?.sessionId;
    if(sid)joinSession(sid);
  });
  async function loadUserCharacter(){
    if(!S.user)return 'runner';
    try{
      const q=await sb.from('profiles').select('selected_character').eq('id',S.user.id).maybeSingle();
      const picked=q?.data?.selected_character;
      if(picked)S.userCharacter=String(picked);
    }catch(_){}
    if(!S.userCharacter||S.userCharacter==='runner'){
      try{
        const local=JSON.parse(localStorage.getItem('irGuest')||'{}');
        if(local.selected_character)S.userCharacter=String(local.selected_character);
      }catch(_){}
    }
    return S.userCharacter||'runner';
  }

  async function loadOpponentCharacter(s){
    if(S.opponentCharacterLoaded||S.opponentCharacterLoading||!S.user||!s)return;
    const id=otherId(s);
    if(!id)return;
    S.opponentCharacterLoading=true;
    try{
      const q=await sb.from('profiles').select('selected_character').eq('id',id).maybeSingle();
      const picked=q?.data?.selected_character;
      if(picked)S.opponentCharacter=String(picked);
    }catch(_){}
    S.opponentCharacterLoaded=true;
    S.opponentCharacterLoading=false;
  }

  async function sync(){
    if(!S.sessionId)return
    try{const G=window.__IR_G;const d=Math.max(0,Math.floor(Number(G?.dist||0)));const l=Math.max(0,Math.floor(Number(G?.lives||0)));const p=G?.player;const y=Number.isFinite(Number(p?.y))&&Number.isFinite(Number(p?.h))&&Number.isFinite(Number(G?.groundY))&&Number.isFinite(Number(G?.H))?Math.max(0,Math.min(1,(G.groundY-(p.y+p.h))/G.H)):0;const action=G?.dashT>0?'dash':(p&&!p.ground?'jump':'run');const s=await rpc('duel_tick',{p_session_id:S.sessionId,p_distance:d,p_lives:l,p_y:y,p_action:action});if(s)renderSession(s)}catch(e){console.warn('[IR] duel sync',e)}}
  function showLobby(){show(`<div class="dm"><div class="dh"><h2>⚔️ 1V1</h2><button id="leave">✕</button></div><div class="db"><div class="duelCount">2 / 2</div><div class="duelGrid"><div class="duelCard"><h3>👤 Toi</h3><p id="mine">⏳ Pas prêt</p></div><div class="duelCard"><h3>👤 ${otherName(S.session||{})}</h3><p id="opp">⏳ Pas prêt</p></div></div><p class="muted" style="margin-top:14px">Le 1V1 utilise le parcours commun. Prépare-toi puis le duel démarre automatiquement.</p><div class="actions"><button id="ready" class="primary">✅ PRÊT</button><button id="leave2" class="danger">QUITTER</button></div></div></div>`);document.getElementById('ready').onclick=async()=>{try{await rpc('duel_set_choice',{p_session_id:S.sessionId,p_choice:'ready'})}catch(e){alert('❌ '+e.message)}};document.getElementById('leave').onclick=leave;document.getElementById('leave2').onclick=leave}
  async function leave(){try{if(S.sessionId)await rpc('duel_leave',{p_session_id:S.sessionId})}catch(_){}finishToMenu()}
  function renderSession(s){S.session=s;if(s.status==='lobby'){if(S.shown!=='lobby'){S.shown='lobby';showLobby()}const a=document.getElementById('mine'),b=document.getElementById('opp');if(a)a.textContent=(meA(s)?s.choice_a:s.choice_b)==='ready'?'✅ PRÊT':'⏳ Pas prêt';if(b)b.textContent=(meA(s)?s.choice_b:s.choice_a)==='ready'?'✅ PRÊT':'⏳ Pas prêt';return}if(s.status==='countdown'){if(S.shown!=='countdown'){S.shown='countdown';show(`<div class="dm"><div class="db"><div class="duelCount" id="go">3</div><p class="muted" style="text-align:center">⚔️ Le duel va commencer !</p></div></div>`)}const e=document.getElementById('go');if(e)e.textContent=Math.max(1,Math.ceil(remaining(s.phase_deadline)));return}if(s.status==='playing'){if(S.shown!=='playing'){S.shown='playing';layer.style.display='none';window.IR_DUEL_ACTIVE=true;window.IR_DUEL_CONFIG={lives:2,character:otherCharacter(s),seed:Number(s.random_seed)||1};window.IR_DUEL_SET_WORLD_RNG?.(Number(s.random_seed)||1);hud.style.display='block';window.dispatchEvent(new CustomEvent('ir:duelStartGame'))}updateGhost(s);updateHud(s);return}if(s.status==='completed'||s.status==='cancelled'){showResult(s);return}}
  function updateGhost(s){loadOpponentCharacter(s);const now=performance.now();const target=Number(meA(s)?s.distance_b:s.distance_a);const targetY=Number(meA(s)?s.y_b:s.y_a)||0;const remoteLives=Number(meA(s)?s.lives_b:s.lives_a);if(Number.isFinite(remoteLives))S.opponentLives=Math.max(0,Math.floor(remoteLives));if(Number.isFinite(target)&&!S.ghostPacketAt){S.ghostTarget=target;S.ghost=target;S.ghostStart=now;S.ghostPacketAt=now;S.ghostTargetY=targetY;S.ghostFromY=targetY}S.opponentAction=meA(s)?s.action_b:s.action_a;S.opponentY=targetY;const fallback=otherCharacter(s);if(fallback&&fallback!=='runner')S.opponentCharacter=fallback}
  function updateHud(s){const myL=meA(s)?s.lives_a:s.lives_b,opL=meA(s)?s.lives_b:s.lives_a,myD=meA(s)?s.distance_a:s.distance_b,opD=meA(s)?s.distance_b:s.distance_a;hud.innerHTML=`⚔️ ${esc(S.nameMap[otherId(s)]||'Adversaire')} · ❤️ ${myL} / ${opL} · 📏 ${Math.floor(myD)}m / ${Math.floor(opD)}m <span style="opacity:.7">${S.opponentAction==='dash'?'⚡ DASH':S.opponentAction==='jump'?'⬆️ SAUT':'🏃'}</span>`}
  function showResult(s){if(S.shown==='result'&&layer.style.display!=='none')return;S.shown='result';window.IR_DUEL_ACTIVE=false;hud.style.display='none';const mine=meA(s),winner=s.winner_id,win=winner===S.user.id;show(`<div class="dm"><div class="dh"><h2>⚔️ FIN DU 1V1</h2></div><div class="db"><div class="duelResult">${win?'🏆 TU AS GAGNÉ !':winner?'💥 '+otherName(s)+' A GAGNÉ':'🤝 DUEL TERMINÉ'}</div><div class="duelGrid"><div class="duelCard"><b>Toi</b><div>❤️ ${mine?s.lives_a:s.lives_b}</div><div>📏 ${Math.floor(mine?s.distance_a:s.distance_b)} m</div></div><div class="duelCard"><b>${otherName(s)}</b><div>❤️ ${mine?s.lives_b:s.lives_a}</div><div>📏 ${Math.floor(mine?s.distance_b:s.distance_a)} m</div></div></div><p class="muted" style="text-align:center">${esc(s.result_reason||'Partie terminée')}</p><div class="actions"><button class="primary" id="back">RETOUR AUX AMIS</button></div></div></div>`);document.getElementById('back').onclick=finishToMenu}
  function finishToMenu(){window.IR_DUEL_PAUSED=false;clearTimers();S.requestId=null;S.sessionId=null;S.session=null;S.shown=null;window.IR_DUEL_ACTIVE=false;window.IR_DUEL_CONFIG=null;window.__IR_DUEL_SEED=null;window.__IR_DUEL_WORLD_RNG=null;hud.style.display='none';hide();window.dispatchEvent(new CustomEvent('ir:duelExitToMenu'))}
  window.IR_DUEL_GHOST_DRAW=(ctx,W,H,w,G)=>{if(!window.IR_DUEL_ACTIVE||!S.session)return;const now=performance.now();const t=Math.max(0,Math.min(1,(now-(S.ghostStart||now))/(S.ghostDuration||70)));const d=(Number(S.ghostFrom)||0)+((Number(S.ghostTarget)||0)-(Number(S.ghostFrom)||0))*t;const yNorm=(Number(S.ghostFromY)||0)+((Number(S.ghostTargetY)||0)-(Number(S.ghostFromY)||0))*t;const yy=(G.groundY||H*.75)-(yNorm*(G.H||H));const my=Number(G.dist||0);const baseX=Number(G?.player?.x);const safeBaseX=Number.isFinite(baseX)?baseX:Math.floor(W*.28);const px=Math.max(45,Math.min(W-45,safeBaseX+Math.max(-240,Math.min(240,(d-my)*0.85))));const action=S.opponentAction==='jump'?'jump':S.opponentAction==='dash'?'dash':'run';const p={x:px-21,y:yy-62,w:42,h:62,sy:1,ground:action==='run',run:now/1000,inv:0};const fake={...G,dist:d,level:0,goal:1,dashT:action==='dash'?0.18:0,shield:false};ctx.save();ctx.globalAlpha=.62;if(window.IR_CHARACTER_DRAW_SKIN)try{window.IR_CHARACTER_DRAW_SKIN(ctx,w,p,fake,S.opponentCharacter||'runner')}catch(_){ }else{ctx.translate(px,yy);ctx.fillStyle='#ff4fa8';ctx.fillRect(-14,-45,28,45);ctx.fillStyle='#ffd5e9';ctx.beginPath();ctx.arc(0,-58,11,0,Math.PI*2);ctx.fill()}ctx.restore()}
  async function poll(){if(!S.user)return;const rows=await requests();if(S.sessionId)return;const incoming=rows.find(r=>r.status==='pending'&&r.receiver_id===S.user.id);if(incoming){requestGui(incoming);return}}
  async function clearLoginRequests(){
    if(!S.user)return;
    try{
      const r=await sb.rpc('duel_clear_incoming_requests');
      if(!r.error)return;
    }catch(_){}
    try{
      const rows=await requests();
      const stale=(Array.isArray(rows)?rows:[]).filter(r=>r.status==='pending'&&String(r.receiver_id)===String(S.user.id));
      for(const r of stale){try{await rpc('duel_cancel_request',{p_request_id:String(r.id)})}catch(_){}}
    }catch(_){}
  }
  async function boot(){
    await refreshUser();
    if(!S.user)return;
    clearTimers();
    // Let the login cleanup run before the first duel poll, so old requests
    // cannot flash on screen immediately after connecting.
    await new Promise(resolve=>setTimeout(resolve,450));
    if(!S.user)return;
    await clearLoginRequests();
    S.poll=setInterval(poll,700);
    await poll();
  }
  sb?.auth.onAuthStateChange((ev,session)=>{S.user=session?.user||null;if(ev==='SIGNED_IN'||ev==='INITIAL_SESSION'){setTimeout(boot,100)}})
  boot()
})()
