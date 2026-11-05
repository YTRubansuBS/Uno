(() => {
  'use strict'

  const DEVICE_KEY = 'irDeviceType'
  let overlay = null
  let shownForSession = false
  let hideTimer = null

  function detectDevice() {
    const ua = navigator.userAgent || ''
    const width = Math.min(window.innerWidth || 0, window.screen?.width || Infinity)
    const isTabletUA = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua)
    const isMobileUA = /Mobi|Android|iPhone|iPod/i.test(ua) && !isTabletUA
    if (isTabletUA || (isMobileUA === false && width >= 600 && width <= 1100 && ('ontouchstart' in window || navigator.maxTouchPoints > 0))) return 'tablet'
    if (isMobileUA || width < 600) return 'mobile'
    return 'pc'
  }

  function label(type) {
    if (type === 'mobile') return { icon: '📱', name: 'MOBILE', text: 'Interface compacte pour utiliser plus facilement tout l’espace de ton téléphone.' }
    if (type === 'tablet') return { icon: '📲', name: 'TABLETTE', text: 'Interface adaptée à la taille de ta tablette.' }
    return { icon: '💻', name: 'PC', text: 'Interface optimisée pour un écran PC.' }
  }

  function applyDevice(type) {
    document.documentElement.dataset.device = type
    document.body.dataset.device = type
    document.documentElement.style.setProperty('--ir-ui-scale', type === 'mobile' ? '0.82' : type === 'tablet' ? '0.90' : '1')
    try { localStorage.setItem(DEVICE_KEY, type) } catch {}
  }

  function create() {
    if (overlay && document.body.contains(overlay)) return
    overlay = document.createElement('section')
    overlay.id = 'irDeviceScreen'
    overlay.setAttribute('aria-live', 'polite')
    overlay.innerHTML = `
      <div class="ir-device-grid"></div>
      <div class="ir-device-card">
        <div class="ir-device-kicker">// APPAREIL DÉTECTÉ</div>
        <div id="irDeviceIcon" class="ir-device-icon">💻</div>
        <h1 id="irDeviceName">PC</h1>
        <p id="irDeviceText">Interface optimisée pour un écran PC.</p>
        <div class="ir-device-bar"><i></i></div>
        <small>ADAPTATION DE L'INTERFACE…</small>
      </div>`

    const style = document.createElement('style')
    style.textContent = `
#irDeviceScreen{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 35%,#10182b 0,#050810 48%,#02040a 100%);color:#f4f7ff;font-family:Inter,system-ui,sans-serif;overflow:hidden;padding:18px;box-sizing:border-box;opacity:0;pointer-events:none;transition:opacity .2s ease}
#irDeviceScreen .ir-device-grid{position:absolute;inset:0;opacity:.14;background-image:linear-gradient(rgba(0,229,255,.22) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.22) 1px,transparent 1px);background-size:42px 42px;transform:perspective(500px) rotateX(55deg) scale(1.35);transform-origin:center bottom}
#irDeviceScreen .ir-device-card{position:relative;width:min(560px,100%);padding:34px 28px;text-align:center;border:1px solid rgba(0,229,255,.32);border-radius:24px;background:rgba(4,7,14,.94);box-shadow:0 0 60px rgba(0,229,255,.12),inset 0 0 30px rgba(255,55,199,.05);backdrop-filter:blur(12px)}
#irDeviceScreen .ir-device-kicker{color:#ff4aa8;font-size:11px;font-weight:900;letter-spacing:2px;margin-bottom:12px}
#irDeviceScreen .ir-device-icon{font-size:58px;line-height:1;margin:5px 0 12px;filter:drop-shadow(0 0 16px rgba(0,229,255,.35))}
#irDeviceScreen h1{margin:0;font-size:30px;letter-spacing:2px;font-weight:900}
#irDeviceScreen p{margin:10px 0 20px;color:#9aa8c2;font-size:14px}
#irDeviceScreen .ir-device-bar{height:7px;border-radius:99px;background:#131b2c;overflow:hidden}
#irDeviceScreen .ir-device-bar i{display:block;width:0;height:100%;background:linear-gradient(90deg,#00e5ff,#ff37c7);box-shadow:0 0 18px rgba(0,229,255,.55);animation:irDeviceProgress 1.25s ease forwards}
#irDeviceScreen small{display:block;margin-top:12px;color:#71809a;font-size:10px;font-weight:900;letter-spacing:1.5px}
@keyframes irDeviceProgress{to{width:100%}}
@media(max-width:520px){#irDeviceScreen{padding:14px}#irDeviceScreen .ir-device-card{padding:28px 20px}#irDeviceScreen .ir-device-icon{font-size:50px}#irDeviceScreen h1{font-size:25px}}
html[data-device="mobile"] #app{--ir-ui-compact:.82}
html[data-device="tablet"] #app{--ir-ui-compact:.90}
html[data-device="pc"] #app{--ir-ui-compact:1}
html[data-device="mobile"] #app .top,html[data-device="tablet"] #app .top{padding:calc(12px * var(--ir-ui-compact)) calc(16px * var(--ir-ui-compact))}
html[data-device="mobile"] #app .tabs,html[data-device="tablet"] #app .tabs{padding:calc(12px * var(--ir-ui-compact)) calc(16px * var(--ir-ui-compact));gap:calc(8px * var(--ir-ui-compact))}
html[data-device="mobile"] #app .tabs button,html[data-device="tablet"] #app .tabs button{font-size:calc(13px * var(--ir-ui-compact));padding:calc(12px * var(--ir-ui-compact)) calc(16px * var(--ir-ui-compact))}
html[data-device="mobile"] #app .content,html[data-device="tablet"] #app .content{padding:calc(16px * var(--ir-ui-compact)) calc(16px * var(--ir-ui-compact)) 40px}
html[data-device="mobile"] #app .panel,html[data-device="tablet"] #app .panel{padding:calc(22px * var(--ir-ui-compact))}
html[data-device="mobile"] #game,html[data-device="tablet"] #game,html[data-device="pc"] #game{transform:none!important;zoom:1!important;touch-action:none}
html[data-device="mobile"] #c,html[data-device="tablet"] #c,html[data-device="pc"] #c{transform:none!important;zoom:1!important;width:100%!important;height:100%!important;touch-action:none}
`
    document.head.appendChild(style)
    document.body.appendChild(overlay)
  }

  function show() {
    create()
    const type = detectDevice()
    applyDevice(type)
    const info = label(type)
    overlay.querySelector('#irDeviceIcon').textContent = info.icon
    overlay.querySelector('#irDeviceName').textContent = info.name
    overlay.querySelector('#irDeviceText').textContent = info.text
    overlay.style.display = 'flex'
    overlay.style.opacity = '1'
    overlay.style.pointerEvents = 'auto'
    clearTimeout(hideTimer)
    hideTimer = setTimeout(hide, 1350)
  }

  function hide() {
    if (!overlay) return
    overlay.style.opacity = '0'
    overlay.style.pointerEvents = 'none'
    setTimeout(() => { if (overlay) overlay.style.display = 'none' }, 220)
  }

  function isLoggedIn() {
    const login = document.getElementById('login')
    const app = document.getElementById('app')
    if (!login || !app) return false
    const loginHidden = getComputedStyle(login).display === 'none' || login.classList.contains('hidden') || login.hidden
    const appVisible = getComputedStyle(app).display !== 'none' && !app.hidden
    return loginHidden && appVisible
  }

  function checkTransition() {
    if (!shownForSession && isLoggedIn()) { shownForSession = true; show() }
    if (!isLoggedIn()) shownForSession = false
  }

  function fixGameLayer() {
    const game = document.getElementById('game')
    const canvas = document.getElementById('c')
    if (!game || !canvas) return
    game.style.transform = 'none'
    game.style.zoom = '1'
    canvas.style.transform = 'none'
    canvas.style.zoom = '1'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.touchAction = 'none'
    game.style.touchAction = 'none'
  }

  function boot() {
    create()
    applyDevice(detectDevice())
    fixGameLayer()
    const observer = new MutationObserver(() => { checkTransition(); fixGameLayer() })
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] })
    window.addEventListener('resize', () => { applyDevice(detectDevice()); fixGameLayer() })
    window.addEventListener('orientationchange', () => setTimeout(fixGameLayer, 50), { passive: true })
    setInterval(checkTransition, 250)
    checkTransition()
  }

  window.IR_DEVICE_UI = { detectDevice, applyDevice, show, hide }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
})()
