```json
{"objects": [{"name": "bore_windmill", "size_m": [7.5, 8.5, 4.5],
  "views": [
    {"label": "Front", "box": [57, 12, 471, 479], "cam": [0, 0, 1], "up": [0, 1, 0]},
    {"label": "Side", "box": [611, 14, 869, 479], "cam": [-1, 0, 0], "up": [0, 1, 0]},
    {"label": "Back", "box": [1085, 12, 1500, 479], "cam": [0, 0, -1], "up": [0, 1, 0]},
    {"label": "Top", "box": [54, 617, 530, 870], "cam": [0, 1, 0], "up": [0, 0, -1]}
  ]}],
 "notes": "The scale bar is about 55 px per metre. The sheet shows an old galvanised lattice bore windmill: an 18-blade rotor about 3.4 m across, its hub about 6.8 m up, and a pump rod down the tower to the bore. A pipe runs from the pump to a 2.5 m corrugated tank on a timber stand, and on to a 2.8 m concrete trough. The views disagree about the tail vane: Back and Top draw it pointing sideways (+x), flat to the rotor. I modelled it the way Front and Side show it, at right angles to the rotor and pointing +z, with the rotor behind the tower at -z. Side is taken as the -x side (tower in front of the tank, trough toward the front). The tank's front-back position is a compromise between the Top and Side views."}
```

```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'bore_windmill';

  const mats = {
    galvanized_steel: new THREE.MeshStandardMaterial({ color: 0x9c988f, roughness: 0.75, metalness: 0.35 }),
    galvanized_sheet: new THREE.MeshStandardMaterial({ color: 0xa7a299, roughness: 0.7, metalness: 0.35 }),
    rusty_iron: new THREE.MeshStandardMaterial({ color: 0x7a6b5c, roughness: 0.85, metalness: 0.25 }),
    grey_iron: new THREE.MeshStandardMaterial({ color: 0x8a857d, roughness: 0.8, metalness: 0.3 }),
    corrugated_iron: new THREE.MeshStandardMaterial({ color: 0x958779, roughness: 0.8, metalness: 0.25 }),
    timber: new THREE.MeshStandardMaterial({ color: 0x8e8576, roughness: 0.95, metalness: 0.0 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xc4beb1, roughness: 0.95, metalness: 0.0 })
  };

  function add(geo, name, parent) {
    const m = new THREE.Mesh(geo, mats[name]);
    m.name = name;
    (parent || root).add(m);
    return m;
  }
  function box(w, h, d, x, y, z, name, parent) {
    const m = add(new THREE.BoxGeometry(w, h, d), name, parent);
    m.position.set(x, y, z);
    return m;
  }
  const Y = new THREE.Vector3(0, 1, 0);
  function len3(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); }
  function place(m, a, b) {
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    m.quaternion.setFromUnitVectors(Y, d);
  }
  function rod(a, b, r, name, segs, parent) {
    const m = add(new THREE.CylinderGeometry(r, r, len3(a, b), segs || 8), name, parent);
    place(m, a, b);
    return m;
  }
  function bar(a, b, w, t, name, parent) {
    const m = add(new THREE.BoxGeometry(w, len3(a, b), t), name, parent);
    place(m, a, b);
    return m;
  }
  function ball(p, r, name) {
    const m = add(new THREE.SphereGeometry(r, 8, 6), name);
    m.position.set(p[0], p[1], p[2]);
    return m;
  }

  // ---------------- Tower ----------------
  const TX = -2.05, TZ = -0.85;
  const FOOT = 1.15, TOPH = 0.25, Y0 = 0.4, Y1 = 5.85;
  function lp(sx, sz, y) {
    const h = FOOT + (y - Y0) / (Y1 - Y0) * (TOPH - FOOT);
    return [TX + sx * h, y, TZ + sz * h];
  }
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

  // concrete footing pads
  for (const c of corners) box(0.5, 0.4, 0.5, TX + c[0] * FOOT, 0.2, TZ + c[1] * FOOT, 'concrete');
  // legs
  for (const c of corners) rod(lp(c[0], c[1], 0.3), lp(c[0], c[1], Y1 + 0.04), 0.05, 'galvanized_steel', 8);
  // horizontal girts
  const levels = [0.55, 1.5, 3.1, 4.5, Y1];
  for (let li = 0; li < levels.length; li++) {
    const y = levels[li];
    const r = (li >= 3) ? 0.045 : 0.032;
    for (let c = 0; c < 4; c++) {
      const a = corners[c], b = corners[(c + 1) % 4];
      rod(lp(a[0], a[1], y), lp(b[0], b[1], y), r, 'galvanized_steel', 6);
    }
  }
  // X bracing on all four faces
  for (let li = 0; li < levels.length - 1; li++) {
    const ya = levels[li], yb = levels[li + 1];
    for (let c = 0; c < 4; c++) {
      const a = corners[c], b = corners[(c + 1) % 4];
      rod(lp(a[0], a[1], ya), lp(b[0], b[1], yb), 0.022, 'galvanized_steel', 6);
      rod(lp(b[0], b[1], ya), lp(a[0], a[1], yb), 0.022, 'galvanized_steel', 6);
    }
  }
  // top plate and mast
  box(0.7, 0.08, 0.7, TX, Y1 + 0.06, TZ, 'galvanized_steel');
  rod([TX, Y1 + 0.1, TZ], [TX, 6.62, TZ], 0.065, 'grey_iron', 10);

  // ---------------- Head / gearbox ----------------
  const HY = 6.8;
  box(0.3, 0.3, 0.5, TX, HY - 0.08, TZ, 'rusty_iron');
  rod([TX, HY + 0.08, TZ + 0.25], [TX, HY + 0.08, TZ - 0.3], 0.17, 'rusty_iron', 12);
  rod([TX, HY, TZ - 0.3], [TX, HY, TZ - 0.8], 0.045, 'grey_iron', 8);

  // ---------------- Rotor (faces -z, tail downwind to +z) ----------------
  const rotor = new THREE.Group();
  rotor.position.set(TX, HY, TZ - 0.8);
  root.add(rotor);
  rod([0, 0, 0.12], [0, 0, -0.12], 0.14, 'rusty_iron', 12, rotor);
  const nose = add(new THREE.ConeGeometry(0.09, 0.14, 10), 'rusty_iron', rotor);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0, -0.19);
  add(new THREE.TorusGeometry(0.6, 0.022, 6, 40), 'galvanized_steel', rotor);
  add(new THREE.TorusGeometry(1.2, 0.018, 6, 48), 'galvanized_steel', rotor);

  const bs = new THREE.Shape();
  bs.moveTo(0.55, -0.055);
  bs.lineTo(1.66, -0.2);
  bs.lineTo(1.69, 0.0);
  bs.lineTo(1.66, 0.2);
  bs.lineTo(0.55, 0.055);
  bs.closePath();
  const bladeGeo = new THREE.ExtrudeGeometry(bs, { depth: 0.012, bevelEnabled: false });
  bladeGeo.translate(0, 0, -0.006);
  const NB = 18;
  for (let i = 0; i < NB; i++) {
    let ang = i * Math.PI * 2 / NB + 0.09;
    let pitch = 0.55;
    if (i === 15) { ang += 0.12; pitch = 1.05; } // one bent sail
    rod([0.13 * Math.cos(ang), 0.13 * Math.sin(ang), 0], [1.3 * Math.cos(ang), 1.3 * Math.sin(ang), 0], 0.014, 'galvanized_steel', 6, rotor);
    const g = new THREE.Group();
    g.rotation.z = ang;
    rotor.add(g);
    const m = add(bladeGeo, 'galvanized_sheet', g);
    m.rotation.x = pitch;
  }

  // ---------------- Tail boom and vane ----------------
  rod([TX, HY + 0.05, TZ + 0.25], [TX, HY + 0.05, TZ + 3.0], 0.035, 'galvanized_steel', 8);
  rod([TX, 7.02, TZ + 0.15], [TX, 7.12, TZ + 1.35], 0.022, 'galvanized_steel', 6);
  const vs = new THREE.Shape();
  vs.moveTo(0, 6.58);
  vs.lineTo(1.76, 6.31);
  vs.lineTo(1.84, 7.55);
  vs.lineTo(0, 7.13);
  vs.closePath();
  const vane = add(new THREE.ExtrudeGeometry(vs, { depth: 0.02, bevelEnabled: false }), 'galvanized_sheet');
  vane.rotation.y = -Math.PI / 2;
  vane.position.set(TX + 0.01, 0, TZ + 1.3);

  // ---------------- Pump and bore head ----------------
  rod([TX, 0, TZ], [TX, 0.14, TZ], 0.16, 'rusty_iron', 12);
  rod([TX, 0.1, TZ], [TX, 1.65, TZ], 0.075, 'grey_iron', 12);
  box(0.2, 0.15, 0.2, TX, 1.65, TZ, 'rusty_iron');
  rod([TX, 1.7, TZ], [TX, Y1 + 0.1, TZ], 0.022, 'grey_iron', 6);

  // delivery pipe: pump -> riser -> over tank top
  const PR = 0.045;
  const dp = [[TX, 0.72, TZ], [-0.49, 0.72, TZ], [-0.49, 2.82, TZ], [-0.04, 2.82, TZ], [-0.04, 2.55, TZ]];
  for (let i = 0; i < dp.length - 1; i++) rod(dp[i], dp[i + 1], PR, 'grey_iron', 10);
  for (let i = 0; i < dp.length - 1; i++) ball(dp[i], PR * 1.35, 'grey_iron');

  // ---------------- Tank on timber stand ----------------
  const KX = 0.95, KZ = -0.55, SH = 1.15;
  for (const sx of [-1, 0, 1]) {
    for (const sz of [-1, 0, 1]) {
      if (sx === 0 && sz === 0) continue;
      box(0.12, 0.8, 0.12, KX + sx * SH, 0.4, KZ + sz * SH, 'timber');
    }
  }
  box(2.45, 0.13, 0.14, KX, 0.865, KZ + SH, 'timber');
  box(2.45, 0.13, 0.14, KX, 0.865, KZ - SH, 'timber');
  box(0.14, 0.13, 2.45, KX + SH, 0.865, KZ, 'timber');
  box(0.14, 0.13, 2.45, KX - SH, 0.865, KZ, 'timber');
  box(2.5, 0.05, 2.5, KX, 0.955, KZ, 'timber');
  // stand cross braces
  for (const side of [-1, 1]) {
    const zf = KZ + side * (SH + 0.08);
    const xf = KX + side * (SH + 0.08);
    for (const p of [[-1, 0], [0, 1]]) {
      const a0 = KX + p[0] * SH, a1 = KX + p[1] * SH;
      bar([a0, 0.12, zf], [a1, 0.76, zf], 0.08, 0.04, 'timber');
      bar([a1, 0.12, zf], [a0, 0.76, zf], 0.08, 0.04, 'timber');
      const b0 = KZ + p[0] * SH, b1 = KZ + p[1] * SH;
      bar([xf, 0.12, b0], [xf, 0.76, b1], 0.04, 0.08, 'timber');
      bar([xf, 0.12, b1], [xf, 0.76, b0], 0.04, 0.08, 'timber');
    }
  }
  // corrugated tank
  const tank = add(new THREE.CylinderGeometry(1.25, 1.25, 1.66, 32), 'corrugated_iron');
  tank.position.set(KX, 0.98 + 0.83, KZ);
  rod([KX + 0.55, 2.62, KZ - 0.65], [KX + 0.55, 2.71, KZ - 0.65], 0.16, 'corrugated_iron', 16);

  // outlet pipe: tank -> trough
  const op = [[0.2, 0.95, 0.3], [0.2, 0.62, 0.3], [0.2, 0.62, 1.72], [1.2, 0.62, 1.72], [1.2, 0.42, 1.72]];
  for (let i = 0; i < op.length - 1; i++) rod(op[i], op[i + 1], 0.035, 'grey_iron', 8);
  for (let i = 1; i < op.length - 1; i++) ball(op[i], 0.048, 'grey_iron');

  // ---------------- Concrete trough ----------------
  const QX = 2.35, QZ = 1.72, QL = 2.78, QD = 1.0, QH = 0.53, QW = 0.12, QF = 0.18;
  const wallH = QH - QF, wallY = (QH + QF) / 2;
  box(QL, QF, QD, QX, QF / 2, QZ, 'concrete');
  box(QL, wallH, QW, QX, wallY, QZ - QD / 2 + QW / 2, 'concrete');
  box(QL, wallH, QW, QX, wallY, QZ + QD / 2 - QW / 2, 'concrete');
  box(QW, wallH, QD - 2 * QW, QX - QL / 2 + QW / 2, wallY, QZ, 'concrete');
  box(QW, wallH, QD - 2 * QW, QX + QL / 2 - QW / 2, wallY, QZ, 'concrete');

  return root;
}
```