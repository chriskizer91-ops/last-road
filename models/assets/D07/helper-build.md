```json
{
  "objects": [
    {
      "name": "cairn",
      "size_m": [2.56, 2.24, 2.4],
      "views": [
        {"label": "Front", "box": [28, 14, 508, 433], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Side", "box": [546, 17, 996, 433], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "Back", "box": [1040, 14, 1513, 433], "cam": [0, 0, -1], "up": [0, 1, 0]},
        {"label": "Top", "box": [148, 506, 573, 919], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    }
  ],
  "notes": "Dry-stone cairn of stacked flat slabs on a low sand apron. The scale bar is 1 m ≈ 187 px. The apron is about 2.5 m across, the stack is about 1.5 m high, and a standing stone about 0.8 m tall on top brings the total to about 2.24 m. 'Side' is assumed to be the +x side; in it the standing stone leans back (toward -z) about 9°, which matches the top view. The top view is drawn slightly smaller than the elevations."
}
```

```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'cairn';

  const STONE = new THREE.MeshStandardMaterial({ color: 0x5d4e40 });
  const SAND = new THREE.MeshStandardMaterial({ color: 0xc4783c });

  // fixed seeded PRNG (mulberry32)
  let seed = 0x2c07a1;
  function rnd() {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function rr(a, b) { return a + (b - a) * rnd(); }

  function add(geo, mat, name, parent) {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    (parent || root).add(m);
    return m;
  }

  function interp(tab, x) {
    if (x <= tab[0][0]) return tab[0][1];
    for (let i = 1; i < tab.length; i++) {
      if (x <= tab[i][0]) {
        const x0 = tab[i - 1][0], y0 = tab[i - 1][1], x1 = tab[i][0], y1 = tab[i][1];
        return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
      }
    }
    return tab[tab.length - 1][1];
  }

  const ZF = 0.94; // slightly narrower front-to-back (side view vs front view)

  // outer face radius of the slab stack vs height (from the front view)
  const PROFILE = [[0.0, 1.08], [0.15, 1.04], [0.45, 0.93], [0.75, 0.79], [1.05, 0.60], [1.30, 0.42], [1.50, 0.26]];
  const R = (y) => interp(PROFILE, y);

  // ---- sand apron ----
  const SAND_BY_R = [[0.0, 0.12], [0.7, 0.11], [1.0, 0.09], [1.1, 0.06], [1.2, 0.025], [1.27, 0.0]];
  const sandH = (r) => interp(SAND_BY_R, r);
  const sandPts = [
    new THREE.Vector2(1.27, 0.0),
    new THREE.Vector2(1.20, 0.025),
    new THREE.Vector2(1.10, 0.06),
    new THREE.Vector2(1.00, 0.09),
    new THREE.Vector2(0.70, 0.11),
    new THREE.Vector2(0.0, 0.12)
  ];
  const sand = add(new THREE.LatheGeometry(sandPts, 28), SAND, 'sand');
  sand.scale.z = ZF;

  // lumps to break the round edge of the apron
  for (let i = 0; i < 7; i++) {
    const a = (i * 2 * Math.PI) / 7 + rr(0, 0.6);
    const rad = rr(1.0, 1.1);
    const m = add(new THREE.SphereGeometry(1, 8, 4), SAND, 'sand');
    m.scale.set(rr(0.10, 0.15), rr(0.035, 0.05), rr(0.18, 0.28));
    m.position.set(rad * Math.cos(a), sandH(rad) * 0.5, rad * Math.sin(a) * ZF);
    m.rotation.y = -a;
  }

  // ---- solid core (fills the gaps behind the slabs) ----
  const coreYs = [0.0, 0.12, 0.3, 0.55, 0.8, 1.05, 1.25, 1.4, 1.5];
  const corePts = coreYs.map((y) => new THREE.Vector2(Math.max(0.05, R(y) - 0.1), y));
  corePts.push(new THREE.Vector2(0.0, 1.5));
  const core = add(new THREE.LatheGeometry(corePts, 16), STONE, 'stone');
  core.scale.z = ZF;

  // ---- coursed slabs ----
  let y = 0.04;
  let course = 0;
  while (y < 1.44 && course < 20) {
    const f = y / 1.45;
    const h = 0.145 - 0.05 * f;               // course height, thinner toward top
    const Rc = R(y + h / 2);
    const circ = 2 * Math.PI * Rc;
    const n = Math.max(5, Math.round(circ / (0.42 - 0.1 * f)));
    const step = (2 * Math.PI) / n;
    const off = (course % 2) * 0.5 * step + rr(-0.2, 0.2) * step;
    for (let j = 0; j < n; j++) {
      const a = off + j * step + rr(-0.1, 0.1) * step;
      const L = step * Rc * rr(0.95, 1.15);
      const d = Math.min(Rc * 0.85, rr(0.3, 0.45));
      const t = h * rr(0.8, 1.0);
      const rOut = Rc - 0.015 + rr(-0.03, 0.03);
      const rc = rOut - d / 2;
      const m = add(new THREE.BoxGeometry(L, t, d), STONE, 'stone');
      m.position.set(rc * Math.cos(a), y + t / 2 + (h - t) * rr(0, 0.5), rc * Math.sin(a) * ZF);
      m.rotation.order = 'YXZ';
      m.rotation.set(rr(-0.07, 0.04), -a - Math.PI / 2 + rr(-0.1, 0.1), rr(-0.05, 0.05));
    }
    y += h;
    course++;
  }

  // ---- small cap stones around the foot of the standing stone ----
  for (let k = 0; k < 5; k++) {
    const a = (k * 2 * Math.PI) / 5 + 0.4;
    const m = add(new THREE.BoxGeometry(rr(0.22, 0.28), rr(0.06, 0.08), rr(0.15, 0.19)), STONE, 'stone');
    const rc = 0.15;
    m.position.set(rc * Math.cos(a), 1.48, rc * Math.sin(a) * ZF);
    m.rotation.order = 'YXZ';
    m.rotation.set(rr(-0.12, 0.05), -a - Math.PI / 2, rr(-0.08, 0.08));
  }

  // ---- standing stone (front profile extruded, leaning back toward -z) ----
  const shp = new THREE.Shape();
  shp.moveTo(-0.13, 0);
  shp.lineTo(0.13, 0);
  shp.lineTo(0.13, 0.30);
  shp.quadraticCurveTo(0.125, 0.58, 0.09, 0.68);
  shp.quadraticCurveTo(0.05, 0.775, -0.02, 0.77);
  shp.quadraticCurveTo(-0.10, 0.75, -0.115, 0.60);
  const sgeo = new THREE.ExtrudeGeometry(shp, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 2,
    curveSegments: 5
  });
  const pivot = new THREE.Group();
  pivot.position.set(0, 1.40, 0.03);
  pivot.rotation.x = -0.16;
  root.add(pivot);
  const standing = add(sgeo, STONE, 'stone', pivot);
  standing.position.set(0, 0.03, -0.07);

  // ---- loose rocks scattered on the apron ----
  const NR = 26;
  for (let i = 0; i < NR; i++) {
    const a = (i / NR) * Math.PI * 2 + rr(-0.12, 0.12);
    const sx = rr(0.12, 0.32), sy = rr(0.07, 0.16), sz = rr(0.10, 0.24);
    const half = Math.max(sx, sz) / 2;
    const rad = rr(0.98, 1.25 - half);
    let m;
    if (i % 3 === 0) {
      m = add(new THREE.SphereGeometry(0.5, 6, 4), STONE, 'stone');
      m.scale.set(sx, sy, sz);
    } else {
      m = add(new THREE.BoxGeometry(sx, sy, sz), STONE, 'stone');
    }
    m.position.set(rad * Math.cos(a), sandH(rad) + sy * 0.2, rad * Math.sin(a) * ZF);
    m.rotation.set(rr(-0.25, 0.25), rr(0, Math.PI), rr(-0.25, 0.25));
  }

  return root;
}
```