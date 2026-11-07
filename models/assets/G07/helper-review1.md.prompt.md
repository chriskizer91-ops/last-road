You built the 3D model below from Christopher's reference sheet G07 · Wild camel. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"camel_adult": {"side, standing (top left, head to the left)": {"iou": 0.603, "turn_deg": 4.26}, "front, standing (top right, larger animal)": {"iou": 0.751, "turn_deg": 1.17}}, "camel_calf": {"side, standing (top left, small animal under the adult's neck)": {"iou": 0.644, "turn_deg": 4.04}, "front, standing (top right, smaller animal)": {"iou": 0.77, "turn_deg": 0.81}}}
The model's size in metres (x, y, z) and triangles: {"camel_adult": {"tris": 3904, "size": [0.909, 2.234, 3.45], "min": [-0.455, 0, -1.718]}, "camel_calf": {"tris": 1650, "size": [0.347, 1.155, 1.177], "min": [-0.173, 0, -0.585]}}

Your code and the views you gave:
```json
{
  "objects": [
    {
      "name": "camel_adult",
      "size_m": [0.88, 2.25, 3.42],
      "views": [
        {"label": "side, standing (top left, head to the left)", "box": [157, 14, 908, 508], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "front, standing (top right, larger animal)", "box": [1126, 14, 1318, 508], "cam": [0, 0, 1], "up": [0, 1, 0]}
      ]
    },
    {
      "name": "camel_calf",
      "size_m": [0.35, 1.15, 1.17],
      "views": [
        {"label": "side, standing (top left, small animal under the adult's neck)", "box": [178, 257, 434, 508], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "front, standing (top right, smaller animal)", "box": [1340, 236, 1423, 508], "cam": [0, 0, 1], "up": [0, 1, 0]}
      ]
    }
  ],
  "notes": "A one-humped (dromedary-type) camel with its calf, both standing. The bottom-row walking drawings show a different pose, so they are left out. The scale bars disagree with each other (the vertical bar is non-linear, and the 178 px/m horizontal bar would make the camel 4.2 m long), so I used about 219 px/m, matching the bar's 2.2 m mark at the hump top: adult about 2.25 m tall and 3.4 m long, calf about 1.15 m tall. The calf's front drawing is about 8% taller than its side drawing."
}

```
```js
function build(THREE) {
  const UP = new THREE.Vector3(0, 1, 0);
  const cache = {};
  function mat(name, color) {
    if (!cache[name]) cache[name] = new THREE.MeshStandardMaterial({ color: color, roughness: 0.95, metalness: 0.0 });
    return cache[name];
  }

  // Generic camel builder. All shape data is given in SIDE-VIEW sheet pixels (px, py),
  // with lateral offsets (x) given directly in metres.
  function makeCamel(c) {
    const g = new THREE.Group();
    g.name = c.name;
    const S = c.S;
    const P = (px, py, lat) => new THREE.Vector3(lat || 0, (c.ground - py) * S, (c.cx - px) * S);

    function mesh(geo, key) {
      const def = c.mats[key];
      const m = new THREE.Mesh(geo, mat(def[0], def[1]));
      m.name = def[0];
      g.add(m);
      return m;
    }
    // e = [px, py, lat_m, halfLenZ_px, halfH_px, halfW_px, tiltX]
    function ellipsoid(key, e, ws, hs) {
      const m = mesh(new THREE.SphereGeometry(1, ws, hs), key);
      m.position.copy(P(e[0], e[1], e[2]));
      m.scale.set(e[5] * S, e[4] * S, e[3] * S);
      m.rotation.x = e[6] || 0;
    }
    function between(m, a, b) {
      const d = new THREE.Vector3().subVectors(b, a);
      m.position.copy(a).addScaledVector(d, 0.5);
      m.quaternion.setFromUnitVectors(UP, d.normalize());
    }
    // tapered open cylinders between points, ball joints at the inner points
    function chain(key, pts, radii, rs, joint) {
      const v = pts.map(p => P(p[0], p[1], p[2]));
      for (let i = 0; i < v.length - 1; i++) {
        const len = v[i].distanceTo(v[i + 1]);
        const m = mesh(new THREE.CylinderGeometry(radii[i + 1] * S, radii[i] * S, len, rs, 1, true), key);
        between(m, v[i], v[i + 1]);
        if (i > 0 && joint) {
          const b = mesh(new THREE.SphereGeometry(radii[i] * S, joint[0], joint[1]), key);
          b.position.copy(v[i]);
        }
      }
    }
    function cone(key, base, tip, r, rs) {
      const a = P(base[0], base[1], base[2]);
      const b = P(tip[0], tip[1], tip[2]);
      const m = mesh(new THREE.ConeGeometry(r * S, a.distanceTo(b), rs), key);
      between(m, a, b);
    }

    c.parts.forEach(p => ellipsoid(p[0], p[1], p[2], p[3]));
    c.chains.forEach(ch => chain(ch[0], ch[1], ch[2], ch[3], ch[4]));
    c.cones.forEach(k => cone(k[0], k[1], k[2], k[3], k[4]));
    return g;
  }

  // ---------------- ADULT ----------------
  const adult = makeCamel({
    name: 'camel_adult',
    S: 0.00456, cx: 532.5, ground: 507,
    mats: {
      hide: ['camel_hide', 0xA57A4E],
      hair: ['shaggy_hair', 0x7B5535],
      leg: ['leg_hide', 0xB38B62],
      pad: ['foot_pad', 0x8A7360]
    },
    parts: [
      ['hide', [680, 245, 0, 200, 95, 92, 0], 16, 12],     // barrel
      ['hide', [680, 135, 0, 155, 118, 75, 0], 16, 12],    // hump
      ['hide', [535, 175, 0, 50, 70, 70, 0], 12, 8],       // withers / shoulder
      ['hide', [505, 270, 0, 45, 55, 78, 0], 12, 8],       // chest
      ['hide', [835, 200, 0, 50, 65, 72, 0], 12, 8],       // rump
      ['hide', [268, 108, 0, 42, 27, 33, 0], 12, 8],       // cranium
      ['hide', [200, 123, 0, 45, 17, 21, 0.16], 12, 8],    // muzzle
      ['hide', [240, 142, 0, 45, 13, 25, -0.12], 10, 6],   // jaw / cheeks
      ['hair', [345, 198, 0, 80, 26, 17, -0.70], 10, 6],   // shaggy throat beard
      ['hair', [892, 298, 0, 10, 42, 11, 0.18], 8, 6],     // tail tuft
      // foot pads (bottoms on y = 0)
      ['pad', [553, 496, 0.185, 30, 11, 28, 0], 10, 6],
      ['pad', [509, 496, -0.185, 30, 11, 28, 0], 10, 6],
      ['pad', [858, 496, 0.155, 30, 11, 26, 0], 10, 6],
      ['pad', [778, 496, -0.155, 30, 11, 26, 0], 10, 6]
    ],
    chains: [
      // neck: head -> chest
      ['hide', [[300, 128, 0], [345, 170, 0], [400, 212, 0], [450, 252, 0], [500, 262, 0]], [26, 28, 29, 33, 46], 10, [10, 6]],
      // tail
      ['hide', [[872, 165, 0], [886, 205, 0], [894, 262, 0]], [10, 8, 7], 6, [6, 4]],
      // front legs: top, elbow, knee, fetlock, pastern
      ['leg', [[530, 265, 0.19], [526, 330, 0.185], [540, 384, 0.18], [546, 468, 0.18], [552, 488, 0.185]], [34, 24, 19, 14, 12], 8, [8, 6]],
      ['leg', [[510, 265, -0.19], [506, 330, -0.185], [512, 384, -0.18], [512, 468, -0.18], [510, 488, -0.185]], [34, 24, 19, 14, 12], 8, [8, 6]],
      // hind legs: hip, stifle, hock, fetlock, pastern
      ['leg', [[820, 215, 0.21], [803, 300, 0.20], [842, 400, 0.15], [848, 470, 0.15], [854, 488, 0.155]], [44, 27, 17, 13, 12], 8, [8, 6]],
      ['leg', [[795, 215, -0.21], [778, 300, -0.20], [790, 400, -0.15], [785, 470, -0.15], [780, 488, -0.155]], [44, 27, 17, 13, 12], 8, [8, 6]]
    ],
    cones: [
      ['hide', [285, 95, 0.09], [296, 74, 0.145], 7, 6],
      ['hide', [285, 95, -0.09], [296, 74, -0.145], 7, 6]
    ]
  });

  // ---------------- CALF ----------------
  const calf = makeCamel({
    name: 'camel_calf',
    S: 0.00456, cx: 306, ground: 507,
    mats: {
      hide: ['calf_fur', 0xB8916A],
      leg: ['calf_leg', 0xC09C74],
      pad: ['foot_pad', 0x8A7360]
    },
    parts: [
      ['hide', [362, 335, 0, 68, 45, 38, 0], 12, 8],       // barrel
      ['hide', [355, 305, 0, 45, 20, 26, 0], 10, 6],       // small back hump
      ['hide', [300, 335, 0, 22, 30, 30, 0], 8, 6],        // chest
      ['hide', [413, 320, 0, 20, 30, 30, 0], 8, 6],        // rump
      ['hide', [230, 276, 0, 20, 15, 18, 0], 10, 6],       // cranium
      ['hide', [200, 288, 0, 22, 10, 12, 0.25], 8, 6],     // muzzle
      ['hide', [216, 296, 0, 20, 8, 13, -0.1], 8, 4],      // jaw
      ['hide', [429, 352, 0, 4, 12, 5, 0.15], 6, 4],       // tail tuft
      // foot pads
      ['pad', [312, 500, 0.088, 13, 7, 12, 0], 8, 4],
      ['pad', [288, 500, -0.088, 13, 7, 12, 0], 8, 4],
      ['pad', [421, 500, 0.078, 13, 7, 11, 0], 8, 4],
      ['pad', [399, 500, -0.078, 13, 7, 11, 0], 8, 4]
    ],
    chains: [
      // neck
      ['hide', [[248, 284, 0], [270, 303, 0], [294, 326, 0]], [14, 16, 20], 8, [8, 6]],
      // tail
      ['hide', [[426, 318, 0], [429, 342, 0]], [5, 4], 5, null],
      // front legs
      ['leg', [[305, 345, 0.085], [305, 375, 0.085], [310, 425, 0.085], [312, 480, 0.085], [312, 492, 0.088]], [14, 11, 9, 7, 6], 6, [6, 4]],
      ['leg', [[290, 345, -0.085], [290, 375, -0.085], [292, 425, -0.085], [290, 480, -0.085], [288, 492, -0.088]], [14, 11, 9, 7, 6], 6, [6, 4]],
      // hind legs
      ['leg', [[405, 335, 0.08], [400, 385, 0.08], [418, 435, 0.075], [420, 482, 0.075], [421, 492, 0.078]], [18, 12, 9, 7, 6], 6, [6, 4]],
      ['leg', [[390, 335, -0.08], [386, 385, -0.08], [400, 435, -0.075], [400, 482, -0.075], [399, 492, -0.078]], [18, 12, 9, 7, 6], 6, [6, 4]]
    ],
    cones: [
      ['hide', [240, 267, 0.045], [246, 257, 0.065], 4, 5],
      ['hide', [240, 267, -0.045], [246, 257, -0.065], 4, 5]
    ]
  });

  return { camel_adult: adult, camel_calf: calf };
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that), and any flat view
on the sheet that's missing from the list (both sides when both are drawn: a face no view shows is painted by a guess). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 6,000.
