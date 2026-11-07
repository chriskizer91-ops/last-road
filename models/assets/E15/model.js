function build(THREE) {
  const COLORS = {
    canvas: 0x8e7b4c,
    leather: 0x6b4428,
    brass: 0x8b7650,
    paint_green: 0x6c6b52,
    sooty_steel: 0x4a4239,
    rusty_iron: 0x544336,
    bakelite: 0x45433e,
    galvanised_steel: 0xa19f97,
    steel: 0x85827a
  };
  const mats = {};
  function M(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name] });
    return mats[name];
  }
  function add(parent, geo, name, x, y, z) {
    const m = new THREE.Mesh(geo, M(name));
    m.name = name;
    m.position.set(x || 0, y || 0, z || 0);
    parent.add(m);
    return m;
  }
  function box(p, name, w, h, d, x, y, z) {
    return add(p, new THREE.BoxGeometry(w, h, d), name, x, y, z);
  }
  function roundRect(w, d, r) {
    const s = new THREE.Shape();
    const x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r);
    s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d);
    s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  // rounded-corner slab in plan (w along x, d along z), h tall, bottom at y0
  function slab(p, name, w, d, h, r, y0, x, z) {
    const geo = new THREE.ExtrudeGeometry(roundRect(w, d, r), { depth: h, bevelEnabled: false, curveSegments: 4 });
    const m = add(p, geo, name, x, y0, z);
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  // ---------------- rolled swag ----------------
  function swagRolled() {
    const g = new THREE.Group();
    g.name = 'swag_rolled';
    const L = 1.09, R = 0.205, RS = 0.214, Y = 0.214;
    const prof = [
      [0, -L / 2], [R * 0.6, -L / 2], [R * 0.84, -L / 2 + 0.01], [R * 0.95, -L / 2 + 0.03], [R, -L / 2 + 0.065],
      [R, L / 2 - 0.065], [R * 0.95, L / 2 - 0.03], [R * 0.84, L / 2 - 0.01], [R * 0.6, L / 2], [0, L / 2]
    ].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    const roll = add(g, new THREE.LatheGeometry(prof, 28), 'canvas', 0, Y, 0);
    roll.rotation.z = Math.PI / 2;
    // outer canvas layer ending in the flap edge on the lower front
    const flap = add(g, new THREE.CylinderGeometry(R + 0.005, R + 0.005, L - 0.16, 16, 1, true, -2.85, 2.27), 'canvas', 0, Y, 0);
    flap.rotation.z = Math.PI / 2;
    // two leather straps with buckles a little above centre on the front
    [-0.27, 0.29].forEach(function (sx) {
      const st = add(g, new THREE.CylinderGeometry(RS, RS, 0.065, 28), 'leather', sx, Y, 0);
      st.rotation.z = Math.PI / 2;
      const a = 0.27;
      const rb = RS + 0.004;
      const b = box(g, 'brass', 0.055, 0.05, 0.01, sx, Y + rb * Math.sin(a), rb * Math.cos(a));
      b.rotation.x = -a;
    });
    return g;
  }

  // ---------------- swag laid out (closed flap) ----------------
  function swagOpen() {
    const g = new THREE.Group();
    g.name = 'swag_open';
    const s = 0.002834; // metres per sheet pixel for this drawing (scaled to a 1.95 m swag)
    const X = function (p) { return -1.098 + (p - 20) * s; };
    const Z = function (p) { return (p - 828) * s; };
    const xa = X(20), xb = X(707), za = Z(712), zb = Z(945);
    const cx = (xa + xb) / 2, cz = (za + zb) / 2, Lc = xb - xa, Wc = zb - za;
    // ground sheet
    box(g, 'canvas', Lc, 0.012, Wc, cx, 0.006, cz);
    // padded mattress under the top flap, soft edges
    const bev = 0.03;
    const hx = Lc / 2 - 0.015 - bev, hz = Wc / 2 - 0.02 - bev;
    const sh = new THREE.Shape();
    sh.moveTo(-hx, -hz);
    sh.lineTo(hx, -hz);
    sh.lineTo(hx, hz);
    sh.lineTo(-hx, hz);
    const body = add(g, new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.03, bevelSize: bev, bevelSegments: 3 }), 'canvas', cx, 0.042, cz);
    body.rotation.x = -Math.PI / 2;
    // pillow bulge at the head end (-x)
    const pil = add(g, new THREE.SphereGeometry(1, 16, 10), 'canvas', xa + 0.22, 0.082, cz);
    pil.scale.set(0.17, 0.05, 0.24);
    // straps lying out past the foot end
    [767, 908].forEach(function (py) {
      const z = Z(py);
      const x0 = X(698), x1 = X(793);
      box(g, 'leather', x1 - x0, 0.007, 0.04, (x0 + x1) / 2, 0.0095, z);
      box(g, 'brass', 0.035, 0.01, 0.052, X(752), 0.012, z);
    });
    return g;
  }

  // ---------------- camp stove, closed ----------------
  function stoveClosed() {
    const g = new THREE.Group();
    g.name = 'stove_closed';
    slab(g, 'paint_green', 0.625, 0.335, 0.09, 0.02, 0);
    slab(g, 'paint_green', 0.64, 0.345, 0.042, 0.022, 0.09);
    [-0.16, 0.16].forEach(function (x) {
      const k = add(g, new THREE.CylinderGeometry(0.028, 0.028, 0.026, 16), 'bakelite', x, 0.045, 0.1675 + 0.013);
      k.rotation.x = Math.PI / 2;
    });
    box(g, 'rusty_iron', 0.05, 0.06, 0.01, 0, 0.1, 0.1725 + 0.005);
    return g;
  }

  // ---------------- camp stove, open ----------------
  function stoveOpen() {
    const g = new THREE.Group();
    g.name = 'stove_open';
    const W = 0.625, D = 0.345, H = 0.095, t = 0.006;
    // base tray (same body as the closed stove)
    slab(g, 'paint_green', W, D, 0.012, 0.02, 0);
    box(g, 'paint_green', W, H, t, 0, H / 2, D / 2 - t / 2);
    box(g, 'paint_green', W, H, t, 0, H / 2, -D / 2 + t / 2);
    box(g, 'paint_green', t, H, D - 2 * t, -W / 2 + t / 2, H / 2, 0);
    box(g, 'paint_green', t, H, D - 2 * t, W / 2 - t / 2, H / 2, 0);
    box(g, 'rusty_iron', W - 2 * t, 0.005, D - 2 * t, 0, 0.055, 0);
    // burners
    [-0.15, 0.15].forEach(function (x) {
      add(g, new THREE.CylinderGeometry(0.048, 0.052, 0.022, 16), 'brass', x, 0.069, -0.01);
      add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.012, 12), 'brass', x, 0.086, -0.01);
    });
    // wire grate on the rim, in front of the lid tray
    const gy = H + 0.004, r = 0.006, gw = W - 0.03;
    const gz0 = -0.122, gz1 = D / 2 - 0.015, gd = gz1 - gz0, gzc = (gz0 + gz1) / 2;
    box(g, 'rusty_iron', gw, r, r, 0, gy, gz1);
    box(g, 'rusty_iron', gw, r, r, 0, gy, gz0);
    box(g, 'rusty_iron', r, r, gd, -gw / 2, gy, gzc);
    box(g, 'rusty_iron', r, r, gd, gw / 2, gy, gzc);
    [-0.055, 0.055].forEach(function (dz) { box(g, 'rusty_iron', gw, r, r, 0, gy, gzc + dz); });
    for (let i = 1; i <= 8; i++) {
      box(g, 'rusty_iron', r, r, gd, -gw / 2 + i * gw / 9, gy, gzc);
    }
    // lid standing up at the back, hinged just below the rim: a shallow tray open to the front
    const LH = 0.385, LW = 0.64, LD = 0.045, lt = 0.007, zb = -D / 2, yb = 0.09;
    box(g, 'paint_green', LW, LH, lt, 0, yb + LH / 2, zb + lt / 2);
    box(g, 'sooty_steel', LW - 2 * lt, LH - lt, 0.003, 0, yb + (LH - lt) / 2, zb + lt + 0.0015);
    box(g, 'paint_green', lt, LH, LD, -LW / 2 + lt / 2, yb + LH / 2, zb + LD / 2);
    box(g, 'paint_green', lt, LH, LD, LW / 2 - lt / 2, yb + LH / 2, zb + LD / 2);
    box(g, 'paint_green', LW, lt, LD, 0, yb + LH - lt / 2, zb + LD / 2);
    // wind panels folded forward from the lid sides, sloping down to the rim at mid-depth
    const zf = zb + LD;
    const ps = new THREE.Shape();
    ps.moveTo(zf, H + 0.002);
    ps.lineTo(0.05, H + 0.002);
    ps.lineTo(0.05, H + 0.02);
    ps.lineTo(zf, 0.33);
    [-1, 1].forEach(function (sd) {
      const p = add(g, new THREE.ExtrudeGeometry(ps, { depth: 0.004, bevelEnabled: false }), 'paint_green', sd > 0 ? 0.32 : -0.316, 0, 0);
      p.rotation.y = -Math.PI / 2;
    });
    // knobs and front latch
    [-0.16, 0.16].forEach(function (x) {
      const k = add(g, new THREE.CylinderGeometry(0.028, 0.028, 0.026, 16), 'bakelite', x, 0.05, D / 2 + 0.013);
      k.rotation.x = Math.PI / 2;
    });
    box(g, 'rusty_iron', 0.05, 0.03, 0.01, 0, H - 0.017, D / 2 + 0.005);
    return g;
  }

  // ---------------- food box, closed ----------------
  function foodBox() {
    const g = new THREE.Group();
    g.name = 'food_box';
    const W = 0.51, D = 0.255, HB = 0.25, HL = 0.075;
    slab(g, 'galvanised_steel', W, D, HB, 0.018, 0);
    slab(g, 'galvanised_steel', W + 0.01, D + 0.01, HL, 0.022, HB);
    // fold-down end handles
    [-1, 1].forEach(function (sd) {
      const xe = sd * W / 2;
      [-0.045, 0.045].forEach(function (z) {
        box(g, 'steel', 0.016, 0.03, 0.014, xe + sd * 0.008, 0.212, z);
        box(g, 'steel', 0.008, 0.04, 0.008, xe + sd * 0.012, 0.193, z);
      });
      const bar = add(g, new THREE.CylinderGeometry(0.006, 0.006, 0.11, 10), 'steel', xe + sd * 0.012, 0.175, 0);
      bar.rotation.x = Math.PI / 2;
    });
    // front latches spanning the lid seam
    [-0.17, 0.17].forEach(function (x) {
      box(g, 'steel', 0.042, 0.075, 0.01, x, HB + 0.005, D / 2 + 0.0095);
      box(g, 'steel', 0.03, 0.012, 0.016, x, HB + 0.03, D / 2 + 0.0125);
    });
    return g;
  }

  return {
    swag_rolled: swagRolled(),
    swag_open: swagOpen(),
    stove_open: stoveOpen(),
    stove_closed: stoveClosed(),
    food_box: foodBox()
  };
}
