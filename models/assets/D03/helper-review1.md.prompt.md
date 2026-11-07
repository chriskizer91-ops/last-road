You built the 3D model below from Christopher's reference sheet D03 · The Marbles, a granite kopje. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"model": {"Front": {"iou": 0.906, "turn_deg": -0.01}, "Side": {"iou": 0.919, "turn_deg": 0.27}, "Back": {"iou": 0.877, "turn_deg": -0.0}, "Top": {"iou": 0.944, "turn_deg": -0.18}}}
The model's size in metres (x, y, z) and triangles: {"model": {"tris": 17652, "size": [74, 25.2, 54], "min": [-37, -0.8, -27]}}

Your code and the views you gave:
```json
{"objects": [{"name": "marbles_kopje", "size_m": [74, 24.4, 54],
  "views": [
    {"label": "Front", "box": [22, 14, 848, 279], "cam": [0, 0, 1], "up": [0, 1, 0]},
    {"label": "Side", "box": [865, 11, 1523, 278], "cam": [-1, 0, 0], "up": [0, 1, 0]},
    {"label": "Back", "box": [13, 324, 849, 584], "cam": [0, 0, -1], "up": [0, 1, 0]},
    {"label": "Top", "box": [866, 321, 1521, 779], "cam": [0, 1, 0], "up": [0, 0, -1]}
  ]}],
 "notes": "Granite kopje 'The Marbles': a domed pile of rounded, lichen-streaked boulders under a perched egg-shaped summit boulder (~13 m long), with three fig/acacia trees, dead snags and fallen exfoliation slabs at front-left, on a dry-grass apron. The scale bar (10 m ≈ 106 px) gives about 78 m wide in the elevations but about 62 m in the top view, so the views disagree by roughly 20%. I used a 74 × 54 m footprint and 24.4 m to the top of the summit boulder. 'Side' is the -x side, because the front slabs appear at its right; the top view has the front at the bottom."}

```
```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'marbles_kopje';

  // ---------- materials (one per name) ----------
  const M = {
    granite: new THREE.MeshStandardMaterial({ color: 0x9c8374 }),
    dry_grass: new THREE.MeshStandardMaterial({ color: 0xa68a55 }),
    leaves: new THREE.MeshStandardMaterial({ color: 0x5d6a3a }),
    bark: new THREE.MeshStandardMaterial({ color: 0x4a4036 }),
    dead_wood: new THREE.MeshStandardMaterial({ color: 0x77695c }),
    scrub: new THREE.MeshStandardMaterial({ color: 0x687044 })
  };

  function add(geo, name, x, y, z) {
    const m = new THREE.Mesh(geo, M[name]);
    m.name = name;
    m.position.set(x, y, z);
    root.add(m);
    return m;
  }

  // ---------- fixed seeded sequence ----------
  let seed = 1919191;
  function rnd() {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ---------- surface record (ellipsoid tops) for placing small things ----------
  const surf = [];
  function addSurf(x, y, z, rx, ry, rz, yaw) {
    surf.push({ x: x, y: y, z: z, rx: rx, ry: ry, rz: rz, yaw: yaw || 0 });
  }
  function heightAt(x, z) {
    let h = 0.4;
    for (let i = 0; i < surf.length; i++) {
      const e = surf[i];
      const dx = x - e.x, dz = z - e.z;
      const c = Math.cos(e.yaw), s = Math.sin(e.yaw);
      const lx = (c * dx - s * dz) / e.rx;
      const lz = (s * dx + c * dz) / e.rz;
      const q = 1 - lx * lx - lz * lz;
      if (q > 0) {
        const y = e.y + e.ry * Math.sqrt(q);
        if (y > h) h = y;
      }
    }
    return h;
  }

  // ---------- shared geometries ----------
  const GEO_HI = new THREE.SphereGeometry(1, 18, 12);    // 396 tris
  const GEO_MID = new THREE.SphereGeometry(1, 14, 10);   // 252 tris
  const GEO_LO = new THREE.SphereGeometry(1, 10, 7);     // 120 tris
  const GEO_BLOB = new THREE.SphereGeometry(1, 10, 6);   // 100 tris
  const GEO_SHRUB = new THREE.SphereGeometry(1, 8, 6);   // 80 tris
  const GEO_DOME = new THREE.SphereGeometry(1, 32, 8, 0, Math.PI * 2, 0, Math.PI / 2); // 480 tris

  function rock(geo, x, y, z, rx, ry, rz, yaw) {
    const m = add(geo, 'granite', x, y, z);
    m.scale.set(rx, ry, rz);
    m.rotation.y = yaw || 0;
    addSurf(x, y, z, rx, ry, rz, yaw || 0);
    return m;
  }
  function blob(x, y, z, rx, ry, rz) {
    const m = add(GEO_BLOB, 'leaves', x, y, z);
    m.scale.set(rx, ry, rz);
    return m;
  }
  function tube(pts, r, name) {
    const curve = new THREE.CatmullRomCurve3(pts.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, r, 6, false), M[name]);
    m.name = name;
    root.add(m);
    return m;
  }
  const UP = new THREE.Vector3(0, 1, 0);
  function limb(p, q, r0, r1, name) {
    const a = new THREE.Vector3(p[0], p[1], p[2]);
    const b = new THREE.Vector3(q[0], q[1], q[2]);
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    const m = add(new THREE.CylinderGeometry(r1, r0, len, 6, 1, true), name,
      (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    m.quaternion.setFromUnitVectors(UP, d.normalize());
    return m;
  }

  // ---------- ground: grass skirt, grass apron, hidden granite core ----------
  const skirt = add(new THREE.CylinderGeometry(0.985, 1, 0.4, 48), 'dry_grass', 0, 0.2, 0);
  skirt.scale.set(37, 1, 27);

  const apron = add(GEO_DOME, 'dry_grass', -1, 0, -1);
  apron.scale.set(33, 3.6, 23.5);
  addSurf(-1, 0, -1, 33, 3.6, 23.5, 0);

  const core = add(GEO_DOME, 'granite', -1, 0, -2);
  core.scale.set(24, 11, 17);
  addSurf(-1, 0, -2, 24, 11, 17, 0);

  // ---------- big boulders ----------
  const BIG = [
    [-2.4, 21.3, -3.8, 6.6, 3.1, 4.9, 0.08],   // perched summit boulder
    [-7.0, 8.8, 0.0, 11.0, 9.0, 10.5, 0.1],    // main streaked dome (front face)
    [-3.0, 8.0, -10.0, 9.0, 8.5, 6.2, -0.1],   // main dome, back face
    [14.0, 7.0, -1.0, 8.0, 7.8, 8.0, 0.3]      // right shoulder
  ];
  for (let i = 0; i < BIG.length; i++) {
    const b = BIG[i];
    rock(GEO_HI, b[0], b[1], b[2], b[3], b[4], b[5], b[6]);
  }

  // ---------- medium boulders ----------
  const MID = [
    [-2.5, 16.6, -3.5, 5.2, 2.4, 3.8, 0.1],    // seat under summit boulder
    [6.0, 13.5, -2.5, 4.0, 4.0, 4.0, 0.4],     // summit rock right
    [-10.5, 12.5, -4.5, 4.0, 4.0, 4.0, 0.0],   // summit rock left
    [8.5, 13.0, -7.0, 4.0, 4.5, 3.5, 0.2],     // summit rock back-right
    [-15.5, 11.0, 2.0, 4.0, 4.0, 4.5, -0.2],   // left shoulder of main dome
    [5.6, 7.4, 7.5, 7.0, 7.6, 6.0, -0.15],     // front round boulder
    [23.0, 6.3, 6.0, 6.0, 6.5, 5.5, 0.25],     // front-right streaked boulder
    [15.5, 6.0, 9.5, 4.0, 6.3, 4.3, 0.0],      // front, between
    [23.5, 6.0, -11.0, 6.3, 6.8, 6.0, -0.3],   // back-right big boulder
    [15.0, 5.8, -13.5, 5.0, 6.2, 5.0, 0.2],    // back-right
    [28.5, 3.5, -1.0, 4.5, 4.0, 5.0, 0.1],     // far right
    [9.0, 5.5, -16.5, 4.2, 6.0, 4.5, -0.2],    // back centre-right
    [-21.0, 5.5, -12.5, 5.8, 5.5, 5.5, 0.3],   // back-left big boulder
    [-13.0, 4.5, -19.0, 5.0, 4.8, 4.5, -0.2],  // back-left low
    [-17.0, 6.0, 3.0, 4.5, 6.5, 5.0, 0.15],    // left of main dome
    [-25.5, 4.0, -3.0, 5.0, 4.5, 5.5, 0.0],    // left flank
    [-25.0, 3.5, 8.0, 4.5, 3.5, 3.8, 0.4],     // front-left
    [-31.5, 2.0, -4.0, 3.5, 2.6, 4.0, 0.2],    // far left
    [-20.5, 7.0, -5.0, 4.5, 5.5, 5.0, -0.1],   // left, behind
    [-3.0, 3.0, 11.0, 4.5, 3.4, 3.5, 0.1],     // front base
    [-11.0, 2.6, 10.5, 4.0, 3.0, 3.5, -0.3],   // front base left
    [1.5, 3.2, 14.5, 3.5, 3.6, 3.0, 0.2],      // front toe
    [10.0, 5.0, 12.0, 4.5, 5.0, 3.5, 0.0],     // front toe right
    [-4.0, 3.8, -19.0, 4.8, 4.3, 4.0, 0.1],    // back base
    [30.0, 2.5, 9.0, 3.5, 2.8, 3.5, 0.3],      // right-front low
    [27.5, 3.0, -14.0, 3.8, 3.3, 3.5, -0.4],   // right-back low
    [-18.0, 2.8, 12.0, 3.5, 3.0, 3.0, 0.2],    // behind the slabs
    [3.0, 3.5, -20.5, 4.5, 4.0, 3.5, 0.0]      // back base centre
  ];
  for (let i = 0; i < MID.length; i++) {
    const b = MID[i];
    rock(GEO_MID, b[0], b[1], b[2], b[3], b[4], b[5], b[6]);
  }

  // ---------- fallen exfoliation slabs (front-left), curved in plan ----------
  function arcSlab(cx, cz, r, width, thick, a0, a1, n, y0, y1, t0, t1) {
    const da = (a1 - a0) / n;
    const segLen = r * da;
    const pitch = Math.atan2((y1 - y0) / n, segLen);
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      const a = a0 + da * (i + 0.5);
      const m = add(new THREE.BoxGeometry(segLen * 1.1, thick, width), 'granite',
        cx + r * Math.sin(a), y0 + (y1 - y0) * u, cz + r * Math.cos(a));
      m.rotation.order = 'YXZ';
      m.rotation.set(t0 + (t1 - t0) * u, a, pitch);
    }
  }
  arcSlab(-18, 9.5, 12.0, 2.6, 0.7, -0.35, 1.05, 5, 0.75, 1.05, 0.15, 0.15); // low outer slab
  arcSlab(-18, 9.5, 9.5, 3.2, 0.7, -0.2, 0.95, 4, 1.35, 2.9, 0.4, 0.85);     // leaning inner slab
  const block = add(new THREE.BoxGeometry(3.2, 2.0, 2.6), 'granite', -7.5, 1.0, 17.0);
  block.rotation.y = 0.3;
  const prop = add(GEO_LO, 'granite', -10.4, 0.6, 17.1);
  prop.scale.set(1.4, 1.0, 1.3);

  // ---------- scattered small rocks around the base ----------
  let placed = 0;
  for (let k = 0; k < 300 && placed < 30; k++) {
    const th = rnd() * Math.PI * 2;
    const f = 0.5 + 0.45 * rnd();
    const r = 0.6 + 1.5 * rnd();
    const sx = r * (0.85 + 0.4 * rnd());
    const sy = r * (0.55 + 0.25 * rnd());
    const sz = r * (0.8 + 0.4 * rnd());
    const yaw = rnd() * Math.PI;
    const x = 35.5 * f * Math.cos(th);
    const z = 25.5 * f * Math.sin(th);
    if (x < -5 && x > -24 && z > 13) continue; // keep the slab area clear
    const h = heightAt(x, z);
    if (h > 5) continue;
    const m = add(GEO_LO, 'granite', x, h + 0.15 * sy, z);
    m.scale.set(sx, sy, sz);
    m.rotation.y = yaw;
    placed++;
  }

  // ---------- shrubs ----------
  const SHRUBS = [
    [-3.5, 14.5, 1.2], [21.5, 12.5, 1.3], [26.5, 12.0, 1.0], [-28.5, 5.5, 1.2],
    [-8.0, -23.0, 1.1], [20.0, -18.5, 1.3], [2.0, 6.2, 1.0], [-8.5, -11.5, 1.0],
    [10.5, -9.5, 1.1], [-14.0, 7.5, 1.0], [-19.5, -18.0, 1.1], [27.0, -6.5, 1.0]
  ];
  for (let i = 0; i < SHRUBS.length; i++) {
    const s = SHRUBS[i];
    const h = heightAt(s[0], s[1]);
    const m = add(GEO_SHRUB, 'scrub', s[0], h + 0.1 * s[2], s[1]);
    m.scale.set(s[2], s[2] * 0.65, s[2] * 0.9);
  }
  let ns = 0;
  for (let k = 0; k < 120 && ns < 8; k++) {
    const th = rnd() * Math.PI * 2;
    const f = 0.45 + 0.45 * rnd();
    const r = 0.7 + 0.8 * rnd();
    const x = 35 * f * Math.cos(th);
    const z = 25 * f * Math.sin(th);
    if (x < -5 && x > -24 && z > 13) continue;
    const h = heightAt(x, z);
    if (h > 7) continue;
    const m = add(GEO_SHRUB, 'scrub', x, h + 0.1 * r, z);
    m.scale.set(r, r * 0.65, r * 0.9);
    ns++;
  }

  // ---------- Tree A: big fig on the right shoulder ----------
  tube([[12, 8.5, 6.5], [12.6, 10.5, 6.6], [13.6, 12.2, 6.8], [14.6, 13.4, 7.0]], 0.45, 'bark');
  limb([14.6, 13.4, 7.0], [11.2, 14.6, 6.5], 0.28, 0.12, 'bark');
  limb([14.6, 13.4, 7.0], [18.5, 14.8, 7.8], 0.28, 0.12, 'bark');
  limb([14.6, 13.4, 7.0], [15.0, 14.6, 3.8], 0.24, 0.10, 'bark');
  limb([14.6, 13.4, 7.0], [15.6, 14.8, 10.0], 0.24, 0.10, 'bark');
  limb([13.6, 12.2, 6.8], [10.5, 13.8, 6.2], 0.22, 0.10, 'bark');
  blob(15.0, 15.9, 7.0, 3.2, 1.7, 3.0);
  blob(11.2, 15.0, 6.5, 2.4, 1.4, 2.2);
  blob(18.6, 15.3, 8.0, 2.4, 1.4, 2.3);
  blob(15.2, 15.3, 3.8, 2.3, 1.3, 2.1);
  blob(15.6, 15.4, 10.4, 2.3, 1.3, 2.1);
  blob(13.0, 16.3, 8.2, 2.0, 1.2, 1.8);
  blob(17.0, 16.4, 5.8, 2.0, 1.2, 1.8);
  blob(10.5, 13.9, 6.2, 1.4, 0.9, 1.3);

  // ---------- Tree D: smaller tree, back-right ----------
  tube([[14.5, 10.0, -11.5], [14.8, 12.0, -12.0], [15.0, 13.6, -12.6]], 0.35, 'bark');
  limb([15.0, 13.6, -12.6], [12.8, 14.5, -12.0], 0.20, 0.08, 'bark');
  limb([15.0, 13.6, -12.6], [17.3, 14.6, -13.6], 0.20, 0.08, 'bark');
  blob(15.0, 15.2, -12.8, 2.8, 1.3, 2.6);
  blob(12.8, 14.8, -12.0, 1.8, 1.1, 1.7);
  blob(17.3, 14.9, -13.6, 1.8, 1.1, 1.7);

  // ---------- Tree B: left tree, back-left ----------
  tube([[-23.5, 7.5, -15.8], [-24.0, 9.8, -15.4], [-23.7, 11.8, -15.1]], 0.35, 'bark');
  limb([-23.7, 11.8, -15.1], [-26.0, 12.6, -14.6], 0.18, 0.08, 'bark');
  limb([-23.7, 11.8, -15.1], [-21.8, 12.8, -15.8], 0.18, 0.08, 'bark');
  limb([-23.7, 11.8, -15.1], [-23.8, 12.6, -17.2], 0.16, 0.07, 'bark');
  blob(-24.0, 13.4, -15.1, 2.5, 1.3, 2.3);
  blob(-26.2, 12.7, -14.6, 1.6, 1.0, 1.5);
  blob(-21.9, 12.9, -15.8, 1.6, 1.0, 1.5);
  blob(-23.8, 12.8, -17.3, 1.5, 0.9, 1.4);

  // ---------- Tree C: small tree on the left flank ----------
  tube([[-21.5, 5.0, 1.5], [-21.7, 8.0, 1.6], [-21.4, 10.4, 1.4]], 0.25, 'bark');
  limb([-21.4, 10.4, 1.4], [-22.6, 10.9, 2.3], 0.12, 0.06, 'bark');
  blob(-21.4, 11.2, 1.4, 1.8, 1.0, 1.7);
  blob(-22.6, 10.8, 2.3, 1.2, 0.8, 1.1);

  // ---------- dead snags ----------
  function snag(list) {
    for (let i = 0; i < list.length; i++) {
      const L = list[i];
      limb(L[0], L[1], L[2], L[3], 'dead_wood');
    }
  }
  snag([ // right (+x) snag
    [[32.5, 0.2, 4.0], [32.6, 4.2, 4.1], 0.22, 0.14],
    [[32.6, 4.2, 4.1], [31.3, 7.2, 3.7], 0.12, 0.05],
    [[32.6, 4.2, 4.1], [34.0, 7.4, 4.4], 0.12, 0.05],
    [[32.6, 4.2, 4.1], [32.8, 7.8, 5.3], 0.10, 0.04],
    [[32.55, 3.0, 4.05], [33.6, 5.6, 2.8], 0.08, 0.03],
    [[31.8, 5.9, 3.85], [30.7, 6.7, 4.4], 0.06, 0.03]
  ]);
  snag([ // left (-x) snag
    [[-29.5, 1.2, -8.0], [-29.4, 5.0, -8.0], 0.22, 0.14],
    [[-29.4, 5.0, -8.0], [-31.0, 8.6, -8.4], 0.12, 0.05],
    [[-29.4, 5.0, -8.0], [-27.9, 9.0, -7.6], 0.12, 0.05],
    [[-29.4, 5.0, -8.0], [-29.6, 9.1, -9.3], 0.10, 0.04],
    [[-29.45, 3.6, -8.0], [-28.3, 6.4, -6.6], 0.08, 0.03],
    [[-30.3, 7.0, -8.2], [-31.6, 7.6, -7.4], 0.06, 0.03]
  ]);
  snag([ // back-left snag
    [[-17.0, 0.2, -22.5], [-17.1, 3.4, -22.5], 0.20, 0.12],
    [[-17.1, 3.4, -22.5], [-18.4, 6.8, -22.9], 0.10, 0.04],
    [[-17.1, 3.4, -22.5], [-15.7, 7.1, -22.0], 0.10, 0.04],
    [[-17.1, 3.4, -22.5], [-17.2, 6.4, -24.2], 0.09, 0.04],
    [[-17.05, 2.2, -22.5], [-16.2, 4.6, -21.4], 0.07, 0.03]
  ]);

  return root;
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that), and any flat view
on the sheet that's missing from the list (both sides when both are drawn: a face no view shows is painted by a guess). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 20,000.
