You built the 3D model below from Christopher's reference sheet E08 · Mail bag, first aid kit, cold box. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"cold_box": {"front (top row, right)": {"iou": 0.976, "turn_deg": -0.1}, "side, +x (middle row, right)": {"iou": 0.953, "turn_deg": 1.5}, "top (bottom row, right)": {"iou": 0.969, "turn_deg": -0.42}}, "first_aid_kit": {"front (top row, middle)": {"iou": 0.943, "turn_deg": 0.03}, "side, +x (middle row, middle)": {"iou": 0.938, "turn_deg": -0.0}, "top (bottom row, middle)": {"iou": 0.956, "turn_deg": 0.05}}, "mail_bag": {"front (top row, left)": {"iou": 0.946, "turn_deg": 4.26}, "side, +x (middle row, left)": {"iou": 0.879, "turn_deg": -0.32}, "top (bottom row, left)": {"iou": 0.931, "turn_deg": 2.88}}}
The model's size in metres (x, y, z) and triangles: {"mail_bag": {"tris": 2024, "size": [0.314, 0.674, 0.251], "min": [-0.157, 0, -0.126]}, "first_aid_kit": {"tris": 556, "size": [0.672, 0.579, 0.334], "min": [-0.336, 0, -0.166]}, "cold_box": {"tris": 1040, "size": [0.825, 0.625, 0.541], "min": [-0.412, 0, -0.269]}}

Your code and the views you gave:
```json
{
  "objects": [
    {
      "name": "mail_bag",
      "size_m": [0.31, 0.67, 0.25],
      "views": [
        {"label": "front (top row, left)", "box": [146, 24, 314, 384], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "side, +x (middle row, left)", "box": [171, 396, 291, 670], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "top (bottom row, left)", "box": [154, 720, 312, 968], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "first_aid_kit",
      "size_m": [0.66, 0.58, 0.34],
      "views": [
        {"label": "front (top row, middle)", "box": [518, 46, 871, 357], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "side, +x (middle row, middle)", "box": [619, 400, 759, 670], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "top (bottom row, middle)", "box": [536, 742, 840, 917], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "cold_box",
      "size_m": [0.825, 0.625, 0.54],
      "views": [
        {"label": "front (top row, right)", "box": [956, 25, 1397, 360], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "side, +x (middle row, right)", "box": [1047, 395, 1302, 670], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "top (bottom row, right)", "box": [983, 698, 1359, 937], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    }
  ],
  "notes": "Cargo set: a patched blue-grey canvas drawstring mail sack with a metal tag (~0.31 x 0.67 m), an olive hard-shell first aid case with a green cross and a top handle (~0.66 x 0.49 m body, 0.58 m with the handle), and a large cream cold box with two front latches (~0.82 x 0.62 x 0.48 m). Scale bar is ~53 px per 10 cm for the top row. The middle and bottom rows are drawn about 15-20% smaller and don't agree exactly on depth, so depths are compromises. The top views show latch-like parts on both front and back edges, so the back gets small hinges. The cross, the patches and the dirt are left to the painted surface."
}

```
```js
function build(THREE) {
  const mats = {};
  function mat(name, color, rough, metal) {
    if (!mats[name]) {
      mats[name] = new THREE.MeshStandardMaterial({
        color: color,
        roughness: rough === undefined ? 0.85 : rough,
        metalness: metal || 0
      });
    }
    return mats[name];
  }
  function add(parent, geo, name, color, rough, metal) {
    const m = new THREE.Mesh(geo, mat(name, color, rough, metal));
    m.name = name;
    parent.add(m);
    return m;
  }
  function box(parent, name, color, w, h, d, x, y, z) {
    const m = add(parent, new THREE.BoxGeometry(w, h, d), name, color);
    m.position.set(x, y, z);
    return m;
  }
  // rounded rectangle as explicit points (no near-duplicate vertices)
  function rrShape(w, h, r, seg, cx, cy) {
    const pts = [];
    const hw = w / 2 - r, hh = h / 2 - r;
    const cs = [[hw, hh], [-hw, hh], [-hw, -hh], [hw, -hh]];
    for (let c = 0; c < 4; c++) {
      for (let i = 0; i <= seg; i++) {
        const a = (c + i / seg) * Math.PI / 2;
        pts.push(new THREE.Vector2(cx + cs[c][0] + r * Math.cos(a), cy + cs[c][1] + r * Math.sin(a)));
      }
    }
    return new THREE.Shape(pts);
  }
  // vertical extrusion of a rounded footprint (w along x, d along z), from y0 to y0+height
  function vExtrude(w, d, r, height, bt, bs, segs, y0) {
    let geo;
    if (bt > 0) {
      const shape = rrShape(w - 2 * bs, d - 2 * bs, Math.max(0.004, r - bs), 5, 0, 0);
      geo = new THREE.ExtrudeGeometry(shape, {
        depth: height - 2 * bt, bevelEnabled: true,
        bevelThickness: bt, bevelSize: bs, bevelSegments: segs, curveSegments: 4
      });
      geo.translate(0, 0, bt);
    } else {
      const shape = rrShape(w, d, r, 5, 0, 0);
      geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 4 });
    }
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, y0, 0);
    return geo;
  }
  // extrusion of a front profile along z, centred on z = 0 with total depth
  function zExtrude(shape, depth, bt, bs, segs) {
    const opts = { depth: depth - 2 * bt, bevelEnabled: bt > 0, curveSegments: 4 };
    if (bt > 0) { opts.bevelThickness = bt; opts.bevelSize = bs; opts.bevelSegments = segs; }
    const geo = new THREE.ExtrudeGeometry(shape, opts);
    geo.translate(0, 0, -depth / 2 + bt);
    return geo;
  }

  const CANVAS = 0x4b5262, ROPE = 0xa89270, TAG = 0x8a867c;
  const OLIVE = 0x5d6539, CREAM = 0xd5cbb3, GREY = 0xb0a994;

  // ================= MAIL BAG =================
  const bag = new THREE.Group();
  bag.name = 'mail_bag';
  const prof = [
    [0.0, 0.0], [0.07, 0.0], [0.12, 0.006], [0.145, 0.022], [0.155, 0.06], [0.157, 0.14],
    [0.154, 0.25], [0.148, 0.35], [0.140, 0.44], [0.126, 0.52], [0.108, 0.585], [0.095, 0.625],
    [0.104, 0.645], [0.113, 0.663], [0.103, 0.674], [0.082, 0.666], [0.07, 0.625], [0.0, 0.605]
  ];
  const sack = add(bag, new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 28), 'canvas', CANVAS);
  sack.scale.z = 0.8;

  // drawstring around the gathered neck
  const ring = add(bag, new THREE.TorusGeometry(0.099, 0.008, 6, 28), 'rope', ROPE);
  ring.rotation.x = Math.PI / 2;
  ring.scale.set(1, 0.8, 1);
  ring.position.y = 0.615;

  // cord hanging down the front to the knot
  const cordPts = [
    [0.02, 0.615, 0.086], [0.045, 0.57, 0.091], [0.065, 0.50, 0.099], [0.078, 0.44, 0.102],
    [0.085, 0.38, 0.104], [0.095, 0.29, 0.104], [0.105, 0.21, 0.101], [0.11, 0.16, 0.098]
  ].map(p => new THREE.Vector3(p[0], p[1], p[2]));
  add(bag, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cordPts), 36, 0.007, 6, false), 'rope', ROPE);

  // knot and dangling tails
  const knot = add(bag, new THREE.SphereGeometry(0.016, 8, 6), 'rope', ROPE);
  knot.position.set(0.11, 0.15, 0.099);
  const tailA = [[0.104, 0.15, 0.1], [0.099, 0.125, 0.106], [0.097, 0.10, 0.11]].map(p => new THREE.Vector3(p[0], p[1], p[2]));
  const tailB = [[0.116, 0.15, 0.098], [0.122, 0.125, 0.101], [0.125, 0.105, 0.103]].map(p => new THREE.Vector3(p[0], p[1], p[2]));
  add(bag, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tailA), 8, 0.006, 5, false), 'rope', ROPE);
  add(bag, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tailB), 8, 0.006, 5, false), 'rope', ROPE);

  // oval metal tag on the cord
  const tag = add(bag, new THREE.CylinderGeometry(0.03, 0.03, 0.005, 16), 'tin', TAG, 0.6, 0.5);
  tag.rotation.x = Math.PI / 2;
  tag.scale.set(1, 1, 1.35);
  tag.position.set(0.081, 0.40, 0.113);

  // ================= FIRST AID KIT =================
  const kit = new THREE.Group();
  kit.name = 'first_aid_kit';
  const KW = 0.66, KH = 0.485, KD = 0.30;

  // main shell (front profile with rounded corners)
  add(kit, zExtrude(rrShape(KW - 0.024, KH - 0.024, 0.023, 4, 0, KH / 2), KD, 0.012, 0.012, 2), 'plastic_olive', OLIVE);
  // lid seam ridge running round the case
  add(kit, vExtrude(KW + 0.012, KD + 0.012, 0.016, 0.017, 0, 0, 0, 0.415), 'plastic_olive', OLIVE);
  // vertical corner ribs, front and back
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box(kit, 'plastic_olive', OLIVE, 0.022, 0.37, 0.008, sx * 0.30, 0.215, sz * (KD / 2 + 0.004));
    }
  }
  for (const sx of [-1, 1]) {
    // front latches: plate down the face plus a cap wrapping over the top edge
    box(kit, 'plastic_olive', OLIVE, 0.062, 0.135, 0.018, sx * 0.19, 0.40, KD / 2 + 0.009);
    box(kit, 'plastic_olive', OLIVE, 0.062, 0.02, 0.055, sx * 0.19, 0.495, KD / 2 - 0.0095);
    // back hinges
    box(kit, 'plastic_olive', OLIVE, 0.062, 0.09, 0.016, sx * 0.19, 0.425, -KD / 2 - 0.008);
    box(kit, 'plastic_olive', OLIVE, 0.062, 0.02, 0.05, sx * 0.19, 0.495, -KD / 2 + 0.009);
    // handle mounts
    box(kit, 'plastic_olive', OLIVE, 0.06, 0.016, 0.075, sx * 0.128, 0.492, 0);
  }
  // carry handle (inverted U, front profile)
  const hs = new THREE.Shape();
  hs.moveTo(-0.15, 0.48);
  hs.lineTo(-0.15, 0.556);
  hs.quadraticCurveTo(-0.15, 0.579, -0.127, 0.579);
  hs.lineTo(0.127, 0.579);
  hs.quadraticCurveTo(0.15, 0.579, 0.15, 0.556);
  hs.lineTo(0.15, 0.48);
  hs.lineTo(0.112, 0.48);
  hs.lineTo(0.112, 0.546);
  hs.lineTo(-0.112, 0.546);
  hs.lineTo(-0.112, 0.48);
  add(kit, zExtrude(hs, 0.05, 0, 0, 0), 'plastic_olive', OLIVE);

  // ================= COLD BOX =================
  const cold = new THREE.Group();
  cold.name = 'cold_box';
  // tub with rounded bottom edges (top bevel hidden under the lid band)
  add(cold, vExtrude(0.79, 0.48, 0.06, 0.49, 0.025, 0.02, 3, 0), 'plastic_cream', CREAM);
  // lid lip band (widest line on the front view)
  add(cold, vExtrude(0.825, 0.505, 0.07, 0.03, 0, 0, 0, 0.466), 'plastic_cream', CREAM);
  // lid straight wall
  add(cold, vExtrude(0.80, 0.49, 0.065, 0.08, 0, 0, 0, 0.494), 'plastic_cream', CREAM);
  // lid crown with rounded top edges
  add(cold, vExtrude(0.80, 0.49, 0.065, 0.131, 0.06, 0.055, 3, 0.494), 'plastic_cream', CREAM);
  for (const sx of [-1, 1]) {
    // front latches: strap, top block on the lid, keeper on the tub
    box(cold, 'plastic_grey', GREY, 0.07, 0.15, 0.022, sx * 0.228, 0.44, 0.251);
    box(cold, 'plastic_grey', GREY, 0.085, 0.04, 0.03, sx * 0.228, 0.515, 0.257);
    box(cold, 'plastic_grey', GREY, 0.08, 0.03, 0.03, sx * 0.228, 0.38, 0.255);
    // back hinges
    box(cold, 'plastic_grey', GREY, 0.08, 0.06, 0.026, sx * 0.228, 0.49, -0.256);
  }

  return { mail_bag: bag, first_aid_kit: kit, cold_box: cold };
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that), and any flat view
on the sheet that's missing from the list (both sides when both are drawn: a face no view shows is painted by a guess). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 6,000.
