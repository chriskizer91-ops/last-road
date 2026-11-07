You built the 3D model below from Christopher's reference sheet E17 · Truck add-ons. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"light_bar": {"light bar (front)": {"iou": 0.89, "turn_deg": 0.09}}, "roof_rack": {}, "snorkel": {"snorkel (outer side, intake facing right)": {"iou": 0.728, "turn_deg": 1.44}}, "winch": {"winch (front, seen slightly from above)": {"iou": 0.864, "turn_deg": 2.31}}}
The model's size in metres (x, y, z) and triangles: {"winch": {"tris": 2448, "size": [0.564, 0.268, 0.241], "min": [-0.284, -0.013, -0.122]}, "light_bar": {"tris": 268, "size": [1.22, 0.182, 0.093], "min": [-0.61, 0, -0.045]}, "roof_rack": {"tris": 1268, "size": [1.532, 0.236, 1.23], "min": [-0.766, 0, -0.615]}, "snorkel": {"tris": 2208, "size": [0.166, 1.248, 0.708], "min": [-0.083, 0, -0.352]}}

Your code and the views you gave:
```json
{
  "objects": [
    {
      "name": "winch",
      "size_m": [0.565, 0.255, 0.23],
      "views": [
        {"label": "winch (front, seen slightly from above)", "box": [205, 36, 918, 413], "cam": [0, 0, 1], "up": [0, 1, 0]}
      ]
    },
    {
      "name": "light_bar",
      "size_m": [1.22, 0.182, 0.095],
      "views": [
        {"label": "light bar (front)", "box": [120, 437, 1036, 588], "cam": [0, 0, 1], "up": [0, 1, 0]}
      ]
    },
    {
      "name": "roof_rack",
      "size_m": [1.53, 0.236, 1.23],
      "views": []
    },
    {
      "name": "snorkel",
      "size_m": [0.16, 1.25, 0.71],
      "views": [
        {"label": "snorkel (outer side, intake facing right)", "box": [1042, 28, 1486, 808], "cam": [-1, 0, 0], "up": [0, 1, 0]}
      ]
    }
  ],
  "notes": "Four separate add-ons: an electric winch with a roller fairlead and red hook, an 8-lamp light bar on L-brackets, a tubular basket roof rack, and a raised-air-intake snorkel (the intake faces +z; the flange bolts to the body on +x). The 1 m bar (about 335 px) does not fit these parts: it would make the winch 2.1 m long and the light bar 2.7 m. So I sized them as real parts (winch 0.56 m, bar 1.22 m, rack 1.5 x 1.1 m, snorkel 1.25 m tall) and kept the drawn proportions. The winch and light bar views are taken slightly from above. The roof rack is drawn only in perspective, so it has no flat view and gets a colour guess."
}

```
```js
function build(THREE) {
  const PAL = {
    rusty_iron:    [0x3e342b, 0.9, 0.35],
    steel:         [0x8a8273, 0.6, 0.6],
    steel_cable:   [0x6d6558, 0.75, 0.5],
    red_paint:     [0xa04a3c, 0.7, 0.2],
    rubber:        [0x262524, 0.95, 0.0],
    rubber_red:    [0x8c3328, 0.9, 0.0],
    aluminium:     [0x8d897f, 0.6, 0.5],
    glass:         [0xc6c0ad, 0.25, 0.1],
    black_plastic: [0x474643, 0.9, 0.0],
    dark_plastic:  [0x2c2b29, 0.9, 0.0]
  };
  const mats = {};
  function M(name) {
    if (!mats[name]) {
      const p = PAL[name];
      mats[name] = new THREE.MeshStandardMaterial({ color: p[0], roughness: p[1], metalness: p[2] });
      mats[name].name = name;
    }
    return mats[name];
  }
  function mesh(geo, name) { const m = new THREE.Mesh(geo, M(name)); m.name = name; return m; }
  function box(parent, name, x0, y0, z0, x1, y1, z1) {
    const ax = Math.min(x0, x1), bx = Math.max(x0, x1);
    const ay = Math.min(y0, y1), by = Math.max(y0, y1);
    const az = Math.min(z0, z1), bz = Math.max(z0, z1);
    const m = mesh(new THREE.BoxGeometry(bx - ax, by - ay, bz - az), name);
    m.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
    parent.add(m);
    return m;
  }
  function cylX(parent, name, r, x0, x1, y, z, seg, open) {
    const m = mesh(new THREE.CylinderGeometry(r, r, Math.abs(x1 - x0), seg, 1, !!open), name);
    m.rotation.z = Math.PI / 2;
    m.position.set((x0 + x1) / 2, y, z);
    parent.add(m);
    return m;
  }
  function cylY(parent, name, r, y0, y1, x, z, seg, open) {
    const m = mesh(new THREE.CylinderGeometry(r, r, Math.abs(y1 - y0), seg, 1, !!open), name);
    m.position.set(x, (y0 + y1) / 2, z);
    parent.add(m);
    return m;
  }
  function tube(parent, name, pts, r, tseg, rseg) {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    parent.add(mesh(new THREE.TubeGeometry(curve, tseg, r, rseg, false), name));
    return curve;
  }

  // ---------------- WINCH ----------------
  function buildWinch() {
    const root = new THREE.Group(); root.name = 'winch';
    const w = new THREE.Group(); w.position.z = -0.032; root.add(w);
    const RI = 'rusty_iron';
    // base plates / feet
    box(w, RI, -0.135, 0, -0.08, -0.05, 0.012, 0.08);
    box(w, RI, 0.165, 0, -0.08, 0.28, 0.012, 0.08);
    box(w, RI, -0.195, 0, -0.045, -0.13, 0.058, 0.045); // motor saddle
    // drum end plates
    box(w, RI, -0.08, 0.012, -0.08, -0.05, 0.235, 0.08);
    box(w, RI, 0.165, 0.012, -0.08, 0.195, 0.235, 0.08);
    // drum with wound cable + flanges
    cylX(w, 'steel_cable', 0.078, -0.05, 0.165, 0.12, 0, 20);
    cylX(w, RI, 0.09, -0.05, -0.044, 0.12, 0, 20);
    cylX(w, RI, 0.09, 0.159, 0.165, 0.12, 0, 20);
    // tie bars
    cylX(w, RI, 0.011, -0.08, 0.195, 0.222, -0.062, 8);
    cylX(w, RI, 0.011, -0.08, 0.195, 0.222, 0.062, 8);
    cylX(w, RI, 0.011, -0.08, 0.195, 0.035, -0.062, 8);
    // motor (left)
    cylX(w, RI, 0.068, -0.25, -0.08, 0.12, 0, 20);
    cylX(w, RI, 0.073, -0.243, -0.233, 0.12, 0, 20);
    cylX(w, RI, 0.073, -0.1, -0.09, 0.12, 0, 20);
    cylX(w, RI, 0.055, -0.263, -0.25, 0.12, 0, 16);
    // solenoid / junction box on top of motor
    box(w, RI, -0.185, 0.18, -0.05, -0.085, 0.238, 0.04);
    box(w, RI, -0.19, 0.238, -0.055, -0.08, 0.255, 0.045);
    // power cables looping to motor end
    tube(w, 'rubber', [[-0.175, 0.215, -0.03], [-0.23, 0.225, -0.03], [-0.272, 0.18, -0.02], [-0.27, 0.12, 0.0], [-0.255, 0.1, 0.02]], 0.009, 14, 6);
    tube(w, 'rubber_red', [[-0.16, 0.225, 0.0], [-0.21, 0.245, 0.01], [-0.262, 0.215, 0.02], [-0.268, 0.16, 0.03], [-0.255, 0.14, 0.035]], 0.009, 14, 6);
    tube(w, 'rubber', [[-0.183, 0.2, 0.02], [-0.235, 0.19, 0.04], [-0.262, 0.13, 0.045], [-0.252, 0.095, 0.04]], 0.008, 12, 6);
    // gearbox (right) and clutch knob
    cylX(w, RI, 0.072, 0.195, 0.25, 0.12, 0, 20);
    cylX(w, RI, 0.058, 0.25, 0.258, 0.12, 0, 16);
    cylY(w, RI, 0.016, 0.185, 0.21, 0.222, 0, 8);
    // roller fairlead frame
    const fz0 = 0.08, fz1 = 0.1;
    box(w, RI, -0.078, 0.012, fz0, 0.203, 0.028, fz1);
    box(w, RI, -0.078, 0.135, fz0, 0.203, 0.15, fz1);
    box(w, RI, -0.078, 0.012, fz0, -0.062, 0.15, fz1);
    box(w, RI, 0.187, 0.012, fz0, 0.203, 0.15, fz1);
    // rollers
    cylY(w, 'steel', 0.014, 0.028, 0.135, -0.045, 0.095, 12);
    cylY(w, 'steel', 0.014, 0.028, 0.135, 0.17, 0.095, 12);
    cylX(w, 'steel', 0.014, -0.031, 0.156, 0.11, 0.095, 12);
    cylX(w, 'steel', 0.014, -0.031, 0.156, 0.055, 0.095, 12);
    // roller bolt heads
    cylY(w, 'steel', 0.01, 0.15, 0.158, -0.045, 0.095, 6);
    cylY(w, 'steel', 0.01, 0.15, 0.158, 0.17, 0.095, 6);
    // cable from drum through fairlead to thimble
    tube(w, 'steel_cable', [[0.075, 0.06, 0.03], [0.078, 0.082, 0.08], [0.078, 0.084, 0.11], [0.076, 0.112, 0.128], [0.075, 0.12, 0.135]], 0.006, 16, 6);
    const hz = 0.135;
    const th = mesh(new THREE.TorusGeometry(0.014, 0.005, 6, 12), 'steel_cable');
    th.position.set(0.075, 0.106, hz); w.add(th);
    // hook
    const eye = mesh(new THREE.TorusGeometry(0.011, 0.0045, 6, 12), 'red_paint');
    eye.rotation.y = Math.PI / 2; eye.position.set(0.07, 0.093, hz); w.add(eye);
    cylY(w, 'red_paint', 0.008, 0.052, 0.082, 0.07, hz, 8);
    const arc = mesh(new THREE.TorusGeometry(0.03, 0.009, 8, 16, Math.PI * 4 / 3), 'red_paint');
    arc.rotation.z = Math.PI * 5 / 6; arc.position.set(0.095, 0.04, hz); w.add(arc);
    const latch = box(w, 'steel', -0.0225, -0.002, -0.004, 0.0225, 0.002, 0.004);
    latch.position.set(0.0965, 0.066, hz); latch.rotation.z = -0.27;
    return root;
  }

  // ---------------- LIGHT BAR ----------------
  function buildLightBar() {
    const g = new THREE.Group(); g.name = 'light_bar';
    box(g, 'aluminium', -0.5, 0.065, -0.045, 0.5, 0.175, 0.035);
    box(g, 'rusty_iron', -0.497, 0.068, 0.035, 0.497, 0.172, 0.044);
    for (let i = 0; i < 8; i++) {
      const cx = -0.4165 + i * 0.119;
      box(g, 'glass', cx - 0.05, 0.085, 0.044, cx + 0.05, 0.155, 0.048);
    }
    for (const z of [-0.03, -0.008, 0.014]) box(g, 'aluminium', -0.495, 0.175, z - 0.004, 0.495, 0.182, z + 0.004);
    for (const s of [-1, 1]) {
      box(g, 'rusty_iron', s * 0.5, 0.008, -0.022, s * 0.528, 0.142, 0.022);
      cylX(g, 'steel', 0.013, s * 0.528, s * 0.54, 0.12, 0, 8);
      box(g, 'rusty_iron', s * 0.5, 0, -0.04, s * 0.61, 0.009, 0.04);
    }
    return g;
  }

  // ---------------- ROOF RACK ----------------
  function loop(parent, name, W, D, R, y, tr) {
    const lx = W - 2 * R, lz = D - 2 * R;
    for (const s of [-1, 1]) {
      const a = mesh(new THREE.CylinderGeometry(tr, tr, lx, 8, 1, true), name);
      a.rotation.z = Math.PI / 2; a.position.set(0, y, s * D / 2); parent.add(a);
      const b = mesh(new THREE.CylinderGeometry(tr, tr, lz, 8, 1, true), name);
      b.rotation.x = Math.PI / 2; b.position.set(s * W / 2, y, 0); parent.add(b);
    }
    const corners = [[1, 1, 0], [-1, 1, -Math.PI / 2], [1, -1, Math.PI / 2], [-1, -1, Math.PI]];
    for (const c of corners) {
      const t = mesh(new THREE.TorusGeometry(R, tr, 8, 6, Math.PI / 2), name);
      t.rotation.set(Math.PI / 2, c[2], 0, 'YXZ');
      t.position.set(c[0] * (W / 2 - R), y, c[1] * (D / 2 - R));
      parent.add(t);
    }
  }
  function buildRack() {
    const g = new THREE.Group(); g.name = 'roof_rack';
    const RI = 'rusty_iron';
    const W = 1.5, D = 1.1, R = 0.08, tr = 0.016, yLo = 0.1, yHi = 0.22;
    loop(g, RI, W, D, R, yLo, tr);
    loop(g, RI, W, D, R, yHi, tr);
    for (const x of [-0.5, -0.17, 0.17, 0.5]) for (const sz of [-1, 1]) cylY(g, RI, 0.013, yLo, yHi, x, sz * D / 2, 8, true);
    for (const z of [-0.2, 0.2]) for (const sx of [-1, 1]) cylY(g, RI, 0.013, yLo, yHi, sx * W / 2, z, 8, true);
    for (let i = -3; i <= 3; i++) {
      const x = i * 0.2;
      box(g, RI, x - 0.035, yLo + 0.004, -D / 2, x + 0.035, yLo + 0.018, D / 2);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const fx = sx * 0.62, fz = sz * D / 2;
      box(g, RI, fx - 0.025, 0.008, fz - 0.005, fx + 0.025, yLo, fz + 0.005);
      box(g, RI, fx - 0.03, 0, fz - sz * 0.01, fx + 0.03, 0.008, fz + sz * 0.065);
    }
    return g;
  }

  // ---------------- SNORKEL ----------------
  function buildSnorkel() {
    const g = new THREE.Group(); g.name = 'snorkel';
    const S = 0.0016;
    const P = (px, py, x) => new THREE.Vector3(x || 0, (808 - py) * S, (px - 1262.5) * S);
    const pts = [P(1100, 140), P(1100, 200), P(1108, 320), P(1165, 430), P(1235, 530),
                 P(1272, 610), P(1290, 690), P(1330, 742), P(1405, 735)];
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    g.add(mesh(new THREE.TubeGeometry(curve, 56, 0.072, 12, false), 'black_plastic'));
    // intake head (side profile extruded across x)
    const sh = new THREE.Shape();
    sh.moveTo(-0.352, 1.04);
    sh.lineTo(-0.352, 1.17);
    sh.quadraticCurveTo(-0.352, 1.248, -0.3, 1.248);
    sh.lineTo(-0.04, 1.248);
    sh.lineTo(-0.016, 1.226);
    sh.lineTo(-0.02, 1.085);
    sh.lineTo(-0.15, 1.06);
    sh.lineTo(-0.18, 1.04);
    const hg = new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: false, curveSegments: 6 });
    hg.translate(0, 0, -0.08);
    const head = mesh(hg, 'black_plastic');
    head.rotation.y = -Math.PI / 2;
    g.add(head);
    // grille panel on the forward face
    box(g, 'dark_plastic', -0.066, 1.1, -0.026, 0.066, 1.222, -0.012);
    // hose clamps
    const zAxis = new THREE.Vector3(0, 0, 1);
    for (const u of [0.067, 0.64]) {
      const p = curve.getPointAt(u);
      const t = curve.getTangentAt(u).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(zAxis, t);
      const c = mesh(new THREE.TorusGeometry(0.077, 0.006, 6, 20), 'steel');
      c.quaternion.copy(q); c.position.copy(p); g.add(c);
      const n = new THREE.Vector3(0, t.z, -t.y).normalize();
      const hb = box(g, 'steel', -0.012, -0.01, -0.006, 0.012, 0.01, 0.006);
      hb.quaternion.copy(q);
      hb.position.set(p.x, p.y + n.y * 0.08, p.z + n.z * 0.08);
    }
    // lower end: closed elbow, stub into body, mounting flange with bolts
    const end = pts[pts.length - 1];
    const sp = mesh(new THREE.SphereGeometry(0.072, 12, 8), 'black_plastic');
    sp.position.copy(end); g.add(sp);
    cylX(g, 'black_plastic', 0.066, 0, 0.065, end.y, end.z, 12, true);
    box(g, 'black_plastic', 0.06, 0, 0.18, 0.075, 0.26, 0.356);
    for (const y of [0.03, 0.23]) for (const z of [0.2, 0.336]) cylX(g, 'steel', 0.009, 0.052, 0.06, y, z, 6);
    return g;
  }

  return {
    winch: buildWinch(),
    light_bar: buildLightBar(),
    roof_rack: buildRack(),
    snorkel: buildSnorkel()
  };
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that), and any flat view
on the sheet that's missing from the list (both sides when both are drawn: a face no view shows is painted by a guess). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 12,000.
