function build(THREE) {
  const root = new THREE.Group();
  root.name = 'water_tower';

  const COLORS = { paint_green: 0x8b917a, rusty_iron: 0x76573f, concrete: 0xc8c3b8 };
  const mats = {};
  const M = (n) => mats[n] || (mats[n] = new THREE.MeshStandardMaterial({ color: COLORS[n] }));
  const UP = new THREE.Vector3(0, 1, 0);

  function add(geo, name, x, y, z, parent) {
    const m = new THREE.Mesh(geo, M(name));
    m.name = name;
    m.position.set(x, y, z);
    (parent || root).add(m);
    return m;
  }
  function span(p1, p2, name, makeGeo, parent) {
    const a = new THREE.Vector3(p1[0], p1[1], p1[2]);
    const b = new THREE.Vector3(p2[0], p2[1], p2[2]);
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    const m = add(makeGeo(len), name, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, parent);
    m.quaternion.setFromUnitVectors(UP, d.normalize());
    return m;
  }
  const box = (p1, p2, w, dp, name, parent) =>
    span(p1, p2, name, (L) => new THREE.BoxGeometry(w, L, dp), parent);
  const rod = (p1, p2, r, seg, name, parent) =>
    span(p1, p2, name, (L) => new THREE.CylinderGeometry(r, r, L, seg), parent);

  // ---------------- tank ----------------
  const TANK_R = 2.12, TANK_BOT = 6.55, TANK_TOP = 9.63, ROOF_H = 0.37, ROOF_R = 2.2;
  add(new THREE.CylinderGeometry(TANK_R, TANK_R, TANK_TOP - TANK_BOT, 32), 'paint_green',
      0, (TANK_TOP + TANK_BOT) / 2, 0);
  add(new THREE.CylinderGeometry(2.16, 2.16, 0.07, 32), 'paint_green', 0, TANK_TOP - 0.02, 0);
  add(new THREE.ConeGeometry(ROOF_R, ROOF_H, 32), 'paint_green', 0, TANK_TOP + ROOF_H / 2, 0);
  // curved bottom bowl
  const prof = [[0, 5.74], [0.45, 5.78], [0.85, 5.9], [1.2, 6.06], [1.48, 6.24],
                [1.68, 6.4], [1.85, 6.5], [2.1, 6.56]].map((p) => new THREE.Vector2(p[0], p[1]));
  add(new THREE.LatheGeometry(prof, 24), 'paint_green', 0, 0, 0);
  // roof vent
  add(new THREE.CylinderGeometry(0.11, 0.12, 0.16, 12), 'paint_green', 0, 10.04, 0);
  add(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 12), 'paint_green', 0, 10.13, 0);
  add(new THREE.ConeGeometry(0.15, 0.05, 12), 'paint_green', 0, 10.175, 0);

  // roof hatch (front-right on the cone), tilted to the roof slope
  const hx = 0.62, hz = 1.2, hr = Math.hypot(hx, hz);
  const slope = Math.atan(ROOF_H / ROOF_R);
  const hatch = new THREE.Group();
  hatch.position.set(hx, TANK_TOP + ROOF_H - ROOF_H * (hr / ROOF_R), hz);
  hatch.quaternion.setFromUnitVectors(UP, new THREE.Vector3(
    (hx / hr) * Math.sin(slope), Math.cos(slope), (hz / hr) * Math.sin(slope)));
  root.add(hatch);
  add(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 16), 'paint_green', 0, 0.05, 0, hatch);
  add(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 16), 'paint_green', 0, 0.15, 0, hatch);
  add(new THREE.BoxGeometry(0.2, 0.04, 0.04), 'rusty_iron', 0, 0.19, 0, hatch);
  const gStart = 288 * Math.PI / 180;
  const guard = add(new THREE.TorusGeometry(0.45, 0.018, 4, 18, 1.5 * Math.PI), 'rusty_iron', 0, 0.28, 0, hatch);
  guard.rotation.set(Math.PI / 2, 0, gStart);
  for (const deg of [300, 63, 185]) {
    const a = deg * Math.PI / 180;
    add(new THREE.CylinderGeometry(0.018, 0.018, 0.28, 5), 'rusty_iron',
        0.45 * Math.cos(a), 0.14, 0.45 * Math.sin(a), hatch);
  }

  // ---------------- balcony ----------------
  const DECK = 6.62, RAIL_TOP = 7.28, RR = 2.46;
  add(new THREE.CylinderGeometry(2.5, 2.5, 0.1, 40), 'rusty_iron', 0, DECK - 0.05, 0);
  const girder = add(new THREE.TorusGeometry(2.25, 0.08, 6, 40), 'paint_green', 0, 6.44, 0);
  girder.rotation.x = Math.PI / 2;
  const g0 = 34 * Math.PI / 180, g1 = 54 * Math.PI / 180;   // gap in railing for the ladder
  const arc = 2 * Math.PI - (g1 - g0);
  [[RAIL_TOP, 0.03], [6.95, 0.02]].forEach(([h, t]) => {
    const r = add(new THREE.TorusGeometry(RR, t, 5, 72, arc), 'rusty_iron', 0, h, 0);
    r.rotation.set(Math.PI / 2, 0, g1);
  });
  const postAngles = [];
  for (let k = 0; k < 24; k++) {
    const a = k * Math.PI / 12;
    if (a > g0 + 0.02 && a < g1 - 0.02) continue;
    postAngles.push(a);
  }
  postAngles.push(g0, g1);
  const postGeo = new THREE.CylinderGeometry(0.025, 0.025, RAIL_TOP - DECK, 6);
  for (const a of postAngles) {
    add(postGeo, 'rusty_iron', RR * Math.cos(a), (RAIL_TOP + DECK) / 2, RR * Math.sin(a));
  }

  // ---------------- legs, footings, bracing ----------------
  const aOf = (h) => 2.19 - 0.0997 * (h - 0.5);
  const P = (sx, sz, h) => [sx * aOf(h), h, sz * aOf(h)];
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [sx, sz] of corners) {
    add(new THREE.BoxGeometry(0.78, 0.58, 0.78), 'concrete', sx * 2.25, 0.29, sz * 2.25);
    add(new THREE.BoxGeometry(0.46, 0.05, 0.46), 'rusty_iron', sx * aOf(0.6), 0.605, sz * aOf(0.6));
    box(P(sx, sz, 0.5), P(sx, sz, 6.52), 0.3, 0.3, 'paint_green');
  }
  for (let i = 0; i < 4; i++) {
    const c1 = corners[i], c2 = corners[(i + 1) % 4];
    box(P(c1[0], c1[1], 5.5), P(c2[0], c2[1], 2.08), 0.09, 0.09, 'paint_green');
    box(P(c2[0], c2[1], 5.5), P(c1[0], c1[1], 2.08), 0.09, 0.09, 'paint_green');
    box(P(c1[0], c1[1], 2.08), P(c2[0], c2[1], 2.08), 0.11, 0.11, 'paint_green');
  }

  // ---------------- central riser pipe ----------------
  add(new THREE.CylinderGeometry(0.19, 0.19, 5.8, 12), 'rusty_iron', 0, 2.9, 0);
  add(new THREE.CylinderGeometry(0.3, 0.3, 0.14, 12), 'rusty_iron', 0, 0.07, 0);
  add(new THREE.CylinderGeometry(0.27, 0.27, 0.12, 12), 'rusty_iron', 0, 1.62, 0);
  add(new THREE.CylinderGeometry(0.27, 0.27, 0.12, 12), 'rusty_iron', 0, 5.55, 0);

  // ---------------- caged ladder (front-right) ----------------
  const LX0 = 1.5, LX1 = 2.02, LXC = (LX0 + LX1) / 2, LZ = 2.4, LTOP = 7.5;
  for (const x of [LX0, LX1]) add(new THREE.BoxGeometry(0.05, LTOP, 0.07), 'rusty_iron', x, LTOP / 2, LZ);
  const rungGeo = new THREE.CylinderGeometry(0.016, 0.016, LX1 - LX0, 6);
  for (let i = 0; i < 24; i++) {
    const r = add(rungGeo, 'rusty_iron', LXC, 0.3 + i * 0.3, LZ);
    r.rotation.z = Math.PI / 2;
  }
  // landing between ladder and deck
  add(new THREE.BoxGeometry(0.62, 0.06, 0.8), 'rusty_iron', LXC, DECK - 0.03, 2.0);
  const gp0 = [RR * Math.cos(g0), RR * Math.sin(g0)], gp1 = [RR * Math.cos(g1), RR * Math.sin(g1)];
  for (const h of [RAIL_TOP, 6.95]) {
    rod([LX1, h, LZ], [gp0[0], h, gp0[1]], 0.02, 6, 'rusty_iron');
    rod([LX0, h, LZ], [gp1[0], h, gp1[1]], 0.02, 6, 'rusty_iron');
  }
  // standoff brackets to the front-right leg
  for (const h of [1.6, 3.6, 5.6]) {
    rod([LX1, h, LZ - 0.03], [aOf(h), h, aOf(h) + 0.15], 0.025, 6, 'rusty_iron');
  }
  // safety cage
  const CR = 0.29, CAGE_BOT = 3.3, CAGE_TOP = 7.44;
  const hoopGeo = new THREE.TorusGeometry(CR, 0.018, 4, 12, Math.PI);
  for (let i = 0; i < 8; i++) {
    const h = Math.min(CAGE_BOT + i * 0.6, CAGE_TOP);
    const hp = add(hoopGeo, 'rusty_iron', LXC, h, LZ);
    hp.rotation.x = Math.PI / 2;
  }
  const barGeo = new THREE.CylinderGeometry(0.015, 0.015, CAGE_TOP - CAGE_BOT, 5);
  for (const a of [Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4]) {
    add(barGeo, 'rusty_iron', LXC + CR * Math.cos(a), (CAGE_BOT + CAGE_TOP) / 2, LZ + CR * Math.sin(a));
  }

  return root;
}
