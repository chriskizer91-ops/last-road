- **Tow strap (overlap 0.81):** the outline is right, but the inner spiral is loose. Background shows between its turns, while on the sheet the layers are packed solid. The only opening on the sheet is a small oval near the top middle, at about x 195–330, y 95–150. My model's centre hole sits about 60 px too low. Fix: re-path the inner turns so they pack edge to edge around the sheet's hole, and lay a thin webbing fill under the coil so no gaps show through.
- **Shackles (overlap about 0.67):** they are the right shape and size. The bar thickness, bow span, ear positions, pin and eye tab all line up with the sheet to within about 10 px. The low overlap most likely comes from the strong drop shadows on the sheet, which the outline picks up. That is very costly on a thin ring shape, so I'm leaving them unchanged.
- **Compressor case (0.91) and tyre kit (0.95):** both are correct. The tilted camera for the case is right: lid top, base back rim and front rim all project close to where they sit on the sheet.
- The views and box sizes are correct, so only the build function changes.

```js
function build(THREE) {
  const S = 0.1 / 165; // metres per sheet pixel (scale bar: 165 px = 10 cm)
  const COLORS = {
    webbing: 0xa98a34,
    worn_steel: 0x8b857a,
    rusty_steel: 0x76604c,
    black_plastic: 0x4f4b43,
    black_metal: 0x302e2a,
    bare_aluminium: 0x8c8474,
    brass: 0x9e7c40,
    chrome: 0xa29e96,
    glass: 0xd8d2c4,
    yellow_rubber: 0xc8a02c,
    red_rubber: 0x8e2c24,
    black_rubber: 0x2c2a27,
    copper: 0xa6663e,
    canvas: 0x6e604a,
    elastic_webbing: 0x4a3e30,
    clear_plastic: 0xbcb4a6,
    brown_rubber: 0x6c3b23,
    steel: 0x8f8d89,
    bronze: 0x6d5b3f
  };
  const mats = {};
  function mesh(geo, name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name] });
    const m = new THREE.Mesh(geo, mats[name]);
    m.name = name;
    return m;
  }
  function add(parent, geo, name, x, y, z) {
    const m = mesh(geo, name);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function box(parent, w, h, d, x, y, z, name) {
    return add(parent, new THREE.BoxGeometry(w, h, d), name, x, y, z);
  }
  function cylX(parent, r, len, x, y, z, name, seg) {
    const m = add(parent, new THREE.CylinderGeometry(r, r, len, seg), name, x, y, z);
    m.rotation.z = Math.PI / 2;
    return m;
  }
  function cylZ(parent, rBack, rFront, len, x, y, z, name, seg) {
    const m = add(parent, new THREE.CylinderGeometry(rFront, rBack, len, seg), name, x, y, z);
    m.rotation.x = Math.PI / 2;
    return m;
  }
  function tube(parent, pts, r, segs, radial, name) {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
    const m = mesh(new THREE.TubeGeometry(curve, segs, r, radial, false), name);
    parent.add(m);
    return m;
  }

  // ---------------- tow strap (lying flat, top view) ----------------
  function buildStrap() {
    const g = new THREE.Group();
    const cx = 465, cy = 209;
    const r = 30 * S;   // half of the 60 px strap width
    const k = 0.12;     // squashes the 4-sided tube into a ~4 mm flat band
    const P = (p, h) => new THREE.Vector3((p[0] - cx) * S, h / k, (p[1] - cy) * S);
    function band(pts, hs, closed, segs) {
      const v = pts.map((p, i) => P(p, typeof hs === 'number' ? hs : hs[i]));
      const curve = new THREE.CatmullRomCurve3(v, closed, 'centripetal');
      const m = mesh(new THREE.TubeGeometry(curve, segs, r, 4, closed), 'webbing');
      m.scale.y = k;
      g.add(m);
    }
    const h0 = 0.0025, h1 = 0.0068, h2 = 0.0115;
    // outer C of the coil, from the upper splice round to the lower splice
    band([[645, 98], [580, 74], [480, 62], [360, 58], [240, 60], [140, 76], [75, 112], [48, 172],
          [62, 236], [115, 282], [210, 302], [320, 308], [420, 312], [490, 318]], h0, false, 70);
    // inner turns, packed edge to edge, closing round the small opening near the top middle
    const B = [[470, 300], [505, 262], [518, 200], [505, 140], [460, 95], [380, 68], [280, 62], [180, 68],
               [118, 95], [98, 150], [110, 205], [160, 240], [250, 252], [345, 248], [420, 228], [452, 180],
               [440, 128], [395, 90], [320, 72], [240, 72], [180, 92], [162, 128], [180, 165], [240, 182],
               [310, 182], [362, 165], [378, 130]];
    const hB = B.map((p, i) => (i <= 15 ? h1 : i === 16 ? 0.0092 : h2));
    band(B, hB, false, 130);
    // thin webbing layer under the coil so the packed layers read solid (opening left at the sheet's hole)
    const fillPts = [[600, 82], [580, 74], [480, 62], [360, 58], [240, 60], [140, 76], [75, 112], [48, 172],
                     [62, 236], [115, 282], [210, 302], [320, 308], [420, 312], [490, 318], [505, 262],
                     [515, 200], [505, 140], [525, 108], [575, 88]];
    const fs = new THREE.Shape();
    fillPts.forEach((p, i) => {
      const x = (p[0] - cx) * S, y = -(p[1] - cy) * S;
      if (i === 0) fs.moveTo(x, y); else fs.lineTo(x, y);
    });
    const fh = new THREE.Path();
    fh.absellipse((265 - cx) * S, -(126 - cy) * S, 78 * S, 30 * S, 0, Math.PI * 2, true);
    fs.holes.push(fh);
    const fill = mesh(new THREE.ExtrudeGeometry(fs, { depth: 0.002, bevelEnabled: false, curveSegments: 16 }), 'webbing');
    fill.rotation.x = -Math.PI / 2;
    g.add(fill);
    // eye loops
    band([[752, 112], [800, 95], [850, 112], [880, 155], [875, 195], [840, 205], [795, 180], [760, 148]], h0, true, 40);
    band([[645, 298], [700, 268], [790, 262], [862, 285], [866, 330], [800, 354], [700, 352], [645, 330]], h0, true, 44);
    // sewn (double-layer) splice sections
    function patch(px, py, lenPx, widPx, ang) {
      const m = box(g, lenPx * S, 0.008, widPx * S, (px - cx) * S, 0.004, (py - cy) * S, 'webbing');
      m.rotation.y = ang;
    }
    patch(700, 112, 135, 66, Math.atan2(-33, 125));
    patch(565, 320, 175, 78, Math.atan2(10, 170));
    return g;
  }

  // ---------------- bow shackle (lying flat, bow toward -z) ----------------
  function buildShackle(tabEnd) {
    const g = new THREE.Group();
    const rb = 31 * S;                    // bar radius
    const off = -(tabEnd - 119) / 2;      // px shift so the outline is centred on x = 0
    const cyPx = 236.5;
    const Q = (rx, py, h) => new THREE.Vector3((rx + off) * S, h, (py - cyPx) * S);
    const bowPts = [[-70, 340], [-80, 285], [-85, 225], [-80, 170], [-58, 135], [-28, 119], [0, 116],
                    [28, 119], [58, 135], [80, 170], [85, 225], [80, 285], [70, 340]];
    const bowCurve = new THREE.CatmullRomCurve3(bowPts.map(p => Q(p[0], p[1], rb)), false, 'centripetal');
    g.add(mesh(new THREE.TubeGeometry(bowCurve, 32, rb, 8, false), 'worn_steel'));
    for (const sx of [-1, 1]) {
      const e = Q(sx * 70, 345, rb);
      add(g, new THREE.CylinderGeometry(38 * S, 38 * S, 2 * rb, 16), 'worn_steel', e.x, e.y, e.z);
    }
    const pz = (318 - cyPx) * S;
    cylX(g, 27 * S, 190 * S, (-5 + off) * S, rb, pz, 'rusty_steel', 12);   // pin
    cylX(g, 30 * S, 18 * S, (89 + off) * S, rb, pz, 'rusty_steel', 12);    // pin collar
    // pin eye tab with hole
    const half = 30 * S, xa = (92 + off) * S, xc = (tabEnd - 30 + off) * S;
    const sh = new THREE.Shape();
    sh.moveTo(xa, -half);
    sh.lineTo(xc, -half);
    sh.absarc(xc, 0, half, -Math.PI / 2, Math.PI / 2, false);
    sh.lineTo(xa, half);
    sh.lineTo(xa, -half);
    const hole = new THREE.Path();
    hole.absarc(xc, 0, 10 * S, 0, Math.PI * 2, true);
    sh.holes.push(hole);
    const tab = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false, curveSegments: 8 }), 'rusty_steel');
    tab.rotation.x = -Math.PI / 2;
    tab.position.set(0, rb - 0.006, pz);
    g.add(tab);
    return g;
  }

  // ---------------- compressor in open case ----------------
  function buildCompressor() {
    const g = new THREE.Group();
    const W = 0.433, Wl = 0.425, D = 0.198, Hb = 0.143, Hl = 0.04, tw = 0.008, tf = 0.006, latch = 0.012;
    const c = new THREE.Group();
    c.position.z = -((-D / 2 - Hl) + (D / 2 + latch)) / 2;
    g.add(c);
    // base tub
    box(c, W, tf, D, 0, tf / 2, 0, 'black_plastic');
    box(c, W, Hb, tw, 0, Hb / 2, D / 2 - tw / 2, 'black_plastic');
    box(c, W, Hb, tw, 0, Hb / 2, -D / 2 + tw / 2, 'black_plastic');
    box(c, tw, Hb, D - 2 * tw, -W / 2 + tw / 2, Hb / 2, 0, 'black_plastic');
    box(c, tw, Hb, D - 2 * tw, W / 2 - tw / 2, Hb / 2, 0, 'black_plastic');
    for (const lx of [-0.122, 0.118]) box(c, 0.036, 0.11, latch, lx, 0.075, D / 2 + latch / 2, 'black_plastic');
    // lid, hinged at the back top edge, standing upright
    const lid = new THREE.Group();
    lid.position.set(0, Hb, -D / 2);
    lid.rotation.x = -Math.PI / 2;
    c.add(lid);
    box(lid, Wl, tf, D, 0, Hl - tf / 2, D / 2, 'black_plastic');
    box(lid, Wl, Hl - tf, tw, 0, (Hl - tf) / 2, D - tw / 2, 'black_plastic');
    box(lid, Wl, Hl - tf, tw, 0, (Hl - tf) / 2, tw / 2, 'black_plastic');
    box(lid, tw, Hl - tf, D - 2 * tw, -Wl / 2 + tw / 2, (Hl - tf) / 2, D / 2, 'black_plastic');
    box(lid, tw, Hl - tf, D - 2 * tw, Wl / 2 - tw / 2, (Hl - tf) / 2, D / 2, 'black_plastic');
    for (const lx of [-0.122, 0.116]) box(lid, 0.036, 0.022, 0.008, lx, Hl / 2, D + 0.004, 'black_plastic');
    // motor and pump
    const mr = 0.042;
    cylX(c, mr, 0.179, -0.0735, tf + mr, -0.048, 'black_metal', 16);
    cylX(c, 0.036, 0.052, 0.042, tf + 0.036, -0.05, 'black_metal', 12);
    add(c, new THREE.CylinderGeometry(0.024, 0.024, 0.06, 12), 'bare_aluminium', 0.019, 0.095, -0.055);
    box(c, 0.075, 0.05, 0.044, 0.019, 0.145, -0.055, 'bare_aluminium');
    for (let i = 0; i < 5; i++) box(c, 0.004, 0.016, 0.044, 0.019 + (i - 2) * 0.016, 0.178, -0.055, 'bare_aluminium');
    // pressure gauge on a brass stalk, face tilted toward the viewer
    const ga = 25 * Math.PI / 180, gx = -0.093, gy = 0.188, gz = -0.066;
    const hous = add(c, new THREE.CylinderGeometry(0.03, 0.03, 0.016, 20), 'chrome', gx, gy, gz);
    hous.rotation.x = ga;
    const face = add(c, new THREE.CylinderGeometry(0.026, 0.026, 0.002, 20), 'glass',
      gx, gy + Math.cos(ga) * 0.009, gz + Math.sin(ga) * 0.009);
    face.rotation.x = ga;
    add(c, new THREE.CylinderGeometry(0.006, 0.006, 0.09, 8), 'brass', gx, 0.131, gz);
    cylX(c, 0.007, 0.075, -0.0555, 0.135, -0.062, 'black_rubber', 8);
    // red and black leads with clamps
    tube(c, [[-0.10, 0.13, -0.07], [-0.14, 0.128, -0.076], [-0.176, 0.1, -0.06], [-0.19, 0.05, -0.02],
             [-0.17, 0.016, 0.004], [-0.11, 0.013, 0.006], [-0.04, 0.013, 0.006], [0.0, 0.014, 0.012],
             [0.014, 0.014, 0.03]], 0.006, 30, 5, 'red_rubber');
    tube(c, [[-0.163, 0.04, -0.022], [-0.155, 0.014, 0.012], [-0.11, 0.012, 0.03], [-0.077, 0.014, 0.022]],
      0.006, 24, 5, 'black_rubber');
    box(c, 0.05, 0.016, 0.022, -0.05, 0.014, 0.022, 'black_rubber');
    box(c, 0.04, 0.012, 0.018, -0.005, 0.013, 0.022, 'copper');
    box(c, 0.05, 0.016, 0.022, 0.04, 0.014, 0.03, 'red_rubber');
    box(c, 0.04, 0.012, 0.018, 0.085, 0.013, 0.03, 'copper');
    // coiled yellow air hose, axis front-to-back
    const turns = 8, R = 0.056, ccx = 0.12, ccy = tf + 0.062, z0 = -0.082, z1 = 0.012;
    const coilPts = [];
    for (let i = 0; i <= turns * 12; i++) {
      const t = i / (turns * 12), a = -Math.PI / 2 + t * turns * Math.PI * 2;
      coilPts.push(new THREE.Vector3(ccx + R * Math.cos(a), ccy + R * Math.sin(a), z0 + (z1 - z0) * t));
    }
    c.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPts), turns * 10, 0.006, 6, false), 'yellow_rubber'));
    cylZ(c, 0.008, 0.008, 0.03, ccx, 0.013, 0.027, 'chrome', 10);
    return g;
  }

  // ---------------- tyre repair kit in open zip pouch ----------------
  function buildPouch() {
    const g = new THREE.Group();
    const cx = 1155.5, cy = 705;
    const X = px => (px - cx) * S, Z = py => (py - cy) * S;
    function rr(p, xa, xb, ya, yb, r) {
      p.moveTo(xa + r, ya);
      p.lineTo(xb - r, ya); p.quadraticCurveTo(xb, ya, xb, ya + r);
      p.lineTo(xb, yb - r); p.quadraticCurveTo(xb, yb, xb - r, yb);
      p.lineTo(xa + r, yb); p.quadraticCurveTo(xa, yb, xa, yb - r);
      p.lineTo(xa, ya + r); p.quadraticCurveTo(xa, ya, xa + r, ya);
      return p;
    }
    const x0 = X(857), x1 = X(1410), zh = 0.1455;
    const fl = mesh(new THREE.ExtrudeGeometry(rr(new THREE.Shape(), x0, x1, -zh, zh, 0.03),
      { depth: 0.006, bevelEnabled: false, curveSegments: 4 }), 'canvas');
    fl.rotation.x = -Math.PI / 2;
    g.add(fl);
    const rimS = rr(new THREE.Shape(), x0, x1, -zh, zh, 0.03);
    rimS.holes.push(rr(new THREE.Path(), x0 + 0.018, x1 - 0.018, -zh + 0.018, zh - 0.018, 0.014));
    const rim = mesh(new THREE.ExtrudeGeometry(rimS, { depth: 0.026, bevelEnabled: false, curveSegments: 4 }), 'canvas');
    rim.rotation.x = -Math.PI / 2;
    g.add(rim);
    // T-handle reamer and insertion needle
    const ty = 0.02;
    function tTool(barX0, barX1, barZ, stemX, neckZ0, neckZ1, shaftZ1, shaftR) {
      const bar = cylX(g, 0.021, X(barX1) - X(barX0), (X(barX0) + X(barX1)) / 2, ty, Z(barZ), 'black_rubber', 12);
      bar.scale.x = 0.65;
      cylZ(g, 0.013, 0.009, Z(neckZ1) - Z(neckZ0), X(stemX), ty, (Z(neckZ0) + Z(neckZ1)) / 2, 'black_rubber', 10);
      const sz0 = Z(neckZ1) - 0.004, sz1 = Z(shaftZ1);
      cylZ(g, shaftR, shaftR, sz1 - sz0, X(stemX), ty, (sz0 + sz1) / 2, 'steel', 8);
      const tip = add(g, new THREE.ConeGeometry(shaftR, 0.012, 8), 'steel', X(stemX), ty, sz1 + 0.006);
      tip.rotation.x = Math.PI / 2;
    }
    tTool(915, 1065, 555, 1022, 575, 648, 782, 0.0045);
    tTool(1145, 1290, 552, 1241, 575, 640, 778, 0.0035);
    // elastic retaining strap
    const sx0 = X(925), sx1 = X(1335), sz = (Z(648) + Z(690)) / 2, sd = Z(690) - Z(648);
    box(g, sx1 - sx0, 0.003, sd, (sx0 + sx1) / 2, 0.027, sz, 'elastic_webbing');
    box(g, 0.01, 0.022, sd, sx0 + 0.005, 0.017, sz, 'elastic_webbing');
    box(g, 0.01, 0.022, sd, sx1 - 0.005, 0.017, sz, 'elastic_webbing');
    // plug strip pack
    box(g, X(1335) - X(935), 0.004, Z(925) - Z(785), (X(935) + X(1335)) / 2, 0.008, (Z(785) + Z(925)) / 2, 'clear_plastic');
    for (const py of [806, 838, 870, 902]) cylX(g, 0.0045, 0.218, -0.0155, 0.0105, Z(py), 'brown_rubber', 8);
    // zip slider and pull
    box(g, 0.016, 0.01, 0.022, X(1405), 0.02, Z(770), 'bronze');
    const pull = box(g, 0.036, 0.004, 0.014, X(1430), 0.006, Z(786), 'bronze');
    pull.rotation.y = -Math.PI / 4;
    return g;
  }

  return {
    tow_strap: buildStrap(),
    shackle_left: buildShackle(140),
    shackle_right: buildShackle(155),
    compressor_case: buildCompressor(),
    tyre_repair_kit: buildPouch()
  };
}
```