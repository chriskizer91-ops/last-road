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
    alias(a, b) { window.LR_PROPS[a] = window.LR_PROPS[b]; L.LRA.herds.clear(); return Object.keys(window.LR_PROPS).length; },
    life() { const A = L.LRA; let h = 0, run = 0, near = 1e9; const t = car(); for (const H of A.herds.values()) if (H) { h++; if (H.run > .3) run++; const dd = Math.hypot(H.x - t.p[0], H.z - t.p[2]); if (dd < near) { near = dd; A.nh = H; } } const N = A.nh; return { herds: h, running: run, nearest: Math.round(near), at: N ? [Math.round(N.x), Math.round(N.z), N.kind, N.mem.length] : null, drawn: A.drawn }; },
    nearHerd(d) { const N = L.LRA.nh; if (!N) return null; D.placeCar(N.x + d, N.z, Math.PI); D.setTestInput({ steer: 0, thr: 0, brk: 0, hb: 1, nos: false }); return [Math.round(N.x), Math.round(N.z)]; },
    shut() { __lrJ().closeJobDialog(); return { state: D.GAME.state }; },
    people() { return Object.fromEntries(Object.entries(__lrJ().PEOPLE).map(([k, p]) => [k, [Math.round(p.x), Math.round(p.z)]])); },
    props() { const P = L.LRP; return { made: P.mesh.size, tex: P.tex.size, drawn: P.drawn, tris: P.tris }; },
    air(x, z, alt, yaw, mph) { const t0 = car(); D.placeCar(x, z, yaw); const t = car(); t.p[1] += alt; const V = mph / 2.23694; t.v[0] = Math.cos(yaw) * V; t.v[2] = -Math.sin(yaw) * V; t.v[1] = 0;
      if (t.w && t.w.fill) t.w.fill(0); t.air = true; t.airT = 1; return { p: Array.from(t.p).map(v => Math.round(v)), place: D.GAME.place }; },
    distFill() { const t = car(); L.lrDistUpdate ? L.lrDistUpdate(t.p, true) : 0; return { tiles: L.LRD.tiles.size }; },
    dist() { const R = L.LRD; return { tiles: R.tiles.size, made: R.made, msEach: R.made ? +(R.ms / R.made).toFixed(1) : 0, drawnTris: R.tris, dbg: R.dbg }; },
    flora(r) { const t = car(); return { made: L.LRF.made, shapes: __dyb.TREES ? __dyb.TREES.shapes.length : null, near: L.lrFloraNear(t.p[0], t.p[2], r || 300) }; },
    findRock(x, z, R) { let best = null; const o = {}; for (let a = -R; a <= R; a += 60) for (let b = -R; b <= R; b += 60) { L.WG.sample(x + a, z + b, o); const r = L.WG.gtRegions(x + a, z + b, {}); if (r.sav < .5) continue; if (!best || o.rock > best.rock) best = { x: x + a, z: z + b, rock: +o.rock.toFixed(2), h: +o.h.toFixed(1) }; } return best; },
    goRock(R, d) { const t = car(), b = this.findRock(t.p[0], t.p[2], R); if (!b) return null; d = d || 110; const a = Math.atan2(b.z - t.p[2], b.x - t.p[0]);
      const x = b.x - Math.cos(a) * d, z = b.z - Math.sin(a) * d; this.park(x, z, Math.atan2(-(b.z - z), b.x - x)); return { rock: b, car: [Math.round(x), Math.round(z)] }; },
    goProp(id, obj, d, side) { const p = L.WG.GTP.find(q => q.id === id && q.obj === obj); if (!p) return null; d = d || 30; const a = p.yaw + (side || 0);
      const x = p.x + Math.cos(a) * d, z = p.z - Math.sin(a) * d; this.park(x, z, Math.atan2(-(p.z - z), p.x - x)); return { at: [Math.round(p.x), Math.round(p.z)], car: [Math.round(x), Math.round(z)] }; },
    regions() { const t = car(), R = L.WG.gtRegions(t.p[0], t.p[2], {}), o = {}; L.WG.sample(t.p[0], t.p[2], o); const r = {}; for (const k of ['sav', 'pans', 'dune', 'high', 'cany', 'delta', 'black']) r[k] = +(+R[k] || 0).toFixed(2); r.code = o.code; r.h = +o.h.toFixed(1); r.wl = o.wl > -1e8 ? +o.wl.toFixed(1) : null; return r; },
    seek(kind, d, R) { const t = car(), C = 2500, ca = Math.floor(t.p[0] / C), cb = Math.floor(t.p[2] / C); R = R || 14; let best = null, bd = 1e12;
      for (let a = ca - R; a <= ca + R; a++) for (let b = cb - R; b <= cb + R; b++) { const H = L.lraHerdFor(a, b); if (!H || H.kind !== kind) continue; const dd = Math.hypot(H.x - t.p[0], H.z - t.p[2]); if (dd < bd) { bd = dd; best = H; } }
      if (!best) return null; this.park(best.x + (d || 300), best.z, Math.PI); return { at: [Math.round(best.x), Math.round(best.z)], n: best.mem.length }; },
    calm(on) { L.LRA.calm = !!on; return { calm: L.LRA.calm }; },
    animals() { const A = L.LRA, P = L.LRP, out = {}; for (const [k, m] of P.mesh) if (/^G0/.test(k)) out[k] = m ? (P.tex.get(k) ? 'ready' : 'no picture') : 'failed'; return { drawn: A.drawn, tris: A.tris, meshes: out, busy: [...P.busy].filter(k => /^G0/.test(k) && !P.mesh.has(k)) }; },
    stat() { return L.lrStat(); },
    cam() { return { chaseOn: L.LRC.on, eye: L.LRC.e && L.LRC.e.map(v => +v.toFixed(1)), car: Array.from(car().p).map(v => +v.toFixed(1)) }; },
  };
})();
