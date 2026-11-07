```json
{"objects": [
  {"name": "wheel_chocks", "size_m": [0.476, 0.10, 0.141],
   "views": [
     {"label": "top (middle row, rope loop toward viewer)", "box": [45, 310, 686, 502], "cam": [0, 1, 0], "up": [0, 0, -1]},
     {"label": "back (bottom row, wedges with holes, no rope)", "box": [46, 502, 686, 642], "cam": [0, 0, -1], "up": [0, 1, 0]}]},
  {"name": "ground_anchor_1", "size_m": [0.046, 0.44, 0.043],
   "views": [{"label": "front (left screw anchor)", "box": [750, 55, 812, 640], "cam": [0, 0, 1], "up": [0, 1, 0]}]},
  {"name": "ground_anchor_2", "size_m": [0.046, 0.44, 0.043],
   "views": [{"label": "front (middle screw anchor)", "box": [882, 55, 946, 640], "cam": [0, 0, 1], "up": [0, 1, 0]}]},
  {"name": "ground_anchor_3", "size_m": [0.046, 0.44, 0.043],
   "views": [{"label": "front (right screw anchor)", "box": [1012, 55, 1074, 640], "cam": [0, 0, 1], "up": [0, 1, 0]}]},
  {"name": "rope_coil_1", "size_m": [0.214, 0.027, 0.191],
   "views": [{"label": "top (left coil)", "box": [35, 694, 320, 948], "cam": [0, 1, 0], "up": [0, 0, -1]}]},
  {"name": "rope_coil_2", "size_m": [0.206, 0.027, 0.19],
   "views": [{"label": "top (middle coil)", "box": [338, 692, 612, 946], "cam": [0, 1, 0], "up": [0, 0, -1]}]},
  {"name": "rope_coil_3", "size_m": [0.213, 0.027, 0.19],
   "views": [{"label": "top (right coil)", "box": [624, 692, 908, 946], "cam": [0, 1, 0], "up": [0, 0, -1]}]},
  {"name": "stake_bag", "size_m": [0.293, 0.438, 0.084],
   "views": [{"label": "front (drawstring bag)", "box": [1128, 62, 1518, 646], "cam": [0, 0, 1], "up": [0, 1, 0]}]},
  {"name": "pitot_cover", "size_m": [0.225, 0.047, 0.168],
   "views": [{"label": "top (red sleeve and streamer lying flat)", "box": [943, 700, 1242, 924], "cam": [0, 1, 0], "up": [0, 0, -1]}]}
 ],
 "notes": "Tie-down kit: a rope-linked pair of wooden wheel chocks (~18x10x10 cm each), three ~44 cm screw-in ground anchors with eye rings, three coils of orange tie-down rope (~21 cm across), an olive canvas stake bag (~25x44 cm), and a red pitot cover with streamer. The scale bar is 10 cm = ~133 px. The top chock row is a three-quarter view with the rope and is left out. The bottom chock row is read as the back view, since it shows no rope; the sheet doesn't show the rope between the wedges in that row."}
```

```js
function build(THREE) {
  const COL = {
    weathered_wood: 0x7f7262,
    hemp_rope: 0xb39a74,
    rusty_iron: 0x7a4c32,
    muddy_iron: 0x9e6741,
    orange_rope: 0xbf6a3c,
    olive_canvas: 0x6b6a4b,
    red_canvas: 0xa8302c
  };
  const mats = {};
  function M(geo, name) {
    if (!mats[name]) {
      mats[name] = new THREE.MeshStandardMaterial({
        color: COL[name],
        roughness: 0.92,
        metalness: name.indexOf('iron') >= 0 ? 0.3 : 0.0
      });
    }
    const m = new THREE.Mesh(geo, mats[name]);
    m.name = name;
    return m;
  }
  const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
  function tube(pts, segs, r, radial, name) {
    const curve = new THREE.CatmullRomCurve3(pts.map(V));
    return M(new THREE.TubeGeometry(curve, segs, r, radial, false), name);
  }
  function rod(p1, p2, r, segs, name) {
    const a = V(p1), b = V(p2);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = M(new THREE.CylinderGeometry(r, r, len, segs), name);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
  }
  function extrudeXY(pts, opts) {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    return new THREE.ExtrudeGeometry(s, opts);
  }
  let seed = 20240607;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

  // ---------- wheel chocks (pair linked by hemp rope) ----------
  function buildChocks() {
    const g = new THREE.Group();
    g.name = 'wheel_chocks';
    const gap = 0.06, L = 0.178, H = 0.10, Ht = 0.028, flat = 0.014, D = 0.096, zBack = -0.070;
    [-1, 1].forEach((s) => {
      // tall end faces inward (toward x = 0), slope runs down to the outer thin end
      const prof = [[0, 0], [L, 0], [L, Ht], [flat, H], [0, H]].map((p) => [s * (gap + p[0]), p[1]]);
      const m = M(extrudeXY(prof, { depth: D, bevelEnabled: false }), 'weathered_wood');
      m.position.z = zBack; // spans z -0.070 .. 0.026
      g.add(m);
    });
    // rope leaves the front faces near the inner ends and sags forward onto the ground
    g.add(tube([
      [-0.080, 0.060, 0.016], [-0.079, 0.047, 0.034], [-0.070, 0.022, 0.051],
      [-0.044, 0.0075, 0.0625], [0, 0.0048, 0.0665], [0.044, 0.0075, 0.0625],
      [0.070, 0.022, 0.051], [0.079, 0.047, 0.034], [0.080, 0.060, 0.016]
    ], 24, 0.0045, 5, 'hemp_rope'));
    return g;
  }

  // ---------- screw-in ground anchor ----------
  function buildAnchor(name) {
    const g = new THREE.Group();
    g.name = name;
    const ring = M(new THREE.TorusGeometry(0.0148, 0.0042, 6, 14), 'rusty_iron');
    ring.position.y = 0.421; // top of ring at 0.44
    g.add(ring);
    const shaft = M(new THREE.CylinderGeometry(0.0085, 0.0085, 0.372, 8, 1, true), 'rusty_iron');
    shaft.position.y = 0.036 + 0.186;
    g.add(shaft);
    const collar = M(new THREE.CylinderGeometry(0.0118, 0.0118, 0.024, 8), 'rusty_iron');
    collar.position.y = 0.381;
    g.add(collar);
    const tip = M(new THREE.ConeGeometry(0.0088, 0.04, 8), 'muddy_iron');
    tip.rotation.x = Math.PI; // point down to y = 0
    tip.position.y = 0.02;
    g.add(tip);
    // helical flight, mud-caked, tapering toward the tip
    const pts = [];
    const turns = 4, n = turns * 8, yTop = 0.200, yBot = 0.030;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = t * turns * Math.PI * 2;
      const y = yTop - t * (yTop - yBot);
      const r = 0.0150 - 0.0055 * t * t;
      pts.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    }
    g.add(tube(pts, 40, 0.0062, 4, 'muddy_iron'));
    return g;
  }

  // ---------- coiled orange rope lying flat ----------
  function buildCoil(name, w, d, tail) {
    const g = new THREE.Group();
    g.name = name;
    const rr = 0.0085, sz = d / w;
    const R0 = w / 2 - rr;
    const rings = [[R0, rr], [R0 - 0.0145, rr + 0.007], [R0 - 0.029, rr + 0.003], [R0 - 0.0435, rr + 0.0095]];
    rings.forEach((rg, i) => {
      const t = M(new THREE.TorusGeometry(rg[0], rr, 5, 16), 'orange_rope');
      t.rotation.x = Math.PI / 2;
      t.scale.set(1, sz, 1);
      const j = i === 0 ? 0 : 0.007;
      t.position.set((rnd() - 0.5) * j, rg[1], (rnd() - 0.5) * j);
      g.add(t);
    });
    if (tail) g.add(rod(tail[0], tail[1], rr, 6, 'orange_rope'));
    return g;
  }

  // ---------- olive canvas stake bag with drawstring ----------
  function buildBag() {
    const g = new THREE.Group();
    g.name = 'stake_bag';
    const outline = [
      [-0.112, 0.000], [0.115, 0.000], [0.124, 0.010], [0.122, 0.150], [0.115, 0.300],
      [0.107, 0.345], [0.093, 0.385], [0.068, 0.405], [0.050, 0.418], [0.058, 0.432],
      [0.030, 0.438], [0.000, 0.434], [-0.030, 0.438], [-0.060, 0.432], [-0.055, 0.418],
      [-0.074, 0.405], [-0.103, 0.385], [-0.115, 0.345], [-0.120, 0.300], [-0.122, 0.150],
      [-0.121, 0.010]
    ];
    const geo = extrudeXY(outline, {
      depth: 0.06, bevelEnabled: true, bevelThickness: 0.012,
      bevelSize: 0.008, bevelOffset: -0.008, bevelSegments: 2, curveSegments: 1
    });
    geo.translate(0, 0, -0.03);
    g.add(M(geo, 'olive_canvas'));
    // cord cinched around the neck
    const neck = M(new THREE.TorusGeometry(0.056, 0.004, 4, 12), 'hemp_rope');
    neck.rotation.x = Math.PI / 2;
    neck.scale.set(1, 0.8, 1);
    neck.position.y = 0.418;
    g.add(neck);
    // left drawstring, knot, frayed tassel
    g.add(tube([[-0.050, 0.420, 0.030], [-0.085, 0.400, 0.035], [-0.113, 0.365, 0.030],
      [-0.128, 0.320, 0.025], [-0.131, 0.292, 0.020]], 12, 0.004, 4, 'hemp_rope'));
    const kL = M(new THREE.SphereGeometry(0.0075, 6, 4), 'hemp_rope');
    kL.position.set(-0.131, 0.287, 0.020);
    g.add(kL);
    const tL = M(new THREE.ConeGeometry(0.009, 0.030, 6), 'hemp_rope');
    tL.position.set(-0.132, 0.266, 0.020);
    g.add(tL);
    // right drawstring, knot, frayed tassel
    g.add(tube([[0.050, 0.424, 0.030], [0.090, 0.408, 0.035], [0.120, 0.372, 0.030],
      [0.133, 0.325, 0.025], [0.137, 0.292, 0.020]], 12, 0.004, 4, 'hemp_rope'));
    const kR = M(new THREE.SphereGeometry(0.0075, 6, 4), 'hemp_rope');
    kR.position.set(0.137, 0.287, 0.020);
    g.add(kR);
    const tR = M(new THREE.ConeGeometry(0.009, 0.045, 6), 'hemp_rope');
    tR.position.set(0.139, 0.262, 0.020);
    g.add(tR);
    return g;
  }

  // ---------- red pitot cover with streamer, lying flat ----------
  function buildPitot() {
    const g = new THREE.Group();
    g.name = 'pitot_cover';
    const sleeve = M(new THREE.CylinderGeometry(0.021, 0.036, 0.12, 12), 'red_canvas');
    sleeve.rotation.z = -Math.PI / 2 - 0.07; // narrow end toward +x, bottom line level
    sleeve.scale.set(0.65, 1, 1);            // cloth sags flat
    sleeve.position.set(-0.051, 0.02, -0.048);
    g.add(sleeve);
    // streamer outline in (x, -z), extruded 3 mm upward
    const xz = [
      [0.000, -0.075], [0.066, -0.066], [0.097, -0.048], [0.111, -0.017], [0.105, 0.015],
      [0.070, 0.041], [0.013, 0.062], [-0.023, 0.083], [-0.034, 0.055], [0.009, 0.038],
      [0.058, 0.018], [0.080, 0.000], [0.081, -0.017], [0.070, -0.030], [0.043, -0.036],
      [0.000, -0.037]
    ];
    const strip = M(extrudeXY(xz.map((p) => [p[0], -p[1]]), { depth: 0.003, bevelEnabled: false }), 'red_canvas');
    strip.rotation.x = -Math.PI / 2;
    g.add(strip);
    return g;
  }

  return {
    wheel_chocks: buildChocks(),
    ground_anchor_1: buildAnchor('ground_anchor_1'),
    ground_anchor_2: buildAnchor('ground_anchor_2'),
    ground_anchor_3: buildAnchor('ground_anchor_3'),
    rope_coil_1: buildCoil('rope_coil_1', 0.214, 0.184, [[-0.034, 0.0085, 0.072], [-0.046, 0.0085, 0.090]]),
    rope_coil_2: buildCoil('rope_coil_2', 0.206, 0.190, null),
    rope_coil_3: buildCoil('rope_coil_3', 0.213, 0.190, null),
    stake_bag: buildBag(),
    pitot_cover: buildPitot()
  };
}
```