```json
{"objects": [
  {"name": "bush_dense", "size_m": [3.2, 2.1, 2.9],
   "views": [
     {"label": "Dense – side", "box": [28, 14, 480, 316], "cam": [0, 0, 1], "up": [0, 1, 0]},
     {"label": "Dense – top", "box": [522, 16, 856, 316], "cam": [0, 1, 0], "up": [0, 0, -1]}
   ]},
  {"name": "bush_half_dead", "size_m": [2.85, 1.78, 2.34],
   "views": [
     {"label": "Half-dead – side", "box": [58, 385, 462, 638], "cam": [0, 0, 1], "up": [0, 1, 0]},
     {"label": "Half-dead – top", "box": [525, 372, 852, 640], "cam": [0, 1, 0], "up": [0, 0, -1]}
   ]},
  {"name": "bush_clump", "size_m": [4.9, 1.34, 1.9],
   "views": [
     {"label": "Clump (three) – side", "box": [28, 740, 726, 930], "cam": [0, 0, 1], "up": [0, 1, 0]},
     {"label": "Clump (three) – top", "box": [778, 670, 1452, 932], "cam": [0, 1, 0], "up": [0, 0, -1]}
   ]}
 ],
 "notes": "Arid scrub bush in three variants: olive-grey leaves on a grey, vase-shaped bundle of stems, a few tan seed pods, and a patch of red soil and leaf litter. The 1 m scale bar is about 142 px, giving: dense ≈3.2 m wide × 2.1 m tall; half-dead ≈2.85 × 1.8 m with bare twigs toward +x/+z; clump of three ≈4.9 × 1.35 m. The top views are drawn smaller than the side views, so depths come from their proportions. Each 'side' view is used as the front (+z), and the dense three-quarter view is left out."}
```

```js
function build(THREE) {
  // ---------- fixed seeded sequence (identical every run) ----------
  let seed = 20240611;
  function rnd() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
  function rr(a, b) { return a + (b - a) * rnd(); }

  // ---------- materials (one per name) ----------
  const COLORS = {
    foliage: 0x737a58,
    bark: 0x7d766e,
    dead_wood: 0x8c7a69,
    leaf_litter: 0xaa784e,
    seed_pods: 0xb98c55
  };
  const mats = {};
  function M(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name], roughness: 0.95, metalness: 0.0 });
    return mats[name];
  }
  function add(g, geo, name) {
    const m = new THREE.Mesh(geo, M(name));
    m.name = name;
    g.add(m);
    return m;
  }

  // ---------- primitives ----------
  const SQ = 0.82; // leaf clumps are slightly flattened
  function lump(g, x, y, z, r) {            // 42 tris
    const m = add(g, new THREE.SphereGeometry(1, 7, 4), 'foliage');
    m.position.set(x, y, z);
    m.scale.set(r, r * SQ, r);
    m.rotation.y = rnd() * Math.PI;
    return m;
  }
  function mass(g, x, y, z, rx, ry, rz) {   // 100 tris
    const m = add(g, new THREE.SphereGeometry(1, 10, 6), 'foliage');
    m.position.set(x, y, z);
    m.scale.set(rx, ry, rz);
    return m;
  }
  const UP = new THREE.Vector3(0, 1, 0);
  function stem(g, a, b, r0, r1, name) {    // 10 tris
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const len = d.length();
    if (len < 0.01) return null;
    const m = add(g, new THREE.CylinderGeometry(r1, r0, len, 5, 1, true), name);
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    m.quaternion.setFromUnitVectors(UP, d.multiplyScalar(1 / len));
    return m;
  }
  function litter(g, x, z, rx, rz) {        // 64 tris
    const m = add(g, new THREE.CylinderGeometry(1, 1, 0.03, 16, 1), 'leaf_litter');
    m.position.set(x, 0.015, z);
    m.scale.set(rx, 1, rz);
    return m;
  }
  function pod(g, x, y, z) {                // 30 tris
    const m = add(g, new THREE.SphereGeometry(1, 5, 4), 'seed_pods');
    m.position.set(x, y, z);
    m.scale.set(0.04, 0.1, 0.04);
    m.rotation.z = rr(-0.35, 0.35);
    return m;
  }

  // ---------- generic dome-shaped bush: inner mass + skirt ring + shoulder ring + crown + vase stems ----------
  function canopyBush(g, o) {
    const TAU = Math.PI * 2;
    const isDead = (p) => {
      if (!o.dead) return false;
      const w = ((p % TAU) + TAU) % TAU;
      return w > o.dead[0] && w < o.dead[1];
    };
    const ex = o.rx - o.rl, ez = o.rz - o.rl;
    // inner foliage mass keeps the top view solid
    const cTop = o.h - 0.02, cBot = o.coreBottom, cs = o.coreScale || 1;
    mass(g, o.cx + (o.coreDx || 0), (cTop + cBot) / 2, o.cz + (o.coreDz || 0),
      (o.rx - 1.05 * o.rl) * cs, (cTop - cBot) / 2, (o.rz - 1.05 * o.rl) * cs);
    // lower skirt ring (hangs low at the sides, lifted front/back so stems show)
    for (let i = 0; i < o.n1; i++) {
      const p = (TAU * i) / o.n1 + rr(-0.08, 0.08);
      const r = o.rl * rr(0.9, 1.08), k = rr(0.95, 1.0), dy = rr(-0.04, 0.04);
      if (isDead(p)) continue;
      const c = Math.cos(p), s = Math.sin(p);
      lump(g, o.cx + (o.rx - r) * c * k,
        o.skirt + r * SQ + (1 - Math.abs(c)) * o.lift + dy,
        o.cz + (o.rz - r) * s * k, r);
    }
    // shoulder ring
    for (let i = 0; i < o.n2; i++) {
      const p = (TAU * (i + 0.5)) / o.n2 + rr(-0.1, 0.1);
      const r = o.rl * rr(0.88, 1.0), dy = rr(-0.05, 0.05);
      if (isDead(p)) continue;
      lump(g, o.cx + (o.rx - r) * Math.cos(p) * o.upR, o.upY + dy,
        o.cz + (o.rz - r) * Math.sin(p) * o.upR, r);
    }
    // crown
    for (let i = 0; i < o.nTop; i++) {
      const p = (TAU * i) / o.nTop + 0.7;
      const r = o.rl * 0.9, rad = o.nTop > 1 ? 0.3 : 0;
      lump(g, o.cx + (o.topDx || 0) + (o.rx - r) * Math.cos(p) * rad, o.h - r * SQ,
        o.cz + (o.topDz || 0) + (o.rz - r) * Math.sin(p) * rad, r);
    }
    // stems fanning out from the base like a vase
    for (let i = 0; i < o.nStems; i++) {
      const p = (TAU * (i + rr(0.1, 0.6))) / o.nStems;
      const br = rr(0.02, 0.1), mr = rr(0.38, 0.5), tr = rr(0.7, 0.85), my = rr(0.85, 1.1), ty = rr(0.9, 1.1);
      if (isDead(p)) continue;
      const c = Math.cos(p), s = Math.sin(p), R = o.stemR;
      const b = [o.cx + c * o.rx * br, 0.03, o.cz + s * o.rz * br];
      const m = [o.cx + c * ex * mr, o.stemMid * my, o.cz + s * ez * mr];
      const t = [o.cx + c * ex * tr, o.stemTip * ty, o.cz + s * ez * tr];
      stem(g, b, m, R, R * 0.65, 'bark');
      stem(g, m, t, R * 0.65, R * 0.3, 'bark');
      if (o.extra && i % 2 === 0) {
        stem(g, m, [o.cx + c * ex * mr * 1.05, o.stemTip * 1.25, o.cz + s * ez * mr * 1.05], R * 0.5, R * 0.25, 'bark');
      }
    }
  }

  // bare dead limbs radiating into one sector of a bush
  function deadLimbs(g, cx, cz, rx, rz, angles, top) {
    for (const deg of angles) {
      const p = deg * Math.PI / 180;
      const Q = (f, y, dp) => [cx + Math.cos(p + dp) * rx * f, y, cz + Math.sin(p + dp) * rz * f];
      const b = Q(0.06, 0.03, 0);
      const m = Q(0.4, rr(0.35, 0.45), 0);
      const t = Q(0.75, rr(0.8, 0.98), 0.05);
      stem(g, b, m, 0.032, 0.022, 'dead_wood');
      stem(g, m, t, 0.022, 0.012, 'dead_wood');
      stem(g, t, Q(1.0, t[1] - rr(0.08, 0.18), 0.12), 0.011, 0.005, 'dead_wood');
      stem(g, t, Q(0.7, top - rr(0, 0.04), -0.15), 0.011, 0.005, 'dead_wood');
      stem(g, m, Q(0.9, rr(0.4, 0.55), -0.25), 0.014, 0.005, 'dead_wood');
    }
  }

  // ================= DENSE (3.2 x 2.1 x 2.9) =================
  const dense = new THREE.Group();
  dense.name = 'bush_dense';
  litter(dense, 0, 0, 1.4, 1.25);
  canopyBush(dense, {
    cx: 0, cz: 0, rx: 1.6, rz: 1.45, h: 2.1, rl: 0.42,
    skirt: 0.42, lift: 0.5, n1: 10, n2: 8, upR: 0.85, upY: 1.48, nTop: 2,
    coreBottom: 0.72, nStems: 12, stemMid: 0.6, stemTip: 1.15, stemR: 0.05, extra: true
  });
  pod(dense, 0.55, 1.22, 1.27);
  pod(dense, 0.58, 1.45, 1.12);
  pod(dense, -0.42, 1.5, 1.17);

  // ================= HALF-DEAD (2.85 x 1.78 x 2.34) =================
  const half = new THREE.Group();
  half.name = 'bush_half_dead';
  litter(half, -0.1, 0.0, 1.0, 0.85);
  const HB = [-0.12, 0.03, 0.0];
  const leaves = [
    [-0.15, 1.48, -0.2, 0.36], [0.3, 1.36, -0.45, 0.32], [-0.6, 1.35, -0.1, 0.36],
    [-1.05, 1.08, 0.0, 0.36], [-0.98, 0.76, 0.3, 0.32], [-0.9, 1.0, -0.6, 0.34],
    [-0.3, 1.1, -0.82, 0.34], [0.32, 1.12, -0.85, 0.3], [-0.72, 0.98, 0.68, 0.33],
    [-0.25, 1.2, 0.45, 0.33], [0.12, 0.95, 0.02, 0.3], [-0.2, 1.5, 0.22, 0.3]
  ];
  for (const L of leaves) lump(half, L[0], L[1], L[2], L[3]);
  const live = [
    [-0.15, 1.25, -0.2], [0.25, 1.15, -0.45], [-0.6, 1.15, -0.1], [-0.95, 0.9, 0.05],
    [-0.85, 0.7, 0.3], [-0.35, 0.95, -0.7], [-0.65, 0.85, 0.6], [0.1, 0.8, 0.02]
  ];
  for (const t of live) {
    const b = [HB[0] + (t[0] - HB[0]) * 0.06, 0.03, HB[2] + (t[2] - HB[2]) * 0.06];
    const m = [HB[0] + (t[0] - HB[0]) * 0.35, t[1] * 0.5, HB[2] + (t[2] - HB[2]) * 0.35];
    stem(half, b, m, 0.045, 0.03, 'bark');
    stem(half, m, t, 0.03, 0.014, 'bark');
  }
  // dead side: +x and front (+z); [tip, twig1, twig2, low twig]
  const deadL = [
    [[1.1, 0.95, 0.1], [1.42, 0.82, 0.3], [1.3, 1.18, -0.15], [0.9, 0.45, 0.5]],
    [[0.75, 1.3, -0.2], [1.13, 1.22, -0.5], [0.92, 1.62, -0.1], [0.6, 0.9, -0.6]],
    [[0.6, 1.15, 0.6], [1.0, 1.25, 0.9], [0.45, 1.55, 0.65], [0.7, 0.6, 0.95]],
    [[0.9, 0.7, 0.75], [1.32, 0.68, 1.0], [1.1, 1.0, 1.15], [0.4, 0.4, 0.9]],
    [[0.1, 0.9, 0.85], [0.25, 1.05, 1.17], [-0.45, 0.78, 1.12], [-0.2, 0.4, 0.9]],
    [[0.45, 1.45, -0.55], [0.75, 1.55, -1.0], [0.35, 1.72, -0.45], [0.75, 1.0, -0.95]],
    [[1.0, 0.5, -0.4], [1.4, 0.58, -0.62], [1.22, 0.88, -0.9], [0.8, 0.3, -0.75]]
  ];
  for (const D of deadL) {
    const t = D[0];
    const b = [HB[0] + (t[0] - HB[0]) * 0.06, 0.03, HB[2] + (t[2] - HB[2]) * 0.06];
    const m = [HB[0] + (t[0] - HB[0]) * 0.4, t[1] * 0.45, HB[2] + (t[2] - HB[2]) * 0.4];
    stem(half, b, m, 0.038, 0.026, 'dead_wood');
    stem(half, m, t, 0.026, 0.014, 'dead_wood');
    stem(half, t, D[1], 0.013, 0.006, 'dead_wood');
    stem(half, t, D[2], 0.013, 0.006, 'dead_wood');
    stem(half, m, D[3], 0.016, 0.006, 'dead_wood');
  }
  pod(half, 0.9, 1.5, -0.12);
  pod(half, 0.96, 1.46, -0.06);

  // ================= CLUMP OF THREE (4.9 x 1.34 x 1.9) =================
  const clump = new THREE.Group();
  clump.name = 'bush_clump';
  litter(clump, 0.05, 0.0, 2.25, 0.8);
  // left: full, tallest
  canopyBush(clump, {
    cx: -1.55, cz: 0.03, rx: 0.9, rz: 0.88, h: 1.33, rl: 0.3,
    skirt: 0.28, lift: 0.3, n1: 8, n2: 5, upR: 0.8, upY: 0.98, nTop: 1,
    coreBottom: 0.5, nStems: 7, stemMid: 0.3, stemTip: 0.7, stemR: 0.035
  });
  // middle: full, lower
  canopyBush(clump, {
    cx: -0.07, cz: 0.1, rx: 0.7, rz: 0.82, h: 1.06, rl: 0.25,
    skirt: 0.22, lift: 0.22, n1: 8, n2: 4, upR: 0.78, upY: 0.8, nTop: 1,
    coreBottom: 0.42, nStems: 6, stemMid: 0.25, stemTip: 0.55, stemR: 0.03
  });
  // right: leafy on its +x side, bare twigs toward -x / back
  canopyBush(clump, {
    cx: 1.47, cz: -0.05, rx: 0.98, rz: 0.88, h: 1.22, rl: 0.3,
    skirt: 0.22, lift: 0.25, n1: 8, n2: 5, upR: 0.78, upY: 0.92, nTop: 1,
    topDx: 0.3, topDz: 0.1, coreBottom: 0.45, coreScale: 0.72, coreDx: 0.25, coreDz: 0.12,
    dead: [2.45, 5.15], nStems: 7, stemMid: 0.3, stemTip: 0.65, stemR: 0.035
  });
  deadLimbs(clump, 1.47, -0.05, 0.98, 0.88, [160, 200, 240, 280], 1.24);

  return { bush_dense: dense, bush_half_dead: half, bush_clump: clump };
}
```