/* ILLEGAL RUNNER — 5s bonus timer patch
   Loaded before game.js. It intercepts the engine fetch and patches the original
   bonus logic without touching the existing loader/game systems.
*/
(() => {
  'use strict'
  const ORIGINAL = 'de2f0579d3e51b2b898a9cc3c8c87a1c8e190a26/game.js'
  const nativeFetch = window.fetch.bind(window)

  function patch(source) {
    // Reset timer at the beginning of every run.
    source = source.replace(
      'G.shield = false; G.coinMult = 1; G.coinBoostT = 0; G.jumpBoostT = 0',
      'G.shield = false; G.coinMult = 1; G.coinBoostT = 0; G.jumpBoostT = 0; G.bonusTimer = 0; G.bonusType = null'
    )

    // All gameplay bonuses now last exactly 5 seconds.
    source = source.replace(
      /  function applyBonus\(type\) \{[\s\S]*?\n  \}\n\n  function hurt\(fall\)/,
      `  function applyBonus(type) {
    SFX.bonus()
    G.bonusTimer = 5
    G.bonusType = type
    if (type === "shield") { G.shield = true; toast("🛡️ Bouclier !") }
    else if (type === "mega") { G.jumpBoostT = 5; toast("🚀 Méga-saut !") }
    else { G.coinBoostT = 5; toast("✨ Pièces x2 !") }
    burst(G.player.x + 20, G.player.y + 20, "#fff", 16)
  }

  function hurt(fall)`
    )

    // Countdown is tied to the fixed physics clock, so pausing the game also pauses the bonus.
    source = source.replace(
      '    const p = G.player\n    p.run += dt',
      `    const p = G.player
    p.run += dt
    if (G.bonusTimer > 0) {
      G.bonusTimer -= dt
      if (G.bonusTimer <= 0) {
        G.bonusTimer = 0
        G.bonusType = null
        G.shield = false
        G.coinBoostT = 0
        G.jumpBoostT = 0
      }
    }`
    )

    // Visual timer in the game HUD.
    source = source.replace(
      'const STEP = 1 / 120 // fixed physics step',
      `(() => {
  const style = document.createElement("style")
  style.textContent = '#irBonusTimer{position:fixed;left:50%;top:82px;transform:translateX(-50%);z-index:2147483646;display:none;min-width:130px;padding:8px 14px;border:1px solid rgba(0,229,255,.8);border-radius:12px;background:rgba(2,4,10,.88);box-shadow:0 0 18px rgba(0,229,255,.35);font:800 16px Orbitron,Inter,sans-serif;letter-spacing:.5px;text-align:center;color:#fff;pointer-events:none}.irbt-time{font-size:20px;color:#00e5ff;margin-left:5px}'
  document.head.appendChild(style)
  const timer = document.createElement("div")
  timer.id = "irBonusTimer"
  document.body.appendChild(timer)
  function tickBonusTimer() {
    if (!G || !G.running || !G.bonusTimer || G.bonusTimer <= 0 || !G.bonusType) {
      timer.style.display = "none"
      return
    }
    const icons = { shield: "🛡️", mega: "🚀", x2: "🪙 x2" }
    const left = Math.max(0, G.bonusTimer)
    timer.innerHTML = (icons[G.bonusType] || "✨") + ' <span class="irbt-time">' + left.toFixed(1) + 's</span>'
    timer.style.display = "block"
  }
  setInterval(tickBonusTimer, 50)
})()
const STEP = 1 / 120 // fixed physics step`
    )

    return source
  }

  const originalFetch = window.fetch
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || ''
    if (url.includes(ORIGINAL)) {
      const response = await originalFetch(input, init)
      const text = await response.text()
      return new Response(patch(text), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      })
    }
    return originalFetch(input, init)
  }
})()
