- **Edge clump (side overlap 0.33).** This was the real problem. Blades were scaled to 0.12 × width and lay flat, so from the front camera every leaf was edge-on and invisible. The stems also fanned out from a single point. On the sheet they rise almost vertically from a base about 0.3 m wide and only bend right near the plumes. Fixes:
  - Stems rebuilt as gently curved tubes from a wider base.
  - Longer leaves that radiate outward, which gives the star shape in the top view.
  - A thicker blade cross-section so leaves show from both the front and the top.
- **Wind-bent top (0.80).** On the sheet the clump is narrow at the upwind base and fans wider downwind. The model was a slab of uniform depth, and too deep (1.76 m against 1.39 m). It is now a thin full-silhouette slab plus a wider crown slab. Stems and leaves are pulled in toward it.
- **Dense stand.**
  - Leaves stuck far out sideways, making it 2.59 m deep where the top view shows about 2.05 m. They are now shorter and more upright.
  - The core dipped below y = 0 and is now lifted.
- The view boxes and cameras are correct, so the JSON needs no changes.

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
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

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
  // curved stem through points
  function tube(g, pts, r, seg) {
    const curve = new THREE.CatmullRomCurve3(pts);
    add(g, new THREE.TubeGeometry(curve, seg, r, 3, false), 'reed_stem');
    return curve;
  }
  // tapering blade from point p, azimuth az (0 = +x, pi/2 = +z), elevation el.
  // cross-section kept fairly round so blades read from the side and from above.
  function leaf(g, p, az, el, len, w, dry) {
    const m = add(g, leafGeo, dry ? 'dry_leaf' : 'reed_leaf');
    m.scale.set(w * 0.5, len, w);
    m.rotation.set(0, -az, el - Math.PI / 2, 'YXZ');
    const ce = Math.cos(el);
    m.position.set(
      p.x + ce * Math.cos(az) * len * 0.5,
      p.y + Math.sin(el) * len * 0.5,
      p.z + ce * Math.sin(az) * len * 0.5
    );
    return m;
  }
  // feathery seed head from a stem tip
  function plume(g, tip, dir, len, r) {
    const d = dir.clone().normalize();
    const m = add(g, plumeGeo, 'reed_plume');
    m.scale.set(r, len * 0.5, r * 0.75);
    m.quaternion.setFromUnitVectors(UP, d);
    m.position.copy(tip).addScaledVector(d, len * 0.42);
    return m;
  }
  // side silhouette extruded symmetric about z = 0 with rounded edges
  function slab(g, pts, depth, bt, bs) {
    const sh = new THREE.Shape();
    sh.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
    const m = add(g, new THREE.ExtrudeGeometry(sh, {
      depth: depth, steps: 1, curveSegments: 1,
      bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: 2
    }), 'reed_mass');
    m.position.z = -depth / 2;
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
    core.position.set(cx, 0.06, 0);
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
        leaf(g, p, a + (R() - 0.5) * 1.0, 0.6 + R() * 0.6, 0.26 + R() * 0.16, 0.022 + R() * 0.006, R() < 0.32);
      }
    }

    // inner stems whose plumes break through the top of the mass
    const domeP = [[0, 2.58], [0.55, 2.53], [0.88, 2.39], [0.97, 2.18]];
    const topAt = (rho) => {
      for (let i = 1; i < domeP.length; i++) {
        if (rho <= domeP[i][0]) {
          const f = (rho - domeP[i - 1][0]) / (domeP[i][0] - domeP[i - 1][0]);
          return domeP[i - 1][1] + f * (domeP[i][1] - domeP[i - 1][1]);
        }
      }
      return 2.18;
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

    // full side silhouette, kept thin: from above the upwind base is narrow
    const outline = [[-1.25, 0.1], [-1.24, 0.5], [-1.18, 0.95], [-1.05, 1.38], [-0.82, 1.74], [-0.45, 2.02],
                     [0.0, 2.18], [0.45, 2.2], [0.82, 2.08], [1.08, 1.85], [1.12, 1.6], [1.0, 1.3],
                     [0.75, 1.05], [0.5, 0.85], [0.28, 0.58], [0.13, 0.3], [0.05, 0.1]];
    slab(g, outline, 0.34, 0.12, 0.1);
    // the bent crown fans out wider downwind (inset so the side outline is unchanged)
    const crown = [[-0.9, 1.38], [-0.76, 1.66], [-0.42, 1.93], [0.0, 2.09], [0.44, 2.11], [0.78, 2.0],
                   [1.0, 1.8], [1.03, 1.6], [0.93, 1.36], [0.69, 1.12], [0.44, 0.93], [0.24, 0.72],
                   [-0.2, 0.85], [-0.62, 1.05]];
    slab(g, crown, 0.62, 0.18, 0.08);

    const litter = add(g, discGeo, 'dry_straw');
    litter.scale.set(0.72, 0.05, 0.34);
    litter.position.set(-0.6, 0.025, 0);

    // bent stems along front and back faces
    const NS = 14;
    for (let i = 0; i < NS; i++) {
      const u = Math.min(1, Math.max(0, (i + 0.2 + R() * 0.6) / NS));
      const s = 1 - u;
      const bx = -1.28 + 1.25 * u;
      const side = i % 2 === 0 ? 1 : -1;
      const zb = side * (0.27 + R() * 0.05);
      const zc = side * (0.47 + R() * 0.06);
      const cp = [
        V(bx, 0, zb),
        V(bx + 0.05, 0.6 + 0.5 * s, zb),
        V(bx + 0.38, 1.15 + 0.6 * s, (zb + zc) / 2),
        V(bx + 0.9, 1.45 + 0.72 * s, zc),
        V(bx + 1.85 - 0.75 * u, 1.5 + 0.8 * s, zc * 1.04)
      ];
      const curve = tube(g, cp, 0.011, 6);
      plume(g, cp[4],
        V(1, -0.12 - R() * 0.3, side * 0.08 + (R() - 0.5) * 0.16),
        0.38 + R() * 0.12, 0.06 + R() * 0.015);
      const nl = 2 + (R() < 0.5 ? 1 : 0);
      for (let k = 0; k < nl; k++) {
        const p = curve.getPoint(0.3 + R() * 0.6);
        leaf(g, p, side * R() * 0.35 + (R() - 0.5) * 0.25, -0.5 + R() * 0.75,
             0.3 + R() * 0.18, 0.022, R() < 0.35);
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
      const pz = (R() - 0.5) * 0.85;
      const tip = V(px - 0.22, py - 0.1, pz);
      stem(g, V(px - 0.52, py - 0.45, pz * 0.9), tip, 0.01);
      plume(g, tip,
        V(1, -0.1 - 0.55 * q - R() * 0.15, (R() - 0.5) * 0.3),
        0.38 + R() * 0.12, 0.06 + R() * 0.015);
    }

    // a few blades flicking upwind on the left edge
    for (let k = 0; k < 3; k++) {
      const z = (R() - 0.5) * 0.4;
      leaf(g, V(-1.25 + k * 0.05, 0.85 + k * 0.25, z),
           Math.PI + (R() - 0.5) * 0.6, 0.45 + R() * 0.4, 0.22 + R() * 0.08, 0.02, k === 1);
    }
    return g;
  }

  // ---------------- EDGE CLUMP ----------------
  function edgeClump() {
    const g = new THREE.Group();
    g.name = 'edge_clump';
    const R = makeRng(1203);

    const tuft = add(g, tuftGeo, 'dry_straw');
    tuft.scale.set(0.15, 0.16, 0.15);
    tuft.position.set(-0.3, 0.08, 0);

    // [base x, base z, tip x, tip y, tip z, plume dir x, plume dir y, plume length (0 = none)]
    const S = [
      [-0.30, 0.02, -0.10, 2.25, 0.02, 0.35, 1.0, 0.36],
      [-0.24, -0.06, 0.04, 2.15, -0.10, 0.7, 1.0, 0.38],
      [-0.20, 0.07, 0.16, 2.04, 0.14, 1.0, 0.9, 0.38],
      [-0.16, -0.02, 0.24, 1.94, -0.04, 1.0, 0.45, 0.40],
      [-0.36, -0.08, -0.22, 2.04, -0.18, 0.4, 1.0, 0.34],
      [-0.28, 0.10, -0.02, 1.86, 0.24, 0.9, 0.8, 0.36],
      [-0.40, 0.04, -0.30, 1.94, 0.10, 0.3, 1.0, 0.32],
      [-0.22, -0.12, 0.10, 1.72, -0.24, 1.0, 0.6, 0.36],
      [-0.34, 0.12, -0.16, 1.62, 0.28, 0.8, 0.9, 0.32],
      [-0.42, 0.00, -0.46, 1.55, -0.02, 0, 0, 0],
      [-0.26, -0.14, -0.20, 1.35, -0.30, 0, 0, 0],
      [-0.38, 0.13, -0.42, 1.25, 0.26, 0, 0, 0],
      [-0.32, -0.03, -0.26, 1.15, 0.00, 0, 0, 0]
    ];
    for (let i = 0; i < S.length; i++) {
      const s = S[i];
      const base = V(s[0], 0, s[1]);
      const top = V(s[2], s[3], s[4]);
      // nearly upright low down, leaning more toward the tip
      const mid = V(s[0] + 0.25 * (s[2] - s[0]), 0.5 * s[3], s[1] + 0.3 * (s[4] - s[1]));
      const curve = tube(g, [base, mid, top], 0.011, 4);
      if (s[7] > 0) {
        plume(g, top,
          V(s[5] + (R() - 0.5) * 0.15, s[6], s[4] * 0.6 + (R() - 0.5) * 0.2),
          s[7], 0.05 + R() * 0.012);
      }
      const nl = s[7] > 0 ? 2 : 3;
      for (let k = 0; k < nl; k++) {
        const p = curve.getPoint(0.2 + R() * 0.55);
        const az = i * 2.39996 + k * 2.1 + R() * 0.6;
        const ca = Math.cos(az);
        let len = 0.36 + R() * 0.2;
        if (ca < -0.3) len = Math.min(len, 0.2);
        else if (ca > 0.5) len = Math.min(len, 0.42);
        leaf(g, p, az, 0.2 + R() * 0.55, len, 0.024, R() < 0.35);
      }
    }
    // basal blades
    for (let k = 0; k < 5; k++) {
      const az = k * (Math.PI * 2 / 5) + 0.4 + R() * 0.4;
      leaf(g, V(-0.3, 0.12, 0), az, 0.25 + R() * 0.3,
           Math.cos(az) < -0.3 ? 0.2 : 0.32, 0.022, true);
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