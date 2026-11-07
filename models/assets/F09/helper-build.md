```json
{"objects": [
  {"name": "sandstone_block", "size_m": [4.52, 1.95, 2.55],
   "views": [
     {"label": "front", "box": [30, 14, 523, 229], "cam": [0, 0, 1], "up": [0, 1, 0]},
     {"label": "right side", "box": [565, 17, 843, 229], "cam": [1, 0, 0], "up": [0, 1, 0]},
     {"label": "top", "box": [897, 14, 1284, 243], "cam": [0, 1, 0], "up": [0, 0, -1]}]},
  {"name": "leaning_slab", "size_m": [6.44, 1.72, 1.0],
   "views": [
     {"label": "front (long side)", "box": [30, 246, 732, 438], "cam": [0, 0, 1], "up": [0, 1, 0]},
     {"label": "end (right)", "box": [770, 246, 889, 441], "cam": [1, 0, 0], "up": [0, 1, 0]},
     {"label": "top", "box": [912, 332, 1500, 420], "cam": [0, 1, 0], "up": [0, 0, -1]}]},
  {"name": "stepped_ledge", "size_m": [9.72, 1.98, 3.4],
   "views": [
     {"label": "front", "box": [18, 462, 1078, 682], "cam": [0, 0, 1], "up": [0, 1, 0]},
     {"label": "left side", "box": [1118, 462, 1488, 683], "cam": [-1, 0, 0], "up": [0, 1, 0]},
     {"label": "top", "box": [62, 717, 1012, 980], "cam": [0, 1, 0], "up": [0, 0, -1]}]},
  {"name": "boulder_large", "size_m": [1.8, 1.17, 1.13],
   "views": [
     {"label": "front", "box": [1075, 707, 1272, 839], "cam": [0, 0, 1], "up": [0, 1, 0]},
     {"label": "right side", "box": [1297, 709, 1422, 839], "cam": [1, 0, 0], "up": [0, 1, 0]}]},
  {"name": "boulder_small", "size_m": [1.42, 0.73, 1.1],
   "views": [
     {"label": "front", "box": [1078, 866, 1234, 950], "cam": [0, 0, 1], "up": [0, 1, 0]},
     {"label": "right side", "box": [1283, 863, 1406, 950], "cam": [1, 0, 0], "up": [0, 1, 0]}]}
 ],
 "notes": "Set of five red cross-bedded sandstone pieces. The scale bar gives 1 m = 109 px. These are a squared fallen block (about 4.2 x 1.9 x 2.3 m plus rubble), a 6.4 m wedge slab leaning about 15 degrees on rubble, a 9.4 m three-step ledge (steps descend toward the front) with dry grass, and two small boulders shown as front/side pairs. Unclear: the three top views are drawn about 10 to 25% smaller than their elevations, so sizes follow the front and side views. The boulder pairing is inferred from matching heights."}
```

```js
function build(THREE) {
  const PX = 109; // sheet pixels per metre (1 m scale bar)
  const COLORS = { sandstone: 0xbd7a4d, dry_grass: 0xa88a58 };
  const mats = {};
  function mat(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name], roughness: 0.95, metalness: 0.0 });
    return mats[name];
  }
  function mesh(geo, name) { const m = new THREE.Mesh(geo, mat(name)); m.name = name; return m; }
  function shapeFrom(pts) {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    return s;
  }
  // front-view pixels -> metres (x right, y up)
  function px(list, cx, gy) { return list.map(p => [(p[0] - cx) / PX, (gy - p[1]) / PX]); }
  // +x side-view pixels -> metres (image-left is +z)
  function pxSide(list, cx, gy) { return list.map(p => [(cx - p[0]) / PX, (gy - p[1]) / PX]); }

  // profile in XY extruded along z, centred on z = 0, silhouette kept equal to the profile
  function extrudeXY(pts, depth, bevel, segs) {
    const inner = Math.max(0.02, depth - 2 * bevel);
    const geo = new THREE.ExtrudeGeometry(shapeFrom(pts), {
      depth: inner, steps: 1, curveSegments: 2,
      bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: segs
    });
    const m = mesh(geo, 'sandstone');
    m.position.z = -inner / 2;
    const g = new THREE.Group();
    g.add(m);
    return g;
  }
  // footprint [x,z] extruded upward from y0 to y1 (a rock stratum)
  function slabXZ(footprint, y0, y1, bevel) {
    const pts = footprint.map(p => [p[0], -p[1]]);
    const h = y1 - y0;
    const geo = new THREE.ExtrudeGeometry(shapeFrom(pts), {
      depth: Math.max(0.02, h - 2 * bevel), steps: 1, curveSegments: 2,
      bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 2
    });
    const m = mesh(geo, 'sandstone');
    m.rotation.x = -Math.PI / 2;
    m.position.y = y0 + bevel;
    return m;
  }
  // low-poly loose stone, partly bedded in the ground
  function pebble(x, z, w, h, d, ry) {
    const m = mesh(new THREE.SphereGeometry(0.5, 7, 4), 'sandstone');
    m.scale.set(w, h, d);
    m.rotation.y = ry;
    m.position.set(x, h * 0.38, z);
    return m;
  }
  function sliceRange(poly, y) {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      if (a[1] !== b[1] && (a[1] - y) * (b[1] - y) <= 0) {
        const t = (y - a[1]) / (b[1] - a[1]);
        const v = a[0] + t * (b[0] - a[0]);
        lo = Math.min(lo, v); hi = Math.max(hi, v);
      }
    }
    return hi > lo ? [lo, hi] : null;
  }
  // boulder as stacked octagonal strata: each layer fits the front and side outlines at its height
  function hullRock(front, side, layers) {
    const g = new THREE.Group();
    let hf = 0, hs = 0;
    front.forEach(p => { hf = Math.max(hf, p[1]); });
    side.forEach(p => { hs = Math.max(hs, p[1]); });
    const H = Math.min(hf, hs);
    const C = Math.cos(Math.PI / 8);
    for (let i = 0; i < layers; i++) {
      const y0 = H * i / layers, y1 = H * (i + 1) / layers, ym = (y0 + y1) / 2;
      const fx = sliceRange(front, ym), sz = sliceRange(side, ym);
      if (!fx || !sz) continue;
      const m = mesh(new THREE.CylinderGeometry(1, 1, y1 - y0, 8, 1, false, Math.PI / 8), 'sandstone');
      m.scale.set((fx[1] - fx[0]) / 2 / C, 1, (sz[1] - sz[0]) / 2 / C);
      m.position.set((fx[0] + fx[1]) / 2, ym, (sz[0] + sz[1]) / 2);
      g.add(m);
    }
    return g;
  }
  function tuft(x, z, h, n, phase) {
    const g = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const a = phase + i * 2.39996;
      const hh = h * (0.65 + 0.35 * (((i * 7 + 3) % 5) / 4));
      const blade = new THREE.Group();
      const c = mesh(new THREE.ConeGeometry(0.025, hh, 4), 'dry_grass');
      c.position.y = hh / 2;
      blade.add(c);
      const lean = 0.25 + 0.15 * (i % 3);
      blade.rotation.set(Math.cos(a) * lean, 0, -Math.sin(a) * lean);
      blade.position.set(Math.sin(a) * 0.05, 0, Math.cos(a) * 0.05);
      g.add(blade);
    }
    g.position.set(x, 0, z);
    return g;
  }

  // ---------------- sandstone_block ----------------
  const block = new THREE.Group();
  block.name = 'sandstone_block';
  {
    const front = px([[62, 227], [515, 227], [518, 150], [516, 62], [503, 28], [475, 16], [300, 18],
      [150, 22], [98, 30], [76, 52], [68, 95], [60, 150], [61, 200]], 276.5, 227);
    const zF = (704 - 588) / PX, zB = (704 - 838) / PX; // from the side view
    const body = extrudeXY(front, zF - zB, 0.12, 3);
    body.position.z = (zF + zB) / 2;
    block.add(body);
    [[-2.17, 0.62, 0.38, 0.17, 0.32, 0.4], [-2.12, -0.35, 0.28, 0.12, 0.26, 1.2], [-1.25, 1.14, 0.34, 0.14, 0.24, 2.1],
     [0.35, 1.12, 0.28, 0.11, 0.2, 0.8], [2.17, 0.35, 0.18, 0.1, 0.2, 1.6], [1.45, -1.2, 0.24, 0.1, 0.14, 2.7],
     [-1.9, 1.05, 0.2, 0.09, 0.18, 0.2]].forEach(r => block.add(pebble(r[0], r[1], r[2], r[3], r[4], r[5])));
  }

  // ---------------- leaning_slab ----------------
  const slab = new THREE.Group();
  slab.name = 'leaning_slab';
  {
    const LEAN = 15 * Math.PI / 180, T = 0.62;
    const cs = Math.cos(LEAN), sn = Math.sin(LEAN), rise = T * sn;
    // [px, py, isUpperEdge]
    const raw = [[46, 424, 0], [58, 402, 1], [150, 375, 1], [300, 342, 1], [450, 308, 1], [600, 277, 1], [690, 256, 1],
      [720, 249, 1], [731, 257, 1], [722, 290, 1], [705, 335, 1], [685, 385, 1], [668, 431, 0], [640, 400, 0],
      [520, 402, 0], [430, 418, 0], [330, 430, 0], [60, 432, 0], [48, 430, 0]];
    const prof = raw.map(p => {
      const x = (p[0] - 381) / PX, yt = (432 - p[1]) / PX;
      return [x, Math.max(0, p[2] ? (yt - rise) / cs : yt / cs)];
    });
    prof[1][1] = Math.max(prof[1][1], 0.16);
    let ymax = 0;
    prof.forEach(p => { ymax = Math.max(ymax, p[1]); });
    const body = extrudeXY(prof, T, 0.04, 2);
    const leaner = new THREE.Group();
    leaner.rotation.x = -LEAN; // top leans toward -z, as in the end view
    leaner.position.set(0, (T / 2) * sn - 0.005, sn * ymax / 2);
    leaner.add(body);
    slab.add(leaner);
    [[0.65, 0.25, 0.28, 0.24, 0.30, 0.3], [0.98, -0.02, 0.24, 0.22, 0.26, 1.1], [1.32, 0.32, 0.32, 0.30, 0.34, 2.0],
     [1.9, 0.3, 0.48, 0.46, 0.4, 0.6], [2.2, -0.02, 0.3, 0.32, 0.3, 1.7], [2.48, 0.42, 0.22, 0.18, 0.24, 2.6],
     [-3.12, 0.15, 0.2, 0.1, 0.22, 0.9], [-2.9, 0.4, 0.16, 0.08, 0.18, 0.3]]
      .forEach(r => slab.add(pebble(r[0], r[1], r[2], r[3], r[4], r[5])));
  }

  // ---------------- stepped_ledge ----------------
  const ledge = new THREE.Group();
  ledge.name = 'stepped_ledge';
  {
    const b1 = [[-4.55, -1.63], [4.45, -1.63], [4.61, -1.3], [4.61, 1.0], [4.5, 1.5], [3.7, 1.66], [2.4, 1.6], [1.0, 1.67],
      [-0.8, 1.6], [-2.3, 1.66], [-3.8, 1.58], [-4.5, 1.3], [-4.75, 0.4], [-4.72, -1.1]];
    const b2 = [[-4.35, -1.63], [4.4, -1.63], [4.56, -1.2], [4.56, 0.9], [4.42, 1.45], [3.6, 1.6], [2.3, 1.55], [1.0, 1.62],
      [-0.8, 1.55], [-2.3, 1.6], [-3.7, 1.52], [-4.35, 1.2], [-4.55, 0.3], [-4.5, -1.1]];
    const m1 = [[-4.1, -1.63], [3.95, -1.63], [4.05, -1.0], [4.0, 0.4], [3.6, 0.6], [1.5, 0.55], [-0.5, 0.62],
      [-2.5, 0.55], [-3.8, 0.5], [-4.12, 0.0]];
    const m2 = [[-4.2, -1.63], [4.05, -1.63], [4.15, -1.2], [4.15, 0.5], [3.9, 0.9], [2.8, 0.98], [1.2, 0.92],
      [-0.4, 0.98], [-2.0, 0.9], [-3.5, 0.95], [-4.2, 0.7], [-4.34, 0.0], [-4.32, -1.1]];
    const t1 = [[-3.1, -1.63], [3.95, -1.63], [4.0, -1.0], [3.95, -0.1], [3.6, 0.08], [2.0, 0.02], [0.3, 0.1],
      [-1.5, 0.04], [-2.6, 0.06], [-2.95, -0.3], [-3.12, -1.1]];
    const t2 = [[-3.2, -1.63], [4.0, -1.63], [4.06, -1.1], [4.0, 0.0], [3.7, 0.24], [2.2, 0.2], [0.5, 0.25],
      [-1.2, 0.2], [-2.5, 0.24], [-2.9, 0.0], [-3.15, -0.5], [-3.28, -1.2]];
    [[0.00, 0.40, b1], [0.40, 0.74, b2], [0.74, 1.05, m1], [1.05, 1.40, m2], [1.40, 1.70, t1], [1.70, 1.94, t2]]
      .forEach(L => ledge.add(slabXZ(L[2], L[0], L[1], 0.06)));
    [[-4.72, 1.35, 0.32, 0.2, 0.3, 0.5], [-4.55, 1.55, 0.2, 0.12, 0.18, 1.4], [-2.55, 1.6, 0.3, 0.22, 0.2, 2.2],
     [-0.9, 1.62, 0.18, 0.1, 0.16, 0.7], [1.6, 1.6, 0.2, 0.12, 0.18, 1.9], [3.23, 1.6, 0.3, 0.18, 0.2, 0.2],
     [4.72, 0.9, 0.26, 0.13, 0.25, 2.8], [4.6, 1.5, 0.18, 0.1, 0.16, 1.1], [-3.5, -1.62, 0.25, 0.14, 0.16, 0.9]]
      .forEach(r => ledge.add(pebble(r[0], r[1], r[2], r[3], r[4], r[5])));
    ledge.add(tuft(-4.48, 1.1, 0.55, 7, 0.3));
    ledge.add(tuft(4.72, 0.6, 0.45, 6, 1.1));
    ledge.add(tuft(-1.17, 1.58, 0.35, 5, 2.0));
  }

  // ---------------- boulders ----------------
  const bigRock = hullRock(
    px([[1078, 835], [1078, 790], [1086, 758], [1100, 733], [1140, 718], [1185, 708], [1232, 711], [1256, 724],
      [1266, 750], [1271, 800], [1269, 835]], 1173.5, 835),
    pxSide([[1300, 835], [1302, 770], [1312, 740], [1330, 720], [1352, 709], [1372, 711], [1393, 732], [1410, 762],
      [1420, 800], [1421, 835]], 1359.5, 835),
    14);
  bigRock.name = 'boulder_large';

  const smallRock = hullRock(
    px([[1082, 946], [1081, 905], [1090, 887], [1110, 876], [1150, 871], [1195, 868], [1218, 876], [1228, 895],
      [1233, 925], [1231, 946]], 1155.5, 946),
    pxSide([[1287, 946], [1293, 928], [1315, 905], [1345, 882], [1370, 866], [1390, 870], [1400, 890], [1405, 925],
      [1404, 946]], 1344.5, 946),
    10);
  smallRock.name = 'boulder_small';

  return {
    sandstone_block: block,
    leaning_slab: slab,
    stepped_ledge: ledge,
    boulder_large: bigRock,
    boulder_small: smallRock
  };
}
```