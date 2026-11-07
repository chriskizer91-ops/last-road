**Review**

- **Shape matches the sheet.** The cornice is at 4.34 m and the tower is 7.43 m tall. Front and back door positions, the collapse span and pier, the hand panel, the projecting back-right tower and the roof hole all land within a few centimetres of the sheet. The overlaps are 0.96–0.98, so the boxes and cameras are right.
- **Dropping the middle-right "SIDE" was correct.** It shows a long, doorless, towerless wall that matches no face of this building. The +x end isn't drawn on the sheet, so it stays a colour guess.
- **Real fault: the model doesn't stand on y = 0.** The lowest point is −0.139 m.
  - Rubble stones are rotated through the ground.
  - The battered walls pivot on their outer bottom edge, which pushes the inner bottom edge 5–6 cm below ground.
- **Fix:**
  - Each rubble stone is lifted until it clears the ground.
  - Each battered wall is raised by T·sin(batter), so its inner bottom edge sits at 0.
  - The plinth courses move to the untilted wall frame. They still meet the ground and cover the 5 cm lift on the outside.
  - Nothing else changes, so the views JSON stays as it is.

```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'great_hall_tower';

  // ---------- materials ----------
  const mats = {};
  function mat(name, color) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: color, roughness: 0.95, metalness: 0.0 });
    return mats[name];
  }
  const STONE = 0x7c6a53, LOOSE = 0x927f64, TIMBER = 0x2a221b;

  function addMesh(parent, geo, name, color) {
    const m = new THREE.Mesh(geo, mat(name, color));
    m.name = name;
    parent.add(m);
    return m;
  }
  function box(parent, name, color, w, h, d, x, y, z, rx, ry, rz) {
    const m = addMesh(parent, new THREE.BoxGeometry(w, h, d), name, color);
    m.position.set(x, y, z);
    m.rotation.set(rx || 0, ry || 0, rz || 0);
    return m;
  }
  function stone(parent, w, h, d, x, y, z, rx, ry, rz) {
    return box(parent, 'stone', STONE, w, h, d, x, y, z, rx, ry, rz);
  }
  function poly(pts) {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    return s;
  }
  function rect(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }

  // A wall's local frame: x along the wall, y up, outer face at z = 0, outward = +z.
  // tilt leans the top inward (battered wall); the tilted frame is raised by T*sin(tilt)
  // so the inner bottom edge sits exactly on the ground instead of dipping under it.
  function frame(px, pz, rotY, tilt, T) {
    const g = new THREE.Group();
    g.position.set(px, 0, pz);
    g.rotation.y = rotY;
    const t = new THREE.Group();
    t.rotation.x = -tilt;
    t.position.y = (T || 0) * Math.sin(tilt);
    g.add(t);
    root.add(g);
    return t;
  }
  // Outer layer (t1 thick) carries door/slit holes; inner layer is solid, so openings are real recesses.
  function wallBody(t, pieces, T, t1) {
    const hasHoles = pieces.some(function (p) { return p.holes && p.holes.length; });
    if (!hasHoles || t1 <= 0) {
      const g = new THREE.ExtrudeGeometry(pieces.map(function (p) { return poly(p.pts); }), { depth: T, bevelEnabled: false });
      g.translate(0, 0, -T);
      addMesh(t, g, 'stone', STONE);
      return;
    }
    const outer = [], inner = [];
    pieces.forEach(function (p) {
      const so = poly(p.pts);
      (p.holes || []).forEach(function (h) { so.holes.push(poly(rect(h[0], h[1], h[2], h[3]))); });
      outer.push(so);
      inner.push(poly(p.pts));
    });
    const g1 = new THREE.ExtrudeGeometry(outer, { depth: t1, bevelEnabled: false });
    g1.translate(0, 0, -t1);
    addMesh(t, g1, 'stone', STONE);
    const g2 = new THREE.ExtrudeGeometry(inner, { depth: T - t1, bevelEnabled: false });
    g2.translate(0, 0, -T);
    addMesh(t, g2, 'stone', STONE);
  }
  // projecting course (plinth / string course) on a wall face
  function course(t, x0, x1, y0, y1, proj) {
    stone(t, x1 - x0, y1 - y0, proj + 0.12, (x0 + x1) / 2, (y0 + y1) / 2, (proj - 0.12) / 2);
  }
  // stepped corbel under the cornice: three tiers narrowing downward
  function bracket(t, x, yTop, s) {
    const tiers = [[0.72, 0.2, 0.3], [0.52, 0.2, 0.22], [0.32, 0.25, 0.14]];
    let y = yTop;
    tiers.forEach(function (q) {
      const w = q[0] * s, h = q[1] * s, p = q[2] * s;
      stone(t, w, h, p + 0.1, x, y - h / 2, (p - 0.1) / 2);
      y -= h;
    });
  }
  // doorway: dark leaf at the back of the recess + raised stone surround
  function door(t, c, w, y0, y1, t1) {
    box(t, 'old_timber', TIMBER, w, y1 - y0, 0.05, c, (y0 + y1) / 2, -t1 + 0.025);
    const jw = 0.28, top = y1 + 0.26;
    stone(t, jw, top, 0.14, c - w / 2 - jw / 2, top / 2, -0.03);
    stone(t, jw, top, 0.14, c + w / 2 + jw / 2, top / 2, -0.03);
    stone(t, w + 2 * jw + 0.1, 0.26, 0.16, c, y1 + 0.13, -0.02);
  }

  // ---------- hall dimensions (front view, ~43.5 px per metre) ----------
  const B = 0.05, A = Math.atan(B);          // wall batter
  const WH = 4.07, RB = 4.04, RT = 4.34, YB = 4.06;
  const HX = 10.45, ZF = 4.2, ZB = -3.1, ZC = 0.55, HZ = 3.65;
  const FT = 1.0, FT1 = 0.4, ET = 1.2;
  const HL = HX - ET + 0.02;                 // long walls butt into the end walls
  const DW = 0.72, DY0 = 0.1, DY1 = 2.05;
  const BAND0 = 2.88, BAND1 = 3.0;
  const bandEnd = function (h) { return h - B * 2.94 + 0.04; };

  // ---------- front wall (collapsed at the left) ----------
  const fw = frame(0, ZF, 0, A, FT);
  const frontDoors = [-0.82, 2.89, 6.59];
  const pier = [[-HL, 0], [-8.75, 0], [-8.85, 0.5], [-8.95, 1.2], [-8.9, 2.0], [-9.02, 2.8], [-8.85, 3.5], [-8.6, WH], [-(HL - B * WH), WH]];
  const mainPts = [[-3.35, 0], [HL, 0], [HL - B * WH, WH], [-4.15, WH], [-3.85, 3.85], [-3.7, 3.5], [-3.45, 3.1], [-3.3, 2.5], [-3.42, 1.7], [-3.3, 0.9]];
  wallBody(fw, [
    { pts: pier },
    { pts: mainPts, holes: frontDoors.map(function (c) { return [c - DW / 2, DY0, c + DW / 2, DY1]; }) }
  ], FT, FT1);
  course(fw.parent, -HX - 0.06, -8.8, 0, 0.38, 0.06);       // plinths sit in the untilted frame, on the ground
  course(fw.parent, -3.33, HX + 0.06, 0, 0.38, 0.06);
  course(fw, -bandEnd(HX), -9.0, BAND0, BAND1, 0.04);
  course(fw, -3.41, bandEnd(HX), BAND0, BAND1, 0.04);
  bracket(fw, -9.7, YB, 1);
  for (let i = 0; i < 10; i++) bracket(fw, -2.2 + i * 1.33, YB, 1);
  frontDoors.forEach(function (c) { door(fw, c, DW, DY0, DY1, FT1); });

  // ---------- back wall (local x = -model x) ----------
  const bw = frame(0, ZB, Math.PI, A, FT);
  const backDoors = [-5.93, -1.72, 2.46, 6.72];
  wallBody(bw, [{
    pts: [[-HL, 0], [HL, 0], [HL - B * WH, WH], [-(HL - B * WH), WH]],
    holes: backDoors.map(function (c) { return [c - DW / 2, DY0, c + DW / 2, DY1]; })
  }], FT, FT1);
  course(bw.parent, -HX - 0.06, HX + 0.06, 0, 0.38, 0.06);
  course(bw, -bandEnd(HX), bandEnd(HX), BAND0, BAND1, 0.04);
  for (let i = 0; i < 12; i++) bracket(bw, -6.5 + i * 1.45, YB, 1);
  backDoors.forEach(function (c) { door(bw, c, DW, DY0, DY1, FT1); });

  // carved hand panel on the chamber side of the back wall (model x -5.6)
  const hx = 5.6, iz = -FT;
  stone(bw, 1.2, 1.5, 0.1, hx, 1.3, iz - 0.03);
  stone(bw, 0.36, 0.42, 0.06, hx, 1.12, iz - 0.1);
  [[-0.13, 0.26], [-0.045, 0.32], [0.045, 0.34], [0.13, 0.3]].forEach(function (f) {
    stone(bw, 0.075, f[1], 0.06, hx + f[0], 1.33 + f[1] / 2, iz - 0.1);
  });
  stone(bw, 0.085, 0.26, 0.06, hx + 0.24, 1.12, iz - 0.1, 0, 0, -0.6);

  // ---------- end walls ----------
  const endPts = [[-HZ, 0], [HZ, 0], [HZ - B * WH, WH], [-(HZ - B * WH), WH]];
  const lw = frame(-HX, ZC, -Math.PI / 2, A, ET);      // local x = z - ZC
  wallBody(lw, [{ pts: endPts }], ET, 0);
  course(lw.parent, -HZ - 0.06, HZ + 0.06, 0, 0.38, 0.06);
  course(lw, -bandEnd(HZ), bandEnd(HZ), BAND0, BAND1, 0.04);
  [-1.85, -0.6, 0.65, 1.9, 3.15].forEach(function (z) { bracket(lw, z - ZC, YB, 1); });

  const rw = frame(HX, ZC, Math.PI / 2, A, ET);        // local x = ZC - z
  wallBody(rw, [{ pts: endPts }], ET, 0);
  course(rw.parent, -HZ - 0.06, HZ + 0.06, 0, 0.38, 0.06);
  course(rw, -bandEnd(HZ), bandEnd(HZ), BAND0, BAND1, 0.04);
  [-0.6, 0.65, 1.9, 3.15].forEach(function (z) { bracket(rw, ZC - z, YB, 1); });

  // ---------- roof slab / cornice ledge, with the broken hole over the chamber ----------
  function slab(x0, x1, z0, z1) {
    stone(root, x1 - x0, RT - RB, z1 - z0, (x0 + x1) / 2, (RB + RT) / 2, (z0 + z1) / 2);
  }
  slab(-4.2, HX, ZB, ZF);
  slab(-HX, -4.2, ZB, -2.15);
  slab(-7.4, -4.2, -2.15, -1.55);
  slab(-9.55, -8.0, -2.15, -0.9);
  slab(-4.9, -4.2, -1.55, 0.7);
  slab(-HX, -9.55, -2.15, 3.0);
  slab(-HX, -8.45, 3.0, ZF);
  box(root, 'loose_stone', LOOSE, 1.0, 0.26, 1.45, -7.0, 4.05, -0.7, 0.12, 0.15, 0.04);
  box(root, 'loose_stone', LOOSE, 1.3, 0.28, 0.9, -7.4, 0.62, 1.7, 0.3, 0.4, 0.08);

  // ---------- open chamber behind the collapse ----------
  stone(root, 0.8, WH, 5.8, -3.0, WH / 2, 0.6);          // partition wall
  stone(root, 5.95, 0.4, 5.4, -6.325, 0.2, 0.5);         // raised floor
  stone(root, 5.4, 0.27, 0.35, -6.05, 0.135, 3.375);     // steps
  stone(root, 5.4, 0.13, 0.35, -6.05, 0.065, 3.725);
  [-6.2, -5.0].forEach(function (x) { stone(root, 0.16, 0.1, 5.2, x, 0.45, 0.55); }); // path curbs
  [-1.3, -0.1, 1.1, 2.3].forEach(function (z) {
    stone(root, 0.4, 3.04, 0.45, -9.12, 1.92, z);        // pilasters
    stone(root, 0.36, 3.04, 0.45, -3.52, 1.92, z);
    stone(root, 0.55, 0.22, 0.62, -9.05, 3.55, z);       // capitals
    stone(root, 0.5, 0.22, 0.62, -3.6, 3.55, z);
  });
  [-1.3, -0.1, 1.1].forEach(function (z) { stone(root, 5.9, 0.36, 0.4, -6.3, 3.84, z); }); // ceiling beams
  stone(root, 1.9, 0.36, 0.4, -8.3, 3.76, 2.3, 0, 0, -0.08);  // broken front beam
  stone(root, 1.6, 0.36, 0.4, -4.2, 3.78, 2.3, 0, 0, 0.1);

  // ---------- tower (back-right corner) ----------
  const TX0 = 7.22, TX1 = 10.52, TZ0 = -4.2, TZ1 = -0.9;
  const TCX = (TX0 + TX1) / 2, TCZ = (TZ0 + TZ1) / 2;
  const TW = 0.6, TH = 7.15, TTOP = 7.43;
  const slits = [[-0.12, 4.45, 0.12, 5.0], [-0.12, 5.95, 0.12, 6.55]];
  const tf = [
    [TCX, TZ1, 0, (TX1 - TX0) / 2, true],
    [TCX, TZ0, Math.PI, (TX1 - TX0) / 2, true],
    [TX0, TCZ, -Math.PI / 2, (TZ1 - TZ0) / 2, false],
    [TX1, TCZ, Math.PI / 2, (TZ1 - TZ0) / 2, false]
  ];
  tf.forEach(function (f) {
    const t = frame(f[0], f[1], f[2], 0, TW);
    const hl = f[3];
    const wl = f[4] ? hl - TW + 0.01 : hl;
    wallBody(t, [{ pts: rect(-wl, 0, wl, TH + 0.02), holes: slits }], TW, 0.25);
    course(t, -hl - 0.06, hl + 0.06, 0, 0.38, 0.06);
    course(t, -hl - 0.04, hl + 0.04, BAND0, BAND1, 0.04);
    course(t, -hl - 0.04, hl + 0.04, 5.7, 5.82, 0.04);
    [-1.1, 0, 1.1].forEach(function (x) { bracket(t, x, TH + 0.01, 0.8); });
  });
  stone(root, TX1 - TX0 + 0.3, TTOP - TH, TZ1 - TZ0 + 0.3, TCX, (TH + TTOP) / 2, TCZ); // cap ledge

  // ---------- rubble (fixed seeded sequence), each stone kept above the ground ----------
  let seed = 20260126;
  function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
  function pile(cx, cz, rx, rz, n, maxH, base) {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd());
      const x = cx + Math.cos(a) * r * rx, z = cz + Math.sin(a) * r * rz;
      const s = 0.22 + rnd() * 0.38;
      const w = s * (0.8 + rnd() * 0.6), h = s * (0.5 + rnd() * 0.4), d = s * (0.7 + rnd() * 0.6);
      const y = base + h * 0.45 + (1 - r) * maxH * (0.4 + 0.6 * rnd());
      const m = box(root, 'loose_stone', LOOSE, w, h, d, x, y, z, (rnd() - 0.5) * 0.7, rnd() * Math.PI, (rnd() - 0.5) * 0.7);
      m.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(m);
      if (bb.min.y < 0) m.position.y -= bb.min.y;
    }
  }
  pile(-8.25, 3.8, 0.55, 0.4, 12, 0.75, 0);
  pile(-3.85, 3.8, 0.5, 0.4, 10, 0.65, 0);
  pile(-9.9, 4.25, 0.5, 0.15, 5, 0.2, 0);
  pile(-6.4, 2.2, 2.2, 0.9, 9, 0.25, 0.4);

  return root;
}
```