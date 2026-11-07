You built the 3D model below from Christopher's reference sheet G05 · Pink wading birds. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"flamingo_flying": {"bird in flight, side (facing right, wings raised)": {"iou": 0.736, "turn_deg": -0.22}, "bird in flight, top (head up the page, wings spread)": {"iou": 0.772, "turn_deg": -0.04}}, "flamingo_standing": {"standing bird, side (facing right)": {"iou": 0.566, "turn_deg": 2.0}}}
The model's size in metres (x, y, z) and triangles: {"flamingo_standing": {"tris": 1904, "size": [0.29, 1.395, 1.086], "min": [-0.145, -0.006, -0.567]}, "flamingo_flying": {"tris": 1476, "size": [1.65, 0.801, 1.612], "min": [-0.825, 0, -0.801]}}

Your code and the views you gave:
```json
{"objects": [
  {"name": "flamingo_standing", "size_m": [0.29, 1.39, 1.04],
   "views": [
     {"label": "standing bird, side (facing right)", "box": [28, 16, 401, 519], "cam": [-1, 0, 0], "up": [0, 1, 0]}
   ]},
  {"name": "flamingo_flying", "size_m": [1.65, 0.80, 1.60],
   "views": [
     {"label": "bird in flight, side (facing right, wings raised)", "box": [378, 45, 1038, 378], "cam": [-1, 0, 0], "up": [0, 1, 0]},
     {"label": "bird in flight, top (head up the page, wings spread)", "box": [1021, 16, 1525, 506], "cam": [0, 1, 0], "up": [0, 0, 1]}
   ]}
 ],
 "notes": "Greater flamingo drawn in two poses, so two models: standing (side view only) and flying with neck out and legs trailing (side and top views). The two flight views show different moments of the wingbeat. The wings are set in a ~40° V so they fill both outlines, with the wing-tip fore/aft position split between the two views, and they sit in left_wing/right_wing groups that pivot at the shoulder so they can be flapped. The scale bar makes the bird ~2.35 m tall with a 2.4 m wingspan, about 1.7x a real flamingo. I built it at real size instead (1.39 m tall, 1.65 m span) using the sheet's proportions; scale both models by 1.7 if the scale bar was meant."}

```
```js
function build(THREE) {
  const COLORS = {
    pink_feathers: 0xeec4ba,
    coral_feathers: 0xee7860,
    black_feathers: 0x2a2321,
    pink_skin: 0xc8656e,
    bill_pale: 0xe9d5c7,
    bill_black: 0x211b1b
  };
  const mats = {};
  function M(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name], roughness: 0.85, metalness: 0 });
    return mats[name];
  }
  function mk(geo, name) {
    const m = new THREE.Mesh(geo, M(name));
    m.name = name;
    return m;
  }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const UP = new THREE.Vector3(0, 1, 0);

  // put a y-axis primitive between points a and b
  function place(m, a, b) {
    const d = new THREE.Vector3().subVectors(b, a);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(UP, d.clone().normalize());
    return m;
  }
  // tapered rod: radius ra at a, rb at b
  function rod(a, b, ra, rb, name, radial, open) {
    return place(mk(new THREE.CylinderGeometry(rb, ra, a.distanceTo(b), radial, 1, open), name), a, b);
  }
  // cone with its base on a and its point on b; sx squashes across (world x), sz the other cross axis
  function cone(a, b, r, name, radial, sx, sz) {
    const m = place(mk(new THREE.ConeGeometry(r, a.distanceTo(b), radial), name), a, b);
    m.scale.set(sx || 1, 1, sz || 1);
    return m;
  }
  function ball(p, r, name, w, h) {
    const m = mk(new THREE.SphereGeometry(r, w, h), name);
    m.position.copy(p);
    return m;
  }
  function egg(p, rx, ry, rz, name, w, h) {
    const m = mk(new THREE.SphereGeometry(1, w, h), name);
    m.position.copy(p);
    m.scale.set(rx, ry, rz);
    return m;
  }
  function tube(pts, r, name, segs, radial) {
    return mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segs, r, radial, false), name);
  }
  // flat plate from an outline [across, forward] lying in local XZ (forward = +z), centred on local y = 0
  function plate(pts, thick, sign, name) {
    const sh = new THREE.Shape();
    pts.forEach((p, i) => { if (i === 0) sh.moveTo(p[0] * sign, p[1]); else sh.lineTo(p[0] * sign, p[1]); });
    const m = mk(new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false, curveSegments: 1 }), name);
    m.rotation.x = Math.PI / 2;
    m.position.y = thick / 2;
    return m;
  }

  // ---------------- standing bird (side view, head toward +z) ----------------
  function standing() {
    const g = new THREE.Group();
    g.name = 'flamingo_standing';

    // body
    g.add(egg(V(0, 0.803, 0.02), 0.13, 0.212, 0.335, 'pink_feathers', 16, 12));
    // folded wings (coral coverts) along the flanks
    for (const s of [-1, 1]) {
      const w = egg(V(0.105 * s, 0.826, -0.098), 0.04, 0.12, 0.27, 'coral_feathers', 12, 8);
      w.rotation.x = -0.12;
      g.add(w);
    }
    // drooping black primaries / tail point
    g.add(cone(V(0, 0.80, -0.20), V(0, 0.686, -0.516), 0.15, 'black_feathers', 12, 0.45, 1));

    // S-shaped neck
    g.add(tube([
      V(0, 1.328, 0.371), V(0, 1.333, 0.298), V(0, 1.272, 0.248), V(0, 1.166, 0.237),
      V(0, 1.068, 0.265), V(0, 0.971, 0.31), V(0, 0.887, 0.321), V(0, 0.809, 0.293)
    ], 0.034, 'pink_feathers', 24, 8));
    // thickening of the lower neck into the chest
    g.add(rod(V(0, 0.99, 0.30), V(0, 0.79, 0.31), 0.03, 0.08, 'pink_feathers', 10, true));

    // head and bent bill
    g.add(egg(V(0, 1.342, 0.377), 0.034, 0.047, 0.058, 'pink_feathers', 12, 10));
    const b1 = rod(V(0, 1.33, 0.395), V(0, 1.285, 0.494), 0.032, 0.025, 'bill_pale', 10, true);
    b1.scale.x = 0.75; g.add(b1);
    g.add(egg(V(0, 1.285, 0.494), 0.019, 0.025, 0.025, 'bill_black', 8, 6));
    const b2 = rod(V(0, 1.285, 0.494), V(0, 1.168, 0.477), 0.024, 0.007, 'bill_black', 10, false);
    b2.scale.x = 0.75; g.add(b2);

    // legs and webbed feet
    const legs = [
      { x: 0.048, hip: V(0.048, 0.686, -0.053), knee: V(0.048, 0.351, -0.081), ank: V(0.048, 0.045, -0.148), toe: 0.12 },
      { x: -0.048, hip: V(-0.048, 0.678, 0.003), knee: V(-0.048, 0.34, -0.006), ank: V(-0.048, 0.05, 0.031), toe: 0.16 }
    ];
    for (const L of legs) {
      g.add(rod(L.hip, L.knee, 0.015, 0.011, 'pink_skin', 8, true));
      g.add(ball(L.knee, 0.017, 'pink_skin', 8, 6));
      g.add(rod(L.knee, L.ank, 0.0105, 0.0095, 'pink_skin', 8, true));
      g.add(ball(L.ank, 0.013, 'pink_skin', 6, 4));
      const root = V(L.x, 0.026, L.ank.z + 0.006);
      for (const a of [-0.38, 0, 0.38]) {
        const len = a ? L.toe * 0.85 : L.toe;
        g.add(cone(root, V(L.x + Math.sin(a) * len, 0.004, root.z + Math.cos(a) * len), 0.008, 'pink_skin', 6));
      }
      g.add(cone(root, V(L.x, 0.004, root.z - 0.045), 0.006, 'pink_skin', 6));
      const t = L.toe;
      const web = plate([[0, -0.006], [-0.315 * t, 0.79 * t], [-0.15 * t, 0.8 * t], [0, 0.95 * t],
        [0.15 * t, 0.8 * t], [0.315 * t, 0.79 * t]], 0.003, 1, 'pink_skin');
      web.position.set(L.x, 0.003, root.z);
      g.add(web);
    }
    return g;
  }

  // ---------------- flying bird (neck out, legs trailing, wings in upstroke V) ----------------
  function flying() {
    const g = new THREE.Group();
    g.name = 'flamingo_flying';

    // body: lathe along z
    const prof = [[0, -0.275], [0.03, -0.25], [0.052, -0.2], [0.072, -0.13], [0.086, -0.05], [0.09, 0.03],
      [0.086, 0.11], [0.074, 0.18], [0.058, 0.235], [0.042, 0.275], [0.03, 0.3], [0, 0.31]]
      .map(p => new THREE.Vector2(p[0], p[1]));
    const body = mk(new THREE.LatheGeometry(prof, 16), 'pink_feathers');
    body.position.set(0, 0.09, 0);
    body.rotation.x = Math.PI / 2;
    body.scale.set(1.1, 1, 1);
    g.add(body);
    // tail fan
    g.add(cone(V(0, 0.105, -0.17), V(0, 0.118, -0.32), 0.05, 'pink_feathers', 10, 1.4, 0.35));

    // outstretched neck
    g.add(tube([V(0, 0.098, 0.25), V(0, 0.104, 0.36), V(0, 0.114, 0.47), V(0, 0.13, 0.58),
      V(0, 0.146, 0.66), V(0, 0.153, 0.70)], 0.023, 'pink_feathers', 16, 8));
    g.add(rod(V(0, 0.094, 0.21), V(0, 0.104, 0.37), 0.055, 0.02, 'pink_feathers', 10, true));

    // head and bill
    g.add(egg(V(0, 0.153, 0.69), 0.028, 0.036, 0.05, 'pink_feathers', 12, 8));
    const b1 = rod(V(0, 0.148, 0.705), V(0, 0.136, 0.772), 0.021, 0.017, 'bill_pale', 10, true);
    b1.scale.x = 0.75; g.add(b1);
    g.add(egg(V(0, 0.136, 0.772), 0.013, 0.017, 0.017, 'bill_black', 8, 6));
    const b2 = rod(V(0, 0.136, 0.772), V(0, 0.062, 0.795), 0.016, 0.004, 'bill_black', 10, false);
    b2.scale.x = 0.75; g.add(b2);

    // trailing legs with folded feet
    for (const s of [-1, 1]) {
      const hip = V(0.026 * s, 0.072, -0.06), knee = V(0.026 * s, 0.066, -0.40), ank = V(0.023 * s, 0.056, -0.665);
      g.add(rod(hip, knee, 0.014, 0.012, 'pink_skin', 8, true));
      g.add(ball(knee, 0.015, 'pink_skin', 8, 5));
      g.add(rod(knee, ank, 0.0105, 0.009, 'pink_skin', 8, true));
      g.add(cone(ank, V(0.02 * s, 0.045, -0.80), 0.022, 'pink_skin', 8, 1.2, 0.45));
    }

    // wings: outline in [span from shoulder, z]; black flight feathers + coral coverts on top/bottom
    const WING_BLACK = [
      [-0.03, 0.18], [0.15, 0.185], [0.36, 0.172], [0.51, 0.155], [0.66, 0.13], [0.79, 0.097],
      [0.89, 0.05], [0.95, 0.008], [0.985, -0.03], [1.0, -0.068],
      [0.99, -0.098], [0.962, -0.118], [0.932, -0.115], [0.905, -0.135], [0.872, -0.13], [0.84, -0.148],
      [0.80, -0.142], [0.76, -0.158], [0.715, -0.152], [0.655, -0.166], [0.575, -0.166], [0.47, -0.178],
      [0.35, -0.186], [0.22, -0.195], [0.09, -0.204], [-0.03, -0.2]
    ];
    const WING_CORAL = [
      [-0.03, 0.183], [0.15, 0.188], [0.36, 0.175], [0.51, 0.158], [0.6, 0.143], [0.645, 0.115],
      [0.63, 0.06], [0.57, 0.02], [0.47, -0.01], [0.34, -0.03], [0.2, -0.045], [0.08, -0.052], [-0.03, -0.052]
    ];
    for (const s of [-1, 1]) {
      const w = new THREE.Group();
      w.name = s < 0 ? 'right_wing' : 'left_wing';
      w.add(plate(WING_BLACK, 0.012, s, 'black_feathers'));
      w.add(plate(WING_CORAL, 0.022, s, 'coral_feathers'));
      w.position.set(0.05 * s, 0.16, 0);
      w.rotation.z = 0.69 * s; // ~40 degree upstroke V
      g.add(w);
    }
    return g;
  }

  return { flamingo_standing: standing(), flamingo_flying: flying() };
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that), and any flat view
on the sheet that's missing from the list (both sides when both are drawn: a face no view shows is painted by a guess). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 4,000.
