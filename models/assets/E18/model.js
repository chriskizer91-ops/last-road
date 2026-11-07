function build(THREE) {
  const D = Math.PI / 180;
  const mats = {};
  const PAL = {
    green: ['paint_green', 0x5e6a3d],
    grey: ['paint_grey', 0xa4a69d],
    rust: ['rusty_steel', 0x6e6455],
    metal: ['bare_metal', 0x8a8b84],
    rubber: ['rubber', 0x3b3934],
    yellow: ['paint_yellow', 0xc8a62c],
    glass: ['glass', 0xbcc0bb]
  };
  function mk(geo, key) {
    const name = PAL[key][0], color = PAL[key][1];
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: color });
    const m = new THREE.Mesh(geo, mats[name]);
    m.name = name;
    return m;
  }
  const V2 = (p) => new THREE.Vector2(p[0], p[1]);

  // ================= CARGO POD =================
  const A = 0.30, B = 0.22, YC = 0.22, JOINT = -0.47, BETA = 6 * D, LT = 0.68;

  function podLathe(parent, pts, th0, th1, key, segs) {
    const g = new THREE.LatheGeometry(pts.map(V2), segs, (th0 + 90) * D, (th1 - th0) * D);
    const m = mk(g, key);
    m.rotation.x = Math.PI / 2;      // lathe axis -> z
    m.scale.set(A, 1, B);            // elliptical section
    parent.add(m);
    return m;
  }
  function ring(parent, pts) {
    podLathe(parent, pts, -17, 197, 'green', 20); // olive top
    podLathe(parent, pts, 197, 343, 'grey', 14);  // silver belly
  }
  const noseSt = [];
  for (let k = 0; k <= 8; k++) {
    const a = k * Math.PI / 16;
    noseSt.push([Math.cos(a), 0.62 + 0.58 * Math.sin(a)]);
  }
  noseSt[8][0] = 0;

  function podTail(parent) {
    const t = new THREE.Group();
    t.position.set(0, 0, JOINT);
    t.rotation.x = BETA; // upswept tail
    parent.add(t);
    const tr = [[1, 0.18], [0.95, 0.24], [0.85, 0.36], [0.7, 0.53], [0.55, 0.69],
                [0.4, 0.83], [0.25, 0.93], [0.1, 0.99], [0, 1.0]];
    const pts = [[0, -(LT + 0.012)], [0.12, -(LT + 0.006)]].concat(tr.map(q => [q[1], -q[0] * LT]));
    ring(t, pts);
    const lug = mk(new THREE.TorusGeometry(0.018, 0.006, 6, 12), 'rust');
    lug.rotation.y = Math.PI / 2;
    lug.position.set(0, 0.006, -(LT + 0.03));
    t.add(lug);
  }
  function podStraps(parent) {
    [0.72, 0.144, -0.576].forEach(z => {
      [-1, 1].forEach(s => {
        const p = mk(new THREE.BoxGeometry(0.03, 0.15, 0.07), 'rust');
        p.position.set(s * 0.14, 0.225, z);
        parent.add(p);
      });
      const bar = mk(new THREE.BoxGeometry(0.33, 0.022, 0.05), 'rust');
      bar.position.set(0, 0.299, z);
      parent.add(bar);
    });
  }
  function surfBox(parent, thDeg, dims, z, key, out) {
    const t = thDeg * D;
    const px = A * Math.cos(t), py = B * Math.sin(t);
    const na = Math.atan2(Math.sin(t) / B, Math.cos(t) / A);
    const m = mk(new THREE.BoxGeometry(dims[0], dims[1], dims[2]), key);
    m.position.set(px + Math.cos(na) * out, py + Math.sin(na) * out, z);
    m.rotation.z = na;
    parent.add(m);
    return m;
  }
  function arcBand(th0, th1, s0, s1, n) {
    const sh = new THREE.Shape();
    for (let i = 0; i <= n; i++) {
      const t = (th0 + (th1 - th0) * i / n) * D;
      const x = A * s1 * Math.cos(t), y = B * s1 * Math.sin(t);
      if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y);
    }
    for (let i = n; i >= 0; i--) {
      const t = (th0 + (th1 - th0) * i / n) * D;
      sh.lineTo(A * s0 * Math.cos(t), B * s0 * Math.sin(t));
    }
    return sh;
  }
  function ellipse(s, n) {
    const sh = new THREE.Shape();
    for (let i = 0; i < n; i++) {
      const t = i / n * Math.PI * 2;
      const x = A * s * Math.cos(t), y = B * s * Math.sin(t);
      if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y);
    }
    return sh;
  }
  function extr(shape, depth, key) {
    return mk(new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, steps: 1, curveSegments: 1 }), key);
  }

  function cargoPod() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    body.position.y = YC;
    g.add(body);
    ring(body, [[1, -0.50]].concat(noseSt));
    podTail(body);
    const hatch = extr(arcBand(-41, 49, 0.995, 1.022, 10), 0.96, 'green');
    hatch.position.z = -0.44;
    body.add(hatch);
    [0.29, -0.32].forEach(z => surfBox(body, -52, [0.025, 0.09, 0.05], z, 'rust', 0.006));
    podStraps(body);
    return g;
  }

  function cargoPodOpen() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    body.position.y = YC;
    g.add(body);
    const z0 = -0.45, z1 = 0.58;
    ring(body, [[1, z1]].concat(noseSt));
    ring(body, [[1, -0.50], [1, z0]]);
    const mid = [[1, z0], [1, z1]];
    podLathe(body, mid, 49, 197, 'green', 14);
    podLathe(body, mid, 197, 319, 'grey', 12);
    podTail(body);
    // simple interior: liner shell + end bulkheads
    const liner = extr(arcBand(49, 319, 0.95, 0.985, 24), z1 - z0, 'grey');
    liner.position.z = z0;
    body.add(liner);
    [z0, z1 - 0.012].forEach(z => {
      const b = extr(ellipse(0.985, 24), 0.012, 'grey');
      b.position.z = z;
      body.add(b);
    });
    // opening frame
    [z0 - 0.0125, z1 - 0.0125].forEach(z => {
      const c = extr(arcBand(-41, 49, 0.955, 1.045, 10), 0.025, 'metal');
      c.position.z = z;
      body.add(c);
    });
    [49, -41].forEach(th => surfBox(body, th, [0.03, 0.03, z1 - z0 + 0.025], (z0 + z1) / 2, 'metal', 0));
    // lid hinged at top edge, swung up and out
    const ht = 49 * D;
    const hx = A * 1.01 * Math.cos(ht), hy = B * 1.01 * Math.sin(ht);
    const pivot = new THREE.Group();
    pivot.position.set(hx, hy, 0);
    pivot.rotation.z = 140 * D;
    body.add(pivot);
    const lid = extr(arcBand(-41, 49, 1.0, 1.025, 10), z1 - z0, 'green');
    lid.position.set(-hx, -hy, z0);
    pivot.add(lid);
    [0.39, -0.29].forEach(z => {
      const h = mk(new THREE.CylinderGeometry(0.012, 0.012, 0.07, 8), 'rust');
      h.rotation.x = Math.PI / 2;
      h.position.set(hx, hy, z);
      body.add(h);
    });
    [0.38, -0.30].forEach(z => surfBox(body, -52, [0.025, 0.09, 0.05], z, 'rust', 0.006));
    podStraps(body);
    return g;
  }

  // ================= TUNDRA WHEEL =================
  function wheel() {
    const g = new THREE.Group();
    const c = new THREE.Group();
    c.position.y = 0.38;
    g.add(c);
    const prof = [[0.155, -0.150], [0.20, -0.168], [0.25, -0.181], [0.30, -0.188], [0.335, -0.186],
                  [0.36, -0.176], [0.375, -0.155], [0.38, -0.12], [0.38, 0.12], [0.375, 0.155],
                  [0.36, 0.176], [0.335, 0.186], [0.30, 0.188], [0.25, 0.181], [0.20, 0.168], [0.155, 0.150]];
    const tyre = mk(new THREE.LatheGeometry(prof.map(V2), 32), 'rubber');
    tyre.rotation.x = Math.PI / 2;
    c.add(tyre);
    const add = (geo, key, z, flip) => {
      const m = mk(geo, key);
      m.rotation.x = flip ? -Math.PI / 2 : Math.PI / 2;
      m.position.z = z;
      c.add(m);
      return m;
    };
    // rim barrel: its end caps sit inside the wheel discs (no coplanar faces)
    add(new THREE.CylinderGeometry(0.157, 0.157, 0.25, 24), 'metal', 0);
    // wheel discs, recessed just inside the tyre lip (z 0.123..0.147)
    add(new THREE.CylinderGeometry(0.156, 0.156, 0.024, 24), 'metal', 0.135);
    add(new THREE.CylinderGeometry(0.156, 0.156, 0.024, 24), 'metal', -0.135, true);
    // hub bosses, overlapping into the discs
    add(new THREE.CylinderGeometry(0.055, 0.068, 0.04, 16), 'metal', 0.163);
    add(new THREE.CylinderGeometry(0.055, 0.068, 0.04, 16), 'metal', -0.163, true);
    // axle cap
    add(new THREE.CylinderGeometry(0.022, 0.022, 0.025, 8), 'metal', 0.192);
    // bolt ring on the front disc
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3 + Math.PI / 6;
      const b = add(new THREE.CylinderGeometry(0.009, 0.009, 0.012, 6), 'metal', 0.151);
      b.position.x = 0.1 * Math.cos(a);
      b.position.y = 0.1 * Math.sin(a);
    }
    return g;
  }

  // ================= PROPELLERS =================
  function seg(parent, shape, pitch, t, key) {
    const pg = new THREE.Group();
    pg.rotation.x = pitch * D;
    parent.add(pg);
    const m = mk(new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, steps: 1 }), key);
    m.position.z = -t / 2;
    pg.add(m);
  }
  function propeller(cfg) {
    const g = new THREE.Group();
    const hc = new THREE.Group();
    hc.position.set(0, cfg.hubR, -0.0125);
    g.add(hc);
    const hub = mk(new THREE.CylinderGeometry(cfg.hubR, cfg.hubR, cfg.hubL, 20), 'metal');
    hub.rotation.x = Math.PI / 2;
    hc.add(hub);
    const boss = mk(new THREE.CylinderGeometry(cfg.hubR * 0.5, cfg.hubR * 0.6, 0.025, 16), 'metal');
    boss.rotation.x = Math.PI / 2;
    boss.position.z = cfg.hubL / 2 + 0.0125;
    hc.add(boss);
    for (let k = 0; k < 2; k++) {
      const bl = new THREE.Group();
      bl.rotation.z = k * Math.PI;
      hc.add(bl);
      const sh = mk(new THREE.CylinderGeometry(cfg.shankR, cfg.shankR * 1.2, 0.14, 10), 'metal');
      sh.rotation.z = -Math.PI / 2;
      sh.position.x = 0.14;
      bl.add(sh);
      const st = cfg.st;
      for (let i = 0; i < st.length - 1; i++) {
        const a = st[i], b = st[i + 1];
        const s = new THREE.Shape();
        s.moveTo(a[0], -a[1] / 2);
        s.lineTo(b[0], -b[1] / 2);
        s.lineTo(b[0], b[1] / 2);
        s.lineTo(a[0], a[1] / 2);
        seg(bl, s, (a[2] + b[2]) / 2, (a[3] + b[3]) / 2, 'metal');
      }
      const e = st[st.length - 1], L = 0.95 - e[0];
      const tip = new THREE.Shape();
      for (let j = 0; j <= 12; j++) {
        const an = -Math.PI / 2 + Math.PI * j / 12;
        const ca = Math.abs(Math.cos(an)), sa = Math.sin(an);
        const u = e[0] + L * Math.pow(ca, cfg.tipE);
        const v = (e[1] / 2) * Math.sign(sa) * Math.pow(Math.abs(sa), cfg.tipE);
        if (j === 0) tip.moveTo(u, v); else tip.lineTo(u, v);
      }
      seg(bl, tip, e[2], e[3], 'yellow');
    }
    return g;
  }

  // ================= LANDING LAMP =================
  function lamp() {
    const g = new THREE.Group();
    const L = new THREE.Group();
    L.position.z = -0.004;
    g.add(L);
    const cy = 0.095;
    const prof = [[0, -0.128], [0.10, -0.126], [0.22, -0.118], [0.40, -0.096], [0.58, -0.065],
                  [0.74, -0.030], [0.87, 0.010], [0.95, 0.050], [0.99, 0.085], [1.0, 0.106],
                  [0.97, 0.120], [0.88, 0.125], [0, 0.125]];
    const h = mk(new THREE.LatheGeometry(prof.map(V2), 24), 'green');
    h.rotation.x = Math.PI / 2;
    h.scale.set(0.09, 1, 0.07);
    h.position.y = cy;
    L.add(h);
    const lens = mk(new THREE.SphereGeometry(0.18, 24, 3, 0, Math.PI * 2, 0, 0.35), 'glass');
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, cy, 0.125 - 0.18 * Math.cos(0.35));
    L.add(lens);
    const bezel = mk(new THREE.TorusGeometry(0.064, 0.006, 6, 24), 'metal');
    bezel.position.set(0, cy, 0.126);
    L.add(bezel);
    // solid pedestal under the front half of the housing, as on the sheet
    const foot = mk(new THREE.BoxGeometry(0.11, 0.012, 0.10), 'green');
    foot.position.set(0, 0.006, 0.015);
    L.add(foot);
    const neck = mk(new THREE.BoxGeometry(0.06, 0.036, 0.085), 'green');
    neck.position.set(0, 0.028, 0.015);
    L.add(neck);
    return g;
  }

  return {
    cargo_pod: cargoPod(),
    cargo_pod_open: cargoPodOpen(),
    tundra_wheel: wheel(),
    propeller_climb: propeller({
      hubR: 0.10, hubL: 0.09, shankR: 0.03, tipE: 0.5,
      st: [[0.17, 0.075, 34, 0.028], [0.30, 0.115, 28, 0.022], [0.45, 0.135, 23, 0.017],
           [0.60, 0.138, 19, 0.014], [0.75, 0.13, 16, 0.012], [0.84, 0.115, 14, 0.011]]
    }),
    propeller_cruise: propeller({
      hubR: 0.09, hubL: 0.085, shankR: 0.026, tipE: 0.9,
      st: [[0.17, 0.055, 52, 0.022], [0.30, 0.078, 44, 0.018], [0.45, 0.09, 37, 0.014],
           [0.60, 0.092, 32, 0.012], [0.75, 0.088, 28, 0.010], [0.84, 0.08, 25, 0.009]]
    }),
    landing_lamp: lamp()
  };
}
