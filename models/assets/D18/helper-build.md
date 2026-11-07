```json
{"objects": [
  {"name": "plane_wreck", "size_m": [9.6, 2.45, 7.45],
   "views": [
     {"label": "Front", "box": [36, 18, 616, 174], "cam": [0, 0, 1], "up": [0, 1, 0]},
     {"label": "Side", "box": [910, 18, 1479, 171], "cam": [1, 0, 0], "up": [0, 1, 0]},
     {"label": "Back", "box": [233, 276, 823, 437], "cam": [0, 0, -1], "up": [0, 1, 0]},
     {"label": "Top", "box": [895, 232, 1390, 508], "cam": [0, 1, 0], "up": [0, 0, 1]}
   ]},
  {"name": "camp", "size_m": [3.55, 1.9, 3.2],
   "views": [
     {"label": "Front", "box": [588, 48, 844, 174], "cam": [0, 0, 1], "up": [0, 1, 0]},
     {"label": "Back", "box": [60, 300, 240, 437], "cam": [0, 0, -1], "up": [0, 1, 0]},
     {"label": "Top", "box": [1255, 315, 1503, 518], "cam": [0, 1, 0], "up": [0, 0, -1]}
   ]}
 ],
 "notes": "Venn's wreck is an upside-down 1930s high-wing cabin monoplane, about 9.6 m span, 7.4 m long and 2.45 m to the top of its upturned wheels. It has a radial engine, a bent prop, torn doped fabric over a rusty frame, the right wing (+x) tilted up and the left wing crumpled. His camp (ridge tent, folding table, crate, three jerry cans, stone fire ring) is a separate object. The 1 m bar (about 62 px) roughly fits the front and side views, but those show span about equal to length while the top view shows span about 1.8 times length, so a compromise was used. The plane's top view is mirrored relative to the front view, which is harmless for the plane on its own. The camp layout is taken from its top view (front at the bottom)."}
```

```js
function build(THREE) {
  // ---------- deterministic pseudo-random ----------
  let seed = 18018;
  function rnd() {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ---------- materials ----------
  const COL = {
    fabric: 0xcdbd9c,
    rusty_iron: 0x7e5638,
    steel_grey: 0x77818a,
    dark_metal: 0x4c4843,
    varnished_wood: 0x8e5a38,
    rubber: 0x3b3835,
    canvas: 0xc2b28c,
    groundsheet: 0x5a5043,
    blanket: 0x6c5b47,
    timber: 0xa98b66,
    rope: 0x9b8b70,
    stone: 0x9a948a,
    ash: 0x57524b,
    charcoal: 0x2f2b27,
    paint_red: 0x8c4a37,
    paint_grey: 0x75766c
  };
  const MATS = {};
  function mk(geo, name) {
    if (!MATS[name]) MATS[name] = new THREE.MeshStandardMaterial({ color: COL[name] });
    const m = new THREE.Mesh(geo, MATS[name]);
    m.name = name;
    return m;
  }

  // ---------- helpers ----------
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const toV = p => (p.isVector3 ? p.clone() : V(p[0], p[1], p[2]));
  const YAXIS = V(0, 1, 0);

  function rod(parent, a, b, r, name, seg) {
    const A = toV(a), B = toV(b);
    const d = B.clone().sub(A);
    const len = Math.max(0.001, d.length());
    const m = mk(new THREE.CylinderGeometry(r, r, len, seg || 6), name);
    m.position.copy(A).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(YAXIS, d.clone().normalize());
    parent.add(m);
    return m;
  }

  function box(parent, w, h, d, x, y, z, name) {
    const m = mk(new THREE.BoxGeometry(w, h, d), name);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  // flat panel of thickness t through planar 3D polygon pts, with optional holes (arrays of 3D points)
  function panel(parent, pts, holes, t, name) {
    pts = pts.map(toV);
    const o = pts[0];
    const n = V(0, 0, 0);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      n.x += (p.y - q.y) * (p.z + q.z);
      n.y += (p.z - q.z) * (p.x + q.x);
      n.z += (p.x - q.x) * (p.y + q.y);
    }
    n.normalize();
    const u = pts[1].clone().sub(o);
    u.addScaledVector(n, -u.dot(n)).normalize();
    const v = V(0, 0, 0).crossVectors(n, u);
    const to2 = p => { const d = toV(p).sub(o); return new THREE.Vector2(d.dot(u), d.dot(v)); };
    const shape = new THREE.Shape(pts.map(to2));
    (holes || []).forEach(h => shape.holes.push(new THREE.Path(h.map(to2))));
    const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });
    const m = mk(g, name);
    m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(u, v, n));
    m.position.copy(o).addScaledVector(n, -t / 2);
    parent.add(m);
    return m;
  }

  // bilinear point in quad Q=[A,B,C,D] (A s0t0, B s1t0, C s1t1, D s0t1)
  function bil(Q, s, t) {
    return V(0, 0, 0)
      .addScaledVector(Q[0], (1 - s) * (1 - t))
      .addScaledVector(Q[1], s * (1 - t))
      .addScaledVector(Q[2], s * t)
      .addScaledVector(Q[3], (1 - s) * t);
  }
  // torn hole (jag) or rectangular window (no jag, n=4)
  function blob(Q, s, t, rs, rt, n, jag) {
    const out = [];
    const step = (Math.PI * 2) / n;
    for (let k = 0; k < n; k++) {
      const a = k * step + (jag ? (rnd() - 0.5) * 0.5 * step : Math.PI / n);
      const r = jag ? 0.6 + rnd() * 0.4 : 1;
      let ss = s + Math.cos(a) * rs * r, tt = t + Math.sin(a) * rt * r;
      ss = Math.min(0.97, Math.max(0.03, ss));
      tt = Math.min(0.97, Math.max(0.03, tt));
      out.push(bil(Q, ss, tt));
    }
    return out;
  }

  // wing / tailplane panel: local LE at z=0, TE at z=-C, span x0 -> x1, thickness T centred on y=0
  function wing(x0, x1, C, T, o) {
    const g = new THREE.Group();
    const sg = x1 > x0 ? 1 : -1;
    const tipA = o.tip ? Math.min(0.55, C * 0.4) : 0;
    const xs = x1 - sg * tipA;
    const span = Math.abs(xs - x0);
    const mid = (x0 + xs) / 2;
    const outline = [[x0, 0], [xs, 0]];
    const bow = [];
    if (o.tip) {
      for (let k = 0; k <= 10; k++) {
        const th = Math.PI / 2 - (k / 10) * Math.PI;
        bow.push([xs + sg * tipA * Math.cos(th), -C / 2 + (C / 2) * Math.sin(th)]);
      }
      for (let k = 1; k < 10; k++) outline.push(bow[k]);
    }
    outline.push([xs, -C], [x0, -C]);

    // ribs
    const nb = Math.max(1, Math.round(span / o.rib));
    const ribX = [];
    for (let i = 0; i <= nb; i++) ribX.push(x0 + (sg * span * i) / nb);
    ribX.forEach((x, i) => {
      const r = box(g, 0.024, T * 0.86, C - 0.06, x, 0, -C / 2, 'rusty_iron');
      if (o.broken && i > 0) {
        r.rotation.z = (rnd() - 0.5) * 0.5;
        r.rotation.y = (rnd() - 0.5) * 0.3;
      }
    });
    // spars
    [0.27, 0.66].forEach(f => box(g, span, T * 0.8, 0.05, mid, 0, -C * f, 'rusty_iron'));
    // leading edge
    const le = mk(new THREE.CylinderGeometry(T / 2, T / 2, span, 12), 'fabric');
    le.rotation.z = Math.PI / 2;
    le.position.set(mid, 0, -T / 2);
    g.add(le);
    // trailing edge
    rod(g, [x0, 0, -C + 0.02], [xs, 0, -C + 0.02], 0.018, 'rusty_iron');
    // rounded tip bow
    if (o.tip) {
      const curve = new THREE.CatmullRomCurve3(bow.map(p => V(p[0], 0, p[1])));
      g.add(mk(new THREE.TubeGeometry(curve, 16, 0.028, 6, false), 'rusty_iron'));
    }
    // torn fabric skins
    const skinT = 0.012;
    function skin(y, prob) {
      const shape = new THREE.Shape(outline.map(p => new THREE.Vector2(p[0], p[1])));
      for (let i = 0; i < nb; i += 2) {
        if (rnd() > prob) continue;
        const a = ribX[i], b = ribX[Math.min(i + 2, nb)];
        const cx = (a + b) / 2, w = Math.abs(b - a) / 2 - 0.05;
        if (w < 0.06) continue;
        const cz = -C * (0.3 + rnd() * 0.4), dz = C * (0.12 + rnd() * 0.16);
        const pts = [];
        const n = 9;
        for (let k = 0; k < n; k++) {
          const ang = (k / n) * Math.PI * 2 + (rnd() - 0.5) * 0.3;
          const r = 0.6 + rnd() * 0.4;
          const px = cx + Math.cos(ang) * w * r;
          const pz = Math.min(-0.06, Math.max(-C + 0.06, cz + Math.sin(ang) * dz * r));
          pts.push(new THREE.Vector2(px, pz));
        }
        shape.holes.push(new THREE.Path(pts));
      }
      const m = mk(new THREE.ExtrudeGeometry(shape, { depth: skinT, bevelEnabled: false }), 'fabric');
      m.rotation.x = Math.PI / 2;
      m.position.y = y;
      g.add(m);
    }
    skin(T / 2 + skinT, o.holeTop);
    skin(-T / 2, o.holeBot);
    return g;
  }

  // =====================================================================
  // PLANE WRECK (inverted high-wing monoplane, nose +z, wheels up)
  // =====================================================================
  const plane = new THREE.Group();
  plane.name = 'plane_wreck';

  // fuselage stations: z, bottom y (original top, now down), top y (original belly, now up), half width
  const S = [
    { z: 2.75, yb: 0.22, yt: 1.46, hw: 0.55 },
    { z: 1.0, yb: 0.24, yt: 1.44, hw: 0.52 },
    { z: -3.35, yb: 0.95, yt: 1.2, hw: 0.08 }
  ];
  function st(z) {
    const a = z >= S[1].z ? S[1] : S[2], b = z >= S[1].z ? S[0] : S[1];
    const f = (z - a.z) / (b.z - a.z);
    return { z, yb: a.yb + (b.yb - a.yb) * f, yt: a.yt + (b.yt - a.yt) * f, hw: a.hw + (b.hw - a.hw) * f };
  }
  const cn = (s, sx, top) => V(sx * s.hw, top ? s.yt : s.yb, s.z);

  // frame: longerons
  [-1, 1].forEach(sx => [false, true].forEach(top => {
    rod(plane, cn(S[0], sx, top), cn(S[1], sx, top), 0.026, 'rusty_iron');
    rod(plane, cn(S[1], sx, top), cn(S[2], sx, top), 0.026, 'rusty_iron');
  }));
  // frame: stations and diagonals
  const FZ = [2.75, 1.9, 1.0, -0.1, -1.2, -2.3, -3.35];
  const FS = FZ.map(st);
  FS.forEach((s, i) => {
    if (i === FS.length - 1) {
      rod(plane, V(0, s.yb, s.z), V(0, s.yt, s.z), 0.03, 'rusty_iron');
      return;
    }
    [-1, 1].forEach(sx => rod(plane, cn(s, sx, false), cn(s, sx, true), 0.02, 'rusty_iron'));
    rod(plane, cn(s, -1, true), cn(s, 1, true), 0.02, 'rusty_iron');
    rod(plane, cn(s, -1, false), cn(s, 1, false), 0.02, 'rusty_iron');
    if (i >= 2) {
      const n2 = FS[i + 1];
      [-1, 1].forEach(sx => rod(plane, cn(s, sx, i % 2 === 0), cn(n2, sx, i % 2 !== 0), 0.016, 'rusty_iron'));
      rod(plane, cn(s, -1, true), cn(n2, 1, true), 0.016, 'rusty_iron');
    }
  });

  // fuselage skins
  const Qs = (a, b, sx) => [cn(a, sx, false), cn(b, sx, false), cn(b, sx, true), cn(a, sx, true)];
  const Qt = (a, b, top) => [cn(a, -1, top), cn(b, -1, top), cn(b, 1, top), cn(a, 1, top)];
  [1, -1].forEach(sx => {
    const Qf = Qs(S[0], S[1], sx);
    panel(plane, Qf, [
      blob(Qf, 0.28, 0.33, 0.17, 0.2, 4, false),
      blob(Qf, 0.7, 0.33, 0.18, 0.2, 4, false),
      blob(Qf, 0.5, 0.78, 0.08, 0.09, 8, true)
    ], 0.016, 'rusty_iron');
    const Qr = Qs(S[1], S[2], sx);
    const hs = sx > 0
      ? [[0.17, 0.55, 0.07, 0.28], [0.43, 0.5, 0.09, 0.3], [0.63, 0.5, 0.06, 0.28], [0.82, 0.45, 0.05, 0.25]]
      : [[0.25, 0.45, 0.1, 0.3], [0.52, 0.6, 0.07, 0.25], [0.75, 0.4, 0.06, 0.22]];
    panel(plane, Qr, hs.map(h => blob(Qr, h[0], h[1], h[2], h[3], 8, true)), 0.014, 'fabric');
  });
  const Qtf = Qt(S[0], S[1], true);
  panel(plane, Qtf, [blob(Qtf, 0.5, 0.6, 0.1, 0.18, 8, true)], 0.016, 'rusty_iron');
  const Qtr = Qt(S[1], S[2], true);
  panel(plane, Qtr, [blob(Qtr, 0.3, 0.5, 0.08, 0.28, 8, true), blob(Qtr, 0.6, 0.45, 0.07, 0.28, 8, true)], 0.014, 'fabric');
  const Qbr = Qt(S[1], S[2], false);
  panel(plane, Qbr, [blob(Qbr, 0.45, 0.5, 0.1, 0.3, 8, true)], 0.014, 'fabric');
  panel(plane, [cn(S[0], -1, false), cn(S[0], 1, false), cn(S[0], 1, true), cn(S[0], -1, true)], null, 0.02, 'rusty_iron');

  // fabric tatters hanging from the rear fuselage
  [[1, 0.3, -0.25], [-1, -0.6, -1.0]].forEach(([sx, z1, z2]) => {
    const a = cn(st(z1), sx, false), b = cn(st(z2), sx, false);
    const v = V(sx * 0.08, -0.3, 0.02);
    panel(plane, [a, b, b.clone().add(v), a.clone().addScaledVector(v, 0.8)], null, 0.01, 'f