- **Gatehouse too wide.** The front and back views both show a body about 4.35 m wide with a cap about 4.65 m. The model had 4.8 m and 5.1 m, which cost overlap in both views.
- **Gatehouse too far back, and the tank ran past it.**
  - All three views that show depth put about 0.5–1 m of bank behind the gatehouse; the model had 0.15 m. I moved it forward about 0.35 m.
  - The tank's back wall sat 1.4 m behind the gatehouse front, leaving deep pockets of floor beside it that the sheet doesn't have. That wall now sits about 0.65 m behind the gatehouse front.
  - The back wall is now split, so it doesn't block the doorway.
- **Side views were the weakest fit (0.86 and 0.81).** Their outline stands about 2.2–2.5 m along the long walls, but the model's rim courses were low and gappy (about 1.8 m).
  - I raised the rim courses and made them denser, ending them before the sloped front end.
  - I kept the banks at 1.4 m, because the front and back views want them low.
- **Earth slab edges.** The front and back views show the slab's long outer edges bevelled (about 0.6 m in over the bank height). The model's were vertical. The banks are now bevelled, and the corners are filled with small four-sided frustums.
- **Rim stones beside the gatehouse.** These rose above the sheet's front and back outline, so I removed them and lowered the front end rim.
- **Left view.** Its remaining gap comes from the sheet itself: it draws the gatehouse deeper and further forward than the other views. The boxes and cameras are right, so the JSON is unchanged.

```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'cistern';

  // ---------- materials ----------
  const COLORS = {
    stone: 0x73695c,
    earth: 0xae5e37,
    dry_grass: 0xae8a4a,
    dark_stone: 0x2a2622
  };
  const mats = {};
  function mat(name) {
    if (!mats[name]) {
      mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name], roughness: 0.95, metalness: 0.0 });
    }
    return mats[name];
  }
  function mesh(geo, name, parent) {
    const m = new THREE.Mesh(geo, mat(name));
    m.name = name;
    (parent || root).add(m);
    return m;
  }
  function box(name, x0, x1, y0, y1, z0, z1, parent) {
    const m = mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), name, parent);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return m;
  }
  function block(name, cx, y0, cz, sx, sy, sz, yaw, tilt, parent) {
    const m = mesh(new THREE.BoxGeometry(sx, sy, sz), name, parent);
    m.position.set(cx, y0 + sy / 2, cz);
    m.rotation.set(tilt || 0, yaw || 0, 0);
    return m;
  }
  function makeShape(pts) {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    return s;
  }
  // profile drawn in (z, y), extruded along x from x0 to x1
  function profileX(name, pts, x0, x1, parent) {
    const geo = new THREE.ExtrudeGeometry(makeShape(pts), { depth: x1 - x0, bevelEnabled: false, steps: 1, curveSegments: 1 });
    const m = mesh(geo, name, parent);
    m.rotation.y = -Math.PI / 2; // shape x -> world z, extrude -> world -x
    m.position.set(x1, 0, 0);
    return m;
  }
  // profile drawn in (x, y), extruded along z from z0 to z1
  function profileZ(name, pts, z0, z1, parent) {
    const geo = new THREE.ExtrudeGeometry(makeShape(pts), { depth: z1 - z0, bevelEnabled: false, steps: 1, curveSegments: 1 });
    const m = mesh(geo, name, parent);
    m.position.set(0, 0, z0);
    return m;
  }
  // rectangular frustum: bottom half-extents (ax, az), top = ratio * bottom, standing on y = 0
  function frustum(name, cx, cz, ax, az, ratio, h, parent) {
    let geo = new THREE.CylinderGeometry(Math.SQRT2 * ratio, Math.SQRT2, h, 4, 1);
    geo.rotateY(Math.PI / 4);
    geo = geo.toNonIndexed();
    geo.computeVertexNormals();
    const m = mesh(geo, name, parent);
    m.scale.set(ax, 1, az);
    m.position.set(cx, h / 2, cz);
    return m;
  }
  function tuft(x, y, z, r, h, parent) {
    const m = mesh(new THREE.ConeGeometry(r, h, 5), 'dry_grass', parent);
    m.position.set(x, y + h / 2, z);
    return m;
  }
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- dimensions (metres) ----------
  const HX = 5.3, HZ = 9.5;          // half footprint
  const FLOOR = 0.25;                // tank floor top
  const GROUND = 1.4;                // earth surface
  const WALL_TOP = 1.5;              // stone lining top
  const TIN = 3.35, TOUT = 3.95;     // tank inner / outer half-width
  const BEV = 0.6;                   // outer bevel of the long banks
  const XT = HX - BEV;               // top edge of the bevel
  const ZT_BACK = -8.7, ZT_FRONT = 8.7; // where the end slopes start
  const ZB_OUT = -6.45, ZB_IN = -5.9;   // back end wall (beside the gatehouse)
  const Z_STAIR0 = 3.7;              // foot of the stair
  const ZE_IN = 8.1, ZE_OUT = 8.7;   // front end wall
  // gatehouse
  const GW = 2.2;                    // body half-width
  const GZ0 = -8.85, GZ1 = -5.25;    // body back / front
  const GC = (GZ0 + GZ1) / 2;
  const GTOP = 3.47;                 // body top (under cap)
  const DW = 0.54, SILL = 0.45, DTOP = 2.22, RECESS = GZ1 - 1.3;

  // ---------- earth ----------
  const earth = new THREE.Group(); earth.name = 'earth_block'; root.add(earth);
  // long side banks with bevelled outer edge
  profileZ('earth', [[TOUT, 0], [HX, 0], [XT, GROUND], [TOUT, GROUND]], ZT_BACK, ZT_FRONT, earth);
  profileZ('earth', [[-HX, 0], [-TOUT, 0], [-TOUT, GROUND], [-XT, GROUND]], ZT_BACK, ZT_FRONT, earth);
  // back end beside the gatehouse: flat, then sloping off the back edge
  const backProfile = [[-HZ, 0], [ZB_OUT, 0], [ZB_OUT, GROUND], [ZT_BACK, GROUND]];
  profileX('earth', backProfile, GW + 0.01, XT, earth);
  profileX('earth', backProfile, -XT, -GW - 0.01, earth);
  // front end slope past the end wall
  profileX('earth', [[ZE_OUT, 0], [HZ, 0], [ZE_OUT, GROUND]], -XT, XT, earth);
  // hipped corners
  const CA = 0.9, CR = 1 - BEV / CA, CC = (HZ - ZT_FRONT) / (1 - CR);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      frustum('earth', sx * (HX - CA), sz * (HZ - CC), CA, CC, CR, GROUND, earth);
    }
  }
  // low strip behind the gatehouse
  box('earth', -GW - 0.02, GW + 0.02, 0, 0.3, -HZ, GZ0, earth);

  // ---------- tank ----------
  const tank = new THREE.Group(); tank.name = 'tank'; root.add(tank);
  box('stone', -TIN - 0.05, TIN + 0.05, 0, FLOOR, ZB_IN - 0.05, ZE_IN + 0.05, tank); // floor
  box('stone', TIN, TOUT, 0, WALL_TOP, ZB_OUT, ZE_OUT, tank);    // long wall +x
  box('stone', -TOUT, -TIN, 0, WALL_TOP, ZB_OUT, ZE_OUT, tank);  // long wall -x
  box('stone', -TIN, -GW, 0, WALL_TOP, ZB_OUT, ZB_IN, tank);     // back end wall, left of gatehouse
  box('stone', GW, TIN, 0, WALL_TOP, ZB_OUT, ZB_IN, tank);       // back end wall, right of gatehouse
  box('stone', -TIN, TIN, 0, WALL_TOP, ZE_IN, ZE_OUT, tank);     // front end wall
  // low raised platform along the -x half of the floor
  box('stone', -TIN - 0.02, -0.1, FLOOR, FLOOR + 0.08, ZB_IN, Z_STAIR0, tank);
  // full-width stair down from the +z end
  const N = 10;
  const rise = (WALL_TOP - FLOOR) / N;
  const tread = (ZE_IN - Z_STAIR0) / N;
  for (let k = 0; k < N; k++) {
    box('stone', -TIN - 0.03, TIN + 0.03,
      FLOOR + k * rise, FLOOR + (k + 1) * rise,
      Z_STAIR0 + k * tread, ZE_IN + 0.02, tank);
  }

  // ---------- gatehouse ----------
  const g = new THREE.Group(); g.name = 'gatehouse'; root.add(g);
  box('stone', -GW, -DW, 0, GTOP, GZ0, GZ1, g);          // left mass
  box('stone', DW, GW, 0, GTOP, GZ0, GZ1, g);            // right mass
  box('stone', -DW, DW, DTOP, GTOP, GZ0, GZ1, g);        // over the door
  box('stone', -DW, DW, 0, SILL, GZ0, GZ1, g);           // under the sill
  box('stone', -DW, DW, SILL, DTOP, GZ0, RECESS, g);     // behind the recess
  box('dark_stone', -DW + 0.002, DW - 0.002, SILL, DTOP, RECESS, RECESS + 0.02, g); // dark inner back
  // portal frame: jambs + lintel
  box('stone', -1.1, -DW, 0, DTOP, GZ1, GZ1 + 0.3, g);
  box('stone', DW, 1.1, 0, DTOP, GZ1, GZ1 + 0.3, g);
  box('stone', -1.16, 1.16, DTOP, 2.68, GZ1, GZ1 + 0.34, g);
  // threshold step
  box('stone', -0.8, 0.8, 0, SILL, GZ1, GZ1 + 0.5, g);
  // string course
  box('stone', -GW - 0.05, GW + 0.05, 2.75, 2.87, GZ0 - 0.05, GZ1 + 0.05, g);
  // stepped corbels under the cap, all four faces
  const tiers = [[3.27, GTOP, 0.60, 0.15], [3.07, 3.27, 0.42, 0.10], [2.88, 3.07, 0.24, 0.06]];
  const frontXs = [-1.76, -0.88, 0, 0.88, 1.76];
  const sideZs = [-1.35, -0.45, 0.45, 1.35];
  for (const t of tiers) {
    const [y0, y1, w, p] = t;
    for (const xo of frontXs) {
      box('stone', xo - w / 2, xo + w / 2, y0, y1, GZ1 - 0.02, GZ1 + p, g); // front
      box('stone', xo - w / 2, xo + w / 2, y0, y1, GZ0 - p, GZ0 + 0.02, g); // back
    }
    for (const zo of sideZs) {
      const zc = GC + zo;
      box('stone', GW - 0.02, GW + p, y0, y1, zc - w / 2, zc + w / 2, g);   // +x side
      box('stone', -GW - p, -GW + 0.02, y0, y1, zc - w / 2, zc + w / 2, g); // -x side
    }
  }
  // cap slab, two layers
  box('stone', -2.36, 2.36, GTOP, 3.62, GZ0 - 0.15, GZ1 + 0.15, g);
  box('stone', -2.28, 2.28, 3.62, 3.74, GZ0 - 0.07, GZ1 + 0.07, g);

  // ---------- ruined rim courses and rubble ----------
  const R = makeRng(0xC04);
  const ruins = new THREE.Group(); ruins.name = 'ruins'; root.add(ruins);
  const WALL_MID = (TIN + TOUT) / 2;
  // long walls: denser, taller broken courses
  for (const s of [-1, 1]) {
    let z = ZB_OUT + 0.1;
    while (z < 7.95) {
      const L = 0.5 + 0.45 * R();
      if (R() < 0.2) { z += L * 0.7; continue; }
      const len = Math.min(L * 0.94, 8.1 - z);
      const h = 0.3 + 0.18 * R();
      const w = 0.5 + 0.1 * R();
      const cx = s * (WALL_MID + (R() - 0.5) * 0.1);
      block('stone', cx, WALL_TOP, z + len / 2, w, h, len, (R() - 0.5) * 0.14, 0, ruins);
      if (R() < 0.5) {
        const h2 = 0.2 + 0.15 * R();
        const l2 = len * (0.5 + 0.35 * R());
        block('stone', cx + (R() - 0.5) * 0.1, WALL_TOP + h, z + len / 2 + (R() - 0.5) * 0.15,
          w * 0.85, h2, l2, (R() - 0.5) * 0.2, 0, ruins);
      }
      z += L;
    }
  }
  // front end wall rim (kept low)
  {
    let x = -TOUT + 0.1;
    const zc = (ZE_IN + ZE_OUT) / 2;
    while (x < TOUT - 0.35) {
      const L = 0.5 + 0.4 * R();
      if (R() < 0.35) { x += L * 0.8; continue; }
      const len = Math.min(L * 0.94, TOUT - 0.05 - x);
      block('stone', x + len / 2, WALL_TOP, zc + (R() - 0.5) * 0.08, len, 0.12 + 0.12 * R(), 0.5,
        (R() - 0.5) * 0.12, 0, ruins);
      x += L;
    }
  }
  // loose blocks on the banks
  for (let i = 0; i < 26; i++) {
    const s = i % 2 ? 1 : -1;
    const sx = 0.28 + 0.3 * R(), sy = 0.2 + 0.18 * R(), sz = 0.3 + 0.32 * R();
    const x = s * (4.1 + 0.35 * R());
    const z = -6.3 + 14.4 * R();
    block('stone', x, GROUND - 0.04, z, sx, sy, sz, R() * Math.PI, (R() - 0.5) * 0.25, ruins);
  }
  // fallen blocks in the tank
  for (let i = 0; i < 8; i++) {
    const s = i % 2 ? 1 : -1;
    const x = s * (2.4 + 0.6 * R());
    const z = -4.4 + 7.6 * R();
    const y = x < -0.1 ? FLOOR + 0.08 : FLOOR;
    const sx = 0.35 + 0.25 * R(), sy = 0.22 + 0.15 * R(), sz = 0.35 + 0.3 * R();
    block('stone', x, y - 0.02, z, sx, sy, sz, R() * Math.PI, (R() - 0.5) * 0.2, ruins);
  }

  // ---------- dry grass tufts ----------
  const grass = new THREE.Group(); grass.name = 'grass'; root.add(grass);
  for (let i = 0; i < 36; i++) {
    const s = i % 2 ? 1 : -1;
    const x = s * (4.0 + 0.65 * R());
    const z = -6.5 + 15.0 * R();
    tuft(x, GROUND - 0.02, z, 0.12 + 0.12 * R(), 0.22 + 0.2 * R(), grass);
  }
  for (let i = 0; i < 8; i++) {
    const s = i % 2 ? 1 : -1;
    const x = s * (2.6 + 1.8 * R());
    const z = -6.6 - 1.9 * R();
    tuft(x, GROUND - 0.02, z, 0.12 + 0.1 * R(), 0.2 + 0.18 * R(), grass);
  }
  for (let i = 0; i < 10; i++) {
    const x = -3.0 + 6.0 * R();
    const z = -4.4 + 7.8 * R();
    const y = x < -0.1 ? FLOOR + 0.08 : FLOOR;
    tuft(x, y - 0.02, z, 0.1 + 0.1 * R(), 0.2 + 0.15 * R(), grass);
  }

  return root;
}
```