(() => {
  "use strict"
  const isEmbed = new URLSearchParams(location.search).get("embed") === "1"
  if (!isEmbed) return

  const boot = () => {
    document.documentElement.classList.add("ir-embed")
    document.body?.classList.add("ir-embed")
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true })
  else boot()

  const dangerTypes = new Set(["spike","car","wall","drone","projectile","pit"])

  function fairRunGuard() {
    const G = window.__IR_G
    if (!G || !G.running || !G.player || !Array.isArray(G.obs)) return
    const p = G.player
    const speed = Number(G.speed || 380)
    const portrait = Number(G.H || 0) > Number(G.W || 1) * 1.08
    const minGap = Math.max(230, Math.min(360, speed * 0.54))

    const upcoming = G.obs
      .filter(o => o && !o.dead && dangerTypes.has(o.type) && o.x > p.x - 70 && o.x < G.W + 520)
      .sort((a,b) => a.x - b.x)

    let previous = null
    for (const o of upcoming) {
      if (previous && o.x - previous.x < minGap) o.dead = true
      else previous = o
    }

    const ground = G.obs
      .filter(o => o && !o.dead && ["spike","car","wall","pit"].includes(o.type) && o.x > p.x - 60 && o.x < G.W + 560)
      .sort((a,b) => a.x - b.x)

    const pitGap = portrait ? 340 : 290
    let previousGround = null
    for (const o of ground) {
      if (previousGround && o.x - previousGround.x < pitGap && (o.type === "pit" || previousGround.type === "pit")) o.dead = true
      else previousGround = o
    }

    for (const o of G.obs) {
      if (!o || o.dead || o.type === "platform") continue
      if (o.x < p.x + p.w + 30 && o.x > p.x - 18) o.x = p.x + Math.max(130, G.W * 0.38)
    }

    if (Number(G.dist) < 55) {
      for (const o of G.obs) {
        if (o && !o.dead && dangerTypes.has(o.type) && o.x < G.W * 0.78) o.dead = true
      }
    }

    G.obs = G.obs.filter(o => o && !o.dead)
  }

  const poll = setInterval(() => {
    boot()
    const G = window.__IR_G
    if (!G) return

    const login = document.getElementById("login")
    const app = document.getElementById("app")
    const game = document.getElementById("game")
    const jump = document.getElementById("btnJump")
    const dash = document.getElementById("btnDash")

    if (login) login.style.display = "none"
    if (app) app.style.display = "none"
    if (game) game.style.display = "block"
    if (jump) {
      jump.style.display = "flex"
      jump.removeAttribute("aria-hidden")
      jump.removeAttribute("tabindex")
    }
    if (dash) dash.style.display = "block"

    fairRunGuard()
  }, 60)

  window.addEventListener("beforeunload", () => clearInterval(poll), { once:true })
})()
