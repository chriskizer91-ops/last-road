function build(THREE) {
  const COLORS = {
    aged_fabric: 0xc2aa82,
    rusty_iron: 0x80593a,
    weathered_steel: 0x6e6b66,
    engine_iron: 0x4b4743,
    prop_wood: 0x93603e,
    rubber: 0x45403b,
    canvas: 0xbba780,
    groundsheet: 0x5a5041,
    timber: 0x93795a,
    rope: 0x9b8b6d,
    paint_red: 0x93412f,
    paint_grey: 0x737064,
    stone: 0x9a9285,
    charcoal: 0x2d2925,
    ash: 0x6e6760
  };
  const mats = {};
  function mat(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name] });
    return mats[name];
  }
  function mk(geo, name) {
    const m = new THREE.Mesh(geo, mat(name));
    m.name = name;
    return m;
  }
  function V(x, y, z) { return new THREE.Vector3(x, y, z); }
  const UP = V(0, 1, 0);
  function orient(m, a, b) {
    const d = new THREE.Vector3().subVectors(b, a);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(UP, d.normalize());
    return m;
  }
  function rod(a, b, r, name, seg) {
    return orient(mk(new THREE.CylinderGeometry(r, r, a.distanceTo(b), seg || 8), name), a, b);
  }
  function beam(a, b, w, t, name) {
    return orient(mk(new THREE.BoxGeometry(w, a.distanceTo(b), t), name), a, b);
  }
  function box(w, h, d, x, y, z, name) {
    const m = mk(new THREE.BoxGeometry(w, h, d), name);
    m.position.set(x, y, z);
    return m;
  }
  function polyShape(pts) {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    return s;
  }
  // planform: spans x0..x1, chord -c..c, rounded ends of radius r0 (left) / r1 (right)
  function planShape(x0, x1, c, r0, r1) {
    const n = 8;
    const pts = [[x0 + r0, -c]];
    if (r1 > 0) {
      for (let i = 0; i <= n; i++) {
        const a = -Math.PI / 2 + Math.PI * i / n;
        pts.push([x1 - r1 + r1 * Math.cos(a), c * Math.sin(a)]);
      }
    } else {
      pts.push([x1, -c], [x1, c]);
    }
    if (r0 > 0) {
      for (let i = 0; i < n; i++) {
        const a = Math.PI / 2 + Math.PI * i / n;
        pts.push([x0 + r0 + r0 * Math.cos(a), c * Math.sin(a)]);
      }
    } else {
      pts.push([x0, c]);
    }
    return polyShape(pts);
  }
  function extrude(shape, depth, name) {
    return mk(new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false }), name);
  }

  // ---------------------------------------------------------------- WRECK
  function buildWreck() {
    const g = new THREE.Group();
    // fuselage: tapered box frame, nose at +z
    const F0 = 2.72, F1 = -3.35;
    const tf = z => (F0 - z) / (F0 - F1);
    const cy = z => 0.65 + 0.325 * tf(z);
    const hw = z => 0.5 - 0.4 * tf(z);
    const hh = z => 0.47 - 0.375 * tf(z);
    const tilt = Math.atan(0.325 / (F0 - F1));
    function seg(z0, z1, name, grow) {
      const m = mk(new THREE.CylinderGeometry(Math.SQRT2 * (hw(z0) + grow), Math.SQRT2 * (hw(z1) + grow),
        z0 - z1, 4, 1, false, Math.PI / 4), name);
      const zm = (z0 + z1) / 2;
      m.position.set(0, cy(zm), zm);
      m.rotation.x = Math.PI / 2 + tilt;
      m.scale.z = 0.94;
      return m;
    }
    g.add(seg(2.72, 2.36, 'weathered_steel', 0.012));
    g.add(seg(2.36, -0.2, 'aged_fabric', 0));
    g.add(seg(-1.3, -3.35, 'aged_fabric', 0));
    const corner = (sx, sy, z) => V(sx * hw(z), cy(z) + sy * hh(z), z);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      g.add(rod(corner(sx, sy, 2.62), corner(sx, sy, -3.3), 0.022, 'rusty_iron', 6));
    }
    // open, see-through bay in the fuselage frame
    const zA = -0.2, zB = -1.3, zM = -0.75;
    for (const sx of [-1, 1]) {
      g.add(rod(corner(sx, 1, zA), corner(sx, -1, zB), 0.016, 'rusty_iron', 6));
      g.add(rod(corner(sx, 1, zM), corner(sx, -1, zM), 0.016, 'rusty_iron', 6));
    }
    for (const sy of [-1, 1]) g.add(rod(corner(-1, sy, zA), corner(1, sy, zB), 0.016, 'rusty_iron', 6));

    // wings
    const WZ = 1.79, WC = 0.89, WT = 0.12, RY = 0.56, DR = 0.085;
    function panel(x0, x1, r0, r1, p, rot) {
      const pg = new THREE.Group();
      pg.position.copy(p);
      pg.rotation.set(rot[0], rot[1], rot[2]);
      const m = extrude(planShape(x0, x1, WC, r0, r1), WT, 'aged_fabric');
      m.rotation.x = -Math.PI / 2;
      pg.add(m);
      return pg;
    }
    g.add(panel(0, 4.7, 0, 0.75, V(0, RY, WZ), [0, 0, -DR]));      // +x wing, intact
    g.add(panel(-3.0, 0, 0, 0, V(0, RY, WZ), [0, 0, DR]));          // -x inner wing
    const p1 = V(-3.0 * Math.cos(DR), RY - 3.0 * Math.sin(DR), WZ);
    const rotMid = [0.08, 0.06, -0.45];
    g.add(panel(-1.0, 0, 0, 0, p1, rotMid));                        // crumpled, bent up
    const p2 = p1.clone().add(V(-1.0, 0, 0).applyEuler(new THREE.Euler(rotMid[0], rotMid[1], rotMid[2])));
    g.add(panel(-0.9, 0, 0.65, 0, p2, [-0.06, -0.12, 0.85]));       // tip folded down
    const ribs = [
      [[-2.95, 0.34, 2.3], [-3.45, 0.52, 2.55]],
      [[-3.3, 0.48, 2.35], [-3.5, 0.9, 2.6]],
      [[-3.6, 0.62, 1.3], [-3.75, 0.95, 1.05]],
      [[-3.9, 0.74, 2.0], [-4.1, 0.95, 2.32]],
      [[-4.15, 0.35, 1.6], [-4.5, 0.12, 1.3]]
    ];
    for (const [a, b] of ribs) g.add(rod(V(a[0], a[1], a[2]), V(b[0], b[1], b[2]), 0.018, 'rusty_iron', 6));

    // hanging fabric shreds along leading (+1) and trailing (-1) edges
    const wb = x => RY - DR * Math.abs(x);
    const shreds = [
      [1.0, 1, 0.5, 0.04, 0.1], [1.8, 1, 0.38, 0.12, -0.08], [2.7, 1, 0.55, 0.05, 0.12],
      [3.5, 1, 0.34, 0.08, 0.05], [4.15, 1, 0.3, 0.04, 0.1],
      [1.35, -1, 0.42, 0.06, -0.1], [2.3, -1, 0.5, 0.1, 0.08], [3.25, -1, 0.36, 0.05, -0.06],
      [-1.1, 1, 0.45, 0.05, 0.1], [-1.9, 1, 0.4, 0.1, -0.06], [-2.6, 1, 0.5, 0.04, 0.08],
      [-1.5, -1, 0.45, 0.06, 0.06], [-2.45, -1, 0.38, 0.1, -0.08]
    ];
    for (const [x, e, w, bot, lean] of shreds) {
      const top = wb(x) + 0.05;
      const h = top - bot;
      const pg = new THREE.Group();
      pg.position.set(x, top, WZ + e * (WC - 0.03));
      pg.rotation.set(-e * lean, 0, lean * 0.4);
      pg.add(box(w, h, 0.012, 0, -h / 2, 0, 'aged_fabric'));
      g.add(pg);
    }
    for (const sx of [-1, 1]) {
      const top = RY + 0.02, bot = 0.04;
      g.add(box(0.012, top - bot, 1.05, sx * 0.6, (top + bot) / 2, 1.87, 'aged_fabric'));
    }

    // radial engine and cowling
    const EY = 0.62;
    const cowl = mk(new THREE.LatheGeometry([
      new THREE.Vector2(0.47, 0), new THREE.Vector2(0.535, 0), new THREE.Vector2(0.545, 0.25),
      new THREE.Vector2(0.535, 0.4), new THREE.Vector2(0.505, 0.45), new THREE.Vector2(0.47, 0.43),
      new THREE.Vector2(0.47, 0)
    ], 24), 'weathered_steel');
    cowl.position.set(0, EY, 2.72);
    cowl.rotation.x = Math.PI / 2;
    g.add(cowl);
    const crank = mk(new THREE.CylinderGeometry(0.19, 0.22, 0.32, 16), 'engine_iron');
    crank.position.set(0, EY, 2.98);
    crank.rotation.x = Math.PI / 2;
    g.add(crank);
    for (let k = 0; k < 9; k++) {
      const a = Math.PI / 2 + k * 2 * Math.PI / 9;
      const c = Math.cos(a), s = Math.sin(a);
      g.add(rod(V(0.17 * c, EY + 0.17 * s, 3.0), V(0.4 * c, EY + 0.4 * s, 3.0), 0.058, 'engine_iron', 8));
      g.add(rod(V(0.36 * c, EY + 0.36 * s, 3.0), V(0.46 * c, EY + 0.46 * s, 3.0), 0.07, 'weathered_steel', 8));
    }
    const hub = mk(new THREE.CylinderGeometry(0.09, 0.12, 0.2, 12), 'engine_iron');
    hub.position.set(0, EY, 3.24);
    hub.rotation.x = Math.PI / 2;
    g.add(hub);
    const nut = mk(new THREE.ConeGeometry(0.075, 0.12, 10), 'engine_iron');
    nut.position.set(0, EY, 3.4);
    nut.rotation.x = Math.PI / 2;
    g.add(nut);
    const bladePts = [[0.06, -0.07], [0.3, -0.085], [0.7, -0.07], [0.87, -0.05], [0.95, 0],
      [0.87, 0.05], [0.7, 0.07], [0.3, 0.085], [0.06, 0.07]];
    for (const a of [0.65, 0.65 + Math.PI]) {
      const bg = new THREE.Group();
      bg.position.set(0, EY, 3.28);
      bg.rotation.z = a;
      const tw = new THREE.Group();
      tw.rotation.x = 0.3;
      const bm = extrude(polyShape(bladePts), 0.04, 'prop_wood');
      bm.position.z = -0.02;
      tw.add(bm);
      bg.add(tw);
      g.add(bg);
    }

    // landing gear, wheels in the air
    for (const s of [-1, 1]) {
      const hx = s * 0.78, hy = 2.0, hz = 2.3;
      const tire = mk(new THREE.TorusGeometry(0.22, 0.08, 8, 20), 'rubber');
      tire.position.set(hx, hy, hz);
      tire.rotation.y = Math.PI / 2;
      const disc = mk(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 14), 'rusty_iron');
      disc.position.set(hx, hy, hz);
      disc.rotation.z = Math.PI / 2;
      const cap = mk(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8), 'engine_iron');
      cap.position.set(hx, hy, hz);
      cap.rotation.z = Math.PI / 2;
      g.add(tire, disc, cap);
      const H1 = V(s * 0.69, 1.98, 2.31);
      g.add(rod(V(s * 0.32, 1.1, 2.66), H1, 0.032, 'rusty_iron', 8));
      g.add(rod(V(s * 0.32, 1.1, 1.86), H1, 0.032, 'rusty_iron', 8));
      g.add(rod(V(-s * 0.12, 1.12, 2.3), V(s * 0.69, 1.96, 2.3), 0.028, 'rusty_iron', 8));
      // flying wires from gear to wing
      const wx = s > 0 ? 3.0 : 2.6;
      const wy = RY + WT - DR * wx;
      g.add(rod(V(s * 0.5, 1.76, 2.3), V(s * wx, wy, 2.45), 0.008, 'rusty_iron', 4));
      g.add(rod(V(s * 0.5, 1.76, 2.3), V(s * wx, wy, 1.15), 0.008, 'rusty_iron', 4));
      // bracing wires to tailplane
      g.add(rod(V(s * 0.42, 0.62, 0.95), V(s * 1.0, 1.0, -2.3), 0.008, 'rusty_iron', 4));
      g.add(rod(V(0, 1.8, -2.5), V(s * 1.1, 1.03, -2.62), 0.008, 'rusty_iron', 4));
    }

    // tail
    const stab = extrude(planShape(-1.33, 1.33, 0.7, 0.45, 0.45), 0.06, 'aged_fabric');
    stab.rotation.x = -Math.PI / 2;
    stab.position.set(0, 0.97, -2.75);
    g.add(stab);
    const fin = extrude(polyShape([
      [2.10, 1.0], [2.28, 1.4], [2.45, 1.82], [2.6, 2.04], [2.78, 2.13], [2.96, 2.08],
      [3.10, 1.92], [3.22, 1.55], [3.32, 1.03], [3.12, 1.0], [3.06, 0.62], [2.88, 0.45],
      [2.68, 0.52], [2.62, 1.0]
    ]), 0.05, 'aged_fabric');
    fin.rotation.y = Math.PI / 2;
    fin.position.x = -0.025;
    g.add(fin);
    g.add(rod(V(0, 0, -2.58), V(0, 0.95, -2.58), 0.03, 'rusty_iron', 8));
    return g;
  }

  // ---------------------------------------------------------------- TENT
  function buildTent() {
    const g = new THREE.Group();
    const H = 1.75, W = 0.85, L = 1.1;
    const sl = Math.hypot(W, H), ang = Math.atan2(H, W);
    for (const s of [-1, 1]) {
      const roof = box(sl + 0.06, 0.025, 2 * L + 0.1, s * W / 2, H / 2, 0, 'canvas');
      roof.rotation.z = -s * ang;
      g.add(roof);
    }
    const gable = (pts, z) => { const m = extrude(polyShape(pts), 0.02, 'canvas'); m.position.z = z; return m; };
    g.add(gable([[-W, 0], [-0.36, 0], [0, 1.38], [0, H]], L - 0.04));
    g.add(gable([[W, 0], [0, H], [0, 1.38], [0.36, 0]], L - 0.04));
    g.add(gable([[-W, 0], [W, 0], [0, H]], -L + 0.02));
    for (const s of [-1, 1]) g.add(rod(V(s * 0.38, 0.03, L - 0.01), V(s * 0.03, 1.36, L - 0.01), 0.035, 'canvas', 8));
    g.add(box(2 * W - 0.12, 0.012, 2 * L - 0.06, 0, 0.006, 0, 'groundsheet'));
    for (const sz of [-1, 1]) {
      g.add(rod(V(0, 0, sz * L), V(0, H + 0.12, sz * L), 0.022, 'timber', 8));
      for (const sx of [-1, 1]) {
        g.add(rod(V(0, H + 0.08, sz * L), V(sx * 1.35, 0.03, sz * 1.3), 0.008, 'rope', 4));
        g.add(rod(V(sx * 1.35, -0.03, sz * 1.3), V(sx * 1.39, 0.16, sz * 1.34), 0.016, 'timber', 6));
      }
    }
    return g;
  }

  // ---------------------------------------------------------------- TABLE
  function buildTable() {
    const g = new THREE.Group();
    const TW = 0.95, TD = 0.55, TH = 0.62;
    g.add(box(TW, 0.035, TD, 0, TH - 0.0175, 0, 'timber'));
    for (const sz of [-1, 1]) g.add(box(TW - 0.12, 0.06, 0.022, 0, TH - 0.065, sz * (TD / 2 - 0.05), 'timber'));
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        g.add(beam(V(sx * 0.405, TH - 0.04, sz * 0.215), V(sx * 0.475, 0, sz * 0.255), 0.042, 0.042, 'timber'));
      }
      g.add(beam(V(sx * 0.453, 0.18, -0.243), V(sx * 0.453, 0.18, 0.243), 0.03, 0.03, 'timber'));
    }
    g.add(beam(V(-0.453, 0.18, 0), V(0.453, 0.18, 0), 0.03, 0.03, 'timber'));
    return g;
  }

  // ---------------------------------------------------------------- CRATE
  function buildCrate() {
    const g = new THREE.Group();
    const CW = 0.7, CH = 0.42, CD = 0.52;
    g.add(box(CW, CH, CD, 0, CH / 2, 0, 'timber'));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(box(0.05, CH + 0.02, 0.05, sx * (CW / 2 - 0.01), (CH + 0.02) / 2, sz * (CD / 2 - 0.01), 'timber'));
    }
    for (const sz of [-1, 1]) {
      g.add(box(CW, 0.045, 0.03, 0, CH - 0.01, sz * (CD / 2 + 0.005), 'timber'));
      g.add(box(CW, 0.045, 0.03, 0, 0.04, sz * (CD / 2 + 0.005), 'timber'));
    }
    for (const sx of [-1, 1]) g.add(box(0.03, 0.04, 0.26, sx * (CW / 2 + 0.01), CH * 0.72, 0, 'timber'));
    return g;
  }

  // ---------------------------------------------------------------- JERRY CANS
  function buildCans() {
    const g = new THREE.Group();
    const spec = [[-0.37, 0.05, 0.12, 'paint_grey'], [0, -0.05, -0.06, 'paint_red'], [0.37, 0.03, 0.16, 'paint_red']];
    for (const [x, z, ry, m] of spec) {
      const c = new THREE.Group();
      c.position.set(x, 0, z);
      c.rotation.y = ry;
      c.add(box(0.33, 0.44, 0.16, 0, 0.22, 0, m));
      c.add(box(0.17, 0.035, 0.09, -0.05, 0.4575, 0, m));
      const sp = mk(new THREE.CylinderGeometry(0.028, 0.032, 0.06, 8), 'rusty_iron');
      sp.position.set(0.11, 0.47, 0);
      sp.rotation.z = -0.35;
      c.add(sp);
      g.add(c);
    }
    return g;
  }

  // ---------------------------------------------------------------- FIRE RING
  function buildFireRing() {
    const g = new THREE.Group();
    let seed = 18;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const sg = new THREE.SphereGeometry(1, 8, 6);
    const N = 11;
    for (let i = 0; i < N; i++) {
      const a = i * 2 * Math.PI / N + (rnd() - 0.5) * 0.15;
      const r = 0.43 + (rnd() - 0.5) * 0.04;
      const m = mk(sg, 'stone');
      m.position.set(r * Math.cos(a), 0.065 + rnd() * 0.015, r * Math.sin(a));
      m.scale.set(0.09 + rnd() * 0.025, 0.08 + rnd() * 0.02, 0.11 + rnd() * 0.03);
      m.rotation.y = -a + (rnd() - 0.5) * 0.4;
      g.add(m);
    }
    const bed = mk(new THREE.CylinderGeometry(0.32, 0.35, 0.03, 16), 'ash');
    bed.position.y = 0.015;
    g.add(bed);
    const logs = [
      [[-0.26, 0.04, -0.06], [0.22, 0.1, 0.08]],
      [[-0.08, 0.04, 0.25], [0.06, 0.11, -0.22]],
      [[0.22, 0.04, 0.17], [-0.13, 0.08, -0.14]],
      [[0.02, 0.035, -0.27], [0.14, 0.06, -0.06]]
    ];
    for (const [a, b] of logs) g.add(rod(V(a[0], a[1], a[2]), V(b[0], b[1], b[2]), 0.035, 'charcoal', 6));
    return g;
  }

  return {
    wreck: buildWreck(),
    tent: buildTent(),
    table: buildTable(),
    crate: buildCrate(),
    jerry_cans: buildCans(),
    fire_ring: buildFireRing()
  };
}
