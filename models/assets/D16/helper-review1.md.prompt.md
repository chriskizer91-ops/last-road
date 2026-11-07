You built the 3D model below from Christopher's reference sheet D16 · Last Well, Ruben's shack. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"model": {"Front View": {"iou": 0.93, "turn_deg": 0.67}, "Right View": {"iou": 0.805, "turn_deg": 0.42}, "Back View": {"iou": 0.96, "turn_deg": -0.14}, "Left View": {"iou": 0.9, "turn_deg": -0.03}, "Top View": {"iou": 0.909, "turn_deg": -0.12}}}
The model's size in metres (x, y, z) and triangles: {"model": {"tris": 4956, "size": [6.87, 3.22, 5.255], "min": [-3.435, 0, -2.625]}}

Your code and the views you gave:
```json
{"objects": [{"name": "ruben_shack", "size_m": [6.87, 3.22, 5.26],
  "views": [
    {"label": "Front View", "box": [1007, 17, 1525, 266], "cam": [0, 0, 1], "up": [0, 1, 0]},
    {"label": "Right View", "box": [1074, 304, 1511, 553], "cam": [1, 0, 0], "up": [0, 1, 0]},
    {"label": "Back View", "box": [14, 660, 544, 913], "cam": [0, 0, -1], "up": [0, 1, 0]},
    {"label": "Left View", "box": [584, 659, 983, 913], "cam": [-1, 0, 0], "up": [0, 1, 0]},
    {"label": "Top View", "box": [1037, 632, 1498, 970], "cam": [0, 1, 0], "up": [0, 0, -1]}
  ]}],
 "notes": "Ruben's corrugated-iron gable shack: about 5.8 x 3.1 m, eaves 2.1 m, ridge 2.7 m. It has a bush-pole veranda 1.5 m deep, a stone chimney on the -x gable to 3.2 m, a galvanised tank on a timber stand at the front -x corner, a drum rack, and a stone well with a hand pump at front right (scale bar 1 m is about 77 px). Unclear: the Right View draws the chimney on the +x gable while every other view puts it at -x, so it is modelled at -x. The Top View is squashed in depth compared with both side views and shows the well further out, so the depth is a compromise."}

```
```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'ruben_shack';
  const g = new THREE.Group();
  g.position.set(0.375, 0, -0.95); // centre overall bounds on x=0, z=0
  root.add(g);

  const COLORS = {
    rusty_iron: 0x8a6655,
    corrugated_iron: 0x847a72,
    galvanised_iron: 0x8e9192,
    timber: 0x8b7a63,
    stone: 0xa88b68,
    concrete: 0x7b766f,
    wire_mesh: 0x56534f,
    canvas: 0xb69c6c,
    paint_red: 0x8a3d2f,
    paint_green: 0x4d5b4e,
    dark_iron: 0x302c2a
  };
  const mats = {};
  function mat(name) {
    if (!mats[name]) {
      const metal = (name.indexOf('iron') >= 0 || name.indexOf('paint') >= 0) ? 0.3 : 0.0;
      mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name], roughness: 0.85, metalness: metal });
    }
    return mats[name];
  }
  function add(geo, name) {
    const m = new THREE.Mesh(geo, mat(name));
    m.name = name;
    g.add(m);
    return m;
  }
  function boxR(name, x0, x1, y0, y1, z0, z1) {
    const m = add(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), name);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return m;
  }
  function cyl(name, rt, rb, h, seg, x, y, z) {
    const m = add(new THREE.CylinderGeometry(rt, rb, h, seg), name);
    m.position.set(x, y, z);
    return m;
  }
  const UP = new THREE.Vector3(0, 1, 0);
  function dist(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); }
  function place(m, a, b) {
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    const dir = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    m.quaternion.setFromUnitVectors(UP, dir);
  }
  function rod(name, a, b, rb, seg, rt) {
    const m = add(new THREE.CylinderGeometry(rt === undefined ? rb : rt, rb, dist(a, b), seg), name);
    place(m, a, b);
    return m;
  }
  function bar(name, a, b, w, d) {
    const m = add(new THREE.BoxGeometry(w, dist(a, b), d), name);
    place(m, a, b);
    return m;
  }
  function slab(name, x0, x1, za, ya, zb, yb, t) {
    const dz = zb - za, dy = yb - ya;
    const m = add(new THREE.BoxGeometry(x1 - x0, t, Math.hypot(dz, dy)), name);
    m.position.set((x0 + x1) / 2, (ya + yb) / 2, (za + zb) / 2);
    m.rotation.x = Math.atan2(-dy, dz);
    return m;
  }
  function tube(name, pts, segs, r, radial) {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    return add(new THREE.TubeGeometry(curve, segs, r, radial, false), name);
  }

  // ---------- main dimensions ----------
  const HX = 2.9, HZ = 1.55, T = 0.05, WH = 2.08;
  const RIDGE = 2.72, SLOPE = 0.4, RX = 3.02;
  const roofY = z => RIDGE - SLOPE * Math.abs(z);
  const VZ0 = 1.56, VZ1 = 3.05, VY0 = 2.035, VS = 0.1133;
  const vy = z => VY0 - (z - VZ0) * VS;
  const PZ = 2.95;

  // ---------- walls ----------
  boxR('corrugated_iron', -HX, HX, 0, WH, -HZ, -HZ + T); // back wall

  // front wall with door and two windows
  const fz0 = HZ - T, fz1 = HZ;
  const ops = [
    { x0: -2.04, x1: -1.32, y0: 1.0, y1: 1.65 },
    { x0: -0.5, x1: 0.3, y0: 0.0, y1: 1.9 },
    { x0: 0.96, x1: 1.49, y0: 1.05, y1: 1.65 }
  ];
  let cx = -HX;
  ops.forEach(o => {
    boxR('corrugated_iron', cx, o.x0, 0, WH, fz0, fz1);
    if (o.y0 > 0) boxR('corrugated_iron', o.x0, o.x1, 0, o.y0, fz0, fz1);
    boxR('corrugated_iron', o.x0, o.x1, o.y1, WH, fz0, fz1);
    cx = o.x1;
  });
  boxR('corrugated_iron', cx, HX, 0, WH, fz0, fz1);

  // gable end walls (between front and back walls)
  const gs = new THREE.Shape();
  gs.moveTo(-1.5, 0);
  gs.lineTo(1.5, 0);
  gs.lineTo(1.5, 2.08);
  gs.lineTo(0, 2.70);
  gs.lineTo(-1.5, 2.08);
  gs.lineTo(-1.5, 0);
  const gableGeo = new THREE.ExtrudeGeometry(gs, { depth: T, bevelEnabled: false });
  const gR = add(gableGeo, 'corrugated_iron');
  gR.rotation.y = -Math.PI / 2;
  gR.position.set(HX, 0, 0);
  const gL = add(gableGeo, 'corrugated_iron');
  gL.rotation.y = -Math.PI / 2;
  gL.position.set(-HX + T, 0, 0);

  // window / door architraves
  function architrave(o, sill) {
    const w = 0.05, z0 = HZ, z1 = HZ + 0.025;
    const yb = sill ? o.y0 - w : 0;
    boxR('timber', o.x0 - w, o.x0, yb, o.y1 + w, z0, z1);
    boxR('timber', o.x1, o.x1 + w, yb, o.y1 + w, z0, z1);
    boxR('timber', o.x0 - w, o.x1 + w, o.y1, o.y1 + w, z0, z1);
    if (sill) boxR('timber', o.x0 - 0.08, o.x1 + 0.08, o.y0 - 0.05, o.y0, z0, HZ + 0.07);
  }
  architrave(ops[0], true);
  architrave(ops[1], false);
  architrave(ops[2], true);

  // left window: wire screen set in
  boxR('wire_mesh', ops[0].x0, ops[0].x1, ops[0].y0, ops[0].y1, HZ - 0.035, HZ - 0.02);
  // right window: hessian hung in the opening
  boxR('canvas', ops[2].x0, ops[2].x1, ops[2].y0, ops[2].y1, HZ - 0.03, HZ - 0.015);

  // screen door, set in
  const dz0 = HZ - 0.045, dz1 = HZ - 0.015;
  boxR('timber', -0.5, -0.43, 0, 1.9, dz0, dz1);
  boxR('timber', 0.23, 0.3, 0, 1.9, dz0, dz1);
  boxR('timber', -0.43, 0.23, 1.83, 1.9, dz0, dz1);
  boxR('timber', -0.43, 0.23, 0.0, 0.1, dz0, dz1);
  boxR('timber', -0.43, 0.23, 0.9, 0.97, dz0, dz1);
  boxR('wire_mesh', -0.43, 0.23, 0.1, 1.83, HZ - 0.04, HZ - 0.025);
  bar('timber', [-0.4, 0.14, HZ - 0.028], [0.2, 0.86, HZ - 0.028], 0.05, 0.022);
  const knob = cyl('dark_iron', 0.015, 0.015, 0.06, 6, 0.17, 1.0, HZ - 0.005);
  knob.rotation.x = Math.PI / 2;
  boxR('timber', -0.58, 0.38, 0, 0.07, HZ, HZ + 0.36); // door step plank

  // ---------- roof ----------
  slab('rusty_iron', -RX, RX, 0, RIDGE, -1.67, roofY(-1.67), 0.025);
  slab('rusty_iron', -RX, RX, 0, RIDGE, 1.62, roofY(1.62), 0.025);
  const ridgeCap = cyl('galvanised_iron', 0.055, 0.055, 2 * RX, 10, 0, RIDGE + 0.005, 0);
  ridgeCap.rotation.z = Math.PI / 2;
  slab('rusty_iron', -RX, RX, VZ0, vy(VZ0), VZ1, vy(VZ1), 0.025); // veranda roof

  // ---------- veranda frame ----------
  const posts = [-2.95, -1.0, 0.95, 2.95];
  const lean = [[0.02, 0.015], [-0.015, 0.01], [0.012, -0.018], [-0.02, -0.01]];
  posts.forEach((x, i) => rod('timber', [x + lean[i][0], 0.002, PZ + lean[i][1]], [x, 1.73, PZ], 0.068, 8, 0.058));
  rod('timber', [-3.06, 1.722, PZ], [3.06, 1.722, PZ], 0.065, 8); // front beam log
  [-2.95, -1.975, -1.0, -0.025, 0.95, 1.95, 2.95].forEach(x => {
    rod('timber', [x, vy(VZ0) - 0.053, VZ0], [x, vy(3.1) - 0.053, 3.1], 0.04, 6);
  });
  rod('timber', [-2.9, 1.9, 1.6], [2.9, 1.9, 1.6], 0.05, 6); // wall ledger

  // ---------- bench ----------
  const bz0 = HZ + 0.08, bz1 = HZ + 0.42, bzm = (bz0 + bz1) / 2;
  boxR('timber', -2.63, -1.12, 0.38, 0.43, bz0, bz1);
  [-2.5, -1.25].forEach(x => {
    [bz0 + 0.05, bz1 - 0.05].forEach(z => boxR('timber', x - 0.03, x + 0.03, 0, 0.38, z - 0.03, z + 0.03));
    boxR('timber', x - 0.025, x + 0.025, 0.1, 0.15, bz0 + 0.02, bz1 - 0.02);
  });
  boxR('timber', -2.5, -1.25, 0.12, 0.17, bzm - 0.025, bzm + 0.025);

  // ---------- canvas water bag hanging from the front beam ----------
  boxR('canvas', -2.67, -2.33, 0.95, 1.45, 2.69, 2.81);
  rod('timber', [-2.69, 1.45, 2.75], [-2.31, 1.45, 2.75], 0.015, 6);
  cyl('dark_iron', 0.018, 0.018, 0.08, 6, -2.5, 0.91, 2.75);
  rod('canvas', [-2.64, 1.45, 2.75], [-2.5, 1.66, 2.93], 0.012, 4);
  rod('canvas', [-2.36, 1.45, 2.75], [-2.5, 1.66, 2.93], 0.012, 4);

  // ---------- drum rack ----------
  const rx0 = 1.4, rx1 = 2.82, rz0 = 1.6, rz1 = 2.25;
  const rpx = [rx0 + 0.035, rx1 - 0.035], rpz = [rz0 + 0.035, rz1 - 0.035];
  rpx.forEach(x => rpz.forEach(z => boxR('timber', x - 0.035, x + 0.035, 0, 1.3, z - 0.035, z + 0.035)));
  rpz.forEach(z => {
    [[0.17, 0.23], [0.72, 0.78], [1.24, 1.3]].forEach(r => boxR('timber', rx0, rx1, r[0], r[1], z - 0.03, z + 0.03));
  });
  rpx.forEach(x => {
    boxR('timber', x - 0.03, x + 0.03, 1.24, 1.3, rz0, rz1);
    boxR('timber', x - 0.03, x + 0.03, 0.05, 0.1, rz0, rz1);
  });
  const drumZ = (rz0 + rz1) / 2;
  [0.43, 0.98].forEach(y => {
    [1.69, 2.11, 2.53].forEach(x => {
      const d = cyl('paint_red', 0.2, 0.2, 0.6, 14, x, y, drumZ);
      d.rotation.x = Math.PI / 2;
      [-0.29, 0.29].forEach(o => {
        const rim = add(new THREE.TorusGeometry(0.2, 0.014, 4, 14), 'paint_red');
        rim.position.set(x, y, drumZ + o);
      });
    });
  });

  // ---------- water tank on timber stand (-x end, front corner) ----------
  const TX = -3.33, TZ = 1.0, TR = 0.45, DECK = 0.6;
  boxR('timber', TX - 0.46, TX + 0.46, DECK, DECK + 0.06, TZ - 0.46, TZ + 0.46);
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => {
    boxR('timber', TX + sx * 0.4 - 0.04, TX + sx * 0.4 + 0.04, 0, DECK, TZ + sz * 0.4 - 0.04, TZ + sz * 0.4 + 0.04);
  }));
  [-1, 1].forEach(sz => boxR('timber', TX - 0.46, TX + 0.46, DECK - 0.07, DECK, TZ + sz * 0.4 - 0.04, TZ + sz * 0.4 + 0.04));
  // X braces: outer (-x) face, front and back faces
  bar('timber', [TX - 0.465, 0.05, TZ - 0.4], [TX - 0.465, DECK - 0.08, TZ + 0.4], 0.03, 0.07);
  bar('timber', [TX - 0.465, 0.05, TZ + 0.4], [TX - 0.465, DECK - 0.08, TZ - 0.4], 0.03, 0.07);
  [TZ + 0.465, TZ - 0.465].forEach(z => {
    bar('timber', [TX - 0.4, 0.05, z], [TX + 0.4, DECK - 0.08, z], 0.07, 0.03);
    bar('timber', [TX + 0.4, 0.05, z], [TX - 0.4, DECK - 0.08, z], 0.07, 0.03);
  });
  cyl('galvanised_iron', TR, TR, 1.2, 28, TX, DECK + 0.06 + 0.6, TZ);
  const lid = add(new THREE.ConeGeometry(TR + 0.01, 0.1, 28), 'galvanised_iron');
  lid.position.set(TX, 1.91, TZ);
  [0.68, 1.85].forEach(y => {
    const rim = add(new THREE.TorusGeometry(TR + 0.005, 0.015, 4, 28), 'galvanised_iron');
    rim.rotation.x = Math.PI / 2;
    rim.position.set(TX, y, TZ);
  });
  cyl('galvanised_iron', 0.09, 0.09, 0.06, 12, TX, 1.95, TZ);
  rod('dark_iron', [TX, 0.8, TZ + 0.43], [TX, 0.8, TZ + 0.55], 0.02, 6);
  // downpipe from gable roof edge into tank
  tube('galvanised_iron', [[-2.97, 2.29, TZ], [-3.12, 2.26, TZ], [-3.27, 2.15, TZ], [TX, 1.98, TZ]], 16, 0.035, 8);

  // ---------- stone chimney on -x gable ----------
  boxR('stone', -3.2, -2.6, 0, 1.7, -0.45, 0.45);
  boxR('stone', -3.16, -2.6, 1.7, 2.05, -0.36, 0.36);
  boxR('stone', -3.12, -2.6, 2.05, 3.08, -0.28, 0.28);
  boxR('stone', -3.15, -2.57, 3.03, 3.1, -0.31, 0.31);
  cyl('dark_iron', 0.1, 0.11, 0.12, 10, -2.86, 3.16, 0);

  // ---------- stone well with hand pump (front right) ----------
  const WX = 1.7, WZ = 3.05;
  const prof = [[0.36, 0], [0.5, 0], [0.53, 0.2], [0.5, 0.45], [0.36, 0.45], [0.36, 0]]
    .map(p => new THREE.Vector2(p[0], p[1]));
  const ring = add(new THREE.LatheGeometry(prof, 20), 'stone');
  ring.position.set(WX, 0, WZ);
  cyl('concrete', 0.37, 0.37, 0.06, 20, WX, 0.39, WZ);
  cyl('paint_green', 0.1, 0.12, 0.05, 12, WX, 0.445, WZ);
  cyl('paint_green', 0.045, 0.055, 0.56, 10, WX, 0.75, WZ);
  cyl('paint_green', 0.075, 0.07, 0.15, 12, WX, 1.095, WZ);
  const cap = add(new THREE.SphereGeometry(0.075, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), 'paint_green');
  cap.position.set(WX, 1.17, WZ);
  rod('paint_green', [WX - 0.05, 0.92, WZ], [WX - 0.27, 0.88, WZ], 0.03, 8, 0.026);
  rod('paint_green', [WX - 0.27, 0.89, WZ], [WX - 0.29, 0.8, WZ], 0.026, 8, 0.022);
  rod('paint_green', [WX + 0.04, 1.12, WZ], [WX + 0.1, 1.2, WZ], 0.015, 6);
  tube('paint_green', [[WX + 0.03, 1.15, WZ], [WX + 0.16, 1.23, WZ], [WX + 0.33, 1.19, WZ], [WX + 0.45, 1.04, WZ], [WX + 0.48, 0.9, WZ]], 20, 0.018, 6);

  return root;
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that), and any flat view
on the sheet that's missing from the list (both sides when both are drawn: a face no view shows is painted by a guess). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 25,000.
