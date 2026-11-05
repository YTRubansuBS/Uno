(() => {
  'use strict'
  const $ = id => document.getElementById(id)
  const WORLDS = {
    city:{emoji:'🌃',name:'CITY',desc:'Ville cyberpunk'}, forest:{emoji:'🌲',name:'FOREST',desc:'Forêt néon'}, desert:{emoji:'🏜️',name:'DESERT',desc:'Désert synthwave'}, space:{emoji:'🚀',name:'SPACE',desc:'Station spatiale'}, dark:{emoji:'🌑',name:'DARK',desc:'Dimension sombre'}, volcano:{emoji:'🌋',name:'VOLCANO',desc:'Coeur du volcan'}, ice:{emoji:'❄️',name:'ICE',desc:'Banquise glacée'}
  }
  const CHARS = {runner:{emoji:'🧑',name:'RUNNER'},ninja:{emoji:'🥷',name:'NINJA'},robot:{emoji:'🤖',name:'ROBOT'},ghost:{emoji:'👻',name:'GHOST'},cyber:{emoji:'🦾',name:'CYBER'}}
  const OBS = {classic:{emoji:'🔺',name:'CLASSIC'},tech:{emoji:'🧱',name:'TECH'},drone:{emoji:'🚁',name:'DRONES'},energy:{emoji:'⚡',name:'ENERGY'},chaos:{emoji:'☠️',name:'CHAOS'}}
  const COINS = {gold:{emoji:'🪙',name:'GOLD'},diamond:{emoji:'💎',name:'DIAMOND'},ruby:{emoji:'🔴',name:'RUBY'},emerald:{emoji:'🟢',name:'EMERALD'},neon:{emoji:'💠',name:'NEON'}}
  const COSTS={world:1000,character:1000,coin:1000,dash:1000,reward:500}
  const REWARD_MIN=200, REWARD_MAX=850
  const cfg=window.IR_CONFIG||{}
  const sb=window.supabase&&cfg.SUPABASE_URL?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null
  let cloudUser=null,cloudInventory=null,cloudProfile=null,cloudSelectedCoin='gold',cloudDashInventory={},buying=false
  let buyCooldownUntil=0
  let lastPackResult=null
  const localProfile=()=>{try{const p=JSON.parse(localStorage.getItem('irGuest')||'{}');if(!Array.isArray(p.owned_coins)||!p.owned_coins.length)p.owned_coins=['gold'];if(!p.selected_coin)p.selected_coin='gold';return p}catch{return {owned_coins:['gold'],selected_coin:'gold'}}}
  const saveLocal=p=>localStorage.setItem('irGuest',JSON.stringify(p))
  const guestMode=()=>($('userBadge')?.textContent||'').includes('local')
  const toast=t=>{const e=$('toast');if(!e)return;e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1900)}
  const refreshCoins=n=>{if(n!==undefined&&$('coins'))$('coins').textContent=String(n)}
  const notifyProfile=p=>window.dispatchEvent(new CustomEvent('ir:profileChanged',{detail:p}))
  let profileSaveChain=Promise.resolve()
  const profileFields=['coins','best_distance','total_distance','highest_level','lives_level','distance_level','dash_level','jump_level','coin_level','bonus_level','bonus_shield_level','bonus_mega_level','bonus_x2_level','bonus_jetpack_level','bonus_scoreDouble_level','bonus_magnet_level','daily_login_streak','last_login_reward','quest_distance','quest_coins','quest_games','quest_distance_claimed','quest_coins_claimed','quest_games_claimed','last_quest_reset','selected_background','selected_character','selected_obstacle_set']
  const persistProfilePatch=patch=>{
    if(guestMode()||!sb||!cloudUser||!patch||typeof patch!=='object')return
    const clean={}
    for(const key of profileFields)if(Object.prototype.hasOwnProperty.call(patch,key))clean[key]=patch[key]
    if(!Object.keys(clean).length)return
    const uid=cloudUser.id
    // Queue writes so a fast sequence of purchases/upgrades cannot race and
    // overwrite a newer value with an older request.
    profileSaveChain=profileSaveChain.then(async()=>{
      try{
        const {error}=await sb.from('profiles').update(clean).eq('id',uid)
        if(error)throw error
      }catch(e){console.error('[IR] profile save:',e)}
    })
  }
  window.IR_FLUSH_PROFILE_SAVES=async()=>{
    try{await profileSaveChain}catch(e){console.error('[IR] profile save flush:',e)}
  }
  window.addEventListener('ir:profileChanged',e=>persistProfilePatch(e.detail||{}))
  const coinStorageKey=uid=>'irSelectedCoin_'+uid
  const getSelectedCloudCoin=uid=>cloudSelectedCoin||(()=>{try{return localStorage.getItem(coinStorageKey(uid))||'gold'}catch{return 'gold'}})()
  const setSelectedCloudCoin=(uid,id)=>{cloudSelectedCoin=id;try{localStorage.setItem(coinStorageKey(uid),id)}catch{}}
  const notifyCustomization=(type,id)=>window.dispatchEvent(new CustomEvent('ir:customizationChanged',{detail:type==='world'?{selected_background:id}:type==='character'?{selected_character:id}:type==='coin'?{selected_coin:id}:type==='dash'?{selected_dash:id}:{selected_obstacle_set:id}}))
  async function getCloud(){
    if(!sb||guestMode()){cloudUser=null;cloudInventory=null;cloudProfile=null;cloudSelectedCoin='gold';cloudDashInventory={};return false}
    const {data:{user}}=await sb.auth.getUser()
    cloudUser=user
    if(!user){cloudInventory=[];cloudProfile=null;cloudSelectedCoin='gold';cloudDashInventory={};return false}
    const [invQ,profQ]=await Promise.all([
      sb.from('inventory').select('item_type,item_id').eq('user_id',user.id),
      sb.from('profiles').select('selected_background,selected_character,selected_obstacle_set').eq('id',user.id).maybeSingle()
    ])
    if(invQ.error){
      console.error('[IR] inventory load:',invQ.error)
      cloudInventory=null
    }else{
      cloudInventory=invQ.data||[]
    }
    if(profQ.error){
      console.error('[IR] profile customization load:',profQ.error)
      cloudProfile=cloudProfile||{}
    }else{
      cloudProfile=profQ.data||{}
    }
    const rawDashInventory=user.user_metadata?.ir_dash_inventory
    cloudDashInventory=rawDashInventory&&typeof rawDashInventory==='object'&&!Array.isArray(rawDashInventory)?rawDashInventory:{}
    syncCloudCollections()
    cloudSelectedCoin=String(user.user_metadata?.selected_coin||'').trim()||(()=>{try{return localStorage.getItem(coinStorageKey(user.id))||'gold'}catch{return 'gold'}})()
    const selectedDash=String(user.user_metadata?.selected_dash||'').trim()
    if(selectedDash){
      try{localStorage.setItem('irSelectedDash_'+user.id,selectedDash)}catch{}
      cloudProfile.selected_dash=selectedDash
    }
    try{localStorage.setItem(coinStorageKey(user.id),cloudSelectedCoin)}catch{}
    cloudProfile.selected_coin=cloudSelectedCoin
    return true
  }
  const owned=(type,id,p)=>type==='world'?(p.owned_worlds||['city']).includes(id):type==='character'?(p.owned_characters||['runner']).includes(id):type==='coin'?(p.owned_coins||['gold']).includes(id):(p.owned_obstacles||['classic']).includes(id)
  const cloudInventoryTypes=type=>type==='world'?['background','world']:type==='character'?['character']:type==='coin'?['obstacle','coin']:type==='dash'?['dash']:['obstacle']
  const cloudOwned=(type,id)=>{if(type==='dash')return Number(cloudDashInventory?.[id]||0)>0;if((type==='world'&&id==='city')||(type==='character'&&id==='runner')||(type==='coin'&&id==='gold')||(type==='obstacle'&&id==='classic'))return true;const allowed=cloudInventoryTypes(type);return !!cloudInventory?.some(x=>allowed.includes(String(x.item_type))&&String(x.item_id)===String(id))}
  const syncCloudCollections=()=>{
    if(!cloudUser||!Array.isArray(cloudInventory))return
    for(const type of ['world','character','coin','obstacle']){
      const data=loadCollection(cloudUser.id,type)
      const cards=rarityCards(type)
      const ids=new Set(cards.map(x=>String(x.id)))
      let changed=false
      for(const row of cloudInventory){
        const itemType=String(row.item_type||'')
        const itemId=String(row.item_id||'')
        if(!cloudInventoryTypes(type).includes(itemType)||!ids.has(itemId))continue
        const before=Number(data[itemId]||0)
        data[itemId]=Math.max(before,1)
        if(data[itemId]!==before)changed=true
      }
      if(changed)saveCollection(cloudUser.id,type,data)
    }
    if(cloudDashInventory&&typeof cloudDashInventory==='object'){
      const data=loadCollection(cloudUser.id,'dash')
      let changed=false
      for(const [id,count] of Object.entries(cloudDashInventory)){
        const before=Number(data[id]||0), next=Math.max(before,Number(count||0))
        if(next!==before){data[id]=next;changed=true}
      }
      if(changed)saveCollection(cloudUser.id,'dash',data)
    }
  }

  async function saveCloudOwnership(userId,type,id){
    if(!sb||!userId)return false
    if(type==='dash'){
      const next={...(cloudDashInventory||{})}
      next[id]=Number(next[id]||0)+1
      const {data,error}=await sb.auth.updateUser({data:{...((cloudUser&&cloudUser.user_metadata)||{}),ir_dash_inventory:next}})
      if(error)return false
      cloudDashInventory=next
      if(cloudUser)cloudUser={...cloudUser,user_metadata:{...(cloudUser.user_metadata||{}),...(data?.user?.user_metadata||{}),ir_dash_inventory:next}}
      return true
    }
    if(cloudOwned(type,id))return true
    const types=cloudInventoryTypes(type)
    for(const itemType of types){
      const payload={user_id:userId,item_type:itemType,item_id:id}
      const ins=await sb.from('inventory').insert(payload)
      if(!ins.error){
        cloudInventory=[...(cloudInventory||[]),payload]
        return true
      }
      // A duplicate/RLS race should not turn a successful pack into an error.
      try{
        const check=await sb.from('inventory').select('item_type,item_id').eq('user_id',userId).eq('item_type',itemType).eq('item_id',id).limit(1)
        if(!check.error&&Array.isArray(check.data)&&check.data.length){
          cloudInventory=[...(cloudInventory||[]),...check.data]
          return true
        }
      }catch(e){}
    }
    return false
  }
  async function isOwned(type,id){
    if(guestMode())return owned(type,id,localProfile())||Number(loadCollection('guest',type)[id]||0)>0
    if(!cloudInventory)await getCloud()
    return cloudOwned(type,id)||Number(loadCollection(cloudUser?.id||'guest',type)[id]||0)>0
  }
  async function equip(type,id){
    if(!(await isOwned(type,id)))return toast('🔒 Objet non débloqué. Ouvre un pack !')
    if(guestMode()){
      const p=localProfile();
      if(type==='world')p.selected_background=id;
      if(type==='character')p.selected_character=id;
      if(type==='obstacle')p.selected_obstacle_set=id;
      if(type==='coin')p.selected_coin=id;
      if(type==='dash'){try{localStorage.setItem('irSelectedDash_guest',id)}catch{}}
      if(type==='world')p.owned_worlds=Array.from(new Set([...(p.owned_worlds||[]),id]));
      if(type==='character')p.owned_characters=Array.from(new Set([...(p.owned_characters||[]),id]));
      if(type==='coin')p.owned_coins=Array.from(new Set([...(p.owned_coins||[]),id]));
      saveLocal(p);notifyCustomization(type,id);notifyProfile(p)
    } else if(cloudUser){
      if(type==='dash'){
        try{localStorage.setItem('irSelectedDash_'+cloudUser.id,id)}catch{}
        const {error}=await sb.auth.updateUser({data:{...((cloudUser&&cloudUser.user_metadata)||{}),selected_dash:id}})
        if(error)return toast('❌ Impossible d’enregistrer le Dash.')
        if(!cloudProfile)cloudProfile={}
        cloudProfile.selected_dash=id
        notifyCustomization(type,id)
      } else if(type==='coin'){
        const {error}=await sb.auth.updateUser({data:{...((cloudUser&&cloudUser.user_metadata)||{}),selected_coin:id}})
        if(error)return toast('❌ Impossible d’enregistrer la pièce.')
        setSelectedCloudCoin(cloudUser.id,id)
        if(!cloudProfile)cloudProfile={}
        cloudProfile.selected_coin=id
        notifyCustomization(type,id)
      } else {const field={world:'selected_background',character:'selected_character',obstacle:'selected_obstacle_set'}[type]
      const {error}=await sb.from('profiles').update({[field]:id}).eq('id',cloudUser.id)
      if(error)return toast('❌ Impossible d’équiper.')
      if(!cloudProfile)cloudProfile={}
      cloudProfile[field]=id
      notifyCustomization(type,id)}
    }
    toast('✅ '+(type==='world'?'Monde':type==='character'?'Personnage':type==='coin'?'Pièce':'Dash')+' équipé !')
    await renderCustomizer()
  }
  async function autoEquip(type,id,p){
    if(!id)return
    if(guestMode()){
      if(type==='world')p.selected_background=id
      if(type==='character')p.selected_character=id
      if(type==='obstacle')p.selected_obstacle_set=id
      if(type==='coin')p.selected_coin=id
      saveLocal(p)
      notifyCustomization(type,id)
      notifyProfile(p)
      return
    }
    if(cloudUser){
      if(type==='coin'){
        const {error}=await sb.auth.updateUser({data:{...((cloudUser&&cloudUser.user_metadata)||{}),selected_coin:id}})
        if(!error){setSelectedCloudCoin(cloudUser.id,id);if(!cloudProfile)cloudProfile={};cloudProfile.selected_coin=id;notifyCustomization(type,id)}
      } else {
        const field={world:'selected_background',character:'selected_character',obstacle:'selected_obstacle_set'}[type]
        const {error}=await sb.from('profiles').update({[field]:id}).eq('id',cloudUser.id)
        if(!error){
          if(!cloudProfile)cloudProfile={}
          cloudProfile[field]=id
          notifyCustomization(type,id)
        }
      }
    }
  }
  function showPackResult(html,good=true){
    const root=$('customPacks');if(!root)return
    let box=$('packResult')
    if(!box){box=document.createElement('div');box.id='packResult';root.appendChild(box)}
    box.style.display='block'
    box.style.marginTop='16px'
    box.style.padding='12px'
    box.style.border='2px solid rgba(0,229,255,.9)'
    box.style.borderRadius='16px'
    box.style.background='linear-gradient(135deg,rgba(0,120,255,.28),rgba(0,30,70,.96) 55%,rgba(3,8,18,.98))'
    box.style.boxShadow='0 0 28px rgba(0,160,255,.28), inset 0 0 24px rgba(0,229,255,.08)'
    box.style.textAlign='left'
    box.style.overflow='hidden'
    box.style.transform='none'
    box.style.animation='none'
    lastPackResult={html,good}
    box.innerHTML='<div style="display:flex;align-items:center;gap:12px">'+
      '<div style="min-width:78px;width:78px;height:78px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,#087cff,#063d92);border:2px solid #49d8ff;box-shadow:0 0 22px rgba(0,190,255,.42);font-size:44px;flex:none">'+
      (good?'🎁':'❌')+
      '</div>'+
      '<div style="min-width:0;flex:1">'+
      '<div style="font-size:11px;letter-spacing:1.4px;color:#8fe9ff;font-weight:900;margin-bottom:3px">'+(good?'OBJET OBTENU':'ACHAT IMPOSSIBLE')+'</div>'+
      '<div style="font-weight:1000;font-size:16px;margin-bottom:4px">'+html+'</div>'+
      '</div>'+
      '</div>'
    // Do not scroll or otherwise move the page when a pack is opened.
  }
  function packName(type){return type==='world'?'PACK MONDE':type==='character'?'PACK PERSONNAGE':type==='coin'?'PACK PIÈCES':'PACK RÉCOMPENSE'}

  const RARITIES = {
    common:{name:'COMMUN',chance:50,sell:100,icon:'⚪'},
    uncommon:{name:'PEU COMMUN',chance:25,sell:250,icon:'🟢'},
    rare:{name:'RARE',chance:15,sell:500,icon:'🔵'},
    epic:{name:'ÉPIQUE',chance:7,sell:1000,icon:'🟣'},
    legendary:{name:'LÉGENDAIRE',chance:2,sell:5000,icon:'🟠'},
    mythic:{name:'MYTHIQUE',chance:0.9,sell:7500,icon:'🔴'},
    secret:{name:'SECRET',chance:0.1,sell:10000,icon:'🌈'}
  }
  const DASH_STYLES=[
    ['classic','⚡','CLASSIC','common'],['flame','🔥','FLAME','common'],['ice','❄️','ICE','common'],['thunder','⚡','THUNDER','common'],['toxic','☢️','TOXIC','common'],['neon','💠','NEON','common'],['rainbow','🌈','RAINBOW','common'],['galaxy','🌌','GALAXY','common'],['cosmic','☄️','COSMIC','common'],['void','🕳️','VOID','common'],
    ['shadow','🌑','SHADOW','uncommon'],['plasma','🔮','PLASMA','uncommon'],['electric','⚡','ELECTRIC','uncommon'],['inferno','🌋','INFERNO','uncommon'],['frost','🧊','FROST','uncommon'],['aqua','🌊','AQUA','uncommon'],['nature','🌿','NATURE','uncommon'],['wind','💨','WIND','uncommon'],
    ['star','⭐','STAR','rare'],['moon','🌙','MOON','rare'],['sun','☀️','SUN','rare'],['crystal','💎','CRYSTAL','rare'],['golden','🪙','GOLDEN','rare'],['royal','👑','ROYAL','rare'],
    ['dragon','🐉','DRAGON','epic'],['phoenix','🔥','PHOENIX','epic'],['cyber','💻','CYBER','epic'],['glitch','👾','GLITCH','epic'],
    ['portal','🌀','PORTAL','legendary'],['matrix','🟩','MATRIX','legendary'],['pink','💗','PINK','legendary'],
    ['quantum','⚛️','QUANTUM','mythic'],['infinite','♾️','INFINITE','mythic'],
    ['secret','🔐','SECRET','secret']
  ]
  const RARITY_ORDER=['common','uncommon','rare','epic','legendary','mythic','secret']
  const PACK_CATALOG={
    world:[
      ['city','🌃','CITY'],['forest','🌲','FOREST'],['desert','🏜️','DESERT'],['space','🚀','SPACE'],['dark','🌑','DARK'],['volcano','🌋','VOLCANO'],['ice','❄️','ICE'],['neon','🌌','NEON'],['ocean','🌊','OCEAN'],['sky','☁️','SKY'],
      ['sunset','🌇','SUNSET'],['jungle','🌴','JUNGLE'],['candy','🍬','CANDY'],['lava','🔥','LAVA'],['moon','🌙','MOON'],['storm','⛈️','STORM'],['cyber','💻','CYBER'],['crystal','💎','CRYSTAL'],['toxic','☢️','TOXIC'],['void','🕳️','VOID'],
      ['aurora','🌌','AURORA'],['matrix','🟩','MATRIX'],['rainbow','🌈','RAINBOW'],['galaxy','🌠','GALAXY'],['temple','🏛️','TEMPLE'],['castle','🏰','CASTLE'],['volcanic','🌋','VOLCANIC'],['quantum','⚛️','QUANTUM'],['dream','💫','DREAM'],['glitch','👾','GLITCH'],
      ['dragon','🐉','DRAGON'],['portal','🌀','PORTAL'],['cosmic','☄️','COSMIC'],['secret','🗝️','SECRET']
    ],
    character:[
      ['runner','🧑','RUNNER'],['ninja','🥷','NINJA'],['robot','🤖','ROBOT'],['ghost','👻','GHOST'],['cyber','🦾','CYBER'],['pilot','🧑‍✈️','PILOT'],['soldier','🪖','SOLDIER'],['wizard','🧙','WIZARD'],['astronaut','🧑‍🚀','ASTRONAUT'],['skater','🛹','SKATER'],
      ['samurai','👺','SAMURAI'],['pirate','🏴‍☠️','PIRATE'],['detective','🕵️','DETECTIVE'],['vampire','🧛','VAMPIRE'],['zombie','🧟','ZOMBIE'],['alien','👽','ALIEN'],['king','🤴','KING'],['queen','👸','QUEEN'],['knight','🛡️','KNIGHT'],['racer','🏎️','RACER'],
      ['dragon','🐉','DRAGON'],['phoenix','🔥','PHOENIX'],['shadow','🌑','SHADOW'],['thunder','⚡','THUNDER'],['ice','❄️','ICE'],['flame','🔥','FLAME'],['cosmic','🌌','COSMIC'],['cyborg','🤖','CYBORG'],['reaper','💀','REAPER'],['angel','😇','ANGEL'],
      ['demon','😈','DEMON'],['time','⏳','TIME'],['void','🕳️','VOID'],['secret','👁️','SECRET']
    ],
    coin:[
      ['gold','🪙','GOLD'],['silver','🥈','SILVER'],['bronze','🥉','BRONZE'],['blue','🔵','BLUE'],['green','🟢','GREEN'],['red','🔴','RED'],['pink','🩷','PINK'],['orange','🟠','ORANGE'],['purple','🟣','PURPLE'],['white','⚪','WHITE'],
      ['diamond','💎','DIAMOND'],['emerald','💚','EMERALD'],['ruby','❤️','RUBY'],['sapphire','🔷','SAPPHIRE'],['amethyst','🟪','AMETHYST'],['topaz','🔶','TOPAZ'],['pearl','🦪','PEARL'],['crystal','🔮','CRYSTAL'],['neon','💠','NEON'],['star','⭐','STAR'],
      ['moon','🌙','MOON'],['sun','☀️','SUN'],['fire','🔥','FIRE'],['ice','❄️','ICE'],['thunder','⚡','THUNDER'],['rainbow','🌈','RAINBOW'],['galaxy','🌌','GALAXY'],['cosmic','☄️','COSMIC'],['void','🕳️','VOID'],['crown','👑','CROWN'],
      ['dragon','🐉','DRAGON'],['glitch','👾','GLITCH'],['infinite','♾️','INFINITE'],['secret','🔐','SECRET']
    ]
  }
  const rarityForIndex=i=>i<10?'common':i<18?'uncommon':i<24?'rare':i<28?'epic':i<31?'legendary':i<33?'mythic':'secret'
  window.IR_PACK_CATALOG=PACK_CATALOG
  const packKey=type=>type==='coin'?'coin':type
  const collectionKey=(uid,type)=>'irRarityCollection_'+uid+'_'+type
  const loadCollection=(uid,type)=>{
    try{
      const raw=localStorage.getItem(collectionKey(uid,type))
      const obj=raw?JSON.parse(raw):{}
      return obj&&typeof obj==='object'?obj:{}
    }catch{return {}}
  }
  const saveCollection=(uid,type,obj)=>{try{localStorage.setItem(collectionKey(uid,type),JSON.stringify(obj));window.dispatchEvent(new CustomEvent('ir:collectionChanged',{detail:{uid,type,data:obj}}))}catch{}}
  const collectionUid=()=>guestMode()?'guest':(cloudUser?.id||'guest')
  const weightedRarity=()=>{
    const r=Math.random()*100, cuts=[[50,'common'],[25,'uncommon'],[15,'rare'],[7,'epic'],[2,'legendary'],[0.9,'mythic'],[0.1,'secret']]
    let n=0
    for(const [w,id] of cuts){n+=w;if(r<n)return id}
    return 'secret'
  }
  const rarityStyle=id=>({
    common:'border:2px solid #9aa0a6;background:rgba(154,160,166,.12)',
    uncommon:'border:2px solid #48d597;background:rgba(72,213,151,.12)',
    rare:'border:2px solid #4da6ff;background:rgba(77,166,255,.12)',
    epic:'border:2px solid #b56cff;background:rgba(181,108,255,.12)',
    legendary:'border:2px solid #ff9f43;background:rgba(255,159,67,.12)',
    mythic:'border:2px solid #ff4d6d;background:rgba(255,77,109,.12)',
    secret:'border:2px solid #00e5ff;background:linear-gradient(135deg,rgba(0,229,255,.12),rgba(255,0,200,.12))'
  }[id]||'')
  const rarityCards=type=>type==='dash'?DASH_STYLES.map(x=>({id:x[0],emoji:x[1],name:x[2],rarity:x[3]})):PACK_CATALOG[type].map((x,i)=>({id:x[0],emoji:x[1],name:x[2],rarity:rarityForIndex(i)}))
  const packLabel=type=>type==='world'?'PACK MONDE':type==='character'?'PACK PERSONNAGE':'PACK PIÈCES'
  const displayCollection=(type)=>{
    const uid=collectionUid(), data=loadCollection(uid,type), cards=rarityCards(type)
    const current=type==='world'?(guestMode()?(localProfile().selected_background||'city'):(cloudProfile?.selected_background||'city')):type==='character'?(guestMode()?(localProfile().selected_character||'runner'):(cloudProfile?.selected_character||'runner')):type==='coin'?(guestMode()?(localProfile().selected_coin||'gold'):getSelectedCloudCoin(cloudUser?.id||'guest')):''
    return RARITY_ORDER.map(r=>{
      const list=cards.filter(x=>x.rarity===r)
      return '<div class="custom-section ir-rarity-section" style="margin:18px 0;padding:14px;border-radius:16px;'+rarityStyle(r)+'"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px"><h3 style="margin:0">'+RARITIES[r].icon+' '+RARITIES[r].name+'</h3><span class="muted" style="font-size:12px">'+RARITIES[r].chance+'% · vente '+RARITIES[r].sell.toLocaleString('fr-FR')+' 🪙</span></div><div class="grid">'+list.map(x=>{
        const n=Number(data[x.id]||0), equipped=current===x.id
        const action=equipped
          ? '<button type="button" disabled aria-label="Objet actuellement équipé" style="width:100%;opacity:1;cursor:default;border:2px solid #19ff88;background:linear-gradient(180deg,rgba(25,255,136,.22),rgba(25,255,136,.08));color:#19ff88;font-weight:1000;letter-spacing:.5px;box-shadow:0 0 14px rgba(25,255,136,.22)">✓ ÉQUIPÉ</button>'
          : (n ? '<button type="button" data-equip-type="'+type+'" data-equip-id="'+x.id+'" style="width:100%;font-weight:1000;letter-spacing:.5px">ÉQUIPER</button>' : '<button type="button" disabled style="width:100%;opacity:.38;cursor:not-allowed">🔒 VERROUILLÉ</button>')
        const sell=n?'<button type="button" data-sell-type="'+type+'" data-sell-id="'+x.id+'">VENDRE +'+RARITIES[r].sell.toLocaleString('fr-FR')+' 🪙</button>':''
return '<div class="card" style="'+rarityStyle(r)+';position:relative;overflow:hidden;min-height:170px"><div style="position:absolute;top:8px;right:8px;font-size:11px;font-weight:900;opacity:.8">'+(n?'x'+n:'🔒')+'</div><div class="emoji" style="font-size:42px;margin-top:8px">'+x.emoji+'</div><h3 style="margin:6px 0">'+x.name+'</h3><p class="muted" style="margin:4px 0 12px">'+(n?RARITIES[r].name:'Pas encore obtenu')+'</p>'+(n?'<div style="display:flex;flex-direction:column;gap:6px">'+action+sell+'</div>':'')+'</div>'
      }).join('')+'</div></div>'
    }).join('')
  }


  function displayDashStyles(){
    const uid=collectionUid(), data=loadCollection(uid,'dash')
    let current=''
    try{current=localStorage.getItem('irSelectedDash_'+uid)||''}catch{}
    return RARITY_ORDER.map(r=>{
      const list=DASH_STYLES.filter(x=>x[3]===r)
      if(!list.length)return ''
      return '<div class="custom-section ir-rarity-section" style="margin:18px 0;padding:14px;border-radius:16px;'+rarityStyle(r)+'"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px"><h3 style="margin:0">'+RARITIES[r].icon+' '+RARITIES[r].name+'</h3><span class="muted" style="font-size:12px">'+RARITIES[r].chance+'%</span></div><div class="grid">'+list.map(x=>{
        const n=Number(data[x[0]]||0), equipped=current===x[0]
        const action=equipped
          ? '<button type="button" disabled style="width:100%;opacity:1;cursor:default;border:2px solid #19ff88;background:linear-gradient(180deg,rgba(25,255,136,.22),rgba(25,255,136,.08));color:#19ff88;font-weight:1000;box-shadow:0 0 14px rgba(25,255,136,.22)">✓ ÉQUIPÉ</button>'
          : (n ? '<button type="button" data-equip-type="dash" data-equip-id="'+x[0]+'" style="width:100%;font-weight:1000">ÉQUIPER</button>' : '<button type="button" disabled style="width:100%;opacity:.38;cursor:not-allowed">🔒 VERROUILLÉ</button>')
        const sell=n?'<button type="button" data-sell-type="dash" data-sell-id="'+x[0]+'">VENDRE +'+RARITIES[r].sell.toLocaleString('fr-FR')+' 🪙</button>':''
        return '<div class="card" style="'+rarityStyle(r)+';position:relative;overflow:hidden;min-height:190px"><div style="position:absolute;top:8px;right:8px;font-size:11px;font-weight:900;opacity:.8">'+(n?'x'+n:'🔒')+'</div><div class="emoji" style="font-size:42px;margin-top:8px">'+x[1]+'</div><h3 style="margin:6px 0">'+x[2]+'</h3><p class="muted" style="margin:4px 0 12px">'+(n?RARITIES[r].name:'Pas encore obtenu')+'</p>'+(n?'<div style="display:flex;flex-direction:column;gap:6px">'+action+sell+'</div>':'')+'</div>'
      }).join('')+'</div></div>'
    }).join('')
  }

  function setPackButtonsBusy(state){
    document.querySelectorAll('#customPacks .pack-buy').forEach(btn=>{
      btn.disabled=!!state
      btn.dataset.busy=state?'1':'0'
      btn.style.pointerEvents=state?'none':'auto'
      btn.style.opacity=state?'.55':''
      btn.textContent=state?'⏳ OUVERTURE...':'OUVRIR'
    })
  }

  async function buyPack(type){
    if(!['world','character','coin','dash'].includes(type))return
    const now=Date.now()
    if(buying || now<buyCooldownUntil)return
    buying=true
    setPackButtonsBusy(true)
    try{
      const cost=COSTS[type]||1000
      if(guestMode()){
        const p=localProfile();p.coins=Number(p.coins||0)
        if(p.coins<cost){toast('❌ Pas assez de pièces.');return}
        const rarity=weightedRarity(), cards=rarityCards(type).filter(x=>x.rarity===rarity), item=cards[Math.floor(Math.random()*cards.length)]
        p.coins-=cost;saveLocal(p);refreshCoins(p.coins);notifyProfile(p)
        const data=loadCollection('guest',type);data[item.id]=Number(data[item.id]||0)+1;saveCollection('guest',type,data)
        const count=data[item.id]
        showPackResult('<div style="font-size:22px;font-weight:1000">'+item.emoji+' '+item.name+'</div><div style="font-weight:1000;margin:4px 0;color:#fff">'+RARITIES[rarity].icon+' '+RARITIES[rarity].name+' <span style="opacity:.7">— '+RARITIES[rarity].chance+'%</span></div><div style="display:inline-block;padding:5px 9px;border-radius:8px;background:'+(count>1?'rgba(255,180,0,.18)':'rgba(25,255,136,.14)')+';border:1px solid '+(count>1?'#ffc44d':'#19ff88')+';color:'+(count>1?'#ffd166':'#19ff88')+';font-size:12px;font-weight:1000;letter-spacing:.7px">'+(count>1?'DOUBLON · x'+count:'NOUVEAU !')+'</div>')
        toast('🎁 '+RARITIES[rarity].name+' !')
        renderCustomizer();return
      }
      if(!sb)return toast('❌ Cloud indisponible.')
      const {data:{user}}=await sb.auth.getUser();if(!user)return toast('❌ Reconnecte-toi.')
      const profQ=await sb.from('profiles').select('coins').eq('id',user.id).single()
      if(profQ.error||!profQ.data)return toast('❌ Impossible de lire tes pièces.')
      const coins=Number(profQ.data.coins||0);if(coins<cost)return toast('❌ Pas assez de pièces.')
      const rarity=weightedRarity(),cards=rarityCards(type).filter(x=>x.rarity===rarity),item=cards[Math.floor(Math.random()*cards.length)]
      const {error}=await sb.from('profiles').update({coins:coins-cost}).eq('id',user.id)
      if(error)return toast('❌ Achat impossible.')
      refreshCoins(coins-cost);notifyProfile({coins:coins-cost})
      const cloudSaved=await saveCloudOwnership(user.id,type,item.id)
      if(!cloudSaved){
        const refund=await sb.from('profiles').update({coins:coins}).eq('id',user.id)
        if(refund.error)console.error('[IR] pack refund:',refund.error)
        return toast('❌ Le pack n’a pas pu être enregistré. Tes pièces n’ont pas été conservées comme dépense.')
      }
      const data=loadCollection(user.id,type);data[item.id]=Number(data[item.id]||0)+1;saveCollection(user.id,type,data)
      const count=data[item.id]
      persistProfilePatch({coins:coins-cost})
      showPackResult('<div style="font-size:22px;font-weight:1000">'+item.emoji+' '+item.name+'</div><div style="font-weight:1000;margin:4px 0;color:#fff">'+RARITIES[rarity].icon+' '+RARITIES[rarity].name+' <span style="opacity:.7">— '+RARITIES[rarity].chance+'%</span></div><div style="display:inline-block;padding:5px 9px;border-radius:8px;background:'+(count>1?'rgba(255,180,0,.18)':'rgba(25,255,136,.14)')+';border:1px solid '+(count>1?'#ffc44d':'#19ff88')+';color:'+(count>1?'#ffd166':'#19ff88')+';font-size:12px;font-weight:1000;letter-spacing:.7px">'+(count>1?'DOUBLON · x'+count:'NOUVEAU !')+'</div>')
      toast('🎁 '+RARITIES[rarity].name+' !')
      renderCustomizer()
    }finally{
      buying=false
      buyCooldownUntil=Date.now()+250
      setPackButtonsBusy(false)
    }
  }

  const card=html=>`<div class="card">${html}</div>`

  function renderPacks(){
    const shop=$('shop');if(!shop)return
    let root=$('customPacks');if(!root){root=document.createElement('div');root.id='customPacks';shop.querySelector('.panel')?.appendChild(root)}
    $('shopGrid')?.style.setProperty('display','none')
    const standard=$('btnFreePack')?.closest('.card');if(standard)standard.style.display='none'
    root.innerHTML='<div class="pack-shop-title"><h3>🎁 PACKS À RARETÉ</h3><p class="muted">Chaque ouverture tire une rareté puis un objet. Les doublons sont autorisés.</p></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:12px 0">'+RARITY_ORDER.map(r=>'<div style="padding:9px;border-radius:10px;'+rarityStyle(r)+'"><b>'+RARITIES[r].icon+' '+RARITIES[r].name+'</b><br><span class="muted">'+RARITIES[r].chance+'% · vente '+RARITIES[r].sell.toLocaleString('fr-FR')+' 🪙</span></div>').join('')+'</div><div class="grid pack-grid-fixed">'+
      card('<div class="emoji">🌍</div><h3>PACK MONDE</h3><p><b>🪙 1 000</b></p><button class="primary pack-buy" data-pack="world" type="button">OUVRIR</button>')+
      card('<div class="emoji">🧑</div><h3>PACK PERSONNAGE</h3><p><b>🪙 1 000</b></p><button class="primary pack-buy" data-pack="character" type="button">OUVRIR</button>')+
      card('<div class="emoji">🪙</div><h3>PACK PIÈCES</h3><p><b>🪙 1 000</b></p><button class="primary pack-buy" data-pack="coin" type="button">OUVRIR</button>')+
      card('<div class="emoji">⚡</div><h3>PACK DASH</h3><p><b>🪙 1 000</b></p><button class="primary pack-buy" data-pack="dash" type="button">OUVRIR</button>')+
      '</div><div id="packResult" class="card" style="display:none"></div>'
    if(lastPackResult){
      showPackResult(lastPackResult.html,lastPackResult.good)
    }
    root.querySelectorAll('.pack-buy').forEach(btn=>{ btn.onclick=null })
  }


  function renderCustomizerShell(){
    const root=$('customizerRoot');if(!root)return
    const p=localProfile()
    const selected={
      world:guestMode()?(p.selected_background||'city'):(cloudProfile?.selected_background||'city'),
      character:guestMode()?(p.selected_character||'runner'):(cloudProfile?.selected_character||'runner'),
      coin:guestMode()?(p.selected_coin||'gold'):(cloudProfile?.selected_coin||getSelectedCloudCoin(cloudUser?.id||'guest'))
    }
    root.innerHTML='<div style="padding:18px 0 8px"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><h2 style="margin:0">🎨 PERSONNALISATION</h2><p class="muted" style="margin:6px 0">Équipe tes objets débloqués et construis ton style Illegal Runner.</p></div><div style="padding:8px 12px;border:1px solid #00e5ff;border-radius:12px;background:rgba(0,229,255,.08);font-weight:900">⚡ '+[selected.world,selected.character,selected.coin].join(' · ')+'</div></div></div>'+
      '<div class="custom-section" style="padding:14px;border-radius:16px;border:1px solid rgba(0,229,255,.35);background:linear-gradient(135deg,rgba(0,229,255,.07),rgba(5,8,15,.9))"><h3 style="margin-top:0">📊 RARETÉS</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px">'+RARITY_ORDER.map(r=>'<div style="padding:10px;border-radius:11px;'+rarityStyle(r)+'"><b>'+RARITIES[r].icon+' '+RARITIES[r].name+'</b><br><span class="muted">'+RARITIES[r].chance+'% · '+RARITIES[r].sell.toLocaleString('fr-FR')+' 🪙</span></div>').join('')+'</div></div>'+
      '<div class="custom-section"><h3>🌍 MONDES</h3>'+displayCollection('world')+'</div>'+
      '<div class="custom-section"><h3>🧑 PERSONNAGES</h3>'+displayCollection('character')+'</div>'+
      '<div class="custom-section"><h3>🪙 PIÈCES</h3>'+displayCollection('coin')+'</div>'+
      '<div class="custom-section"><h3>⚡ DASH</h3><p class="muted">34 styles Dash classés par rareté.</p>'+displayDashStyles()+'</div>'
  }
  async function renderCustomizer(){
    const root=$('customizerRoot');if(!root)return
    // Always paint the page first; cloud loading must never leave the panel blank.
    try{renderCustomizerShell()}catch(e){
      console.error('[IR] customizer shell:',e)
      root.innerHTML='<div class="card"><h3>🎨 PERSONNALISATION</h3><p class="muted">Chargement des objets…</p></div>'
      return
    }
    try{
      await Promise.race([
        getCloud(),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error('Cloud timeout')),5000))
      ])
    }catch(e){
      console.warn('[IR] customizer cloud sync:',e)
      return
    }
    try{
      renderCustomizerShell()
      const p=localProfile()
      const selected={
        world:guestMode()?(p.selected_background||'city'):(cloudProfile?.selected_background||'city'),
        character:guestMode()?(p.selected_character||'runner'):(cloudProfile?.selected_character||'runner'),
        coin:guestMode()?(p.selected_coin||'gold'):(cloudProfile?.selected_coin||getSelectedCloudCoin(cloudUser?.id||'guest'))
      }
      notifyCustomization('world',selected.world);notifyCustomization('character',selected.character);notifyCustomization('coin',selected.coin)
    }catch(e){console.error('[IR] customizer refresh:',e)}
  }


  document.addEventListener('click',async e=>{
    const sell=e.target.closest('[data-sell-type]')
    if(!sell)return
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()
    const type=sell.dataset.sellType,id=sell.dataset.sellId,uid=collectionUid(),data=loadCollection(uid,type),cards=rarityCards(type),item=cards.find(x=>x.id===id)
    if(!item||!Number(data[id]||0))return toast('❌ Objet indisponible.')
    const reward=RARITIES[item.rarity].sell
    data[id]=Math.max(0,Number(data[id])-1);saveCollection(uid,type,data)
    if(guestMode()){
      const p=localProfile();p.coins=Number(p.coins||0)+reward;saveLocal(p);refreshCoins(p.coins);notifyProfile(p)
    }else if(cloudUser){
      const {data:prof}=await sb.from('profiles').select('coins').eq('id',cloudUser.id).single()
      const next=Number(prof?.coins||0)+reward
      if(type==='dash'){
        const dashNext={...(cloudDashInventory||{})}
        const remaining=Math.max(0,Number(dashNext[id]||0)-1)
        if(remaining>0)dashNext[id]=remaining
        else delete dashNext[id]
        const meta={...((cloudUser&&cloudUser.user_metadata)||{}),ir_dash_inventory:dashNext}
        const {error:metaError}=await sb.auth.updateUser({data:meta})
        if(metaError){data[id]=Number(data[id]||0)+1;saveCollection(uid,type,data);return toast('❌ Vente impossible.')}
        const {error}=await sb.from('profiles').update({coins:next}).eq('id',cloudUser.id)
        if(error){
          await sb.auth.updateUser({data:{...((cloudUser&&cloudUser.user_metadata)||{}),ir_dash_inventory:cloudDashInventory||{}}})
          data[id]=Number(data[id]||0)+1;saveCollection(uid,type,data)
          return toast('❌ Vente impossible.')
        }
        cloudDashInventory=dashNext
        if(cloudUser)cloudUser={...cloudUser,user_metadata:{...((cloudUser&&cloudUser.user_metadata)||{}),ir_dash_inventory:dashNext}}
      }else{
        const {error}=await sb.from('profiles').update({coins:next}).eq('id',cloudUser.id)
        if(error){data[id]=Number(data[id]||0)+1;saveCollection(uid,type,data);return toast('❌ Vente impossible.')}
      }
      refreshCoins(next);notifyProfile({coins:next})
    }
    toast('💰 +'+reward.toLocaleString('fr-FR')+' pièces !')
    await renderCustomizer()
  },true)

  function setup(){
    const tabs=$('#tabs')
    if(tabs){
      document.querySelector('#tabs button[data-tab="pack"]')?.remove()
      $('pack')?.remove()
      let wt=document.querySelector('#tabs button[data-tab="world"]')
      if(!wt){
        wt=document.createElement('button')
        wt.type='button'
        wt.dataset.tab='world'
        wt.textContent='🎨 Personnaliser'
        const after=tabs.querySelector('button[data-tab="upgrades"]')
        if(after)after.insertAdjacentElement('afterend',wt);else tabs.appendChild(wt)
      }else wt.textContent='🎨 Personnaliser'
      wt.style.display=''
      wt.disabled=false
    }
    const world=$('#world')
    if(world){
      world.style.display=''
      const wh=world.querySelector('h2');if(wh)wh.textContent='🎨 PERSONNALISER'
      $('worldGrid')?.style.setProperty('display','none')
      if(!$('customizerRoot')){const r=document.createElement('div');r.id='customizerRoot';world.querySelector('.panel')?.appendChild(r)}
    }
    renderPacks()
    const r=$('customizerRoot')
    if(r){
      r.dataset.ready='1'
      renderCustomizer().catch(e=>console.error('[IR] customizer render:',e))
    }
  }
  window.addEventListener('ir:profileLoaded',()=>setTimeout(setup,0))
  window.addEventListener('ir:profileChanged',()=>setTimeout(()=>{setup()},0))
  document.addEventListener('click',e=>{
    const tab=e.target.closest('#tabs button[data-tab="world"]')
    if(!tab)return
    setTimeout(()=>{
      setup()
      const world=$('#world')
      const root=$('customizerRoot')
      if(world&&root)renderCustomizer().catch(err=>console.error('[IR] customizer tab:',err))
    },0)
  },true)
  document.addEventListener('click',async e=>{
    const eq=e.target.closest('[data-equip-type]');if(eq){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();await equip(eq.dataset.equipType,eq.dataset.equipId);return}
    const pack=e.target.closest('#customPacks .pack-buy');if(pack){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(pack.disabled||pack.dataset.busy==='1'||buying)return;await buyPack(pack.dataset.pack);return}
  },true)
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setTimeout(setup,0)
})()
