/* =====================================================================
   ILLEGAL RUNNER // Ultimate Cyber Runner
   - Static build, no bundler. Loaded by index.html.
   - Menu/auth/progression + a clean canvas engine with hitboxes
     kept fully separate from the neon visuals.
   ===================================================================== */
(() => {
  "use strict"

  /* ---------- config ---------- */
  const CFG = window.IR_CONFIG || {}
  const sb =
    window.supabase && String(CFG.SUPABASE_URL || "").startsWith("http")
      ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY)
      : null
  const ADMIN = String(CFG.ADMIN_USERNAME || "Rubansu1").toLowerCase()

  /* ---------- helpers ---------- */
  const $ = (id) => document.getElementById(id)
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
  const rand = (a, b) => a + Math.random() * (b - a)
  const pick = (arr) => arr[(Math.random() * arr.length) | 0]
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])
  let toastT
  function toast(t) {
    const el = $("toast")
    el.textContent = t
    el.classList.add("show")
    clearTimeout(toastT)
    toastT = setTimeout(() => el.classList.remove("show"), 1900)
  }

  /* ---------- content data ---------- */
  const WORLDS = {
    city:   { emoji: "🌃", name: "CITY",    desc: "Ville cyberpunk",   unlock: 1,   sky: ["#08213f", "#03060f"], accent: "#00e5ff", ground: "#04070c", coin: "#ffd84a", far: "#0b2c4e", mid: "#123f6e" },
    forest: { emoji: "🌲", name: "FOREST",  desc: "Forêt néon",        unlock: 30,  sky: ["#062e2b", "#02100e"], accent: "#54ffc1", ground: "#03110d", coin: "#b6ff5a", far: "#0d3a34", mid: "#155248" },
    desert: { emoji: "🏜️", name: "DESERT",  desc: "Désert synthwave",  unlock: 70,  sky: ["#4b1f45", "#0c0716"], accent: "#ff8a3d", ground: "#160a12", coin: "#ffd84a", far: "#5a2748", mid: "#7a3355" },
    space:  { emoji: "🚀", name: "SPACE",   desc: "Station spatiale",  unlock: 110, sky: ["#180a3a", "#02020c"], accent: "#a14dff", ground: "#05030f", coin: "#7fd8ff", far: "#241155", mid: "#331a6e" },
    dark:   { emoji: "🌑", name: "DARK",    desc: "Dimension sombre",  unlock: 150, sky: ["#0a0a14", "#000000"], accent: "#ff2f7d", ground: "#050509", coin: "#ff5aa0", far: "#141425", mid: "#1e1e38" },
    volcano:{ emoji: "🌋", name: "VOLCANO", desc: "Coeur du volcan",   unlock: 200, sky: ["#4a120c", "#0f0303"], accent: "#ff6a2c", ground: "#160604", coin: "#ffcf4a", far: "#5c1a10", mid: "#7d2515" },
    ice:    { emoji: "❄️", name: "ICE",     desc: "Banquise glacée",   unlock: 250, sky: ["#123c56", "#020b13"], accent: "#8fe9ff", ground: "#04121b", coin: "#eafcff", far: "#17516e", mid: "#216f92" },
  }
  const WORLD_IDS = Object.keys(WORLDS)
  const CHARS = { runner: "🧑 RUNNER", ninja: "🥷 NINJA", robot: "🤖 ROBOT", ghost: "👻 GHOST", cyber: "🦾 CYBER" }
  const OBSETS = { classic: "🔺 CLASSIC", tech: "🧱 TECH", drone: "🚁 DRONES", energy: "⚡ ENERGY", chaos: "☠️ CHAOS" }
  const UPGRADES = [
    ["lives", "❤️", "Vies", 5, "Max de vies par run."],
    ["distance", "🏃", "Distance", 6, "Vitesse & score de départ."],
    ["dash", "⚡", "Dash", 6, "Niveau 6 = traverse/détruit les obstacles."],
    ["jump", "⬆️", "Saut", 6, "Hauteur et double-saut renforcés."],
    ["coin", "🪙", "Pièces", 6, "Multiplie les pièces ramassées."],
    ["bonus", "✨", "Bonus", 6, "Durée & fréquence des bonus."],
  ]

  const DEFAULTS = {
    username: "Runner", coins: 0, best_distance: 0, total_distance: 0, highest_level: 1,
    lives_level: 1, distance_level: 1, dash_level: 1, jump_level: 1, coin_level: 1, bonus_level: 1,
    daily_login_streak: 0, last_login_reward: null,
    quest_distance: 0, quest_coins: 0, quest_games: 0,
    quest_distance_claimed: false, quest_coins_claimed: false, quest_games_claimed: false,
    selected_background: "city", selected_character: "runner", selected_obstacle_set: "classic",
    owned_worlds: ["city"], last_quest_reset: null,
  }

  /* ---------- state ---------- */
  let user = null
  let profile = null
  let isGuest = false
  let muted = false
  let tabName = "home"

  /* ============================================================
     AUDIO — tiny WebAudio synth (no assets needed)
     ============================================================ */
  let actx
  function ac() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)()
    if (actx.state === "suspended") actx.resume()
    return actx
  }
  function beep(freq, dur, type = "square", gain = 0.05) {
    if (muted) return
    try {
      const a = ac()
      const o = a.createOscillator()
      const g = a.createGain()
      o.type = type
      o.frequency.setValueAtTime(freq, a.currentTime)
      g.gain.setValueAtTime(gain, a.currentTime)
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur)
      o.connect(g).connect(a.destination)
      o.start()
      o.stop(a.currentTime + dur)
    } catch (e) {}
  }
  const SFX = {
    jump: () => beep(520, 0.12, "square", 0.04),
    dbl: () => beep(720, 0.12, "square", 0.04),
    dash: () => { beep(180, 0.18, "sawtooth", 0.05); beep(360, 0.18, "sawtooth", 0.03) },
    coin: () => beep(1040, 0.08, "triangle", 0.035),
    bonus: () => { beep(660, 0.09, "triangle", 0.05); setTimeout(() => beep(990, 0.12, "triangle", 0.05), 70) },
    hurt: () => beep(140, 0.3, "sawtooth", 0.07),
    over: () => { beep(300, 0.2, "sawtooth", 0.06); setTimeout(() => beep(150, 0.5, "sawtooth", 0.06), 120) },
    win: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.16, "triangle", 0.05), i * 110)) },
    tick: () => beep(440, 0.08, "square", 0.04),
    go: () => beep(880, 0.25, "triangle", 0.06),
  }

  /* ============================================================
     AUTH + PERSISTENCE
     ============================================================ */
  const emailFor = (n) => n.toLowerCase().replace(/[^a-z0-9._-]/g, "") + "@illegal-runner.local"
  const cleanName = (v) => String(v || "").trim().replace(/[^a-zA-Z0-9_ -]/g, "").slice(0, 20)
  function setErr(t, ok) {
    const e = $("err")
    e.textContent = t || ""
    e.style.color = ok ? "var(--good)" : "var(--danger)"
  }
  function saveLocal() {
    try { localStorage.setItem("irGuest", JSON.stringify(profile)) } catch (e) {}
  }

  async function auth(create) {
    const n = cleanName($("name").value)
    const p = String($("pass").value || "")
    if (!n) return setErr("Entre un pseudo.")
    if (p.length < 6) return setErr("Mot de passe : 6 caractères minimum.")
    if (!sb) return setErr("Cloud indisponible — utilise JOUER EN LOCAL.")
    setErr(create ? "Création du compte…" : "Connexion…", true)
    try {
      const r = create
        ? await sb.auth.signUp({ email: emailFor(n), password: p, options: { data: { username: n } } })
        : await sb.auth.signInWithPassword({ email: emailFor(n), password: p })
      if (r.error) throw r.error
      if (create && !r.data.session) throw new Error("Compte créé. Désactive la confirmation e-mail dans Supabase pour te connecter tout de suite.")
      user = r.data.user
      let q = await sb.from("profiles").select("*").eq("id", user.id).single()
      if (q.error && q.error.code !== "PGRST116") throw q.error
      profile = q.data || { ...DEFAULTS, username: n }
      isGuest = false
      await boot()
    } catch (e) {
      setErr(e.message || "Connexion impossible.")
    }
  }
  function guest() {
    isGuest = true
    let saved = {}
    try { saved = JSON.parse(localStorage.getItem("irGuest") || "{}") } catch (e) {}
    profile = { ...DEFAULTS, ...saved }
    profile.username = cleanName($("name").value) || profile.username || "Runner"
    boot()
  }
  async function logout() {
    try { if (sb && !isGuest) await sb.auth.signOut() } catch (e) {}
    location.reload()
  }
  async function persist() {
    if (isGuest) { saveLocal(); refreshTop(); return }
    if (!sb || !user) return
    const clean = { ...profile }
    delete clean.owned_worlds // not a column; keep local only
    const r = await sb.from("profiles").update(clean).eq("id", user.id)
    if (r.error) console.log("[v0] persist error:", r.error.message)
    refreshTop()
  }

  async function boot() {
    profile = { ...DEFAULTS, ...profile }
    if (!Array.isArray(profile.owned_worlds)) profile.owned_worlds = ["city"]
    $("login").style.display = "none"
    $("app").style.display = "flex"
    $("adminTab").style.display = (profile.username || "").toLowerCase() === ADMIN ? "block" : "none"
    $("userBadge").textContent = (isGuest ? "· local · " : "· ") + (profile.username || "Runner")
    refreshTop()
    renderAll()
    switchTab("home")
    if (!isGuest) { await claimAutoLogin(); }
  }

  /* ============================================================
     MENU RENDERING
     ============================================================ */
  function refreshTop() {
    $("coins").textContent = profile.coins | 0
    $("best").textContent = profile.best_distance | 0
    $("lv").textContent = profile.highest_level | 0
  }
  function worldUnlocked(id) {
    return (profile.highest_level || 1) >= WORLDS[id].unlock || (profile.owned_worlds || []).includes(id)
  }
  function renderAll() {
    renderLevels(); renderUpgrades(); renderShop(); renderPacks(); renderWorlds(); renderQuests()
  }
  function renderLevels() {
    const hi = profile.highest_level || 1
    let h = ""
    for (let i = 1; i <= 300; i++) {
      const unlocked = i <= hi
      const cls = i === 300 ? "champ" : i === hi ? "current" : i < hi ? "done" : "locked"
      h += `<button class="${cls} ${unlocked ? "" : "locked"}" ${unlocked ? `data-level="${i}"` : "disabled"}>${i === 300 ? "👑" : i}</button>`
    }
    $("levelButtons").innerHTML = h
  }
  function renderUpgrades() {
    $("upgradeGrid").innerHTML = UPGRADES.map(([id, em, n, max, desc]) => {
      const v = profile[id + "_level"] || 1
      const cost = 100 * v
      const maxed = v >= max
      return `<div class="card"><div class="emoji">${em}</div><h3>${n}</h3><p class="muted">${desc}</p>
        <p>Niveau ${v}/${max}</p><div class="progress"><i style="width:${(v / max) * 100}%"></i></div>
        <button data-up="${id}" ${maxed ? "disabled" : ""}>${maxed ? "MAX" : "🪙 " + cost}</button></div>`
    }).join("")
  }
  function renderShop() {
    const items = [
      ["lives", "❤️", "Réserve de vies", "Monte le max de vies jusqu'à 5."],
      ["dash", "⚡", "Dash surchargé", "Niveau 6 : traverse et détruit les obstacles."],
      ["coin", "🪙", "Aimant à pièces", "Augmente les pièces gagnées."],
      ["bonus", "✨", "Bonus étendus", "Bonus plus longs et plus fréquents."],
    ]
    $("shopGrid").innerHTML = items.map(([id, em, n, d]) => {
      const v = profile[id + "_level"] || 1
      const max = UPGRADES.find((u) => u[0] === id)[3]
      const maxed = v >= max
      return `<div class="card"><div class="emoji">${em}</div><h3>${n}</h3><p class="muted">${d}</p>
        <p>Niveau ${v}/${max}</p><button data-up="${id}" ${maxed ? "disabled" : ""}>${maxed ? "MAX" : "🪙 " + 100 * v}</button></div>`
    }).join("")
  }
  function renderPacks() {
    const packs = [
      ["world", "🌍 WORLD PACK", "Débloque un monde aléatoire.", 250, "pink"],
      ["character", "🧑 CHARACTER PACK", "Débloque un personnage.", 200, "pink"],
      ["obstacle", "☠️ OBSTACLE PACK", "Nouveau set d'obstacles.", 180, "pink"],
      ["reward", "💎 REWARD PACK", "Pièces avec rareté aléatoire.", 300, "gold"],
    ]
    $("packGrid").innerHTML = packs.map(([t, n, d, c, cls]) =>
      `<div class="card"><h3>${n}</h3><p class="muted">${d}</p><button class="${cls}" data-pack="${t}">🪙 ${c}</button></div>`
    ).join("")
  }
  function renderWorlds() {
    $("worldGrid").innerHTML = WORLD_IDS.map((id) => {
      const w = WORLDS[id]
      const unlocked = worldUnlocked(id)
      const equipped = profile.selected_background === id
      return `<div class="card"><div class="emoji">${w.emoji}</div><div class="rarity">${w.name}</div>
        <h3>${w.desc}</h3><p class="muted">${unlocked ? "Débloqué" : "Niveau " + w.unlock}</p>
        <button data-world="${id}" ${unlocked ? "" : "disabled"}>${equipped ? "✓ ÉQUIPÉ" : unlocked ? "ÉQUIPER" : "🔒"}</button></div>`
    }).join("")
  }
  function questList() {
    return [
      ["distance", "🏃", "Courir 800 m (cumulé)", profile.quest_distance || 0, 800, 150, profile.quest_distance_claimed],
      ["coins", "🪙", "Gagner 150 pièces", profile.quest_coins || 0, 150, 120, profile.quest_coins_claimed],
      ["games", "🎮", "Faire 3 parties", profile.quest_games || 0, 3, 180, profile.quest_games_claimed],
    ]
  }
  function renderQuests() {
    $("questGrid").innerHTML = questList().map(([id, em, label, cur, goal, reward, claimed]) => {
      const done = cur >= goal
      return `<div class="card"><h3>${em} ${label}</h3><p>${Math.min(cur, goal)}/${goal}</p>
        <div class="progress"><i style="width:${clamp((cur / goal) * 100, 0, 100)}%"></i></div>
        <button data-quest="${id}" data-reward="${reward}" ${done && !claimed ? "" : "disabled"}>${claimed ? "✓ REÇU" : "🎁 +" + reward}</button></div>`
    }).join("")
    const streak = profile.daily_login_streak || 0
    $("loginReward").textContent = `Série : ${streak} jour(s). Prochain bonus : ${100 + streak * 25} pièces.`
  }

  function switchTab(id) {
    tabName = id
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.id === id))
    document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === id))
    if (id === "leader") loadLeaderboard()
    if (id === "friends") loadFriends()
    if (id === "admin") adminSearch()
  }

  /* ---------- economy actions ---------- */
  function buyUpgrade(id) {
    const max = UPGRADES.find((u) => u[0] === id)[3]
    const key = id + "_level"
    const v = profile[key] || 1
    if (v >= max) return toast("Niveau maximum !")
    const cost = 100 * v
    if ((profile.coins || 0) < cost) return toast("Pas assez de pièces.")
    profile.coins -= cost
    profile[key] = v + 1
    SFX.bonus()
    persist(); renderAll(); toast("⚡ Amélioration achetée !")
  }
  function freePack() {
    const today = new Date().toISOString().slice(0, 10)
    if (profile._freeToday === today) return toast("Déjà récupéré aujourd'hui.")
    profile._freeToday = today
    profile.coins += 75
    SFX.coin()
    persist(); toast("🎁 +75 pièces gratuites !")
  }
  function openPack(type) {
    const cost = { world: 250, character: 200, obstacle: 180, reward: 300 }[type]
    if ((profile.coins || 0) < cost) return toast("Pas assez de pièces.")
    profile.coins -= cost
    if (type === "reward") {
      const r = 100 + ((Math.random() * 901) | 0)
      profile.coins += r
      SFX.win(); toast("💎 RÉCOMPENSE : +" + r + " pièces !")
    } else if (type === "world") {
      const locked = WORLD_IDS.filter((id) => !worldUnlocked(id))
      if (!locked.length) { profile.coins += cost; return toast("Tous les mondes sont débloqués !") }
      const id = pick(locked)
      profile.owned_worlds = [...new Set([...(profile.owned_worlds || []), id])]
      SFX.bonus(); toast("🌍 Monde débloqué : " + WORLDS[id].desc)
    } else if (type === "character") {
      profile.selected_character = pick(Object.keys(CHARS))
      SFX.bonus(); toast("🧑 Perso : " + CHARS[profile.selected_character])
    } else {
      profile.selected_obstacle_set = pick(Object.keys(OBSETS))
      SFX.bonus(); toast("☠️ Set : " + OBSETS[profile.selected_obstacle_set])
    }
    persist(); renderAll()
  }
  function selectWorld(id) {
    if (!worldUnlocked(id)) return
    profile.selected_background = id
    persist(); renderWorlds(); toast("🌍 " + WORLDS[id].desc + " équipé !")
  }
  function claimQuest(id, reward) {
    const q = questList().find((x) => x[0] === id)
    if (!q || q[3] < q[4] || q[6]) return
    profile[`quest_${id}_claimed`] = true
    profile.coins += reward
    SFX.coin(); persist(); renderQuests(); toast("🎁 Quête validée ! +" + reward)
  }
  async function claimAutoLogin() {
    const today = new Date().toISOString().slice(0, 10)
    if (profile.last_login_reward === today) { renderQuests(); return }
    const last = profile.last_login_reward ? new Date(profile.last_login_reward) : null
    const days = last ? Math.floor((Date.now() - last.getTime()) / 86400000) : 99
    profile.daily_login_streak = days === 1 ? (profile.daily_login_streak || 0) + 1 : 1
    profile.last_login_reward = today
    // daily quest reset
    if (profile.last_quest_reset !== today) {
      profile.last_quest_reset = today
      profile.quest_distance = 0; profile.quest_coins = 0; profile.quest_games = 0
      profile.quest_distance_claimed = false; profile.quest_coins_claimed = false; profile.quest_games_claimed = false
    }
    profile.coins += 100 + profile.daily_login_streak * 25
    await persist(); renderQuests(); toast("🎁 Bonus quotidien récupéré !")
  }

  /* ---------- cloud: leaderboard / friends / admin ---------- */
  async function loadLeaderboard() {
    const box = $("leaderList")
    if (isGuest || !sb) {
      $("leaderInfo").textContent = "Mode local : connecte-toi pour le classement en ligne."
      box.innerHTML = `<div class="card">☁️ Classement disponible en MODE COMPTE.</div>`
      return
    }
    const q = await sb.from("profiles").select("username,best_distance,highest_level").order("best_distance", { ascending: false }).limit(50)
    if (q.error) { box.innerHTML = `<div class="card">Erreur classement.</div>`; return }
    box.innerHTML = q.data.map((r, i) =>
      `<div class="rank"><strong>#${i + 1}</strong><span style="flex:1">${escapeHtml(r.username)}</span><b>🏆 ${r.best_distance}m</b><span class="muted">LV ${r.highest_level}</span></div>`
    ).join("") || `<div class="card">Aucun joueur.</div>`
  }
  async function loadFriends() {
    const box = $("friendList")
    if (isGuest || !sb) { box.innerHTML = `<div class="card">☁️ Amis disponibles en MODE COMPTE.</div>`; return }
    const q = await sb.from("friends").select("status,profiles!friends_friend_id_fkey(username,best_distance)").eq("user_id", user.id)
    if (q.error) { box.innerHTML = `<div class="card">Table friends manquante — exécute supabase.sql.</div>`; return }
    box.innerHTML = q.data.length
      ? q.data.map((f) => `<div class="friend"><span style="flex:1">👤 ${escapeHtml(f.profiles?.username || "Joueur")}</span><b>🏆 ${f.profiles?.best_distance || 0}m</b><span class="muted">${f.status}</span></div>`).join("")
      : `<div class="card">Aucun ami pour le moment.</div>`
  }
  async function addFriend() {
    if (isGuest || !sb) return toast("Connecte-toi pour ajouter des amis.")
    const n = cleanName($("friendName").value)
    if (!n) return
    const q = await sb.from("profiles").select("id,username").ilike("username", n).limit(1).single()
    if (q.error) return toast("Joueur introuvable.")
    if (q.data.id === user.id) return toast("Impossible de t'ajouter toi-même.")
    const r = await sb.from("friends").upsert({ user_id: user.id, friend_id: q.data.id, status: "accepted" }, { onConflict: "user_id,friend_id" })
    if (r.error) toast(r.error.message)
    else { toast("Ami ajouté !"); loadFriends() }
  }
  async function adminSearch() {
    if ((profile.username || "").toLowerCase() !== ADMIN || !sb) return
    const n = cleanName($("adminSearch").value)
    let q = sb.from("profiles").select("username,coins,best_distance,highest_level").order("coins", { ascending: false }).limit(20)
    if (n) q = q.ilike("username", "%" + n + "%")
    const r = await q
    $("adminResults").innerHTML = r.error
      ? `<div class="card">${escapeHtml(r.error.message)}</div>`
      : r.data.map((u) => `<div class="rank"><span style="flex:1">${escapeHtml(u.username)}</span><b>🪙 ${u.coins}</b><span>🏆 ${u.best_distance}m</span><span class="muted">LV ${u.highest_level}</span></div>`).join("") || `<div class="card">Aucun résultat.</div>`
  }

  /* ============================================================
     GAME ENGINE
     ============================================================ */
  const G = {
    ctx: null, W: 0, H: 0, dpr: 1, groundH: 118, groundY: 0,
    raf: 0, running: false, level: 0,
    dist: 0, coins: 0, lives: 1, maxLives: 1,
    speed: 0, baseSpeed: 0, worldScroll: 0,
    spawnT: 0, coinT: 0, bonusT: 0,
    dashT: 0, dashReady: true, dashCd: 0,
    shield: false, coinMult: 1, coinBoostT: 0, jumpBoostT: 0,
    gliding: false, canDouble: false,
    shake: 0, startTime: 0, last: 0, acc: 0,
    player: null, obs: [], coinsArr: [], bonuses: [], parts: [],
    world: WORLDS.city, goal: 0,
  }
  const STEP = 1 / 120 // fixed physics step

  function resize() {
    G.W = window.innerWidth
    G.H = window.innerHeight
    G.dpr = Math.min(window.devicePixelRatio || 1, 2)
    const c = $("c")
    c.width = G.W * G.dpr
    c.height = G.H * G.dpr
    G.ctx = c.getContext("2d")
    G.ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0)
    G.groundY = G.H - G.groundH
    if (G.player) G.player.x = Math.max(80, G.W * 0.2)
  }
  window.addEventListener("resize", resize)

  /* ---- hitboxes: kept separate from any visual/glow ---- */
  function playerHB() {
    const p = G.player
    const shrink = G.dashT > 0 ? 14 : 8
    return { x: p.x + shrink, y: p.y + 6, w: p.w - shrink * 2, h: p.h - 10 }
  }
  function obstacleHB(o) {
    switch (o.type) {
      case "spike": // real hitbox = lower/narrow core, tip is grazeable
        return { x: o.x + o.w * 0.28, y: o.y + o.h * 0.42, w: o.w * 0.44, h: o.h * 0.58 }
      case "car":
        return { x: o.x + 8, y: o.y + 10, w: o.w - 16, h: o.h - 12 }
      case "wall":
        return { x: o.x + 5, y: o.y + 3, w: o.w - 10, h: o.h - 3 }
      case "drone":
        return { x: o.x + 7, y: o.y + 8, w: o.w - 14, h: o.h - 12 }
      case "projectile":
        return { x: o.x + 4, y: o.y + 4, w: o.w - 8, h: o.h - 8 }
      default:
        return { x: o.x + 4, y: o.y + 4, w: o.w - 8, h: o.h - 8 }
    }
  }
  const aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  const DESTRUCTIBLE = { spike: 1, drone: 1, projectile: 1 }

  function start(level) {
    ac()
    G.level = level
    G.world = WORLDS[profile.selected_background] || WORLDS.city
    $("app").style.display = "none"
    $("game").style.display = "block"
    resize()
    G.dist = 0; G.coins = 0
    G.maxLives = (profile.lives_level || 1) + 1
    G.lives = G.maxLives
    G.baseSpeed = 360 + (profile.distance_level || 1) * 22
    G.speed = G.baseSpeed
    G.worldScroll = 0
    G.spawnT = 1.9; G.coinT = 0.9; G.bonusT = rand(6, 10)
    G.dashT = 0; G.dashReady = true; G.dashCd = 0
    G.shield = false; G.coinMult = 1; G.coinBoostT = 0; G.jumpBoostT = 0
    G.gliding = false; G.canDouble = false; G.shake = 0
    G.obs = []; G.coinsArr = []; G.bonuses = []; G.parts = []
    G.goal = level ? 400 + level * 20 : 0
    G.player = { x: Math.max(80, G.W * 0.2), y: G.groundY - 62, w: 42, h: 62, vy: 0, ground: true, inv: 0, run: 0, sy: 1 }
    $("objective").textContent = level ? (level >= 300 ? "👑 NIVEAU 300" : "NIVEAU " + level) : "INFINI"
    $("over").style.display = "none"
    $("progressWrap").style.display = level ? "block" : "none"
    drawHearts()
    countdown()
  }
  function restart() { start(G.level) }
  function quit() {
    G.running = false
    cancelAnimationFrame(G.raf)
    $("game").style.display = "none"
    $("app").style.display = "flex"
    refreshTop(); renderAll()
    switchTab(tabName === "play" ? "play" : "home")
  }

  function countdown() {
    const el = $("countdown")
    el.style.display = "flex"
    el.classList.remove("go")
    let n = 3
    el.textContent = n
    SFX.tick()
    const t = setInterval(() => {
      n--
      if (n > 0) { el.textContent = n; SFX.tick() }
      else if (n === 0) { el.textContent = "GO!"; el.classList.add("go"); SFX.go() }
      else {
        clearInterval(t)
        el.style.display = "none"
        G.running = true
        G.startTime = performance.now()
        G.last = performance.now()
        G.acc = 0
        G.raf = requestAnimationFrame(loop)
      }
    }, 600)
  }

  function drawHearts() {
    let s = ""
    for (let i = 0; i < G.maxLives; i++) s += i < G.lives ? "♥ " : "♡ "
    $("hearts").textContent = s.trim()
  }

  /* ---- input ---- */
  function jump() {
    if (!G.running) return
    const boost = G.jumpBoostT > 0 ? 1.5 : 1
    const power = (980 + (profile.jump_level || 1) * 45) * boost
    if (G.player.ground) {
      G.player.vy = -power
      G.player.ground = false
      G.canDouble = true
      G.player.sy = 0.7
      SFX.jump()
      burst(G.player.x + 20, G.player.y + G.player.h, G.world.accent, 8)
    } else if (G.canDouble) {
      G.player.vy = -power * 0.9
      G.canDouble = false
      G.player.sy = 0.7
      SFX.dbl()
      burst(G.player.x + 20, G.player.y + G.player.h, "#fff", 10)
    }
    G.gliding = true
  }
  function releaseJump() { G.gliding = false }
  function dash() {
    if (!G.running || !G.dashReady) return
    G.dashReady = false
    G.dashT = 0.55
    G.dashCd = 1.6
    G.shake = Math.max(G.shake, 8)
    SFX.dash()
    for (let i = 0; i < 14; i++) burst(G.player.x, G.player.y + rand(0, G.player.h), G.world.accent, 1)
  }

  /* ---- spawning (fair patterns) ---- */
  function spawnObstacle() {
    const gy = G.groundY
    const set = profile.selected_obstacle_set || "classic"
    const r = Math.random()
    // difficulty grows with distance
    const d = G.dist
    if (r < 0.24) {
      G.obs.push({ type: "spike", x: G.W + 40, y: gy - 40, w: 42, h: 40, destructible: true })
    } else if (r < 0.42) {
      const h = rand(46, Math.min(120, 60 + d * 0.02))
      G.obs.push({ type: "wall", x: G.W + 40, y: gy - h, w: 30, h })
    } else if (r < 0.56) {
      G.obs.push({ type: "car", x: G.W + 40, y: gy - 56, w: 96, h: 56, vx: rand(20, 70) })
    } else if (r < 0.7) {
      G.obs.push({ type: "drone", x: G.W + 40, y: gy - rand(150, 200), w: 48, h: 34, destructible: true, bob: rand(0, 6.28), baseY: 0 })
      G.obs[G.obs.length - 1].baseY = G.obs[G.obs.length - 1].y
    } else if (r < 0.82) {
      G.obs.push({ type: "projectile", x: G.W + 40, y: gy - rand(50, 95), w: 28, h: 18, destructible: true, vx: rand(180, 260) })
    } else if (r < 0.92) {
      const w = rand(90, Math.min(160, 100 + d * 0.02))
      G.obs.push({ type: "pit", x: G.W + 40, y: gy, w, h: G.groundH })
    } else {
      // floating platform + optional spike combo (fair)
      const py = gy - rand(90, 150)
      G.obs.push({ type: "platform", x: G.W + 40, y: py, w: 130, h: 16 })
      if (Math.random() < 0.4) G.obs.push({ type: "spike", x: G.W + 40 + 300, y: gy - 40, w: 42, h: 40, destructible: true })
    }
    void set
  }
  function spawnCoins() {
    const n = 4 + ((Math.random() * 3) | 0)
    const baseY = G.groundY - rand(60, 230)
    const arc = Math.random() < 0.5
    for (let i = 0; i < n; i++) {
      const y = arc ? baseY - Math.sin((i / (n - 1)) * Math.PI) * 70 : baseY
      G.coinsArr.push({ x: G.W + 50 + i * 42, y, r: 11 })
    }
  }
  function spawnBonus() {
    const types = ["shield", "mega", "x2"]
    const t = pick(types)
    G.bonuses.push({ x: G.W + 60, y: G.groundY - rand(80, 200), r: 18, type: t, spin: 0 })
  }

  /* ---- particles ---- */
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      G.parts.push({ x, y, vx: rand(-160, 60), vy: rand(-160, 160), life: rand(0.3, 0.7), max: 0.7, color, r: rand(1.5, 3.5) })
    }
  }

  /* ---- physics + logic step ---- */
  function step(dt) {
    const p = G.player
    p.run += dt
    if (p.inv > 0) p.inv -= dt
    if (G.coinBoostT > 0) { G.coinBoostT -= dt; G.coinMult = 2 } else G.coinMult = 1
    if (G.jumpBoostT > 0) G.jumpBoostT -= dt

    // dash timers
    if (G.dashT > 0) { G.dashT -= dt; if (G.dashT <= 0) G.dashT = 0 }
    if (!G.dashReady) { G.dashCd -= dt; if (G.dashCd <= 0) { G.dashReady = true } }

    // speed & distance
    const dashSpeed = G.dashT > 0 ? 520 : 0
    G.speed = Math.min(940, G.baseSpeed + G.dist * 0.03 + dashSpeed)
    G.dist += G.speed * dt * 0.06
    G.worldScroll += G.speed * dt

    // gravity / glide
    const grav = 2600
    p.vy += grav * dt
    if (G.gliding && p.vy > 60) p.vy *= Math.pow(0.15, dt) // slow fall while holding
    p.y += p.vy * dt
    p.sy += (1 - p.sy) * Math.min(1, dt * 12) // ease squash back

    // world objects move
    for (const o of G.obs) {
      o.x -= (G.speed + (o.vx || 0)) * dt
      if (o.type === "drone") { o.bob += dt * 3; o.y = o.baseY + Math.sin(o.bob) * 14 }
    }
    for (const c of G.coinsArr) c.x -= G.speed * dt
    for (const b of G.bonuses) { b.x -= G.speed * dt; b.spin += dt * 4 }

    // ground / pit / platform support
    const feetX = { x: p.x + 8, w: p.w - 16 }
    let overPit = false
    for (const o of G.obs) if (o.type === "pit" && feetX.x < o.x + o.w && feetX.x + feetX.w > o.x) overPit = true
    let supportY = overPit ? Infinity : G.groundY
    // platforms (land from above)
    for (const o of G.obs) {
      if (o.type !== "platform") continue
      const overlapX = feetX.x < o.x + o.w && feetX.x + feetX.w > o.x
      const feet = p.y + p.h
      if (overlapX && p.vy >= 0 && feet >= o.y && feet <= o.y + 34) supportY = Math.min(supportY, o.y)
    }
    if (p.y + p.h >= supportY) {
      p.y = supportY - p.h
      if (p.vy > 900) p.sy = 0.75
      p.vy = 0
      p.ground = true
      G.canDouble = false
    } else {
      p.ground = false
    }
    // fell into pit / off screen
    if (p.y > G.H + 40) { hurt(true); p.y = G.groundY - p.h; p.vy = 0 }

    // damaging collisions (visuals & glows are NOT part of these hitboxes)
    const php = playerHB()
    for (const o of G.obs) {
      if (o.type === "pit" || o.type === "platform") continue
      if (o.hitDone) continue
      if (aabb(php, obstacleHB(o))) {
        if (G.dashT > 0 && DESTRUCTIBLE[o.type]) {
          o.dead = true
          burst(o.x + o.w / 2, o.y + o.h / 2, G.world.accent, 14)
          SFX.dash()
        } else if (G.dashT > 0) {
          // dash phases through walls/cars: no damage, no destroy
        } else if (p.inv <= 0) {
          o.hitDone = true
          hurt(false)
        }
      }
    }

    // coins
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2
    for (const c of G.coinsArr) {
      if (c.got) continue
      const dx = c.x - cx, dy = c.y - cy
      if (dx * dx + dy * dy < (c.r + 34) * (c.r + 34)) {
        c.got = true
        G.coins += (profile.coin_level || 1) * G.coinMult
        SFX.coin()
        burst(c.x, c.y, G.world.coin, 6)
      }
    }
    // bonuses
    for (const b of G.bonuses) {
      if (b.got) continue
      const dx = b.x - cx, dy = b.y - cy
      if (dx * dx + dy * dy < (b.r + 32) * (b.r + 32)) {
        b.got = true
        applyBonus(b.type)
      }
    }

    // cleanup
    G.obs = G.obs.filter((o) => o.x > -220 && !o.dead)
    G.coinsArr = G.coinsArr.filter((c) => c.x > -40 && !c.got)
    G.bonuses = G.bonuses.filter((b) => b.x > -40 && !b.got)

    // particles
    for (const pt of G.parts) { pt.x -= (G.speed * 0.4 + -pt.vx) * dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 400 * dt; pt.life -= dt }
    G.parts = G.parts.filter((pt) => pt.life > 0)

    // spawn timers
    G.spawnT -= dt
    if (G.spawnT <= 0) {
      spawnObstacle()
      const minGap = clamp(1.05 - G.dist / 6000, 0.5, 1.05)
      G.spawnT = minGap + Math.random() * 0.35
    }
    G.coinT -= dt
    if (G.coinT <= 0) { spawnCoins(); G.coinT = 1.4 + Math.random() * 0.8 }
    G.bonusT -= dt
    if (G.bonusT <= 0) { spawnBonus(); G.bonusT = rand(9, 15) - (profile.bonus_level || 1) }

    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 30)

    // level finish
    if (G.level && G.dist >= G.goal) finish()
  }

  function applyBonus(type) {
    SFX.bonus()
    if (type === "shield") { G.shield = true; toast("🛡️ Bouclier !") }
    else if (type === "mega") { G.jumpBoostT = 6 + (profile.bonus_level || 1); toast("🚀 Méga-saut !") }
    else { G.coinBoostT = 8 + (profile.bonus_level || 1); toast("✨ Pièces x2 !") }
    burst(G.player.x + 20, G.player.y + 20, "#fff", 16)
  }

  function hurt(fall) {
    const p = G.player
    if (p.inv > 0 && !fall) return
    if (G.shield && !fall) {
      G.shield = false
      p.inv = 1.1
      G.shake = Math.max(G.shake, 8)
      SFX.hurt()
      toast("🛡️ Bouclier absorbé !")
      return
    }
    G.lives--
    p.inv = 1.3
    G.shake = Math.max(G.shake, 14)
    SFX.hurt()
    burst(p.x + 20, p.y + 30, "#ff2f7d", 18)
    drawHearts()
    if (G.lives <= 0) end()
  }

  /* ---- render ---- */
  function hash(n) { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x) }

  function draw() {
    const ctx = G.ctx, W = G.W, H = G.H, w = G.world
    ctx.save()
    if (G.shake > 0) ctx.translate(rand(-G.shake, G.shake), rand(-G.shake, G.shake))

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, w.sky[0]); sky.addColorStop(1, w.sky[1])
    ctx.fillStyle = sky; ctx.fillRect(-20, -20, W + 40, H + 40)

    // moon/sun glow
    ctx.save()
    ctx.globalAlpha = 0.8
    const mg = ctx.createRadialGradient(W * 0.78, H * 0.24, 8, W * 0.78, H * 0.24, 120)
    mg.addColorStop(0, "#ffffff"); mg.addColorStop(0.4, w.accent); mg.addColorStop(1, "transparent")
    ctx.fillStyle = mg
    ctx.beginPath(); ctx.arc(W * 0.78, H * 0.24, 120, 0, 7); ctx.fill()
    ctx.restore()

    // far parallax skyline
    drawSkyline(ctx, W, H, w.far, 0.12, 80, 150, 46)
    drawSkyline(ctx, W, H, w.mid, 0.26, 55, 210, 64)

    // ground
    const gy = G.groundY
    ctx.fillStyle = w.ground
    ctx.fillRect(0, gy, W, G.groundH)
    ctx.strokeStyle = w.accent
    ctx.lineWidth = 2
    ctx.shadowBlur = 18; ctx.shadowColor = w.accent
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
    ctx.shadowBlur = 0
    // ground dashes
    ctx.fillStyle = w.accent + "55"
    const off = G.worldScroll % 90
    for (let x = -off; x < W; x += 90) ctx.fillRect(x, gy + 44, 46, 4)

    // pits: carve out ground visually
    for (const o of G.obs) if (o.type === "pit") { ctx.fillStyle = "#000"; ctx.fillRect(o.x, gy - 1, o.w, G.groundH + 2) }

    // coins
    for (const c of G.coinsArr) {
      if (c.got) continue
      ctx.save(); ctx.shadowBlur = 16; ctx.shadowColor = w.coin; ctx.fillStyle = w.coin
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.fill()
      ctx.fillStyle = "#ffffffaa"; ctx.beginPath(); ctx.arc(c.x - 3, c.y - 3, c.r * 0.35, 0, 7); ctx.fill()
      ctx.restore()
    }

    // bonuses
    for (const b of G.bonuses) {
      if (b.got) continue
      const col = b.type === "shield" ? "#54ffc1" : b.type === "mega" ? "#a14dff" : "#ffd84a"
      const icon = b.type === "shield" ? "🛡️" : b.type === "mega" ? "🚀" : "✨"
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.sin(b.spin) * 0.2)
      ctx.shadowBlur = 22; ctx.shadowColor = col; ctx.strokeStyle = col; ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(0, 0, b.r, 0, 7); ctx.stroke()
      ctx.shadowBlur = 0; ctx.font = "20px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"
      ctx.fillText(icon, 0, 1); ctx.restore()
    }

    // obstacles
    for (const o of G.obs) drawObstacle(ctx, o, w)

    // particles
    for (const pt of G.parts) {
      ctx.globalAlpha = clamp(pt.life / pt.max, 0, 1)
      ctx.fillStyle = pt.color
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, 7); ctx.fill()
    }
    ctx.globalAlpha = 1

    drawPlayer(ctx, w)

    ctx.restore()
  }

  function drawSkyline(ctx, W, H, color, factor, minH, maxH, step) {
    const gy = G.groundY
    const off = (G.worldScroll * factor) % step
    ctx.fillStyle = color
    for (let i = -1; i * step - off < W; i++) {
      const x = i * step - off
      const seed = Math.floor((G.worldScroll * factor) / step) + i
      const h = minH + hash(seed) * (maxH - minH)
      ctx.fillRect(x, gy - h, step - 6, h)
      // window lights
      ctx.fillStyle = "#ffffff10"
      for (let wy = gy - h + 10; wy < gy - 10; wy += 16) ctx.fillRect(x + 6, wy, step - 18, 3)
      ctx.fillStyle = color
    }
  }

  function drawObstacle(ctx, o, w) {
    ctx.save()
    if (o.type === "spike") {
      ctx.fillStyle = "#ff2f7d"; ctx.shadowBlur = 16; ctx.shadowColor = "#ff2f7d"
      ctx.beginPath(); ctx.moveTo(o.x, o.y + o.h); ctx.lineTo(o.x + o.w / 2, o.y); ctx.lineTo(o.x + o.w, o.y + o.h); ctx.closePath(); ctx.fill()
    } else if (o.type === "wall") {
      ctx.fillStyle = "#123f6e"; ctx.strokeStyle = w.accent; ctx.lineWidth = 2; ctx.shadowBlur = 12; ctx.shadowColor = w.accent
      rr(ctx, o.x, o.y, o.w, o.h, 4); ctx.fill(); ctx.stroke()
    } else if (o.type === "car") {
      ctx.fillStyle = "#ff3e63"; ctx.shadowBlur = 14; ctx.shadowColor = "#ff3e63"
      rr(ctx, o.x, o.y + 16, o.w, o.h - 16, 8); ctx.fill()
      rr(ctx, o.x + 20, o.y, o.w - 40, 22, 6); ctx.fill()
      ctx.fillStyle = "#02101d"; ctx.beginPath(); ctx.arc(o.x + 22, o.y + o.h, 11, 0, 7); ctx.arc(o.x + o.w - 22, o.y + o.h, 11, 0, 7); ctx.fill()
    } else if (o.type === "drone") {
      ctx.fillStyle = "#a14dff"; ctx.shadowBlur = 16; ctx.shadowColor = "#a14dff"
      rr(ctx, o.x, o.y + 8, o.w, o.h - 12, 8); ctx.fill()
      ctx.fillStyle = "#54ffc1"; ctx.fillRect(o.x + 6, o.y + 14, o.w - 12, 4)
      ctx.strokeStyle = "#a14dff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(o.x + 6, o.y + 6); ctx.lineTo(o.x - 4, o.y); ctx.moveTo(o.x + o.w - 6, o.y + 6); ctx.lineTo(o.x + o.w + 4, o.y); ctx.stroke()
    } else if (o.type === "projectile") {
      ctx.fillStyle = "#00e5ff"; ctx.shadowBlur = 18; ctx.shadowColor = "#00e5ff"
      rr(ctx, o.x, o.y, o.w, o.h, 9); ctx.fill()
      ctx.fillStyle = "#ffffffaa"; rr(ctx, o.x + o.w - 8, o.y + 4, 6, o.h - 8, 3); ctx.fill()
    } else if (o.type === "platform") {
      ctx.fillStyle = "#0d2f52"; ctx.strokeStyle = w.accent; ctx.lineWidth = 2; ctx.shadowBlur = 12; ctx.shadowColor = w.accent
      rr(ctx, o.x, o.y, o.w, o.h, 6); ctx.fill(); ctx.stroke()
    }
    ctx.restore()
  }

  function drawPlayer(ctx, w) {
    const p = G.player
    // dash trail
    if (G.dashT > 0) {
      for (let i = 1; i <= 5; i++) {
        ctx.globalAlpha = 0.12 * (6 - i)
        ctx.fillStyle = w.accent
        rr(ctx, p.x - i * 16, p.y + 8, p.w, p.h - 12, 12); ctx.fill()
      }
      ctx.globalAlpha = 1
    }
    ctx.save()
    ctx.translate(p.x + p.w / 2, p.y + p.h)
    const sy = clamp(p.sy, 0.6, 1.25)
    ctx.scale(1 / Math.sqrt(sy), sy)
    ctx.translate(-(p.w / 2), -p.h)

    // invulnerability blink (visual only)
    if (p.inv > 0 && Math.floor(p.inv * 12) % 2) ctx.globalAlpha = 0.35

    // shield ring — purely visual, never affects hitbox
    if (G.shield) {
      ctx.strokeStyle = "#54ffc1"; ctx.lineWidth = 3; ctx.shadowBlur = 18; ctx.shadowColor = "#54ffc1"
      ctx.beginPath(); ctx.arc(p.w / 2, p.h / 2, 44, 0, 7); ctx.stroke(); ctx.shadowBlur = 0
    }

    // body
    ctx.fillStyle = "#0b1220"; ctx.strokeStyle = w.accent; ctx.lineWidth = 3; ctx.shadowBlur = 14; ctx.shadowColor = w.accent
    rr(ctx, 6, 30, 30, 30, 9); ctx.fill(); ctx.stroke()
    // head
    ctx.beginPath(); ctx.arc(21, 16, 15, 0, 7); ctx.fill(); ctx.stroke()
    // visor
    ctx.shadowBlur = 0; ctx.fillStyle = w.accent
    ctx.fillRect(12, 12, 20, 5)
    // legs (animated)
    ctx.strokeStyle = w.accent; ctx.lineWidth = 4
    const t = p.run * 16
    const swing = p.ground ? Math.sin(t) * 9 : 5
    ctx.beginPath(); ctx.moveTo(14, 58); ctx.lineTo(14 - swing, 70); ctx.moveTo(28, 58); ctx.lineTo(28 + swing, 70); ctx.stroke()
    ctx.restore()

    // update level progress bar
    if (G.level) $("progressBar").style.width = clamp((G.dist / G.goal) * 100, 0, 100) + "%"
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  /* ---- main loop (fixed timestep) ---- */
  function loop(now) {
    if (!G.running) return
    let frame = (now - G.last) / 1000
    if (frame > 0.1) frame = 0.1
    G.last = now
    G.acc += frame
    while (G.acc >= STEP) { step(STEP); G.acc -= STEP }
    // HUD
    $("dist").textContent = Math.floor(G.dist)
    $("runCoins").textContent = G.coins
    const dt = $("dashText")
    if (G.dashT > 0) { dt.textContent = "⚡ ACTIF"; dt.classList.remove("dash-ready") }
    else if (G.dashReady) { dt.textContent = "⚡ PRÊT"; dt.classList.add("dash-ready") }
    else { dt.textContent = "⚡ " + Math.ceil(G.dashCd) + "s"; dt.classList.remove("dash-ready") }
    draw()
    if (G.running) G.raf = requestAnimationFrame(loop)
  }

  /* ---- end states ---- */
  async function commonSave() {
    profile.coins = (profile.coins || 0) + G.coins
    profile.total_distance = (profile.total_distance || 0) + Math.floor(G.dist)
    profile.best_distance = Math.max(profile.best_distance || 0, Math.floor(G.dist))
    profile.quest_distance = (profile.quest_distance || 0) + Math.floor(G.dist)
    profile.quest_coins = (profile.quest_coins || 0) + G.coins
    profile.quest_games = (profile.quest_games || 0) + 1
    if (!isGuest && sb) {
      try {
        await sb.rpc("finish_run", {
          p_mode: G.level ? "level" : "infinite", p_level: G.level,
          p_distance: Math.floor(G.dist), p_coins: G.coins,
          p_seconds: Math.floor((performance.now() - G.startTime) / 1000),
        })
      } catch (e) {}
    }
    await persist()
  }
  async function finish() {
    if (!G.running) return
    G.running = false
    cancelAnimationFrame(G.raf)
    const reward = 150 + G.level * 12 + (profile.bonus_level || 1) * 30
    G.coins += reward
    if (G.level >= (profile.highest_level || 1) && G.level < 300) profile.highest_level = G.level + 1
    if (G.level >= 300) profile.highest_level = 300
    await commonSave()
    SFX.win()
    showEnd(G.level >= 300 ? "👑 CHAMPION !" : "🏁 NIVEAU " + G.level + " TERMINÉ")
  }
  async function end() {
    if (!G.running) return
    G.running = false
    cancelAnimationFrame(G.raf)
    await commonSave()
    SFX.over()
    showEnd("TU ES MORT")
  }
  function showEnd(title) {
    $("overTitle").textContent = title
    $("finalDist").textContent = Math.floor(G.dist)
    $("finalCoins").textContent = G.coins
    $("finalTime").textContent = Math.floor((performance.now() - G.startTime) / 1000) + "s"
    $("over").style.display = "grid"
    refreshTop(); renderAll()
  }

  /* ============================================================
     EVENT WIRING
     ============================================================ */
  function wire() {
    $("btnLogin").onclick = () => auth(false)
    $("btnCreate").onclick = () => auth(true)
    $("btnGuest").onclick = () => guest()
    $("btnAccount").onclick = () => { $("name").focus(); setErr("Entre un pseudo + mot de passe, puis SE CONNECTER ou CRÉER.", true) }
    ;[$("name"), $("pass")].forEach((i) => i.addEventListener("keydown", (e) => { if (e.key === "Enter") auth(false) }))

    $("btnLogout").onclick = logout
    $("btnMute").onclick = () => { muted = !muted; $("btnMute").textContent = muted ? "🔈" : "🔊"; if (!muted) SFX.tick() }

    $("tabs").addEventListener("click", (e) => { const b = e.target.closest("button[data-tab]"); if (b) switchTab(b.dataset.tab) })
    document.querySelectorAll("[data-goto]").forEach((b) => (b.onclick = () => switchTab(b.dataset.goto)))
    $("btnInfinite").onclick = () => start(0)

    // delegated menu clicks
    $("app").addEventListener("click", (e) => {
      const t = e.target.closest("button")
      if (!t) return
      if (t.dataset.level) start(parseInt(t.dataset.level, 10))
      else if (t.dataset.up) buyUpgrade(t.dataset.up)
      else if (t.dataset.pack) openPack(t.dataset.pack)
      else if (t.dataset.world) selectWorld(t.dataset.world)
      else if (t.dataset.quest) claimQuest(t.dataset.quest, parseInt(t.dataset.reward, 10))
    })
    $("btnFreePack").onclick = freePack
    $("btnClaimLogin").onclick = () => claimAutoLogin()
    $("btnAddFriend").onclick = addFriend
    $("btnAdminSearch").onclick = adminSearch

    // game controls
    const jb = $("btnJump")
    jb.addEventListener("pointerdown", (e) => { e.preventDefault(); jump() })
    jb.addEventListener("pointerup", releaseJump)
    jb.addEventListener("pointercancel", releaseJump)
    $("btnDash").addEventListener("pointerdown", (e) => { e.preventDefault(); dash() })
    $("btnQuit").onclick = quit
    $("btnRestart").onclick = restart
    $("btnOverMenu").onclick = quit

    // tap canvas to jump (mobile-friendly)
    const c = $("c")
    c.addEventListener("pointerdown", (e) => { e.preventDefault(); jump() })
    c.addEventListener("pointerup", releaseJump)

    // keyboard
    window.addEventListener("keydown", (e) => {
      if (e.repeat) return
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); jump() }
      else if (e.code === "ShiftLeft" || e.code === "ShiftRight" || e.code === "KeyK") { e.preventDefault(); dash() }
    })
    window.addEventListener("keyup", (e) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") releaseJump()
    })
  }

  /* ============================================================
     INIT
     ============================================================ */
  async function init() {
    wire()
    if (sb) {
      try {
        const r = await sb.auth.getSession()
        if (r.data.session) {
          user = r.data.session.user
          const q = await sb.from("profiles").select("*").eq("id", user.id).single()
          if (!q.error) { profile = q.data; isGuest = false; await boot() }
        }
      } catch (e) {}
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true })
  else init()
})()
