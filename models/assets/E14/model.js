function build(THREE) {
  const COLORS = {
    rubber_green: 0x3f4e35,
    rubber_black: 0x2b2b29,
    glass: 0x2e4157,
    steel: 0x78746a,
    webbing: 0x6c5c3d,
    plastic_green: 0x6c7a3a,
    rubber_grey: 0x3f413c,
    lcd_screen: 0x1c1f1e,
    canvas: 0x7b6945,
    paint_olive: 0x5d633b,
    meter_face: 0xd8caa2,
    black_plastic: 0x3a3b38
  };
  const mats = {};
  function mat(name) {
    if (!mats[name]) {
      mats[name] = new THREE.MeshStandardMaterial({
        color: COLORS[name],
        roughness: 0.85,
        metalness: name === 'steel' ? 0.4 : 0.0,
        side: THREE.DoubleSide
      });
    }
    return mats[name];
  }
  function add(parent, geom, name, pos, rot, scl) {
    const m = new THREE.Mesh(geom, mat(name));
    m.name = name;
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    if (scl) m.scale.set(scl[0], scl[1], scl[2]);
    parent.add(m);
    return m;
  }
  const HALF_PI = Math.PI / 2;
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  function roundedRect(w, y0, y1, r) {
    const x0 = -w / 2, x1 = w / 2;
    const s = new THREE.Shape();
    s.moveTo(x0 + r, y0);
    s.lineTo(x1 - r, y0);
    s.absarc(x1 - r, y0 + r, r, -HALF_PI, 0, false);
    s.lineTo(x1, y1 - r);
    s.absarc(x1 - r, y1 - r, r, 0, HALF_PI, false);
    s.lineTo(x0 + r, y1);
    s.absarc(x0 + r, y1 - r, r, HALF_PI, Math.PI, false);
    s.lineTo(x0, y0 + r);
    s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
    return s;
  }
  function slab(shape, depth) {
    const g = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, curveSegments: 4 });
    g.translate(0, 0, -depth / 2);
    return g;
  }

  // ---------------- BINOCULARS (optical axis along z, objectives at +z) ----------------
  const bino = new THREE.Group();
  bino.name = 'binoculars';
  const yc = 0.036, bx = 0.045;
  const bodyGeo = new THREE.LatheGeometry([
    V2(0.020, -0.050), V2(0.027, -0.050), V2(0.033, -0.044), V2(0.0355, -0.035),
    V2(0.036, -0.015), V2(0.036, 0.032), V2(0.035, 0.046), V2(0.034, 0.052), V2(0.020, 0.052)
  ], 16);
  const eyeGeo = new THREE.LatheGeometry([
    V2(0.0, -0.0755), V2(0.0125, -0.0765), V2(0.0215, -0.078), V2(0.023, -0.0755), V2(0.023, -0.049)
  ], 16);
  const rimGeo = new THREE.LatheGeometry([
    V2(0.0345, 0.050), V2(0.035, 0.070), V2(0.0335, 0.079), V2(0.025, 0.079), V2(0.024, 0.072)
  ], 16);
  const lensGeo = new THREE.CylinderGeometry(0.0242, 0.0242, 0.003, 14);
  const lugGeo = new THREE.TorusGeometry(0.0045, 0.0012, 4, 10);
  const tabGeo = new THREE.BoxGeometry(0.003, 0.024, 0.011);
  [-1, 1].forEach(function (s) {
    add(bino, bodyGeo, 'rubber_green', [s * bx, yc, 0], [HALF_PI, 0, 0]);
    add(bino, eyeGeo, 'rubber_black', [s * bx, yc, 0], [HALF_PI, 0, 0]);
    add(bino, rimGeo, 'rubber_black', [s * bx, yc, 0], [HALF_PI, 0, 0]);
    add(bino, lensGeo, 'glass', [s * bx, yc, 0.0705], [HALF_PI, 0, 0]);
    add(bino, lugGeo, 'steel', [s * 0.086, 0.044, -0.011], [HALF_PI, 0, 0]);
    add(bino, tabGeo, 'webbing', [s * 0.0895, 0.030, -0.011]);
  });
  // centre hinge column filling the gap between the barrels, and focus wheel
  add(bino, new THREE.BoxGeometry(0.026, 0.046, 0.09), 'rubber_black', [0, 0.043, -0.003]);
  add(bino, new THREE.CylinderGeometry(0.013, 0.013, 0.03, 16), 'rubber_black', [0, 0.067, -0.03], [0, 0, HALF_PI]);

  // ---------------- GPS (standing upright, screen faces +z) ----------------
  const gps = new THREE.Group();
  gps.name = 'gps';
  add(gps, slab(roundedRect(0.083, 0.0, 0.189, 0.014), 0.036), 'rubber_black', [0, 0, 0]);
  add(gps, slab(roundedRect(0.0795, 0.0018, 0.1872, 0.0125), 0.050), 'plastic_green', [0, 0, 0]);
  add(gps, slab(roundedRect(0.065, 0.034, 0.170, 0.008), 0.002), 'rubber_grey', [0, 0, 0.026]);
  add(gps, new THREE.BoxGeometry(0.056, 0.089, 0.0012), 'lcd_screen', [0, 0.117, 0.0276]);
  const btnGeo = new THREE.BoxGeometry(0.015, 0.016, 0.003);
  [-0.0185, 0, 0.0185].forEach(function (x) {
    add(gps, btnGeo, 'rubber_black', [x, 0.0505, 0.0275]);
  });
  add(gps, new THREE.CylinderGeometry(0.0095, 0.0115, 0.026, 12), 'rubber_black', [0.0105, 0.194, -0.004]);
  add(gps, new THREE.SphereGeometry(0.0095, 12, 4, 0, Math.PI * 2, 0, HALF_PI), 'rubber_black', [0.0105, 0.207, -0.004]);
  add(gps, new THREE.BoxGeometry(0.0025, 0.030, 0.009), 'rubber_black', [0.0425, 0.108, -0.001]);

  // ---------------- RADIO in canvas bag (panel faces +z) ----------------
  const radio = new THREE.Group();
  radio.name = 'radio';
  const r = new THREE.Group();
  r.position.z = -0.006;
  radio.add(r);

  // bag body, rolled-back flap, radio unit
  add(r, new THREE.BoxGeometry(0.276, 0.18, 0.085), 'canvas', [0, 0.09, -0.0125]);
  add(r, new THREE.CylinderGeometry(0.009, 0.009, 0.27, 10), 'canvas', [0, 0.174, 0.027], [0, 0, HALF_PI]);
  add(r, new THREE.BoxGeometry(0.236, 0.079, 0.076), 'paint_olive', [0.010, 0.1035, -0.002]);

  // panel: connector, plug, knobs, meter
  add(r, new THREE.CylinderGeometry(0.0135, 0.0135, 0.014, 12), 'steel', [-0.087, 0.104, 0.043], [HALF_PI, 0, 0]);
  add(r, new THREE.CylinderGeometry(0.008, 0.008, 0.022, 10), 'rubber_black', [-0.092, 0.092, 0.050], [0, 0, -0.4]);
  const knobGeo = new THREE.CylinderGeometry(0.0135, 0.0145, 0.012, 16);
  add(r, knobGeo, 'rubber_black', [-0.0248, 0.0962, 0.042], [HALF_PI, 0, 0]);
  add(r, knobGeo, 'rubber_black', [0.030, 0.0962, 0.042], [HALF_PI, 0, 0]);
  add(r, new THREE.CylinderGeometry(0.0235, 0.0235, 0.006, 16), 'steel', [0.0824, 0.1038, 0.039], [HALF_PI, 0, 0]);
  add(r, new THREE.CylinderGeometry(0.0205, 0.0205, 0.002, 16), 'meter_face', [0.0824, 0.1038, 0.0425], [HALF_PI, 0, 0]);

  // straps holding the radio, side straps, tabs and D-rings
  const holdGeo = new THREE.BoxGeometry(0.016, 0.038, 0.004);
  add(r, holdGeo, 'canvas', [-0.095, 0.049, 0.032]);
  add(r, holdGeo, 'canvas', [0.107, 0.049, 0.032]);
  const sideStrapGeo = new THREE.BoxGeometry(0.004, 0.11, 0.014);
  const sideTabGeo = new THREE.BoxGeometry(0.008, 0.02, 0.016);
  const dRingGeo = new THREE.TorusGeometry(0.0072, 0.0018, 4, 10);
  [-1, 1].forEach(function (s) {
    add(r, sideStrapGeo, 'canvas', [s * 0.140, 0.085, 0.012]);
    add(r, sideTabGeo, 'canvas', [s * 0.142, 0.135, 0.012]);
    add(r, dRingGeo, 'steel', [s * 0.1445, 0.135, 0.012]);
  });

  // carry handle on top (flat canvas strap arch), about 16 cm long
  const hs = new THREE.Shape();
  const ha = 0.079, hb = 0.027, ht = 0.008, hn = 12;
  for (let i = 0; i <= hn; i++) {
    const ang = Math.PI - Math.PI * i / hn;
    const x = ha * Math.cos(ang), y = hb * Math.sin(ang);
    if (i === 0) hs.moveTo(x, y); else hs.lineTo(x, y);
  }
  for (let i = 0; i <= hn; i++) {
    const ang = Math.PI * i / hn;
    hs.lineTo((ha - ht) * Math.cos(ang), (hb - ht) * Math.sin(ang));
  }
  add(r, slab(hs, 0.026), 'canvas', [-0.009, 0.18, -0.0125]);

  // antenna pocket and stub antenna on the +x end
  add(r, new THREE.BoxGeometry(0.014, 0.08, 0.035), 'canvas', [0.145, 0.07, -0.022]);
  add(r, new THREE.CylinderGeometry(0.0075, 0.0075, 0.035, 10), 'rubber_black', [0.145, 0.1275, -0.022]);
  add(r, new THREE.CylinderGeometry(0.0032, 0.0032, 0.05, 8), 'steel', [0.145, 0.17, -0.022]);
  add(r, new THREE.SphereGeometry(0.005, 8, 4), 'rubber_black', [0.145, 0.196, -0.022]);

  // handset resting against the bag front
  add(r, new THREE.CylinderGeometry(0.0085, 0.0085, 0.09, 10), 'black_plastic', [0.037, 0.028, 0.045], [0, 0, HALF_PI]);
  add(r, new THREE.CylinderGeometry(0.0145, 0.0135, 0.024, 14), 'black_plastic', [-0.020, 0.026, 0.044], [HALF_PI, 0, 0], [1.15, 1, 1]);
  add(r, new THREE.CylinderGeometry(0.019, 0.017, 0.026, 16), 'black_plastic', [0.106, 0.026, 0.045], [HALF_PI, 0, 0], [1.35, 1, 1]);

  // coiled cord: plug -> helix at front-left corner -> handset mic end
  const pts = [V3(-0.096, 0.083, 0.050), V3(-0.104, 0.085, 0.049)];
  const turns = 7, per = 8, N = turns * per;
  const cx = -0.124, cz = 0.048, rc = 0.014, yTop = 0.084, yBot = 0.008;
  for (let i = 0; i <= N; i++) {
    const a = (i / per) * Math.PI * 2;
    const y = yTop - (yTop - yBot) * i / N;
    pts.push(V3(cx + rc * Math.cos(a), y, cz + rc * Math.sin(a)));
  }
  pts.push(V3(-0.092, 0.006, 0.049), V3(-0.065, 0.006, 0.047), V3(-0.045, 0.010, 0.045), V3(-0.036, 0.016, 0.044));
  const cordCurve = new THREE.CatmullRomCurve3(pts);
  add(r, new THREE.TubeGeometry(cordCurve, 150, 0.0032, 5, false), 'rubber_black', [0, 0, 0]);

  return { binoculars: bino, gps: gps, radio: radio };
}
