function build(THREE) {
  const root = new THREE.Group();
  root.name = 'station_windmill_tank';
  const g = new THREE.Group();
  g.position.set(-0.25, 0, -0.8); // centre the overall footprint on x=0, z=0
  root.add(g);

  const COLORS = {
    rusty_steel: 0x7d7468,
    rusty_sheet: 0x93857a,
    galvanised_iron: 0x908a82,
    dark_iron: 0x4a3e35,
    concrete: 0xb8ad98,
    dirt: 0xa3805c,
    mud: 0x8a6d55,
    water: 0x6d6852
  };
  const MATS = {};
  function mat(name) {
    if (!MATS[name]) MATS[name] = new THREE.MeshStandardMaterial({ color: COLORS[name] });
    return MATS[name];
  }
  function add(geo, name, parent) {
    const m = new THREE.Mesh(geo, mat(name));
    m.name = name;
    (parent || g).add(m);
    return m;
  }
  const UP = new THREE.Vector3(0, 1, 0);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  function beam(name, a, b, w, d, parent) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = add(new THREE.BoxGeometry(w, len, d === undefined ? w : d), name, parent);
    m.position.addVectors(a, b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, dir.normalize());
    return m;
  }
  function rod(name, a, b, r, seg, parent) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = add(new THREE.CylinderGeometry(r, r, len, seg || 8), name, parent);
    m.position.addVectors(a, b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, dir.normalize());
    return m;
  }
  function joint(name, p, r) {
    const s = add(new THREE.SphereGeometry(r, 8, 6), name);
    s.position.copy(p);
    return s;
  }

  // ---------- ground: earth pad under tank, mud patch around trough ----------
  const pad = add(new THREE.CylinderGeometry(2.75, 3.15, 0.45, 32), 'dirt');
  pad.position.set(0, 0.225, 0);
  const mud = add(new THREE.CylinderGeometry(1, 1, 0.03, 32), 'mud');
  mud.scale.set(3.675, 1, 1.4);          // x -1.2 .. 6.15, z 1.95 .. 4.75
  mud.position.set(2.475, 0.015, 3.35);

  // ---------- corrugated tank (closed, flat lid) ----------
  const TB = 0.45, TH = 1.63, TR = 2.56;
  const tank = add(new THREE.CylinderGeometry(TR, TR, TH, 32), 'galvanised_iron');
  tank.position.set(0, TB + TH / 2, 0);
  const rimTop = add(new THREE.TorusGeometry(TR, 0.035, 6, 32), 'galvanised_iron');
  rimTop.rotation.x = Math.PI / 2;
  rimTop.position.set(0, TB + TH, 0);
  const rimBot = add(new THREE.TorusGeometry(TR, 0.03, 6, 32), 'galvanised_iron');
  rimBot.rotation.x = Math.PI / 2;
  rimBot.position.set(0, TB + 0.03, 0);

  // ---------- trough (U-section, galvanised) on concrete blocks ----------
  const TX0 = -1.1, TX1 = 5.45, TL = TX1 - TX0, TMID = (TX0 + TX1) / 2;
  const TZ = 3.3, TBOT = 0.42, TD = 0.34, TW = 0.33;
  const cr = 0.12, th = 0.025, cri = cr - th;
  const ush = new THREE.Shape();
  ush.moveTo(-TW, TD);
  ush.lineTo(-TW, cr);
  ush.absarc(-TW + cr, cr, cr, Math.PI, 1.5 * Math.PI, false);
  ush.lineTo(TW - cr, 0);
  ush.absarc(TW - cr, cr, cr, 1.5 * Math.PI, 2 * Math.PI, false);
  ush.lineTo(TW, TD);
  ush.lineTo(TW - th, TD);
  ush.lineTo(TW - th, cr);
  ush.absarc(TW - cr, cr, cri, 0, -0.5 * Math.PI, true);
  ush.lineTo(-TW + cr, th);
  ush.absarc(-TW + cr, cr, cri, 1.5 * Math.PI, Math.PI, true);
  ush.lineTo(-TW + th, TD);
  ush.closePath();
  const tgeo = new THREE.ExtrudeGeometry(ush, { depth: TL, bevelEnabled: false, curveSegments: 6 });
  tgeo.translate(0, 0, -TL / 2);
  const trough = add(tgeo, 'galvanised_iron');
  trough.rotation.y = Math.PI / 2;
  trough.position.set(TMID, TBOT, TZ);

  const esh = new THREE.Shape();
  esh.moveTo(-TW, TD);
  esh.lineTo(-TW, cr);
  esh.absarc(-TW + cr, cr, cr, Math.PI, 1.5 * Math.PI, false);
  esh.lineTo(TW - cr, 0);
  esh.absarc(TW - cr, cr, cr, 1.5 * Math.PI, 2 * Math.PI, false);
  esh.lineTo(TW, TD);
  esh.closePath();
  const egeo = new THREE.ExtrudeGeometry(esh, { depth: 0.025, bevelEnabled: false, curveSegments: 6 });
  [TX0, TX1 - 0.025].forEach(function (x) {
    const e = add(egeo, 'galvanised_iron');
    e.rotation.y = Math.PI / 2;
    e.position.set(x, TBOT, TZ);
  });
  [-1, 1].forEach(function (s) {
    const lip = add(new THREE.BoxGeometry(TL, 0.03, 0.06), 'galvanised_iron');
    lip.position.set(TMID, TBOT + TD - 0.015, TZ + s * (TW + 0.01));
  });
  const water = add(new THREE.BoxGeometry(TL - 0.06, 0.02, 2 * (TW - 0.03)), 'water');
  water.position.set(TMID, TBOT + 0.25, TZ);
  [0.07, 0.5, 0.93].forEach(function (f) {
    const b = add(new THREE.BoxGeometry(0.4, TBOT, 0.8), 'concrete');
    b.position.set(TX0 + f * TL, TBOT / 2, TZ);
  });

  // feed pipe tank -> trough end
  rod('galvanised_iron', V(-1.4, 0.62, 2.1), V(-1.4, 0.62, TZ), 0.035, 8);
  joint('galvanised_iron', V(-1.4, 0.62, TZ), 0.042);
  rod('galvanised_iron', V(-1.4, 0.62, TZ), V(TX0 + 0.02, 0.62, TZ), 0.035, 8);

  // ---------- windmill tower ----------
  const XT = -4.05, ZT = 0.75, TOP = 6.5;
  const bx = 1.32, bz = 1.18, tx = 0.28, tz = 0.26;
  const hx = function (h) { return bx + (tx - bx) * h / TOP; };
  const hz = function (h) { return bz + (tz - bz) * h / TOP; };
  const corner = function (sx, sz, h) { return V(XT + sx * hx(h), h, ZT + sz * hz(h)); };
  const C4 = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

  C4.forEach(function (c) {
    beam('rusty_steel', corner(c[0], c[1], 0.02), corner(c[0], c[1], TOP), 0.11);
    const foot = add(new THREE.BoxGeometry(0.34, 0.14, 0.34), 'concrete');
    foot.position.copy(corner(c[0], c[1], 0));
    foot.position.y = 0.07;
  });
  [1.0, 2.7, 4.15, 5.2, 6.0, 6.45].forEach(function (h) {
    for (let i = 0; i < 4; i++) {
      const a = C4[i], b = C4[(i + 1) % 4];
      beam('rusty_steel', corner(a[0], a[1], h), corner(b[0], b[1], h), 0.07);
    }
  });
  [[0.1, 2.7], [2.7, 4.15], [4.15, 5.2], [5.2, 6.0]].forEach(function (p) {
    for (let i = 0; i < 4; i++) {
      const a = C4[i], b = C4[(i + 1) % 4];
      beam('rusty_steel', corner(a[0], a[1], p[0]), corner(b[0], b[1], p[1]), 0.045);
      beam('rusty_steel', corner(b[0], b[1], p[0]), corner(a[0], a[1], p[1]), 0.045);
    }
  });
  const cap = add(new THREE.BoxGeometry(0.75, 0.05, 0.7), 'rusty_steel');
  cap.position.set(XT, TOP + 0.025, ZT);

  // ---------- pump, rising main, pump rod, delivery pipe ----------
  const pb = add(new THREE.CylinderGeometry(0.2, 0.23, 0.12, 12), 'dark_iron');
  pb.position.set(XT, 0.06, ZT);
  const pl = add(new THREE.CylinderGeometry(0.14, 0.15, 0.55, 12), 'dark_iron');
  pl.position.set(XT, 0.12 + 0.275, ZT);
  const pc = add(new THREE.CylinderGeometry(0.08, 0.08, 0.85, 10), 'dark_iron');
  pc.position.set(XT, 0.67 + 0.425, ZT);
  const ph = add(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 10), 'dark_iron');
  ph.position.set(XT, 1.58, ZT);
  beam('dark_iron', V(XT, 1.35, ZT), V(XT + 0.35, 1.5, ZT), 0.04);

  rod('galvanised_iron', V(XT, 1.64, ZT), V(XT, 2.62, ZT), 0.05, 10);
  rod('rusty_steel', V(XT, 2.62, ZT), V(XT, TOP, ZT), 0.022, 6);
  const PX = -1.4, PY = 2.55;
  rod('galvanised_iron', V(XT, PY, ZT), V(PX, PY, ZT), 0.05, 10);
  joint('galvanised_iron', V(PX, PY, ZT), 0.06);
  rod('galvanised_iron', V(PX, PY, ZT), V(PX, TB + TH - 0.02, ZT), 0.05, 10);
  const collar = add(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 10), 'galvanised_iron');
  collar.position.set(PX, TB + TH + 0.03, ZT);

  // ---------- windmill head ----------
  const HY = 7.65;
  rod('rusty_steel', V(XT, TOP, ZT), V(XT, 7.4, ZT), 0.08, 10);
  const head = add(new THREE.BoxGeometry(0.34, 0.5, 0.75), 'rusty_steel');
  head.position.set(XT, HY, ZT + 0.03);
  const hood = add(new THREE.CylinderGeometry(0.17, 0.17, 0.75, 12), 'rusty_steel');
  hood.rotation.x = Math.PI / 2;
  hood.position.set(XT, HY + 0.25, ZT + 0.03);
  rod('dark_iron', V(XT, HY, ZT + 0.4), V(XT, HY, ZT + 0.62), 0.12, 12);
  const nose = add(new THREE.ConeGeometry(0.1, 0.12, 10), 'dark_iron');
  nose.rotation.x = Math.PI / 2;
  nose.position.set(XT, HY, ZT + 0.68);

  // ---------- wheel (18 pitched blades on two rings) ----------
  const rotor = new THREE.Group();
  rotor.position.set(XT, HY, ZT + 0.55);
  g.add(rotor);
  add(new THREE.TorusGeometry(0.6, 0.022, 6, 36), 'rusty_steel', rotor);
  add(new THREE.TorusGeometry(1.2, 0.022, 6, 48), 'rusty_steel', rotor);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + Math.PI / 18;
    beam('rusty_steel', V(0.1 * Math.cos(a), 0.1 * Math.sin(a), 0),
      V(1.2 * Math.cos(a), 1.2 * Math.sin(a), 0), 0.03, 0.03, rotor);
  }
  const bsh = new THREE.Shape();
  bsh.moveTo(0.56, -0.08);
  bsh.lineTo(1.6, -0.2);
  bsh.lineTo(1.6, 0.2);
  bsh.lineTo(0.56, 0.08);
  bsh.closePath();
  const bgeo = new THREE.ExtrudeGeometry(bsh, { depth: 0.012, bevelEnabled: false });
  bgeo.translate(0, 0, -0.006);
  for (let i = 0; i < 18; i++) {
    const piv = new THREE.Group();
    piv.rotation.z = i * 2 * Math.PI / 18;
    rotor.add(piv);
    const bl = add(bgeo, 'rusty_sheet', piv);
    bl.rotation.x = 0.5;
  }

  // ---------- tail vane (behind, toward -z) ----------
  beam('rusty_steel', V(XT, HY, ZT - 0.3), V(XT, HY, ZT - 2.6), 0.05);
  beam('rusty_steel', V(XT, HY + 0.25, ZT - 0.2), V(XT, HY + 0.05, ZT - 1.4), 0.03);
  const vsh = new THREE.Shape();
  vsh.moveTo(1.2, HY - 0.2);
  vsh.lineTo(2.65, HY - 0.5);
  vsh.lineTo(2.65, HY + 0.5);
  vsh.lineTo(1.2, HY + 0.2);
  vsh.closePath();
  const vgeo = new THREE.ExtrudeGeometry(vsh, { depth: 0.015, bevelEnabled: false });
  vgeo.translate(0, 0, -0.0075);
  const vane = add(vgeo, 'rusty_sheet');
  vane.rotation.y = Math.PI / 2;
  vane.position.set(XT + 0.04, 0, ZT);

  return root;
}
