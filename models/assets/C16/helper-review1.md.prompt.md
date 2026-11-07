You built the 3D model below from Christopher's reference sheet C16 · The Map Stone. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"model": {"Top": {"iou": 0.971, "turn_deg": 0.02}, "Front": {"iou": 0.976, "turn_deg": -0.1}, "Side": {"iou": 0.953, "turn_deg": -0.75}, "Back": {"iou": 0.971, "turn_deg": 0.39}}}
The model's size in metres (x, y, z) and triangles: {"model": {"tris": 3368, "size": [3.46, 1.34, 1.68], "min": [-1.73, 0, -0.84]}}

Your code and the views you gave:
```json
{
  "objects": [
    {
      "name": "map_stone",
      "size_m": [3.46, 1.34, 1.68],
      "views": [
        {"label": "Top", "box": [31, 18, 894, 602], "cam": [0, 1, 0], "up": [0, 0, -1]},
        {"label": "Front", "box": [18, 695, 597, 917], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Side", "box": [630, 695, 907, 917], "cam": [-1, 0, 0], "up": [0, 1, 0]},
        {"label": "Back", "box": [944, 702, 1508, 917], "cam": [0, 0, -1], "up": [0, 1, 0]}
      ]
    }
  ],
  "notes": "A thick carved relief slab (about 3.46 x 1.68 m, 0.4 m thick) on a two-tier masonry plinth with a projecting band. Its top is carved with a hand rising from a pool, a stream down stepped terraces, a waterfall, channels to three house squares, a sunken pond and a cluster of small city blocks. The scale bar is 167 px = 1 m, which puts the slab top at about 1.27 m. The top view is drawn at a different aspect (1.48) from the elevations (2.06), so I took the depth from the side elevation. I assumed the side view shows the -x end, because the hand bump appears at its left."
}

```
```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'map_stone';

  const mats = {
    stone: new THREE.MeshStandardMaterial({ color: 0x7a5c40, roughness: 0.95, metalness: 0.0 }),
    stone_blocks: new THREE.MeshStandardMaterial({ color: 0x695646, roughness: 0.95, metalness: 0.0 })
  };
  function add(geo, matName, x, y, z) {
    const m = new THREE.Mesh(geo, mats[matName]);
    m.name = matName;
    m.position.set(x || 0, y || 0, z || 0);
    root.add(m);
    return m;
  }

  // ---- overall dimensions (scale bar 167 px = 1 m) ----
  const W = 3.46, D = 1.68;
  const SLAB_BOT = 0.87, BODY_TOP = 1.235, Y0 = 1.275; // Y0 = carved top surface

  // ---- top-view pixel -> model mapping (front at bottom of the top view) ----
  const PX0 = 31, PX1 = 894, PY0 = 18, PY1 = 602;
  const X = (px) => -W / 2 + ((px - PX0) / (PX1 - PX0)) * W;
  const Z = (py) => -D / 2 + ((py - PY0) / (PY1 - PY0)) * D;
  const MX = W / (PX1 - PX0), MZ = D / (PY1 - PY0);

  const v2 = (pts) => pts.map((p) => new THREE.Vector2(X(p[0]), -Z(p[1])));
  function makeShape(points) {
    const pts = points.slice();
    if (THREE.ShapeUtils.isClockWise(pts)) pts.reverse();
    return new THREE.Shape(pts);
  }
  function extrudeShape(shape, yBot, height, bevel) {
    const opts = { depth: height, bevelEnabled: false, curveSegments: 4, steps: 1 };
    let lift = 0;
    if (bevel) {
      opts.bevelEnabled = true;
      opts.bevelSize = bevel.size;
      opts.bevelThickness = bevel.thick;
      opts.bevelSegments = bevel.seg || 2;
      opts.bevelOffset = bevel.offset || 0;
      opts.depth = height - 2 * bevel.thick;
      lift = bevel.thick;
    }
    const g = new THREE.ExtrudeGeometry(shape, opts);
    g.rotateX(-Math.PI / 2); // shape (x, -z) plane -> XZ, extrusion -> +y
    g.translate(0, yBot + lift, 0);
    return g;
  }
  function roundRectPts(w, d, r, seg) {
    const pts = [], hw = w / 2, hd = d / 2;
    const corners = [
      [hw - r, hd - r, 0], [-hw + r, hd - r, Math.PI / 2],
      [-hw + r, -hd + r, Math.PI], [hw - r, -hd + r, 1.5 * Math.PI]
    ];
    corners.forEach((c) => {
      for (let k = 0; k <= seg; k++) {
        const a = c[2] + (k / seg) * Math.PI / 2;
        pts.push(new THREE.Vector2(c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)));
      }
    });
    return pts;
  }
  function boxPx(x0, y0, x1, y1, yBot, h) {
    const w = X(x1) - X(x0), d = Z(y1) - Z(y0);
    add(new THREE.BoxGeometry(w, h, d), 'stone', (X(x0) + X(x1)) / 2, yBot + h / 2, (Z(y0) + Z(y1)) / 2);
  }
  function ellipseRing(cxPx, cyPx, rx, rz, y, tube) {
    const pts = [];
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * rx, 0, Math.sin(a) * rz));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const m = add(new THREE.TubeGeometry(curve, 40, tube, 4, true), 'stone', X(cxPx), y, Z(cyPx));
    m.scale.y = 0.5;
    return m;
  }

  // ================= BASE (two-tier masonry plinth) =================
  // upper course
  add(new THREE.BoxGeometry(2.88, 0.40, 1.14), 'stone_blocks', 0, 0.48 + 0.20, 0);
  // projecting band
  add(new THREE.BoxGeometry(2.96, 0.12, 1.26), 'stone_blocks', 0, 0.42, 0);
  // lower course, slightly flared at the foot
  let plinth = new THREE.CylinderGeometry(0.98 / Math.SQRT2, 1 / Math.SQRT2, 0.36, 4, 1, false, Math.PI / 4);
  plinth.scale(2.92, 1, 1.22);
  plinth = plinth.toNonIndexed();
  plinth.computeVertexNormals();
  add(plinth, 'stone_blocks', 0, 0.18, 0);

  // ================= SLAB =================
  // main body (pond floor is its top face)
  add(extrudeShape(new THREE.Shape(roundRectPts(W - 0.008, D - 0.008, 0.07, 3)), SLAB_BOT, BODY_TOP - SLAB_BOT), 'stone');

  // pond outline (top-view px)
  const pondPx = [
    [665, 300], [700, 284], [740, 280], [770, 288], [782, 312], [800, 334], [828, 348],
    [848, 372], [852, 410], [846, 450], [852, 490], [842, 528], [815, 555], [770, 566],
    [728, 560], [690, 566], [655, 548], [632, 512], [633, 470], [624, 430], [636, 390],
    [648, 350], [652, 318]
  ];
  // carved top skin with the pond sunk through it, softly chamfered edge
  const skin = new THREE.Shape(roundRectPts(W - 0.05, D - 0.05, 0.05, 3));
  skin.holes.push(new THREE.Path(v2(pondPx)));
  add(extrudeShape(skin, Y0 - 0.064, 0.064, { size: 0.025, thick: 0.022, seg: 2 }), 'stone');

  // raised lip around the pond
  const pc = [740, 425];
  const lipPts = pondPx.map((p) => new THREE.Vector3(
    X(pc[0] + 1.05 * (p[0] - pc[0])), 0, Z(pc[1] + 1.05 * (p[1] - pc[1]))));
  const lip = add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lipPts, true), 72, 0.012, 4, true), 'stone', 0, Y0, 0);
  lip.scale.y = 0.6;

  // ================= TERRACES (left of the stream) =================
  const TH = 0.008;
  const xs = (y) => 192 + 0.741 * (y - 270);   // stream centre line (px)
  const bankL = (y) => xs(y) - 13;
  const leftYb = [558, 508, 458, 408, 355, 302];
  const leftLx = [58, 56, 60, 64, 70, 78];
  for (let i = 0; i < 6; i++) {
    const yb = leftYb[i], lx = leftLx[i];
    const pts = [[lx + 20, 262], [120, 228], [210, 228], [214, 256], [186, 272]];
    for (let y = 290; y < Math.min(yb, 440); y += 30) pts.push([bankL(y), y]);
    if (yb > 440) { pts.push([bankL(440), 440]); pts.push([303, 448]); pts.push([303, yb]); }
    else pts.push([bankL(yb), yb]);
    pts.push([lx, yb]);
    add(extrudeShape(makeShape(v2(pts)), Y0 - 0.003 + i * TH, TH + 0.003), 'stone');
  }

  // ================= TERRACES (right of the stream / waterfall) =================
  const rightLayers = [
    [[216, 285], [250, 283], [290, 330], [325, 370], [350, 385], [352, 408], [425, 412], [428, 548],
     [380, 548], [376, 448], [331, 440], [301, 400], [272, 360], [242, 320]],
    [[230, 302], [250, 300], [283, 338], [318, 375], [340, 392], [342, 420], [410, 422], [412, 505],
     [380, 505], [376, 448], [331, 440], [301, 400], [272, 360]],
    [[255, 330], [270, 330], [300, 365], [330, 392], [332, 430], [395, 432], [395, 470],
     [380, 470], [376, 448], [331, 440], [301, 400], [272, 360]]
  ];
  rightLayers.forEach((pts, i) => {
    add(extrudeShape(makeShape(v2(pts)), Y0 - 0.003 + i * TH, TH + 0.003), 'stone');
  });

  // waterfall strands
  [312, 326, 340, 354, 366].forEach((x) => boxPx(x, 448, x + 5, 527, Y0 - 0.003, 0.011));
  // plunge pool ring
  ellipseRing(338, 535, 0.12, 0.035, Y0, 0.008);

  // ================= HAND rising from its pool =================
  const handPx = [
    [148, 254], [140, 228], [128, 205], [124, 170], [123, 135], [124, 122], [128, 116], [136, 116],
    [140, 122], [140, 140], [144, 140], [144, 96], [147, 90], [158, 90], [161, 96], [161, 140],
    [165, 140], [165, 86], [168, 80], [179, 80], [182, 86], [182, 140], [186, 140], [186, 100],
    [189, 94], [199, 94], [202, 100], [203, 150], [210, 165], [226, 148], [234, 141], [240, 144],
    [241, 152], [234, 165], [218, 190], [206, 212], [196, 232], [194, 254]
  ];
  add(extrudeShape(makeShape(v2(handPx)), Y0 - 0.004, 0.069,
    { size: 0.008, thick: 0.012, seg: 2, offset: -0.008 }), 'stone');
  // ripple rings on the top terrace
  const poolY = Y0 + 6 * TH;
  ellipseRing(166, 250, 0.15, 0.046, poolY, 0.008);
  ellipseRing(166, 250, 0.105, 0.032, poolY, 0.007);

  // ================= CHANNELS AND HOUSE SQUARES =================
  const CH = 0.017;
  boxPx(355, 389, 640, 402, Y0 - 0.003, CH);  // main conduit to the pond
  boxPx(405, 329, 413, 377, Y0 - 0.003, CH);  // branch to square 1
  boxPx(368, 370, 413, 377, Y0 - 0.003, CH);
  boxPx(368, 370, 376, 392, Y0 - 0.003, CH);
  boxPx(594, 351, 602, 392, Y0 - 0.003, CH);  // branch to square 2
  boxPx(532, 399, 540, 447, Y0 - 0.003, CH);  // branch to square 3

  function squareRing(x0, y0, x1, y1, wall, h) {
    const s = makeShape(v2([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]));
    s.holes.push(new THREE.Path(v2([[x0 + wall, y0 + wall], [x0 + wall, y1 - wall],
      [x1 - wall, y1 - wall], [x1 - wall, y0 + wall]])));
    add(extrudeShape(s, Y0 - 0.003, h + 0.003), 'stone');
  }
  squareRing(389, 291, 429, 331, 6, 0.02);
  squareRing(577, 315, 619, 353, 6, 0.02);
  squareRing(516, 445, 556, 483, 6, 0.02);

  // ================= CITY IN THE DUNES (small blocks) =================
  const city = [
    [843, 182, 14, 0.030], [815, 200, 16, 0.035], [791, 212, 14, 0.025], [838, 210, 13, 0.030],
    [801, 236, 16, 0.030], [826, 234, 14, 0.040], [851, 240, 12, 0.025],
    [782, 260, 14, 0.030], [808, 262, 16, 0.035], [836, 264, 14, 0.030],
    [795, 286, 16, 0.025], [822, 288, 14, 0.035], [849, 290, 14, 0.030],
    [812, 312, 14, 0.030], [838, 314, 14, 0.025]
  ];
  city.forEach((c) => {
    const w = c[2] * MX, d = c[2] * MZ, h = c[3] + 0.003;
    add(new THREE.BoxGeometry(w, h, d), 'stone', X(c[0]), Y0 - 0.003 + h / 2, Z(c[1]));
  });

  return root;
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that), and any flat view
on the sheet that's missing from the list (both sides when both are drawn: a face no view shows is painted by a guess). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 12,000.
