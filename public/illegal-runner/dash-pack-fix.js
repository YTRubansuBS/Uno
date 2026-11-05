(() => {
  'use strict'

  const DASH_STYLES = [
    ['classic','⚡','CLASSIC','common'],['flame','🔥','FLAME','common'],['ice','❄️','ICE','common'],['thunder','⚡','THUNDER','common'],['toxic','☢️','TOXIC','common'],['neon','💠','NEON','common'],['rainbow','🌈','RAINBOW','common'],['galaxy','🌌','GALAXY','common'],['cosmic','☄️','COSMIC','common'],['void','🕳️','VOID','common'],
    ['shadow','🌑','SHADOW','uncommon'],['plasma','🔮','PLASMA','uncommon'],['electric','⚡','ELECTRIC','uncommon'],['inferno','🌋','INFERNO','uncommon'],['frost','🧊','FROST','uncommon'],['aqua','🌊','AQUA','uncommon'],['nature','🌿','NATURE','uncommon'],['wind','💨','WIND','uncommon'],
    ['star','⭐','STAR','rare'],['moon','🌙','MOON','rare'],['sun','☀️','SUN','rare'],['crystal','💎','CRYSTAL','rare'],['golden','🪙','GOLDEN','rare'],['royal','👑','ROYAL','rare'],
    ['dragon','🐉','DRAGON','epic'],['phoenix','🔥','PHOENIX','epic'],['cyber','💻','CYBER','epic'],['glitch','👾','GLITCH','epic'],
    ['portal','🌀','PORTAL','legendary'],['matrix','🟩','MATRIX','legendary'],['pink','💗','PINK','legendary'],
    ['quantum','⚛️','QUANTUM','mythic'],['infinite','♾️','INFINITE','mythic'],['secret','🔐','SECRET','secret']
  ]
  const CHANCES={common:50,uncommon:25,rare:15,epic:7,legendary:2,mythic:.9,secret:.1}
  const cfg=window.IR_CONFIG||{}
  let sb=null
  let busy=false

  function client(){
    if(sb)return sb
    if(!window.supabase||!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY)return null
    sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY)
    return sb
  }
  function toast(msg){const e=document.getElementById('toast');if(e){e.textContent=msg;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2200)}}
  function rarity(){
    let n=Math.random()*100
    for(const r of ['common','uncommon','rare','epic','legendary','mythic','secret']){n-=CHANCES[r];if(n<=0)return r}
    return 'common'
  }
  function guest(){return (document.getElementById('userBadge')?.textContent||'').toLowerCase().includes('local')}
  function collectionKey(id){return 'irCollection_guest_dash'}
  function loadGuest(){try{return JSON.parse(localStorage.getItem(collectionKey())||'{}')}catch{return {}}}
  function saveGuest(x){localStorage.setItem(collectionKey(),JSON.stringify(x))}
  function guestProfile(){try{return JSON.parse(localStorage.getItem('irGuest')||'{}')}catch{return {}}}
  function saveGuestProfile(p){localStorage.setItem('irGuest',JSON.stringify(p))}
  function result(item,r,count){
    toast('🎁 '+item[2]+' — '+r.toUpperCase()+' !')
    const root=document.getElementById('customPacks')
    if(!root)return
    let box=document.getElementById('packResult')
    if(!box){box=document.createElement('div');box.id='packResult';root.appendChild(box)}
    box.style.display='block';box.style.marginTop='16px';box.style.padding='14px';box.style.border='2px solid #00e5ff';box.style.borderRadius='16px';box.style.background='rgba(0,40,80,.92)'
    box.innerHTML='<b style="font-size:22px">'+item[1]+' '+item[2]+'</b><div style="margin-top:6px">⚡ PACK DASH · '+r.toUpperCase()+'</div><div style="margin-top:6px">'+(count>1?'DOUBLON · x'+count:'NOUVEAU !')+'</div>'
  }

  async function buyDash(){
    if(busy)return
    busy=true
    try{
      const cost=1000
      const r=rarity()
      const candidates=DASH_STYLES.filter(x=>x[3]===r)
      const item=candidates[Math.floor(Math.random()*candidates.length)]
      if(guest()){
        const p=guestProfile();const coins=Number(p.coins||0)
        if(coins<cost){toast('❌ Pas assez de pièces.');return}
        p.coins=coins-cost;saveGuestProfile(p)
        const data=loadGuest();data[item[0]]=Number(data[item[0]]||0)+1;saveGuest(data)
        const coinsEl=document.getElementById('coins');if(coinsEl)coinsEl.textContent=String(p.coins)
        result(item,r,data[item[0]])
        return
      }
      const s=client();if(!s){toast('❌ Cloud indisponible.');return}
      const {data:{user},error:userError}=await s.auth.getUser()
      if(userError||!user){toast('❌ Reconnecte-toi.');return}
      const prof=await s.from('profiles').select('coins').eq('id',user.id).single()
      if(prof.error||!prof.data){toast('❌ Impossible de lire tes pièces.');return}
      const coins=Number(prof.data.coins||0)
      if(coins<cost){toast('❌ Pas assez de pièces.');return}
      const inserted=await s.from('inventory').insert({user_id:user.id,item_type:'dash',item_id:item[0]})
      if(inserted.error){
        console.error('[IR] dash inventory:',inserted.error)
        toast('❌ Le pack Dash n’a pas pu être enregistré.')
        return
      }
      const updated=await s.from('profiles').update({coins:coins-cost}).eq('id',user.id)
      if(updated.error){
        console.error('[IR] dash coins:',updated.error)
        await s.from('inventory').delete().eq('user_id',user.id).eq('item_type','dash').eq('item_id',item[0]).limit(1)
        toast('❌ Achat impossible, tes pièces restent intactes.')
        return
      }
      const coinsEl=document.getElementById('coins');if(coinsEl)coinsEl.textContent=String(coins-cost)
      const existing=await s.from('inventory').select('item_id').eq('user_id',user.id).eq('item_type','dash').eq('item_id',item[0])
      result(item,r,existing.data?.length||1)
      setTimeout(()=>location.reload(),900)
    }finally{busy=false}
  }

  function bind(){
    document.addEventListener('click',e=>{
      const btn=e.target?.closest?.('.pack-buy[data-pack="dash"]')
      if(!btn)return
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()
      buyDash()
    },true)
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind()
})()
