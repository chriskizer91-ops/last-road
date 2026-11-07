function build(THREE) {
  const root = new THREE.Group();
  root.name = 'drill_camp';

  const COL = {
    earth: 0x9c5e3c,
    gravel: 0x857b6f,
    rusty_iron: 0x96532f,
    paint_yellow: 0xc99a2e,
    dark_steel: 0x403b37,
    steel_grey: 0x78736c,
    corrugated_iron: 0xa48c76,
    container_steel: 0xa65c38,
    paint_white: 0xd6cfc0,
    paint_cream: 0xcfc0a6,
    canvas: 0xc4ae88,
    plastic_white: 0xc4c3bc,
    galvanised_steel: 0x8c8a85,
    steel_cable: 0x4a4744,
    glass: 0xe4e0cc,
    timber: 0x7a6248,
    concrete: 0x9a948a
  };
  const mats = {};
  function M(n) {
    if (!mats[n]) mats[n] = new THREE.MeshStandardMaterial({ color: COL[n] });
    return mats[n];
  }
  function mesh(geo, n) {
    const m = new THREE.Mesh(geo, M(n));
    m.name = n;
    root.add(m);
    return m;
  }
  // box with its bottom at y
  function box(w, h, d, x, y, z, n) {
    const m = mesh(new THREE.BoxGeometry(w, h, d), n);
    m.position.set(x, y + h / 2, z);
    return m;
  }
  // vertical cylinder with its bottom at y
  function cyl(rt, rb, h, x, y, z, n, seg) {
    const m = mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 12), n);
    m.position.set(x, y + h / 2, z);
    return m;
  }
  const UP = new THREE.Vector3(0, 1, 0);
  // member between two points: square section t, or round radius t with 'round' segments
  function beam(a, b, t, n, round) {
    const va = new THREE.Vector3(a[0], a[1], a[2]);
    const vb = new THREE.Vector3(b[0], b[1], b[2]);
    const dir = new THREE.Vector3().subVectors(vb, va);
    const len = dir.length();
    const geo = round ? new THREE.CylinderGeometry(t, t, len, round) : new THREE.BoxGeometry(t, len, t);
    const m = mesh(geo, n);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, dir.normalize());
    return m;
  }
  // railing along a polyline of [x,z] points
  function railing(pts, y, h, n, closed) {
    const cnt = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < cnt; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const k = Math.max(1, Math.round(L / 2.5));
      for (let j = 0; j < k; j++) {
        const t = j / k;
        box(0.12, h, 0.12, p[0] + (q[0] - p[0]) * t, y, p[1] + (q[1] - p[1]) * t, n);
      }
      beam([p[0], y + h, p[1]], [q[0], y + h, q[1]], 0.1, n);
      beam([p[0], y + h * 0.5, p[1]], [q[0], y + h * 0.5, q[1]], 0.07, n);
    }
    if (!closed) {
      const q = pts[pts.length - 1];
      box(0.12, h, 0.12, q[0], y, q[1], n);
    }
  }
  // triangular prism: cross-section right triangle (run outward local +x, height h), length along local z, centred
  function wedge(len, h, run, n) {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(run, 0); s.lineTo(0, h); s.lineTo(0, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
    g.translate(0, 0, -len / 2);
    return mesh(g, n);
  }
  // trapezoid earth wall (bund), bottom at y
  function trap(len, bw, tw, h, x, y, z, alongX, n) {
    const s = new THREE.Shape();
    s.moveTo(-bw / 2, 0); s.lineTo(bw / 2, 0); s.lineTo(tw / 2, h); s.lineTo(-tw / 2, h); s.lineTo(-bw / 2, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
    g.translate(0, 0, -len / 2);
    const m = mesh(g, n);
    if (alongX) m.rotation.y = Math.PI / 2;
    m.position.set(x, y, z);
    return m;
  }

  // ================= PAD (raised gravel platform on the levee) =================
  const H = 4.5, PA = 67, PB = 33.5, S = 5, RC = 3;
  const shp = new THREE.Shape();
  shp.moveTo(-PA + RC, -PB);
  shp.lineTo(PA - RC, -PB);
  shp.absarc(PA - RC, -PB + RC, RC, -Math.PI / 2, 0, false);
  shp.lineTo(PA, PB - RC);
  shp.absarc(PA - RC, PB - RC, RC, 0, Math.PI / 2, false);
  shp.lineTo(-PA + RC, PB);
  shp.absarc(-PA + RC, PB - RC, RC, Math.PI / 2, Math.PI, false);
  shp.lineTo(-PA, -PB + RC);
  shp.absarc(-PA + RC, -PB + RC, RC, Math.PI, Math.PI * 1.5, false);
  const core = mesh(new THREE.ExtrudeGeometry(shp, { depth: H, bevelEnabled: false, curveSegments: 4 }), 'gravel');
  core.rotation.x = -Math.PI / 2;

  let w;
  w = wedge(2 * (PA - RC), H, S, 'earth'); w.rotation.y = -Math.PI / 2; w.position.set(0, 0, PB);
  w = wedge(2 * (PA - RC), H, S, 'earth'); w.rotation.y = Math.PI / 2; w.position.set(0, 0, -PB);
  w = wedge(2 * (PB - RC), H, S, 'earth'); w.position.set(PA, 0, 0);
  w = wedge(2 * (PB - RC), H, S, 'earth'); w.rotation.y = Math.PI; w.position.set(-PA, 0, 0);
  [[PA - RC, PB - RC, 0], [PA - RC, -(PB - RC), Math.PI / 2],
   [-(PA - RC), -(PB - RC), Math.PI], [-(PA - RC), PB - RC, Math.PI * 1.5]].forEach(([cx, cz, t0]) => {
    const c = mesh(new THREE.CylinderGeometry(RC, RC + S, H, 8, 1, true, t0, Math.PI / 2), 'earth');
    c.position.set(cx, H / 2, cz);
  });

  // access ramp at the front
  const RX = 16.4, RW = 10.2, RL = 7.8;
  w = wedge(RW, H, RL, 'gravel'); w.rotation.y = -Math.PI / 2; w.position.set(RX, 0, PB);

  // perimeter fence along the top edge (gap at the ramp)
  const FX = PA - 0.6, FZ = PB - 0.6, FC = 3, FH = 1.8;
  const fenceSegs = [
    [[-FX + FC, FZ], [RX - RW / 2 - 0.3, FZ]],
    [[RX + RW / 2 + 0.3, FZ], [FX - FC, FZ]],
    [[FX - FC, FZ], [FX, FZ - FC]],
    [[FX, FZ - FC], [FX, -FZ + FC]],
    [[FX, -FZ + FC], [FX - FC, -FZ]],
    [[FX - FC, -FZ], [-FX + FC, -FZ]],
    [[-FX + FC, -FZ], [-FX, -FZ + FC]],
    [[-FX, -FZ + FC], [-FX, FZ - FC]],
    [[-FX, FZ - FC], [-FX + FC, FZ]]
  ];
  for (const [p, q] of fenceSegs) {
    const dx = q[0] - p[0], dz = q[1] - p[1];
    const len = Math.hypot(dx, dz);
    const k = Math.max(1, Math.ceil(len / 8));
    for (let i = 0; i < k; i++) {
      const t = i / k;
      box(0.15, FH, 0.15, p[0] + dx * t, H, p[1] + dz * t, 'galvanised_steel');
    }
    for (const hy of [0.9, 1.7]) beam([p[0], H + hy, p[1]], [q[0], H + hy, q[1]], 0.06, 'galvanised_steel');
  }
  box(0.15, FH, 0.15, fenceSegs[0][1][0], H, FZ, 'galvanised_steel');

  // ================= DRILL RIG =================
  const DX = -30, DZ = -9.8;
  const FL = H + 14.5; // drill floor top
  // substructure skids and legs
  box(1.4, 1.0, 18.6, DX - 7.6, H, DZ, 'dark_steel');
  box(1.4, 1.0, 18.6, DX + 7.6, H, DZ, 'dark_steel');
  for (const lx of [-7.6, 7.6]) for (const lz of [-8.6, 0, 8.6]) {
    box(1.0, FL - 0.8 - (H + 1.0), 1.0, DX + lx, H + 1.0, DZ + lz, 'dark_steel');
  }
  const yA = H + 1.0, yC = FL - 0.8, yB = (yA + yC) / 2;
  const tiers = [[yA, yB], [yB, yC]];
  for (const lx of [-7.6, 7.6]) {
    for (const [z0, z1] of [[-8.6, 0], [0, 8.6]]) for (const [y0, y1] of tiers) {
      beam([DX + lx, y0, DZ + z0], [DX + lx, y1, DZ + z1], 0.35, 'dark_steel');
      beam([DX + lx, y0, DZ + z1], [DX + lx, y1, DZ + z0], 0.35, 'dark_steel');
    }
    beam([DX + lx, yB, DZ - 8.6], [DX + lx, yB, DZ + 8.6], 0.5, 'dark_steel');
  }
  for (const lz of [-8.6, 8.6]) {
    for (const [y0, y1] of tiers) {
      beam([DX - 7.6, y0, DZ + lz], [DX + 7.6, y1, DZ + lz], 0.35, 'dark_steel');
      beam([DX + 7.6, y0, DZ + lz], [DX - 7.6, y1, DZ + lz], 0.35, 'dark_steel');
    }
    beam([DX - 7.6, yB, DZ + lz], [DX + 7.6, yB, DZ + lz], 0.5, 'dark_steel');
  }
  cyl(1.3, 1.3, 7, DX, H, DZ, 'dark_steel', 12); // BOP / wellhead
  // drill floor
  box(17.2, 0.8, 18.6, DX, FL - 0.8, DZ, 'dark_steel');
  railing([[DX + 2.6, DZ + 9.2], [DX - 8.5, DZ + 9.2], [DX - 8.5, DZ - 9.2],
           [DX + 8.5, DZ - 9.2], [DX + 8.5, DZ + 9.2], [DX + 5.4, DZ + 9.2]], FL, 1.5, 'paint_yellow', false);
  box(5, 2.5, 2.5, DX, FL, DZ - 5, 'dark_steel'); // drawworks
  cyl(1.2, 1.2, 0.6, DX, FL, DZ, 'dark_steel', 12); // rotary table

  // derrick tower
  const TB = FL, TT = H + 55, WB = 7.0, WT = 3.2;
  const wAt = (y) => WB + (WT - WB) * (y - TB) / (TT - TB);
  const sg = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
  for (const [sx, sz] of sg) {
    beam([DX + sx * WB, TB, DZ + sz * WB], [DX + sx * WT, TT, DZ + sz * WT], 0.7, 'rusty_iron');
  }
  const NP = 8;
  for (let i = 0; i <= NP; i++) {
    const y = TB + (TT - TB) * i / NP, wi = wAt(y);
    for (let k = 0; k < 4; k++) {
      const [ax, az] = sg[k], [bx, bz] = sg[(k + 1) % 4];
      beam([DX + ax * wi, y, DZ + az * wi], [DX + bx * wi, y, DZ + bz * wi], 0.35, 'rusty_iron');
      if (i < NP) {
        const y2 = TB + (TT - TB) * (i + 1) / NP, w2 = wAt(y2);
        beam([DX + ax * wi, y, DZ + az * wi], [DX + bx * w2, y2, DZ + bz * w2], 0.22, 'rusty_iron');
        beam([DX + bx * wi, y, DZ + bz * wi], [DX + ax * w2, y2, DZ + az * w2], 0.22, 'rusty_iron');
      }
    }
  }
  // platforms (monkey board and upper) with yellow railings
  for (const ph of [36.5, 45.8]) {
    const y = H + ph, wi = wAt(y), o = wi + 1.3;
    box(2 * o, 0.25, 1.3, DX, y - 0.25, DZ + wi + 0.65, 'dark_steel');
    box(2 * o, 0.25, 1.3, DX, y - 0.25, DZ - wi - 0.65, 'dark_steel');
    box(1.3, 0.25, 2 * wi, DX + wi + 0.65, y - 0.25, DZ, 'dark_steel');
    box(1.3, 0.25, 2 * wi, DX - wi - 0.65, y - 0.25, DZ, 'dark_steel');
    railing([[DX - o, DZ - o], [DX + o, DZ - o], [DX + o, DZ + o], [DX - o, DZ + o]], y, 1.4, 'paint_yellow', true);
  }
  // crown
  box(8.4, 0.6, 8.4, DX, TT, DZ, 'rusty_iron');
  railing([[DX - 4.1, DZ - 4.1], [DX + 4.1, DZ - 4.1], [DX + 4.1, DZ + 4.1], [DX - 4.1, DZ + 4.1]],
          TT + 0.6, 1.4, 'paint_yellow', true);
  box(4.5, 2.2, 3, DX, TT + 0.6, DZ, 'dark_steel');
  beam([DX - 1.8, TT + 0.6, DZ - 1.5], [DX, H + 60, DZ - 1.5], 0.25, 'rusty_iron');
  beam([DX + 1.8, TT + 0.6, DZ - 1.5], [DX, H + 60, DZ - 1.5], 0.25, 'rusty_iron');
  // travelling block and drill line
  box(1.6, 3.2, 1.6, DX, H + 26, DZ, 'dark_steel');
  beam([DX, H + 29.2, DZ], [DX, TT, DZ], 0.08, 'steel_cable', 6);
  // guy wires
  const gy = H + 45, gw = wAt(gy);
  for (const [sx, sz] of sg) {
    beam([DX + sx * 24, H, DZ + sz * 20], [DX + sx * gw, gy, DZ + sz * gw], 0.06, 'steel_cable', 4);
  }
  // stair from drill floor down to the pad (toward the front)
  const sx0 = DX + 4, sw = 2.4, zTop = DZ + 9.3, zBot = zTop + 14;
  for (const ox of [-sw / 2, sw / 2]) {
    beam([sx0 + ox, H, zBot], [sx0 + ox, FL - 0.3, zTop], 0.3, 'paint_yellow');
    beam([sx0 + ox, H + 1.4, zBot], [sx0 + ox, FL + 1.4, zTop], 0.08, 'paint_yellow');
    box(0.1, 1.4, 0.1, sx0 + ox, H, zBot, 'paint_yellow');
  }
  const NS = 20;
  for (let i = 1; i < NS; i++) {
    const t = i / NS;
    box(sw, 0.15, 0.75, sx0, FL - (FL - H) * t - 0.15, zTop + 14 * t, 'dark_steel');
  }
  // mud pumps / tanks beside the substructure, and totes
  box(6, 4.5, 9, -17.6, H, -7.5, 'steel_grey');
  box(2.4, 2.6, 2.4, -19.0, H, -0.8, 'plastic_white');
  box(2.4, 2.6, 2.4, -16.2, H, -0.8, 'plastic_white');

  // ================= GEN HOUSE =================
  box(16.6, 8.5, 15.1, -50.2, H, -8.05, 'corrugated_iron');
  box(17.2, 0.4, 15.7, -50.2, H + 8.5, -8.05, 'corrugated_iron');
  box(4.0, 5.5, 0.1, -55.5, H, -0.45, 'dark_steel'); // door
  cyl(0.75, 0.75, 8.1, -53, H + 8.9, -12, 'rusty_iron', 12); // exhaust stack
  cyl(1.0, 0.8, 0.5, -53, H + 17.0, -12, 'rusty_iron', 12);
  box(9.5, 4, 5, -47.25, H, 2, 'dark_steel'); // engine skid in front
  box(3, 1.2, 4, -45, H + 4, 2, 'dark_steel');
  // IBC totes at back left
  box(4.3, 3.2, 4.5, -56.75, H, -22.75, 'plastic_white');
  box(4.3, 3.2, 4.5, -51.85, H, -22.75, 'plastic_white');

  // ================= PIPE RACKS =================
  function pipeRack(x0, x1) {
    const L = x1 - x0, cx = (x0 + x1) / 2;
    const n = Math.max(2, Math.round(L / 6) + 1);
    for (let i = 0; i < n; i++) {
      const x = x0 + 0.5 + (L - 1) * i / (n - 1);
      box(0.6, 1.2, 11.2, x, H, 21.7, 'dark_steel');
      for (const z of [16.3, 21.0, 27.1]) box(0.25, 2.8, 0.25, x, H + 1.2, z, 'dark_steel');
    }
    for (const [z0, c0] of [[17.0, 4], [22.1, 6]]) {
      for (let layer = 0; layer < 2; layer++) {
        const c = c0 - layer;
        for (let j = 0; j < c; j++) {
          const p = mesh(new THREE.CylinderGeometry(0.4, 0.4, L + 1.0, 8), 'rusty_iron');
          p.rotation.z = Math.PI / 2;
          p.position.set(cx, H + 1.6 + layer * 0.7, z0 + 0.85 * j + layer * 0.425);
        }
      }
    }
  }
  pipeRack(-48.7, -25.2);
  pipeRack(-24.0, -6.6);

  // ================= CONTAINERS =================
  for (const cx of [-5.7, 2.2, 10.1]) {
    box(7, 6, 16.7, cx, H, -11.75, 'container_steel');
    box(6.5, 5.6, 0.1, cx, H + 0.2, -3.35, 'container_steel');
    for (const ox of [-2.4, -0.9, 0.9, 2.4]) cyl(0.07, 0.07, 5.4, cx + ox, H + 0.3, -3.2, 'dark_steel', 6);
  }

  // ================= YELLOW GENERATOR + PALLETS =================
  box(7.2, 0.4, 5.1, 27, H, 0.95, 'dark_steel');
  box(6.9, 3.6, 4.9, 27, H + 0.4, 0.95, 'paint_yellow');
  box(2.2, 2.4, 0.08, 25.0, H + 1.0, 3.44, 'dark_steel');
  cyl(0.25, 0.25, 1.2, 29.5, H + 4.0, -0.5, 'dark_steel', 8);
  box(2.6, 2.6, 2.8, 25.9, H, -7.75, 'plastic_white');
  box(2.6, 2.6, 2.8, 28.7, H, -7.75, 'plastic_white');

  // ================= FLOODLIGHT POLE =================
  box(1.4, 0.4, 1.4, 33, H, 6, 'concrete');
  cyl(0.25, 0.4, 27.1, 33, H + 0.4, 6, 'steel_grey', 10);
  box(5.2, 0.25, 0.3, 33, H + 25.6, 6.2, 'steel_grey');
  box(5.2, 0.25, 0.3, 33, H + 27.1, 6.2, 'steel_grey');
  for (const ox of [-1.2, 1.2]) for (const oy of [25.7, 27.2]) {
    box(1.8, 1.25, 0.7, 33 + ox, H + oy, 6.2, 'steel_grey');
    box(1.5, 1.0, 0.06, 33 + ox, H + oy + 0.12, 6.58, 'glass');
  }

  // ================= COMMS MAST =================
  const MX = 19, MZ = -21, MH = 28;
  box(3.4, 0.4, 3.4, MX, H, MZ, 'concrete');
  const ang = [Math.PI / 2, Math.PI / 2 + 2 * Math.PI / 3, Math.PI / 2 + 4 * Math.PI / 3];
  const rAt = (h) => 1.4 - 0.8 * h / MH;
  const mp = (k, h) => [MX + Math.cos(ang[k]) * rAt(h), H + 0.4 + h, MZ + Math.sin(ang[k]) * rAt(h)];
  for (let k = 0; k < 3; k++) beam(mp(k, 0), mp(k, MH), 0.18, 'galvanised_steel', 6);
  const NL = 8;
  for (let i = 1; i <= NL; i++) {
    const h0 = MH * (i - 1) / NL, h1 = MH * i / NL;
    for (let k = 0; k < 3; k++) {
      beam(mp(k, h1), mp((k + 1) % 3, h1), 0.08, 'galvanised_steel');
      beam(mp(k, h0), mp((k + 1) % 3, h1), 0.06, 'galvanised_steel');
    }
  }
  cyl(0.08, 0.12, 4, MX, H + 0.4 + MH, MZ, 'galvanised_steel', 6);
  for (let k = 0; k < 3; k++) {
    const a = ang[k] + Math.PI / 3;
    const pnl = box(0.5, 2.2, 0.25, MX + Math.cos(a) * 0.9, H + 23.5, MZ + Math.sin(a) * 0.9, 'galvanised_steel');
    pnl.rotation.y = Math.PI / 2 - a;
    beam([MX + Math.cos(ang[k]) * 12, H, MZ + Math.sin(ang[k]) * 12], mp(k, 20), 0.04, 'steel_cable', 4);
  }

  // ================= TANK BUND + TANKS =================
  trap(27.1, 3, 1, 1.8, 51.05, H, 0, true, 'earth');
  trap(27.1, 3, 1, 1.8, 51.05, H, -28, true, 'earth');
  trap(25, 3, 1, 1.8, 39, H, -14, false, 'earth');
  trap(25, 3, 1, 1.8, 63.1, H, -14, false, 'earth');
  function tank(cz) {
    const R = 3.3, L = 14.7, cx = 52.75, cy = H + 3.9, dome = 1.15, Ls = L - 2 * dome;
    const body = mesh(new THREE.CylinderGeometry(R, R, Ls, 28, 1, true), 'paint_cream');
    body.rotation.z = Math.PI / 2;
    body.position.set(cx, cy, cz);
    for (const sgn of [-1, 1]) {
      const d = mesh(new THREE.SphereGeometry(R, 28, 7, 0, Math.PI * 2, 0, Math.PI / 2), 'paint_cream');
      d.scale.set(1, dome / R, 1);
      d.rotation.z = -sgn * Math.PI / 2;
      d.position.set(cx + sgn * Ls / 2, cy, cz);
      box(0.8, 1.6, 4.6, cx + sgn * 4.5, H, cz, 'dark_steel'); // saddles
    }
    cyl(0.6, 0.6, 0.6, cx - 3, cy + R - 0.1, cz, 'paint_cream', 12); // manway
    beam([42.5, H + 1.2, cz], [45.6, H + 1.2, cz], 0.25, 'rusty_iron', 8);
  }
  tank(-20.4);
  tank(-9.8);
  beam([42.5, H + 1.2, -24], [42.5, H + 1.2, -1], 0.3, 'rusty_iron', 8);
  box(0.6, 1.2, 0.6, 42.5, H, -23, 'dark_steel');
  box(0.6, 1.2, 0.6, 42.5, H, -3, 'dark_steel');

  // ================= SITE OFFICE TRAILER =================
  const TX = 30.4, TLn = 30, TZ0 = 10.3, TZ1 = 19.5, TD = TZ1 - TZ0, TZC = (TZ0 + TZ1) / 2;
  for (const ox of [-13, -6.5, 0, 6.5, 13]) for (const oz of [-3, 3]) {
    box(0.9, 1.2, 0.9, TX + ox, H, TZC + oz, 'dark_steel');
  }
  box(TLn, 6, TD, TX, H + 1.2, TZC, 'paint_white');
  box(TLn + 0.6, 0.35, TD + 0.6, TX, H + 7.2, TZC, 'paint_white');
  box(2.0, 3.6, 0.1, TX, H + 1.3, TZ1 + 0.05, 'steel_grey'); // door
  box(8, 1.2, 3, TX, H, TZ1 + 1.5, 'timber'); // porch deck
  box(3, 0.8, 1, TX, H, TZ1 + 3.5, 'timber');
  box(3, 0.4, 1, TX, H, TZ1 + 4.5, 'timber');
  const awn = mesh(new THREE.BoxGeometry(14.8, 0.12, 10.1), 'canvas');
  awn.rotation.x = Math.atan2(1.4, 10);
  awn.position.set(30.2, H + 6.2, 24.5);
  for (const px of [23.2, 30.2, 37.2]) cyl(0.12, 0.12, 5.45, px, H, 29.3, 'steel_grey', 8);
  box(14.8, 0.25, 0.25, 30.2, H + 5.2, 29.3, 'steel_grey');

  // ================= LOOSE CRATES =================
  box(3, 2.5, 3.3, 4.1, H, 26.2, 'steel_grey');
  box(3.9, 2.5, 3.9, 62, H, 26, 'steel_grey');

  return root;
}
