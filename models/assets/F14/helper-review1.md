Front fits are good (IoU 0.83–0.95, turns under 5°), and the slab's two views match its size. The views don't need changing.

What matters is the depth. Every rock is a straight extrusion, so from the side and the top each one reads as a box with chamfered corners and vertical walls.

The extra "core" copies make it worse. They are deeper than the outer shell, so their faces stick 0.15–0.2 m out through the front. That leaves intersecting sliver faces, which show up as the black streaks on boulder_large.

The fix:
- **One body per rock.** I dropped the cores and use a single extrusion per rock.
- **Rounder edges.** The bevels are larger and use more segments, so the side and top read as rounded.
- **Thinner toward the top.** Depth now shrinks with height. x and y are untouched, so every front silhouette stays exact.
- **Spikes on rock_spiky.** The face spikes now start from the new front surface instead of floating.

```js
function build(THREE) {
  const S = 1 / 181; // metres per sheet pixel (scale bar: 1 m = 181 px)

  const mats = {};
  function mat(name, color) {
    if (!mats[name]) {
      mats[name] = new THREE.MeshStandardMaterial({ color: color, roughness: 0.95, metalness: 0.0, flatShading: true });
    }
    return mats[name];
  }
  const ROCK = ['lava_rock', 0x4b372b];
  const GLASS = ['basalt', 0x37312e];
  const DIRT = ['red_dirt', 0x9c5b33];

  function mk(geo, m) {
    const mesh = new THREE.Mesh(geo, mat(m[0], m[1]));
    mesh.name = m[0];
    return mesh;
  }

  let seed = 1406;
  function rnd() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  // Outline in sheet pixels -> Shape in metres (x about cx, y = refY - py)
  function shapeFrom(pts, cx, refY) {
    const sh = new THREE.Shape();
    for (let i = 0; i < pts.length; i++) {
      const x = (pts[i][0] - cx) * S;
      const y = (refY - pts[i][1]) * S;
      if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y);
    }
    return sh;
  }

  // Extrusion whose widest outline equals the shape exactly (bevel cuts inward)
  function extrudeKeep(shape, depth, bs, bt, segs) {
    const core = Math.max(0.02, depth - 2 * bt);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: core, steps: 1, curveSegments: 1,
      bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelOffset: -bs, bevelSegments: segs
    });
    return { geo: geo, core: core };
  }

  // Rock body: extruded front silhouette centred on z = 0, its depth thinned toward the top.
  // Only z is changed, so the front silhouette stays exact; the factor is affine in y,
  // so the front and back faces stay planar (tilted back like a rock's flanks).
  function body(shape, o, h) {
    const e = extrudeKeep(shape, o.depth, o.bs, o.bt, o.segs);
    const geo = e.geo;
    geo.translate(0, 0, -e.core / 2);
    const top = o.top || 0;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const yn = Math.min(1, Math.max(0, pos.getY(i) / h));
      pos.setZ(i, pos.getZ(i) * (1 - top * yn));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return mk(geo, o.mat || ROCK);
  }

  // Sheet pixel of a front view -> model point
  function P(box, p, z) {
    return new THREE.Vector3((p[0] - (box[0] + box[2]) / 2) * S, (box[3] - p[1]) * S, z || 0);
  }

  function rock(pts, box, o) {
    const g = new THREE.Group();
    const sh = shapeFrom(pts, (box[0] + box[2]) / 2, box[3]);
    g.add(body(sh, o, (box[3] - box[1]) * S));
    return g;
  }

  // z of a rock's front face (inside the bevel) at height y
  function frontZ(box, o, y) {
    const yn = Math.min(1, Math.max(0, y / ((box[3] - box[1]) * S)));
    return o.depth / 2 * (1 - o.top * yn);
  }

  const UP = new THREE.Vector3(0, 1, 0);
  function spike(base, tip, r, m) {
    const d = new THREE.Vector3().subVectors(tip, base);
    const L = Math.max(0.01, d.length());
    const mesh = mk(new THREE.ConeGeometry(r, L, 5, 1, false), m || ROCK);
    mesh.position.copy(base).addScaledVector(d, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, d.normalize());
    return mesh;
  }

  function lump(pos, s, rot, m) {
    const mesh = mk(new THREE.SphereGeometry(1, 5, 4), m || ROCK);
    mesh.position.copy(pos);
    mesh.scale.set(s[0], s[1], s[2]);
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    return mesh;
  }

  // ---------- 1. Pahoehoe slab (top view outline, extruded up) ----------
  function slab() {
    const g = new THREE.Group();
    const box = [1014, 26, 1497, 345];
    const cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2;
    const outline = [
      [1018, 30], [1080, 27], [1150, 32], [1220, 26], [1300, 30], [1380, 27], [1450, 32], [1494, 30],
      [1497, 80], [1492, 140], [1497, 200], [1493, 260], [1497, 300], [1495, 342],
      [1440, 345], [1360, 340], [1280, 345], [1200, 341], [1120, 345], [1060, 340], [1017, 343],
      [1015, 290], [1020, 230], [1014, 170], [1019, 110], [1015, 60]
    ];
    const sh = shapeFrom(outline, cx, cy); // shape y = up the top view = -z
    const bt = 0.05;
    const e = extrudeKeep(sh, 0.25, 0.06, bt, 1);
    const slabMesh = mk(e.geo, ROCK);
    slabMesh.rotation.x = -Math.PI / 2;
    slabMesh.position.y = bt;
    g.add(slabMesh);

    // ropy pressure ridges following the main swirl
    const ropes = [
      [[1040, 300], [1100, 250], [1170, 215], [1240, 190], [1310, 150], [1370, 95], [1430, 62]],
      [[1060, 322], [1140, 288], [1220, 255], [1300, 225], [1370, 180], [1430, 130], [1468, 96]],
      [[1040, 232], [1082, 176], [1132, 130], [1192, 96], [1262, 70], [1330, 54]],
      [[1160, 322], [1240, 302], [1320, 280], [1400, 250], [1462, 212]],
      [[1042, 122], [1076, 82], [1130, 58], [1200, 48]],
      [[1300, 320], [1370, 308], [1440, 284], [1474, 250]]
    ];
    ropes.forEach(function (r) {
      const pts = r.map(function (p, i) {
        const end = (i === 0 || i === r.length - 1);
        return new THREE.Vector3((p[0] - cx) * S, end ? 0.215 : 0.25, (p[1] - cy) * S);
      });
      g.add(mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 18, 0.04, 5, false), ROCK));
    });
    return g;
  }

  // ---------- 2. Large boulder ----------
  function boulderLarge() {
    const box = [21, 421, 505, 830];
    const pts = [[22, 830], [21, 770], [27, 700], [38, 630], [55, 570], [80, 520], [110, 485], [160, 466],
      [225, 452], [290, 436], [345, 422], [378, 421], [395, 448], [413, 505], [428, 565], [440, 625],
      [450, 690], [462, 745], [480, 790], [504, 815], [505, 830]];
    const g = rock(pts, box, { depth: 1.9, bs: 0.3, bt: 0.5, segs: 3, top: 0.4, mat: ROCK });
    const rub = [[445, 14, 1.0], [478, 10, 0.85], [496, 7, 0.5], [72, 10, 1.0], [150, 8, 1.02],
      [330, 7, 1.05], [400, 9, -1.0], [120, 9, -1.0]];
    rub.forEach(function (q) {
      const r = q[1] * S;
      const pos = P(box, [q[0], box[3] - q[1] * 0.5], q[2]);
      g.add(lump(pos, [r * 1.2, r * 0.7, r], [rnd() * 0.6, rnd() * 3, rnd() * 0.6]));
    });
    const dirt = mk(new THREE.CylinderGeometry(0.92, 1, 0.05, 14), DIRT);
    dirt.scale.set(1.28, 1, 1.15);
    dirt.position.set(0.04, 0.025, 0);
    g.add(dirt);
    return g;
  }

  // ---------- 3. Faceted boulder ----------
  function boulderFaceted() {
    const box = [497, 484, 771, 742];
    const pts = [[497, 742], [499, 690], [504, 625], [512, 565], [524, 515], [545, 492], [590, 487],
      [640, 484], [690, 485], [722, 492], [736, 525], [746, 575], [755, 635], [763, 695], [771, 742]];
    const g = rock(pts, box, { depth: 1.35, bs: 0.2, bt: 0.35, segs: 2, top: 0.35, mat: ROCK });
    g.add(lump(P(box, [530, 736], 0.74), [0.07, 0.045, 0.06], [0.3, 0.8, 0.1]));
    g.add(lump(P(box, [745, 737], -0.72), [0.06, 0.04, 0.05], [0.2, 1.7, 0.4]));
    return g;
  }

  // ---------- 4. Pillar ----------
  function pillar() {
    const box = [806, 478, 939, 742];
    const pts = [[806, 742], [807, 690], [810, 620], [815, 560], [822, 510], [832, 482], [848, 478],
      [866, 484], [882, 505], [897, 545], [910, 590], [922, 640], [932, 695], [939, 742]];
    return rock(pts, box, { depth: 0.72, bs: 0.09, bt: 0.2, segs: 2, top: 0.4, mat: ROCK });
  }

  // ---------- 5. Spiky scoria rock ----------
  function spiky() {
    const box = [966, 455, 1287, 792];
    const o = { depth: 1.4, bs: 0.18, bt: 0.4, segs: 3, top: 0.35, mat: ROCK };
    const pts = [[1005, 780], [988, 738], [978, 695], [982, 650], [992, 605], [1008, 568], [1035, 535],
      [1065, 508], [1105, 490], [1140, 484], [1178, 492], [1212, 515], [1243, 545], [1265, 585],
      [1276, 630], [1276, 680], [1265, 725], [1240, 765], [1200, 788], [1140, 792], [1070, 792]];
    const g = rock(pts, box, o);
    // spikes making the jagged outline
    const tips = [[966, 652], [976, 592], [1004, 543], [1044, 500], [1085, 470], [1115, 455], [1160, 463],
      [1200, 478], [1240, 503], [1272, 545], [1287, 600], [1284, 670], [1272, 728], [970, 708]];
    const C = P(box, [1126, 640]);
    tips.forEach(function (t, i) {
      const z = [0, 0.22, -0.22][i % 3];
      const T = P(box, t, z);
      const d = new THREE.Vector3(T.x - C.x, T.y - C.y, 0).normalize();
      const B = T.clone().addScaledVector(d, -0.34);
      g.add(spike(B, T, 0.12));
    });
    // spikes on the front and back faces, rooted just under the tapered faces
    const fp = [[1060, 610], [1135, 560], [1205, 625], [1095, 700], [1175, 712], [1140, 640]];
    [1, -1].forEach(function (sgn) {
      fp.forEach(function (p) {
        const B = P(box, p, 0);
        B.z = 0.75 * frontZ(box, o, B.y) * sgn;
        const d = new THREE.Vector3((rnd() - 0.5) * 0.9, (rnd() - 0.5) * 0.9, sgn).normalize();
        g.add(spike(B, B.clone().addScaledVector(d, 0.55), 0.13));
      });
    });
    return g;
  }

  // ---------- 6. Spiky lava bomb (top + front views) ----------
  function bomb() {
    const g = new THREE.Group();
    const prof = [[0, 0], [0.55, 0], [0.53, 0.16], [0.48, 0.30], [0.39, 0.44], [0.25, 0.54], [0.10, 0.59], [0, 0.6]];
    const lathe = mk(new THREE.LatheGeometry(prof.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), 10), ROCK);
    lathe.scale.set(1, 1, 0.97);
    g.add(lathe);
    function knobRing(n, r, y, nr, ny, off) {
      for (let k = 0; k < n; k++) {
        const a = off + k * Math.PI * 2 / n;
        const c = Math.cos(a), s = Math.sin(a);
        const Pp = new THREE.Vector3(r * c, y, r * s * 0.97);
        const nn = new THREE.Vector3(nr * c, ny, nr * s);
        g.add(spike(Pp.clone().addScaledVector(nn, -0.08), Pp.clone().addScaledVector(nn, 0.06), 0.07));
      }
    }
    knobRing(7, 0.494, 0.26, 0.944, 0.33, 0.2);
    knobRing(5, 0.32, 0.49, 0.58, 0.82, 0.6);
    g.add(spike(new THREE.Vector3(0, 0.46, 0.03), new THREE.Vector3(0.033, 0.718, 0.05), 0.1));
    return g;
  }

  // ---------- 7-11. Small rocks ----------
  function smallA() {
    return rock([[200, 980], [198, 935], [204, 903], [222, 882], [255, 870], [290, 871], [314, 884],
      [327, 908], [330, 948], [324, 980]], [198, 870, 330, 980],
      { depth: 0.6, bs: 0.1, bt: 0.18, segs: 3, top: 0.4, mat: ROCK });
  }
  function smallB() {
    return rock([[393, 978], [397, 948], [414, 918], [440, 888], [468, 862], [490, 874], [509, 902],
      [523, 938], [528, 978]], [393, 862, 528, 978],
      { depth: 0.55, bs: 0.09, bt: 0.15, segs: 1, top: 0.45, mat: GLASS });
  }
  function smallC() {
    return rock([[586, 978], [588, 935], [600, 890], [625, 862], [665, 846], [706, 851], [733, 872],
      [750, 908], [758, 950], [754, 978]], [586, 846, 758, 978],
      { depth: 0.8, bs: 0.12, bt: 0.22, segs: 3, top: 0.4, mat: ROCK });
  }
  function smallD() {
    return rock([[818, 978], [822, 935], [836, 893], [860, 862], [888, 855], [914, 868], [934, 900],
      [947, 938], [952, 978]], [818, 855, 952, 978],
      { depth: 0.6, bs: 0.09, bt: 0.16, segs: 1, top: 0.45, mat: GLASS });
  }
  function smallE() {
    return rock([[1011, 978], [1010, 945], [1018, 908], [1036, 880], [1056, 872], [1072, 852], [1095, 840],
      [1112, 856], [1138, 866], [1160, 892], [1173, 928], [1180, 960], [1176, 978]], [1010, 840, 1180, 978],
      { depth: 0.75, bs: 0.1, bt: 0.2, segs: 2, top: 0.4, mat: ROCK });
  }

  return {
    lava_slab: slab(),
    boulder_large: boulderLarge(),
    boulder_faceted: boulderFaceted(),
    rock_pillar: pillar(),
    rock_spiky: spiky(),
    spiky_bomb: bomb(),
    rock_small_a: smallA(),
    rock_small_b: smallB(),
    rock_small_c: smallC(),
    rock_small_d: smallD(),
    rock_small_e: smallE()
  };
}
```