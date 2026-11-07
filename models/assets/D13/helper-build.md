```json
{
  "objects": [
    {
      "name": "tower_tall",
      "size_m": [115, 110, 124],
      "views": [
        {"label": "Front", "box": [108, 13, 372, 266], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Back", "box": [448, 327, 758, 574], "cam": [0, 0, -1], "up": [0, 1, 0]},
        {"label": "Side", "box": [882, 11, 1170, 270], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "Top", "box": [836, 344, 1130, 574], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "tower_short",
      "size_m": [115, 90, 102],
      "views": [
        {"label": "Front", "box": [480, 62, 738, 266], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Back", "box": [90, 377, 348, 574], "cam": [0, 0, -1], "up": [0, 1, 0]},
        {"label": "Side", "box": [1203, 62, 1434, 270], "cam": [-1, 0, 0], "up": [0, 1, 0]},
        {"label": "Top", "box": [1242, 364, 1462, 548], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    }
  ],
  "notes": "Two free-standing red and ochre sandstone towers on rubble aprons, one either side of the pass. Heights come from the dimension lines (110 m and 90 m, about 2.27 px/m). The 35/30/60 m width labels don't match the drawing at that scale, so widths follow the drawn outlines. Each Side view is taken as the gap-facing side (tall seen from +x, short from -x), which the top views' summit offsets support. To set them in the pass, place tall at x≈-81 and short at x≈+81 (their front-view centres are about 163 m apart)."
}
```

```js
function build(THREE) {
  // ---------- deterministic random ----------
  function makeRand(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- materials (one per name, shared) ----------
  const mats = {
    sandstone: new THREE.MeshStandardMaterial({ color: 0xa36843, roughness: 0.95, metalness: 0 }),
    scree: new THREE.MeshStandardMaterial({ color: 0xa98163, roughness: 1, metalness: 0 }),
    scrub: new THREE.MeshStandardMaterial({ color: 0x6e6e4a, roughness: 1, metalness: 0 })
  };
  function mesh(geo, name) {
    const m = new THREE.Mesh(geo, mats[name]);
    m.name = name;
    return m;
  }
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const unitBush = new THREE.SphereGeometry(1, 6, 4);

  const N = 40;        // vertices per horizontal rock section
  const SE = 2.6;      // superellipse exponent: boxy sandstone plan
  const P = 2 / SE;

  // generic debris-fan profile (radius fraction, height fraction), bottom to top
  const LOBE_PROF = [[1, 0], [0.8, 0.13], [0.6, 0.3], [0.35, 0.55], [0.15, 0.88], [0, 1]];
  const lobePts = LOBE_PROF.map(q => new THREE.Vector2(q[0], q[1]));

  // table rows: [h, xLeft, xRight, zBack, zFront]
  function lerpTable(t, h) {
    if (h <= t[0][0]) return [t[0][1], t[0][2], t[0][3], t[0][4]];
    for (let i = 0; i < t.length - 1; i++) {
      const a = t[i], b = t[i + 1];
      if (h <= b[0]) {
        const f = (h - a[0]) / (b[0] - a[0]);
        return [1, 2, 3, 4].map(k => a[k] + (b[k] - a[k]) * f);
      }
    }
    const l = t[t.length - 1];
    return [l[1], l[2], l[3], l[4]];
  }

  // profile height fraction at radius fraction u (profile listed bottom->top, u decreasing)
  function profAt(prof, u) {
    if (u >= prof[0][0]) return 0;
    for (let i = 0; i < prof.length - 1; i++) {
      const a = prof[i], b = prof[i + 1];
      if (u >= b[0]) {
        const f = (a[0] - u) / (a[0] - b[0]);
        return a[1] + (b[1] - a[1]) * f;
      }
    }
    return 1;
  }

  function buildTower(cfg) {
    const g = new THREE.Group();
    g.name = cfg.name;
    const rand = makeRand(cfg.seed);

    // vertical column joints: same notch pattern up the whole tower
    const relief = [];
    for (let k = 0; k < N; k++) {
      relief.push(rand() < 0.25 ? 0.88 + 0.04 * rand() : 0.95 + 0.05 * rand());
    }

    function section(h) {
      const e = lerpTable(cfg.table, h);
      return { cx: (e[0] + e[1]) / 2, cz: (e[2] + e[3]) / 2, ax: (e[1] - e[0]) / 2, az: (e[3] - e[2]) / 2 };
    }
    function bodyV(x, z, h) {
      const s = section(Math.max(0, h));
      return Math.pow(Math.abs((x - s.cx) / s.ax), SE) + Math.pow(Math.abs((z - s.cz) / s.az), SE);
    }

    // ---------- rock body: stacked bedding tiers (ledges between) ----------
    const T = cfg.tiers;
    for (let i = 0; i < T.length - 1; i++) {
      const h0 = T[i], h1 = T[i + 1];
      const s = section((h0 + h1) / 2);
      const shape = new THREE.Shape();
      for (let k = 0; k < N; k++) {
        const th = (k / N) * Math.PI * 2;
        const c = Math.cos(th), sn = Math.sin(th);
        const f = (k % (N / 4) === 0) ? 1 : Math.min(1, relief[k] * (0.985 + 0.03 * rand()));
        const x = s.cx + s.ax * Math.sign(c) * Math.pow(Math.abs(c), P) * f;
        const z = s.cz + s.az * Math.sign(sn) * Math.pow(Math.abs(sn), P) * f;
        if (k === 0) shape.moveTo(x, -z); else shape.lineTo(x, -z);
      }
      const geo = new THREE.ExtrudeGeometry(shape, { depth: h1 - h0, steps: 1, bevelEnabled: false, curveSegments: 1 });
      const m = mesh(geo, 'sandstone');
      m.rotation.x = -Math.PI / 2;
      m.position.y = h0;
      g.add(m);
    }

    // ---------- summit crown: jointed blocks of differing height ----------
    for (const b of cfg.crown) {
      const m = mesh(unitBox, 'sandstone');
      m.scale.set(b[1] - b[0], b[5] - b[4], b[3] - b[2]);
      m.position.set((b[0] + b[1]) / 2, (b[4] + b[5]) / 2, (b[2] + b[3]) / 2);
      g.add(m);
    }

    // ---------- talus apron: four quarter-lathes with different reach ----------
    const A = cfg.apron;
    const apronPts = A.prof.map(q => new THREE.Vector2(q[0], q[1]));
    const quads = [
      [0, A.px, A.pz],
      [Math.PI / 2, A.px, A.nz],
      [Math.PI, A.nx, A.nz],
      [Math.PI * 1.5, A.nx, A.pz]
    ];
    for (const q of quads) {
      const geo = new THREE.LatheGeometry(apronPts, 10, q[0], Math.PI / 2);
      const m = mesh(geo, 'scree');
      m.position.set(A.cx, 0, A.cz);
      m.scale.set(q[1], A.H, q[2]);
      g.add(m);
    }

    // ---------- debris fans piled higher against the cliff ----------
    for (const L of cfg.lobes) {
      const geo = new THREE.LatheGeometry(lobePts, 16);
      const m = mesh(geo, 'scree');
      m.position.set(L.x, 0, L.z);
      m.scale.set(L.rx, L.H, L.rz);
      g.add(m);
    }

    function talusH(x, z) {
      const dx = x - A.cx, dz = z - A.cz;
      const sx = dx >= 0 ? A.px : A.nx, sz = dz >= 0 ? A.pz : A.nz;
      let h = A.H * profAt(A.prof, Math.hypot(dx / sx, dz / sz));
      for (const L of cfg.lobes) {
        const u = Math.hypot((x - L.x) / L.rx, (z - L.z) / L.rz);
        h = Math.max(h, L.H * profAt(LOBE_PROF, u));
      }
      return h;
    }

    function addBush(x, y, z, r) {
      const m = mesh(unitBush, 'scrub');
      m.scale.set(r, r * 0.65, r);
      m.position.set(x, y + r * 0.3, z);
      g.add(m);
    }

    function placeOnTalus(count, uMin, uMax, fn) {
      let placed = 0, tries = 0;
      while (placed < count && tries < 4000) {
        tries++;
        const phi = rand() * Math.PI * 2;
        const u = uMin + rand() * (uMax - uMin);
        const sp = Math.sin(phi), cp = Math.cos(phi);
        const ex = sp >= 0 ? A.px : A.nx, ez = cp >= 0 ? A.pz : A.nz;
        const x = A.cx + u * sp * ex;
        const z = A.cz + u * cp * ez;
        const y = talusH(x, z);
        if (bodyV(x, z, y + 1) < 1.06) continue;
        fn(x, y, z, (1 - u) * Math.min(ex, ez));
        placed++;
      }
    }

    // fallen blocks on the apron
    placeOnTalus(cfg.boulders, 0.45, 0.9, (x, y, z, margin) => {
      let s = 1.2 + Math.pow(rand(), 2) * 3.6;
      s = Math.min(s, Math.max(0.8, margin * 0.55));
      const bw = s * (0.9 + 0.5 * rand());
      const bh = s * (0.55 + 0.4 * rand());
      const bd = s * (0.8 + 0.5 * rand());
      const m = mesh(unitBox, 'sandstone');
      m.scale.set(bw, bh, bd);
      m.rotation.set((rand() - 0.5) * 0.5, rand() * Math.PI, (rand() - 0.5) * 0.5);
      m.position.set(x, y + bh * 0.1, z);
      g.add(m);
    });

    // scrub on the apron
    placeOnTalus(cfg.bushes, 0.4, 0.95, (x, y, z, margin) => {
      const r = Math.min(0.8 + rand() * 1.0, Math.max(0.5, margin * 0.5));
      addBush(x, y, z, r);
    });

    // scrub on summit blocks and ledges
    for (const b of cfg.extraBushes) addBush(b[0], b[1], b[2], b[3]);

    return g;
  }

  const tall = buildTower({
    name: 'tower_tall',
    seed: 1301,
    table: [
      [0, -51.0, 36.0, -42.0, 36.0],
      [14, -48.5, 34.7, -40.4, 34.8],
      [29, -43.3, 31.5, -38.2, 31.8],
      [50, -39.3, 26.2, -35.2, 26.2],
      [63, -37.1, 24.0, -32.0, 22.5],
      [74, -34.5, 21.8, -28.9, 19.2],
      [77.5, -33.8, 21.5, -27.9, 18.2],
      [78.5, -33.6, 13.2, -27.6, 17.9],
      [85, -32.3, 12.2, -24.8, 15.6],
      [96, -29.3, 7.9, -21.0, 12.0],
      [102, -27.0, 6.5, -19.0, 10.0],
      [106, -24.0, 5.0, -17.3, 8.0],
      [110, -20.5, 3.1, -15.5, 6.0]
    ],
    tiers: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 74, 78, 82, 86, 90, 94, 98, 102, 106],
    crown: [
      [-19, -3, -14, 2, 105.8, 110],
      [-8, 2.5, -10, 5, 105.8, 109],
      [-22, -14, -6, 5, 105.8, 108],
      [-12, -1, -16, -8, 105.8, 108.5]
    ],
    apron: {
      cx: -7.5, cz: -3, px: 65.1, nx: 50.1, pz: 64.9, nz: 58.9, H: 16,
      prof: [[1, 0], [0.85, 0.16], [0.75, 0.34], [0.65, 0.56], [0.58, 0.85], [0.55, 1], [0, 1]]
    },
    lobes: [
      { x: 30, z: -3, rx: 27.6, rz: 28, H: 24 },
      { x: -45.6, z: -3, rx: 12, rz: 22, H: 17 }
    ],
    boulders: 70,
    bushes: 22,
    extraBushes: [
      [-20, 108, 3.5, 1.0],
      [-6, 108.5, -15, 0.9],
      [0, 109, 2, 0.8],
      [2, 106, -12, 1.3],
      [17.5, 78, -6, 1.4],
      [16, 78, 6, 1.1]
    ]
  });

  const short = buildTower({
    name: 'tower_short',
    seed: 1302,
    table: [
      [0, -34.0, 40.0, -33.5, 24.5],
      [15, -32.6, 39.0, -32.4, 23.6],
      [30, -29.3, 33.2, -30.2, 20.9],
      [42.5, -27.0, 29.5, -28.6, 19.3],
      [43.5, -23.5, 29.3, -28.5, 19.2],
      [47, -22.7, 28.1, -28.0, 18.9],
      [58, -19.4, 25.6, -26.5, 17.2],
      [59.5, -19.0, 25.3, -23.2, 16.6],
      [63, -17.5, 24.2, -22.3, 16.1],
      [74, -14.3, 21.7, -18.3, 13.9],
      [84, -10.8, 18.3, -15.2, 11.4],
      [90, -7.6, 14.7, -11.7, 9.5]
    ],
    tiers: [0, 5, 10, 15, 20, 25, 30, 35, 40, 43, 47, 51, 55, 59, 63, 67, 71, 75, 79, 83, 86],
    crown: [
      [-6.5, 9, -11, 5, 85.8, 90],
      [2, 14.5, -8, 8, 85.8, 88.5],
      [-9, -6.5, -10, 2, 85.8, 88],
      [-4, 6, 2, 9.5, 85.8, 87.5]
    ],
    apron: {
      cx: 3.5, cz: -4.5, px: 54, nx: 61, pz: 55.4, nz: 46.4, H: 18.5,
      prof: [[1, 0], [0.9, 0.205], [0.8, 0.378], [0.7, 0.541], [0.6, 0.757], [0.52, 0.919], [0.47, 1], [0, 1]]
    },
    lobes: [
      { x: 32, z: -4.5, rx: 25.5, rz: 18, H: 19 }
    ],
    boulders: 60,
    bushes: 18,
    extraBushes: [
      [-7.8, 88, -4, 0.8],
      [1, 87.5, 7.5, 0.9],
      [11, 86, -10, 1.0],
      [-25, 43, -5, 1.1],
      [3, 59, -24.8, 1.0]
    ]
  });

  return { tower_tall: tall, tower_short: short };
}
```