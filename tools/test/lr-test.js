/* Beyond the Last Road's test helpers (with salt-mini-plus redtail/game/rt-test.js and rt-fly-test.js loaded first) */
window.LRT_T = (() => {
  const D = __dyb, car = () => D.GAME.car, L = __lr;
  return {
    truck() { const t = car(), M = L.LRT.mesh; return { st: D.GAME.state, rt: !!t.rt, kit: t.build.kit || t.build.id, play: L.LR_PLAY(t), built: !!M,
      body: M && M.body.tris, wheel: M && M.wheel.tris, tex: L.LRT.texN, texPx: L.LRT.px, phone: L.LRT.phone, tris: __dyb.APP ? __dyb.APP.tris : null }; },
    frameTris() { try { return { tris: D.APP.tris }; } catch (e) { return { err: String(e) }; } },
    saves() { const k = []; for (let i = 0; i < localStorage.length; i++) k.push(localStorage.key(i)); return { lr: k.filter(x => x.startsWith('lr:')).length, sas: k.filter(x => x.startsWith('sas:')).length, keys: k.slice(0, 12) }; },
    paint() { return { paint: __rt2.RT.paint, texP: !!__rt2.RT.texP, btn: getComputedStyle(document.getElementById('rtPaintB') || document.body).display }; },
    park(x, z, yaw) { D.placeCar(x, z, yaw); D.setTestInput({ steer: 0, thr: 0, brk: 0, hb: 1, nos: false }); const t = car(); t.v[0] = t.v[1] = t.v[2] = 0; return { p: Array.from(t.p).map(v => Math.round(v)), place: D.GAME.place }; },
    lrv() { const V = L.LRV, P = V.parked, t = car(); L.lrParkTick(); return { inPlane: !!t.rt, can: V.can, btn: V.btn ? !V.btn.hidden : null, parked: P ? (P.rt ? 'heron' : 'truck') : null,
      at: P ? [Math.round(P.p[0]), Math.round(P.p[1] * 10) / 10, Math.round(P.p[2])] : null, me: Array.from(t.p).map(v => Math.round(v)), strip: V.stripI }; },
    swap() { const ok = L.lrSwap(); const t = car(); return { ok, inPlane: !!t.rt, me: Array.from(t.p).map(v => Math.round(v)), place: D.GAME.place }; },
    home() { const S = __dyb.WG ? null : null; return 0; },
    horz() { const H = L.LRH; return { tex: !!H.tex, loading: H.loading, loc: H.loc ? H.loc.map(x => !!x) : null, data: !!window.LR_HORZ }; },
    foot() { const ok = L.lrWalkStart(); const W = L.LRW; return { ok, on: W.on, p: W.p.map(v => Math.round(v * 10) / 10), footBtn: L.LRV.foot ? !L.LRV.foot.hidden : null }; },
    stick(x, y) { L.LRW.stick.x = x; L.LRW.stick.y = y; return { p: L.LRW.p.map(v => Math.round(v * 10) / 10) }; },
    face(yaw, pitch) { L.LRW.yaw = yaw; L.LRW.pitch = pitch; return 1; },
    getIn() { const ok = L.lrWalkEnd(); return { ok, on: L.LRW.on }; },
    job() { const { JOB, jActive, jRec } = __lrJ(); const A = jActive(); return { active: A ? A.q.id + ':' + A.a.step + ' ' + (A.s ? A.s.text : '') : null, near: JOB.near ? JOB.near.who + '/' + JOB.near.q.id : null, done: Object.keys(jRec().quests || {}), state: D.GAME.state }; },
    take() { const { JOB, jobListen } = __lrJ(); if (!JOB.near) return { err: 'nobody near' }; jobListen(JOB.near.who); const face = document.getElementById('jdFace'); const r = { title: document.getElementById('jdTitle').textContent, face: face && !face.hidden };
      document.getElementById('jdYes').click(); return r; },
    markDone(id) { const d = __lrJ().jRec(); d.quests[id] = { done: true, at: Date.now() }; return Object.keys(d.quests); },
    shut() { __lrJ().closeJobDialog(); return { state: D.GAME.state }; },
    people() { return Object.fromEntries(Object.entries(__lrJ().PEOPLE).map(([k, p]) => [k, [Math.round(p.x), Math.round(p.z)]])); },
    props() { const P = L.LRP; return { made: P.mesh.size, tex: P.tex.size, drawn: P.drawn, tris: P.tris }; },
    air(x, z, alt, yaw, mph) { const t0 = car(); D.placeCar(x, z, yaw); const t = car(); t.p[1] += alt; const V = mph / 2.23694; t.v[0] = Math.cos(yaw) * V; t.v[2] = -Math.sin(yaw) * V; t.v[1] = 0;
      if (t.w && t.w.fill) t.w.fill(0); t.air = true; t.airT = 1; return { p: Array.from(t.p).map(v => Math.round(v)), place: D.GAME.place }; },
    distFill() { const t = car(); L.lrDistUpdate ? L.lrDistUpdate(t.p, true) : 0; return { tiles: L.LRD.tiles.size }; },
    dist() { const R = L.LRD; return { tiles: R.tiles.size, made: R.made, msEach: R.made ? +(R.ms / R.made).toFixed(1) : 0, drawnTris: R.tris, dbg: R.dbg }; },
    cam() { return { chaseOn: L.LRC.on, eye: L.LRC.e && L.LRC.e.map(v => +v.toFixed(1)), car: Array.from(car().p).map(v => +v.toFixed(1)) }; },
  };
})();
