```json
{"objects": [
  {"name": "crane_standing", "size_m": [0.41, 1.60, 1.06],
   "views": [
     {"label": "standing side (facing right)", "box": [55, 138, 547, 882], "cam": [-1, 0, 0], "up": [0, 1, 0]},
     {"label": "standing front", "box": [540, 140, 730, 882], "cam": [0, 0, 1], "up": [0, 1, 0]}
   ]},
  {"name": "crane_flying", "size_m": [2.65, 0.60, 1.34],
   "views": [
     {"label": "flight side (facing right, wings raised)", "box": [847, 8, 1467, 282], "cam": [-1, 0, 0], "up": [0, 1, 0]},
     {"label": "flight top (back, head up)", "box": [817, 279, 1467, 607], "cam": [0, 1, 0], "up": [0, 0, 1]},
     {"label": "flight bottom (belly, head up)", "box": [812, 620, 1470, 942], "cam": [0, -1, 0], "up": [0, 0, 1]}
   ]}
 ],
 "notes": "Common crane: grey body, black and white head and neck, red crown, drooping tertial plumes. By the scale bar the standing bird is 1.6 m tall (big for a real crane) and the flying side view is 1.34 m beak to toes. The top and bottom flight views are drawn at about half that scale, so the wingspan (2.65 m) is taken from their proportions. The raised wings in the side flight view are modelled as a ~19° upward tilt (dihedral), which fits the side, top and bottom outlines together."}
```

```js
function build(THREE) {
  const COLORS = {
    feathers_grey: 0x9b999b,
    plume_feathers: 0x86858a,
    flight_feathers: 0x2e2e30,
    feathers_black: 0x2c2d2f,
    feathers_white: 0xe4e2de,
    skin_red: 0xb3241c,
    beak_horn: 0x6d6d68,
    leg_skin: 0x3b3c3c
  };
  const mats = {};
  function mat(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name], roughness: 0.92, metalness: 0 });
    return mats[name];
  }
  function mesh(geo, name) {
    const m = new THREE.Mesh(geo, mat(name));
    m.name = name;
    return m;
  }
  function ell(name, pos, sc, rx, ws, hs) {
    const m = mesh(new THREE.SphereGeometry(1, ws || 12, hs || 8), name);
    m.position.set(pos[0], pos[1], pos[2]);
    m.scale.set(sc[0], sc[1], sc[2]);
    m.rotation.x = rx || 0;
    return m;
  }
  const UP = new THREE.Vector3(0, 1, 0);
  function limb(name, a, b, r0, r1, seg) {
    const A = new THREE.Vector3(a[0], a[1], a[2]);
    const B = new THREE.Vector3(b[0], b[1], b[2]);
    const dir = new THREE.Vector3().subVectors(B, A);
    const len = dir.length();
    const m = mesh(new THREE.CylinderGeometry(r1, r0, len, seg || 6), name);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, dir.normalize());
    return m;
  }
  // side-profile extrusion: pts are [z, y] in model metres, extruded symmetrically along x
  function sideExtrude(name, pts, halfW, bevel) {
    const shape = new THREE.Shape();
    pts.forEach((p, i) => (i ? shape.lineTo(p[0], p[1]) : shape.moveTo(p[0], p[1])));
    const depth = 2 * (halfW - bevel);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: depth, steps: 1, curveSegments: 1, bevelEnabled: true,
      bevelThickness: bevel, bevelSize: bevel * 0.7, bevelOffset: -bevel * 0.7, bevelSegments: 2
    });
    geo.translate(0, 0, -depth / 2);
    const m = mesh(geo, name);
    m.rotation.y = -Math.PI / 2;
    return m;
  }
  function foot(g, x, z, yaw) {
    const y0 = 0.022;
    const toes = [[0, 0.15], [0.75, 0.125], [-0.75, 0.125], [Math.PI, 0.055]];
    toes.forEach(t => {
      const a = yaw + t[0];
      g.add(limb('leg_skin', [x, y0, z], [x + Math.sin(a) * t[1], 0.007, z + Math.cos(a) * t[1]], 0.009, 0.005, 5));
    });
  }

  // ---------------- STANDING CRANE ----------------
  const S = new THREE.Group();
  S.name = 'crane_standing';
  // body, tilted breast-up
  S.add(ell('feathers_grey', [0, 0.884, 0.041], [0.15, 0.237, 0.345], -0.436, 16, 12));
  // folded wings along the flanks
  [-1, 1].forEach(s => S.add(ell('feathers_grey', [s * 0.115, 0.863, -0.024], [0.07, 0.17, 0.30], -0.40, 12, 10)));
  // lower neck / breast swelling
  S.add(ell('feathers_grey', [0, 1.12, 0.30], [0.075, 0.11, 0.07], -0.2, 12, 10));
  // neck (slight S-curve), oval in section
  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.50, 0.285),
    new THREE.Vector3(0, 1.40, 0.268),
    new THREE.Vector3(0, 1.30, 0.276),
    new THREE.Vector3(0, 1.20, 0.295),
    new THREE.Vector3(0, 1.10, 0.310)
  ]);
  const neck = mesh(new THREE.TubeGeometry(neckCurve, 20, 0.045, 8, false), 'feathers_black');
  neck.scale.x = 0.75;
  S.add(neck);
  // head
  S.add(ell('feathers_black', [0, 1.532, 0.30], [0.042, 0.065, 0.086], 0, 14, 10));
  // red crown
  S.add(ell('skin_red', [0, 1.578, 0.30], [0.034, 0.022, 0.056], 0, 10, 6));
  // white cheek / neck stripes
  [-1, 1].forEach(s => S.add(ell('feathers_white', [s * 0.02, 1.47, 0.25], [0.02, 0.085, 0.04], 0.15, 8, 6)));
  // beak
  const beakS = mesh(new THREE.ConeGeometry(0.022, 0.15, 8), 'beak_horn');
  beakS.position.set(0, 1.511, 0.458);
  beakS.rotation.x = Math.PI / 2 + 0.11;
  S.add(beakS);
  // drooping tertial plumes (bushy upper mass)
  S.add(sideExtrude('plume_feathers', [
    [0.02, 0.96], [-0.09, 1.045], [-0.22, 1.015], [-0.33, 0.97], [-0.42, 0.905], [-0.485, 0.82],
    [-0.52, 0.69], [-0.528, 0.58], [-0.50, 0.50], [-0.40, 0.48], [-0.32, 0.51], [-0.25, 0.565],
    [-0.17, 0.605], [-0.08, 0.64], [0.02, 0.70]
  ], 0.16, 0.035));
  // longest plume tips (narrow, hanging lowest)
  S.add(sideExtrude('plume_feathers', [
    [-0.46, 0.66], [-0.525, 0.60], [-0.522, 0.50], [-0.512, 0.44], [-0.478, 0.37], [-0.44, 0.36],
    [-0.40, 0.405], [-0.35, 0.47], [-0.30, 0.53], [-0.36, 0.60]
  ], 0.05, 0.02));
  // legs: A on -x (stepping forward), B on +x
  S.add(limb('leg_skin', [-0.045, 0.68, 0.0], [-0.048, 0.41, -0.028], 0.015, 0.012, 7));
  S.add(limb('leg_skin', [-0.048, 0.41, -0.028], [-0.058, 0.025, 0.063], 0.011, 0.010, 7));
  S.add(ell('leg_skin', [-0.048, 0.41, -0.028], [0.017, 0.02, 0.017], 0, 8, 6));
  foot(S, -0.058, 0.063, -0.1);
  S.add(limb('leg_skin', [0.045, 0.68, -0.06], [0.048, 0.427, -0.099], 0.015, 0.012, 7));
  S.add(limb('leg_skin', [0.048, 0.427, -0.099], [0.058, 0.025, -0.132], 0.011, 0.010, 7));
  S.add(ell('leg_skin', [0.048, 0.427, -0.099], [0.017, 0.02, 0.017], 0, 8, 6));
  foot(S, 0.058, -0.132, 0.35);

  // ---------------- FLYING CRANE ----------------
  const F = new THREE.Group();
  F.name = 'crane_flying';
  // body
  F.add(ell('feathers_grey', [0, 0.115, -0.12], [0.13, 0.08, 0.33], 0, 16, 12));
  // breast-to-neck taper
  const nb = mesh(new THREE.CylinderGeometry(0.026, 0.06, 0.24, 10), 'feathers_grey');
  nb.rotation.x = Math.PI / 2;
  nb.position.set(0, 0.12, 0.22);
  F.add(nb);
  // outstretched neck
  const fNeckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.120, 0.30),
    new THREE.Vector3(0, 0.124, 0.40),
    new THREE.Vector3(0, 0.132, 0.47),
    new THREE.Vector3(0, 0.140, 0.52)
  ]);
  F.add(mesh(new THREE.TubeGeometry(fNeckCurve, 12, 0.022, 8, false), 'feathers_black'));
  // head, crown, beak
  F.add(ell('feathers_black', [0, 0.142, 0.53], [0.03, 0.031, 0.056], 0, 12, 8));
  F.add(ell('skin_red', [0, 0.168, 0.535], [0.02, 0.009, 0.024], 0, 8, 6));
  const beakF = mesh(new THREE.ConeGeometry(0.012, 0.095, 8), 'beak_horn');
  beakF.position.set(0, 0.132, 0.6215);
  beakF.rotation.x = Math.PI / 2 + 0.08;
  F.add(beakF);
  // tertial plumes over the tail
  F.add(ell('plume_feathers', [0, 0.14, -0.44], [0.13, 0.065, 0.13], 0.15, 12, 8));
  // trailing legs and feet
  [-1, 1].forEach(s => {
    F.add(limb('leg_skin', [s * 0.025, 0.07, -0.33], [s * 0.025, 0.028, -0.60], 0.010, 0.008, 6));
    const ft = mesh(new THREE.ConeGeometry(0.016, 0.08, 6), 'leg_skin');
    ft.rotation.x = -Math.PI / 2;
    ft.position.set(s * 0.025, 0.02, -0.629);
    F.add(ft);
  });
  // wings: planform [horizontal distance from centre, z], raised by a dihedral angle
  const theta = 0.33, rootX = 0.07, rootY = 0.163;
  const flightPts = [
    [0.05, 0.17], [0.25, 0.20], [0.50, 0.205], [0.80, 0.20], [1.00, 0.21], [1.10, 0.20],
    [1.325, 0.150], [1.18, 0.12], [1.315, 0.090], [1.17, 0.07], [1.295, 0.030], [1.16, 0.01],
    [1.27, -0.035], [1.14, -0.045], [1.235, -0.090], [1.11, -0.095], [1.18, -0.140],
    [1.05, -0.170], [0.95, -0.215], [0.70, -0.260], [0.45, -0.295], [0.25, -0.320], [0.05, -0.335]
  ];
  const covertPts = [
    [0.05, 0.175], [0.40, 0.208], [0.80, 0.207], [1.02, 0.215], [1.10, 0.195],
    [1.06, 0.13], [0.95, 0.05], [0.70, -0.03], [0.40, -0.06], [0.05, -0.08]
  ];
  function wingGeo(pts, sign, depth, bevel) {
    const shape = new THREE.Shape();
    pts.forEach((p, i) => {
      const x = sign * (p[0] - rootX) / Math.cos(theta);
      if (i === 0) shape.moveTo(x, p[1]); else shape.lineTo(x, p[1]);
    });
    const opts = { depth: depth, steps: 1, curveSegments: 1, bevelEnabled: bevel > 0 };
    if (bevel > 0) {
      opts.bevelThickness = bevel;
      opts.bevelSize = bevel * 0.6;
      opts.bevelOffset = -bevel * 0.6;
      opts.bevelSegments = 2;
    }
    const geo = new THREE.ExtrudeGeometry(shape, opts);
    geo.translate(0, 0, -depth / 2);
    return geo;
  }
  [1, -1].forEach(sign => {
    const wg = new THREE.Group();
    wg.position.set(sign * rootX, rootY, 0);
    wg.rotation.z = sign * theta;
    const fl = mesh(wingGeo(flightPts, sign, 0.02, 0), 'flight_feathers');
    fl.rotation.x = Math.PI / 2;
    wg.add(fl);
    const cv = mesh(wingGeo(covertPts, sign, 0.03, 0.01), 'feathers_grey');
    cv.rotation.x = Math.PI / 2;
    wg.add(cv);
    F.add(wg);
  });

  return { crane_standing: S, crane_flying: F };
}
```