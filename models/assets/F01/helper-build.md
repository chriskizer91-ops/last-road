```json
{
  "objects": [
    {
      "name": "tree_young",
      "size_m": [5.1, 3.0, 4.85],
      "views": [
        {"label": "Young – Side", "box": [25, 275, 218, 390], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Young – Top", "box": [35, 644, 154, 758], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "tree_mature",
      "size_m": [12.4, 6.3, 11.6],
      "views": [
        {"label": "Mature – Side", "box": [234, 150, 704, 390], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Mature – Top", "box": [209, 565, 491, 831], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "tree_old",
      "size_m": [23.0, 9.9, 20.2],
      "views": [
        {"label": "Old – Side", "box": [654, 14, 1528, 390], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Old – Top", "box": [530, 477, 980, 872], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    }
  ],
  "notes": "Flat-topped umbrella acacia at three ages. The scale bar is 1 m ≈ 38 px, which gives heights of 3.0, 6.3 and 9.9 m (the mature tree's label says 7 m). The drawn side crowns are much wider than the labelled widths (≈5.1, 12.4 and 23 m against 4, 10 and 16 m), and I followed the drawing so the outlines overlay it. The top views are drawn at a smaller scale than the side views; depth comes from their aspect ratio. The old tree's grey dead limb (+x) reaches further out in the top view than in the side view. I modelled it as the side view shows it, and the old tree's top box leaves the protruding tip out."
}
```

```js
function build(THREE) {
  const COL = { bark: 0x7d6e5f, foliage: 0x8a8746, dead_wood: 0xb4aca0 };
  const mats = {};
  function mat(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COL[name] });
    return mats[name];
  }

  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function interp(xs, ys, x) {
    if (x <= xs[0]) return ys[0];
    for (let i = 1; i < xs.length; i++) {
      if (x <= xs[i]) {
        const t = (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
        return ys[i - 1] + (ys[i] - ys[i - 1]) * t;
      }
    }
    return ys[ys.length - 1];
  }

  const UP = new THREE.Vector3(0, 1, 0);

  // tapered open cylinder between two points, slightly overlapped at the joints
  function seg(g, a, b, r0, r1, radial, name) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    if (len < 1e-4) return;
    dir.multiplyScalar(1 / len);
    const ov = Math.min(r0, r1) * 0.5;
    const geo = new THREE.CylinderGeometry(r1, r0, len + 2 * ov, radial, 1, true);
    const m = new THREE.Mesh(geo, mat(name));
    m.name = name;
    m.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    m.quaternion.setFromUnitVectors(UP, dir);
    g.add(m);
  }

  function chain(g, pts, r0, r1, n, radial, name) {
    const curve = new THREE.CatmullRomCurve3(pts);
    const P = curve.getPoints(n);
    for (let i = 0; i < n; i++) {
      seg(g, P[i], P[i + 1], r0 + (r1 - r0) * i / n, r0 + (r1 - r0) * (i + 1) / n, radial, name);
    }
    return curve;
  }

  function tree(p) {
    const g = new THREE.Group();
    const R = rng(p.seed);
    const hx = p.W / 2, hz = p.D / 2;
    const pr = p.prof;
    const top = (r) => interp(pr.r, pr.top, r);
    const bot = (r) => interp(pr.r, pr.bot, r);

    // ---- crown: flattened foliage clumps over an elliptical disc ----
    function clump(u, v, k, center) {
      const rr = Math.min(Math.sqrt(u * u + v * v), 1);
      const t = top(rr), b = bot(rr);
      let ry = Math.max((t - b) / 2, p.minRy);
      let cy = t - ry;
      if (!center) {
        cy -= R() * 0.12 * ry;
        ry *= 0.92 + 0.08 * R();
      }
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 5), mat('foliage'));
      m.name = 'foliage';
      m.scale.set(k * hx, ry, k * hz);
      m.position.set(u * hx, cy, v * hz);
      g.add(m);
    }
    clump(0, 0, p.rh, true);
    for (let i = 0; i < p.rings.length; i++) {
      const rf = p.rings[i][0], n = p.rings[i][1];
      const outer = i === p.rings.length - 1;
      const off = outer ? 0 : R() * Math.PI * 2;
      const q = Math.max(1, Math.round(n / 4));
      for (let j = 0; j < n; j++) {
        const fixed = outer && (j % q === 0); // pins the crown's x/z extremes
        const a = off + (j + (fixed ? 0 : (R() - 0.5) * 0.4)) * Math.PI * 2 / n;
        const k = p.rh * (0.9 + 0.2 * R());
        const r = outer ? 1 - k : rf + (R() - 0.5) * 0.04;
        clump(Math.cos(a) * r, Math.sin(a) * r, k, false);
      }
    }

    // ---- trunk with root flare ----
    const fl = new THREE.Mesh(new THREE.CylinderGeometry(p.rB, p.fr, p.fh, p.tRad, 1, true), mat('bark'));
    fl.name = 'bark';
    fl.position.set(p.tx, p.fh / 2, p.tz);
    g.add(fl);
    const T0 = new THREE.Vector3(p.tx, p.fh * 0.6, p.tz);
    const S = new THREE.Vector3(p.tx + p.lean[0], p.hs, p.tz + p.lean[1]);
    const TM = new THREE.Vector3(p.tx + p.lean[0] * 0.4, (p.fh * 0.6 + p.hs) / 2, p.tz + p.lean[1] * 0.4);
    chain(g, [T0, TM, S], p.rB, p.rT, 2, p.tRad, 'bark');

    // ---- limbs: rise steeply, then spread under the flat crown ----
    function grow(start, th, lvl) {
      const L = p.levels[lvl];
      const jit = lvl === p.levels.length - 1 ? 0.05 : 0.1;
      const rf = L.rf * (1 - jit + 2 * jit * R());
      const t = top(rf), b = bot(rf);
      const E = new THREE.Vector3(Math.cos(th) * rf * hx, b + L.yf * (t - b), Math.sin(th) * rf * hz);
      const M = new THREE.Vector3(
        start.x + (E.x - start.x) * L.hf,
        start.y + (E.y - start.y) * L.vf,
        start.z + (E.z - start.z) * L.hf
      );
      const curve = chain(g, [start, M, E], L.r0, L.r1, L.segs, L.rad, 'bark');
      if (lvl + 1 < p.levels.length) {
        const N = p.levels[lvl + 1];
        for (let j = 0; j < N.n; j++) {
          const a = th + N.spread * (j - (N.n - 1) / 2) + (R() - 0.5) * 0.2;
          grow(curve.getPoint(1 - 0.12 * (j % 2)), a, lvl + 1);
        }
      }
      return curve;
    }
    const curves = p.angles.map((th) => {
      const st = new THREE.Vector3(
        S.x + Math.cos(th) * p.rT * 0.4,
        S.y - p.rT * 0.3,
        S.z + Math.sin(th) * p.rT * 0.4
      );
      return grow(st, th, 0);
    });

    // ---- old tree: pale dead limb drooping out on +x ----
    if (p.dead) {
      const A = curves[0].getPoint(0.75);
      const dc = chain(g, [A, new THREE.Vector3(4.8, 5.3, 0.4), new THREE.Vector3(7.5, 4.1, 0.2)],
        0.17, 0.035, 4, 6, 'dead_wood');
      const F1 = dc.getPoint(0.5);
      chain(g, [F1, new THREE.Vector3(5.7, 5.6, 0.5), new THREE.Vector3(6.4, 5.8, 0.6)],
        0.07, 0.02, 2, 5, 'dead_wood');
      const F2 = dc.getPoint(0.8);
      chain(g, [F2, new THREE.Vector3(6.9, 4.8, 0.1), new THREE.Vector3(7.2, 5.2, 0.0)],
        0.045, 0.015, 2, 5, 'dead_wood');
    }

    return g;
  }

  return {
    tree_young: tree({
      seed: 11, W: 5.1, D: 4.85, rh: 0.22, minRy: 0.25,
      rings: [[0.4, 7], [0.78, 12]],
      prof: { r: [0, 0.4, 0.8], top: [3.0, 2.85, 2.65], bot: [1.95, 2.0, 2.2] },
      tx: 0.05, tz: 0, lean: [0.03, 0], hs: 1.25, rB: 0.085, rT: 0.065, fr: 0.13, fh: 0.15, tRad: 8,
      angles: [0.4, 2.0, 3.5, 5.0],
      levels: [
        { rf: 0.4, yf: -0.1, hf: 0.3, vf: 0.7, r0: 0.045, r1: 0.028, segs: 3, rad: 6 },
        { n: 2, spread: 0.7, rf: 0.75, yf: 0.3, hf: 0.5, vf: 0.55, r0: 0.025, r1: 0.01, segs: 2, rad: 5 }
      ]
    }),
    tree_mature: tree({
      seed: 23, W: 12.4, D: 11.6, rh: 0.18, minRy: 0.4,
      rings: [[0.28, 6], [0.55, 11], [0.82, 16]],
      prof: { r: [0, 0.28, 0.55, 0.82], top: [6.3, 6.05, 5.75, 5.35], bot: [4.35, 4.3, 4.4, 4.65] },
      tx: -0.3, tz: 0, lean: [0.08, 0.04], hs: 2.3, rB: 0.33, rT: 0.26, fr: 0.52, fh: 0.5, tRad: 10,
      angles: [0.3, 1.35, 2.4, 3.45, 4.5, 5.55],
      levels: [
        { rf: 0.45, yf: -0.12, hf: 0.3, vf: 0.7, r0: 0.17, r1: 0.09, segs: 3, rad: 7 },
        { n: 2, spread: 0.5, rf: 0.8, yf: 0.3, hf: 0.5, vf: 0.55, r0: 0.08, r1: 0.025, segs: 3, rad: 5 }
      ]
    }),
    tree_old: tree({
      seed: 37, W: 23.0, D: 20.2, rh: 0.14, minRy: 0.6,
      rings: [[0.22, 6], [0.43, 10], [0.645, 15], [0.86, 24]],
      prof: { r: [0, 0.3, 0.6, 0.86], top: [9.9, 9.55, 8.85, 8.15], bot: [6.6, 6.4, 6.6, 7.0] },
      tx: -0.7, tz: 0.8, lean: [0.1, 0], hs: 3.4, rB: 0.75, rT: 0.6, fr: 1.25, fh: 0.9, tRad: 12,
      angles: [0.15, 1.75, 3.25, 4.75],
      levels: [
        { rf: 0.32, yf: -0.12, hf: 0.3, vf: 0.7, r0: 0.42, r1: 0.24, segs: 4, rad: 8 },
        { n: 3, spread: 0.5, rf: 0.62, yf: 0.0, hf: 0.5, vf: 0.55, r0: 0.2, r1: 0.1, segs: 3, rad: 6 },
        { n: 2, spread: 0.26, rf: 0.88, yf: 0.35, hf: 0.5, vf: 0.5, r0: 0.09, r1: 0.03, segs: 2, rad: 5 }
      ],
      dead: true
    })
  };
}
```