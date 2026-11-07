You built the 3D model below from Christopher's reference sheet E01 · Gloved hands, open. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"model": {"Front": {"iou": 0.887, "turn_deg": 0.04}, "Back": {"iou": 0.867, "turn_deg": 0.27}, "Left Side": {"iou": 0.835, "turn_deg": 1.66}, "Right Side": {"iou": 0.835, "turn_deg": -0.88}}}
The model's size in metres (x, y, z) and triangles: {"model": {"tris": 5368, "size": [0.438, 0.158, 0.44], "min": [-0.219, 0, -0.22]}}

Your code and the views you gave:
```json
{"objects": [{"name": "gloved_hands", "size_m": [0.44, 0.16, 0.44],
  "views": [
    {"label": "Front", "box": [35, 11, 433, 385], "cam": [0, 1, 0], "up": [0, 0, 1]},
    {"label": "Back", "box": [499, 12, 867, 384], "cam": [0, -1, 0], "up": [0, 0, 1]},
    {"label": "Left Side", "box": [27, 472, 433, 630], "cam": [-1, 0, 0], "up": [0, 1, 0]},
    {"label": "Right Side", "box": [476, 480, 885, 630], "cam": [1, 0, 0], "up": [0, 1, 0]}
  ]}],
 "notes": "A pair of worn tan leather gloves with a buttoned wrist strap, a strip of bare wrist and rolled khaki sleeve cuffs. They are modelled in the horizontal resting pose: backs of the hands up, fingers toward +z, the wearer's left hand at +x. The sheet's 'Front' and 'Back' are really the straight-down view (backs of the hands) and the straight-up view (palms). 'Left Side' shows the right hand's outer side, seen from -x. 'Top' is an oblique view from behind, so it is left out along with Three-Quarter and the wearer's view. The scale bar (10 cm = 88 px) gives gloves about 30 cm long and 44 cm across both arms. That is roughly 1.25x a real hand, kept as drawn."}

```
```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'gloved_hands';

  const mats = {
    leather: new THREE.MeshStandardMaterial({ color: 0x846239, roughness: 0.85, metalness: 0.0 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0x6e5847, roughness: 0.55, metalness: 0.5 }),
    skin: new THREE.MeshStandardMaterial({ color: 0x8f6c4e, roughness: 0.8, metalness: 0.0 }),
    canvas: new THREE.MeshStandardMaterial({ color: 0x949077, roughness: 0.95, metalness: 0.0 })
  };
  const UP = new THREE.Vector3(0, 1, 0);
  const DEG = Math.PI / 180;

  function mk(geo, name) {
    const m = new THREE.Mesh(geo, mats[name]);
    m.name = name;
    return m;
  }
  // tapered open cylinder from point a (radius r0) to point b (radius r1)
  function rod(parent, a, b, r0, r1, name, radial) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = mk(new THREE.CylinderGeometry(r1, r0, len, radial, 1, true), name);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, dir.normalize());
    parent.add(m);
    return m;
  }
  function ball(parent, p, r, name, ws, hs) {
    const m = mk(new THREE.SphereGeometry(r, ws, hs), name);
    m.position.copy(p);
    parent.add(m);
    return m;
  }
  function pad(parent, p, sx, sy, sz, name) {
    const m = mk(new THREE.SphereGeometry(1, 10, 8), name);
    m.position.copy(p);
    m.scale.set(sx, sy, sz);
    parent.add(m);
    return m;
  }
  // elliptical tube along z: x-radius rx0 at z0, rx1 at z1, y-radius = rx * aspect
  function zTube(parent, name, cx, cy, z0, z1, rx0, rx1, aspect, radial, open) {
    const geo = new THREE.CylinderGeometry(rx1, rx0, z1 - z0, radial, 1, open);
    geo.rotateX(Math.PI / 2); // axis along z, top (rx1) toward +z
    const m = mk(geo, name);
    m.position.set(cx, cy, (z0 + z1) / 2);
    m.scale.set(1, aspect, 1);
    parent.add(m);
    return m;
  }

  // side = +1: wearer's left hand (at +x); side = -1: right hand (at -x). Thumbs face the midline.
  function arm(side) {
    const g = new THREE.Group();
    g.name = side > 0 ? 'left_arm' : 'right_arm';
    const X = (d) => side * d;
    const V = (d, y, z) => new THREE.Vector3(side * d, y, z);

    // --- rolled khaki sleeve ---
    zTube(g, 'canvas', X(0.140), 0.071, -0.22, -0.145, 0.074, 0.075, 0.93, 16, false);
    zTube(g, 'canvas', X(0.140), 0.073, -0.15, -0.108, 0.079, 0.078, 0.925, 16, false);
    const lip = mk(new THREE.TorusGeometry(0.066, 0.011, 6, 16), 'canvas');
    lip.position.set(X(0.139), 0.074, -0.108);
    lip.scale.set(1, 0.93, 1);
    g.add(lip);

    // --- bare wrist between sleeve and glove ---
    zTube(g, 'skin', X(0.128), 0.095, -0.14, -0.078, 0.057, 0.057, 0.78, 12, true);

    // --- glove cuff (slight flare at the open end) ---
    zTube(g, 'leather', X(0.124), 0.097, -0.088, -0.024, 0.070, 0.065, 0.70, 16, false);
    // wrist strap band
    zTube(g, 'leather', X(0.124), 0.095, -0.076, -0.036, 0.072, 0.072, 0.74, 16, true);
    // strap button on the back of the wrist
    const btn = mk(new THREE.CylinderGeometry(0.0145, 0.0145, 0.007, 12), 'bronze');
    btn.position.set(X(0.139), 0.149, -0.056);
    btn.rotation.z = -side * 0.16;
    g.add(btn);

    // --- back of hand / palm slab (outline from the top-down view) ---
    const pts = [
      [0.066, -0.040], [0.056, 0.020], [0.058, 0.080], [0.072, 0.094],
      [0.100, 0.100], [0.134, 0.095], [0.161, 0.083], [0.179, 0.066],
      [0.185, 0.000], [0.180, -0.040]
    ];
    const shape = new THREE.Shape();
    pts.forEach((p, i) => {
      const sx = side * p[0];
      const sy = -p[1]; // after rotation.x = -PI/2, model z = -sy
      if (i === 0) shape.moveTo(sx, sy); else shape.lineTo(sx, sy);
    });
    shape.closePath();
    const palmGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.050, bevelEnabled: true, bevelThickness: 0.011,
      bevelSize: 0.008, bevelSegments: 2, curveSegments: 4
    });
    const palm = mk(palmGeo, 'leather');
    palm.rotation.x = -Math.PI / 2;
    palm.position.y = 0.086 + 0.011; // slab spans y 0.086 .. 0.158
    g.add(palm);

    // palm pads under the hand (thumb side and heel)
    pad(g, V(0.078, 0.088, 0.012), 0.032, 0.028, 0.050, 'leather');
    pad(g, V(0.158, 0.088, 0.000), 0.030, 0.026, 0.055, 'leather');

    // --- four fingers, relaxed curl (reach = outline tip z from the top view) ---
    const fingers = [
      { d: 0.062, y: 0.134, z: 0.088, r: 0.0145, yaw: -0.04, curl: [6, 24, 44], reach: 0.205 }, // index
      { d: 0.098, y: 0.136, z: 0.092, r: 0.0150, yaw: 0.00, curl: [8, 28, 50], reach: 0.221 },  // middle
      { d: 0.135, y: 0.134, z: 0.088, r: 0.0142, yaw: 0.04, curl: [9, 30, 54], reach: 0.212 },  // ring
      { d: 0.172, y: 0.128, z: 0.070, r: 0.0125, yaw: 0.10, curl: [12, 38, 64], reach: 0.165 }  // little
    ];
    const ratio = [0.44, 0.30, 0.26];
    fingers.forEach((f) => {
      const phis = f.curl.map((a) => a * DEG);
      const rad = [f.r, f.r * 0.95, f.r * 0.9, f.r * 0.86];
      let k = 0;
      for (let i = 0; i < 3; i++) k += ratio[i] * Math.cos(phis[i]);
      k *= Math.cos(f.yaw);
      const L = (f.reach - f.z - rad[3]) / k;
      let p = V(f.d, f.y, f.z);
      for (let i = 0; i < 3; i++) {
        const dir = new THREE.Vector3(
          side * Math.sin(f.yaw) * Math.cos(phis[i]),
          -Math.sin(phis[i]),
          Math.cos(f.yaw) * Math.cos(phis[i])
        );
        const q = p.clone().addScaledVector(dir, L * ratio[i]);
        rod(g, p, q, rad[i], rad[i + 1], 'leather', 10);
        ball(g, q, rad[i + 1], 'leather', 10, 6);
        p = q;
      }
    });

    // --- thumb: hangs below the palm, angled forward and toward the midline ---
    const tp = [
      V(0.074, 0.092, -0.012),
      V(0.044, 0.070, 0.045),
      V(0.031, 0.055, 0.088),
      V(0.027, 0.047, 0.114)
    ];
    const tr = [0.021, 0.0185, 0.0165, 0.015];
    for (let i = 0; i < 3; i++) {
      rod(g, tp[i], tp[i + 1], tr[i], tr[i + 1], 'leather', 10);
      ball(g, tp[i + 1], tr[i + 1], 'leather', 10, 6);
    }

    return g;
  }

  root.add(arm(1));
  root.add(arm(-1));
  return root;
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that), and any flat view
on the sheet that's missing from the list (both sides when both are drawn: a face no view shows is painted by a guess). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 8,000.
