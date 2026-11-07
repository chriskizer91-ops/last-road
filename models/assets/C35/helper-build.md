```json
{"objects": [{"name": "stone_ring", "size_m": [16, 2.95, 16],
  "views": [
    {"label": "Front", "box": [18, 612, 792, 758], "cam": [0, 0, 1], "up": [0, 1, 0]},
    {"label": "Side", "box": [816, 614, 1522, 758], "cam": [1, 0, 0], "up": [0, 1, 0]},
    {"label": "Back", "box": [18, 821, 792, 961], "cam": [0, 0, -1], "up": [0, 1, 0]},
    {"label": "Side", "box": [816, 819, 1522, 961], "cam": [-1, 0, 0], "up": [0, 1, 0]},
    {"label": "Top", "box": [952, 36, 1463, 549], "cam": [0, 1, 0], "up": [0, 0, -1]}
  ]}],
 "notes": "A ring of lichen-covered standing stones about 2.1 m tall and 13 m across, on a low 16 m earth disc (scale bar 1 m = about 48 px). A tall split 'M' stone about 2.95 m high stands at the back on the sight-line, with a narrow channel running from it to a 1.9 x 2.3 m slab carved with a hand. A fallen slab lies at front-left and the gap in the ring faces the front. The flat views disagree: the top view sets the ring back on the disc, the side views centre it (ring moved 0.3 m forward as a compromise), and the back view leaves out the split stone. One back-left stone is inferred from the three-quarter view."}
```

```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'observatory_stone_ring';

  // ---------- materials (one per name) ----------
  const COL = { dirt: 0x75503a, stone: 0x7b6a55, sandstone: 0xa58a6c, red_stone: 0x7e4f36, dry_grass: 0xa98a52 };
  const mats = {};
  function mesh(geo, name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COL[name] });
    const m = new THREE.Mesh(geo, mats[name]);
    m.name = name;
    return m;
  }

  // ---------- fixed seeded sequence ----------
  let seed = 35035;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function jit(a) { return (rnd() * 2 - 1) * a; }

  // ---------- ground disc: low mound, 16 m across ----------
  const TOP = [[0, 0.30], [3.0, 0.29], [6.0, 0.26], [7.0, 0.21], [7.6, 0.13], [8.0, 0.04]];
  const prof = [new THREE.Vector2(0, 0), new THREE.Vector2(8, 0)];
  for (let i = TOP.length - 1; i >= 0; i--) prof.push(new THREE.Vector2(TOP[i][0], TOP[i][1]));
  root.add(mesh(new THREE.LatheGeometry(prof, 48), 'dirt'));
  function groundY(x, z) {
    const r = Math.hypot(x, z);
    for (let i = 0; i < TOP.length - 1; i++) {
      const a = TOP[i], b = TOP[i + 1];
      if (r <= b[0]) return a[1] + (b[1] - a[1]) * (r - a[0]) / (b[0] - a[0]);
    }
    return 0.04;
  }

  // ---------- helpers ----------
  // Profile in XY (x across, y up), extruded through z by `thick`, centred on z.
  function slab(points, thick, bev) {
    const sh = new THREE.Shape();
    sh.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) sh.lineTo(points[i][0], points[i][1]);
    sh.closePath();
    const depth = Math.max(0.02, thick - 2 * bev);
    const g = new THREE.ExtrudeGeometry(sh, {
      depth: depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev,
      bevelSegments: 1, curveSegments: 1
    });
    g.translate(0, 0, -depth / 2);
    return g;
  }

  // A rough standing stone: slightly bulging, tapering sides and an uneven chamfered top.
  function stoneGeo(w, h, t) {
    const B = 0.05;
    const hw = w / 2 - B, hh = h - B;
    const tp = 0.05 + 0.07 * rnd();
    const c = 0.07 + 0.08 * rnd();
    const hl = 0.9 + 0.1 * rnd(), hr = 0.9 + 0.1 * rnd();
    const mx = jit(0.35) * hw;
    const pts = [
      [-hw, 0], [hw, 0],
      [hw - tp * 0.3, hh * 0.5],
      [hw - tp, hh * hr - c],
      [hw - tp - c * 1.4, hh * hr],
      [mx, hh],
      [-hw + tp + c * 1.4, hh * hl],
      [-hw + tp, hh * hl - c],
      [-hw + tp * 0.3, hh * 0.5]
    ];
    return slab(pts, t, B);
  }

  // Dry grass tufts
  const coneGeo = new THREE.ConeGeometry(0.2, 0.42, 5);
  function tuft(x, z, s) {
    const t = mesh(coneGeo, 'dry_grass');
    t.scale.set(s * (1 + jit(0.25)), s, s * (1 + jit(0.25)));
    t.position.set(x, groundY(x, z) + 0.21 * s - 0.06, z);
    t.rotation.y = rnd() * Math.PI;
    root.add(t);
  }

  // ---------- standing stones ----------
  const ZS = 0.3;               // forward shift of the ring stones (top view vs side views compromise)
  const CX = 0.15, CZ = -0.9;   // ring centre in plan, used to face each stone inward
  const STONES = [
    // plan x, plan z (from Top view), width, thickness, height
    [-2.79, -6.05, 1.40, 0.85, 2.15],
    [-4.86, -4.01, 1.35, 0.80, 2.10],
    [-5.80, -1.57, 1.45, 0.85, 2.20],
    [-5.86,  1.47, 1.50, 0.90, 2.25],
    [-4.36,  3.35, 1.30, 0.95, 1.50],
    [ 2.92, -6.52, 1.30, 0.80, 2.10],
    [ 4.80, -4.64, 1.50, 0.85, 2.20],
    [ 6.21, -1.66, 1.40, 0.85, 2.15],
    [ 6.05,  1.16, 1.45, 0.85, 2.25],
    [ 4.95,  3.67, 1.40, 0.85, 2.15],
    [ 3.23,  5.24, 1.35, 0.90, 2.05]
  ];
  STONES.forEach(function (s) {
    const px = s[0], pz = s[1], w = s[2], t = s[3], h = s[4];
    const z = pz + ZS;
    const ry = Math.atan2(px - CX, pz - CZ) + jit(0.12);
    const m = mesh(stoneGeo(w, h, t), 'stone');
    m.rotation.order = 'YXZ';
    m.rotation.set(jit(0.035), ry, jit(0.03));
    m.position.set(px, 0, z);
    root.add(m);
    const c = Math.cos(ry), sn = Math.sin(ry);
    const offs = [
      [-(w / 2 + 0.1), jit(0.25)],
      [w / 2 + 0.1, jit(0.25)],
      [jit(0.4), (rnd() < 0.5 ? -1 : 1) * (t / 2 + 0.12)]
    ];
    offs.forEach(function (o) {
      tuft(px + o[0] * c + o[1] * sn, z - o[0] * sn + o[1] * c, 0.8 + rnd() * 0.5);
    });
  });

  // ---------- split "M" stone on the sight-line (back, x = 0) ----------
  const splitZ = -7.55 + ZS;
  const split = new THREE.Group();
  split.position.set(0, 0, splitZ);
  const leftHalf = [[-0.87, 0], [-0.07, 0], [-0.07, 2.36], [-0.40, 2.88], [-0.62, 2.80], [-0.84, 2.58]];
  const rightHalf = [[0.07, 0], [0.87, 0], [0.84, 2.53], [0.60, 2.78], [0.46, 2.85], [0.07, 2.37]];
  split.add(mesh(slab(leftHalf, 0.9, 0.05), 'stone'));
  split.add(mesh(slab(rightHalf, 0.9, 0.05), 'stone'));
  root.add(split);
  tuft(-1.05, splitZ + 0.2, 1.1);
  tuft(1.05, splitZ + 0.1, 1.0);
  tuft(0.5, splitZ + 0.6, 0.8);

  // ---------- hand-carved slab (centre) ----------
  const hs = new THREE.Shape();
  const ax = 0.9, az = 1.1, rr = 0.25;
  hs.moveTo(-ax + rr, -az);
  hs.lineTo(ax - rr, -az);
  hs.quadraticCurveTo(ax, -az, ax, -az + rr);
  hs.lineTo(ax, az - rr);
  hs.quadraticCurveTo(ax, az, ax - rr, az);
  hs.lineTo(-ax + rr, az);
  hs.quadraticCurveTo(-ax, az, -ax, az - rr);
  hs.lineTo(-ax, -az + rr);
  hs.quadraticCurveTo(-ax, -az, -ax + rr, -az);
  const hg = new THREE.ExtrudeGeometry(hs, {
    depth: 0.24, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05,
    bevelSegments: 2, curveSegments: 4
  });
  hg.rotateX(-Math.PI / 2);
  const handZ = 0.38;
  const hand = mesh(hg, 'sandstone');
  hand.position.set(0, 0.22, handZ);
  root.add(hand);

  // ---------- alignment channel from slab to split stone ----------
  const z0 = handZ - 1.15, z1 = splitZ + 0.45;
  const strip = mesh(new THREE.BoxGeometry(0.16, 0.1, Math.abs(z0 - z1)), 'red_stone');
  strip.position.set(0, 0.27, (z0 + z1) / 2);
  root.add(strip);

  // ---------- fallen slab (front-left), one end propped on a rock ----------
  const fallen = new THREE.Group();
  fallen.position.set(-2.45, 0, 4.55 + ZS);
  fallen.rotation.y = -0.44;
  const fpts = [[-1.12, 0], [1.12, 0], [1.13, 0.38], [1.0, 0.47], [-1.05, 0.47], [-1.14, 0.36]];
  const fg = slab(fpts, 1.0, 0.05);
  fg.translate(0, -0.25, 0);
  const fm = mesh(fg, 'stone');
  fm.rotation.z = -0.1;
  fm.position.y = 0.63;
  fallen.add(fm);
  root.add(fallen);

  // ---------- rubble rocks ----------
  const rockGeo = new THREE.SphereGeometry(1, 7, 5);
  const RUBBLE = [
    [-3.6, 4.95, 0.42, 0.05],
    [1.3, 5.9, 0.22, 0.35], [-0.9, 6.5, 0.18, 0.35], [5.7, 4.6, 0.2, 0.35],
    [-6.5, 0.1, 0.18, 0.35], [1.9, -6.9, 0.18, 0.35], [-1.6, -7.0, 0.16, 0.35], [6.7, -3.3, 0.18, 0.35]
  ];
  RUBBLE.forEach(function (r) {
    const s = r[2];
    const m = mesh(rockGeo, 'stone');
    m.scale.set(s * (1.25 + jit(0.15)), s * (0.75 + jit(0.1)), s * (1 + jit(0.15)));
    m.rotation.y = rnd() * Math.PI;
    m.position.set(r[0], groundY(r[0], r[1]) + s * r[3], r[1]);
    root.add(m);
  });
  tuft(-3.1, 5.6, 1.0);
  tuft(-1.4, 5.4, 0.9);

  // ---------- grass around the rim ----------
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + jit(0.15);
    const r = 7.15 + rnd() * 0.5;
    tuft(Math.sin(a) * r, Math.cos(a) * r, 0.7 + rnd() * 0.4);
  }

  return root;
}
```