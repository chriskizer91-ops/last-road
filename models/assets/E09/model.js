function build(THREE) {
  const C = {
    paint_red: 0xa23a30, rusty_red_iron: 0x8a4a3c, cast_aluminium: 0x8b8477,
    paint_cream: 0xcbc1a9, paint_black: 0x3c3a37, black_plastic: 0x2e2c2a,
    rubber: 0x38332e, rusty_iron: 0x6b5141, timber: 0xa08b6c, rope: 0xa6895c,
    galvanised_wire: 0x86827a
  };
  const mats = {};
  function M(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: C[name] });
    return mats[name];
  }
  function add(parent, geo, name, x, y, z) {
    const m = new THREE.Mesh(geo, M(name));
    m.name = name;
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function rod(parent, name, a, b, r, seg) {
    const va = new THREE.Vector3(a[0], a[1], a[2]);
    const vb = new THREE.Vector3(b[0], b[1], b[2]);
    const dir = new THREE.Vector3().subVectors(vb, va);
    const len = dir.length();
    const m = add(parent, new THREE.CylinderGeometry(r, r, len, seg, 1, true), name,
      (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
  }
  function loopXY(parent, name, cx, cy, hw, hh, rc, z, r) {
    rod(parent, name, [cx - hw + rc, cy + hh, z], [cx + hw - rc, cy + hh, z], r, 8);
    rod(parent, name, [cx - hw + rc, cy - hh, z], [cx + hw - rc, cy - hh, z], r, 8);
    rod(parent, name, [cx - hw, cy - hh + rc, z], [cx - hw, cy + hh - rc, z], r, 8);
    rod(parent, name, [cx + hw, cy - hh + rc, z], [cx + hw, cy + hh - rc, z], r, 8);
    const corners = [
      [cx + hw - rc, cy + hh - rc, 0],
      [cx - hw + rc, cy + hh - rc, Math.PI / 2],
      [cx - hw + rc, cy - hh + rc, Math.PI],
      [cx + hw - rc, cy - hh + rc, Math.PI * 1.5]
    ];
    for (const c of corners) {
      const t = add(parent, new THREE.TorusGeometry(rc, r, 8, 6, Math.PI / 2), name, c[0], c[1], z);
      t.rotation.z = c[2];
    }
  }
  function roundRectShape(w, h, r) {
    const s = new THREE.Shape();
    const x0 = -w / 2, y0 = -h / 2;
    s.moveTo(x0 + r, y0);
    s.lineTo(x0 + w - r, y0);
    s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
    s.lineTo(x0 + w, y0 + h - r);
    s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
    s.lineTo(x0 + r, y0 + h);
    s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
    s.lineTo(x0, y0 + r);
    s.quadraticCurveTo(x0, y0, x0 + r, y0);
    return s;
  }

  // ---------------- WATER PUMP ----------------
  const pump = new THREE.Group();
  const fr = 0.016, rc = 0.07, hw = 0.344, yb = 0.06, yt = 0.549, zl = 0.244;
  const cy = (yb + yt) / 2, hh = (yt - yb) / 2;
  // front and back rounded frame loops
  loopXY(pump, 'paint_red', 0, cy, hw, hh, rc, zl, fr);
  loopXY(pump, 'paint_red', 0, cy, hw, hh, rc, -zl, fr);
  // top rails joined at 45 deg on the corner bends, bottom skid rails, rubber feet
  const k = rc * Math.SQRT1_2;
  const xr = hw - rc + k, yr = yt - rc + k;
  for (const s of [-1, 1]) {
    rod(pump, 'paint_red', [s * xr, yr, -zl], [s * xr, yr, zl], fr, 8);
    rod(pump, 'paint_red', [s * 0.27, yb, -zl], [s * 0.27, yb, zl], fr, 8);
    for (const t of [-1, 1]) {
      add(pump, new THREE.CylinderGeometry(0.028, 0.03, 0.045, 10), 'rubber', s * 0.27, 0.0225, t * 0.21);
    }
  }
  // base plate
  add(pump, new THREE.BoxGeometry(0.56, 0.025, 0.40), 'rusty_iron', 0, 0.0725, 0);
  // engine crankcase
  add(pump, new THREE.BoxGeometry(0.30, 0.22, 0.28), 'cast_aluminium', -0.07, 0.195, -0.02);
  // recoil starter cowl facing front, with hub
  const cowl = add(pump, new THREE.CylinderGeometry(0.135, 0.135, 0.07, 24), 'paint_red', -0.075, 0.205, 0.155);
  cowl.rotation.x = Math.PI / 2;
  const hub = add(pump, new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12), 'rusty_iron', -0.075, 0.205, 0.20);
  hub.rotation.x = Math.PI / 2;
  // starter grip
  const grip = add(pump, new THREE.BoxGeometry(0.07, 0.024, 0.03), 'black_plastic', -0.225, 0.262, 0.20);
  grip.rotation.z = 0.6;
  // air cleaner (front left) and muffler guard (rear)
  add(pump, new THREE.BoxGeometry(0.14, 0.22, 0.22), 'paint_black', -0.255, 0.35, 0.05);
  add(pump, new THREE.BoxGeometry(0.36, 0.17, 0.15), 'paint_black', -0.12, 0.385, -0.155);
  // fuel tank (rounded front profile) and cap
  const tank = add(pump, new THREE.ExtrudeGeometry(roundRectShape(0.27, 0.15, 0.03),
    { depth: 0.24, bevelEnabled: false, curveSegments: 4 }), 'paint_cream', -0.05, 0.425, -0.07);
  tank.rotation.set(0, 0, 0);
  add(pump, new THREE.CylinderGeometry(0.032, 0.035, 0.03, 12), 'black_plastic', -0.06, 0.515, 0.05);
  // pump: bell housing, volute, foot
  const bell = add(pump, new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16), 'rusty_red_iron', 0.10, 0.205, 0.06);
  bell.rotation.z = Math.PI / 2;
  const vol = add(pump, new THREE.CylinderGeometry(0.13, 0.13, 0.19, 24), 'rusty_red_iron', 0.215, 0.215, 0.10);
  vol.rotation.z = Math.PI / 2;
  add(pump, new THREE.BoxGeometry(0.16, 0.05, 0.16), 'rusty_red_iron', 0.215, 0.105, 0.08);
  // suction coupling + hollow threaded nipple pointing front
  const fl = add(pump, new THREE.CylinderGeometry(0.066, 0.066, 0.045, 16), 'rusty_red_iron', 0.215, 0.215, 0.2425);
  fl.rotation.x = Math.PI / 2;
  const nipProf = [[0.040, 0], [0.052, 0], [0.052, 0.06], [0.040, 0.06], [0.040, 0]]
    .map(p => new THREE.Vector2(p[0], p[1]));
  const nip = add(pump, new THREE.LatheGeometry(nipProf, 14), 'rusty_iron', 0.215, 0.215, 0.262);
  nip.rotation.x = Math.PI / 2;
  // discharge pipe and cap on top, priming plug
  add(pump, new THREE.CylinderGeometry(0.042, 0.042, 0.13, 12), 'rusty_red_iron', 0.215, 0.39, 0.16);
  add(pump, new THREE.CylinderGeometry(0.052, 0.052, 0.03, 12), 'rusty_iron', 0.215, 0.47, 0.16);
  add(pump, new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8), 'rusty_iron', 0.27, 0.355, 0.08);

  // ---------------- PARTS CRATE ----------------
  const crate = new THREE.Group();
  const W = 0.795, D = 0.465, Hb = 0.352;
  add(crate, new THREE.BoxGeometry(W, Hb, D), 'timber', 0, Hb / 2, 0);
  const LW = 0.80, LD = 0.47, LH = 0.078;
  add(crate, new THREE.BoxGeometry(LW, LH, LD), 'timber', 0, Hb + LH / 2, 0);
  const bands = [[0, 0.075, W, D], [0.255, Hb - 0.004, W, D], [Hb + 0.004, Hb + LH, LW, LD]];
  for (const b of bands) {
    const h = b[1] - b[0], yc = (b[0] + b[1]) / 2, w = b[2], d = b[3];
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        add(crate, new THREE.BoxGeometry(0.08, h, 0.005), 'rusty_iron', sx * (w / 2 - 0.04), yc, sz * (d / 2 + 0.0025));
        add(crate, new THREE.BoxGeometry(0.005, h, 0.08), 'rusty_iron', sx * (w / 2 + 0.0025), yc, sz * (d / 2 - 0.04));
      }
    }
  }
  const ropePts = [[0.385, 0.295, -0.085], [0.412, 0.29, -0.085], [0.442, 0.245, -0.072],
    [0.457, 0.195, -0.04], [0.46, 0.172, 0], [0.457, 0.195, 0.04], [0.442, 0.245, 0.072],
    [0.412, 0.29, 0.085], [0.385, 0.295, 0.085]];
  for (const s of [-1, 1]) {
    const pts = ropePts.map(p => new THREE.Vector3(s * p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(pts);
    add(crate, new THREE.TubeGeometry(curve, 24, 0.012, 6, false), 'rope', 0, 0, 0);
  }

  // ---------------- WIRE COIL ----------------
  const coil = new THREE.Group();
  const prof = [[0.185, 0], [0.29, 0], [0.312, 0.008], [0.324, 0.03], [0.33, 0.12], [0.332, 0.235],
    [0.33, 0.35], [0.324, 0.44], [0.312, 0.462], [0.29, 0.47], [0.185, 0.47], [0.17, 0.462],
    [0.165, 0.44], [0.163, 0.235], [0.165, 0.03], [0.17, 0.008], [0.185, 0]]
    .map(p => new THREE.Vector2(p[0], p[1]));
  add(coil, new THREE.LatheGeometry(prof, 32), 'galvanised_wire', 0, 0, 0);

  return { water_pump: pump, parts_crate: crate, wire_coil: coil };
}
