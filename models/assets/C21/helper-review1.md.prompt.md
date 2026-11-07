You built the 3D model below from Christopher's reference sheet C21 · The Terraces temple. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"model": {"Front": {"iou": 0.965, "turn_deg": -0.01}, "Right": {"iou": 0.948, "turn_deg": 0.16}, "Back": {"iou": 0.964, "turn_deg": -0.0}, "Left": {"iou": 0.949, "turn_deg": 0.02}, "Top": {"iou": 0.988, "turn_deg": 0.06}}}
The model's size in metres (x, y, z) and triangles: {"model": {"tris": 2360, "size": [14.5, 6.19, 13.03], "min": [-7.25, 0, -6.5]}}

Your code and the views you gave:
```json
{
  "objects": [
    {
      "name": "terraces_temple",
      "size_m": [14.5, 6.19, 13.0],
      "views": [
        {"label": "Front", "box": [78, 15, 763, 307], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Right", "box": [812, 15, 1422, 307], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "Back", "box": [118, 350, 712, 589], "cam": [0, 0, -1], "up": [0, 1, 0]},
        {"label": "Left", "box": [851, 353, 1350, 588], "cam": [-1, 0, 0], "up": [0, 1, 0]},
        {"label": "Top", "box": [147, 640, 557, 973], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    }
  ],
  "notes": "Ruined stone temple. It has battered (inward-sloping) walls, a frieze of stepped corbels under a heavy cornice, a vented attic block on the roof, and three doorways. The centre doorway is closed by a hand-relief slab and has a small spout; a water runnel runs down the full-width front stairs. The scale bar (about 47 px = 1 m on the front view) gives about 14.5 m wide, 6.2 m tall and 13 m deep including about 2.8 m of stairs. The back, left and top views are drawn at smaller and slightly different scales. The right view draws the stair profile rising higher (about 2.6 m) than the front and left views do (about 1.34 m); the model uses 1.34 m, the door threshold. The attic depth disagrees between views (the sides show 1.6 to 2 m, the top shows about 3.8 m); the model uses 1.9 m."
}

```
```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'terraces_temple';

  const COLORS = { stone: 0x6d6352, dark_stone: 0x2a2621, carved_stone: 0x5e4e3e, water: 0xb8c3c4 };
  const mats = {};
  function mat(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name] });
    return mats[name];
  }
  function mesh(geo, name) { const m = new THREE.Mesh(geo, mat(name)); m.name = name; return m; }
  function boxMM(parent, name, x0, x1, y0, y1, z0, z1) {
    const m = mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), name);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    parent.add(m);
    return m;
  }
  function extrude(shape, depth) {
    return new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, curveSegments: 1 });
  }
  function rectPath(x0, y0, x1, y1) {
    const p = new THREE.Path();
    p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.lineTo(x0, y0);
    return p;
  }

  // ---------- main battered body ----------
  const HB = 7.25;          // half width at ground
  const HF = 4.0;           // height of battered walls
  const K = 0.875;          // top/bottom size ratio
  const SX = HB * (1 - K) / HF;
  const ZBACK = -6.5, ZFRONT = 3.7, TFAC = 0.8;
  const CORE_HD = (ZFRONT - TFAC - ZBACK) / 2;   // 4.7
  const CORE_ZC = (ZFRONT - TFAC + ZBACK) / 2;   // -1.8
  const SZ = CORE_HD * (1 - K) / HF;             // front/back batter
  const halfW = y => HB - SX * y;
  const frontZ = y => ZFRONT - SZ * y;
  const backZ = y => ZBACK + SZ * y;
  const ZC = (backZ(HF) + frontZ(HF)) / 2;       // centre of upper works (~ -1.40)

  let cg = new THREE.CylinderGeometry(Math.SQRT2 * K, Math.SQRT2, HF, 4, 1, false, Math.PI / 4);
  cg.scale(HB, 1, CORE_HD);
  cg = cg.toNonIndexed();
  cg.computeVertexNormals();
  const core = mesh(cg, 'stone');
  core.position.set(0, HF / 2, CORE_ZC);
  root.add(core);

  // ---------- front facade slab (battered, with three doorways) ----------
  const th = Math.atan(SZ), ct = Math.cos(th), st = Math.sin(th);
  const fac = new THREE.Group();
  fac.rotation.x = -th;
  fac.position.set(0, 0, ZFRONT);
  root.add(fac);
  const yp = y => y / ct;
  const SLAB_D = 0.8;
  const yb = SLAB_D * st / ct;
  const yt = yp(4.1);
  const xAt = v => halfW(v * ct);
  const fs = new THREE.Shape();
  fs.moveTo(-xAt(yb), yb); fs.lineTo(xAt(yb), yb); fs.lineTo(xAt(yt), yt); fs.lineTo(-xAt(yt), yt); fs.lineTo(-xAt(yb), yb);

  const DY0 = 1.34, DY1 = 3.32;
  const doors = [
    { x: -3.0, hw: 0.66, jw: 0.30, open: true },
    { x: 0.0, hw: 0.82, jw: 0.33, open: false },
    { x: 3.0, hw: 0.66, jw: 0.30, open: true }
  ];
  doors.forEach(d => fs.holes.push(rectPath(d.x - d.hw, yp(DY0), d.x + d.hw, yp(DY1))));
  const slabGeo = extrude(fs, SLAB_D);
  slabGeo.translate(0, 0, -SLAB_D);
  fac.add(mesh(slabGeo, 'stone'));

  const v0 = yp(DY0), v1 = yp(DY1);
  doors.forEach(d => {
    if (d.open) {
      // dark interior at the back of the open doorways
      boxMM(fac, 'dark_stone', d.x - d.hw, d.x + d.hw, v0, v1, -0.78, -0.74);
    } else {
      // closed centre door with hand relief panel, spout and outflow
      boxMM(fac, 'carved_stone', d.x - d.hw + 0.01, d.x + d.hw - 0.01, v0, v1, -0.42, -0.30);
      boxMM(fac, 'carved_stone', d.x - 0.55, d.x + 0.55, v0 + 0.35, v1 - 0.2, -0.30, -0.27);
      boxMM(fac, 'dark_stone', d.x - 0.16, d.x + 0.16, v0, v0 + 0.26, -0.30, -0.28);
      boxMM(fac, 'water', d.x - 0.17, d.x + 0.17, v0, v0 + 0.025, -0.30, 0.02);
    }
    // jambs and lintel
    boxMM(fac, 'stone', d.x - d.hw - d.jw, d.x - d.hw, v0 - 0.12, v1, -0.02, 0.18);
    boxMM(fac, 'stone', d.x + d.hw, d.x + d.hw + d.jw, v0 - 0.12, v1, -0.02, 0.18);
    boxMM(fac, 'stone', d.x - d.hw - d.jw - 0.05, d.x + d.hw + d.jw + 0.05, v1, v1 + 0.46, -0.02, 0.22);
  });

  // ---------- front stairs with central water channel ----------
  const NS = 7, TREAD = 0.4, ZST = 6.5, CH = 0.45, ZIN = 2.6;
  for (let i = 0; i < NS; i++) {
    const h = DY0 * (i + 1) / NS;
    const zf = ZST - TREAD * i;
    const hw = halfW(h);
    boxMM(root, 'stone', CH, hw, 0, h, ZIN, zf);
    boxMM(root, 'stone', -hw, -CH, 0, h, ZIN, zf);
    boxMM(root, 'stone', -CH, CH, 0, h - 0.1, ZIN, zf);
    const zb = (i === NS - 1) ? frontZ(h) - 0.06 : ZST - TREAD * (i + 1);
    boxMM(root, 'water', -CH + 0.01, CH - 0.01, h - 0.1, h - 0.065, zb, zf + 0.03);
    const hLow = i === 0 ? 0 : DY0 * i / NS - 0.1;
    boxMM(root, 'water', -CH + 0.01, CH - 0.01, hLow, h - 0.065, zf + 0.005, zf + 0.03);
  }

  // ---------- string courses on back and sides ----------
  [1.1, 2.6].forEach(yc => {
    const t = 0.14, p = 0.06, w = halfW(yc), bz = backZ(yc), fz = frontZ(yc);
    boxMM(root, 'stone', -w - p, w + p, yc - t / 2, yc + t / 2, bz - p, bz + 0.3);
    boxMM(root, 'stone', w - 0.3, w + p, yc - t / 2, yc + t / 2, bz - p, fz);
    boxMM(root, 'stone', -w - p, -w + 0.3, yc - t / 2, yc + t / 2, bz - p, fz);
  });

  // ---------- moulding band and frieze ----------
  boxMM(root, 'stone', -6.38, 6.38, 3.98, 4.18, ZC - 4.575, ZC + 4.575);
  const FW = 6.15, FD = 4.35;
  boxMM(root, 'stone', -FW, FW, 4.18, 4.80, ZC - FD, ZC + FD);

  // ---------- stepped corbels ----------
  const tiers = [[0.8, 0.22], [0.62, 0.20], [0.44, 0.18], [0.26, 0.16]];
  const TH = 0.155, CTOP = 4.80;
  function corbel(face, pos) {
    tiers.forEach((tr, j) => {
      const w = tr[0], p = tr[1], y1 = CTOP - TH * j, y0 = y1 - TH;
      if (face === 'front') boxMM(root, 'stone', pos - w / 2, pos + w / 2, y0, y1, ZC + FD - 0.05, ZC + FD + p);
      else if (face === 'back') boxMM(root, 'stone', pos - w / 2, pos + w / 2, y0, y1, ZC - FD - p, ZC - FD + 0.05);
      else if (face === 'right') boxMM(root, 'stone', FW - 0.05, FW + p, y0, y1, pos - w / 2, pos + w / 2);
      else boxMM(root, 'stone', -FW - p, -FW + 0.05, y0, y1, pos - w / 2, pos + w / 2);
    });
  }
  [-5.75, -3.95, -1.4, 1.4, 3.95, 5.75].forEach(x => corbel('front', x));
  [-5.75, -3.95, -2.0, 0, 2.0, 3.95, 5.75].forEach(x => corbel('back', x));
  [-3.95, -2.0, 0, 2.0, 3.95].forEach(dz => { corbel('right', ZC + dz); corbel('left', ZC + dz); });

  // ---------- cornice and roof rim ----------
  boxMM(root, 'stone', -6.45, 6.45, 4.80, 4.98, ZC - 4.625, ZC + 4.625);
  boxMM(root, 'stone', -6.40, 6.40, 4.98, 5.10, ZC - 4.575, ZC + 4.575);
  const RX = 6.40, RZ = 4.575, RW = 0.4;
  boxMM(root, 'stone', -RX, RX, 5.10, 5.20, ZC + RZ - RW, ZC + RZ);
  boxMM(root, 'stone', -RX, RX, 5.10, 5.20, ZC - RZ, ZC - RZ + RW);
  boxMM(root, 'stone', -RX, -RX + RW, 5.10, 5.20, ZC - RZ + RW, ZC + RZ - RW);
  boxMM(root, 'stone', RX - RW, RX, 5.10, 5.20, ZC - RZ + RW, ZC + RZ - RW);

  // ---------- attic block with vents ----------
  const AW = 2.725, AD = 0.95, AY0 = 5.10, AY1 = 5.90, AT = 0.12, AH = AY1 - AY0;
  const VY0 = 0.33, VY1 = 0.63;
  function wallShape(half, vents, vw) {
    const s = new THREE.Shape();
    s.moveTo(-half, 0); s.lineTo(half, 0); s.lineTo(half, AH); s.lineTo(-half, AH); s.lineTo(-half, 0);
    vents.forEach(v => s.holes.push(rectPath(v - vw / 2, VY0, v + vw / 2, VY1)));
    return s;
  }
  const fv = [];
  for (let k = 0; k < 7; k++) fv.push(-2.0 + k * 2.0 / 3);
  const fw = mesh(extrude(wallShape(AW, fv, 0.22), AT), 'stone');
  fw.position.set(0, AY0, ZC + AD - AT);
  root.add(fw);
  const bw = mesh(extrude(wallShape(AW, fv, 0.22), AT), 'stone');
  bw.position.set(0, AY0, ZC - AD);
  root.add(bw);
  const sv = [-0.5, 0, 0.5];
  const rw = mesh(extrude(wallShape(AD - AT, sv, 0.2), AT), 'stone');
  rw.rotation.y = Math.PI / 2;
  rw.position.set(AW - AT, AY0, ZC);
  root.add(rw);
  const lw = mesh(extrude(wallShape(AD - AT, sv, 0.2), AT), 'stone');
  lw.rotation.y = Math.PI / 2;
  lw.position.set(-AW, AY0, ZC);
  root.add(lw);
  boxMM(root, 'dark_stone', -AW + 0.1, AW - 0.1, AY0, AY1 - 0.01, ZC - AD + 0.1, ZC + AD - 0.1);
  boxMM(root, 'stone', -2.85, 2.85, AY1, 6.19, ZC - 1.05, ZC + 1.05);

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
