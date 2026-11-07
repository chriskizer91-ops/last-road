You built the 3D model below from Christopher's reference sheet D05 · The Pan Wreck. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"model": {"Front View": {"iou": 0.83, "turn_deg": 0.35}, "Side View": {"iou": 0.769, "turn_deg": 0.75}, "Back View": {"iou": 0.813, "turn_deg": -2.26}, "Top View": {"iou": 0.941, "turn_deg": 0.17}}}
The model's size in metres (x, y, z) and triangles: {"model": {"tris": 4912, "size": [2.38, 1.95, 7.36], "min": [-1.19, 0, -3.66]}}

Your code and the views you gave:
```json
{
  "objects": [
    {
      "name": "pan_wreck",
      "size_m": [2.36, 1.95, 7.36],
      "views": [
        {"label": "Front View", "box": [1092, 20, 1478, 352], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Side View", "box": [60, 435, 976, 678], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "Back View", "box": [1111, 444, 1459, 693], "cam": [0, 0, -1], "up": [0, 1, 0]},
        {"label": "Top View", "box": [216, 760, 956, 974], "cam": [0, 1, 0], "up": [-1, 0, 0]}
      ]
    }
  ],
  "notes": "A 1950s-style bonneted 6x4 flatbed truck rusting on the salt pan. It has a glassless cab with the driver door hanging open on +x, tandem dual rear axles, and a stake bed with broken rails and loose planks. The scale bar (100 px/m) fits the top view, giving about 7.4 m long. The side, front and back views are drawn at larger scales that don't agree with each other (the back view reads wider), so I used a width of about 2.35 m and took the 1.95 m height from the side-view proportions. The top view may be mirrored, since a door-like part sticks out on its top (-x) edge."
}

```
```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'pan_wreck';

  const M = {
    rusted_paint: new THREE.MeshStandardMaterial({ color: 0x87705e, roughness: 0.9, metalness: 0.15 }),
    rusty_iron:   new THREE.MeshStandardMaterial({ color: 0x7b4529, roughness: 0.95, metalness: 0.2 }),
    timber:       new THREE.MeshStandardMaterial({ color: 0x8a7e70, roughness: 1.0, metalness: 0.0 }),
    rubber:       new THREE.MeshStandardMaterial({ color: 0x3c3835, roughness: 1.0, metalness: 0.0 }),
    worn_leather: new THREE.MeshStandardMaterial({ color: 0x5b3d2b, roughness: 0.9, metalness: 0.0 }),
    dark_rust:    new THREE.MeshStandardMaterial({ color: 0x33251c, roughness: 1.0, metalness: 0.1 })
  };

  // ---------- helpers ----------
  function add(geom, name, parent) {
    const m = new THREE.Mesh(geom, M[name]);
    m.name = name;
    (parent || root).add(m);
    return m;
  }
  function box(name, xa, xb, ya, yb, za, zb, parent) {
    const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
    const y0 = Math.min(ya, yb), y1 = Math.max(ya, yb);
    const z0 = Math.min(za, zb), z1 = Math.max(za, zb);
    const m = add(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), name, parent);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return m;
  }
  function dist(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  function orient(m, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const h = Math.sqrt(dx * dx + dz * dz);
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    m.rotation.set(-Math.atan2(dy, h), Math.atan2(dx, dz), 0, 'YXZ');
    return m;
  }
  function beam(name, a, b, w, t, parent) {
    return orient(add(new THREE.BoxGeometry(w, t, dist(a, b)), name, parent), a, b);
  }
  function rod(name, a, b, r, seg, parent) {
    const g = new THREE.CylinderGeometry(r, r, dist(a, b), seg);
    g.rotateX(Math.PI / 2);
    return orient(add(g, name, parent), a, b);
  }
  function cylX(name, r, w, x, y, z, seg, parent) {
    const m = add(new THREE.CylinderGeometry(r, r, w, seg), name, parent);
    m.rotation.z = Math.PI / 2;
    m.position.set(x, y, z);
    return m;
  }
  function shapeOf(pts) {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    return s;
  }
  function exOpts(depth, bev, segs) {
    return {
      depth: depth, steps: 1, curveSegments: 4,
      bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev,
      bevelOffset: -bev, bevelSegments: segs
    };
  }
  // profile drawn in (z, y), extruded across x from x0 to x1
  function sideExtrude(name, pts, x0, x1, bev, segs, parent) {
    const g = new THREE.ExtrudeGeometry(shapeOf(pts), exOpts(x1 - x0 - 2 * bev, bev, segs));
    const m = add(g, name, parent);
    m.rotation.y = -Math.PI / 2;
    m.position.x = x1 - bev;
    return m;
  }
  // profile drawn in (x, y), extruded along z from z0 to z1
  function frontExtrude(name, pts, z0, z1, bev, segs, parent) {
    const g = new THREE.ExtrudeGeometry(shapeOf(pts), exOpts(z1 - z0 - 2 * bev, bev, segs));
    const m = add(g, name, parent);
    m.position.z = z0 + bev;
    return m;
  }
  function wheel(x, y, z, r, w, s, hub) {
    cylX('rubber', r, w, x, y, z, 24);
    cylX('rusty_iron', r * 0.62, w + 0.02, x, y, z, 16);
    if (hub) cylX('rusty_iron', 0.11, 0.07, x + s * (w / 2 + 0.035), y, z, 10);
  }

  // ---------- bonnet (hood) ----------
  sideExtrude('rusted_paint', [
    [1.86, 0.45], [3.44, 0.42], [3.50, 0.50], [3.53, 1.10], [3.50, 1.24],
    [3.42, 1.32], [3.25, 1.37], [2.60, 1.39], [1.86, 1.41]
  ], -0.62, 0.62, 0.10, 3);

  // grille
  box('dark_rust', -0.40, 0.40, 0.46, 1.24, 3.47, 3.55);
  for (let i = 0; i < 9; i++) {
    const y = 0.52 + i * 0.085;
    box('rusty_iron', -0.39, 0.39, y - 0.015, y + 0.015, 3.53, 3.58);
  }
  box('rusty_iron', -0.025, 0.025, 0.46, 1.24, 3.53, 3.59);
  box('rusty_iron', -0.43, 0.43, 1.22, 1.27, 3.50, 3.58);
  for (const s of [-1, 1]) box('rusty_iron', s * 0.39, s * 0.43, 0.46, 1.25, 3.50, 3.58);

  // ---------- front fenders (pontoon wings with wheel arch) ----------
  const fpts = [[1.76, 0.33], [2.06, 0.33]];
  for (let i = 1; i < 10; i++) {
    const t = Math.PI - i * Math.PI / 10;
    fpts.push([2.74 + 0.68 * Math.cos(t), 0.33 + 0.46 * Math.sin(t)]);
  }
  fpts.push([3.42, 0.33], [3.56, 0.35], [3.65, 0.48], [3.67, 0.64], [3.60, 0.80],
            [3.44, 0.93], [3.15, 1.00], [2.70, 1.03], [2.30, 0.99], [2.02, 0.85],
            [1.84, 0.64], [1.77, 0.46]);
  sideExtrude('rusted_paint', fpts, 0.50, 1.15, 0.07, 2);
  sideExtrude('rusted_paint', fpts, -1.15, -0.50, 0.07, 2);

  // empty headlight sockets
  for (const s of [-1, 1]) {
    const ring = add(new THREE.TorusGeometry(0.11, 0.025, 6, 16), 'rusty_iron');
    ring.position.set(s * 0.80, 0.72, 3.645);
    const hole = add(new THREE.CylinderGeometry(0.10, 0.10, 0.03, 14), 'dark_rust');
    hole.rotation.x = Math.PI / 2;
    hole.position.set(s * 0.80, 0.72, 3.63);
  }

  // front bumper
  box('rusty_iron', -1.15, 1.15, 0.20, 0.42, 3.56, 3.70);

  // running boards
  for (const s of [-1, 1]) box('rusty_iron', s * 0.86, s * 1.14, 0.26, 0.32, 0.55, 1.80);

  // ---------- cab (hollow, glassless) ----------
  box('rusted_paint', -0.90, 0.90, 0.36, 0.70, 0.58, 1.82);          // floor / underbody
  box('rusted_paint', -0.91, 0.91, 0.36, 1.48, 0.52, 0.58);          // back wall lower
  for (const s of [-1, 1]) box('rusted_paint', s * 0.44, s * 0.91, 1.48, 1.76, 0.52, 0.58); // rear window sides
  box('rusted_paint', -0.91, 0.91, 1.76, 1.84, 0.52, 0.58);          // rear header
  box('rusted_paint', -0.91, 0.91, 0.36, 1.44, 1.82, 1.88);          // cowl / firewall
  // left (-x) side: closed door side
  box('rusted_paint', -0.91, -0.85, 0.36, 1.40, 0.58, 1.82);
  box('rusted_paint', -0.91, -0.85, 1.40, 1.84, 0.58, 0.84);
  // right (+x) side: open door side
  box('rusted_paint', 0.85, 0.91, 0.36, 1.84, 0.58, 0.82);
  box('rusted_paint', 0.85, 0.91, 0.36, 1.40, 1.74, 1.82);
  // windscreen frame
  for (const s of [-1, 1]) beam('rusted_paint', [s * 0.88, 1.42, 1.85], [s * 0.88, 1.82, 1.66], 0.06, 0.07);
  beam('rusted_paint', [0, 1.43, 1.85], [0, 1.80, 1.67], 0.04, 0.04);
  box('rusted_paint', -0.91, 0.91, 1.76, 1.82, 1.62, 1.74);
  // roof
  frontExtrude('rusted_paint', [
    [-0.91, 1.80], [0.91, 1.80], [0.91, 1.87], [0.87, 1.92], [0.78, 1.95],
    [-0.78, 1.95], [-0.87, 1.92], [-0.91, 1.87]
  ], 0.52, 1.74, 0.04, 2);

  // mirror arms
  for (const s of [-1, 1]) {
    rod('rusty_iron', [s * 0.91, 1.46, 1.80], [s * 1.10, 1.64, 1.79], 0.012, 6);
    box('rusty_iron', s * 1.08, s * 1.15, 1.60, 1.80, 1.77, 1.81);
  }

  // interior
  box('rusted_paint', -0.85, 0.85, 1.16, 1.40, 1.70, 1.82);          // dashboard
  box('worn_leather', -0.80, 0.80, 0.70, 0.96, 0.66, 1.12);          // bench cushion
  box('worn_leather', -0.80, 0.80, 0.96, 1.46, 0.60, 0.74);          // backrest
  const wheelRing = add(new THREE.TorusGeometry(0.20, 0.022, 6, 20), 'rusty_iron');
  wheelRing.position.set(0.42, 1.42, 1.40);
  wheelRing.rotation.x = 1.0;
  rod('rusty_iron', [0.42, 1.42, 1.40], [0.42, 0.95, 1.70], 0.03, 8);
  rod('rusty_iron', [0.05, 0.70, 1.58], [-0.02, 1.15, 1.40], 0.015, 6);

  // open driver door (+x), hinged at its front edge
  const door = new THREE.Group();
  door.name = 'driver_door';
  door.position.set(0.91, 0, 1.74);
  door.rotation.y = -0.28;
  root.add(door);
  box('rusted_paint', -0.06, 0, 0.36, 1.40, -0.92, 0, door);
  box('rusted_paint', -0.05, -0.01, 1.40, 1.80, -0.92, -0.86, door);
  box('rusted_paint', -0.05, -0.01, 1.76, 1.80, -0.86, -0.20, door);
  beam('rusted_paint', [-0.03, 1.40, -0.03], [-0.03, 1.78, -0.21], 0.04, 0.04, door);
  box('rusty_iron', 0, 0.03, 1.17, 1.21, -0.84, -0.70, door);

  // ---------- chassis ----------
  for (const s of [-1, 1]) {
    box('rusty_iron', s * 0.40, s * 0.48, 0.46, 0.70, -3.58, 3.50);   // frame rails
    box('rusty_iron', s * 0.40, s * 0.48, 0.38, 0.46, -3.00, -1.15);  // rear springs
  }
  box('rusty_iron', -0.48, 0.48, 0.46, 0.70, -3.58, -3.50);          // rear crossmember
  box('rusty_iron', -0.08, 0.08, 0.55, 0.66, -3.66, -3.58);          // tow hitch
  box('rusty_iron', -0.80, 0.80, 0.45, 0.55, 2.69, 2.79);            // front axle beam
  for (const z of [-1.59, -2.57]) {
    cylX('rusty_iron', 0.07, 1.0, 0, 0.475, z, 10);
    const diff = add(new THREE.SphereGeometry(0.17, 12, 8), 'rusty_iron');
    diff.position.set(0, 0.45, z);
  }
  box('rusty_iron', 0.55, 0.98, 0.40, 0.74, -0.95, 0.32);            // tool box (+x)
  rod('rusty_iron', [-0.76, 0.56, 0.30], [-0.76, 0.56, -0.90], 0.17, 14); // fuel tank (-x)

  // ---------- wheels ----------
  for (const s of [-1, 1]) {
    wheel(s * 0.90, 0.50, 2.74, 0.50, 0.26, s, true);
    for (const z of [-1.59, -2.57]) {
      wheel(s * 0.625, 0.475, z, 0.475, 0.26, s, false);
      wheel(s * 0.905, 0.475, z, 0.475, 0.26, s, true);
    }
  }

  // ---------- flatbed ----------
  for (const s of [-1, 1]) {
    box('rusty_iron', s * 0.40, s * 0.48, 0.70, 0.80, -3.59, 0.46);   // bed sills
    box('rusty_iron', s * 1.12, s * 1.18, 0.76, 1.00, -3.65, 0.52);   // side rails
  }
  box('rusty_iron', -1.18, 1.18, 0.76, 1.00, 0.46, 0.52);            // front rail
  box('rusty_iron', -1.18, 1.18, 0.76, 1.00, -3.65, -3.59);          // rear rail
  for (const z of [0.30, -0.35, -0.95, -2.08, -3.30]) {
    box('rusty_iron', -1.12, 1.12, 0.80, 0.94, z - 0.04, z + 0.04);   // crossmembers
  }
  // deck boards with a missing strip
  box('timber', -1.12, -0.30, 0.94, 1.00, -3.59, 0.46);
  box('timber', 0.00, 1.12, 0.94, 1.00, -3.59, 0.46);
  box('timber', -0.30, 0.00, 0.94, 1.00, -3.59, -1.70);
  box('timber', -0.30, 0.00, 0.94, 1.00, -0.15, 0.46);
  // iron straps across the deck
  box('rusty_iron', -1.12, 1.12, 1.00, 1.025, 0.12, 0.22);
  box('rusty_iron', -1.12, 1.12, 1.00, 1.025, -1.70, -1.60);

  // stake posts
  const posts = [[0.42, 1.15], [-1.45, 1.30], [-2.65, 1.46], [-3.55, 1.50]];
  for (const s of [-1, 1]) {
    for (const p of posts) box('rusty_iron', s * 1.11, s * 1.19, 0.76, p[1], p[0] - 0.04, p[0] + 0.04);
  }
  // top rails: -x side intact, +x side broken with a fallen piece
  beam('timber', [-1.15, 1.10, 0.42], [-1.15, 1.37, -3.55], 0.06, 0.10);
  beam('timber', [1.15, 1.25, -1.45], [1.15, 1.37, -3.55], 0.06, 0.10);
  beam('timber', [1.05, 1.03, 0.35], [1.08, 1.31, -1.95], 0.06, 0.10);

  // loose timbers on the bed
  beam('timber', [1.00, 1.025, 0.05], [0.45, 1.025, -3.30], 0.20, 0.05);
  beam('timber', [0.40, 1.03, -0.10], [1.00, 1.12, -3.30], 0.20, 0.05);
  beam('timber', [-0.95, 1.025, -0.55], [-0.72, 1.025, -3.35], 0.20, 0.05);
  beam('timber', [-0.60, 1.025, -2.00], [-0.20, 1.025, -3.20], 0.18, 0.05);
  beam('timber', [-1.00, 1.08, -3.28], [1.00, 1.17, -3.15], 0.20, 0.05);

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
