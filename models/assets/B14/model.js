function build(THREE) {
  const g = new THREE.Group();
  g.name = 'iron_house';

  const COL = {
    galvanised_iron: 0x9a9184,
    rusty_iron: 0x8c6a52,
    concrete: 0xa59e93,
    painted_steel: 0xb5ab9b,
    aluminium: 0x8f8b82,
    glass: 0x3a3d3e,
    shade_cloth: 0x585651,
    paint_cream: 0xc4bba9,
    tank_steel: 0x878a74,
    timber: 0xa07c56,
    gutter_iron: 0xa38c58
  };
  const mats = {};
  function mat(n) {
    if (!mats[n]) mats[n] = new THREE.MeshStandardMaterial({ color: COL[n] });
    return mats[n];
  }
  function add(geo, n, x, y, z, rx, ry, rz) {
    const m = new THREE.Mesh(geo, mat(n));
    m.name = n;
    m.position.set(x, y, z);
    m.rotation.set(rx || 0, ry || 0, rz || 0);
    g.add(m);
    return m;
  }
  function box(n, x0, x1, y0, y1, z0, z1) {
    return add(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), n,
      (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  }
  function cylY(n, r, x, y0, y1, z, seg) {
    return add(new THREE.CylinderGeometry(r, r, y1 - y0, seg || 10), n, x, (y0 + y1) / 2, z);
  }
  const UP = new THREE.Vector3(0, 1, 0);
  function pipe(n, a, b, r, seg) {
    const A = new THREE.Vector3(a[0], a[1], a[2]);
    const B = new THREE.Vector3(b[0], b[1], b[2]);
    const d = new THREE.Vector3().subVectors(B, A);
    const len = d.length();
    const m = add(new THREE.CylinderGeometry(r, r, len, seg || 10), n,
      (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
    m.quaternion.setFromUnitVectors(UP, d.normalize());
    return m;
  }
  function shapeFrom(pts, holes) {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    for (const h of holes) {
      const p = new THREE.Path();
      p.moveTo(h[0], h[2]); p.lineTo(h[1], h[2]); p.lineTo(h[1], h[3]); p.lineTo(h[0], h[3]);
      p.closePath();
      s.holes.push(p);
    }
    return s;
  }
  // wall facing z: shape in (x,y), spans z from zBack to zBack + t
  function wallZ(n, pts, holes, zBack, t) {
    const geo = new THREE.ExtrudeGeometry(shapeFrom(pts, holes),
      { depth: t, amount: t, bevelEnabled: false, curveSegments: 1 });
    return add(geo, n, 0, 0, zBack);
  }
  // wall facing x: shape in (z,y), spans x from xMax - t to xMax
  function wallX(n, pts, holes, xMax, t) {
    const geo = new THREE.ExtrudeGeometry(shapeFrom(pts, holes),
      { depth: t, amount: t, bevelEnabled: false, curveSegments: 1 });
    return add(geo, n, xMax, 0, 0, 0, -Math.PI / 2, 0);
  }
  function windowZ(cx, w, y0, y1, zOut, dir, sill, mull) {
    const h = y1 - y0, fz = zOut - dir * 0.02, ym = (y0 + y1) / 2;
    add(new THREE.BoxGeometry(w, 0.05, 0.08), 'aluminium', cx, y1 - 0.025, fz);
    add(new THREE.BoxGeometry(w, 0.05, 0.08), 'aluminium', cx, y0 + 0.025, fz);
    add(new THREE.BoxGeometry(0.05, h - 0.1, 0.08), 'aluminium', cx - w / 2 + 0.025, ym, fz);
    add(new THREE.BoxGeometry(0.05, h - 0.1, 0.08), 'aluminium', cx + w / 2 - 0.025, ym, fz);
    if (mull) add(new THREE.BoxGeometry(0.04, h - 0.1, 0.05), 'aluminium', cx, ym, zOut - dir * 0.03);
    add(new THREE.BoxGeometry(w - 0.1, h - 0.1, 0.01), 'glass', cx, ym, zOut - dir * 0.035);
    if (sill) add(new THREE.BoxGeometry(w + 0.08, 0.04, 0.08), 'aluminium', cx, y0 - 0.02, zOut + dir * 0.03);
  }
  function windowX(cz, w, y0, y1, xOut, dir) {
    const h = y1 - y0, fx = xOut - dir * 0.02, ym = (y0 + y1) / 2;
    add(new THREE.BoxGeometry(0.08, 0.05, w), 'aluminium', fx, y1 - 0.025, cz);
    add(new THREE.BoxGeometry(0.08, 0.05, w), 'aluminium', fx, y0 + 0.025, cz);
    add(new THREE.BoxGeometry(0.08, h - 0.1, 0.05), 'aluminium', fx, ym, cz - w / 2 + 0.025);
    add(new THREE.BoxGeometry(0.08, h - 0.1, 0.05), 'aluminium', fx, ym, cz + w / 2 - 0.025);
    add(new THREE.BoxGeometry(0.05, h - 0.1, 0.04), 'aluminium', xOut - dir * 0.03, ym, cz);
    add(new THREE.BoxGeometry(0.01, h - 0.1, w - 0.1), 'glass', xOut - dir * 0.035, ym, cz);
    add(new THREE.BoxGeometry(0.08, 0.04, w + 0.08), 'aluminium', xOut + dir * 0.03, y0 - 0.02, cz);
  }

  // ---------- key dimensions ----------
  const T = 0.06;                 // wall thickness
  const XL = -6.18, XR = 5.08;    // main walls outer faces (x)
  const ZB = -3.6, ZF = 1.5;      // back wall outer face, front wall outer face (z)
  const S = 0.75 / 7.4;           // skillion slope (falls to front)
  const yTop = (z) => 2.825 - z * S;      // main roof top surface
  const under = (z) => yTop(z) - 0.042;   // main roof underside
  const LS = 0.5 / 2.31;          // lean-to slope (falls to +x)
  const yL = (x) => 2.38 - (x - 5.08) * LS;

  // ---------- slabs and step ----------
  box('concrete', -6.3, 7.3, 0, 0.15, -3.65, 3.65);
  box('concrete', -7.39, -6.3, 0, 0.15, -1.55, -0.25);
  box('concrete', 2.045, 2.995, 0, 0.25, -3.82, -3.6);

  // ---------- main walls ----------
  wallZ('galvanised_iron',
    [[XL, 0.1], [XR, 0.1], [XR, 3.14], [XL, 3.14]],
    [[2.095, 2.945, 0.25, 2.30], [-4.125, -2.075, 1.28, 2.27]],
    ZB, T);
  wallZ('galvanised_iron',
    [[XL, 0.1], [XR, 0.1], [XR, 2.63], [XL, 2.63]],
    [[-4.69, -2.69, 1.32, 2.26], [-1.155, -0.205, 1.32, 2.26],
     [-0.155, 0.795, 0.15, 2.26], [2.19, 4.19, 1.32, 2.26]],
    ZF - T, T);
  const sidePts = [[ZB, 0.1], [ZF, 0.1], [ZF, under(ZF)], [ZB, under(ZB)]];
  wallX('galvanised_iron', sidePts, [], XL + T, T);
  wallX('galvanised_iron', sidePts, [[-2.15, -0.35, 1.3, 2.25]], XR, T);

  // ---------- windows and doors ----------
  windowZ(-3.69, 2.0, 1.32, 2.26, ZF, 1, true, true);
  windowZ(-0.68, 0.95, 1.32, 2.26, ZF, 1, true, false);
  windowZ(0.32, 0.95, 0.15, 2.26, ZF, 1, false, false);       // glazed front door
  box('aluminium', -0.105, 0.745, 1.0, 1.05, 1.46, 1.51);      // door mid rail
  windowZ(3.19, 2.0, 1.32, 2.26, ZF, 1, true, true);
  windowZ(-3.10, 2.05, 1.28, 2.27, ZB, -1, true, true);       // back window
  windowX(-1.25, 1.8, 1.3, 2.25, XR, 1);                      // +x wall, inside lean-to

  // back door, set in
  box('paint_cream', 2.095, 2.945, 0.25, 2.30, -3.57, -3.53);
  box('paint_cream', 2.035, 2.095, 0.25, 2.36, -3.63, -3.6);
  box('paint_cream', 2.945, 3.005, 0.25, 2.36, -3.63, -3.6);
  box('paint_cream', 2.035, 3.005, 2.30, 2.36, -3.63, -3.6);
  add(new THREE.CylinderGeometry(0.022, 0.022, 0.07, 8), 'aluminium', 2.2, 1.05, -3.605, Math.PI / 2, 0, 0);

  // ---------- main roof ----------
  const th = Math.atan2(0.75, 7.4);
  const L = Math.sqrt(7.4 * 7.4 + 0.75 * 0.75);
  add(new THREE.BoxGeometry(11.6, 0.04, L), 'rusty_iron', -0.47, 2.825 - 0.02 / Math.cos(th), 0, th, 0, 0);
  box('gutter_iron', -6.27, 5.33, 2.31, 2.42, 3.68, 3.82);

  // ---------- veranda ----------
  const postX = [-5.75, -1.73, 1.33, 5.05];
  for (const x of postX) cylY('painted_steel', 0.05, x, 0.15, 2.33, 3.45, 10);
  box('painted_steel', -6.22, 5.3, 2.33, 2.43, 3.41, 3.49);
  for (const x of [-6.12, -5.75, -1.73, 1.33, 5.05]) {
    add(new THREE.BoxGeometry(0.05, 0.07, 2.0), 'painted_steel', x, 2.495, 2.495, th, 0, 0);
  }
  // shade cloth panels
  box('shade_cloth', -5.68, -1.80, 0.22, 1.40, 3.444, 3.456);
  box('shade_cloth', -1.66, 1.26, 0.22, 1.40, 3.444, 3.456);
  box('shade_cloth', 1.40, 4.98, 0.22, 1.40, 3.444, 3.456);
  box('shade_cloth', -5.756, -5.744, 0.22, 1.40, 1.52, 3.39);
  box('shade_cloth', 5.044, 5.056, 0.22, 1.40, 1.52, 3.39);

  // ---------- woodshed lean-to (+x) ----------
  const ph = Math.atan(LS);
  const Lt = Math.sqrt(2.31 * 2.31 + 0.5 * 0.5);
  add(new THREE.BoxGeometry(Lt, 0.04, 7.3), 'rusty_iron', 6.235, 2.13 - 0.02 / Math.cos(ph), 0, 0, 0, -ph);
  box('painted_steel', 5.08, 5.16, 2.24, 2.32, -3.6, 3.6);     // ledger on wall
  box('painted_steel', 7.06, 7.14, 1.79, 1.89, -3.6, 3.55);    // outer beam
  for (const z of [3.45, 0.0, -3.52]) cylY('painted_steel', 0.05, 7.1, 0.15, 1.79, z, 10);
  for (const z of [-3.5, -1.2, 1.2, 3.45]) {
    add(new THREE.BoxGeometry(1.9 / Math.cos(ph), 0.06, 0.05), 'painted_steel',
      6.11, yL(6.11) - 0.072, z, 0, 0, -ph);
  }
  // lean-to back wall with high vent opening
  wallZ('galvanised_iron',
    [[5.08, 0.1], [7.13, 0.1], [7.13, yL(7.13) - 0.045], [5.08, yL(5.08) - 0.045]],
    [[5.25, 6.95, 1.23, 1.72]],
    -3.6, 0.03);
  box('painted_steel', 5.78, 5.82, 1.23, 1.72, -3.6, -3.57);
  box('painted_steel', 6.38, 6.42, 1.23, 1.72, -3.6, -3.57);

  // firewood stack (logs run front-to-back), fixed seeded variation
  let seed = 1414;
  function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
  const logGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
  for (let row = 0; row < 6; row++) {
    const y = 0.15 + 0.09 + row * 0.158;
    const xs = 5.22 + row * 0.03 + (row % 2) * 0.0925;
    const xe = 6.98 - row * 0.12;
    for (let x = xs + 0.09; x <= xe - 0.09 + 1e-6; x += 0.185) {
      const r = 0.078 + rnd() * 0.02;
      const len = 0.8 + rnd() * 0.12;
      const zc = 2.95 + (rnd() - 0.5) * 0.08;
      const m = add(logGeo, 'timber', x + (rnd() - 0.5) * 0.015, y, zc, Math.PI / 2, 0, 0);
      m.scale.set(r, len, r);
    }
  }

  // ---------- rainwater tank (-x) ----------
  const TX = -6.8, TZ = -0.9, TR = 0.58;
  add(new THREE.CylinderGeometry(TR, TR, 1.57, 28), 'tank_steel', TX, 0.935, TZ);
  add(new THREE.ConeGeometry(TR + 0.02, 0.1, 28), 'tank_steel', TX, 1.77, TZ);
  add(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 12), 'tank_steel', -6.55, 1.795, -0.85);
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 8), 'painted_steel', TX, 0.3, TZ + TR + 0.05, Math.PI / 2, 0, 0);

  // downpipe: front gutter -> along -x side -> out and down into tank
  const pr = 0.045;
  const P0 = [-6.25, 2.31, 3.74], P1 = [-6.25, 2.24, 3.74], P2 = [-6.25, 2.24, -0.85],
        P3 = [-6.55, 2.24, -0.85], P4 = [-6.55, 1.80, -0.85];
  pipe('painted_steel', P0, P1, pr, 10);
  pipe('painted_steel', P1, P2, pr, 10);
  pipe('painted_steel', P2, P3, pr, 10);
  pipe('painted_steel', P3, P4, pr, 10);
  const jGeo = new THREE.SphereGeometry(0.05, 10, 6);
  for (const p of [P1, P2, P3]) add(jGeo, 'painted_steel', p[0], p[1], p[2]);
  for (const z of [0.2, 1.2]) box('painted_steel', -6.25, -6.18, 2.21, 2.27, z - 0.02, z + 0.02);

  return g;
}
