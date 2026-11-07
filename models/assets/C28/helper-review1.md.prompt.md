You built the 3D model below from Christopher's reference sheet C28 · A seated stone figure. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"model": {"Front": {"iou": 0.926, "turn_deg": 0.53}, "Side": {"iou": 0.919, "turn_deg": -0.35}, "Back": {"iou": 0.93, "turn_deg": 0.12}, "Top": {"iou": 0.989, "turn_deg": -0.0}}}
The model's size in metres (x, y, z) and triangles: {"model": {"tris": 9236, "size": [2.18, 2.69, 1.8], "min": [-1.09, 0, -0.9]}}

Your code and the views you gave:
```json
{"objects": [{"name": "seated_figure", "size_m": [2.18, 2.68, 1.80],
  "views": [
    {"label": "Front", "box": [72, 14, 474, 508], "cam": [0, 0, 1], "up": [0, 1, 0]},
    {"label": "Side", "box": [582, 14, 912, 508], "cam": [-1, 0, 0], "up": [0, 1, 0]},
    {"label": "Back", "box": [1055, 14, 1452, 508], "cam": [0, 0, -1], "up": [0, 1, 0]},
    {"label": "Top", "box": [258, 590, 597, 934], "cam": [0, 1, 0], "up": [0, 0, -1]}
  ]}],
 "notes": "Weathered stone seated robed figure, cross-legged, right hand (-x) open palm-up, left hand (+x) resting on the knee, on a two-tier carved plinth. From the 1 m bar (~184 px) it is about 2.18 m wide, 2.68 m tall and 1.8 m deep. The side view faces right with the open hand nearest the camera, so it is the -x side (the three-quarter view contradicts this). The +x side is not drawn. The top view is drawn nearly square (about 2.2 m deep), so the side-view depth of 1.8 m was used."}

```
```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'seated_figure';
  const stone = new THREE.MeshStandardMaterial({ color: 0x87765a, roughness: 0.95, metalness: 0.0 });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const Y = V(0, 1, 0);

  function add(geo, parent) {
    const m = new THREE.Mesh(geo, stone);
    m.name = 'stone';
    (parent || root).add(m);
    return m;
  }
  function box(w, h, d, x, y, z) {
    const m = add(new THREE.BoxGeometry(w, h, d));
    m.position.set(x, y, z);
    return m;
  }
  function ell(x, y, z, rx, ry, rz, ws, hs, parent) {
    const m = add(new THREE.SphereGeometry(1, ws || 20, hs || 14), parent);
    m.position.set(x, y, z);
    m.scale.set(rx, ry, rz);
    return m;
  }
  function limb(a, b, r0, r1, seg, parent) {
    const d = b.clone().sub(a);
    const len = d.length();
    const m = add(new THREE.CylinderGeometry(r1, r0, len, seg || 12), parent);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(Y, d.normalize());
    return m;
  }

  // ---- Plinth: two tiers with a shallow groove between ----
  const W = 2.18, D = 1.80;
  box(W, 0.32, D, 0, 0.16, 0);
  box(W - 0.05, 0.04, D - 0.05, 0, 0.335, 0);
  box(W, 0.265, D, 0, 0.4825, 0); // top at 0.615

  // ---- Robed torso (lathe, flattened front-to-back) ----
  const BZ = -0.42;
  const prof = [
    [0.0, 0.60], [0.80, 0.60], [0.82, 0.74], [0.79, 0.94], [0.73, 1.14],
    [0.68, 1.34], [0.65, 1.54], [0.64, 1.70], [0.61, 1.82], [0.54, 1.92],
    [0.40, 2.00], [0.22, 2.06], [0.0, 2.08]
  ];
  const torso = add(new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 32));
  torso.position.set(0, 0, BZ);
  torso.scale.set(1, 1, 0.58);

  // ---- Neck and head ----
  limb(V(0, 1.95, BZ + 0.02), V(0, 2.20, BZ), 0.155, 0.145, 16);
  ell(0, 2.39, -0.41, 0.245, 0.30, 0.245, 24, 18);   // cranium
  ell(0, 2.22, -0.38, 0.215, 0.15, 0.205);           // heavy jaw
  ell(0, 2.36, -0.175, 0.04, 0.07, 0.05, 12, 8);     // nose
  for (const s of [-1, 1]) ell(s * 0.24, 2.38, -0.44, 0.035, 0.085, 0.055, 12, 8); // ears

  // ---- Crossed legs / lap under the robe ----
  for (const s of [-1, 1]) ell(s * 0.58, 0.88, 0.30, 0.42, 0.27, 0.45); // knees
  limb(V(-0.62, 0.76, 0.50), V(0.62, 0.76, 0.50), 0.15, 0.15, 16);       // crossed shins
  ell(0, 0.86, 0.20, 0.60, 0.20, 0.46);                                  // lap drape
  ell(0, 0.68, 0.17, 0.97, 0.10, 0.56);                                  // robe hem on plinth

  // sleeves hanging from forearms down onto the knees
  for (const s of [-1, 1]) ell(s * 0.80, 1.08, -0.16, 0.17, 0.28, 0.32);

  // ---- Hands ----
  function hand(Wp, Tp, curl) {
    const h = new THREE.Group();
    h.position.copy(Wp);
    h.lookAt(Tp);                       // local +z toward fingertips
    h.scale.setScalar(Wp.distanceTo(Tp) / 0.42);
    root.add(h);
    ell(0, 0, 0.11, 0.09, 0.035, 0.13, 16, 10, h); // palm
    const lens = [0.17, 0.19, 0.18, 0.15];
    for (let i = 0; i < 4; i++) {
      const L = lens[i];
      const a = V(-0.06 + i * 0.04, 0, 0.21);
      const b = V(a.x * 1.1, Math.sin(curl) * L, 0.21 + Math.cos(curl) * L);
      limb(a, b, 0.021, 0.017, 8, h);
    }
    // thumb (on local -x for both hands)
    limb(V(-0.07, 0, 0.05), V(-0.15, Math.sin(curl) * 0.05 + 0.01, 0.15), 0.026, 0.02, 8, h);
  }

  // ---- Arms ----
  const arms = [
    // -x: figure's right arm, open palm held out
    { S: V(-0.58, 1.84, -0.42), E: V(-0.77, 1.30, -0.24), W: V(-0.66, 1.21, 0.20), T: V(-0.94, 1.25, 0.58), curl: 0.18 },
    // +x: figure's left arm, hand resting over the knee
    { S: V(0.58, 1.84, -0.42), E: V(0.79, 1.30, -0.22), W: V(0.68, 1.25, 0.27), T: V(0.63, 1.01, 0.68), curl: -0.25 }
  ];
  for (const a of arms) {
    ell(a.S.x, a.S.y, a.S.z, 0.17, 0.17, 0.19);      // shoulder
    limb(a.S, a.E, 0.17, 0.16);                       // upper arm in sleeve
    ell(a.E.x, a.E.y, a.E.z, 0.16, 0.16, 0.16);      // elbow
    limb(a.E, a.W, 0.15, 0.115);                      // forearm in sleeve
    const dir = a.T.clone().sub(a.W).normalize();
    limb(a.W.clone().addScaledVector(dir, -0.10), a.W.clone().addScaledVector(dir, -0.01), 0.12, 0.13); // cuff
    limb(a.W.clone().addScaledVector(dir, -0.05), a.W.clone().addScaledVector(dir, 0.06), 0.075, 0.07, 10); // wrist
    hand(a.W, a.T, a.curl);
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
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 15,000.
