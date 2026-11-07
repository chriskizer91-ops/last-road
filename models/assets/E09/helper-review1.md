- **Wire coil, side view:** the sheet's side drawing shows the coil standing on edge, with vertical strands. That contradicts the front and top views, and it painted vertical strands onto the flat-lying drum. The coil is round, so the front drawing is also correct for +x, −x and the back. I've reused it for all three.
- **Wire coil, top view (0.75 overlap):** 0.75 is almost exactly 1 − (hole ÷ outer)². That means the hole is being counted in one outline and not the other. The hole's size matches the drawing, so the geometry stays as it is.
- **Water pump, front (0.83 overlap):** several parts are off against the drawing:
  - The pump casting is too short. The sheet's casting is wide up to about 0.44 m, while the model has a 0.26 m drum and a thin pipe.
  - The tank sits about 3.5 cm too high, and the air cleaner sits too low.
  - The sheet has engine parts under the air cleaner, which the model leaves empty.
  - The starter cover is a rounded-square shroud with a round grille, not a disc.
- **Water pump, side:**
  - The pump casting sits too far back.
  - The suction nipple is too short. On the sheet it sticks out about 0.10 m past the cage.
  - The crankcase runs too far to the rear, where the sheet shows open background.
- **Parts crate:** right as it is. Since it's symmetric, I've added back and −x views using its own front and side drawings, so those faces aren't painted by a guess.

```json
{"objects": [
  {"name": "water_pump", "size_m": [0.72, 0.565, 0.615],
   "views": [
     {"label": "front", "box": [37, 24, 428, 333], "cam": [0, 0, 1], "up": [0, 1, 0]},
     {"label": "side", "box": [492, 29, 831, 333], "cam": [1, 0, 0], "up": [0, 1, 0]},
     {"label": "top", "box": [893, 38, 1233, 318], "cam": [0, 1, 0], "up": [0, 0, -1]}
   ]},
  {"name": "parts_crate", "size_m": [0.944, 0.43, 0.47],
   "views": [
     {"label": "front", "box": [24, 381, 536, 616], "cam": [0, 0, 1], "up": [0, 1, 0]},
     {"label": "side", "box": [599, 382, 859, 616], "cam": [1, 0, 0], "up": [0, 1, 0]},
     {"label": "top", "box": [946, 374, 1386, 622], "cam": [0, 1, 0], "up": [0, 0, -1]},
     {"label": "back", "box": [24, 381, 536, 616], "cam": [0, 0, -1], "up": [0, 1, 0]},
     {"label": "left", "box": [599, 382, 859, 616], "cam": [-1, 0, 0], "up": [0, 1, 0]}
   ]},
  {"name": "wire_coil", "size_m": [0.664, 0.47, 0.664],
   "views": [
     {"label": "front", "box": [88, 684, 456, 946], "cam": [0, 0, 1], "up": [0, 1, 0]},
     {"label": "side", "box": [88, 684, 456, 946], "cam": [1, 0, 0], "up": [0, 1, 0]},
     {"label": "back", "box": [88, 684, 456, 946], "cam": [0, 0, -1], "up": [0, 1, 0]},
     {"label": "left", "box": [88, 684, 456, 946], "cam": [-1, 0, 0], "up": [0, 1, 0]},
     {"label": "top", "box": [914, 653, 1202, 937], "cam": [0, 1, 0], "up": [0, 0, -1]}
   ]}
 ],
 "notes": "Scale bar is 1 m ≈ 545 px. The set is:\n- a petrol water pump in a red tube cage, 0.72 × 0.565 m with a 0.52 m deep cage; the suction nipple on the +x pump faces front and reaches 0.615 m overall\n- a rope-handled wooden parts crate, 0.80 × 0.43 × 0.47 m\n- a flat-lying fence-wire coil, 0.66 m across × 0.47 m tall\n\nThe top views are drawn about 14% smaller than the front views.\n\nThe coil's own side drawing shows it standing on edge, which contradicts its front and top views. The coil is round, so its front drawing is reused for the side, back and left. The crate is symmetric, so its front and side drawings are reused for its back and left. The pump's back and left aren't drawn.\n\nThe coil's top-view overlap is limited by the through-hole being counted on only one outline; the hole size matches the drawing.\n\nThe rolled fire hose is only a three-quarter drawing, so it isn't modelled."}
```

```js
function build(THREE) {
  const C = {
    paint_red: 0xa23a30, rusty_red_iron: 0x8a4a3c, cast_aluminium: 0x8b8477,
    paint_cream: 0xcbc1a9, paint_black: 0x3c3a37, black_plastic: 0x2e2c2a,
    rubber: 0x38332e, rusty_iron: 0x6b5141, timber: 0xa08b6c, rope: 0xa6895c,
    galvanised_wire: 0x86827a
  };
  const mats = {};
  function M(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: C[name] });
    return mats[name];
  }
  function add(parent, geo, name, x, y, z) {
    const m = new THREE.Mesh(geo, M(name));
    m.name = name;
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function rod(parent, name, a, b, r, seg) {
    const va = new THREE.Vector3(a[0], a[1], a[2]);
    const vb = new THREE.Vector3(b[0], b[1], b[2]);
    const dir = new THREE.Vector3().subVectors(vb, va);
    const len = dir.length();
    const m = add(parent, new THREE.CylinderGeometry(r, r, len, seg, 1, true), name,
      (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
  }
  function loopXY(parent, name, cx, cy, hw, hh, rc, z, r) {
    rod(parent, name, [cx - hw + rc, cy + hh, z], [cx + hw - rc, cy + hh, z], r, 8);
    rod(parent, name, [cx - hw + rc, cy - hh, z], [cx + hw - rc, cy - hh, z], r, 8);
    rod(parent, name, [cx - hw, cy - hh + rc, z], [cx - hw, cy + hh - rc, z], r, 8);
    rod(parent, name, [cx + hw, cy - hh + rc, z], [cx + hw, cy + hh - rc, z], r, 8);
    const corners = [
      [cx + hw - rc, cy + hh - rc, 0],
      [cx - hw + rc, cy + hh - rc, Math.PI / 2],
      [cx - hw + rc, cy - hh + rc, Math.PI],
      [cx + hw - rc, cy - hh + rc, Math.PI * 1.5]
    ];
    for (const c of corners) {
      const t = add(parent, new THREE.TorusGeometry(rc, r, 8, 6, Math.PI / 2), name, c[0], c[1], z);
      t.rotation.z = c[2];
    }
  }
  function roundRectShape(w, h, r) {
    const s = new THREE.Shape();
    const x0 = -w / 2, y0 = -h / 2;
    s.moveTo(x0 + r, y0);
    s.lineTo(x0 + w - r, y0);
    s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
    s.lineTo(x0 + w, y0 + h - r);
    s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
    s.lineTo(x0 + r, y0 + h);
    s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
    s.lineTo(x0, y0 + r);
    s.quadraticCurveTo(x0, y0, x0 + r, y0);
    return s;
  }

  // ---------------- WATER PUMP ----------------
  const pump = new THREE.Group();
  const fr = 0.016, rc = 0.07, hw = 0.344, yb = 0.06, yt = 0.549, zl = 0.244;
  const cy = (yb + yt) / 2, hh = (yt - yb) / 2;
  // front and back rounded frame loops
  loopXY(pump, 'paint_red', 0, cy, hw, hh, rc, zl, fr);
  loopXY(pump, 'paint_red', 0, cy, hw, hh, rc, -zl, fr);
  // top rails joined at 45 deg on the corner bends, bottom skid rails, rubber feet
  const k = rc * Math.SQRT1_2;
  const xr = hw - rc + k, yr = yt - rc + k;
  for (const s of [-1, 1]) {
    rod(pump, 'paint_red', [s * xr, yr, -zl], [s * xr, yr, zl], fr, 8);
    rod(pump, 'paint_red', [s * 0.27, yb, -zl], [s * 0.27, yb, zl], fr, 8);
    for (const t of [-1, 1]) {
      add(pump, new THREE.CylinderGeometry(0.028, 0.03, 0.045, 10), 'rubber', s * 0.27, 0.0225, t * 0.21);
    }
  }
  // base plate
  add(pump, new THREE.BoxGeometry(0.56, 0.025, 0.40), 'rusty_iron', 0, 0.0725, 0);
  // engine crankcase (stops short of the rear, as drawn in the side view)
  add(pump, new THREE.BoxGeometry(0.30, 0.24, 0.24), 'cast_aluminium', -0.07, 0.205, 0.01);
  // lower-left engine block under the air cleaner
  add(pump, new THREE.BoxGeometry(0.10, 0.175, 0.18), 'cast_aluminium', -0.265, 0.1725, 0.03);
  // recoil starter: rounded-square shroud facing front, round grille, hub, grip
  add(pump, new THREE.ExtrudeGeometry(roundRectShape(0.29, 0.235, 0.045),
    { depth: 0.04, bevelEnabled: false, curveSegments: 4 }), 'paint_red', -0.07, 0.207, 0.13);
  const grille = add(pump, new THREE.CylinderGeometry(0.10, 0.10, 0.03, 24), 'paint_red', -0.085, 0.205, 0.18);
  grille.rotation.x = Math.PI / 2;
  const hub = add(pump, new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), 'rusty_iron', -0.085, 0.205, 0.20);
  hub.rotation.x = Math.PI / 2;
  const grip = add(pump, new THREE.BoxGeometry(0.07, 0.024, 0.03), 'black_plastic', -0.19, 0.25, 0.185);
  grip.rotation.z = 0.6;
  // air cleaner (front left, tall) and muffler guard (rear)
  add(pump, new THREE.BoxGeometry(0.145, 0.18, 0.20), 'paint_black', -0.2525, 0.40, 0.07);
  add(pump, new THREE.BoxGeometry(0.36, 0.17, 0.16), 'paint_black', -0.12, 0.385, -0.14);
  // fuel tank (rounded front profile) and cap
  add(pump, new THREE.ExtrudeGeometry(roundRectShape(0.26, 0.14, 0.03),
    { depth: 0.24, bevelEnabled: false, curveSegments: 4 }), 'paint_cream', -0.05, 0.395, -0.07);
  add(pump, new THREE.CylinderGeometry(0.032, 0.035, 0.025, 12), 'black_plastic', -0.05, 0.4775, 0.05);
  // pump: bell housing, volute (forward, near the cage front), foot, tall neck
  const bell = add(pump, new THREE.CylinderGeometry(0.08, 0.08, 0.045, 16), 'rusty_red_iron', 0.0925, 0.22, 0.12);
  bell.rotation.z = Math.PI / 2;
  const vol = add(pump, new THREE.CylinderGeometry(0.12, 0.12, 0.21, 24), 'rusty_red_iron', 0.21, 0.235, 0.175);
  vol.rotation.z = Math.PI / 2;
  add(pump, new THREE.BoxGeometry(0.18, 0.05, 0.15), 'rusty_red_iron', 0.21, 0.11, 0.175);
  add(pump, new THREE.BoxGeometry(0.14, 0.105, 0.13), 'rusty_red_iron', 0.21, 0.3525, 0.175);
  // discharge pipe and cap on top, priming plug on the +x side of the neck
  add(pump, new THREE.CylinderGeometry(0.04, 0.04, 0.06, 12), 'rusty_red_iron', 0.19, 0.42, 0.19);
  add(pump, new THREE.CylinderGeometry(0.05, 0.05, 0.025, 12), 'rusty_iron', 0.19, 0.4575, 0.19);
  const plug = add(pump, new THREE.CylinderGeometry(0.02, 0.02, 0.035, 8), 'rusty_iron', 0.2975, 0.375, 0.175);
  plug.rotation.z = Math.PI / 2;
  // suction flange + hollow threaded nipple pointing front, past the cage
  const fl = add(pump, new THREE.CylinderGeometry(0.066, 0.066, 0.03, 16), 'rusty_red_iron', 0.235, 0.235, 0.285);
  fl.rotation.x = Math.PI / 2;
  const nipProf = [[0.042, 0], [0.054, 0], [0.054, 0.06], [0.042, 0.06], [0.042, 0]]
    .map(p => new THREE.Vector2(p[0], p[1]));
  const nip = add(pump, new THREE.LatheGeometry(nipProf, 14), 'rusty_iron', 0.235, 0.235, 0.295);
  nip.rotation.x = Math.PI / 2;

  // ---------------- PARTS CRATE ----------------
  const crate = new THREE.Group();
  const W = 0.795, D = 0.465, Hb = 0.352;
  add(crate, new THREE.BoxGeometry(W, Hb, D), 'timber', 0, Hb / 2, 0);
  const LW = 0.80, LD = 0.47, LH = 0.078;
  add(crate, new THREE.BoxGeometry(LW, LH, LD), 'timber', 0, Hb + LH / 2, 0);
  const bands = [[0, 0.075, W, D], [0.255, Hb - 0.004, W, D], [Hb + 0.004, Hb + LH, LW, LD]];
  for (const b of bands) {
    const h = b[1] - b[0], yc = (b[0] + b[1]) / 2, w = b[2], d = b[3];
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        add(crate, new THREE.BoxGeometry(0.08, h, 0.005), 'rusty_iron', sx * (w / 2 - 0.04), yc, sz * (d / 2 + 0.0025));
        add(crate, new THREE.BoxGeometry(0.005, h, 0.08), 'rusty_iron', sx * (w / 2 + 0.0025), yc, sz * (d / 2 - 0.04));
      }
    }
  }
  const ropePts = [[0.385, 0.295, -0.085], [0.412, 0.29, -0.085], [0.442, 0.245, -0.072],
    [0.457, 0.195, -0.04], [0.46, 0.172, 0], [0.457, 0.195, 0.04], [0.442, 0.245, 0.072],
    [0.412, 0.29, 0.085], [0.385, 0.295, 0.085]];
  for (const s of [-1, 1]) {
    const pts = ropePts.map(p => new THREE.Vector3(s * p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(pts);
    add(crate, new THREE.TubeGeometry(curve, 24, 0.012, 6, false), 'rope', 0, 0, 0);
  }

  // ---------------- WIRE COIL ----------------
  const coil = new THREE.Group();
  const prof = [[0.185, 0], [0.29, 0], [0.312, 0.008], [0.324, 0.03], [0.33, 0.12], [0.332, 0.235],
    [0.33, 0.35], [0.324, 0.44], [0.312, 0.462], [0.29, 0.47], [0.185, 0.47], [0.17, 0.462],
    [0.165, 0.44], [0.163, 0.235], [0.165, 0.03], [0.17, 0.008], [0.185, 0]]
    .map(p => new THREE.Vector2(p[0], p[1]));
  add(coil, new THREE.LatheGeometry(prof, 32), 'galvanised_wire', 0, 0, 0);

  return { water_pump: pump, parts_crate: crate, wire_coil: coil };
}
```