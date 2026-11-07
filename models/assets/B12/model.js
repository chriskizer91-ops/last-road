function build(THREE) {
  const root = new THREE.Group();
  root.name = 'weatherboard_cottage';
  const g = new THREE.Group();
  g.position.z = -0.48; // centre whole footprint (steps .. tank) on z = 0
  root.add(g);

  const COLORS = {
    painted_weatherboard: 0xc0b193,
    painted_timber: 0xd3c4a1,
    weathered_timber: 0x8e7d66,
    rusty_corrugated_iron: 0x8e7363,
    galvanised_iron: 0x9a9b98,
    brick: 0xa05a45,
    green_painted_iron: 0x7b9270,
    glass: 0x3a3c3e,
    fly_screen: 0x6e6658
  };
  const mats = {};
  function M(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name], roughness: 0.9 });
    return mats[name];
  }
  function V(x, y, z) { return new THREE.Vector3(x, y, z); }
  function box(parent, name, sx, sy, sz, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), M(name));
    m.name = name;
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function post(parent, name, sx, sz, x, z, y0, y1) {
    return box(parent, name, sx, y1 - y0, sz, x, (y0 + y1) / 2, z);
  }
  function beam(parent, name, w, h, a, b) {
    const A = V(a[0], a[1], a[2]), B = V(b[0], b[1], b[2]);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, A.distanceTo(B)), M(name));
    m.name = name;
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.lookAt(B);
    parent.add(m);
    return m;
  }
  function rod(parent, name, r, a, b, seg) {
    const A = V(a[0], a[1], a[2]), B = V(b[0], b[1], b[2]);
    const geo = new THREE.CylinderGeometry(r, r, A.distanceTo(B), seg, 1);
    geo.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(geo, M(name));
    m.name = name;
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.lookAt(B);
    parent.add(m);
    return m;
  }

  // ---------------- main dimensions ----------------
  const WX = 4.5, WZ = 3.81, T = 0.1;          // outer wall faces, wall thickness
  const WALL_Y0 = 0.45, WALL_Y1 = 4.10;        // cladding bottom / top
  const WIN_HW = 0.53, WIN_Y0 = 1.62, WIN_Y1 = 3.05;

  // ---------------- walls with openings ----------------
  function wall(yRot, px, pz, width, holes) {
    const grp = new THREE.Group();
    grp.rotation.y = yRot;
    grp.position.set(px, 0, pz);
    g.add(grp);
    const s = new THREE.Shape();
    s.moveTo(-width / 2, WALL_Y0);
    s.lineTo(width / 2, WALL_Y0);
    s.lineTo(width / 2, WALL_Y1);
    s.lineTo(-width / 2, WALL_Y1);
    for (const h of holes) {
      const p = new THREE.Shape();
      p.moveTo(h[0], h[1]); p.lineTo(h[2], h[1]); p.lineTo(h[2], h[3]); p.lineTo(h[0], h[3]);
      s.holes.push(p);
    }
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false }), M('painted_weatherboard'));
    m.name = 'painted_weatherboard';
    grp.add(m);
    return grp; // local: u along wall, outer face at z = T
  }
  function winHole(u) { return [u - WIN_HW, WIN_Y0, u + WIN_HW, WIN_Y1]; }

  function windowAt(grp, u, proj) {
    const ww = WIN_HW * 2, hh = WIN_Y1 - WIN_Y0, cy = (WIN_Y0 + WIN_Y1) / 2;
    // recessed glass and sashes
    box(grp, 'glass', ww, hh, 0.02, u, cy, 0.04);
    box(grp, 'painted_timber', ww, 0.06, 0.05, u, cy, 0.065);
    box(grp, 'painted_timber', ww, 0.06, 0.05, u, WIN_Y1 - 0.03, 0.06);
    box(grp, 'painted_timber', ww, 0.08, 0.05, u, WIN_Y0 + 0.04, 0.06);
    box(grp, 'painted_timber', 0.05, hh, 0.05, u - WIN_HW + 0.025, cy, 0.06);
    box(grp, 'painted_timber', 0.05, hh, 0.05, u + WIN_HW - 0.025, cy, 0.06);
    // architrave + sill
    const AW = 0.1, AD = 0.03;
    box(grp, 'painted_timber', AW, hh + AW, AD, u - WIN_HW - AW / 2, cy + AW / 2, T + AD / 2);
    box(grp, 'painted_timber', AW, hh + AW, AD, u + WIN_HW + AW / 2, cy + AW / 2, T + AD / 2);
    box(grp, 'painted_timber', ww + 2 * AW, AW, AD, u, WIN_Y1 + AW / 2, T + AD / 2);
    box(grp, 'painted_timber', ww + 2 * AW + 0.08, 0.06, 0.12, u, WIN_Y0 - 0.03, T + 0.05);
    // green iron window hood
    const aw = 1.5, drop = 0.3, top = 3.42;
    const hood = box(grp, 'green_painted_iron', aw, 0.025, Math.hypot(proj, drop), u, top - drop / 2, T + proj / 2);
    hood.rotation.x = Math.atan2(drop, proj);
    for (const sx of [-1, 1]) {
      beam(grp, 'painted_timber', 0.04, 0.05,
        [u + sx * 0.68, 2.86, T + 0.01], [u + sx * 0.68, top - drop + 0.03, T + proj - 0.04]);
    }
  }

  const HOOD_FB = 0.42;   // front/back hoods
  const HOOD_SIDE = 0.22; // side hoods stay inside the eave line

  // front wall (u = world x) with door
  const DX0 = -0.45, DX1 = 0.55, DY0 = 0.68, DY1 = 3.0;
  const fw = wall(0, 0, WZ - T, 2 * WX, [winHole(-2.66), winHole(2.66), [DX0, DY0, DX1, DY1]]);
  windowAt(fw, -2.66, HOOD_FB);
  windowAt(fw, 2.66, HOOD_FB);
  {
    const dw = DX1 - DX0, dh = DY1 - DY0, dcx = (DX0 + DX1) / 2, dcy = (DY0 + DY1) / 2;
    box(fw, 'fly_screen', dw, dh, 0.02, dcx, dcy, 0.05);
    box(fw, 'painted_timber', 0.09, dh, 0.04, DX0 + 0.045, dcy, 0.06);
    box(fw, 'painted_timber', 0.09, dh, 0.04, DX1 - 0.045, dcy, 0.06);
    box(fw, 'painted_timber', dw, 0.1, 0.04, dcx, DY1 - 0.05, 0.06);
    box(fw, 'painted_timber', dw, 0.1, 0.04, dcx, 1.78, 0.06);
    box(fw, 'painted_timber', dw, 0.2, 0.04, dcx, DY0 + 0.1, 0.06);
    box(fw, 'galvanised_iron', 0.03, 0.12, 0.04, DX1 - 0.13, 1.62, 0.09);
    // door architrave
    box(fw, 'painted_timber', 0.09, dh + 0.09, 0.03, DX0 - 0.045, dcy + 0.045, T + 0.015);
    box(fw, 'painted_timber', 0.09, dh + 0.09, 0.03, DX1 + 0.045, dcy + 0.045, T + 0.015);
    box(fw, 'painted_timber', dw + 0.18, 0.09, 0.03, dcx, DY1 + 0.045, T + 0.015);
  }
  // back wall (u = -world x)
  const bw = wall(Math.PI, 0, -(WZ - T), 2 * WX, [winHole(-1.5), winHole(2.85)]);
  windowAt(bw, -1.5, HOOD_FB);
  windowAt(bw, 2.85, HOOD_FB);
  // +x side wall (u = -world z)
  const rw = wall(Math.PI / 2, WX - T, 0, 2 * (WZ - T), [winHole(-1.06)]);
  windowAt(rw, -1.06, HOOD_SIDE);
  // -x side wall (u = +world z)
  const lw = wall(-Math.PI / 2, -(WX - T), 0, 2 * (WZ - T), [winHole(1.06)]);
  windowAt(lw, 1.06, HOOD_SIDE);

  // corner stop boards
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    post(g, 'painted_timber', 0.11, 0.11, sx * (WX - 0.045), sz * (WZ - 0.045), WALL_Y0, WALL_Y1);
  }
  // floor platform
  box(g, 'weathered_timber', 2 * WX - 0.2, 0.2, 2 * WZ - 0.2, 0, 0.55, 0);

  // ---------------- stumps ----------------
  for (let i = 0; i < 9; i++) {
    const z = -3.65 + i * (7.3 / 8);
    for (const x of [-4.38, 4.38]) post(g, 'weathered_timber', 0.18, 0.18, x, z, 0, WALL_Y0);
  }
  for (const x of [-3.3, -2.2, -1.1, 0, 1.1, 2.2, 3.3]) {
    for (const z of [-3.65, 3.65]) post(g, 'weathered_timber', 0.18, 0.18, x, z, 0, WALL_Y0);
  }
  for (const x of [-2.2, 0, 2.2]) for (const z of [-1.8, 0, 1.8]) {
    post(g, 'weathered_timber', 0.18, 0.18, x, z, 0, WALL_Y0);
  }

  // ---------------- main hip roof ----------------
  const W = 4.66, D = 3.96, HE = 4.05, HR = 5.65, R = W - D, RT = 0.05;
  const rise = HR - HE, L = Math.hypot(D, rise), pitch = Math.atan2(rise, D);
  function roofFace(yRot, eaveDist, halfBottom, halfTop) {
    const s = new THREE.Shape();
    s.moveTo(-halfBottom, 0);
    s.lineTo(halfBottom, 0);
    if (halfTop > 0) { s.lineTo(halfTop, L); s.lineTo(-halfTop, L); }
    else { s.lineTo(0, L); }
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: RT, bevelEnabled: false }), M('rusty_corrugated_iron'));
    m.name = 'rusty_corrugated_iron';
    m.rotation.x = pitch - Math.PI / 2;
    m.position.set(0, HE, eaveDist);
    const grp = new THREE.Group();
    grp.rotation.y = yRot;
    grp.add(m);
    g.add(grp);
  }
  roofFace(0, D, W, R);
  roofFace(Math.PI, D, W, R);
  roofFace(Math.PI / 2, W, D, 0);
  roofFace(-Math.PI / 2, W, D, 0);
  // ridge and hip cappings
  rod(g, 'rusty_corrugated_iron', 0.07, [-R - 0.06, HR + 0.05, 0], [R + 0.06, HR + 0.05, 0], 8);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    rod(g, 'rusty_corrugated_iron', 0.055, [sx * W, HE + 0.06, sz * D], [sx * R, HR + 0.05, 0], 8);
  }
  // gutters
  box(g, 'galvanised_iron', 2 * (W + 0.1), 0.12, 0.1, 0, 3.96, D + 0.05);
  box(g, 'galvanised_iron', 2 * (W + 0.1), 0.12, 0.1, 0, 3.96, -(D + 0.05));
  box(g, 'galvanised_iron', 0.1, 0.12, 2 * (D + 0.1), W + 0.05, 3.96, 0);
  box(g, 'galvanised_iron', 0.1, 0.12, 2 * (D + 0.1), -(W + 0.05), 3.96, 0);

  // chimney
  post(g, 'brick', 0.64, 0.68, 0.74, -1.0, 4.6, 6.1);
  box(g, 'brick', 0.74, 0.1, 0.78, 0.74, 6.15, -1.0);

  // ---------------- front verandah ----------------
  const PZ0 = WZ, PZ1 = 5.77, PP = 5.55, PR = 5.94, PD = 0.70;
  box(g, 'weathered_timber', 9.24, 0.05, PZ1 - PZ0, 0, PD - 0.025, (PZ0 + PZ1) / 2);
  box(g, 'weathered_timber', 9.24, 0.2, 0.06, 0, PD - 0.1, PZ1 - 0.03);
  for (const sx of [-1, 1]) box(g, 'weathered_timber', 0.06, 0.15, PZ1 - PZ0, sx * 4.59, PD - 0.125, (PZ0 + PZ1) / 2);
  for (const x of [-4.45, -2.6, -1.27, 1.27, 2.6, 4.45]) post(g, 'weathered_timber', 0.18, 0.18, x, 5.62, 0, PD - 0.2);
  for (const x of [-4.45, -1.27, 1.27, 4.45]) post(g, 'weathered_timber', 0.18, 0.18, x, 4.7, 0, PD - 0.05);
  // posts, brackets, beam
  const postX = [-4.45, -1.27, 1.27, 4.45];
  for (const x of postX) {
    post(g, 'painted_timber', 0.13, 0.13, x, PP, PD, 3.40);
    const sides = x < -4 ? [1] : (x > 4 ? [-1] : [-1, 1]);
    for (const s of sides) {
      beam(g, 'painted_timber', 0.05, 0.05, [x + s * 0.06, 3.08, PP], [x + s * 0.36, 3.41, PP]);
    }
  }
  box(g, 'painted_timber', 9.1, 0.17, 0.12, 0, 3.485, PP);
  box(g, 'painted_timber', 9.0, 0.1, 0.06, 0, 3.75, WZ + 0.03);
  // skillion roof sheet
  const prl = Math.hypot(PR - PZ0, 3.80 - 3.52), pra = Math.atan2(3.80 - 3.52, PR - PZ0);
  const proof = box(g, 'rusty_corrugated_iron', 9.32, 0.04, prl, 0, (3.80 + 3.52) / 2 + 0.02, (PZ0 + PR) / 2);
  proof.rotation.x = pra;
  box(g, 'painted_timber', 9.36, 0.16, 0.03, 0, 3.48, PR + 0.015);
  for (const sx of [-1, 1]) {
    const f = box(g, 'painted_timber', 0.03, 0.16, prl, sx * 4.675, (3.80 + 3.52) / 2 - 0.04, (PZ0 + PR) / 2);
    f.rotation.x = pra;
  }
  // front steps (three open treads)
  for (let k = 0; k < 3; k++) {
    const top = 0.53 - 0.18 * k;
    box(g, 'weathered_timber', 2.48, 0.04, 0.28, 0, top - 0.02, PZ1 + 0.26 * k + 0.13);
  }
  for (const sx of [-1, 1]) {
    beam(g, 'weathered_timber', 0.06, 0.22, [sx * 1.27, 0.58, PZ1 - 0.02], [sx * 1.27, 0.1, 6.52]);
  }

  // ---------------- rain tank on stand (back, +x corner) ----------------
  const TX = 3.88, TZ = -4.85, TR = 0.76, TB = 1.48, TT = 2.98, LO = 0.68, RO = 0.765;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    post(g, 'weathered_timber', 0.12, 0.12, TX + sx * LO, TZ + sz * LO, 0, 1.40);
  }
  box(g, 'weathered_timber', 1.52, 0.08, 1.52, TX, 1.44, TZ);
  for (const s of [-1, 1]) {
    const zf = TZ + s * RO, xf = TX + s * RO;
    box(g, 'weathered_timber', 1.48, 0.08, 0.05, TX, 0.18, zf);
    box(g, 'weathered_timber', 1.48, 0.08, 0.05, TX, 1.32, zf);
    box(g, 'weathered_timber', 0.05, 0.08, 1.48, xf, 0.18, TZ);
    box(g, 'weathered_timber', 0.05, 0.08, 1.48, xf, 1.32, TZ);
    beam(g, 'weathered_timber', 0.04, 0.08, [TX - 0.66, 0.2, zf], [TX + 0.66, 1.3, zf]);
    beam(g, 'weathered_timber', 0.04, 0.08, [TX + 0.66, 0.2, zf], [TX - 0.66, 1.3, zf]);
    beam(g, 'weathered_timber', 0.04, 0.08, [xf, 0.2, TZ - 0.66], [xf, 1.3, TZ + 0.66]);
    beam(g, 'weathered_timber', 0.04, 0.08, [xf, 0.2, TZ + 0.66], [xf, 1.3, TZ - 0.66]);
  }
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(TR, TR, TT - TB, 32, 1), M('galvanised_iron'));
  tank.name = 'galvanised_iron';
  tank.position.set(TX, (TB + TT) / 2, TZ);
  g.add(tank);
  const lid = new THREE.Mesh(new THREE.ConeGeometry(TR + 0.03, 0.14, 32, 1), M('galvanised_iron'));
  lid.name = 'galvanised_iron';
  lid.position.set(TX, TT + 0.07, TZ);
  g.add(lid);
  const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12, 1), M('galvanised_iron'));
  inlet.name = 'galvanised_iron';
  inlet.position.set(4.40, 3.03, -4.42);
  g.add(inlet);
  // downpipe from back gutter into tank
  const curve = new THREE.CatmullRomCurve3([
    V(4.40, 3.92, -4.01), V(4.40, 3.78, -4.10), V(4.40, 3.58, -4.32), V(4.40, 3.36, -4.42), V(4.40, 3.03, -4.42)
  ]);
  const pipe = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.045, 8, false), M('galvanised_iron'));
  pipe.name = 'galvanised_iron';
  g.add(pipe);

  return root;
}
