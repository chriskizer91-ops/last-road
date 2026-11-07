```json
{"objects": [{"name": "workshop_shed", "size_m": [17.8, 4.63, 6.75],
  "views": [
    {"label": "Front", "box": [38, 28, 1033, 287], "cam": [0, 0, 1], "up": [0, 1, 0]},
    {"label": "Side", "box": [1086, 27, 1500, 287], "cam": [1, 0, 0], "up": [0, 1, 0]},
    {"label": "Back", "box": [38, 341, 807, 531], "cam": [0, 0, -1], "up": [0, 1, 0]},
    {"label": "Top", "box": [928, 345, 1487, 538], "cam": [0, 1, 0], "up": [0, 0, -1]}
  ]}],
 "notes": "Rusty corrugated-iron mono-pitch workshop shed. Using the scale bar (1 m ≈ 56 px), the main shed is 14.4 m wide and 6 m deep between walls. It is 4.6 m high at the front and 3.1 m at the back. It has two open bays (bench, shelves, welder, gas bottles, drums), a roller-door bay, and a 3.4 m open lean-to on +x holding steel tube and wire rolls. Unclear: the side view has its high edge on the left and leaves out the lean-to, so I treated it as the +x side, which makes the outline match. The side view suggests a depth of about 7.4 m and the top view about 6 m, so I used 6.6 m. The props are drawn slightly oversized against the scale bar."}
```

```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'workshop_shed';

  const COLORS = {
    corrugated_iron: 0x8b6a57,
    rusty_iron: 0x7b4a33,
    door_steel: 0x7a6658,
    concrete: 0x6b5a4b,
    timber: 0x7d5e42,
    glass_brown: 0x7b5b3b,
    rusty_tin: 0x8a603f,
    paint_blue: 0x3e5a80,
    paint_red: 0x9b4634,
    paint_green: 0x6e7652,
    paint_grey: 0x6a6c68,
    rusty_steel: 0x82604e,
    steel_grey: 0x5d6266,
    rubber_black: 0x2b2826,
    rubber_yellow: 0xc9a234,
    light_fitting: 0xcfcdc2,
    wire_mesh: 0x8c8d8a,
    rusty_pipe: 0x8f4f30
  };
  const mats = {};
  function M(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name], roughness: 0.85, metalness: 0.15 });
    return mats[name];
  }
  function add(name, geo, x, y, z) {
    const m = new THREE.Mesh(geo, M(name));
    m.name = name;
    m.position.set(x, y, z);
    root.add(m);
    return m;
  }
  function box(name, x0, x1, y0, y1, z0, z1) {
    return add(name, new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  }
  function strutXY(name, x1, y1, x2, y2, z, depth, thick) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    const m = add(name, new THREE.BoxGeometry(len, thick, depth), (x1 + x2) / 2, (y1 + y2) / 2, z);
    m.rotation.z = Math.atan2(dy, dx);
    return m;
  }
  function strutZY(name, z1, y1, z2, y2, x, width, thick) {
    const dz = z2 - z1, dy = y2 - y1, len = Math.hypot(dz, dy);
    const m = add(name, new THREE.BoxGeometry(width, thick, len), x, (y1 + y2) / 2, (z1 + z2) / 2);
    m.rotation.x = -Math.atan2(dy, dz);
    return m;
  }
  function cylY(name, r, h, seg, x, y0, z) {
    return add(name, new THREE.CylinderGeometry(r, r, h, seg), x, y0 + h / 2, z);
  }

  let seed = 1801;
  function rnd() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }

  // ---------------- main dimensions ----------------
  const XL = -8.885, XM = 5.475, XR = 8.885;   // roof left edge, main/lean-to join, lean-to outer edge
  const XWL = XL + 0.1;                        // outer face of -x end wall
  const ZF = 3.0, ZB = -3.0;                   // front / back wall planes
  const RZF = 3.3, RZB = -3.3;                 // roof front / back edges
  const HF = 4.62, HB = 3.12;                  // roof top at front / back edge
  const FL = 0.06;                             // floor slab top
  const K = (HF - HB) / (RZF - RZB);
  const ANG = Math.atan(K);
  const RT = 0.1;
  const roofTop = z => (HF + HB) / 2 + K * z;
  const under = z => roofTop(z) - RT / Math.cos(ANG);

  // ---------------- main roof ----------------
  {
    const L = Math.hypot(RZF - RZB, HF - HB);
    const nY = Math.cos(ANG), nZ = -Math.sin(ANG);
    const m = add('corrugated_iron', new THREE.BoxGeometry(XM - XL, RT, L), (XL + XM) / 2, roofTop(0) - RT / 2 * nY, -RT / 2 * nZ);
    m.rotation.x = -ANG;
  }
  box('rusty_iron', XL, XM, 4.46, 4.63, RZF + 0.02, RZF + 0.05);      // front fascia
  box('rusty_iron', XL, XM, 2.96, 3.08, RZB - 0.12, RZB + 0.02);      // back gutter
  for (let i = 0; i < 18; i++) {                                      // rafter tails under front eave
    const bx = -8.7 + i * (14.0 / 17);
    box('rusty_iron', bx - 0.035, bx + 0.035, under(ZF + 0.04) - 0.14, under(ZF + 0.04), ZF + 0.04, RZF);
  }

  // ---------------- floor ----------------
  box('concrete', XWL + 0.05, XM - 0.05, 0, FL, ZB, ZF + 0.08);

  // ---------------- walls ----------------
  function endWall(xMax, thick) {
    const s = new THREE.Shape();
    s.moveTo(ZB, 0);
    s.lineTo(ZF, 0);
    s.lineTo(ZF, under(ZF));
    s.lineTo(ZB, under(ZB));
    const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
    const m = add('corrugated_iron', g, xMax, 0, 0);
    m.rotation.y = -Math.PI / 2;
    return m;
  }
  endWall(XWL + 0.05, 0.05);   // -x end wall
  endWall(XM, 0.05);           // +x end wall (inside lean-to)
  endWall(1.44, 0.04);         // partition between open bays and roller-door bay
  box('corrugated_iron', XWL, XM, 0, under(ZB), ZB - 0.04, ZB);          // back wall
  box('corrugated_iron', XWL, XM, 3.45, under(ZF), ZF, ZF + 0.04);       // front header band

  // ---------------- frame ----------------
  const FRONT_POSTS = [-8.6, -3.53, 1.42, 5.26];
  for (const px of FRONT_POSTS) box('rusty_iron', px - 0.14, px + 0.14, 0, under(ZF - 0.1), ZF - 0.2, ZF);
  for (const px of [-8.6, -3.53]) box('rusty_iron', px - 0.14, px + 0.14, 0, under(ZB + 0.1), ZB, ZB + 0.18);
  box('rusty_iron', XWL + 0.05, XM - 0.05, 3.3, 3.45, ZF - 0.2, ZF);    // beam over openings
  for (const rx of [-8.55, -6.07, -3.53, -1.05]) {
    strutZY('rusty_iron', ZB + 0.02, under(ZB + 0.02) - 0.1, ZF - 0.02, under(ZF - 0.02) - 0.1, rx, 0.1, 0.2);
  }
  for (const pz of [2.3, 1.0, -0.3, -1.6, -2.7]) {
    box('rusty_iron', XWL + 0.05, 1.4, under(pz + 0.04) - 0.07, under(pz + 0.04), pz - 0.04, pz + 0.04);
  }
  box('rusty_iron', XWL + 0.05, 1.4, 1.26, 1.34, ZB, ZB + 0.05);       // back girts
  box('rusty_iron', XWL + 0.05, 1.4, 2.76, 2.84, ZB, ZB + 0.05);
  strutXY('rusty_iron', -3.3, 1.9, -1.0, 3.0, ZB + 0.07, 0.03, 0.06);  // cross brace bay 2
  strutXY('rusty_iron', -3.3, 3.0, -1.0, 1.9, ZB + 0.07, 0.03, 0.06);
  const knees = [[-8.6, 1], [-3.53, -1], [-3.53, 1], [1.42, -1]];
  for (const [px, d] of knees) strutXY('rusty_iron', px + d * 0.14, 2.72, px + d * 0.8, 3.3, ZF - 0.1, 0.08, 0.08);

  // ---------------- roller door ----------------
  box('door_steel', 1.56, 5.12, FL, 3.4, ZF - 0.27, ZF - 0.21);
  box('rusty_iron', 1.56, 1.64, FL, 3.3, ZF - 0.3, ZF - 0.2);
  box('rusty_iron', 5.04, 5.12, FL, 3.3, ZF - 0.3, ZF - 0.2);
  box('rusty_iron', 1.64, 5.04, FL, FL + 0.08, ZF - 0.21, ZF - 0.18);
  box('steel_grey', 3.28, 3.4, 0.5, 0.56, ZF - 0.18, ZF - 0.15);

  // ---------------- lights ----------------
  for (const lx of [-5.68, -1.0]) {
    box('light_fitting', lx - 0.65, lx + 0.65, 3.08, 3.16, 0.82, 0.98);
    for (const hx of [lx - 0.5, lx + 0.5]) box('steel_grey', hx - 0.01, hx + 0.01, 3.16, under(0.9), 0.89, 0.91);
  }

  // ---------------- shelf filler ----------------
  function fillShelf(x0, x1, y, z0, z1, maxH) {
    let x = x0 + 0.04;
    for (let n = 0; n < 40; n++) {
      const w = 0.1 + rnd() * 0.16;
      if (x + w > x1 - 0.03) break;
      const h = 0.1 + rnd() * (maxH - 0.12);
      const t = rnd();
      const zc = (z0 + z1) / 2 + (rnd() - 0.5) * 0.08;
      if (t < 0.55) {
        add(t < 0.3 ? 'glass_brown' : 'rusty_tin', new THREE.CylinderGeometry(w / 2, w / 2, h, 8), x + w / 2, y + h / 2, zc);
      } else {
        const d = Math.min(0.3, w + 0.05);
        add(t < 0.85 ? 'rusty_tin' : 'paint_green', new THREE.BoxGeometry(w, h, d), x + w / 2, y + h / 2, zc);
      }
      x += w + 0.03 + rnd() * 0.06;
    }
  }

  // ---------------- bay 1: workbench + wall shelves ----------------
  const BX0 = -7.95, BX1 = -3.95, BZ0 = -2.95, BZ1 = -2.1, BH = 1.08;
  box('timber', BX0, BX1, BH - 0.08, BH, BZ0, BZ1);
  for (const lx of [BX0 + 0.07, (BX0 + BX1) / 2, BX1 - 0.07]) {
    for (const lz of [BZ0 + 0.07, BZ1 - 0.07]) box('timber', lx - 0.05, lx + 0.05, FL, BH - 0.08, lz - 0.05, lz + 0.05);
  }
  box('timber', BX0 + 0.02, BX1 - 0.02, 0.28, 0.32, BZ0 + 0.03, BZ1 - 0.03);
  box('timber', BX0, BX1, BH - 0.2, BH - 0.08, BZ1 - 0.03, BZ1);
  fillShelf(BX0 + 0.13, -6.05, 0.32, BZ0 + 0.05, BZ1 - 0.1, 0.4);
  fillShelf(-5.85, BX1 - 0.13, 0.32, BZ0 + 0.05, BZ1 - 0.1, 0.4);
  fillShelf(-5.9, -4.6, BH, -2.5, -2.2, 0.28);
  // vise
  {
    const vx = -7.05, vz = -2.15;
    box('steel_grey', vx - 0.1, vx + 0.1, BH, BH + 0.05, vz - 0.2, vz + 0.02);
    box('steel_grey', vx - 0.08, vx + 0.08, BH + 0.05, BH + 0.2, vz - 0.22, vz + 0.08);
    box('steel_grey', vx - 0.12, vx + 0.12, BH + 0.12, BH + 0.24, vz + 0.06, vz + 0.12);
    const scr = add('steel_grey', new THREE.CylinderGeometry(0.02, 0.02, 0.12, 6), vx, BH + 0.12, vz + 0.17);
    scr.rotation.x = Math.PI / 2;
    const bar = add('steel_grey', new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6), vx, BH + 0.12, vz + 0.22);
    bar.rotation.z = Math.PI / 2;
  }
  const SZ0 = ZB + 0.04, SZ1 = ZB + 0.44;
  {
    const S1X0 = -7.47, S1X1 = -4.53, S1M = -6.0;
    for (const ux of [S1X0, S1M, S1X1]) box('timber', ux - 0.03, ux + 0.03, BH + 0.02, 2.6, SZ0, SZ1);
    for (const sy of [1.62, 2.02, 2.42]) {
      box('timber', S1X0 - 0.03, S1X1 + 0.03, sy - 0.04, sy, SZ0, SZ1);
      fillShelf(S1X0 + 0.03, S1M - 0.03, sy, SZ0, SZ1, sy > 2.3 ? 0.3 : 0.34);
      fillShelf(S1M + 0.03, S1X1 - 0.03, sy, SZ0, SZ1, sy > 2.3 ? 0.3 : 0.34);
    }
  }

  // ---------------- bay 2: shelves, drums, gas, welder, cabinet, hose ----------------
  {
    const S2X0 = -0.95, S2X1 = 1.3, S2M = (S2X0 + S2X1) / 2;
    for (const ux of [S2X0, S2M, S2X1]) box('timber', ux - 0.03, ux + 0.03, FL, 2.6, SZ0, SZ1);
    const levels = [[0.34, 0.45], [1.55, 0.4], [2.0, 0.4], [2.45, 0.3]];
    for (const [sy, mh] of levels) {
      box('timber', S2X0 - 0.03, S2X1 + 0.03, sy - 0.04, sy, SZ0, SZ1);
      fillShelf(S2X0 + 0.03, S2M - 0.03, sy, SZ0, SZ1, mh);
      fillShelf(S2M + 0.03, S2X1 - 0.03, sy, SZ0, SZ1, mh);
    }
  }
  function drum(name, x, z) {
    cylY(name, 0.29, 0.95, 20, x, FL, z);
    for (const hy of [0.33, 0.67]) cylY(name, 0.3, 0.03, 20, x, FL + hy, z);
    cylY('steel_grey', 0.03, 0.02, 8, x + 0.15, FL + 0.95, z);
  }
  drum('paint_red', 0.03, -1.85);
  drum('paint_green', 0.72, -1.7);
  for (const [gx, h] of [[-1.0, 1.55], [-0.66, 1.45]]) {
    cylY('rusty_steel', 0.12, h - 0.12, 14, gx, FL, -2.3);
    add('rusty_steel', new THREE.SphereGeometry(0.12, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), gx, FL + h - 0.12, -2.3);
    cylY('steel_grey', 0.03, 0.1, 8, gx, FL + h - 0.02, -2.3);
  }
  {
    const wx = -1.75, wz = -0.9;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const w = add('rubber_black', new THREE.CylinderGeometry(0.11, 0.11, 0.06, 12), wx + sx * 0.4, FL + 0.11, wz + sz * 0.2);
        w.rotation.z = Math.PI / 2;
      }
    }
    box('rusty_iron', wx - 0.4, wx + 0.4, 0.24, 0.29, wz - 0.28, wz + 0.28);
    box('paint_blue', wx - 0.36, wx + 0.36, 0.29, 1.12, wz - 0.25, wz + 0.25);
    for (let i = 0; i < 3; i++) {
      const k = add('steel_grey', new THREE.CylinderGeometry(0.035, 0.035, 0.04, 8), wx - 0.18 + i * 0.18, 0.95, wz + 0.27);
      k.rotation.x = Math.PI / 2;
    }
    box('rusty_iron', wx - 0.36, wx - 0.32, 1.12, 1.3, wz - 0.25, wz - 0.21);
    box('rusty_iron', wx + 0.32, wx + 0.36, 1.12, 1.3, wz - 0.25, wz - 0.21);
    box('rusty_iron', wx - 0.36, wx + 0.36, 1.27, 1.31, wz - 0.25, wz - 0.21);
    const helm = add('steel_grey', new THREE.SphereGeometry(0.14, 12, 8), wx - 0.05, 1.28, wz + 0.05);
    helm.scale.set(0.9, 1.15, 0.85);
    const lead = add('rubber_black', new THREE.TorusGeometry(0.15, 0.02, 6, 16), wx + 0.39, 0.7, wz);
    lead.rotation.y = Math.PI / 2;
  }
  {
    const cx = -2.74, cz = -2.55;
    box('paint_grey', cx - 0.35, cx + 0.35, FL + 0.1, 1.35, cz - 0.25, cz + 0.25);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        box('rubber_black', cx + sx * 0.28 - 0.04, cx + sx * 0.28 + 0.04, FL, FL + 0.1, cz + sz * 0.18 - 0.04, cz + sz * 0.18 + 0.04);
      }
    }
    for (let i = 0; i < 5; i++) box('steel_grey', cx - 0.2, cx + 0.2, 0.45 + i * 0.18, 0.47 + i * 0.18, cz + 0.25, cz + 0.28);
  }
  {
    const hx = -3.67, hy = 1.9;
    for (let i = 0; i < 3; i++) {
      const t = add('rubber_yellow', new THREE.TorusGeometry(0.2, 0.022, 6, 20), hx + (i - 1) * 0.025, hy - i * 0.02, ZF + 0.05 + i * 0.035);
      t.scale.set(1, 1.45, 1);
    }
    box('steel_grey', hx - 0.04, hx + 0.04, hy + 0.22, hy + 0.32, ZF, ZF + 0.16);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(hx - 0.15, hy - 0.2, ZF + 0.1),
      new THREE.Vector3(hx - 0.2, 1.1, ZF + 0.1),
      new THREE.Vector3(hx - 0.18, 0.5, ZF + 0.05),
      new THREE.Vector3(hx - 0.1, 0.09, ZF - 0.2),
      new THREE.Vector3(hx + 0.2, 0.085, ZF - 0.6)
    ]);
    add('rubber_yellow', new THREE.TubeGeometry(curve, 24, 0.022, 6, false), 0, 0, 0);
  }

  // ---------------- lean-to on +x ----------------
  const LH0 = 3.34, LH1 = 2.68;
  const LK = (LH0 - LH1) / (XR - XM);
  const LANG = Math.atan(LK);
  const LT = 0.08;
  const lTop = x => LH0 - LK * (x - XM);
  const lUnder = x => lTop(x) - LT / Math.cos(LANG);
  const LZF = 3.0, LZB = -2.2;
  {
    const L = Math.hypot(XR - XM, LH0 - LH1);
    const nx = Math.sin(LANG), ny = Math.cos(LANG);
    const mx = (XM + XR) / 2;
    const m = add('corrugated_iron', new THREE.BoxGeometry(L, LT, LZF - LZB), mx - LT / 2 * nx, lTop(mx) - LT / 2 * ny, (LZF + LZB) / 2);
    m.rotation.z = -LANG;
  }
  const LPX = 8.55;
  box('rusty_iron', LPX - 0.075, LPX + 0.075, 0, lUnder(LPX + 0.075), 2.775, 2.925);
  box('rusty_iron', LPX - 0.075, LPX + 0.075, 0, lUnder(LPX + 0.075), -2.075, -1.925);
  box('rusty_iron', LPX - 0.075, LPX + 0.075, lUnder(LPX + 0.075) - 0.15, lUnder(LPX + 0.075), -2.15, 2.95);
  box('rusty_iron', XM, XM + 0.075, lUnder(XM + 0.075) - 0.2, lUnder(XM + 0.075), -2.15, 2.95);
  for (const rz of [2.88, 0.4, -1.98]) {
    strutXY('rusty_iron', XM, lUnder(XM) - 0.07, 8.7, lUnder(8.7) - 0.07, rz, 0.08, 0.14);
  }
  {
    const s = new THREE.Shape();
    s.moveTo(XM, 0);
    s.lineTo(LPX + 0.075, 0);
    s.lineTo(LPX + 0.075, lUnder(LPX + 0.075));
    s.lineTo(XM, lUnder(XM));
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false });
    add('corrugated_iron', g, 0, 0, -2.12);
  }
  // stacked square steel tube
  {
    const rows = [7, 6, 5, 4, 3];
    const tsz = 0.21;
    for (let r = 0; r < rows.length; r++) {
      for (let i = 0; i < rows[r]; i++) {
        const x = 5.62 + tsz / 2 + r * tsz / 2 + i * tsz;
        const y = r * tsz + tsz / 2;
        const len = 2.9 + rnd() * 0.3;
        const zf = 2.55 - rnd() * 0.15;
        add('rusty_pipe', new THREE.BoxGeometry(tsz - 0.01, tsz - 0.01, len), x, y, zf - len / 2);
      }
    }
  }
  // wire mesh rolls
  for (const rx of [7.52, 8.32]) {
    const r = add('wire_mesh', new THREE.CylinderGeometry(0.4, 0.4, 1.0, 20), rx, 0.4, 1.6);
    r.rotation.x = Math.PI / 2;
  }
  {
    const r = add('wire_mesh', new THREE.CylinderGeometry(0.4, 0.4, 1.5, 20), 7.92, 0.4 + Math.sqrt(0.8 * 0.8 - 0.4 * 0.4), 1.6);
    r.rotation.z = Math.PI / 2;
  }

  return root;
}
```