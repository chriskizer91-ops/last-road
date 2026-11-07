**What's wrong:**
- **Adult barrel hangs too low.** Its bottom is at about 0.76 m. The sheet's belly runs at roughly 0.9–0.95 m, level with the stifle bump and the elbow above the knee calluses.
  - In both the side and front renders, the whole lower barrel is unpainted (white). It projects outside the sheet's outline.
  - Its widest lower part also sticks out beside the legs in the front view, where the sheet narrows into the legs at about 1.0–1.1 m.
  - This costs overlap in the side view (0.60) and the front view.
- **Adult legs and neck follow the old body.** The front-leg elbows (about 0.8 m) and hind stifles sit too low. The chest bulge and neck base also sag below the sheet's brisket.
- **Calf has the same fault, smaller.** Its barrel reaches about 0.58 m, against a sheet belly of about 0.70 m. The renders show the same white underside.
- **No view changes needed.** Views, boxes and cameras are right. Head +z, +x is the drawn left side, and the walking poses are correctly left out.
- **Fix:** raise and slightly shorten both barrels, lift the chests and neck bases, move the elbows and stifles up, and slim the adult's leg tops. Part and segment counts are unchanged, so the triangle count stays about 5,550.

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
      ['hide', [680, 218, 0, 195, 88, 90, 0], 16, 12],     // barrel (belly ~0.92 m)
      ['hide', [680, 135, 0, 155, 118, 75, 0], 16, 12],    // hump
      ['hide', [535, 172, 0, 50, 68, 70, 0], 12, 8],       // withers / shoulder
      ['hide', [510, 238, 0, 42, 44, 74, 0], 12, 8],       // chest / brisket
      ['hide', [835, 198, 0, 50, 62, 72, 0], 12, 8],       // rump
      ['hide', [268, 108, 0, 42, 27, 33, 0], 12, 8],       // cranium
      ['hide', [200, 123, 0, 45, 17, 21, 0.16], 12, 8],    // muzzle
      ['hide', [240, 142, 0, 45, 13, 25, -0.12], 10, 6],   // jaw / cheeks
      ['hair', [345, 196, 0, 80, 26, 17, -0.70], 10, 6],   // shaggy throat beard
      ['hair', [892, 298, 0, 10, 42, 11, 0.18], 8, 6],     // tail tuft
      // foot pads (bottoms on y = 0)
      ['pad', [553, 496, 0.185, 30, 11, 28, 0], 10, 6],
      ['pad', [509, 496, -0.185, 30, 11, 28, 0], 10, 6],
      ['pad', [858, 496, 0.155, 30, 11, 26, 0], 10, 6],
      ['pad', [778, 496, -0.155, 30, 11, 26, 0], 10, 6]
    ],
    chains: [
      // neck: head -> chest
      ['hide', [[300, 128, 0], [345, 168, 0], [400, 205, 0], [450, 236, 0], [500, 244, 0]], [26, 28, 29, 32, 42], 10, [10, 6]],
      // tail
      ['hide', [[872, 165, 0], [886, 205, 0], [894, 262, 0]], [10, 8, 7], 6, [6, 4]],
      // front legs: top, elbow, knee, fetlock, pastern
      ['leg', [[530, 248, 0.18], [528, 292, 0.18], [540, 384, 0.18], [546, 468, 0.18], [552, 488, 0.185]], [30, 24, 19, 14, 12], 8, [8, 6]],
      ['leg', [[510, 248, -0.18], [508, 292, -0.18], [512, 384, -0.18], [512, 468, -0.18], [510, 488, -0.185]], [30, 24, 19, 14, 12], 8, [8, 6]],
      // hind legs: hip, stifle, hock, fetlock, pastern
      ['leg', [[820, 205, 0.21], [801, 276, 0.20], [842, 400, 0.15], [848, 470, 0.15], [854, 488, 0.155]], [42, 27, 17, 13, 12], 8, [8, 6]],
      ['leg', [[795, 205, -0.21], [776, 276, -0.20], [790, 400, -0.15], [785, 470, -0.15], [780, 488, -0.155]], [42, 27, 17, 13, 12], 8, [8, 6]]
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
      ['hide', [362, 318, 0, 66, 36, 37, 0], 12, 8],       // barrel (belly ~0.70 m)
      ['hide', [355, 302, 0, 45, 18, 26, 0], 10, 6],       // small back hump
      ['hide', [300, 330, 0, 22, 25, 29, 0], 8, 6],        // chest
      ['hide', [413, 315, 0, 20, 28, 29, 0], 8, 6],        // rump
      ['hide', [230, 276, 0, 20, 15, 18, 0], 10, 6],       // cranium
      ['hide', [200, 288, 0, 22, 10, 12, 0.25], 8, 6],     // muzzle
      ['hide', [216, 296, 0, 20, 8, 13, -0.1], 8, 4],      // jaw
      ['hide', [429, 350, 0, 4, 12, 5, 0.15], 6, 4],       // tail tuft
      // foot pads
      ['pad', [312, 500, 0.088, 13, 7, 12, 0], 8, 4],
      ['pad', [288, 500, -0.088, 13, 7, 12, 0], 8, 4],
      ['pad', [421, 500, 0.078, 13, 7, 11, 0], 8, 4],
      ['pad', [399, 500, -0.078, 13, 7, 11, 0], 8, 4]
    ],
    chains: [
      // neck
      ['hide', [[248, 284, 0], [270, 302, 0], [294, 322, 0]], [14, 16, 19], 8, [8, 6]],
      // tail
      ['hide', [[426, 316, 0], [429, 340, 0]], [5, 4], 5, null],
      // front legs
      ['leg', [[305, 338, 0.085], [305, 366, 0.085], [310, 425, 0.085], [312, 480, 0.085], [312, 492, 0.088]], [13, 11, 9, 7, 6], 6, [6, 4]],
      ['leg', [[290, 338, -0.085], [290, 366, -0.085], [292, 425, -0.085], [290, 480, -0.085], [288, 492, -0.088]], [13, 11, 9, 7, 6], 6, [6, 4]],
      // hind legs
      ['leg', [[405, 325, 0.08], [400, 368, 0.08], [418, 435, 0.075], [420, 482, 0.075], [421, 492, 0.078]], [17, 12, 9, 7, 6], 6, [6, 4]],
      ['leg', [[390, 325, -0.08], [386, 368, -0.08], [400, 435, -0.075], [400, 482, -0.075], [399, 492, -0.078]], [17, 12, 9, 7, 6], 6, [6, 4]]
    ],
    cones: [
      ['hide', [240, 267, 0.045], [246, 257, 0.065], 4, 5],
      ['hide', [240, 267, -0.045], [246, 257, -0.065], 4, 5]
    ]
  });

  return { camel_adult: adult, camel_calf: calf };
}
```