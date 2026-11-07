You built the 3D model below from Christopher's reference sheet B16 · The station homestead. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"model": {"Front": {"iou": 0.943, "turn_deg": -0.01}, "Right": {"iou": 0.804, "turn_deg": -0.0}, "Back": {"iou": 0.946, "turn_deg": 0.16}, "Left": {"iou": 0.805, "turn_deg": 0.26}, "Top": {"iou": 0.957, "turn_deg": -0.01}}}
The model's size in metres (x, y, z) and triangles: {"model": {"tris": 5264, "size": [19.06, 7.2, 18.49], "min": [-9.53, 0, -9.68]}}

Your code and the views you gave:
```json
{"objects": [{"name": "station_homestead", "size_m": [19.1, 7.2, 18.5],
  "views": [
    {"label": "Front", "box": [55, 12, 768, 282], "cam": [0, 0, 1], "up": [0, 1, 0]},
    {"label": "Right", "box": [876, 12, 1490, 282], "cam": [1, 0, 0], "up": [0, 1, 0]},
    {"label": "Back", "box": [51, 318, 767, 585], "cam": [0, 0, -1], "up": [0, 1, 0]},
    {"label": "Left", "box": [871, 318, 1470, 584], "cam": [-1, 0, 0], "up": [0, 1, 0]},
    {"label": "Top", "box": [100, 640, 585, 991], "cam": [0, 1, 0], "up": [0, 0, -1]}
  ]}],
 "notes": "Station homestead: a rendered core under a rusty corrugated hip roof with two chimneys. A bullnose verandah runs all round on timber posts, with fly-screened bays, a deck on a batten skirt, front steps and two galvanised tanks at the back corners. The sheet's 1 m bar (~54 px) would make the doors 1.3 m and the verandah 1.85 m high, so I sized from the doors and windows instead (~37.5 px/m in the elevations): roof 18.8 x 15.3 m, ridge 6.7 m, chimney tops 7.2 m. The views disagree on where the tanks are: the top view puts them beside the house, the side views put them overlapping the back deck. I placed them just clear of the back deck corners, so the tanks in the side views will be about 1 m off."}

```
```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'station_homestead';

  // ---------- materials ----------
  const COLORS = {
    rusty_iron: 0x8d4e3a,
    render: 0xd2c19b,
    painted_timber: 0xcbc0a6,
    weathered_timber: 0x857660,
    timber: 0x968670,
    glass: 0x3e423f,
    fly_screen: 0x5a5852,
    galvanised_iron: 0x8c8f8b
  };
  const mats = {};
  function M(name) {
    if (!mats[name]) {
      mats[name] = new THREE.MeshStandardMaterial({
        color: COLORS[name],
        roughness: 0.9,
        metalness: name === 'galvanised_iron' ? 0.3 : 0.0
      });
    }
    return mats[name];
  }
  function mesh(parent, name, geo) {
    const m = new THREE.Mesh(geo, M(name));
    m.name = name;
    parent.add(m);
    return m;
  }
  function box(parent, name, w, h, d, x, y, z, rx, ry, rz) {
    const m = mesh(parent, name, new THREE.BoxGeometry(w, h, d));
    m.position.set(x, y, z);
    m.rotation.set(rx || 0, ry || 0, rz || 0);
    return m;
  }
  const ZAXIS = new THREE.Vector3(0, 0, 1);
  function V(x, y, z) { return new THREE.Vector3(x, y, z); }
  function strut(parent, name, a, b, w, h) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = mesh(parent, name, new THREE.BoxGeometry(w, h, len));
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(ZAXIS, dir.normalize());
    return m;
  }

  // ---------- key dimensions (metres) ----------
  const DECK = 0.8;                 // verandah floor level
  const PX = 9.22, PZ = 7.5;        // verandah post lines
  const RX = 9.4, RZ = 7.65;        // verandah roof outer edges
  const EX = 6.85, EZ = 4.75, EY = 4.35; // main roof eave rectangle and height
  const RIDGE_Y = 6.67;
  const RIDGE_HALF = EX - EZ;       // equal-pitch hip roof
  const WX = 6.6, WZ = 4.5, WT = 0.2;    // core walls (outer faces) and thickness
  const WALL_BOT = 0.72, WALL_TOP = 4.47;
  const BEAM_BOT = 3.25, BEAM_TOP = 3.42;

  // ---------- deck, edge boards, batten skirt ----------
  box(root, 'weathered_timber', 2 * (PX + 0.07), 0.08, 2 * (PZ + 0.07), 0, DECK - 0.04, 0);
  for (const s of [-1, 1]) {
    box(root, 'weathered_timber', 2 * (PX + 0.11), 0.2, 0.04, 0, DECK - 0.1, s * (PZ + 0.09));
    box(root, 'weathered_timber', 0.04, 0.2, 2 * (PZ + 0.07), s * (PX + 0.09), DECK - 0.1, 0);
    box(root, 'weathered_timber', 2 * PX, DECK - 0.18, 0.03, 0, (DECK - 0.18) / 2, s * PZ);
    box(root, 'weathered_timber', 0.03, DECK - 0.18, 2 * PZ, s * PX, (DECK - 0.18) / 2, 0);
  }

  // ---------- verandah posts (ground to beam) with brackets ----------
  const posts = [];
  const frontX = [-9.22, -7.3, -4.9, -1.55, 1.55, 4.9, 7.3, 9.22];
  const backX = [-9.22, -7.3, -4.9, 0, 4.9, 7.3, 9.22];
  const sideZ = [5.3, 3.4, 1.5, -2.6, -5.3];
  for (const x of frontX) posts.push([x, PZ]);
  for (const x of backX) posts.push([x, -PZ]);
  for (const s of [-1, 1]) for (const z of sideZ) posts.push([s * PX, z]);
  for (const p of posts) {
    const x = p[0], z = p[1];
    box(root, 'painted_timber', 0.14, BEAM_TOP, 0.14, x, BEAM_TOP / 2, z);
    const onFB = Math.abs(Math.abs(z) - PZ) < 1e-3;
    const onSide = Math.abs(Math.abs(x) - PX) < 1e-3;
    let dirs;
    if (onFB && onSide) dirs = [[-Math.sign(x), 0], [0, -Math.sign(z)]];
    else if (onFB) dirs = [[1, 0], [-1, 0]];
    else dirs = [[0, 1], [0, -1]];
    for (const d of dirs) {
      strut(root, 'painted_timber',
        V(x + d[0] * 0.07, 2.95, z + d[1] * 0.07),
        V(x + d[0] * 0.42, BEAM_BOT + 0.02, z + d[1] * 0.42), 0.05, 0.05);
    }
  }

  // ---------- beams and frieze boards ----------
  const beamY = (BEAM_BOT + BEAM_TOP) / 2, beamH = BEAM_TOP - BEAM_BOT;
  for (const s of [-1, 1]) {
    box(root, 'painted_timber', 2 * PX + 0.14, beamH, 0.12, 0, beamY, s * PZ);
    box(root, 'painted_timber', 0.12, beamH, 2 * PZ + 0.14, s * PX, beamY, 0);
    box(root, 'painted_timber', 2 * PX, 0.23, 0.03, 0, 3.535, s * (PZ - 0.03));
    box(root, 'painted_timber', 0.03, 0.23, 2 * PZ, s * (PX - 0.03), 3.535, 0);
  }

  // ---------- verandah rails (two horizontal rails) ----------
  for (const ry of [DECK + 0.53, DECK + 0.98]) {
    const segL = PX - 1.55;
    box(root, 'painted_timber', segL, 0.06, 0.05, -(1.55 + segL / 2), ry, PZ);
    box(root, 'painted_timber', segL, 0.06, 0.05, 1.55 + segL / 2, ry, PZ);
    box(root, 'painted_timber', 2 * PX, 0.06, 0.05, 0, ry, -PZ);
    box(root, 'painted_timber', 0.05, 0.06, 2 * PZ, PX, ry, 0);
    box(root, 'painted_timber', 0.05, 0.06, 2 * PZ, -PX, ry, 0);
  }

  // ---------- fly-screened bays ----------
  const scrB = DECK + 0.02, scrH = BEAM_BOT - scrB, scrY = (BEAM_BOT + scrB) / 2;
  for (const s of [-1, 1]) {
    box(root, 'fly_screen', 7.3 - 4.9 - 0.14, scrH, 0.02, s * 6.1, scrY, PZ - 0.05);
    box(root, 'fly_screen', 7.3 - 4.9 - 0.14, scrH, 0.02, s * 6.1, scrY, -(PZ - 0.05));
    for (const zz of [[1.5, 3.4], [3.4, 5.3]]) {
      box(root, 'fly_screen', 0.02, scrH, zz[1] - zz[0] - 0.14, s * (PX - 0.05), scrY, (zz[0] + zz[1]) / 2);
    }
  }

  // ---------- bullnose verandah roof (curved profile, mitred corners) ----------
  const prof = [[0, 4.35], [0.275, 4.24], [0.55, 4.13]];
  for (let k = 1; k <= 6; k++) {
    const th = k * Math.PI / 12;
    prof.push([0.55 + 0.45 * Math.sin(th), 4.13 - 0.68 * (1 - Math.cos(th))]);
  }
  const RUNX = RX - EX, RUNZ = RZ - EZ, ST = 0.04;
  for (let k = 0; k < prof.length - 1; k++) {
    const ta = prof[k][0], ha = prof[k][1], tb = prof[k + 1][0], hb = prof[k + 1][1];
    const dy = hb - ha, ym = (ha + hb) / 2;
    // front and back
    const za = EZ + ta * RUNZ, zb = EZ + tb * RUNZ, dz = zb - za;
    const Lz = Math.hypot(dz, dy) + 0.02;
    const beta = Math.atan2(-dy, dz);
    const wFB = 2 * (EX + tb * RUNX);
    box(root, 'rusty_iron', wFB, ST, Lz, 0, ym, (za + zb) / 2, beta, 0, 0);
    box(root, 'rusty_iron', wFB, ST, Lz, 0, ym, -(za + zb) / 2, -beta, 0, 0);
    // sides
    const xa = EX + ta * RUNX, xb = EX + tb * RUNX, dx = xb - xa;
    const Lx = Math.hypot(dx, dy) + 0.02;
    const gam = Math.atan2(dy, dx);
    const dS = 2 * (EZ + tb * RUNZ);
    box(root, 'rusty_iron', Lx, ST, dS, (xa + xb) / 2, ym, 0, 0, 0, gam);
    box(root, 'rusty_iron', Lx, ST, dS, -(xa + xb) / 2, ym, 0, 0, 0, -gam);
  }

  // ---------- main hip roof ----------
  const RISE = RIDGE_Y - EY;
  const PITCH = Math.atan2(RISE, EZ);
  const SLANT = Math.hypot(RISE, EZ);
  function roofFace(halfBottom, halfTop, dist, rotY) {
    const s = new THREE.Shape();
    s.moveTo(-halfBottom, 0);
    s.lineTo(halfBottom, 0);
    if (halfTop > 0.001) { s.lineTo(halfTop, SLANT); s.lineTo(-halfTop, SLANT); }
    else s.lineTo(0, SLANT);
    s.closePath();
    const g = new THREE.Group();
    g.rotation.y = rotY;
    root.add(g);
    const m = mesh(g, 'rusty_iron', new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false }));
    m.position.set(0, EY, dist);
    m.rotation.x = -(Math.PI / 2 - PITCH);
  }
  roofFace(EX + 0.02, RIDGE_HALF, EZ, 0);
  roofFace(EX + 0.02, RIDGE_HALF, EZ, Math.PI);
  roofFace(EZ + 0.02, 0, EX, Math.PI / 2);
  roofFace(EZ + 0.02, 0, EX, -Math.PI / 2);
  box(root, 'rusty_iron', 2 * RIDGE_HALF + 0.2, 0.08, 0.22, 0, RIDGE_Y + 0.07, 0);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      strut(root, 'rusty_iron',
        V(sx * (EX + 0.02), EY + 0.07, sz * (EZ + 0.02)),
        V(sx * RIDGE_HALF, RIDGE_Y + 0.07, 0), 0.14, 0.08);
    }
  }

  // ---------- chimneys ----------
  for (const s of [-1, 1]) {
    const cx = s * 4.05, cz = -1.0;
    box(root, 'render', 0.85, 2.04, 0.9, cx, 5.0 + 1.02, cz);
    box(root, 'render', 0.92, 0.08, 0.97, cx, 6.75, cz);
    const sh = new THREE.Shape();
    sh.moveTo(-0.48, -0.5); sh.lineTo(0.48, -0.5); sh.lineTo(0.48, 0.5); sh.lineTo(-0.48, 0.5); sh.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-0.24, -0.24); hole.lineTo(0.24, -0.24); hole.lineTo(0.24, 0.24); hole.lineTo(-0.24, 0.24); hole.closePath();
    sh.holes.push(hole);
    const cap = mesh(root, 'render', new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: false }));
    cap.rotation.x = -Math.PI / 2;
    cap.position.set(cx, 7.04, cz);
  }

  // ---------- core walls with set-in windows and door ----------
  function wallGroup(px, pz, rotY) {
    const g = new THREE.Group();
    g.position.set(px, 0, pz);
    g.rotation.y = rotY;
    root.add(g);
    return g;
  }
  function wallMesh(g, len, holes) {
    const s = new THREE.Shape();
    s.moveTo(-len / 2, WALL_BOT); s.lineTo(len / 2, WALL_BOT); s.lineTo(len / 2, WALL_TOP); s.lineTo(-len / 2, WALL_TOP); s.closePath();
    for (const o of holes) {
      const p = new THREE.Path();
      p.moveTo(o[0], o[2]); p.lineTo(o[1], o[2]); p.lineTo(o[1], o[3]); p.lineTo(o[0], o[3]); p.closePath();
      s.holes.push(p);
    }
    const m = mesh(g, 'render', new THREE.ExtrudeGeometry(s, { depth: WT, bevelEnabled: false }));
    m.position.z = -WT;
  }
  const WIN_W = 1.05, WIN_B = 1.75, WIN_T = 3.32;
  function winHole(x) { return [x - WIN_W / 2, x + WIN_W / 2, WIN_B, WIN_T]; }
  function windowIn(g, x) {
    const h = WIN_T - WIN_B, ym = (WIN_T + WIN_B) / 2;
    box(g, 'glass', WIN_W - 0.1, h - 0.1, 0.03, x, ym, -0.12);
    box(g, 'painted_timber', 0.06, h, 0.16, x - WIN_W / 2 + 0.03, ym, -0.1);
    box(g, 'painted_timber', 0.06, h, 0.16, x + WIN_W / 2 - 0.03, ym, -0.1);
    box(g, 'painted_timber', WIN_W - 0.12, 0.07, 0.16, x, WIN_T - 0.035, -0.1);
    box(g, 'painted_timber', WIN_W - 0.12, 0.06, 0.16, x, WIN_B + 0.03, -0.1);
    box(g, 'painted_timber', WIN_W - 0.12, 0.05, 0.08, x, ym, -0.08);
    box(g, 'painted_timber', 0.035, h - 0.12, 0.05, x, ym, -0.1);
    box(g, 'weathered_timber', WIN_W + 0.24, 0.07, 0.2, x, WIN_B - 0.035, 0.0);
  }
  const DOOR_W = 1.85, DOOR_T = 3.33;
  function doorIn(g) {
    const leafTop = DECK + 2.08, fh = DOOR_T - DECK;
    box(g, 'painted_timber', 0.07, fh, 0.18, -DOOR_W / 2 + 0.035, (DOOR_T + DECK) / 2, -0.1);
    box(g, 'painted_timber', 0.07, fh, 0.18, DOOR_W / 2 - 0.035, (DOOR_T + DECK) / 2, -0.1);
    box(g, 'painted_timber', DOOR_W - 0.14, 0.08, 0.18, 0, DOOR_T - 0.04, -0.1);
    box(g, 'painted_timber', DOOR_W - 0.14, 0.08, 0.18, 0, leafTop + 0.04, -0.1);
    box(g, 'glass', DOOR_W - 0.14, DOOR_T - leafTop - 0.16, 0.03, 0, (DOOR_T + leafTop) / 2, -0.12);
    const lw = (DOOR_W - 0.14) / 2;
    for (const s of [-1, 1]) {
      box(g, 'timber', lw - 0.01, leafTop - DECK, 0.05, s * lw / 2, (leafTop + DECK) / 2, -0.15);
      box(g, 'galvanised_iron', 0.04, 0.12, 0.06, s * 0.08, DECK + 1.0, -0.1);
      box(g, 'painted_timber', 0.1, fh + 0.1, 0.04, s * (DOOR_W / 2 + 0.05), (DOOR_T + DECK + 0.1) / 2, 0.02);
    }
    box(g, 'painted_timber', DOOR_W + 0.2, 0.1, 0.04, 0, DOOR_T + 0.05, 0.02);
    box(g, 'weathered_timber', DOOR_W, 0.03, 0.24, 0, DECK + 0.015, -0.08);
  }

  // front wall (+z)
  const gF = wallGroup(0, WZ, 0);
  wallMesh(gF, 2 * WX, [winHole(-3.23), winHole(3.23), [-DOOR_W / 2, DOOR_W / 2, DECK, DOOR_T]]);
  windowIn(gF, -3.23);
  windowIn(gF, 3.23);
  doorIn(gF);
  // back wall (-z)
  const gB = wallGroup(0, -WZ, Math.PI);
  wallMesh(gB, 2 * WX, [winHole(-2.55), winHole(2.55)]);
  windowIn(gB, -2.55);
  windowIn(gB, 2.55);
  // right wall (+x), local x runs toward -z
  const gR = wallGroup(WX, 0, Math.PI / 2);
  wallMesh(gR, 2 * (WZ - WT), [winHole(1.27)]);
  windowIn(gR, 1.27);
  // left wall (-x), local x runs toward +z
  const gL = wallGroup(-WX, 0, -Math.PI / 2);
  wallMesh(gL, 2 * (WZ - WT), [winHole(-1.27)]);
  windowIn(gL, -1.27);

  // ---------- front steps and handrails ----------
  const STW = 2.9;
  for (let i = 0; i < 4; i++) {
    const top = DECK - 0.16 * (i + 1);
    const run = 0.3 * (i + 1);
    box(root, 'weathered_timber', STW, top, run, 0, top / 2, PZ + 0.11 + run / 2);
  }
  for (const s of [-1, 1]) {
    box(root, 'painted_timber', 0.1, 1.0, 0.1, s * 1.5, 0.5, 8.65);
    strut(root, 'painted_timber', V(s * 1.53, DECK + 0.98, PZ), V(s * 1.5, 0.98, 8.65), 0.06, 0.05);
    strut(root, 'painted_timber', V(s * 1.53, DECK + 0.53, PZ), V(s * 1.5, 0.53, 8.65), 0.05, 0.05);
  }

  // ---------- rainwater tanks, gutters and downpipes at the back corners ----------
  for (const s of [-1, 1]) {
    const tx = s * 8.5, tz = -8.65;
    const body = mesh(root, 'galvanised_iron', new THREE.CylinderGeometry(1.0, 1.0, 2.2, 28, 1));
    body.position.set(tx, 1.1, tz);
    const lid = mesh(root, 'galvanised_iron', new THREE.ConeGeometry(1.03, 0.16, 28));
    lid.position.set(tx, 2.28, tz);
    for (const ry of [0.04, 2.18]) {
      const rim = mesh(root, 'galvanised_iron', new THREE.TorusGeometry(1.0, 0.03, 6, 28));
      rim.rotation.x = Math.PI / 2;
      rim.position.set(tx, ry, tz);
    }
    const inlet = mesh(root, 'galvanised_iron', new THREE.CylinderGeometry(0.14, 0.14, 0.1, 12));
    inlet.position.set(s * 8.95, 2.28, -8.08);
    box(root, 'galvanised_iron', 1.0, 0.1, 0.12, s * 8.85, 3.47, -(RZ + 0.06));
    const curve = new THREE.CatmullRomCurve3([
      V(s * 8.95, 3.44, -(RZ + 0.06)),
      V(s * 8.95, 3.0, -(RZ + 0.08)),
      V(s * 8.95, 2.62, -7.95),
      V(s * 8.95, 2.32, -8.08)
    ]);
    mesh(root, 'galvanised_iron', new THREE.TubeGeometry(curve, 16, 0.045, 8, false));
  }

  return root;
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that), and any flat view
on the sheet that's missing from the list (both sides when both are drawn: a face no view shows is painted by a guess). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 40,000.
