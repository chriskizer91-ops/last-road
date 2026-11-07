/* Beyond the Last Road's test helpers (with salt-mini-plus redtail/game/rt-test.js and rt-fly-test.js loaded first) */
window.LRT_T = (() => {
  const D = __dyb, car = () => D.GAME.car, L = __lr;
  return {
    truck() { const t = car(), M = L.LRT.mesh; return { st: D.GAME.state, rt: !!t.rt, kit: t.build.kit || t.build.id, play: L.LR_PLAY(t), built: !!M,
      body: M && M.body.tris, wheel: M && M.wheel.tris, tex: L.LRT.texN, texPx: L.LRT.px, phone: L.LRT.phone, tris: __dyb.APP ? __dyb.APP.tris : null }; },
    frameTris() { try { return { tris: D.APP.tris }; } catch (e) { return { err: String(e) }; } },
    saves() { const k = []; for (let i = 0; i < localStorage.length; i++) k.push(localStorage.key(i)); return { lr: k.filter(x => x.startsWith('lr:')).length, sas: k.filter(x => x.startsWith('sas:')).length, keys: k.slice(0, 12) }; },
    paint() { return { paint: __rt2.RT.paint, texP: !!__rt2.RT.texP, btn: getComputedStyle(document.getElementById('rtPaintB') || document.body).display }; },
    air(x, z, alt, yaw, mph) { const t0 = car(); D.placeCar(x, z, yaw); const t = car(); t.p[1] += alt; const V = mph / 2.23694; t.v[0] = Math.cos(yaw) * V; t.v[2] = -Math.sin(yaw) * V; t.v[1] = 0;
      if (t.w && t.w.fill) t.w.fill(0); t.air = true; t.airT = 1; return { p: Array.from(t.p).map(v => Math.round(v)), place: D.GAME.place }; },
    distFill() { const t = car(); L.lrDistUpdate ? L.lrDistUpdate(t.p, true) : 0; return { tiles: L.LRD.tiles.size }; },
    dist() { const R = L.LRD; return { tiles: R.tiles.size, made: R.made, msEach: R.made ? +(R.ms / R.made).toFixed(1) : 0, drawnTris: R.tris, dbg: R.dbg }; },
    cam() { return { chaseOn: L.LRC.on, eye: L.LRC.e && L.LRC.e.map(v => +v.toFixed(1)), car: Array.from(car().p).map(v => +v.toFixed(1)) }; },
  };
})();
