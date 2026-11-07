You built the 3D model below from Christopher's reference sheet B11 · The radio shed and mast. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"model": {"Front": {"iou": 0.561, "turn_deg": 0.05}, "Right": {"iou": 0.636, "turn_deg": 0.18}, "Back": {"iou": 0.557, "turn_deg": -0.62}, "Top": {"iou": 0.945, "turn_deg": -0.03}, "Left": {"iou": 0.588, "turn_deg": -1.64}}}
The model's size in metres (x, y, z) and triangles: {"model": {"tris": 4082, "size": [10.931, 10.59, 8.674], "min": [-5.466, 0, -4.335]}}

Your code and the views you gave:
```json
{"objects": [{"name": "radio_mast", "size_m": [10.93, 10.59, 8.67],
  "views": [
    {"label": "Front", "box": [42, 10, 523, 478], "cam": [0, 0, 1], "up": [0, 1, 0]},
    {"label": "Right", "box": [575, 10, 947, 478], "cam": [1, 0, 0], "up": [0, 1, 0]},
    {"label": "Back", "box": [1030, 10, 1509, 478], "cam": [0, 0, -1], "up": [0, 1, 0]},
    {"label": "Top", "box": [28, 568, 452, 958], "cam": [0, 1, 0], "up": [0, 0, -1]},
    {"label": "Left", "box": [547, 537, 926, 970], "cam": [-1, 0, 0], "up": [0, 1, 0]}
  ]}],
 "notes": "The sheet shows a guyed red and white lattice radio mast, about 10.6 m to the beacon at roughly 44 px/m from the scale bar. A corrugated-iron shed with a single-slope roof (low at the front) shares a concrete slab with it. Three guy wires run to concrete blocks, and a 4 m horizontal wire antenna arm sticks out on +x. The top view's anchor spots and arm length don't match the front, side and back views, so I used those flat views; the Left view is drawn about 7% smaller than the others."}

```
```js
function build(THREE) {
  const COLORS = {
    concrete: 0xb4ab9c,
    corrugated_iron: 0x9b958b,
    rusty_iron: 0x8d6852,
    timber: 0x7a6957,
    glass: 0x394045,
    painted_metal: 0xc4bfb4,
    galvanised_steel: 0x9a9d9c,
    dark_iron: 0x4a4642,
    steel_cable: 0x57524c,
    paint_red: 0xa8442f,
    paint_white: 0xd5cfc1,
    glass_red: 0xc8261c
  };
  const mats = {};
  function M(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name] });
    return mats[name];
  }

  const root = new THREE.Group();
  root.name = 'radio_mast';
  // Everything below is built relative to the tower's centre; this offset centres the whole layout.
  const g = new THREE.Group();
  g.position.set(0.477, 0, -0.2);
  root.add(g);

  function mesh(name, geo) {
    const m = new THREE.Mesh(geo, M(name));
    m.name = name;
    g.add(m);
    return m;
  }
  function boxSpan(name, x0, x1, y0, y1, z0, z1) {
    const m = mesh(name, new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0));
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return m;
  }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const UP = V(0, 1, 0);
  function rod(name, a, b, r, seg, closed) {
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    const m = mesh(name, new THREE.CylinderGeometry(r, r, len, seg || 6, 1, !closed));
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(UP, d.clone().normalize());
    return m;
  }

  // ---------------- concrete slab ----------------
  boxSpan('concrete', -4.43, 0.98, 0, 0.2, -1.0, 2.28);

  // ---------------- shed ----------------
  const SX0 = -4.02, SX1 = -0.95, SZ0 = -0.78, SZ1 = 2.07, WT = 0.06, FL = 0.2;
  const RX0 = -4.12, RX1 = -0.85, RZ0 = -0.88, RZ1 = 2.17, RF = 2.05, RB = 2.45, RT = 0.05;
  const roofUnder = z => RF + (RB - RF) * (RZ1 - z) / (RZ1 - RZ0) - RT;

  // side walls (trapezoids following the mono-pitch roof)
  const wallShape = new THREE.Shape();
  wallShape.moveTo(SZ0, FL);
  wallShape.lineTo(SZ1, FL);
  wallShape.lineTo(SZ1, roofUnder(SZ1));
  wallShape.lineTo(SZ0, roofUnder(SZ0));
  wallShape.closePath();
  const wallGeo = new THREE.ExtrudeGeometry(wallShape, { depth: WT, bevelEnabled: false });
  for (const xin of [SX0 + WT, SX1]) {
    const w = mesh('corrugated_iron', wallGeo);
    w.rotation.y = -Math.PI / 2;
    w.position.x = xin;
  }
  // back wall
  boxSpan('corrugated_iron', SX0, SX1, FL, roofUnder(SZ0 + WT), SZ0, SZ0 + WT);

  // front wall built around door and window openings
  const FT = roofUnder(SZ1);
  const DX0 = -3.77, DX1 = -2.98, DY1 = 1.8;
  const WX0 = -2.5, WX1 = -1.66, WY0 = 1.1, WY1 = 1.8;
  const fz0 = SZ1 - WT, fz1 = SZ1;
  boxSpan('corrugated_iron', SX0, DX0, FL, FT, fz0, fz1);
  boxSpan('corrugated_iron', DX1, WX0, FL, FT, fz0, fz1);
  boxSpan('corrugated_iron', WX1, SX1, FL, FT, fz0, fz1);
  boxSpan('corrugated_iron', DX0, DX1, DY1, FT, fz0, fz1);
  boxSpan('corrugated_iron', WX0, WX1, WY1, FT, fz0, fz1);
  boxSpan('corrugated_iron', WX0, WX1, FL, WY0, fz0, fz1);

  // door, set in, with frame and handle
  boxSpan('timber', DX0, DX1, FL, DY1, SZ1 - 0.055, SZ1 - 0.03);
  boxSpan('timber', DX0 - 0.05, DX0, FL, DY1 + 0.05, SZ1, SZ1 + 0.02);
  boxSpan('timber', DX1, DX1 + 0.05, FL, DY1 + 0.05, SZ1, SZ1 + 0.02);
  boxSpan('timber', DX0 - 0.05, DX1 + 0.05, DY1, DY1 + 0.05, SZ1, SZ1 + 0.02);
  rod('dark_iron', V(DX1 - 0.1, 1.0, SZ1 - 0.03), V(DX1 - 0.1, 1.0, SZ1 + 0.04), 0.012, 6, true);
  boxSpan('dark_iron', DX1 - 0.2, DX1 - 0.08, 0.985, 1.015, SZ1 + 0.03, SZ1 + 0.05);

  // window: glass set in, frame, mullion, sill
  boxSpan('glass', WX0, WX1, WY0, WY1, SZ1 - 0.05, SZ1 - 0.035);
  const ff = 0.045;
  boxSpan('painted_metal', WX0, WX1, WY1 - ff, WY1, SZ1 - 0.05, SZ1 - 0.01);
  boxSpan('painted_metal', WX0, WX1, WY0, WY0 + ff, SZ1 - 0.05, SZ1 - 0.01);
  boxSpan('painted_metal', WX0, WX0 + ff, WY0, WY1, SZ1 - 0.05, SZ1 - 0.01);
  boxSpan('painted_metal', WX1 - ff, WX1, WY0, WY1, SZ1 - 0.05, SZ1 - 0.01);
  const wm = (WX0 + WX1) / 2;
  boxSpan('painted_metal', wm - 0.02, wm + 0.02, WY0, WY1, SZ1 - 0.05, SZ1 - 0.015);
  boxSpan('painted_metal', WX0 - 0.04, WX1 + 0.04, WY0 - 0.04, WY0, SZ1, SZ1 + 0.06);

  // wall air-conditioner unit
  boxSpan('painted_metal', -1.5, -0.97, 1.23, 1.64, SZ1, SZ1 + 0.28);
  boxSpan('dark_iron', -1.45, -1.2, 1.29, 1.58, SZ1 + 0.28, SZ1 + 0.29);
  rod('dark_iron', V(-1.42, 1.0, SZ1), V(-1.42, 1.23, SZ1 + 0.24), 0.012, 4, true);
  rod('dark_iron', V(-1.05, 1.0, SZ1), V(-1.05, 1.23, SZ1 + 0.24), 0.012, 4, true);

  // mono-pitch roof (low at front, high at back) and front fascia
  const ang = Math.atan2(RB - RF, RZ1 - RZ0);
  const rlen = Math.hypot(RB - RF, RZ1 - RZ0);
  const roof = mesh('rusty_iron', new THREE.BoxGeometry(RX1 - RX0, RT, rlen));
  roof.rotation.x = ang;
  roof.position.set((RX0 + RX1) / 2, (RF + RB) / 2 - RT / (2 * Math.cos(ang)), (RZ0 + RZ1) / 2);
  boxSpan('rusty_iron', RX0, RX1, RF - 0.1, RF - 0.03, RZ1 - 0.03, RZ1);

  // cable tray from shed wall to tower base
  boxSpan('galvanised_steel', -0.95, -0.52, 0.2, 0.42, 0.97, 1.17);
  boxSpan('galvanised_steel', -0.72, -0.52, 0.2, 0.42, 0.1, 0.97);
  boxSpan('galvanised_steel', -0.72, -0.07, 0.2, 0.42, 0.1, 0.3);

  // ---------------- lattice tower ----------------
  const Y0 = 0.2, YT = 9.34;
  const hx = y => 0.69 - 0.44 * (y - Y0) / (YT - Y0);
  const hz = y => 0.50 - 0.25 * (y - Y0) / (YT - Y0);
  const corner = (y, sx, sz) => V(sx * hx(y), y, sz * hz(y));
  const bandOf = y => (y < 4.6 || (y >= 6.05 && y < 7.45) || y >= 8.75) ? 'paint_red' : 'paint_white';
  const levels = [0.2, 1.15, 2.05, 2.95, 3.8, 4.6, 5.35, 6.05, 6.75, 7.45, 8.1, 8.75, 9.34];
  const corners = [[-1, 1], [1, 1], [1, -1], [-1, -1]];

  for (let i = 0; i < levels.length - 1; i++) {
    const y0 = levels[i], y1 = levels[i + 1];
    const band = bandOf((y0 + y1) / 2);
    for (let c = 0; c < 4; c++) {
      const [sx, sz] = corners[c];
      const [tx, tz] = corners[(c + 1) % 4];
      rod(band, corner(y0, sx, sz), corner(y1, sx, sz), 0.055, 8);
      rod(band, corner(y0, sx, sz), corner(y1, tx, tz), 0.025, 6);
      rod(band, corner(y0, tx, tz), corner(y1, sx, sz), 0.025, 6);
    }
  }
  for (let i = 0; i < levels.length; i++) {
    const y = levels[i];
    const band = bandOf(i === levels.length - 1 ? y - 0.01 : y + 0.01);
    for (let c = 0; c < 4; c++) {
      const [sx, sz] = corners[c];
      const [tx, tz] = corners[(c + 1) % 4];
      rod(band, corner(y, sx, sz), corner(y, tx, tz), 0.03, 6);
    }
  }
  // leg base plates
  for (const [sx, sz] of corners) {
    boxSpan('dark_iron', sx * hx(Y0) - 0.13, sx * hx(Y0) + 0.13, Y0, Y0 + 0.05, sz * hz(Y0) - 0.13, sz * hz(Y0) + 0.13);
  }

  // head plate and slim top mast section
  boxSpan('dark_iron', -0.33, 0.33, YT, YT + 0.05, -0.33, 0.33);
  const T0 = YT + 0.05, T1 = 10.14;
  const th = y => 0.14 - 0.05 * (y - T0) / (T1 - T0);
  const tc = (y, sx, sz) => V(sx * th(y), y, sz * th(y));
  for (let c = 0; c < 4; c++) {
    const [sx, sz] = corners[c];
    const [tx, tz] = corners[(c + 1) % 4];
    rod('paint_red', tc(T0, sx, sz), tc(T1, sx, sz), 0.035, 6);
    rod('paint_red', tc(T0, sx, sz), tc(T1, tx, tz), 0.018, 6);
    rod('paint_red', tc(9.75, sx, sz), tc(9.75, tx, tz), 0.02, 6);
    rod('paint_red', tc(T1, sx, sz), tc(T1, tx, tz), 0.02, 6);
  }
  boxSpan('dark_iron', -0.13, 0.13, T1, T1 + 0.04, -0.13, 0.13);

  // obstruction beacon
  rod('dark_iron', V(0, T1 + 0.04, 0), V(0, 10.27, 0), 0.03, 8, true);
  const bb = mesh('dark_iron', new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12));
  bb.position.set(0, 10.285, 0);
  const lens = mesh('glass_red', new THREE.CylinderGeometry(0.1, 0.11, 0.19, 12));
  lens.position.set(0, 10.395, 0);
  const dome = mesh('glass_red', new THREE.SphereGeometry(0.1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2));
  dome.position.set(0, 10.49, 0);

  // ---------------- antennas ----------------
  // long whip on the -x side with bracket
  const yb = 8.48;
  rod('dark_iron', V(-hx(yb), yb, -hz(yb)), V(-hx(yb), yb, hz(yb)), 0.02, 6);
  rod('dark_iron', V(-hx(yb), yb, 0), V(-0.94, yb, 0), 0.02, 6);
  rod('dark_iron', V(-0.92, 8.43, 0), V(-0.92, 10.36, 0), 0.014, 6, true);
  // two short whips front and back
  for (const s of [1, -1]) {
    rod('dark_iron', V(0, 8.6, s * hz(8.6)), V(0, 8.6, s * 0.45), 0.018, 6);
    rod('dark_iron', V(0, 8.45, s * 0.45), V(0, 9.45, s * 0.45), 0.012, 6, true);
  }
  // horizontal wire antenna arm on +x with end rods
  const boomCurve = new THREE.CatmullRomCurve3([
    V(0.26, 9.24, 0), V(1.3, 9.14, 0), V(2.6, 9.1, 0), V(4.07, 9.2, 0)
  ]);
  mesh('steel_cable', new THREE.TubeGeometry(boomCurve, 16, 0.016, 5, false));
  rod('dark_iron', V(0.39, 8.88, 0), V(0.39, 9.3, 0), 0.018, 6, true);
  rod('dark_iron', V(4.07, 8.95, 0), V(4.07, 9.34, 0), 0.02, 6, true);

  // ---------------- guy wires and anchor blocks ----------------
  const YA = 7.45;
  const anchors = [
    { p: V(-5.6, 0, 1.9), leg: [-1, 1] },
    { p: V(4.6, 0, 4.15), leg: [1, 1] },
    { p: V(1.25, 0, -3.8), leg: [1, -1] }
  ];
  for (const a of anchors) {
    const top = corner(YA, a.leg[0], a.leg[1]);
    const yaw = Math.atan2(-(top.z - a.p.z), top.x - a.p.x);
    const blk = mesh('concrete', new THREE.BoxGeometry(0.55, 0.36, 0.55));
    blk.position.set(a.p.x, 0.18, a.p.z);
    blk.rotation.y = yaw;
    const plate = mesh('dark_iron', new THREE.BoxGeometry(0.18, 0.04, 0.12));
    plate.position.set(a.p.x, 0.38, a.p.z);
    plate.rotation.y = yaw;
    const eye = V(a.p.x, 0.47, a.p.z);
    rod('dark_iron', V(a.p.x, 0.36, a.p.z), eye, 0.02, 6, true);
    const dir = new THREE.Vector3().subVectors(top, eye).normalize();
    const tb0 = eye.clone().addScaledVector(dir, 0.12);
    const tb1 = eye.clone().addScaledVector(dir, 0.8);
    rod('rusty_iron', tb0, tb1, 0.028, 6, true);
    rod('steel_cable', eye, top, 0.012, 5);
    boxSpan('dark_iron', top.x - 0.06, top.x + 0.06, top.y - 0.06, top.y + 0.06, top.z - 0.06, top.z + 0.06);
  }

  return root;
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 15,000.
