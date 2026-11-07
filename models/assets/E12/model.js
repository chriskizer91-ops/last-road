function build(THREE) {
  const mats = {};
  function mat(name, color) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: color });
    return mats[name];
  }
  function add(parent, geo, name, color, x, y, z, rx, ry, rz) {
    const m = new THREE.Mesh(geo, mat(name, color));
    m.name = name;
    m.position.set(x || 0, y || 0, z || 0);
    m.rotation.set(rx || 0, ry || 0, rz || 0);
    parent.add(m);
    return m;
  }
  const V2 = (x, y) => new THREE.Vector2(x, y);

  // rounded rectangle outline, counter-clockwise, explicit points (no duplicate points)
  function rrectPts(x0, y0, x1, y1, rb, rt, n) {
    const pts = [];
    const corner = (cx, cy, r, a0) => {
      for (let i = 0; i <= n; i++) {
        const a = a0 + (i / n) * Math.PI / 2;
        pts.push(V2(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
    };
    corner(x1 - rb, y0 + rb, rb, -Math.PI / 2);
    corner(x1 - rt, y1 - rt, rt, 0);
    corner(x0 + rt, y1 - rt, rt, Math.PI / 2);
    corner(x0 + rb, y0 + rb, rb, Math.PI);
    return pts;
  }
  // offset a convex CCW polygon (array of [x,y]); d > 0 moves inward
  function offsetPoly(pts, d) {
    const n = pts.length, lines = [];
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const L = Math.hypot(dx, dy); dx /= L; dy /= L;
      lines.push({ px: a[0] - dy * d, py: a[1] + dx * d, dx: dx, dy: dy });
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const l1 = lines[(i + n - 1) % n], l2 = lines[i];
      const den = l1.dx * l2.dy - l1.dy * l2.dx;
      const t = ((l2.px - l1.px) * l2.dy - (l2.py - l1.py) * l2.dx) / den;
      out.push(V2(l1.px + t * l1.dx, l1.py + t * l1.dy));
    }
    return out;
  }
  // extrude an XY shape along z, centred on z = 0; bevel rounds the front/back edges
  function extrudeXY(shape, depth, bevel, segs) {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: depth, steps: 1, bevelEnabled: bevel > 0,
      bevelThickness: bevel, bevelSize: bevel, bevelOffset: 0,
      bevelSegments: segs || 2, curveSegments: 4
    });
    g.translate(0, 0, -depth / 2);
    return g;
  }
  // rounded-rectangle slab in plan (x by z), from y0 up by h
  function planSlab(w, d, r, h, y0) {
    const s = new THREE.Shape(rrectPts(-w / 2, -d / 2, w / 2, d / 2, r, r, 3));
    const g = new THREE.ExtrudeGeometry(s, { depth: h, steps: 1, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    g.translate(0, y0, 0);
    return g;
  }

  const GREEN = 0x6f7646, STEEL = 0x7d6847, BLUE = 0x5f7aa6, DBLUE = 0x48679a;
  const RED = 0xa64a3c, BUNG = 0x7a6c5c, TIN = 0x8f897d;

  // ---------------- JERRY CAN ----------------
  const jerry = new THREE.Group();
  jerry.name = 'jerry_can';
  {
    const W = 0.364, HB = 0.396, D = 0.164, rb = 0.012;
    // front profile with the chamfered spout corner at top-left
    const prof = [[-W / 2, 0], [W / 2, 0], [W / 2, HB], [-0.101, HB], [-W / 2, 0.337]];
    add(jerry, extrudeXY(new THREE.Shape(offsetPoly(prof, rb)), D - 2 * rb, rb, 2), 'paint_green', GREEN);
    // welded seam flange around the middle
    const bead = offsetPoly(prof, -0.003).map(p => V2(p.x, Math.max(0, p.y)));
    add(jerry, extrudeXY(new THREE.Shape(bead), 0.006, 0), 'paint_green', GREEN);

    // spout on the chamfer, pointing up-left
    const ang = 0.63, nx = -Math.sin(ang), ny = Math.cos(ang);
    const mx = -0.1415, my = 0.3665;
    add(jerry, new THREE.CylinderGeometry(0.022, 0.022, 0.03, 12), 'rusty_steel', STEEL,
      mx + nx * 0.005, my + ny * 0.005, 0, 0, 0, ang);
    add(jerry, new THREE.CylinderGeometry(0.024, 0.024, 0.022, 16), 'rusty_steel', STEEL,
      mx + nx * 0.031, my + ny * 0.031, 0, 0, 0, ang);
    // cam clamp over the cap, lever arm and hinge bracket
    add(jerry, new THREE.BoxGeometry(0.03, 0.03, 0.034), 'rusty_steel', STEEL, -0.163, 0.42, 0, 0, 0, ang);
    add(jerry, new THREE.BoxGeometry(0.12, 0.014, 0.028), 'rusty_steel', STEEL, -0.118, 0.425, 0, 0, 0, -0.15);
    add(jerry, new THREE.BoxGeometry(0.024, 0.016, 0.034), 'rusty_steel', STEEL, -0.062, 0.402, 0);

    // triple handle frame: three arches across the depth, joined by two rails
    const hr = 0.0085, yTop = 0.4415, yBase = 0.39;
    const xs = [-0.05, 0.0575, 0.165], zs = [-0.062, 0.062];
    for (const x of xs) {
      for (const z of zs) {
        add(jerry, new THREE.CylinderGeometry(hr, hr, yTop - yBase, 8), 'paint_green', GREEN,
          x, (yTop + yBase) / 2, z);
      }
      add(jerry, new THREE.CylinderGeometry(hr, hr, 0.124 + 2 * hr, 8), 'paint_green', GREEN,
        x, yTop, 0, Math.PI / 2, 0, 0);
    }
    for (const z of zs) {
      add(jerry, new THREE.CylinderGeometry(hr, hr, 0.215 + 2 * hr, 8), 'paint_green', GREEN,
        0.0575, yTop, z, 0, 0, Math.PI / 2);
    }
  }

  // ---------------- WATER CAN (blue plastic) ----------------
  const water = new THREE.Group();
  water.name = 'water_can';
  {
    const WW = 0.384, WH = 0.397, WD = 0.215, wr = 0.03;
    const bodyShape = new THREE.Shape(rrectPts(-WW / 2 + wr, wr, WW / 2 - wr, WH - wr, 0.008, 0.03, 4));
    add(water, extrudeXY(bodyShape, WD - 2 * wr, wr, 3), 'blue_plastic', BLUE);

    // moulded carry handle with its grip hole, top right
    const hb = 0.008;
    const hShape = new THREE.Shape(rrectPts(-0.027, 0.363, 0.147, 0.452, 0.005, 0.022, 3));
    hShape.holes.push(new THREE.Path(rrectPts(-0.008, 0.392, 0.128, 0.44, 0.012, 0.014, 3)));
    add(water, extrudeXY(hShape, 0.06 - 2 * hb, hb, 2), 'blue_plastic', BLUE);

    // neck and screw cap, top left
    add(water, new THREE.CylinderGeometry(0.042, 0.046, 0.06, 16), 'blue_plastic', BLUE, -0.115, 0.39, -0.02);
    add(water, new THREE.CylinderGeometry(0.056, 0.056, 0.035, 20), 'dark_blue_plastic', DBLUE, -0.115, 0.4305, -0.02);
  }

  // ---------------- 200 L DRUM ----------------
  const drum = new THREE.Group();
  drum.name = 'drum_200l';
  {
    const R = 0.292;
    // shell: bottom at 0.005, lid at 0.795
    add(drum, new THREE.CylinderGeometry(R, R, 0.79, 32), 'paint_red', RED, 0, 0.4, 0);
    const ring = (y) => add(drum, new THREE.TorusGeometry(R, 0.008, 6, 32), 'paint_red', RED,
      0, y, 0, Math.PI / 2, 0, 0);
    ring(0.008);  // bottom chime
    ring(0.802);  // top chime
    ring(0.26);   // rolling hoops
    ring(0.53);
    // large bung (left) and small vent bung (right) on the lid
    add(drum, new THREE.CylinderGeometry(0.052, 0.052, 0.02, 16), 'bare_steel', BUNG, -0.185, 0.805, 0);
    add(drum, new THREE.CylinderGeometry(0.036, 0.036, 0.012, 16), 'bare_steel', BUNG, -0.185, 0.819, 0);
    add(drum, new THREE.CylinderGeometry(0.034, 0.034, 0.018, 16), 'bare_steel', BUNG, 0.222, 0.804, 0);
    add(drum, new THREE.CylinderGeometry(0.022, 0.022, 0.01, 16), 'bare_steel', BUNG, 0.222, 0.817, 0);
  }

  // ---------------- OIL TIN ----------------
  const oil = new THREE.Group();
  oil.name = 'oil_can';
  {
    const OW = 0.158, OD = 0.104, OH = 0.29;
    add(oil, planSlab(OW, OD, 0.008, OH - 0.004, 0.003), 'tinplate', TIN);
    // rolled seams, bottom and top
    add(oil, planSlab(OW + 0.006, OD + 0.006, 0.01, 0.007, 0), 'tinplate', TIN);
    add(oil, planSlab(OW + 0.006, OD + 0.006, 0.01, 0.008, OH - 0.006), 'tinplate', TIN);
    // neck and screw cap, top left
    add(oil, new THREE.CylinderGeometry(0.016, 0.016, 0.012, 12), 'tinplate', TIN, -0.046, 0.293, 0);
    add(oil, new THREE.CylinderGeometry(0.021, 0.021, 0.014, 16), 'tinplate', TIN, -0.046, 0.304, 0);
  }

  return { jerry_can: jerry, water_can: water, drum_200l: drum, oil_can: oil };
}
