You built the 3D model below from Christopher's reference sheet C12 · The Causeway, cross-section. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"model": {"Front": {"iou": 0.903, "turn_deg": 0.02}, "Side": {"iou": 0.969, "turn_deg": 0.0}, "Back": {"iou": 0.864, "turn_deg": -0.0}, "Top": {"iou": 0.923, "turn_deg": 0.0}}}
The model's size in metres (x, y, z) and triangles: {"model": {"tris": 882, "size": [9.02, 1.777, 10.014], "min": [-4.51, -0.017, -5]}}

Your code and the views you gave:
```json
{
  "objects": [
    {
      "name": "causeway",
      "size_m": [9.0, 1.5, 10.0],
      "views": [
        {"label": "Front", "box": [77, 82, 585, 198], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Side", "box": [621, 81, 1509, 198], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "Back", "box": [67, 398, 579, 521], "cam": [0, 0, -1], "up": [0, 1, 0]},
        {"label": "Top", "box": [628, 306, 1509, 615], "cam": [0, 1, 0], "up": [-1, 0, 0]}
      ]
    }
  ],
  "notes": "A 10 m section of a stepped, dry-laid stone causeway: 9.0 m wide at the base, 6.0 m across the top and 1.5 m high (sheet dimensions and scale bar). The front view is the cross-section to sweep, with length along z. The ends also step in about 0.5 m. There is a drain mouth on the +x side of the front face, a slumped collapse on the +x flank toward the back, and two scupper gaps in the -x kerb. The sheet's top view is squashed across its width (not to scale), so the front view's dimensions take precedence."
}

```
```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'causeway';

  const COLORS = {
    stone: 0x6b5d4b,
    capstone: 0x8a7b66,
    paving_stone: 0x7b6c58,
    rubble_stone: 0x857560,
    dirt: 0x8f6d43,
    dry_grass: 0xa98a50,
    shadow: 0x17130f
  };
  const mats = {};
  function mat(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name] });
    return mats[name];
  }
  function add(geo, name, x, y, z, rx, ry, rz) {
    const m = new THREE.Mesh(geo, mat(name));
    m.name = name;
    m.position.set(x, y, z);
    m.rotation.set(rx || 0, ry || 0, rz || 0);
    root.add(m);
    return m;
  }
  function box(name, x0, x1, y0, y1, z0, z1) {
    return add(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), name,
      (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  }
  function extrude(name, poly, z0, z1) {
    if (poly.length < 3 || z1 - z0 < 0.001) return null;
    const s = new THREE.Shape();
    s.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) s.lineTo(poly[i][0], poly[i][1]);
    const g = new THREE.ExtrudeGeometry(s, { depth: z1 - z0, bevelEnabled: false, steps: 1, curveSegments: 1 });
    return add(g, name, 0, 0, z0);
  }

  // ---- collapse (slump) on the +x flank, toward the back ----
  const X0 = 2.6, Y0 = 1.30, K = 1.525;          // slump line: x = X0 + (Y0 - y) * K
  const slumpF = (x, y) => x - (X0 + (Y0 - y) * K); // keep where <= 0
  const ZB0 = -2.25, ZB1 = -0.70;                // breach z-range
  function clip(poly) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const fa = slumpF(a[0], a[1]), fb = slumpF(b[0], b[1]);
      if (fa <= 0) out.push(a);
      if ((fa < 0 && fb > 0) || (fa > 0 && fb < 0)) {
        const t = fa / (fa - fb);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  }

  // ---- stepped, battered tiers (cross-section from the Front view) ----
  // [y0, y1, halfWidthBottom, halfWidthTop, halfLength]
  const tiers = [
    [0.00, 0.28, 4.50, 4.30, 5.00],  // base plinth
    [0.28, 0.42, 4.20, 4.16, 4.88],  // lower ledge course
    [0.42, 0.66, 4.02, 3.86, 4.80],  // lower wall
    [0.66, 0.82, 3.92, 3.88, 4.72],  // projecting ledge course
    [0.82, 1.10, 3.62, 3.25, 4.62],  // upper wall
    [1.10, 1.30, 3.14, 3.08, 4.56]   // upper course
  ];
  tiers.forEach(function (t) {
    const y0 = t[0], y1 = t[1], wb = t[2], wt = t[3], hl = t[4];
    const poly = [[-wb, y0], [wb, y0], [wt, y1], [-wt, y1]];
    extrude('stone', poly, -hl, ZB0);
    extrude('stone', clip(poly), ZB0, ZB1);
    extrude('stone', poly, ZB1, hl);
  });

  // ---- deck paving and kerbs ----
  box('paving_stone', -2.5, 2.5, 1.30, 1.42, -4.5, 4.5);
  const KX0 = 2.5, KX1 = 3.04;
  // -x kerb with two scupper gaps
  [[-4.5, -2.65], [-2.15, 0.95], [1.45, 4.5]].forEach(function (p) {
    box('capstone', -KX1, -KX0, 1.30, 1.50, p[0], p[1]);
  });
  [[-2.65, -2.15], [0.95, 1.45]].forEach(function (p) {
    box('shadow', -KX1 + 0.04, -KX0, 1.30, 1.33, p[0], p[1]);
  });
  // +x kerb, broken over the collapse
  [[-4.5, -2.25], [-0.70, 4.5]].forEach(function (p) {
    box('capstone', KX0, KX1, 1.30, 1.50, p[0], p[1]);
  });
  // displaced kerb blocks slumping down the breach
  add(new THREE.BoxGeometry(0.54, 0.20, 0.52), 'capstone', 2.86, 1.22, -0.98, 0.06, 0.12, -0.32);
  add(new THREE.BoxGeometry(0.52, 0.20, 0.50), 'capstone', 3.12, 1.02, -1.50, -0.10, -0.18, -0.52);
  add(new THREE.BoxGeometry(0.50, 0.20, 0.45), 'capstone', 4.05, 0.13, -2.00, 0.10, 0.40, -0.15);

  // ---- soil face of the slump ----
  (function () {
    const ax = X0 + (Y0 - 1.28) * K, ay = 1.28;
    const bx = X0 + (Y0 - 0.10) * K, by = 0.10;
    const len = Math.hypot(bx - ax, by - ay);
    const th = Math.atan2(by - ay, bx - ax);
    const nx = -Math.sin(th), ny = Math.cos(th);
    add(new THREE.BoxGeometry(len, 0.06, (ZB1 - ZB0) - 0.06), 'dirt',
      (ax + bx) / 2 + nx * 0.02, (ay + by) / 2 + ny * 0.02, (ZB0 + ZB1) / 2, 0, 0, th);
  })();

  // ---- rubble from the collapse (fixed seeded sequence) ----
  let seed = 20240611;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  for (let i = 0; i < 14; i++) {
    const sx = 0.22 + rnd() * 0.20, sy = 0.14 + rnd() * 0.10, sz = 0.20 + rnd() * 0.18;
    const x = 3.0 + Math.sqrt(rnd()) * 1.22;
    const z = -2.2 + rnd() * 1.45;
    const ys = Math.max(0, Y0 - (x - X0) / K);
    const tilt = (ys > 0.05 ? -0.55 : -0.1) + (rnd() - 0.5) * 0.5;
    add(new THREE.BoxGeometry(sx, sy, sz), 'rubble_stone',
      x, ys + sy * 0.35, z, (rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.8, tilt);
  }

  // ---- drain mouth on the front face (+x side) ----
  const FZ0 = 4.40, FZ1 = 4.71;
  box('capstone', 2.00, 2.14, 0.90, 1.50, FZ0, FZ1); // left jamb
  box('capstone', 2.64, 2.80, 0.90, 1.50, FZ0, FZ1); // right jamb
  box('capstone', 2.14, 2.64, 0.90, 0.97, FZ0, FZ1); // sill
  box('capstone', 2.14, 2.64, 1.30, 1.50, FZ0, FZ1); // lintel
  box('shadow', 2.14, 2.64, 0.97, 1.30, 4.30, 4.635); // recessed dark opening

  // ---- dry grass tufts ----
  const tuftGeo = new THREE.ConeGeometry(0.07, 0.26, 5);
  function tuft(x, y, z, s) {
    const m = add(tuftGeo, 'dry_grass', x, y + 0.13 * s, z);
    m.scale.set(s, s, s);
  }
  [4.2, 3.0, 1.6, 0.4, -3.0, -4.3].forEach(function (z, i) { tuft(4.43, 0, z, 0.9 + (i % 3) * 0.15); });
  [4.5, 3.3, 2.0, 0.6, -0.8, -2.0, -3.4, -4.4].forEach(function (z, i) { tuft(-4.43, 0, z, 0.9 + (i % 3) * 0.15); });
  [-3.6, -2.0, -0.5, 1.2, 3.1].forEach(function (x, i) { tuft(x, 0.28, 4.94, 0.85 + (i % 2) * 0.2); });
  [-3.2, -1.4, 0.8, 2.6].forEach(function (x, i) { tuft(x, 0.28, -4.94, 0.85 + (i % 2) * 0.2); });
  tuft(-2.8, 1.50, 4.2, 1.0);
  tuft(2.35, 1.42, 2.6, 0.9);
  tuft(-2.30, 1.42, -1.0, 1.0);
  tuft(0.4, 1.42, -3.5, 0.8);
  tuft(-1.2, 1.42, 1.2, 0.8);
  tuft(3.3, 0.85, -1.2, 0.9);

  return root;
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that), and any flat view
on the sheet that's missing from the list (both sides when both are drawn: a face no view shows is painted by a guess). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 20,000.
