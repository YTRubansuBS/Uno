(() => {
  'use strict'

  // Legacy compatibility file kept in the build.
  // Upgrade purchases are now saved directly and authoritatively by game.js.

  function installBoostCooldowns() {
    const pause = document.getElementById('btnPause')
    const hud = pause && pause.closest ? pause.closest('.hud') : null
    if (!pause || !hud) return false

    let column = document.getElementById('irPauseColumn')
    if (!column) {
      column = document.createElement('div')
      column.id = 'irPauseColumn'
      column.className = 'ir-pause-column'
      pause.parentElement.insertBefore(column, pause)
      column.appendChild(pause)
    }

    let box = document.getElementById('irBoostCooldowns')
    if (!box) {
      box = document.createElement('div')
      box.id = 'irBoostCooldowns'
      box.innerHTML = '<div class="ir-boost-title">BOOSTS ACTIFS</div><div class="ir-boost-list"></div>'
      column.appendChild(box)
    }

    if (!document.getElementById('irBoostCooldownStyle')) {
      const style = document.createElement('style')
      style.id = 'irBoostCooldownStyle'
      style.textContent = `
        .ir-pause-column{
          display:flex;
          flex-direction:column;
          align-items:flex-start;
          gap:10px;
          min-width:230px;
          max-width:260px;
          pointer-events:none;
        }
        .ir-pause-column > #btnPause{pointer-events:auto;min-width:170px}
        #irBoostCooldowns{
          display:none;
          flex-direction:column;
          gap:8px;
          width:230px;
          pointer-events:none;
          font-family:Inter,Arial,sans-serif;
        }
        .ir-boost-title{
          width:100%;
          box-sizing:border-box;
          padding:6px 10px;
          border-radius:10px;
          border:1px solid rgba(0,229,255,.30);
          background:linear-gradient(135deg,rgba(1,11,24,.96),rgba(12,4,30,.94));
          color:#00e5ff;
          font:900 11px/1 Orbitron,Inter,Arial,sans-serif;
          letter-spacing:2px;
          text-align:center;
          box-shadow:0 0 18px rgba(0,229,255,.12),inset 0 0 20px rgba(0,229,255,.04);
        }
        .ir-boost-list{
          display:flex;
          flex-direction:column;
          gap:8px;
        }
        .irBoostCooldown{
          position:relative;
          display:grid;
          grid-template-columns:34px 1fr auto;
          grid-template-rows:auto 6px;
          align-items:center;
          column-gap:9px;
          row-gap:6px;
          width:100%;
          min-height:54px;
          box-sizing:border-box;
          padding:8px 11px;
          overflow:hidden;
          border:1px solid rgba(0,229,255,.28);
          border-radius:13px;
          background:linear-gradient(135deg,rgba(2,10,23,.97),rgba(15,5,31,.94));
          box-shadow:0 8px 22px rgba(0,0,0,.34),0 0 16px rgba(0,229,255,.10),inset 0 0 18px rgba(0,229,255,.035);
          color:#fff;
          backdrop-filter:blur(10px);
        }
        .irBoostCooldown:before{
          content:"";
          position:absolute;
          left:0;
          top:0;
          bottom:0;
          width:3px;
          background:#00e5ff;
          box-shadow:0 0 12px #00e5ff;
        }
        .irBoostIcon{
          grid-row:1 / span 2;
          width:34px;
          height:34px;
          display:grid;
          place-items:center;
          border-radius:10px;
          background:rgba(0,229,255,.10);
          border:1px solid rgba(0,229,255,.25);
          font-size:23px;
          box-shadow:inset 0 0 12px rgba(0,229,255,.06);
        }
        .irBoostLabel{
          font:900 12px/1 Orbitron,Inter,Arial,sans-serif;
          letter-spacing:.8px;
          white-space:nowrap;
          text-shadow:0 0 8px rgba(0,229,255,.25);
        }
        .irBoostTime{
          font:900 14px/1 Inter,Arial,sans-serif;
          color:#7ffcff;
          font-variant-numeric:tabular-nums;
          white-space:nowrap;
        }
        .irBoostBar{
          grid-column:2 / span 2;
          width:100%;
          height:6px;
          overflow:hidden;
          border-radius:99px;
          background:rgba(255,255,255,.10);
          border:1px solid rgba(255,255,255,.06);
        }
        .irBoostBar i{
          display:block;
          height:100%;
          width:100%;
          border-radius:99px;
          background:linear-gradient(90deg,#00e5ff,#a14dff,#ff2f7d);
          box-shadow:0 0 10px rgba(0,229,255,.45);
          transition:width .08s linear;
        }
        .irBoostCooldown[data-type="shield"]{border-color:rgba(84,255,193,.36)}
        .irBoostCooldown[data-type="shield"]:before{background:#54ffc1;box-shadow:0 0 12px #54ffc1}
        .irBoostCooldown[data-type="shield"] .irBoostIcon{background:rgba(84,255,193,.10);border-color:rgba(84,255,193,.28)}
        .irBoostCooldown[data-type="shield"] .irBoostTime{color:#54ffc1}
        @media (max-width:700px){
          .ir-pause-column{min-width:185px;max-width:205px}
          #irBoostCooldowns{width:205px}
          .irBoostLabel{font-size:10px}
          .irBoostTime{font-size:12px}
        }
      `
      document.head.appendChild(style)
    }

    return true
  }

  function updateBoostCooldowns() {
    const box = document.getElementById('irBoostCooldowns')
    if (!box) return
    const list = box.querySelector('.ir-boost-list')
    const G = window.__IR_G
    if (!list || !G) return

    const items = []
    const addTimer = (type, icon, label, left, max) => {
      const n = Number(left || 0)
      if (n > 0) items.push({type,icon,label,left:n,max:Number(max)||15})
    }

    if (G.shield) items.push({type:'shield',icon:'🛡️',label:'BOUCLIER',left:0,max:1,active:true})
    addTimer('mega','🚀','MÉGA-SAUT',G.jumpBoostT,15)
    addTimer('coins','🪙','PIÈCES x2',G.coinBoostT,15)
    addTimer('jetpack','🛩️','JETPACK',G.jetpackT,15)
    addTimer('score','🏆','SCORE x2',G.scoreDoubleT,15)
    addTimer('magnet','🧲','AIMANT',G.magnetT,15)

    list.innerHTML = items.map(item => {
      const time = item.active ? 'ACTIF' : item.left.toFixed(1) + 's'
      const width = item.active ? 100 : Math.max(0, Math.min(100, item.left / item.max * 100))
      return '<div class="irBoostCooldown" data-type="' + item.type + '">' +
        '<span class="irBoostIcon">' + item.icon + '</span>' +
        '<span class="irBoostLabel">' + item.label + '</span>' +
        '<b class="irBoostTime">' + time + '</b>' +
        '<span class="irBoostBar"><i style="width:' + width.toFixed(1) + '%"></i></span>' +
        '</div>'
    }).join('')

    box.style.display = items.length && G.running ? 'flex' : 'none'
  }

  const timer = setInterval(() => {
    if (installBoostCooldowns()) updateBoostCooldowns()
  }, 100)
  window.__IR_BOOST_COOLDOWN_TIMER = timer
})()
