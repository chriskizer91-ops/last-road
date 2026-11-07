You built the 3D model below from Christopher's reference sheet B19 · The station stock yards. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"model": {"Top": {"iou": 0.975, "turn_deg": -0.28}, "Front": {"iou": 0.568, "turn_deg": 0.0}, "Back": {"iou": 0.568, "turn_deg": -0.0}, "Side": {"iou": 0.656, "turn_deg": 0.01}}}
The model's size in metres (x, y, z) and triangles: {"model": {"tris": 10164, "size": [14.1, 2.057, 12.18], "min": [-7.05, -0.007, -6.08]}}

Your code and the views you gave:
```json
{
  "objects": [
    {
      "name": "stock_yards",
      "size_m": [14.1, 2.05, 12.18],
      "views": [
        {"label": "Top", "box": [24, 11, 699, 592], "cam": [0, 1, 0], "up": [0, 0, -1]},
        {"label": "Front", "box": [18, 637, 771, 756], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Back", "box": [27, 831, 773, 946], "cam": [0, 0, -1], "up": [0, 1, 0]},
        {"label": "Side", "box": [840, 637, 1511, 756], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "Side", "box": [845, 831, 1479, 946], "cam": [-1, 0, 0], "up": [0, 1, 0]}
      ]
    }
  ],
  "notes": "Station cattle yards. A red-dirt yard about 13.6 x 10 m, fenced with timber posts and 5 pipe rails (about 1.33 m high), with three pens. It also has a round yard (about 4.9 m across), a curved race into a steel crush, and a timber loading ramp with a 2.05 m head frame that runs out the front-right (+x, +z). Scale bar is about 55 px/m on the elevations; the top view is drawn at about 0.87 of that. The back view puts the ramp about 1 m further toward -x than the top and front views; I followed top and front. The top view draws the ramp wide and skewed; I modelled it as a straight 1 m ramp on a dirt apron that fills the drawn footprint."
}

```
```js
function build(THREE) {
  const g = new THREE.Group();
  g.name = 'stock_yards';

  const COLORS = {
    red_dirt: 0x9b5d3b,
    weathered_timber: 0x8b8579,
    galvanised_pipe: 0xa6a6a1,
    rusty_iron: 0x8b4b33,
    dark_steel: 0x4b4845,
    timber: 0x8a7a64,
    concrete: 0xb7b4a5,
    water: 0x6c6a47
  };
  const mats = {};
  function m(name) {
    if (!mats[name]) {
      mats[name] = new THREE.MeshStandardMaterial({
        color: COLORS[name],
        roughness: 0.9,
        metalness: (name === 'galvanised_pipe' || name === 'dark_steel') ? 0.3 : 0.0
      });
    }
    return mats[name];
  }
  function add(geo, name, x, y, z) {
    const mesh = new THREE.Mesh(geo, m(name));
    mesh.name = name;
    mesh.position.set(x, y, z);
    g.add(mesh);
    return mesh;
  }
  function box(name, w, h, d, x, y, z) {
    return add(new THREE.BoxGeometry(w, h, d), name, x, y, z);
  }
  const UP = new THREE.Vector3(0, 1, 0);
  function rod(name, a, b, r, seg) {
    const va = new THREE.Vector3(a[0], a[1], a[2]);
    const vb = new THREE.Vector3(b[0], b[1], b[2]);
    const dir = new THREE.Vector3().subVectors(vb, va);
    const len = dir.length();
    const mesh = add(new THREE.CylinderGeometry(r, r, len, seg || 6, 1, false), name,
      (va.x + vb.x) / 2, (va.y + vb.y) / 2, (va.z + vb.z) / 2);
    mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
    return mesh;
  }

  // ---------- ground: dirt yard floor + apron under the ramp ----------
  box('red_dirt', 14.1, 0.04, 10.53, 0, 0.02, -0.815);   // z -6.08 .. 4.45
  box('red_dirt', 3.4, 0.04, 1.65, 4.5, 0.02, 5.275);    // x 2.8..6.2, z 4.45..6.1

  // ---------- fences ----------
  const XB = -6.8, XR = 6.8, ZB = -5.85, ZF = 4.19;
  const RH = [0.22, 0.47, 0.72, 0.97, 1.2];

  const postGeo = new THREE.CylinderGeometry(0.09, 0.105, 1.33, 8);
  const seen = {};
  function post(x, z) {
    const k = x.toFixed(2) + '_' + z.toFixed(2);
    if (seen[k]) return;
    seen[k] = 1;
    add(postGeo, 'weathered_timber', x, 0.665, z);
  }
  function rails(x1, z1, x2, z2) {
    RH.forEach(h => rod('galvanised_pipe', [x1, h, z1], [x2, h, z2], 0.032, 6));
  }
  function gate(x1, z1, x2, z2) {
    const dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz);
    const ux = dx / L, uz = dz / L, inset = 0.14;
    const ax = x1 + ux * inset, az = z1 + uz * inset;
    const bx = x2 - ux * inset, bz = z2 - uz * inset;
    RH.forEach(h => rod('rusty_iron', [ax, h, az], [bx, h, bz], 0.028, 6));
    rod('rusty_iron', [ax, 0.12, az], [ax, 1.24, az], 0.035, 6);
    rod('rusty_iron', [bx, 0.12, bz], [bx, 1.24, bz], 0.035, 6);
    rod('rusty_iron', [ax, 0.22, az], [bx, 1.2, bz], 0.025, 6);
  }

  // posts
  [-6.8, -4.3, -2.05, -0.3, 1.64, 3.42, 5.0, 6.8].forEach(x => post(x, ZB));
  [-6.8, -4.7, -1.76, 0.17, 1.65, 3.1, 6.8].forEach(x => post(x, ZF));
  [-3.9, -2.05, -0.22, 2.0].forEach(z => post(XB, z));
  [-4.55, -3.27, -2.0, -0.7, 0.9, 2.5].forEach(z => post(XR, z));
  [-4.0, -2.3, -0.64].forEach(z => post(1.64, z));
  [-4.8, -3.3].forEach(x => post(x, -0.22));
  [-0.1].forEach(x => post(x, -0.64));
  [-0.64, -0.22, 1.2, 2.7].forEach(z => post(-1.76, z));

  // outer fence
  rails(XB, ZB, -2.05, ZB); gate(-2.05, ZB, -0.3, ZB); rails(-0.3, ZB, XR, ZB);          // back
  rails(XB, ZF, -1.76, ZF); gate(-1.76, ZF, 0.17, ZF); rails(0.17, ZF, 4.86, ZF);        // front
  rails(5.84, ZF, XR, ZF);
  rails(XB, ZB, XB, -2.05); gate(XB, -2.05, XB, -0.22); rails(XB, -0.22, XB, ZF);        // left
  rails(XR, ZB, XR, ZF);                                                                  // right
  // internal dividers
  rails(1.64, ZB, 1.64, -0.64);
  rails(XB, -0.22, -1.76, -0.22);
  rails(-1.76, -0.64, 1.64, -0.64);
  rails(-1.76, -0.64, -1.76, ZF);

  // ---------- round yard ----------
  const RC = [4.2, -3.245], RR = 2.46;
  RH.forEach(h => {
    const t = add(new THREE.TorusGeometry(RR, 0.032, 5, 56), 'galvanised_pipe', RC[0], h, RC[1]);
    t.rotation.x = Math.PI / 2;
  });
  const spGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.3, 6);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2 + 0.13;
    add(spGeo, 'galvanised_pipe', RC[0] + Math.cos(a) * RR, 0.65, RC[1] + Math.sin(a) * RR);
  }

  // ---------- curved race ----------
  const laneL = [[1.64, -0.64], [2.69, -0.81], [3.63, -0.68], [4.37, -0.33], [4.79, 0.24], [4.88, 0.85], [4.88, 1.2]];
  const laneR = [[5.0, -0.95], [5.38, -0.64], [5.59, 0.0], [5.76, 0.6], [5.82, 1.2]];
  [laneL, laneR].forEach(pts => {
    RH.forEach(h => {
      const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], h, p[1])));
      add(new THREE.TubeGeometry(curve, 28, 0.032, 5, false), 'galvanised_pipe', 0, 0, 0);
    });
  });
  laneL.slice(1, -1).concat(laneR.slice(0, -1)).forEach(p => add(spGeo, 'galvanised_pipe', p[0], 0.65, p[1]));

  // ---------- steel crush ----------
  const CX1 = 4.88, CX2 = 5.82, CZ0 = 1.2, CZ1 = 2.25, CZ2 = 3.3;
  [CX1, CX2].forEach(x => {
    [CZ0, CZ1].forEach(z => box('dark_steel', 0.08, 1.55, 0.08, x, 0.775, z));
    box('rusty_iron', 0.03, 0.85, CZ1 - CZ0, x, 0.55, (CZ0 + CZ1) / 2);
    [1.2, 1.5].forEach(h => rod('dark_steel', [x, h, CZ0], [x, h, CZ2], 0.03, 6));
    rod('dark_steel', [x, 0.12, CZ1], [x, 0.12, CZ2], 0.03, 6);
    for (let i = 0; i < 5; i++) {
      const z = CZ1 + (i + 0.5) * (CZ2 - CZ1) / 5;
      rod('dark_steel', [x, 0.12, z], [x, 1.5, z], 0.02, 6);
    }
  });
  [CZ0, CZ1].forEach(z => box('dark_steel', CX2 - CX1 + 0.08, 0.06, 0.06, (CX1 + CX2) / 2, 1.55, z));

  // ---------- ramp head frame + platform ----------
  const HX1 = 4.86, HX2 = 5.84, HZ1 = 3.3, HZ2 = ZF;
  const HMX = (HX1 + HX2) / 2, HMZ = (HZ1 + HZ2) / 2, HL = HZ2 - HZ1;
  [HX1, HX2].forEach(x => [HZ1, HZ2].forEach(z => box('weathered_timber', 0.15, 2.05, 0.15, x, 1.025, z)));
  [HX1, HX2].forEach(x => {
    [1.3, 1.6, 1.9].forEach(h => box('weathered_timber', 0.05, 0.12, HL, x, h, HMZ));
    box('timber', 0.04, 0.87, HL, x + (x < HMX ? 0.05 : -0.05), 0.435, HMZ);
  });
  [HZ1, HZ2].forEach(z => {
    box('weathered_timber', HX2 - HX1 + 0.15, 0.12, 0.12, HMX, 1.99, z);
    box('weathered_timber', HX2 - HX1, 0.1, 0.06, HMX, 1.76, z);
  });
  box('timber', HX2 - HX1 - 0.02, 0.08, HL, HMX, 0.91, HMZ);

  // ---------- loading ramp (slopes down toward +z) ----------
  const RZ0 = ZF, RZ1 = 6.0, RY0 = 0.95, RY1 = 0.05;
  const th = Math.atan2(RY0 - RY1, RZ1 - RZ0);
  const RLen = Math.hypot(RZ1 - RZ0, RY0 - RY1);
  const rmz = (RZ0 + RZ1) / 2, rmy = (RY0 + RY1) / 2;
  const deck = box('timber', 0.98, 0.06, RLen, HMX, rmy - 0.03, rmz);
  deck.rotation.x = th;
  [HX1, HX2].forEach(x => [0.35, 0.65, 0.98].forEach(off => {
    const b = box('timber', 0.05, 0.14, RLen, x, rmy + off, rmz);
    b.rotation.x = th;
  }));
  [[5.1, 1.6], [5.95, 1.4]].forEach(([z, h]) => {
    [HX1 - 0.06, HX2 + 0.06].forEach(x => box('timber', 0.12, h, 0.12, x, h / 2, z));
  });
  box('timber', HX2 - HX1 + 0.24, 0.1, 0.1, HMX, 0.37, 5.1);

  // ---------- water trough by the back fence ----------
  const TX = -3.195, TZ = -5.105, TW = 1.89, TD = 0.65, TH = 0.5;
  box('concrete', TW, 0.12, TD, TX, 0.06, TZ);
  [-1, 1].forEach(s => box('concrete', TW, TH, 0.07, TX, TH / 2, TZ + s * (TD / 2 - 0.035)));
  [-1, 1].forEach(s => box('concrete', 0.07, TH, TD - 0.14, TX + s * (TW / 2 - 0.035), TH / 2, TZ));
  box('water', TW - 0.14, 0.03, TD - 0.14, TX, 0.38, TZ);

  return g;
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that), and any flat view
on the sheet that's missing from the list (both sides when both are drawn: a face no view shows is painted by a guess). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 20,000.
