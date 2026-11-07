You built the 3D model below from Christopher's reference sheet G06 · Long-horned desert antelope. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"model": {"side view (standing, facing left)": {"iou": 0.711, "turn_deg": 3.67}, "front view": {"iou": 0.833, "turn_deg": -0.51}, "back view": {"iou": 0.861, "turn_deg": 0.06}}}
The model's size in metres (x, y, z) and triangles: {"model": {"tris": 4400, "size": [0.455, 1.729, 1.96], "min": [-0.228, 0, -0.966]}}

Your code and the views you gave:
```json
{"objects": [{"name": "oryx", "size_m": [0.44, 1.70, 1.87],
  "views": [
    {"label": "side view (standing, facing left)", "box": [77, 7, 654, 532], "cam": [1, 0, 0], "up": [0, 1, 0]},
    {"label": "front view", "box": [711, 7, 840, 532], "cam": [0, 0, 1], "up": [0, 1, 0]},
    {"label": "back view", "box": [980, 7, 1129, 532], "cam": [0, 0, -1], "up": [0, 1, 0]}
  ]}],
 "notes": "Gemsbok-type oryx standing square. The scale bar gives about 306.5 px per metre: shoulder 1.2 m, horn tips 1.70 m, nose to tail-tip 1.87 m, horns about 0.85 m. Only the +x flank is drawn, so -x is mirrored. The running poses and the head/flank close-ups are left out. The horn spread is slightly asymmetric in the front and back views and is modelled symmetric."}

```
```js
function build(THREE) {
  const S = 306.5;                       // sheet px per metre (scale bar 0..2 m = px 372..985)
  const Z = (px) => (365 - px) / S;      // side view (cam +x): image left = +z, model centre at px 365
  const Y = (py) => (530 - py) / S;      // ground line at py 530
  const root = new THREE.Group();
  root.name = 'oryx';

  const COL = { fur_fawn: 0xbcad98, fur_white: 0xe0d9cc, fur_dark: 0x3f352f, horn: 0x6d6356, hoof: 0x4d4845 };
  const mats = {};
  const mat = (n) => mats[n] || (mats[n] = new THREE.MeshStandardMaterial({
    color: COL[n], roughness: (n === 'horn' || n === 'hoof') ? 0.7 : 0.95, metalness: 0 }));
  const add = (geo, n) => { const m = new THREE.Mesh(geo, mat(n)); m.name = n; root.add(m); return m; };
  const UP = new THREE.Vector3(0, 1, 0);
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);

  function ell(n, c, r, tiltX, ws, hs) {
    const m = add(new THREE.SphereGeometry(1, ws, hs), n);
    m.position.set(c[0], c[1], c[2]);
    m.scale.set(r[0], r[1], r[2]);
    m.rotation.x = tiltX || 0;
    return m;
  }
  function ball(n, c, r) {
    const m = add(new THREE.SphereGeometry(r, 8, 6), n);
    m.position.set(c[0], c[1], c[2]);
    return m;
  }
  // tapered cylinder between two points (always built bottom->top so local x stays world x)
  function seg(n, a, b, ra, rb, sx, rs) {
    let p = V(a), q = V(b);
    if (q.y < p.y) { const t = p; p = q; q = t; const tr = ra; ra = rb; rb = tr; }
    const d = new THREE.Vector3().subVectors(q, p);
    const len = d.length();
    const m = add(new THREE.CylinderGeometry(rb, ra, len, rs || 8), n);
    m.position.copy(p).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(UP, d.normalize());
    if (sx) m.scale.x = sx;
    return m;
  }
  // lathe whose axis runs from a toward b; profile = [radius, distance along axis]
  function lathe(n, prof, a, b, sx, segs) {
    const pts = prof.map((p) => new THREE.Vector2(p[0], p[1]));
    const m = add(new THREE.LatheGeometry(pts, segs), n);
    const p = V(a);
    const d = V(b).sub(p).normalize();
    m.position.copy(p);
    m.quaternion.setFromUnitVectors(UP, d);
    if (sx) m.scale.x = sx;
    return m;
  }
  // side-view silhouette (sheet pixels) extruded across x, centred on x = 0
  function sideShape(n, pts, width, bev) {
    const sh = new THREE.Shape();
    pts.forEach((p, i) => (i ? sh.lineTo(Z(p[0]), Y(p[1])) : sh.moveTo(Z(p[0]), Y(p[1]))));
    const depth = width - 2 * bev;
    const opt = { depth: depth, steps: 1, curveSegments: 2, bevelEnabled: bev > 0 };
    if (bev > 0) { opt.bevelThickness = bev; opt.bevelSize = bev; opt.bevelOffset = -bev; opt.bevelSegments = 2; }
    const geo = new THREE.ExtrudeGeometry(sh, opt);
    geo.translate(0, 0, -depth / 2);
    const m = add(geo, n);
    m.rotation.y = -Math.PI / 2;           // shape x -> model z
    return m;
  }

  // ---------- torso + neck ----------
  // central keel traced from the side view: gives the exact back line, rump, belly and throat
  sideShape('fur_fawn', [
    [182, 150], [205, 150], [235, 152], [262, 153], [300, 159], [350, 165], [400, 169], [450, 171],
    [500, 173], [540, 178], [570, 190], [592, 210], [604, 235], [611, 265], [612, 300], [606, 335],
    [592, 360], [565, 362], [540, 362], [510, 375], [475, 385], [430, 387], [380, 379], [330, 369],
    [285, 362], [240, 362], [205, 355], [182, 335], [166, 308], [154, 282], [147, 258], [150, 240],
    [165, 215], [175, 180]
  ], 0.18, 0.04);
  ell('fur_fawn', [0, 0.89, 0.37], [0.17, 0.32, 0.30], 0, 18, 12);     // chest / shoulders
  ell('fur_fawn', [0, 0.79, -0.17], [0.205, 0.325, 0.44], 0, 18, 12);  // barrel
  ell('fur_fawn', [0, 0.86, -0.56], [0.19, 0.28, 0.24], 0, 18, 12);    // rump
  for (const s of [1, -1]) ell('fur_fawn', [0.11 * s, 0.74, -0.58], [0.11, 0.22, 0.17], 0, 14, 10); // thighs
  ell('fur_fawn', [0, 0.985, 0.532], [0.105, 0.30, 0.15], 0.30, 16, 12); // thick neck, tilted forward

  // stiff dark mane along the neck crest
  sideShape('fur_dark', [
    [182, 142], [192, 136], [205, 135], [220, 137], [238, 140], [255, 144], [272, 150], [290, 157],
    [290, 166], [260, 160], [230, 158], [205, 158], [188, 160]
  ], 0.04, 0);

  // ---------- head ----------
  lathe('fur_white', [
    [0, -0.065], [0.045, -0.055], [0.074, -0.03], [0.088, 0.0], [0.09, 0.05], [0.083, 0.12],
    [0.072, 0.2], [0.064, 0.27], [0.059, 0.315], [0.05, 0.34], [0.03, 0.354], [0, 0.358]
  ], [0, 1.191, 0.653], [0, 0.982, 0.933], 0.85, 14);
  ell('fur_white', [0, 1.015, 0.70], [0.068, 0.078, 0.11], 0.35, 12, 8); // deep cheek / jaw

  for (const s of [1, -1]) {
    // ears: broad, held out sideways and slightly up
    const ear = ell('fur_fawn', [0.135 * s, 1.256, 0.61], [0.078, 0.055, 0.032], 0, 10, 8);
    ear.rotation.set(0, 0.15 * s, 0.25 * s);
    // long straight horns sweeping back
    seg('horn', [0.038 * s, 1.25, 0.68], [0.10 * s, 1.70, -0.04], 0.032, 0.006, null, 10);
  }

  // ---------- legs ----------
  function hoof(x, z) {
    const m = add(new THREE.CylinderGeometry(0.026, 0.038, 0.06, 8), 'hoof');
    m.position.set(x, 0.03, z);
    m.scale.z = 1.2;
  }
  function frontLeg(s, zh) {
    const x = 0.075 * s;
    const A = [x, 0.84, zh + 0.10], B = [x, 0.55, zh + 0.01], C = [x, 0.29, zh],
          D = [x, 0.11, zh + 0.005], E = [x, 0.05, zh + 0.02];
    seg('fur_fawn', A, B, 0.075, 0.062, 0.8);   // upper arm into chest
    seg('fur_dark', B, C, 0.06, 0.036, 0.8);    // forearm
    ball('fur_white', C, 0.037);                // knee
    seg('fur_white', C, D, 0.03, 0.026);        // cannon
    seg('fur_white', D, E, 0.027, 0.03);        // pastern
    hoof(x, zh + 0.02);
  }
  function hindLeg(s, st, hk, fl, zh) {
    const x = 0.095 * s;
    const P = [x, st[0], st[1]], H = [x, hk[0], hk[1]], F = [x, fl[0], fl[1]], E = [x, 0.05, zh + 0.015];
    seg('fur_fawn', P, H, 0.08, 0.04, 0.8);     // gaskin
    ball('fur_white', H, 0.04);                 // hock
    seg('fur_white', H, F, 0.032, 0.026);       // cannon
    seg('fur_white', F, E, 0.027, 0.03);        // pastern
    hoof(x, zh + 0.015);
  }
  frontLeg(1, 0.27);
  frontLeg(-1, 0.20);
  hindLeg(1, [0.60, -0.66], [0.30, -0.735], [0.11, -0.745], -0.74);  // near hind, set back
  hindLeg(-1, [0.60, -0.54], [0.34, -0.58], [0.11, -0.51], -0.49);   // far hind, stepped forward

  // ---------- tail ----------
  seg('fur_fawn', [0, Y(242), Z(601)], [0, Y(320), Z(612)], 0.035, 0.028);
  lathe('fur_dark', [
    [0, -0.02], [0.03, 0], [0.045, 0.12], [0.058, 0.3], [0.06, 0.42], [0.05, 0.55], [0.03, 0.64], [0, 0.69]
  ], [0, Y(295), Z(611)], [0, Y(505), Z(643)], 0.85, 10);

  return root;
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that), and any flat view
on the sheet that's missing from the list (both sides when both are drawn: a face no view shows is painted by a guess). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 6,000.
