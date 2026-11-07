```json
{
  "objects": [
    {
      "name": "dense_stand",
      "size_m": [2.3, 2.87, 2.04],
      "views": [
        {"label": "Dense stand – side", "box": [14, 26, 396, 502], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Dense stand – top", "box": [22, 567, 362, 906], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "wind_bent",
      "size_m": [2.9, 2.46, 1.39],
      "views": [
        {"label": "Wind-bent – side", "box": [377, 94, 858, 502], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Wind-bent – top", "box": [403, 611, 826, 842], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "edge_clump",
      "size_m": [1.28, 2.58, 1.16],
      "views": [
        {"label": "Edge clump – side", "box": [845, 74, 1058, 502], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Edge clump – top", "box": [850, 645, 1043, 838], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    }
  ],
  "notes": "Three late-season reed clump variants: a dense stand (~2.3 m wide, 2.87 m tall), a wind-bent clump leaning to +x (~2.9 m long, 2.46 m tall) and a sparse edge clump (~1.28 m wide, 2.58 m tall). Scale bar: 1 m = 166 px. The 'side' views are used as front views (+z). The wind-bent top view is shorter (2.55 m) than its side view (2.9 m), which is a sheet inconsistency. The three-quarter view is left out."
}
```

```js
function build(THREE) {
  // fixed seeded sequence (mulberry32)
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const M = {
    reed_mass: new THREE.MeshStandardMaterial({ color: 0x8a8148, roughness: 0.95, side: THREE.DoubleSide }),
    reed_stem: new THREE.MeshStandardMaterial({ color: 0xb59a5c, roughness: 0.85 }),
    reed_leaf: new THREE.MeshStandardMaterial({ color: 0x787c3d, roughness: 0.8, side: THREE.DoubleSide }),
    dry_leaf: new THREE.MeshStandardMaterial({ color: 0xb19a4d, roughness: 0.85, side: THREE.DoubleSide }),
    reed_plume: new THREE.MeshStandardMaterial({ color: 0x85696d, roughness: 1.0 }),
    dry_straw: new THREE.MeshStandardMaterial({ color: 0xa48c5b, roughness: 1.0 })
  };

  // shared unit geometries
  const stemGeo = new THREE.CylinderGeometry(0.6, 1, 1, 3, 1, true);
  const leafGeo = new THREE.ConeGeometry(1, 1, 3, 1, true);
  const plumeGeo = new THREE.SphereGeometry(1, 5, 3);
  const discGeo = new THREE.CylinderGeometry(1, 1, 1, 12, 1, false);
  const tuftGeo = new THREE.ConeGeometry(1, 1, 8, 1, true);
  const UP = new THREE.Vector3(0, 1, 0);

  function add(g, geo, name) {
    const m = new THREE.Mesh(geo, M[name]);
    m.name = name;
    g.add(m);
    return m;
  }
  // straight stem from a to b
  function stem(g, a, b, r) {
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    d.normalize();
    const m = add(g, stemGeo, 'reed_stem');
    m.scale.set(r, len, r);
    m.quaternion.setFromUnitVectors(UP, d);
    m.position.copy(a).addScaledVector(d, len / 2);
    return m;
  }
  // flat tapering blade from point p, azimuth az (0 = +x, pi/2 = +z), elevation el
  function leaf(g, p, az, el, len, w, dry) {
    const m = add(g, leafGeo, dry ? 'dry_leaf' : 'reed_leaf');
    m.scale.set(w * 0.12, len, w);
    m.rotation.set(0, -az, el - Math.PI / 2, 'YXZ');
    const ce = Math.cos(el);
    m.position.set(
      p.x + ce * Math.cos(az) * len * 0.5,
      p.y + Math.sin(el) * len * 0.5,
      p.z + ce * Math.sin(az) * len * 0.5
    );
    return m;
  }
  // feathery seed head hanging from a stem tip
  function plume(g, tip, dir, len, r) {
    const d = dir.clone().normalize();
    const m = add(g, plumeGeo, 'reed_plume');
    m.scale.set(r, len * 0.5, r * 0.75);
    m.quaternion.setFromUnitVectors(UP, d);
    m.position.copy(tip).addScaledVector(d, len * 0.42);
    return m;
  }

  // ---------------- DENSE STAND ----------------
  function denseStand() {
    const g = new THREE.Group();
    g.name = 'dense_stand';
    const R = makeRng(1201);
    const cx = -0.1, tilt = 0.055;

    const prof = [[0.02, 0], [0.78, 0], [0.8, 0.6], [0.86, 1.3], [0.94, 1.85], [0.97, 2.12],
                  [0.88, 2.33], [0.55, 2.47], [0.02, 2.52]];
    const core = add(g, new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 12), 'reed_mass');
    core.position.set(cx, 0.02, 0);
    core.rotation.z = -tilt;

    const litter = add(g, discGeo, 'dry_straw');
    litter.scale.set(0.85, 0.05, 0.85);
    litter.position.set(cx, 0.025, 0);

    // outer ring of stems on the surface of the mass
    const N = 40;
    let plumes = 0;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + (R() - 0.5) * 0.12;
      const ca = Math.cos(a), sa = Math.sin(a);
      const rb = 0.76 + R() * 0.1;
      const base = new THREE.Vector3(cx + rb * ca, 0, rb * sa);
      const h = 1.95 + R() * 0.55;
      const lean = 0.05 + R() * 0.04;
      const top = new THREE.Vector3(base.x + (lean * ca + 0.05) * h, h, base.z + lean * sa * h);
      stem(g, base, top, 0.009 + R() * 0.004);
      if (h > 2.2 && plumes < 24) {
        plumes++;
        plume(g, top,
          new THREE.Vector3(0.5 + 0.35 * ca + (R() - 0.5) * 0.3, 0.85 + R() * 0.35, 0.4 * sa + (R() - 0.5) * 0.3),
          0.3 + R() * 0.12, 0.05 + R() * 0.02);
      }
      const nl = R() < 0.4 ? 2 : 1;
      for (let k = 0; k < nl; k++) {
        const t = 0.25 + R() * 0.6;
        const p = new THREE.Vector3().lerpVectors(base, top, t);
        leaf(g, p, a + (R() - 0.5) * 1.2, 0.35 + R() * 0.75, 0.3 + R() * 0.2, 0.02 + R() * 0.008, R() < 0.32);
      }
    }

    // inner stems whose plumes break through the top of the mass
    const domeP = [[0, 2.52], [0.55, 2.47], [0.88, 2.33], [0.97, 2.12]];
    const topAt = (rho) => {
      for (let i = 1; i < domeP.length; i++) {
        if (rho <= domeP[i][0]) {
          const f = (rho - domeP[i - 1][0]) / (domeP[i][0] - domeP[i - 1][0]);
          return domeP[i - 1][1] + f * (domeP[i][1] - domeP[i - 1][1]);
        }
      }
      return 2.12;
    };
    for (let i = 0; i < 12; i++) {
      const phi = i * 2.39996 + R() * 0.3;
      const rho = 0.75 * Math.sqrt((i + 0.5) / 12);
      const cp = Math.cos(phi), sp = Math.sin(phi);
      const h = topAt(rho) + R() * 0.05;
      const base = new THREE.Vector3(cx + rho * cp * 0.8, 0, rho * sp * 0.8);
      const top = new THREE.Vector3(cx + rho * cp + tilt * h, h, rho * sp);
      stem(g, base, top, 0.009);
      plume(g, top,
        new THREE.Vector3(0.45 + 0.3 * cp + (R() - 0.5) * 0.3, 0.9 + R() * 0.3, 0.3 * sp + (R() - 0.5) * 0.3),
        0.3 + R() * 0.08, 0.055 + R() * 0.015);
    }
    return g;
  }

  // ---------------- WIND-BENT ----------------
  function windBent() {
    const g = new THREE.Group();
    g.name = 'wind_bent';
    const R = makeRng(1202);

    // bent mass: side silhouette extruded with rounded (bevelled) edges
    const pts = [[-1.25, 0.1], [-1.24, 0.5], [-1.18, 0.95], [-1.05, 1.38], [-0.82, 1.74], [-0.45, 2.02],
                 [0.0, 2.18], [0.45, 2.2], [0.82, 2.08], [1.08, 1.85], [1.12, 1.6], [1.0, 1.3],
                 [0.75, 1.05], [0.5, 0.85], [0.28, 0.58], [0.13, 0.3], [0.05, 0.1]];
    const sh = new THREE.Shape();
    sh.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
    const core = add(g, new THREE.ExtrudeGeometry(sh, {
      depth: 0.6, steps: 1, curveSegments: 1,
      bevelEnabled: true, bevelThickness: 0.22, bevelSize: 0.1, bevelSegments: 2
    }), 'reed_mass');
    core.position.z = -0.3;

    const litter = add(g, discGeo, 'dry_straw');
    litter.scale.set(0.75, 0.05, 0.5);
    litter.position.set(-0.62, 0.025, 0);

    // bent stems along front and back faces
    const NS = 14;
    for (let i = 0; i < NS; i++) {
      const u = Math.min(1, Math.max(0, (i + 0.2 + R() * 0.6) / NS));
      const s = 1 - u;
      const bx = -1.28 + 1.25 * u;
      const side = i % 2 === 0 ? 1 : -1;
      const bz = side * (0.42 + R() * 0.14);
      const cp = [
        new THREE.Vector3(bx, 0, bz),
        new THREE.Vector3(bx + 0.05, 0.6 + 0.5 * s, bz),
        new THREE.Vector3(bx + 0.38, 1.15 + 0.6 * s, bz * 1.02),
        new THREE.Vector3(bx + 0.9, 1.45 + 0.72 * s, bz * 1.04),
        new THREE.Vector3(bx + 1.85 - 0.75 * u, 1.5 + 0.8 * s, bz * 1.06)
      ];
      const curve = new THREE.CatmullRomCurve3(cp);
      add(g, new THREE.TubeGeometry(curve, 6, 0.011, 3, false), 'reed_stem');
      plume(g, cp[4],
        new THREE.Vector3(1, -0.12 - R() * 0.3, side * 0.12 + (R() - 0.5) * 0.25),
        0.38 + R() * 0.12, 0.06 + R() * 0.015);
      const nl = 2 + (R() < 0.5 ? 1 : 0);
      for (let k = 0; k < nl; k++) {
        const p = curve.getPoint(0.3 + R() * 0.6);
        leaf(g, p, (R() - 0.5) * 1.0 + side * 0.5 * R(), -0.5 + R() * 0.75,
             0.32 + R() * 0.22, 0.022, R() < 0.35);
      }
    }

    // plumes streaming off the top and the downwind end
    const B = [[-0.3, 2.18], [0.2, 2.3], [0.65, 2.3], [0.98, 2.12], [1.17, 1.88], [1.2, 1.6], [1.08, 1.3]];
    const NB = 12;
    for (let k = 0; k < NB; k++) {
      const q = Math.min(0.999, (k + 0.2 + R() * 0.6) / NB);
      const f = q * (B.length - 1), j = Math.floor(f), fr = f - j;
      const px = B[j][0] + (B[j + 1][0] - B[j][0]) * fr;
      const py = B[j][1] + (B[j + 1][1] - B[j][1]) * fr;
      const pz = (R() - 0.5) * 0.9;
      const tip = new THREE.Vector3(px - 0.22, py - 0.1, pz);
      stem(g, new THREE.Vector3(px - 0.52, py - 0.45, pz * 0.9), tip, 0.01);
      plume(g, tip,
        new THREE.Vector3(1, -0.1 - 0.55 * q - R() * 0.15, (R() - 0.5) * 0.4),
        0.38 + R() * 0.12, 0.06 + R() * 0.015);
    }

    // a few blades flicking upwind on the left edge
    for (let k = 0; k < 3; k++) {
      const z = (R() - 0.5) * 0.7;
      leaf(g, new THREE.Vector3(-1.25 + k * 0.05, 0.85 + k * 0.25, z),
           Math.PI + (R() - 0.5) * 0.6, 0.45 + R() * 0.4, 0.22 + R() * 0.08, 0.02, k === 1);
    }
    return g;
  }

  // ---------------- EDGE CLUMP ----------------
  function edgeClump() {
    const g = new THREE.Group();
    g.name = 'edge_clump';
    const R = makeRng(1203);
    const bx = -0.28;

    const tuft = add(g, tuftGeo, 'dry_straw');
    tuft.scale.set(0.17, 0.2, 0.17);
    tuft.position.set(bx, 0.1, 0);

    // [base dx, base z, tip x, tip y, tip z, has plume]
    const S = [
      [-0.02, 0.03, -0.10, 2.32, 0.04, 1],
      [0.03, -0.05, 0.05, 2.20, -0.10, 1],
      [-0.06, 0.06, -0.26, 2.05, 0.14, 1],
      [0.06, 0.08, 0.18, 2.08, 0.12, 1],
      [-0.04, -0.08, -0.18, 2.24, -0.16, 1],
      [0.04, 0.0, 0.30, 1.92, -0.02, 1],
      [-0.10, 0.0, -0.40, 1.50, -0.04, 0],
      [0.08, -0.04, 0.33, 1.78, -0.20, 1],
      [0.0, 0.10, 0.02, 1.70, 0.24, 1],
      [-0.02, -0.10, -0.06, 1.98, -0.26, 1]
    ];
    for (let i = 0; i < S.length; i++) {
      const s = S[i];
      const base = new THREE.Vector3(bx + s[0], 0, s[1]);
      const top = new THREE.Vector3(s[2], s[3], s[4]);
      stem(g, base, top, 0.011);
      if (s[5]) {
        plume(g, top,
          new THREE.Vector3(0.75 + (R() - 0.5) * 0.3, 0.55 + (R() - 0.5) * 0.3, s[4] * 0.6 + (R() - 0.5) * 0.2),
          0.4 + R() * 0.05, 0.055 + R() * 0.012);
      }
      for (let k = 0; k < 3; k++) {
        const t = 0.18 + k * 0.2 + R() * 0.12;
        const p = new THREE.Vector3().lerpVectors(base, top, t);
        const az = R() * Math.PI * 2;
        let len = 0.28 + R() * 0.14;
        if (Math.cos(az) < -0.3) len = Math.min(len, 0.26);
        leaf(g, p, az, 0.15 + R() * 0.65, len, 0.02, R() < 0.35);
      }
    }
    // basal blades
    for (let k = 0; k < 4; k++) {
      const az = k * Math.PI / 2 + 0.6 + R() * 0.4;
      leaf(g, new THREE.Vector3(bx, 0.12, 0), az, 0.2 + R() * 0.3,
           Math.cos(az) < -0.3 ? 0.28 : 0.42, 0.022, true);
    }
    return g;
  }

  return {
    dense_stand: denseStand(),
    wind_bent: windBent(),
    edge_clump: edgeClump()
  };
}
```