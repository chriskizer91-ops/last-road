You built the 3D model below from Christopher's reference sheet E05 · Field book, camera, rubbing kit. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"camera": {"front": {"iou": 0.837, "turn_deg": -2.94}, "top": {"iou": 0.888, "turn_deg": 1.14}, "side (+x, lens at left)": {"iou": 0.86, "turn_deg": 2.96}}, "field_book": {"top (closed cover, pencil in loop)": {"iou": 0.968, "turn_deg": -0.87}}, "field_book_open": {"top (open spread, hand sketch)": {"iou": 0.983, "turn_deg": -0.36}}, "rubbing_kit": {"top (tool roll laid open)": {"iou": 0.908, "turn_deg": 0.95}}}
The model's size in metres (x, y, z) and triangles: {"field_book": {"tris": 248, "size": [0.14, 0.02, 0.206], "min": [-0.07, 0, -0.103]}, "field_book_open": {"tris": 172, "size": [0.281, 0.01, 0.198], "min": [-0.14, 0, -0.099]}, "camera": {"tris": 1156, "size": [0.189, 0.099, 0.072], "min": [-0.094, 0, -0.036]}, "rubbing_kit": {"tris": 1388, "size": [0.594, 0.059, 0.183], "min": [-0.296, 0, -0.091]}}

Your code and the views you gave:
```json
{
  "objects": [
    {
      "name": "field_book",
      "size_m": [0.140, 0.020, 0.206],
      "views": [
        {"label": "top (closed cover, pencil in loop)", "box": [30, 47, 345, 505], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "field_book_open",
      "size_m": [0.281, 0.010, 0.198],
      "views": [
        {"label": "top (open spread, hand sketch)", "box": [367, 52, 999, 497], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "camera",
      "size_m": [0.189, 0.099, 0.072],
      "views": [
        {"label": "front", "box": [1060, 28, 1486, 251], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "top", "box": [1020, 372, 1345, 502], "cam": [0, 1, 0], "up": [0, 0, -1]},
        {"label": "side (+x, lens at left)", "box": [1378, 325, 1500, 493], "cam": [1, 0, 0], "up": [0, 1, 0]}
      ]
    },
    {
      "name": "rubbing_kit",
      "size_m": [0.595, 0.059, 0.184],
      "views": [
        {"label": "top (tool roll laid open)", "box": [147, 555, 1487, 970], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    }
  ],
  "notes": "Field-finding set, using the scale bar (10 cm = 225 px). Cloth-bound field book about 13 x 20 cm, shown closed with a pencil and also open, so it is modelled twice. Compact camera about 17 x 10 x 7 cm. Canvas tool roll about 47 x 18 cm (60 cm with its wrist loop) holding a brush, three rubbing-wax blocks, masking tape and a paper roll. The book thickness and the item heights in the roll are guesses, since no side views show them. The camera strap appears only in the front view, hanging below the body. The top and side views show no strap, so I left the strap off and kept only the lugs and split rings. The front box covers the body plus the rings."
}

```
```js
function build(THREE) {
  const COLORS = {
    cloth_green: 0x5e6342,
    paper_cream: 0xd8c8a3,
    elastic_black: 0x2a2a28,
    elastic_olive: 0x51543a,
    paint_yellow: 0xc49a4a,
    wood_bare: 0xcaa574,
    graphite: 0x3b3b3b,
    brass: 0x9a8457,
    rubber_pink: 0xb38a7a,
    black_metal: 0x2e2c29,
    leatherette: 0x38342e,
    glass: 0x252c2f,
    steel: 0x57544d,
    flash_window: 0x8e8a80,
    canvas: 0x8a7655,
    webbing: 0x7f6d4e,
    bristles: 0x5c4b3b,
    aluminium: 0xa7a7a0,
    wood: 0x9a7850,
    wax_black: 0x232220,
    masking_tape: 0xcab68e,
    paper: 0xded4c1
  };
  const mats = {};
  function M(geo, name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name] });
    const m = new THREE.Mesh(geo, mats[name]);
    m.name = name;
    return m;
  }
  function roundRect(x0, y0, x1, y1, r) {
    const s = new THREE.Shape();
    s.moveTo(x0 + r, y0);
    s.lineTo(x1 - r, y0);
    s.quadraticCurveTo(x1, y0, x1, y0 + r);
    s.lineTo(x1, y1 - r);
    s.quadraticCurveTo(x1, y1, x1 - r, y1);
    s.lineTo(x0 + r, y1);
    s.quadraticCurveTo(x0, y1, x0, y1 - r);
    s.lineTo(x0, y0 + r);
    s.quadraticCurveTo(x0, y0, x0 + r, y0);
    return s;
  }
  function alongZ(mesh) { mesh.rotation.x = Math.PI / 2; return mesh; }

  // ---------------- closed field book (lying flat, cover up) ----------------
  function fieldBook() {
    const g = new THREE.Group();
    const X = (px) => (px - 187.5) / 2250;
    const Z = (py) => (py - 276) / 2250;
    const xL = X(30), xR = X(322);
    const D = Z(505) - Z(47);
    const T = 0.019, r = T / 2;

    const spine = alongZ(M(new THREE.CylinderGeometry(r, r, D, 12), 'cloth_green'));
    spine.position.set(xL + r, r, 0);
    g.add(spine);

    const cw = xR - (xL + r);
    const cx = (xL + r + xR) / 2;
    [0.001, T - 0.001].forEach((y) => {
      const c = M(new THREE.BoxGeometry(cw, 0.002, D), 'cloth_green');
      c.position.set(cx, y, 0);
      g.add(c);
    });
    const pages = M(new THREE.BoxGeometry(cw - 0.002, T - 0.004, D - 0.004), 'paper_cream');
    pages.position.set(cx - 0.001, r, 0);
    g.add(pages);

    const band = M(new THREE.BoxGeometry(0.011, T + 0.0012, D + 0.0024), 'elastic_black');
    band.position.set(X(267.5), (T + 0.0012) / 2, 0);
    g.add(band);

    // pencil tucked along the right edge, tip toward -z
    const px = 0.0638, py = r, pr = 0.0058;
    const zTip = Z(92), zCone = Z(118), zFer = Z(428), zEr = Z(447), zEnd = Z(458);
    const body = alongZ(M(new THREE.CylinderGeometry(pr, pr, zFer - zCone, 6), 'paint_yellow'));
    body.position.set(px, py, (zFer + zCone) / 2);
    g.add(body);
    const cone = M(new THREE.ConeGeometry(pr, zCone - zTip, 6), 'wood_bare');
    cone.rotation.x = -Math.PI / 2;
    cone.position.set(px, py, (zCone + zTip) / 2);
    g.add(cone);
    const lead = M(new THREE.ConeGeometry(0.0022, 0.004, 6), 'graphite');
    lead.rotation.x = -Math.PI / 2;
    lead.position.set(px, py, zTip + 0.002);
    g.add(lead);
    const fer = alongZ(M(new THREE.CylinderGeometry(0.006, 0.006, zEr - zFer, 8), 'brass'));
    fer.position.set(px, py, (zFer + zEr) / 2);
    g.add(fer);
    const eraser = alongZ(M(new THREE.CylinderGeometry(0.0055, 0.0055, zEnd - zEr, 8), 'rubber_pink'));
    eraser.position.set(px, py, (zEr + zEnd) / 2);
    g.add(eraser);

    const penLoop = alongZ(M(new THREE.CylinderGeometry(0.0069, 0.0069, Z(290) - Z(236), 10), 'elastic_olive'));
    penLoop.position.set(px, py, Z(263));
    g.add(penLoop);
    return g;
  }

  // ---------------- open field book (spread flat) ----------------
  function fieldBookOpen() {
    const g = new THREE.Group();
    const X = (px) => (px - 682.5) / 2250;
    const Z = (py) => (py - 274.5) / 2250;
    const cover = M(new THREE.BoxGeometry(X(988) - X(367), 0.002, Z(497) - Z(52)), 'cloth_green');
    cover.position.set((X(367) + X(988)) / 2, 0.001, 0);
    g.add(cover);

    const z0 = Z(58), z1 = Z(491);
    [-1, 1].forEach((s) => {
      const outer = s < 0 ? -X(381) : X(977);
      const sh = new THREE.Shape();
      sh.moveTo(s * 0.0008, 0.0018);
      sh.lineTo(s * outer, 0.0018);
      sh.lineTo(s * outer, 0.0075);
      sh.quadraticCurveTo(s * outer, 0.0102, s * (outer - 0.006), 0.0102);
      sh.lineTo(s * 0.03, 0.0102);
      sh.bezierCurveTo(s * 0.012, 0.0102, s * 0.004, 0.0075, s * 0.0008, 0.0035);
      const geo = new THREE.ExtrudeGeometry(sh, { depth: z1 - z0, bevelEnabled: false, curveSegments: 6 });
      const p = M(geo, 'paper_cream');
      p.position.z = z0;
      g.add(p);
    });

    const loop = alongZ(M(new THREE.CylinderGeometry(0.004, 0.004, Z(290) - Z(248), 10), 'elastic_olive'));
    loop.position.set(X(991), 0.004, Z(269));
    g.add(loop);
    return g;
  }

  // ---------------- camera (lens faces +z) ----------------
  function camera() {
    const g = new THREE.Group();
    const X = (px) => (px - 1272.5) / 2250;
    const Y = (py) => (250 - py) / 2250;
    const halfW = 0.0833, zBack = -0.036, zFront = 0.018, top = Y(42);

    const body = M(new THREE.ExtrudeGeometry(roundRect(-halfW, 0, halfW, top, 0.006),
      { depth: zFront - zBack, bevelEnabled: false, curveSegments: 3 }), 'black_metal');
    body.position.z = zBack;
    g.add(body);

    const grip = M(new THREE.ExtrudeGeometry(roundRect(X(1090), 0.0015, X(1172), Y(75), 0.007),
      { depth: 0.0075, bevelEnabled: false, curveSegments: 3 }), 'leatherette');
    grip.position.z = zFront - 0.0005;
    g.add(grip);

    const lensPts = [[0.036, 0], [0.036, 0.006], [0.033, 0.006], [0.033, 0.014], [0.031, 0.014],
      [0.031, 0.018], [0.025, 0.018], [0.0235, 0.0135]].map((p) => new THREE.Vector2(p[0], p[1]));
    const lens = M(new THREE.LatheGeometry(lensPts, 32), 'black_metal');
    lens.rotation.x = Math.PI / 2;
    lens.position.set(X(1311), Y(162), zFront);
    g.add(lens);

    const glass = alongZ(M(new THREE.CylinderGeometry(0.0236, 0.0236, 0.002, 24), 'glass'));
    glass.position.set(X(1311), Y(162), zFront + 0.0125);
    g.add(glass);

    [[X(1122), 0.0095], [X(1184), 0.0105]].forEach((d) => {
      const dial = M(new THREE.CylinderGeometry(d[1], d[1], 0.0065, 16), 'black_metal');
      dial.position.set(d[0], top + 0.0031, -0.009);
      g.add(dial);
    });

    const flash = M(new THREE.BoxGeometry(0.018, 0.009, 0.0015), 'flash_window');
    flash.position.set(X(1400), Y(72), zFront + 0.0005);
    g.add(flash);

    const button = alongZ(M(new THREE.CylinderGeometry(0.004, 0.004, 0.003, 10), 'black_metal'));
    button.position.set(X(1388), Y(215), zFront + 0.0015);
    g.add(button);

    [-1, 1].forEach((s) => {
      const lug = M(new THREE.BoxGeometry(0.005, 0.009, 0.007), 'black_metal');
      lug.position.set(s * (halfW + 0.002), 0.069, -0.0096);
      g.add(lug);
      const ring = M(new THREE.TorusGeometry(0.0042, 0.0011, 6, 12), 'steel');
      ring.position.set(s * (halfW + 0.0058), 0.0655, -0.0096);
      g.add(ring);
    });
    return g;
  }

  // ---------------- rubbing kit (tool roll laid open) ----------------
  function rubbingKit() {
    const g = new THREE.Group();
    const X = (px) => (px - 816) / 2250;
    const Z = (py) => (py - 762.5) / 2250;
    const bt = 0.003;

    const base = M(new THREE.ExtrudeGeometry(roundRect(X(149), Z(557), X(1209), Z(968), 0.008),
      { depth: bt, bevelEnabled: false, curveSegments: 3 }), 'canvas');
    base.rotation.x = Math.PI / 2;
    base.position.y = bt;
    g.add(base);

    const pTop = 0.023;
    const pocket = M(new THREE.BoxGeometry(X(988) - X(345), pTop - bt, Z(905) - Z(790)), 'canvas');
    pocket.position.set((X(345) + X(988)) / 2, (pTop + bt) / 2, (Z(790) + Z(905)) / 2);
    g.add(pocket);

    // brush
    const bx = X(411), by = 0.0125;
    const bristlePts = [[0.0105, 0], [0.016, 0.004], [0.022, 0.011], [0.0255, 0.019], [0.026, 0.025],
      [0.023, 0.031], [0.016, 0.0345], [0.006, 0.036], [0.0, 0.0362]].map((p) => new THREE.Vector2(p[0], p[1]));
    const bristles = M(new THREE.LatheGeometry(bristlePts, 16), 'bristles');
    bristles.rotation.x = -Math.PI / 2;
    bristles.scale.z = 0.45;
    bristles.position.set(bx, by, Z(661));
    g.add(bristles);
    const ferrule = M(new THREE.CylinderGeometry(0.0116, 0.0106, Z(752) - Z(661), 14), 'aluminium');
    ferrule.rotation.x = -Math.PI / 2;
    ferrule.position.set(bx, by, (Z(661) + Z(752)) / 2);
    g.add(ferrule);
    const handle = alongZ(M(new THREE.CylinderGeometry(0.0088, 0.0088, Z(840) - Z(752), 10), 'wood'));
    handle.position.set(bx, by, (Z(752) + Z(840)) / 2);
    g.add(handle);

    // wax blocks
    [[487, 560], [577, 652], [668, 752]].forEach((b) => {
      const blk = M(new THREE.BoxGeometry((b[1] - b[0]) / 2250, 0.014, Z(865) - Z(668)), 'wax_black');
      blk.position.set(X((b[0] + b[1]) / 2), bt + 0.007, (Z(668) + Z(865)) / 2);
      g.add(blk);
    });

    // masking tape lying flat
    const tapePts = [[0.016, 0], [0.0278, 0], [0.0278, 0.018], [0.016, 0.018], [0.016, 0]]
      .map((p) => new THREE.Vector2(p[0], p[1]));
    const tape = M(new THREE.LatheGeometry(tapePts, 24), 'masking_tape');
    tape.position.set(X(852), bt, Z(745));
    g.add(tape);

    // paper roll with strap tab
    const prx = X(1066.5), prr = 0.0273, pz0 = Z(572), pz1 = Z(945);
    const roll = alongZ(M(new THREE.CylinderGeometry(prr, prr, pz1 - pz0, 20), 'paper'));
    roll.position.set(prx, bt + prr, (pz0 + pz1) / 2);
    g.add(roll);
    const tab = alongZ(M(new THREE.CylinderGeometry(prr + 0.0013, prr + 0.0013, Z(800) - Z(760), 20), 'webbing'));
    tab.position.set(prx, bt + prr, Z(780));
    g.add(tab);

    // wrist loop lying flat to the right
    const fy = 0.35;
    const loopPts = [[1172, 700, 0.0045], [1250, 690, 0.002], [1350, 689, 0.002], [1428, 697, 0.002],
      [1462, 718, 0.002], [1474, 765, 0.002], [1464, 808, 0.002], [1432, 834, 0.002], [1360, 845, 0.002],
      [1280, 848, 0.002], [1215, 850, 0.0045], [1180, 846, 0.0045]]
      .map((p) => new THREE.Vector3(X(p[0]), p[2] / fy, Z(p[1])));
    const loop = M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(loopPts), 48, 0.0055, 6, false), 'webbing');
    loop.scale.y = fy;
    g.add(loop);
    return g;
  }

  return {
    field_book: fieldBook(),
    field_book_open: fieldBookOpen(),
    camera: camera(),
    rubbing_kit: rubbingKit()
  };
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that), and any flat view
on the sheet that's missing from the list (both sides when both are drawn: a face no view shows is painted by a guess). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 6,000.
