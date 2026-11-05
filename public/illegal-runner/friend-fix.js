/* ILLEGAL RUNNER — FRIEND / 1V1 UI FIX v7 */
(() => {
  'use strict'
  const cfg=window.IR_CONFIG||{}
  if(!window.supabase||!cfg.SUPABASE_URL)return
  const sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY)
  let cache=[],observer=null,joinWatcher=null
  const rpc=async(name,args={})=>{const r=await sb.rpc(name,args);if(r.error)throw r.error;return r.data}
  async function safePollRequests(){
    try{
      return await safePollRequests()
    }catch(err){
      const msg=String(err?.message||err||'')
      if(!/ambiguous|column reference/i.test(msg))throw err
      const uid=String(window.__IR_AUTH_USER_ID||((await sb.auth.getUser()).data?.user?.id)||'')
      if(!uid)return []
      const q=await sb.from('duel_requests')
        .select('id,sender_id,receiver_id,status,created_at,expires_at')
        .or('sender_id.eq.'+uid+',receiver_id.eq.'+uid)
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
      return rows.map(x=>({...x,session_id:sm.get(String(x.id))||null}))
    }
  }
  const load=async()=>{const session=(await sb.auth.getSession()).data?.session;if(!session?.user)return;window.__IR_AUTH_USER_ID=session.user.id;try{const {data,error}=await sb.rpc('get_my_friends');if(error)throw error;cache=Array.isArray(data)?data:[];inject()}catch(e){console.warn('[IR] friends:',e)}}
  const acceptedFriendId=row=>{const id=row.getAttribute('data-trade-friend-id')||row.dataset.friendId||row.dataset.friendIdValue;const name=(row.querySelector('b,strong')?.textContent||'').trim().toLowerCase();const f=cache.find(x=>x.status==='accepted'&&(String(x.user_id===window.__IR_AUTH_USER_ID?x.friend_id:x.user_id)===String(id)||String(x.friend_username||'').trim().toLowerCase()===name));return f?(f.user_id===window.__IR_AUTH_USER_ID?f.friend_id:f.user_id):null}
  function notifySession(sid){
    const id=String(sid||'');
    if(!id)return;
    window.__IR_ACCEPTED_DUEL_SESSION_ID=id;
    if(typeof window.IR_DUEL_JOIN_SESSION==='function'){
      window.IR_DUEL_JOIN_SESSION(id);
    }else{
      window.dispatchEvent(new CustomEvent('ir:duelAccepted',{detail:{sessionId:id}}));
    }
  }
  function watchAccepted(requestId){if(joinWatcher)clearInterval(joinWatcher);let tries=0;joinWatcher=setInterval(async()=>{tries++;try{const rows=await safePollRequests();const a=(Array.isArray(rows)?rows:[]).find(r=>String(r.id)===String(requestId)&&r.status==='accepted'&&r.session_id);if(a){clearInterval(joinWatcher);joinWatcher=null;notifySession(a.session_id);return}}catch(e){console.warn('[IR] duel join watcher:',e)}if(tries>=90){clearInterval(joinWatcher);joinWatcher=null}},700)}
  async function duelClick(friendId,button){button.disabled=true;const old=button.textContent;button.textContent='⏳ 1V1...';try{const list=await safePollRequests();const rows=Array.isArray(list)?list:[];const incoming=rows.find(r=>r.status==='pending'&&String(r.receiver_id)===String(window.__IR_AUTH_USER_ID)&&String(r.sender_id)===String(friendId));if(incoming){const sid=await rpc('duel_respond_request',{p_request_id:String(incoming.id),p_accept:true});if(!sid)throw new Error('La session 1V1 n’a pas été créée.');notifySession(sid);return}const outgoing=rows.find(r=>r.status==='pending'&&String(r.sender_id)===String(window.__IR_AUTH_USER_ID)&&String(r.receiver_id)===String(friendId));if(outgoing){watchAccepted(outgoing.id);return}const challenge=window.IR_DUEL_CHALLENGE;if(typeof challenge!=='function')throw new Error('Le système 1V1 est encore en chargement.');await challenge(String(friendId));setTimeout(async()=>{try{const after=await safePollRequests();const created=(Array.isArray(after)?after:[]).find(r=>r.status==='pending'&&String(r.sender_id)===String(window.__IR_AUTH_USER_ID)&&String(r.receiver_id)===String(friendId));if(created)watchAccepted(created.id)}catch(e){console.warn('[IR] duel outgoing watcher:',e)}},250)}catch(e){console.error('[IR] duel friend click:',e);alert('❌ '+(e.message||'Impossible de lancer le 1V1'))}finally{button.disabled=false;button.textContent=old}}
  function inject(){const box=document.getElementById('friendList');if(!box)return;for(const row of [...box.querySelectorAll('.friend,[data-trade-friend-id],[data-friend-id]')]){if(row.dataset.irDuelButton==='1'||row.querySelector('[data-ir-duel-button="1"]'))continue;const friendId=acceptedFriendId(row);if(!friendId)continue;const b=document.createElement('button');b.type='button';b.textContent='⚔️ 1V1';b.className='primary';b.dataset.irDuelButton='1';b.style.cssText='margin-left:6px;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;';b.onclick=e=>{e.preventDefault();e.stopPropagation();duelClick(String(friendId),b)};row.appendChild(b);row.dataset.irDuelButton='1'}}
  function watch(){const box=document.getElementById('friendList');if(!box)return;if(observer)observer.disconnect();observer=new MutationObserver(()=>setTimeout(inject,20));observer.observe(box,{childList:true,subtree:true});inject()}
  sb.auth.onAuthStateChange((ev,s)=>{if(s?.user)window.__IR_AUTH_USER_ID=s.user.id;if(ev==='SIGNED_IN'||ev==='INITIAL_SESSION')setTimeout(load,100)})
  setTimeout(async()=>{await load();watch()},500);setInterval(()=>{if(document.getElementById('friends')?.classList.contains('active'))load()},2500)
  const adminScript=document.createElement('script');adminScript.src='admin-personalization.js?v=1';document.head.appendChild(adminScript)
})()
