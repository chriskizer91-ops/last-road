function build(THREE) {
  const root = new THREE.Group();
  root.name = 'roadhouse';
  const g = new THREE.Group();
  g.position.z = -0.28; // centre footprint: veranda front +7.41 .. tank stand -6.85
  root.add(g);

  const COL = {
    rendered_block: 0xd4bf9f,
    rusty_corrugated_iron: 0xa48a76,
    galvanised_iron: 0x9b9891,
    painted_sheet_metal: 0xd5bd9c,
    concrete: 0xcdbea5,
    blue_grey_steel: 0x6e7d8c,
    glass: 0x4b4842,
    aluminium: 0x96948e,
    flyscreen_mesh: 0x6e6962,
    timber: 0x8c7a64,
    white_coolroom_panel: 0xd7d0c3,
    white_sheet_metal: 0xd4d2cc,
    pvc_pipe: 0xcdc8be
  };
  const MATS = {};
  function mat(n) {
    if (!MATS[n]) MATS[n] = new THREE.MeshStandardMaterial({ color: COL[n] });
    return MATS[n];
  }
  function mesh(n, geo, x, y, z, rx, ry, rz) {
    const m = new THREE.Mesh(geo, mat(n));
    m.name = n;
    m.position.set(x, y, z);
    m.rotation.set(rx || 0, ry || 0, rz || 0);
    g.add(m);
    return m;
  }
  function box(n, sx, sy, sz, x, y, z, rx, ry, rz) {
    return mesh(n, new THREE.BoxGeometry(sx, sy, sz), x, y, z, rx, ry, rz);
  }
  function cyl(n, rt, rb, h, seg, x, y, z, rx, ry, rz) {
    return mesh(n, new THREE.CylinderGeometry(rt, rb, h, seg), x, y, z, rx, ry, rz);
  }

  // ---- key dimensions (m) ----
  const FL = 0.25;              // slab top / floor level
  const WT = 3.45;              // top of block walls
  const HX = 6.65;              // wall half-width (outer face)
  const RX = 6.9;               // roof / veranda half-width
  const HZ = 4.25;              // main block half-depth (outer face)
  const VF = 7.38;              // veranda roof front edge
  const RISE = 1.0;             // gable rise
  const TAN = RISE / HZ;
  const TH = Math.atan(TAN);
  const CTH = Math.cos(TH);

  // ---- slab (building + veranda floor) ----
  box('concrete', 2 * RX, FL, 7.4 + HZ, 0, FL / 2, (7.4 - HZ) / 2);

  // ---- front wall with door notch and two window holes ----
  const DL = -0.66, DR = 0.49, DT = 2.71;
  const WB = 1.40, WTOP = 2.76;
  const wins = [[-4.94, -1.74], [1.48, 4.70]];
  const fs = new THREE.Shape();
  fs.moveTo(-HX, FL);
  fs.lineTo(DL, FL);
  fs.lineTo(DL, DT);
  fs.lineTo(DR, DT);
  fs.lineTo(DR, FL);
  fs.lineTo(HX, FL);
  fs.lineTo(HX, WT);
  fs.lineTo(-HX, WT);
  for (const [a, b] of wins) {
    const h = new THREE.Shape();
    h.moveTo(a, WB);
    h.lineTo(b, WB);
    h.lineTo(b, WTOP);
    h.lineTo(a, WTOP);
    fs.holes.push(h);
  }
  mesh('rendered_block', new THREE.ExtrudeGeometry(fs, { depth: 0.2, bevelEnabled: false }), 0, 0, HZ - 0.2);

  // windows: glass set in, aluminium frames, mullion, concrete sill
  for (const [a, b] of wins) {
    const cx = (a + b) / 2, w = b - a, cy = (WB + WTOP) / 2, h = WTOP - WB;
    box('glass', w, h, 0.02, cx, cy, HZ - 0.12);
    box('aluminium', w, 0.06, 0.1, cx, WTOP - 0.03, HZ - 0.1);
    box('aluminium', w, 0.06, 0.1, cx, WB + 0.03, HZ - 0.1);
    box('aluminium', 0.06, h, 0.1, a + 0.03, cy, HZ - 0.1);
    box('aluminium', 0.06, h, 0.1, b - 0.03, cy, HZ - 0.1);
    box('aluminium', 0.05, h, 0.08, cx, cy, HZ - 0.1);
    box('concrete', w + 0.16, 0.06, 0.16, cx, WB - 0.03, HZ + 0.02);
  }

  // door: frame + screen door
  const dcx = (DL + DR) / 2, dw = DR - DL, dh = DT - FL;
  box('aluminium', 0.06, dh, 0.12, DL + 0.03, FL + dh / 2, HZ - 0.08);
  box('aluminium', 0.06, dh, 0.12, DR - 0.03, FL + dh / 2, HZ - 0.08);
  box('aluminium', dw, 0.06, 0.12, dcx, DT - 0.03, HZ - 0.08);
  const sx0 = DL + 0.06, sx1 = DR - 0.06, sy0 = FL + 0.01, sy1 = DT - 0.06;
  const sw = sx1 - sx0, sh = sy1 - sy0, scy = (sy0 + sy1) / 2;
  box('flyscreen_mesh', sw, sh, 0.02, dcx, scy, HZ - 0.07);
  box('aluminium', 0.05, sh, 0.04, sx0 + 0.025, scy, HZ - 0.05);
  box('aluminium', 0.05, sh, 0.04, sx1 - 0.025, scy, HZ - 0.05);
  box('aluminium', sw, 0.05, 0.04, dcx, sy1 - 0.025, HZ - 0.05);
  box('aluminium', sw, 0.08, 0.04, dcx, sy0 + 0.04, HZ - 0.05);
  box('aluminium', sw, 0.05, 0.04, dcx, 1.2, HZ - 0.05);
  box('aluminium', 0.03, 0.14, 0.05, sx1 - 0.1, 1.12, HZ - 0.01);

  // ---- back wall, side walls, gable cladding ----
  box('rendered_block', 2 * HX, WT - FL, 0.2, 0, (FL + WT) / 2, -HZ + 0.1);
  const gs = new THREE.Shape();
  gs.moveTo(-HZ, WT);
  gs.lineTo(HZ, WT);
  gs.lineTo(0, WT + RISE);
  for (const s of [-1, 1]) {
    box('rendered_block', 0.2, WT - FL, 2 * HZ - 0.4, s * (HX - 0.1), (FL + WT) / 2, 0);
    const gg = new THREE.ExtrudeGeometry(gs, { depth: 0.06, bevelEnabled: false });
    mesh('galvanised_iron', gg, s > 0 ? HX - 0.01 : -HX - 0.05, 0, 0, 0, Math.PI / 2, 0);
  }

  // ---- main gable roof ----
  const RT = 0.05;
  {
    const span = HZ + 0.3, cz = -span / 2;
    const yu = WT + (HZ - span / 2) * TAN;
    box('rusty_corrugated_iron', 2 * RX, RT, span / CTH, 0, yu + RT / 2 / CTH, cz, -TH, 0, 0);
  }
  {
    const span = HZ + 0.15, cz = span / 2;
    const yu = WT + (HZ - span / 2) * TAN;
    box('rusty_corrugated_iron', 2 * RX, RT, span / CTH, 0, yu + RT / 2 / CTH, cz, TH, 0, 0);
  }
  box('rusty_corrugated_iron', 2 * RX, 0.05, 0.42, 0, WT + RISE + 0.07, 0);  // ridge cap
  box('galvanised_iron', 2 * RX, 0.12, 0.12, 0, 3.32, -HZ - 0.37);            // back gutter

  // ---- veranda roof (skillion) and steel frame ----
  const VU0 = 3.35, VU1 = 3.12;
  const vdz = VF - HZ, vdy = VU0 - VU1;
  const PHI = Math.atan(vdy / vdz);
  const vlen = Math.hypot(vdz, vdy);
  const vcz = (HZ + VF) / 2, vcy = (VU0 + VU1) / 2;
  box('rusty_corrugated_iron', 2 * RX, RT, vlen, 0, vcy + RT / 2 / Math.cos(PHI), vcz, PHI, 0, 0);

  // fascia sign board
  box('painted_sheet_metal', 2 * RX, 0.6, 0.05, 0, 3.18, VF + 0.005);
  // front beam behind the sign
  box('blue_grey_steel', 2 * RX - 0.2, 0.15, 0.1, 0, 2.97, 7.28);
  // side beams following the roof
  for (const s of [-1, 1]) {
    box('blue_grey_steel', 0.08, 0.2, vlen - 0.05, s * 6.8, vcy - 0.1, vcz - 0.02, PHI, 0, 0);
  }
  // rafters under veranda roof
  for (const x of [-4.8, -2.82, -0.1, 3.04, 4.9]) {
    box('blue_grey_steel', 0.06, 0.1, vlen - 0.1, x, vcy - 0.05, vcz - 0.05, PHI, 0, 0);
  }
  // posts
  for (const x of [-6.75, -2.82, 3.04, 6.75]) {
    box('blue_grey_steel', 0.11, 2.9 - FL, 0.11, x, (FL + 2.9) / 2, 7.25);
  }

  // ---- bench under right window ----
  const BX = 3.26, BLN = 3.1;
  box('timber', BLN, 0.06, 0.42, BX, 0.70, 4.62);
  box('timber', BLN, 0.12, 0.04, BX, 0.93, 4.43, -0.12, 0, 0);
  box('timber', BLN, 0.12, 0.04, BX, 1.13, 4.41, -0.12, 0, 0);
  for (const dx of [-1.4, 0, 1.4]) {
    box('timber', 0.07, 0.42, 0.07, BX + dx, FL + 0.21, 4.78);
    box('timber', 0.07, 0.97, 0.07, BX + dx, FL + 0.485, 4.45);
  }
  box('timber', 2.8, 0.06, 0.05, BX, 0.42, 4.62);

  // ---- roof turbine vent and flue pipe ----
  cyl('galvanised_iron', 0.13, 0.15, 0.22, 12, 0, 4.6, 0);
  const head = mesh('galvanised_iron', new THREE.SphereGeometry(0.29, 16, 10), 0, 4.82, 0);
  head.scale.y = 0.72;
  cyl('galvanised_iron', 0.05, 0.05, 0.05, 8, 0, 5.03, 0);
  cyl('galvanised_iron', 0.06, 0.06, 0.88, 10, 4.7, 4.58, 1.2);
  cyl('galvanised_iron', 0.085, 0.085, 0.06, 10, 4.7, 5.03, 1.2);

  // ---- air conditioners and vent grille ----
  box('white_sheet_metal', 0.3, 0.65, 1.0, HX + 0.15, 2.78, 0.43);          // +x side wall
  for (const dz of [-0.35, 0.35]) {
    box('galvanised_iron', 0.04, 0.44, 0.04, HX + 0.13, 2.27, 0.43 + dz, 0, 0, -0.64);
  }
  box('white_sheet_metal', 1.0, 0.62, 0.32, -2.84, 2.56, -HZ - 0.16);       // back wall
  box('white_sheet_metal', 0.45, 0.55, 0.04, 0.37, 2.57, -HZ - 0.02);       // louvre

  // ---- cool room at back, +x end ----
  const CRX = 4.45, CRZ = -HZ - 0.6;
  box('white_coolroom_panel', 4.0, 2.8, 1.2, CRX, 1.4, CRZ);
  box('white_coolroom_panel', 4.1, 0.06, 1.28, CRX, 2.83, CRZ - 0.04);
  box('white_coolroom_panel', 1.8, 2.35, 0.05, 3.4, 1.325, -HZ - 1.225);
  box('galvanised_iron', 0.42, 0.07, 0.06, 4.0, 1.5, -HZ - 1.27);
  box('galvanised_iron', 0.22, 0.1, 0.04, 2.62, 0.6, -HZ - 1.27);
  box('galvanised_iron', 0.22, 0.1, 0.04, 2.62, 2.05, -HZ - 1.27);

  // ---- water tank on timber stand, back -x end ----
  const TX = -5.4, TZ = -5.85;
  box('timber', 2.0, 0.1, 2.0, TX, 1.4, TZ);
  for (const s of [-1, 1]) {
    box('timber', 2.0, 0.12, 0.1, TX, 1.29, TZ + s * 0.85);
    for (const t of [-1, 1]) {
      box('timber', 0.12, 1.35, 0.12, TX + s * 0.85, 0.675, TZ + t * 0.85);
    }
  }
  const BRL = Math.hypot(1.7, 1.15), BRA = Math.atan2(1.15, 1.7);
  for (const s of [-1, 1]) {
    for (const d of [-1, 1]) {
      box('timber', BRL, 0.08, 0.04, TX, 0.7, TZ + s * 0.92, 0, 0, d * BRA);
      box('timber', 0.04, 0.08, BRL, TX + s * 0.92, 0.7, TZ, d * BRA, 0, 0);
    }
  }
  cyl('galvanised_iron', 0.95, 0.95, 1.5, 32, TX, 2.2, TZ);
  mesh('galvanised_iron', new THREE.ConeGeometry(0.97, 0.15, 32), TX, 3.025, TZ);
  cyl('galvanised_iron', 0.12, 0.12, 0.08, 12, -4.85, 3.02, -5.5);

  // downpipe from back gutter into tank
  const dp = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.85, 3.28, -4.62),
    new THREE.Vector3(-4.85, 3.2, -4.74),
    new THREE.Vector3(-4.85, 3.19, -5.0),
    new THREE.Vector3(-4.85, 3.19, -5.34),
    new THREE.Vector3(-4.85, 3.12, -5.49),
    new THREE.Vector3(-4.85, 3.0, -5.51)
  ], false, 'centripetal');
  mesh('pvc_pipe', new THREE.TubeGeometry(dp, 32, 0.045, 8, false), 0, 0, 0);

  return root;
}
