You built the 3D model below from Christopher's reference sheet E13 · Rope, harness, carabiners. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"carabiner_1": {"top (flat-lay)": {"iou": 0.089, "turn_deg": 0.71}}, "carabiner_2": {"top (flat-lay)": {"iou": 0.607, "turn_deg": 1.77}}, "carabiner_3": {"top (flat-lay)": {"iou": 0.077, "turn_deg": -0.62}}, "figure_eight": {"top (flat-lay)": {"iou": 0.642, "turn_deg": -0.29}}, "harness": {"top (flat-lay)": {"iou": 0.626, "turn_deg": 0.38}}, "rope_coil": {"top (flat-lay)": {"iou": 0.851, "turn_deg": -0.69}}, "sling": {"top (flat-lay)": {"iou": 0.353, "turn_deg": -3.31}}}
The model's size in metres (x, y, z) and triangles: {"rope_coil": {"tris": 1352, "size": [0.817, 0.083, 0.181], "min": [-0.408, 0, -0.089]}, "harness": {"tris": 1036, "size": [0.444, 0.025, 0.363], "min": [-0.221, 0, -0.181]}, "carabiner_1": {"tris": 392, "size": [0.066, 0.02, 0.147], "min": [-0.034, 0, -0.073]}, "carabiner_2": {"tris": 392, "size": [0.067, 0.02, 0.147], "min": [-0.034, 0, -0.073]}, "carabiner_3": {"tris": 392, "size": [0.072, 0.02, 0.147], "min": [-0.037, 0, -0.073]}, "figure_eight": {"tris": 516, "size": [0.095, 0.012, 0.206], "min": [-0.047, 0, -0.102]}, "sling": {"tris": 140, "size": [0.114, 0.006, 0.29], "min": [-0.057, 0, -0.145]}}

Your code and the views you gave:
```json
{
  "objects": [
    {"name": "rope_coil", "size_m": [0.816, 0.082, 0.183],
     "views": [{"label": "top (flat-lay)", "box": [60, 20, 1488, 340], "cam": [0, 1, 0], "up": [0, 0, -1]}]},
    {"name": "harness", "size_m": [0.442, 0.026, 0.366],
     "views": [{"label": "top (flat-lay)", "box": [36, 362, 810, 1002], "cam": [0, 1, 0], "up": [0, 0, -1]}]},
    {"name": "carabiner_1", "size_m": [0.065, 0.02, 0.147],
     "views": [{"label": "top (flat-lay)", "box": [874, 352, 988, 610], "cam": [0, 1, 0], "up": [0, 0, -1]}]},
    {"name": "carabiner_2", "size_m": [0.066, 0.02, 0.147],
     "views": [{"label": "top (flat-lay)", "box": [1022, 352, 1137, 610], "cam": [0, 1, 0], "up": [0, 0, -1]}]},
    {"name": "carabiner_3", "size_m": [0.071, 0.02, 0.147],
     "views": [{"label": "top (flat-lay)", "box": [1164, 352, 1289, 610], "cam": [0, 1, 0], "up": [0, 0, -1]}]},
    {"name": "figure_eight", "size_m": [0.096, 0.012, 0.207],
     "views": [{"label": "top (flat-lay)", "box": [955, 640, 1123, 1003], "cam": [0, 1, 0], "up": [0, 0, -1]}]},
    {"name": "sling", "size_m": [0.117, 0.006, 0.291],
     "views": [{"label": "top (flat-lay)", "box": [1295, 354, 1499, 864], "cam": [0, 1, 0], "up": [0, 0, -1]}]}
  ],
  "notes": "Worn climbing kit laid flat and shot from directly above, so each piece has one top view (image-up = -z). The pieces are a green butterfly-coiled rope with a wrapped and knotted middle, a blue-grey sit harness, three screwgate carabiners, a figure-8 descender and a red sewn sling. Scale bar: 10 cm = 175 px. At that scale the rope coil is about 0.82 x 0.18 m and the harness about 0.44 x 0.37 m. The carabiners come out at about 15 cm and the figure-8 at about 21 cm, which is large for real metalwork, but I kept the sizes to the bar. The harness is drawn with slight perspective, so both layers of the waist belt are visible. I modelled it as a flattened loop, and the exact routing of the risers is a best guess."
}

```
```js
function build(THREE) {
  const S = 0.1 / 175; // metres per sheet pixel (10 cm scale bar = 175 px)
  const COLORS = {
    rope: 0x6c7444,
    webbing_grey: 0x5e6470,
    webbing_tan: 0x9d8a62,
    webbing_red: 0xa43a2e,
    steel: 0x9c9a94
  };
  const mats = {};
  function addMesh(parent, geo, name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name] });
    const m = new THREE.Mesh(geo, mats[name]);
    m.name = name;
    parent.add(m);
    return m;
  }
  function polyShape(pts) {
    const sh = new THREE.Shape();
    pts.forEach((p, i) => { if (i) sh.lineTo(p[0], p[1]); else sh.moveTo(p[0], p[1]); });
    return sh;
  }
  function polyPath(pts) {
    const pa = new THREE.Path();
    pts.forEach((p, i) => { if (i) pa.lineTo(p[0], p[1]); else pa.moveTo(p[0], p[1]); });
    return pa;
  }
  // Extrude a footprint (shape x = model x, shape y = -model z) upward, bottom at y = 0.
  function flat(shape, depth, bevT, bevS, bevSeg) {
    const bevel = bevSeg > 0;
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: depth, steps: 1, curveSegments: 4, bevelEnabled: bevel,
      bevelThickness: bevT, bevelSize: bevS, bevelSegments: Math.max(1, bevSeg)
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, bevel ? bevT : 0, 0);
    return geo;
  }
  // superellipse outline in shape coords, centred at model (x0, z0)
  function superPts(x0, z0, a, b, n, count) {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      pts.push([x0 + a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n),
                -z0 + b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]);
    }
    return pts;
  }

  // ---------------- ROPE COIL ----------------
  function ropeCoil() {
    const g = new THREE.Group();
    const cx = 774, cy = 180;
    const X = px => (px - cx) * S, Z = py => (py - cy) * S;
    const bev = 0.025, dep = 0.02, H = dep + 2 * bev; // 7 cm tall bundle
    const a = 713 * S - bev, b = 152 * S - bev, zc = Z(174);
    const wx = X(708);
    const pinch = x => 1 - 0.18 * Math.exp(-Math.pow((x - wx) / 0.07, 2));
    const pts = [];
    for (let i = 0; i < 36; i++) {
      const f = (i / 36) * Math.PI * 2, c = Math.cos(f), sn = Math.sin(f);
      const x = a * c;
      const y = Math.sign(sn) * b * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(c), 3)), 1 / 3) * pinch(x);
      pts.push([x, y - zc]);
    }
    addMesh(g, flat(polyShape(pts), dep, bev, bev, 3), 'rope');

    // tail wraps round the middle of the coil
    const r = 0.0068;
    [660, 706, 752].forEach((px, k) => {
      const x0 = X(px);
      const hz = b * pinch(x0) + bev;
      const hy = H / 2 + r * 0.2;
      const tilt = k % 2 ? -0.006 : 0.006;
      const P = [];
      for (let i = 0; i < 14; i++) {
        const t = (i / 14) * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t);
        const cz = Math.sign(c) * Math.pow(Math.abs(c), 2 / 3);
        const cyy = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / 3);
        P.push(new THREE.Vector3(x0 + tilt * cz, Math.max(r, H / 2 + hy * cyy), zc + hz * cz));
      }
      addMesh(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P, true, 'centripetal'), 20, r, 5, true), 'rope');
    });

    // knot on top
    const knot = addMesh(g, new THREE.SphereGeometry(0.02, 8, 6), 'rope');
    knot.scale.set(1, 0.5, 1.15);
    knot.position.set(X(722), H, Z(192));

    // loose tail end draping over the near edge
    const tail = [[742, 212, 0.074], [785, 250, 0.075], [812, 285, 0.075], [826, 313, 0.064], [832, 326, 0.036], [834, 330, 0.010]]
      .map(p => new THREE.Vector3(X(p[0]), p[2], Z(p[1])));
    addMesh(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tail, false, 'centripetal'), 10, r, 5, false), 'rope');
    return g;
  }

  // ---------------- HARNESS ----------------
  function harness() {
    const g = new THREE.Group();
    const cx = 423, cy = 682;
    const X = px => (px - cx) * S, Z = py => (py - cy) * S;
    function slab(name, x0, y0, x1, y1, yb, th) {
      const m = addMesh(g, new THREE.BoxGeometry((x1 - x0) * S, th, (y1 - y0) * S), name);
      m.position.set(X((x0 + x1) / 2), yb + th / 2, Z((y0 + y1) / 2));
      return m;
    }
    function strap(px0, py0, px1, py1) {
      const dx = px1 - px0, dz = py1 - py0;
      const m = addMesh(g, new THREE.BoxGeometry(40 * S, 0.003, Math.hypot(dx, dz) * S), 'webbing_grey');
      m.position.set(X((px0 + px1) / 2), 0.0145, Z((py0 + py1) / 2));
      m.rotation.y = Math.atan2(dx, dz);
      return m.rotation.y;
    }
    function frame(pcx, pcy, wpx, hpx, barpx, yb, rotY) {
      const w = (wpx * S) / 2, h = (hpx * S) / 2, iw = w - barpx * S, ih = h - barpx * S;
      const sh = polyShape([[-w, -h], [w, -h], [w, h], [-w, h]]);
      sh.holes.push(polyPath([[-iw, -ih], [-iw, ih], [iw, ih], [iw, -ih]]));
      const m = addMesh(g, flat(sh, 0.004, 0, 0, 0), 'steel');
      m.position.set(X(pcx), yb, Z(pcy));
      m.rotation.y = rotY;
    }
    function legLoop(o, inn) {
      const sh = polyShape(superPts(X(o[0]), Z(o[1]), o[2] * S, o[3] * S, 2.3, 28));
      sh.holes.push(polyPath(superPts(X(inn[0]), Z(inn[1]), inn[2] * S, inn[3] * S, 2.3, 24)));
      addMesh(g, flat(sh, 0.012, 0, 0, 0), 'webbing_grey');
    }

    // waist belt: flattened loop, back layer above, front layer with buckles below
    slab('webbing_grey', 40, 365, 806, 452, 0, 0.009);
    slab('webbing_grey', 54, 455, 794, 550, 0, 0.013);
    [51, 795].forEach(px => {
      const f = addMesh(g, new THREE.CylinderGeometry(0.0085, 0.0085, 175 * S, 8), 'webbing_grey');
      f.rotation.x = Math.PI / 2;
      f.position.set(X(px), 0.0085, Z(457));
    });
    slab('webbing_grey', 120, 447, 172, 548, 0.013, 0.003); // keepers
    slab('webbing_grey', 698, 447, 748, 548, 0.013, 0.003);
    frame(222, 520, 90, 100, 15, 0.013, 0);                 // belt buckles
    frame(648, 519, 89, 102, 15, 0.013, 0);
    [80, 772].forEach(px => {                                // gear loops
      const gl = addMesh(g, new THREE.TorusGeometry(31 * S, 0.0042, 4, 8, Math.PI), 'webbing_grey');
      gl.rotation.x = Math.PI / 2;
      gl.scale.set(1, 1.9, 1);
      gl.position.set(X(px), 0.0042, Z(530));
    });

    // leg loops
    legLoop([250, 830, 212, 170], [255, 838, 148, 105]);
    legLoop([648, 830, 160, 170], [645, 838, 98, 105]);

    // risers and leg buckles
    const rl = strap(230, 558, 95, 742);
    strap(350, 552, 332, 694);
    strap(505, 552, 528, 704);
    const rr = strap(625, 558, 770, 742);
    frame(92, 768, 60, 45, 11, 0.0125, rl);
    frame(775, 768, 60, 45, 11, 0.0125, rr);

    // belay tab and belay loop
    const tab = slab('webbing_tan', 408, 452, 462, 645, 0, 0.004);
    tab.position.y = 0.019;
    tab.rotation.x = 0.08;
    const rp = [];
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2;
      rp.push(new THREE.Vector3(X(415) + 34 * S * Math.cos(t), 0.0105, Z(686) + 58 * S * Math.sin(t)));
    }
    addMesh(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp, true, 'centripetal'), 16, 0.0052, 6, true), 'webbing_tan');
    return g;
  }

  // ---------------- CARABINER ----------------
  function carabiner(x0, x1) {
    const g = new THREE.Group();
    const kx = (x1 - x0 - 20) / 93;
    const R = 0.0057, SL = 0.010;
    const base = [[0, -119], [27, -115], [43, -99], [48, -71], [47, -11], [44, 54], [37, 97], [21, 117],
      [2, 120], [-17, 113], [-31, 91], [-38, 49], [-43, -11], [-45, -71], [-38, -101], [-21, -116]];
    const pts = base.map(p => new THREE.Vector3((p[0] - 1.5) * kx * S, SL, p[1] * S));
    addMesh(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'centripetal'), 30, R, 6, true), 'steel');
    const sleeve = addMesh(g, new THREE.CylinderGeometry(SL, SL, 60 * S, 8), 'steel');
    sleeve.rotation.x = Math.PI / 2;
    sleeve.position.set(-41.5 * kx * S, SL, -3 * S);
    return g;
  }

  // ---------------- FIGURE-8 DESCENDER ----------------
  function figureEight() {
    const g = new THREE.Group();
    const cy = 821.5;
    const bevS = 0.0025, bevT = 0.003, o = bevS / S;
    const By = cy - 726, Sy = cy - 948;
    const R1 = 83 - o, R2 = 55 - o, w = 32 - o, rf = 14;
    const d1 = Math.sqrt((R1 + rf) * (R1 + rf) - (w + rf) * (w + rf));
    const d2 = Math.sqrt((R2 + rf) * (R2 + rf) - (w + rf) * (w + rf));
    const F1 = [w + rf, By - d1], F2 = [w + rf, Sy + d2];
    const p1 = Math.atan2(-d1, w + rf), p2 = Math.atan2(d2, w + rf);
    const PI = Math.PI;
    const pts = [[w, F2[1]], [w, F1[1]]];
    const arc = (c, r, a0, a1, n, skipLast) => {
      for (let i = 1; i <= (skipLast ? n - 1 : n); i++) {
        const t = a0 + ((a1 - a0) * i) / n;
        pts.push([c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]);
      }
    };
    arc(F1, rf, PI, PI + p1, 3);
    arc([0, By], R1, p1, PI - p1, 14);
    arc([-F1[0], F1[1]], rf, -p1, 0, 3);
    pts.push([-w, F2[1]]);
    arc([-F2[0], F2[1]], rf, 0, -p2, 3);
    arc([0, Sy], R2, PI - p2, 2 * PI + p2, 12);
    arc(F2, rf, p2 + PI, PI, 3, true);
    const sh = polyShape(pts.map(p => [p[0] * S, p[1] * S]));
    const hole = (hy, r, n) => {
      const hp = [];
      for (let i = 0; i < n; i++) {
        const t = (i / n) * PI * 2;
        hp.push([r * Math.cos(t) * S, (hy + r * Math.sin(t)) * S]);
      }
      return polyPath(hp);
    };
    sh.holes.push(hole(cy - 728, 55 + o, 14));
    sh.holes.push(hole(cy - 942, 27 + o, 10));
    addMesh(g, flat(sh, 0.006, bevT, bevS, 1), 'steel');
    return g;
  }

  // ---------------- SEWN SLING ----------------
  function sling() {
    const g = new THREE.Group();
    const cx = 1397, cy = 609;
    const P = arr => arr.map(p => [(p[0] - cx) * S, (cy - p[1]) * S]);
    const sh = polyShape(P([[1400, 355], [1360, 360], [1325, 378], [1303, 410], [1297, 460], [1298, 560],
      [1301, 660], [1305, 760], [1313, 825], [1332, 853], [1365, 863], [1398, 858], [1425, 835],
      [1445, 790], [1460, 720], [1474, 630], [1488, 540], [1497, 460], [1494, 410], [1475, 377], [1440, 360]]));
    sh.holes.push(polyPath(P([[1392, 378], [1352, 386], [1330, 410], [1324, 470], [1325, 560], [1330, 660],
      [1338, 738], [1347, 742], [1360, 680], [1385, 590], [1415, 510], [1440, 450], [1447, 412], [1430, 388]])));
    addMesh(g, flat(sh, 0.006, 0, 0, 0), 'webbing_red');
    return g;
  }

  return {
    rope_coil: ropeCoil(),
    harness: harness(),
    carabiner_1: carabiner(874, 988),
    carabiner_2: carabiner(1022, 1137),
    carabiner_3: carabiner(1164, 1289),
    figure_eight: figureEight(),
    sling: sling()
  };
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that), and any flat view
on the sheet that's missing from the list (both sides when both are drawn: a face no view shows is painted by a guess). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 5,000.
