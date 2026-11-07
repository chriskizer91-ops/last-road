You built the 3D model below from Christopher's reference sheet C04 · The Cistern, outside. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"model": {"Front": {"iou": 0.943, "turn_deg": -0.0}, "Right": {"iou": 0.857, "turn_deg": -0.07}, "Back": {"iou": 0.942, "turn_deg": 0.05}, "Left": {"iou": 0.805, "turn_deg": -0.19}, "Top": {"iou": 0.99, "turn_deg": 0.06}}}
The model's size in metres (x, y, z) and triangles: {"model": {"tris": 2488, "size": [10.6, 3.74, 19], "min": [-5.3, 0, -9.5]}}

Your code and the views you gave:
```json
{"objects": [{"name": "cistern", "size_m": [10.6, 3.74, 19.0],
  "views": [
    {"label": "Front", "box": [934, 66, 1447, 249], "cam": [0, 0, 1], "up": [0, 1, 0]},
    {"label": "Right", "box": [789, 296, 1517, 452], "cam": [1, 0, 0], "up": [0, 1, 0]},
    {"label": "Back", "box": [939, 529, 1446, 704], "cam": [0, 0, -1], "up": [0, 1, 0]},
    {"label": "Left", "box": [869, 753, 1497, 905], "cam": [-1, 0, 0], "up": [0, 1, 0]},
    {"label": "Top", "box": [28, 528, 838, 972], "cam": [0, 1, 0], "up": [-1, 0, 0]}
  ]}],
 "notes": "A sunken, stone-lined tank (about 6.7 x 11 m inside) cut into a slab of red earth about 10.6 x 19 m. A full-width stair goes down at the +z end, and a corbelled stone gatehouse stands at the -z end with its door facing +z into the tank. Top of the cap is about 3.7 m. Scale comes from the 1 m bar (about 47 px), which fits the front view (door about 1.1 x 1.8 m). The views disagree: the top view shows a wider gatehouse, and the side views show higher banks and sloped ends. So the widths, depths and end slopes are a compromise between the views."}

```
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
  // profile drawn in (z, y), extruded along x from x0 to x1
  function profileX(name, pts, x0, x1, parent) {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: x1 - x0, bevelEnabled: false, steps: 1, curveSegments: 1 });
    const m = mesh(geo, name, parent);
    m.rotation.y = -Math.PI / 2; // shape x -> world z, extrude -> world -x
    m.position.set(x1, 0, 0);
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
  const ZB_OUT = -7.6, ZB_IN = -7.0; // back end wall
  const Z_STAIR0 = 3.7;              // foot of the stair
  const ZE_IN = 8.1, ZE_OUT = 8.7;   // front end wall
  // gatehouse
  const GW = 2.4;                    // body half-width
  const GZ0 = -9.2, GZ1 = -5.6;      // body back / front
  const GC = (GZ0 + GZ1) / 2;
  const GTOP = 3.47;                 // body top (under cap)
  const DW = 0.54, SILL = 0.45, DTOP = 2.22, RECESS = -6.9;

  // ---------- earth ----------
  const earth = new THREE.Group(); earth.name = 'earth_block'; root.add(earth);
  // long side banks
  box('earth', TOUT, HX, 0, GROUND, ZB_OUT, ZE_OUT, earth);
  box('earth', -HX, -TOUT, 0, GROUND, ZB_OUT, ZE_OUT, earth);
  // back end, sloping down beside the gatehouse
  const backProfile = [[-HZ, 0], [ZB_OUT, 0], [ZB_OUT, GROUND], [-HZ, 0.3]];
  profileX('earth', backProfile, GW + 0.01, HX, earth);
  profileX('earth', backProfile, -HX, -GW - 0.01, earth);
  // front end, sloping down past the end wall
  profileX('earth', [[ZE_OUT, 0], [HZ, 0], [HZ, 0.35], [ZE_OUT, GROUND]], -HX, HX, earth);
  // low strip behind the gatehouse
  box('earth', -GW - 0.02, GW + 0.02, 0, 0.3, -HZ, GZ0, earth);

  // ---------- tank ----------
  const tank = new THREE.Group(); tank.name = 'tank'; root.add(tank);
  box('stone', -TIN - 0.05, TIN + 0.05, 0, FLOOR, ZB_IN - 0.05, ZE_IN + 0.05, tank); // floor
  box('stone', TIN, TOUT, 0, WALL_TOP, ZB_OUT, ZE_OUT, tank);    // long wall +x
  box('stone', -TOUT, -TIN, 0, WALL_TOP, ZB_OUT, ZE_OUT, tank);  // long wall -x
  box('stone', -TIN, TIN, 0, WALL_TOP, ZB_OUT, ZB_IN, tank);     // back end wall
  box('stone', -TIN, TIN, 0, WALL_TOP, ZE_IN, ZE_OUT, tank);     // front end wall
  // low raised platform along the -x half of the floor
  box('stone', -TIN - 0.02, -0.1, FLOOR, FLOOR + 0.08, GZ1, Z_STAIR0, tank);
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
  const frontXs = [-1.95, -0.98, 0, 0.98, 1.95];
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
  box('stone', -2.55, 2.55, GTOP, 3.62, GZ0 - 0.15, GZ1 + 0.15, g);
  box('stone', -2.45, 2.45, 3.62, 3.74, GZ0 - 0.05, GZ1 + 0.05, g);

  // ---------- ruined rim courses and rubble ----------
  const R = makeRng(0xC04);
  const ruins = new THREE.Group(); ruins.name = 'ruins'; root.add(ruins);
  const WALL_MID = (TIN + TOUT) / 2;
  for (const s of [-1, 1]) {
    let z = ZB_OUT + 0.1;
    while (z < ZE_OUT - 0.35) {
      const L = 0.5 + 0.45 * R();
      if (R() < 0.3) { z += L * 0.8; continue; }
      const len = Math.min(L * 0.94, ZE_OUT - 0.05 - z);
      const h = 0.2 + 0.18 * R();
      const w = 0.48 + 0.1 * R();
      const cx = s * (WALL_MID + (R() - 0.5) * 0.1);
      block('stone', cx, WALL_TOP, z + len / 2, w, h, len, (R() - 0.5) * 0.14, 0, ruins);
      if (R() < 0.35) {
        const h2 = 0.15 + 0.12 * R();
        const l2 = len * (0.5 + 0.3 * R());
        block('stone', cx + (R() - 0.5) * 0.1, WALL_TOP + h, z + len / 2 + (R() - 0.5) * 0.15,
          w * 0.85, h2, l2, (R() - 0.5) * 0.2, 0, ruins);
      }
      z += L;
    }
  }
  // front end wall rim
  {
    let x = -TOUT + 0.1;
    const zc = (ZE_IN + ZE_OUT) / 2;
    while (x < TOUT - 0.35) {
      const L = 0.5 + 0.4 * R();
      if (R() < 0.35) { x += L * 0.8; continue; }
      const len = Math.min(L * 0.94, TOUT - 0.05 - x);
      block('stone', x + len / 2, WALL_TOP, zc + (R() - 0.5) * 0.08, len, 0.18 + 0.14 * R(), 0.5,
        (R() - 0.5) * 0.12, 0, ruins);
      x += L;
    }
  }
  // back wall rim beside the gatehouse
  for (const s of [-1, 1]) {
    block('stone', s * 2.85, WALL_TOP, -7.3, 0.6, 0.3, 0.55, (R() - 0.5) * 0.15, 0, ruins);
    block('stone', s * 3.4, WALL_TOP, -7.3, 0.5, 0.38, 0.55, (R() - 0.5) * 0.15, 0, ruins);
  }
  // loose blocks on the banks
  for (let i = 0; i < 26; i++) {
    const s = i % 2 ? 1 : -1;
    const sx = 0.28 + 0.3 * R(), sy = 0.2 + 0.18 * R(), sz = 0.3 + 0.32 * R();
    const x = s * (4.15 + 0.6 * R());
    const z = -7.2 + 15.6 * R();
    block('stone', x, GROUND - 0.04, z, sx, sy, sz, R() * Math.PI, (R() - 0.5) * 0.25, ruins);
  }
  // fallen blocks in the tank
  for (let i = 0; i < 8; i++) {
    const s = i % 2 ? 1 : -1;
    const x = s * (2.4 + 0.6 * R());
    const z = -4.8 + 8.0 * R();
    const y = x < -0.1 ? FLOOR + 0.08 : FLOOR;
    const sx = 0.35 + 0.25 * R(), sy = 0.22 + 0.15 * R(), sz = 0.35 + 0.3 * R();
    block('stone', x, y - 0.02, z, sx, sy, sz, R() * Math.PI, (R() - 0.5) * 0.2, ruins);
  }

  // ---------- dry grass tufts ----------
  const grass = new THREE.Group(); grass.name = 'grass'; root.add(grass);
  for (let i = 0; i < 36; i++) {
    const s = i % 2 ? 1 : -1;
    const x = s * (4.05 + 0.95 * R());
    const z = -7.3 + 15.8 * R();
    tuft(x, GROUND - 0.02, z, 0.12 + 0.12 * R(), 0.22 + 0.2 * R(), grass);
  }
  for (let i = 0; i < 10; i++) {
    const x = -3.0 + 6.0 * R();
    const z = -5.0 + 8.4 * R();
    const y = x < -0.1 ? FLOOR + 0.08 : FLOOR;
    tuft(x, y - 0.02, z, 0.1 + 0.1 * R(), 0.2 + 0.15 * R(), grass);
  }
  for (let i = 0; i < 6; i++) {
    const s = i % 2 ? 1 : -1;
    const z = -6.5 + 14.5 * R();
    tuft(s * WALL_MID, WALL_TOP - 0.02, z, 0.1 + 0.08 * R(), 0.18 + 0.14 * R(), grass);
  }

  return root;
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 30,000.
