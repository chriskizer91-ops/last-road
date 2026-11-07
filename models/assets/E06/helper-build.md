```json
{"objects": [
  {"name": "wrecking_bar", "size_m": [0.959, 0.134, 0.056],
   "views": [
     {"label": "row 1: gooseneck bar, side (front)", "box": [36, 41, 1515, 250], "cam": [0, 0, 1], "up": [0, 1, 0]},
     {"label": "row 2: same bar from above (claw fork, chisel flare)", "box": [40, 280, 1517, 371], "cam": [0, 1, 0], "up": [0, 0, -1]}
   ]},
  {"name": "point_bar", "size_m": [0.959, 0.031, 0.036],
   "views": [
     {"label": "row 3: straight hex bar with striking head and point, side (front)", "box": [37, 421, 1517, 471], "cam": [0, 0, 1], "up": [0, 1, 0]}
   ]},
  {"name": "machete", "size_m": [0.903, 0.141, 0.030],
   "views": [
     {"label": "row 4: machete flat side (front, spine up)", "box": [78, 547, 1477, 770], "cam": [0, 0, 1], "up": [0, 1, 0]},
     {"label": "row 5: machete edge-on from the spine (top)", "box": [66, 779, 1500, 832], "cam": [0, 1, 0], "up": [0, 0, -1]},
     {"label": "row 6: machete edge-on from the cutting edge (bottom)", "box": [66, 879, 1500, 934], "cam": [0, -1, 0], "up": [0, 0, 1]}
   ]}
 ],
 "notes": "Scale bar 10 cm = 154 px. The set has a red-painted, rusty hex gooseneck wrecking bar about 0.96 m long, drawn in rows 1–2. Row 3 is a third bar about 0.96 m long, with a hex striking head and a point; it has no claw or chisel, so it is treated as a separate tool. The machete is large, with a blade about 0.64 m long, a wooden handle about 0.22 m long and a cord lanyard. Unclear points: the sheet flares the chisel end in both views, and the edge views exaggerate blade thickness and disagree on the tip. Rows 5 and 6 are assumed to be the spine (top) and edge (bottom) views."}
```

```js
function build(THREE) {
  const S = 0.1 / 154; // metres per sheet pixel (scale bar: 10 cm = 154 px)

  const COLORS = {
    rusty_red_steel: 0x763a2f,
    worn_steel: 0x746c64,
    rusty_steel: 0x4c4640,
    timber: 0x8a7c6a,
    cord: 0x766a50
  };
  const mats = {};
  function M(name) {
    if (!mats[name]) {
      const metal = name.indexOf('steel') >= 0;
      mats[name] = new THREE.MeshStandardMaterial({
        color: COLORS[name],
        roughness: metal ? 0.7 : 0.9,
        metalness: metal ? 0.35 : 0.0,
        flatShading: metal
      });
    }
    return mats[name];
  }
  function mk(geo, name) {
    const m = new THREE.Mesh(geo, M(name));
    m.name = name;
    return m;
  }
  function shapeFrom(pts, fx, fy) {
    const sh = new THREE.Shape();
    pts.forEach((p, i) => {
      const x = fx(p), y = fy(p);
      if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y);
    });
    return sh;
  }
  // Recentre: lowest point on y = 0, centred on x and z.
  function settle(inner, name) {
    inner.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(inner, true);
    inner.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    const outer = new THREE.Group();
    outer.name = name;
    outer.add(inner);
    return outer;
  }

  // ---------------- Gooseneck wrecking bar (rows 1 & 2) ----------------
  function wreckingBar() {
    const g = new THREE.Group();
    const P = (xi, yi) => new THREE.Vector3(xi * S, -yi * S, 0);

    // Straight hex shaft: flats top/bottom (36 px), corners front/back (38 px)
    const x0 = 255, x1 = 1428;
    const body = mk(new THREE.CylinderGeometry(1, 1, (x1 - x0) * S, 6), 'rusty_red_steel');
    body.rotation.z = -Math.PI / 2;
    body.scale.set(18 * S / 0.866, 1, 19 * S);
    body.position.copy(P((x0 + x1) / 2, 78));
    g.add(body);

    // Gooseneck bend
    const hookPts = [[262, 78], [215, 76], [175, 70], [140, 63], [115, 61], [92, 66],
                     [74, 78], [63, 96], [58, 118], [56, 140], [56, 160]];
    const curve = new THREE.CatmullRomCurve3(hookPts.map(p => P(p[0], p[1])));
    g.add(mk(new THREE.TubeGeometry(curve, 28, 19 * S, 6, false), 'rusty_red_steel'));

    // Plug closing the end of the bend
    const cap = mk(new THREE.CylinderGeometry(19 * S, 19 * S, 12 * S, 6), 'worn_steel');
    cap.position.copy(P(56, 158));
    g.add(cap);

    // Split claw: two prongs splaying apart in z (fork seen from above)
    const prof = [[37, 150], [78, 150], [80, 196], [73, 250], [42, 250], [37, 196]];
    const psh = shapeFrom(prof, p => p[0] * S, p => (150 - p[1]) * S);
    const pd = 15 * S;
    const pg = new THREE.ExtrudeGeometry(psh, { depth: pd, bevelEnabled: false });
    pg.translate(0, 0, -pd / 2);
    [-1, 1].forEach(sg => {
      const pr = mk(pg, 'worn_steel');
      pr.position.set(0, -150 * S, sg * 8.5 * S);
      pr.rotation.x = -sg * 0.28;
      g.add(pr);
    });

    // Chisel end: flares in both height and width as drawn
    const L = (1514 - 1425) * S;
    const k = Math.SQRT2;
    const chiselGeo = new THREE.LatheGeometry([
      new THREE.Vector2(0, 0), new THREE.Vector2(k, 0),
      new THREE.Vector2(k * 1.9, L), new THREE.Vector2(0, L)
    ], 4, Math.PI / 4);
    const chisel = mk(chiselGeo, 'worn_steel');
    chisel.rotation.z = -Math.PI / 2;
    chisel.scale.set(17.5 * S, 1, 20 * S);
    chisel.position.copy(P(1425, 77));
    g.add(chisel);

    return settle(g, 'wrecking_bar');
  }

  // ---------------- Pointed hex bar (row 3) ----------------
  function pointBar() {
    const g = new THREE.Group();
    const H = Math.cos(Math.PI / 6);
    const AX = -447 * S;
    function hexLathe(pts, name) { // pts: [half-height px, x px], x increasing
      const v = pts.map(p => new THREE.Vector2(p[0] / H * S, p[1] * S));
      const m = mk(new THREE.LatheGeometry(v, 6), name);
      m.rotation.z = -Math.PI / 2;
      m.position.set(0, AX, 0);
      return m;
    }
    // Striking head (chamfered hex)
    g.add(hexLathe([[0, 38], [10, 38], [24, 47], [24, 70], [19, 79], [0, 79]], 'worn_steel'));
    // Shaft
    const r = 17.5 / H * S;
    const body = mk(new THREE.CylinderGeometry(r, r, (1372 - 78) * S, 6), 'rusty_red_steel');
    body.rotation.z = -Math.PI / 2;
    body.position.set((1372 + 78) / 2 * S, AX, 0);
    g.add(body);
    // Point
    g.add(hexLathe([[0, 1370], [17.5, 1370], [12.5, 1445], [0, 1516]], 'worn_steel'));

    return settle(g, 'point_bar');
  }

  // ---------------- Machete (rows 4, 5, 6) ----------------
  function machete() {
    const g = new THREE.Group();

    // Blade outline sampled along x (sheet px): spine (top) and cutting edge (bottom)
    const xs  = [80, 90, 110, 140, 180, 240, 320, 420, 560, 700, 840, 960, 1068];
    const top = [550, 552, 556, 560, 565, 570, 575, 579, 583, 585, 587, 589, 591];
    const bot = [550, 576, 610, 643, 672, 700, 720, 733, 737, 734, 729, 723, 712];
    // Slices thin toward the tip (edge views show a long wedge)
    const slices = [[0, 4, 2.5], [4, 7, 4.0], [7, 9, 5.5], [9, 12, 7.0]];
    slices.forEach(s => {
      const i0 = s[0], i1 = s[1], tmm = s[2];
      const pts = [];
      for (let i = i0; i <= i1; i++) pts.push([xs[i], top[i]]);
      for (let i = i1; i >= i0; i--) pts.push([xs[i], bot[i]]);
      const clean = pts.filter((p, j) => {
        const q = pts[(j + 1) % pts.length];
        return !(q[0] === p[0] && q[1] === p[1]);
      });
      const sh = shapeFrom(clean, p => p[0] * S, p => -p[1] * S);
      const d = tmm / 1000;
      const geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
      geo.translate(0, 0, -d / 2);
      g.add(mk(geo, 'rusty_steel'));
    });

    // Wooden handle (outline inset by the bevel so the bevelled edge meets the drawing)
    const hp = [[1065, 579], [1150, 576], [1250, 574], [1340, 574], [1383, 578], [1397, 591],
                [1401, 612], [1395, 630], [1378, 642], [1340, 649], [1300, 643], [1260, 637],
                [1210, 641], [1160, 649], [1110, 652], [1065, 647]];
    const hs = shapeFrom(hp, p => p[0] * S, p => -p[1] * S);
    const bt = 0.003, bsz = 0.002;
    const hd = 0.030 - 2 * bt;
    const hg = new THREE.ExtrudeGeometry(hs, {
      depth: hd, bevelEnabled: true, bevelThickness: bt, bevelSize: bsz,
      bevelSegments: 2, curveSegments: 1
    });
    hg.translate(0, 0, -hd / 2);
    g.add(mk(hg, 'timber'));

    // Cord lanyard looped through the butt hole, hanging down
    const lp = [[1390, 612, 0], [1406, 616, 2], [1426, 636, 2.5], [1446, 668, 2.5], [1462, 702, 2],
                [1468, 730, 1], [1460, 752, 0], [1446, 764, -1], [1436, 748, -2], [1438, 716, -2.5],
                [1424, 682, -2.5], [1408, 648, -2], [1394, 624, -1]];
    const lc = new THREE.CatmullRomCurve3(
      lp.map(p => new THREE.Vector3(p[0] * S, -p[1] * S, p[2] / 1000)), true);
    g.add(mk(new THREE.TubeGeometry(lc, 40, 0.0022, 5, true), 'cord'));
    const knot = mk(new THREE.SphereGeometry(0.0042, 8, 6), 'cord');
    knot.position.set(1452 * S, -752 * S, 0);
    g.add(knot);

    return settle(g, 'machete');
  }

  return {
    wrecking_bar: wreckingBar(),
    point_bar: pointBar(),
    machete: machete()
  };
}
```