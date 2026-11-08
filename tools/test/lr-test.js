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
    hit(id) { const e = document.getElementById(id); if (!e) return null; const r = e.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { box: [r.left, r.top, r.width, r.height].map(Math.round), top: t ? t.tagName + '#' + t.id + '.' + t.className : null, z: t ? getComputedStyle(t).zIndex : null }; },
    tap(id) { const e = document.getElementById(id); if (!e) return null; e.click(); return { tapped: id, st: D.GAME.state }; },
    bayHeron(on) { __rt2.rtFly(!!on); return { st: D.GAME.state, rt: !!car().rt }; },
    tapq(q) { const e = document.querySelector(q); if (!e) return null; e.click(); return { tapped: q, st: D.GAME.state, heron: L.LRO ? L.LRO.heron : null }; },
    gas(th) { D.setTestInput({ steer: 0, thr: th === undefined ? 1 : th, brk: 0, hb: 0, nos: false }); return { gas: th === undefined ? 1 : th }; },
    where() { const t = car(), o = {}; L.WG.sample(t.p[0], t.p[2], o); return { p: [Math.round(t.p[0]), Math.round(t.p[2])], mph: +(t.speed * 2.23694).toFixed(1), code: o.code, depth: o.code === L.WG.SF.water ? +(o.wl - o.h).toFixed(2) : 0, rock: +o.rock.toFixed(2), deep: L.LRWD.deep }; },
    rtp() { const R = __rt2.RT; return { paint: R.paint, texN: R.texN, texP: !!R.texP, isOrig: R.tex ? R.tex.a === R.tex.a0 : null, mesh: !!R.mesh }; },
    bigmap(on) { D.APP.bigMap = !!on; return { bigMap: D.APP.bigMap, map: !!(L.LRMAP && L.LRMAP.px) }; },
    offer(who) { const J = __lrJ(); J.jobListen(who); const t = document.getElementById('jdTitle'); return { who, title: t ? t.textContent : null }; },
    stepAt() { const { jActive } = __lrJ(); const A = jActive(); if (!A) return null; const s = A.s; return { id: A.q.id, step: A.a.step, t: s.t, x: Math.round(s.x || 0), z: Math.round(s.z || 0), strip: s.strip, text: s.text }; },
    goStep(d) { const st = this.stepAt(); if (!st || st.t === 'land' || st.t === 'talk') return st; this.park(st.x + (d || 0), st.z, 0); return st; },
    jobsAll() { const J = __lrJ(); return D.JOBS ? D.JOBS.map(q => q.id) : null; },
    fogNow() { return { dust: L.LRDU ? +L.LRDU.k.toFixed(2) : null }; },
    setStep(n) { const d = __lrJ().jRec(); if (!d.active) return null; d.active.step = n; return this.stepAt(); },
    dustK(v) { L.LRDU.force = v; return { force: v }; },
    async soundsWav() { const sr = 32000, N = sr * 13, ctx = new OfflineAudioContext(2, N, sr), S = L.LRS, keep = [S.out, S.nb];
      const g = ctx.createGain(); g.connect(ctx.destination); S.out = g; const n = sr * 2, b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; S.nb = b;
      L.lrsBird(ctx, .3, -.6, .7); L.lrsBird(ctx, 1.4, .5, .6); L.lrsBird(ctx, 2.3, 0, .5); L.lrsBolt(ctx, 3.4, .3, .9, false); L.lrsBolt(ctx, 6.2, -.3, .9, true);
      L.lrsCall(ctx, 8.8, -.4, .8, 'cattle'); L.lrsCall(ctx, 10.2, .4, .8, 'crane'); L.lrsCall(ctx, 11.4, 0, .8, 'flamingo');
      const r = await ctx.startRendering(); S.out = keep[0]; S.nb = keep[1]; const L0 = r.getChannelData(0), R0 = r.getChannelData(1), out = new Int16Array(N * 2); let pk = 0;
      for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L0[i]), Math.abs(R0[i])); const k = pk > 0 ? .9 / pk : 1;
      for (let i = 0; i < N; i++) { out[i * 2] = L0[i] * k * 32767; out[i * 2 + 1] = R0[i] * k * 32767; }
      const u8 = new Uint8Array(out.buffer); let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
      window.__wav = { sr, b64: btoa(s), peak: pk }; return { sr, peak: +pk.toFixed(3), bytes: u8.length }; },
    lifeSound() { try { for (let i = 0; i < 30; i++) L.lrLife(.5, car()); return { ok: true, out: !!L.LRS.out, R: L.LRS.R ? +(+L.LRS.R.sav).toFixed(2) : null, audio: !!D.ENG && !!D.ENG.audio }; } catch (e) { return { err: String(e && e.stack || e).slice(0, 300) }; } },
    /* the Heron's take-off (on Roadhead's runway), climb and top speed, with the engine as fitted (setup: 'stock' | 'eng1' | 'eng2' | 'eng2+climb') */
    heronPerf(setup) { const G = L.LRG; G.own = {}; G.off = {}; L.LRM.mode = /^free/.test(setup || '') ? 'free' : 'campaign'; if (L.LRM.mode === 'free') { G.freeHp = +setup.slice(4); G.off = { tundra: 1, climbprop: 1 }; } else for (const k of (setup || '').split('+')) if (k && k !== 'stock') G.own[k === 'climb' ? 'climbprop' : k] = 1; if (G.own.eng2) G.own.eng1 = 1; L.lrOutfitApply();
      const R2 = __rt2, F = R2.RTF, MPH = 2.23694, th = R2.RT.th0, c0 = Math.cos(th), s0 = Math.sin(th), IN = { steer: 0, thr: 0, brk: 0, hb: 0, nos: false, elev: 0, flap: 0 };
      if (!car().rt) R2.rtFly(true);
      const run = (secs, each, dt = 1 / 120) => { D.setTestInput(IN); const n = Math.round(secs / dt); for (let i = 0; i < n; i++) { D.step(dt); if (each && each(i * dt + dt) === false) return; } };
      const pitchA = () => { const M = car().M; return Math.asin(M[3] * c0 + M[4] * s0); }, bank = () => Math.atan2(-car().M[5], car().M[4]);
      const pr = () => { const t = car(), w = t.w, M = t.M; return w[0] * M[2] + w[1] * M[5] + w[2] * M[8]; }, level = () => { const t = car(), w = t.w, M = t.M; IN.steer = Math.max(-1, Math.min(1, -bank() * 2.2 - (w[0] * M[0] + w[1] * M[3] + w[2] * M[6]) * .5)); };
      const holdV = vt => { IN.elev = Math.max(-1, Math.min(1, (F.V - vt) * .09 - pr() * .9)); };
      const S = L.WG.GTS[0], x = S.x - S.dx * 430, z = S.z - S.dz * 430, yaw = Math.atan2(-S.dz, S.dx); D.placeCar(x, z, yaw); IN.brk = 1; run(2); IN.brk = 0; IN.flap = 1; IN.thr = 1;
      const t = car(), x0 = t.p[0], z0 = t.p[2], d = () => Math.round(Math.hypot(t.p[0] - x0, t.p[2] - z0)); let tail = 0, lift = null, clear = null;
      run(45, () => { if (F.V * MPH < 22) IN.elev = 0; else if (!tail) IN.elev = -.7; if (!tail && pitchA() < th - 4 / 57.3) { tail = 1; IN.elev = 0; } if (tail && !lift && F.V * MPH > 44) IN.elev = .45;
        if (!lift && t.air && F.alt > .4) lift = d(); if (lift) { holdV(60 / MPH); level(); } if (lift && !clear && F.alt > 15.24) { clear = d(); return false; } });
      IN.flap = 0; const a0 = F.alt; run(20, () => { holdV(65 / MPH); level(); }); const climb = Math.round((F.alt - a0) / 20 * 196.85);
      /* top speed, full throttle, held level */
      const a1 = F.alt; run(60, () => { IN.elev = Math.max(-1, Math.min(1, -F.vs * .1 - (F.alt - a1) * .02 - pr() * .9)); level(); });
      return { setup: setup || 'stock', hp: G.hp, liftoff_m: lift, clear50ft_m: clear, climb_fpm_at65: climb, top_mph: +(F.V * MPH).toFixed(0) }; },
    setSafe(x, z, yaw) { L.LRWD.safe = { x, z, yaw }; L.LRWD.bog = 3; return L.LRWD.safe; },
    modeNext(m) { L.lrModeSet(m); return { mode: L.LRM.mode }; },
    money(n) { return { money: L.lrMoney(n || 0) }; },
    towBtn() { const b = document.getElementById('lrTow'); return { shown: !!(b && !b.hidden), text: b ? b.textContent : null, bog: +L.LRWD.bog.toFixed(1), deep: L.LRWD.deep, safe: !!L.LRWD.safe }; },
    jobCardTip(who) { const J = __lrJ(); J.jobListen(who); const d = document.getElementById('jdTip') || document.querySelector('#jobDlg .tip, #jd .hint'); return { tip: d ? d.textContent : null }; },
    /* on foot: stand at a model's own spot (lx, lz in its frame), facing yaw (the world's) */
    walkAt(id, obj, lx, lz, yaw, pitch) { const p = L.WG.GTP.find(q => q.id === id && q.obj === obj); if (!p) return null; const c = Math.cos(p.yaw), s = Math.sin(p.yaw);
      const x = p.x + lx * c + lz * s, z = p.z - lx * s + lz * c, W = L.LRW; if (!W.on) { this.park(x + 30, z, 0); L.lrWalkStart(); }
      W.p[0] = x; W.p[2] = z; const f = L.lrWalkFloor(x, z, 999); W.p[1] = f === f ? f : L.WG.sample(x, z, {}).h; W.fl = W.p[1]; W.yaw = yaw === undefined || yaw === null ? Math.atan2(-(p.z - z), p.x - x) : yaw; W.pitch = pitch || 0;
      return { at: W.p.map(v => +v.toFixed(2)), floor: f === f ? +f.toFixed(2) : 'none', ground: +L.WG.sample(x, z, {}).h.toFixed(2) }; },
    /* walk straight on (yaw) for secs, as the stick would; where you got to and how high you stand */
    walkSim(yaw, secs, run) { const W = L.LRW; if (yaw !== null && yaw !== undefined) W.yaw = yaw; W.stick.x = 0; W.stick.y = run ? -1 : -.9; const y0 = W.p[1], P0 = W.p.slice(); let hi = -1e9, lo = 1e9;
      for (let i = 0; i < Math.round(secs * 30); i++) { L.lrWalkStep(1 / 30); hi = Math.max(hi, W.p[1]); lo = Math.min(lo, W.p[1]); } W.stick.y = 0;
      return { from: P0.map(v => +v.toFixed(1)), to: W.p.map(v => +v.toFixed(2)), moved: +Math.hypot(W.p[0] - P0[0], W.p[2] - P0[2]).toFixed(2), rose: +(W.p[1] - y0).toFixed(2), hi: +hi.toFixed(2), lo: +lo.toFixed(2) }; },
    /* from a model's frame to the world's, and the world's to its frame */
    local(id, obj, x, z) { const p = L.WG.GTP.find(q => q.id === id && q.obj === obj), c = Math.cos(p.yaw), s = Math.sin(p.yaw), dx = x - p.x, dz = z - p.z; return [+(dx * c - dz * s).toFixed(2), +(dx * s + dz * c).toFixed(2)]; },
    /* on foot at a world spot, facing yaw */
    walkW(x, z, yaw, pitch) { const W = L.LRW; if (!W.on) { this.park(x + 30, z, 0); const t = car(); t.p[1] = Math.min(t.p[1], L.WG.sample(t.p[0], t.p[2], {}).h + .8); t.v[0] = t.v[1] = t.v[2] = 0; L.lrWalkStart(); } W.p[0] = x; W.p[2] = z; const f = L.lrWalkFloor(x, z, 999); W.p[1] = f === f ? f : L.WG.sample(x, z, {}).h; W.fl = W.p[1];
      W.yaw = yaw || 0; W.pitch = pitch || 0; return { at: W.p.map(v => +v.toFixed(2)), floor: f === f ? +f.toFixed(2) : 'none' }; },
    /* the finds: all of them, or one place's */
    finds(site) { const F = L.lrFdInit(); if (!F) return null; const R = L.lrFdRec(); return F.filter(f => !site || f.site.id === site).map(f => ({ id: f.id, kind: f.kind, P: f.P.map(v => +v.toFixed(1)), n: f.n ? f.n.map(v => +v.toFixed(2)) : null, noted: !!R.n[f.id], photo: !!R.p[f.id] })); },
    /* stand in front of a find (d metres off), looking at it; where you could stand */
    goFind(id, d) { const F = L.lrFdInit(), f = F.find(q => q.id === id); if (!f) return null; d = d || 2.2; const tries = [];
      if (f.n) for (const k of [1, .8, .6, 1.3, 1.6]) tries.push([f.P[0] + f.n[0] * d * k, f.P[2] + f.n[2] * d * k]);
      for (let a = 0; a < 16; a++) for (const k of [1, 1.5, .7]) tries.push([f.P[0] + Math.cos(a / 16 * 6.283) * d * k, f.P[2] + Math.sin(a / 16 * 6.283) * d * k]);
      for (const [x, z] of tries) { const fl = L.lrWalkFloor(x, z, f.P[1]); if (!(fl === fl) || fl > f.P[1] + .3) continue; const eye = [x, fl + 1.62, z]; if (!L.lrWalkSees(eye, f.P, f.kind === 'glyph' ? 0 : 1.4)) continue;
        const dx = f.P[0] - x, dz = f.P[2] - z, dy = f.P[1] - eye[1]; this.walkW(x, z, Math.atan2(-dz, dx), Math.atan2(dy, Math.hypot(dx, dz))); L.LRW.p[1] = fl; L.LRW.fl = fl; return { id, at: [+x.toFixed(1), +fl.toFixed(2), +z.toFixed(1)], dist: +Math.hypot(dx, dy, dz).toFixed(2) }; }
      return { id, err: 'nowhere to stand' }; },
    /* (the k-th find at a place: ids have underscores, which the runner turns into commas) */
    goFindN(site, k, d) { const F = L.lrFdInit().filter(f => f.site.id === site); return F[k] ? this.goFind(F[k].id, d) : null; },
    /* every find at a place into the book (as if looked at) */
    noteAll(site) { const F = L.lrFdInit().filter(f => f.site.id === site); for (const f of F) L.lrFdNote(f); return F.length; },
    standDbg(id) { const f = L.lrFdInit().find(q => q.id === id); const out = []; for (let a = 0; a < 8; a++) for (const d of [2.2, 3.5]) { const x = f.P[0] + Math.cos(a / 8 * 6.283) * d, z = f.P[2] + Math.sin(a / 8 * 6.283) * d, fl = L.lrWalkFloor(x, z, f.P[1]);
      out.push([a, d, fl === fl ? +(fl - f.P[1]).toFixed(2) : 'X', fl === fl ? L.lrWalkSees([x, fl + 1.62, z], f.P, 1.4) : '-', +(L.WG.sample(x, z, {}).h - f.P[1]).toFixed(2)]); } return { P: f.P.map(v => +v.toFixed(1)), out }; },
    /* the truck's roll, on flat ground: kicked into a roll (kick: degrees a second about its length) or sliding
       sideways (slide: m/s); sim switches (off: 'trip+body'); every 0.05 s: its roll (unwrapped), roll rate, height */
    tipTest(kick, slide, secs, off) { const t = car(); if (t.rt) return 'in the Heron'; const SD = t.sim ? t.sim.f : {}, keep = Object.assign({}, SD);
      for (const k of (off || '').split('+')) if (k) SD[k] = 0; if (t.applySim) t.applySim();
      const S2 = L.WG.GTS[2], x = S2 ? S2.x + 300 : t.p[0], z = S2 ? S2.z + 300 : t.p[2]; D.placeCar(x, z, 0);   /* (out on the salt pan, nothing near) */ const IN = { steer: 0, thr: 0, brk: 1, hb: 1, nos: false }; D.setTestInput(IN);
      for (let i = 0; i < 240; i++) D.step(1 / 120);
      const roll = () => Math.atan2(-t.M[5], t.M[4]), rr = () => t.w[0] * t.M[0] + t.w[1] * t.M[3] + t.w[2] * t.M[6];
      const R = t.M; t.w[0] += R[0] * kick / 57.3; t.w[1] += R[3] * kick / 57.3; t.w[2] += R[6] * kick / 57.3;
      t.v[0] += R[2] * slide; t.v[1] += R[5] * slide; t.v[2] += R[8] * slide; IN.brk = 0; IN.hb = 0; D.setTestInput(IN);
      let prev = roll(), tot = 0, mx = 0, out = [], y0 = t.p[1], ymax = 0, eg = 0, ew = 0; const n = Math.round(secs * 120);
      const jumps = []; let pv = t.v[1], pw = Math.hypot(...t.w);
      for (let i = 1; i <= n; i++) { D.step(1 / 120); const r = roll();
        { const dv = t.v[1] - pv, dw = Math.hypot(...t.w) - pw; pv = t.v[1]; pw = Math.hypot(...t.w);
          if ((dv > .35 || Math.abs(dw) > 1.2) && jumps.length < 8) jumps.push({ t: +(i / 120).toFixed(3), dv: +dv.toFixed(2), dw: +dw.toFixed(2), roll: Math.round(tot * 57.3), up: +t.M[4].toFixed(2),
            W: t.wheels.map(w => w.contact ? [Math.round(w.Fz), Math.round(w.Fy), +(w.lp || 0).toFixed(2), +(w.off || 0).toFixed(2), +(w.comp || 0).toFixed(2), Math.round(w.dig * 100) / 100 || 0] : 0) }); } let d = r - prev; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; tot += d; prev = r;
        mx = Math.max(mx, Math.abs(rr()) * 57.3); ymax = Math.max(ymax, t.p[1] - y0); const ev = t.ev || {}; eg = Math.max(eg, ev.ground || 0); ew = Math.max(ew, ev.wall || 0);
        if (i % 6 === 0) { const W = t.wheels; out.push([+(i / 120).toFixed(2), Math.round(tot * 57.3), Math.round(rr() * 57.3), +(t.p[1] - y0).toFixed(2), W.filter(w => w.contact).length, Math.round(Math.max(...W.map(w => w.Fz || 0))), Math.round(Math.max(...W.map(w => Math.abs(w.Fy || 0)))), +eg.toFixed(1), +ew.toFixed(1), +t.v[1].toFixed(1)]); eg = ew = 0; } }
      Object.assign(SD, keep); if (t.applySim) t.applySim();
      return { sim: !!t.sim, level: D.APP ? D.APP.level : '?', kick, slide, off: off || '', endRoll: Math.round(tot * 57.3), maxRate: Math.round(mx), maxRise: +ymax.toFixed(2), m: t.m, I: Array.from(t.I).map(Math.round), hcg: t.c.hcg, track: t.c.track || null, trace: out.filter((_, k) => k % 2 === 0), jumps }; },
    /* the truck dropped from h metres onto the salt pan, then driven flat out for secs: how it lands and how fast it goes */
    dropDrive(h, secs) { const t = car(); const S2 = L.WG.GTS[2]; D.placeCar(S2.x + 300, S2.z + 300, 0); const IN = { steer: 0, thr: 0, brk: 1, hb: 1, nos: false }; D.setTestInput(IN);
      for (let i = 0; i < 240; i++) D.step(1 / 120); const y0 = t.p[1]; t.p[1] += h; t.v.fill(0); t.w.fill(0); let lo = 1e9, hi = -1e9, fz = 0, bounce = 0, landed = false;
      for (let i = 0; i < 360; i++) { D.step(1 / 120); lo = Math.min(lo, t.p[1] - y0); fz = Math.max(fz, ...t.wheels.map(w => w.Fz || 0)); if (t.v[1] < -1) landed = true; if (landed) bounce = Math.max(bounce, t.p[1] - y0); }
      IN.brk = 0; IN.hb = 0; IN.thr = 1; D.setTestInput(IN); const x0 = t.p[0], z0 = t.p[2]; for (let i = 0; i < secs * 120; i++) D.step(1 / 120);
      return { drop: h, lowest: +lo.toFixed(3), bounceAbove: +bounce.toFixed(3), maxFz: Math.round(fz), mph: +(Math.hypot(t.v[0], t.v[2]) * 2.23694).toFixed(1), metres: Math.round(Math.hypot(t.p[0] - x0, t.p[2] - z0)) }; },
    fd() { const D = L.LRFD, R = L.lrFdRec(); return { cur: D.cur ? D.cur.id : null, dwell: +D.dwell.toFixed(2), near: D.near.length, noted: Object.keys(R.n).length, photos: Object.keys(R.p).length, paid: R.paid, shot: L.LRW.ui && L.LRW.ui.shot ? !L.LRW.ui.shot.hidden : null }; },
    book(page) { L.LRFD.page = page || 'places'; L.lrBookOpen(true); return { open: !L.LRFD.ui.hidden }; },
    bookShut() { L.lrBookOpen(false); return 1; },
    own(id) { L.LRG.own[id] = 1; return Object.keys(L.LRG.own); },
    cam() { return { chaseOn: L.LRC.on, eye: L.LRC.e && L.LRC.e.map(v => +v.toFixed(1)), car: Array.from(car().p).map(v => +v.toFixed(1)) }; },
  };
})();
