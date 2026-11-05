/* ILLEGAL RUNNER — clear only stale incoming duel requests at login */
(() => {
  'use strict'
  const cfg=window.IR_CONFIG||{}
  if(!window.supabase||!cfg.SUPABASE_URL)return
  const sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY)
  let cleaned=false
  async function clearOnce(){
    if(cleaned)return
    const session=(await sb.auth.getSession()).data?.session
    if(!session?.user)return
    cleaned=true
    try{const {error}=await sb.rpc('duel_clear_incoming_requests');if(error)console.warn('[IR] duel login cleanup:',error)}catch(e){console.warn('[IR] duel login cleanup:',e)}
  }
  sb.auth.onAuthStateChange((event,session)=>{
    if(event==='SIGNED_OUT'){cleaned=false;return}
    if((event==='SIGNED_IN'||event==='INITIAL_SESSION')&&session?.user)setTimeout(clearOnce,0)
  })
  setTimeout(clearOnce,250)
})()
