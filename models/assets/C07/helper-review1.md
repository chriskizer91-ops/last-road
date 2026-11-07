**What's off:**
- **Depth.** Both side views show more ground in front of and behind the building than the model has. The building there is about 0.77 of the pad's depth; the model's is 0.83. I had matched the top view only, so it wasn't really a compromise. I'm shortening the building to 6.96 m deep (roof slab), from 7.22.
- **Height.** The cornice top measures about 2.67–2.75 m in all four elevations; the model's is 2.6 m. I'm raising it to 2.68 m. The corbels, string courses, lintel and the root path over the cornice move up with it.
- **Rocks below ground.** The tilted rocks poke below the pad (min y −0.07). They now sit at or above y = 0.
- **Small fixes.**
  - Both side views show the fig crown overhanging the front a bit more, so I added one forward foliage mass.
  - The −x drift reaches the ground nearer mid-wall, so it's shorter.
  - The roots over the roof are lifted onto the higher slab.
- **What's right.** The doorway, roof well, tree placement, drifts, corbels and the views and cameras all match. The views need no changes.

```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'three_wells_temple';

  const COLORS = {
    stone: 0x5f5546,
    stone_light: 0x8a7c66,
    sand: 0xc6844f,
    bark: 0x76634b,
    foliage: 0x7c7c38,
    rock: 0x847c72,
    dry_grass: 0xb39462
  };
  const mats = {};
  const mat = (n) => mats[n] || (mats[n] = new THREE.MeshStandardMaterial({ color: COLORS[n] }));
  const mesh = (geo, n) => { const m = new THREE.Mesh(geo, mat(n)); m.name = n; root.add(m); return m; };
  const box = (n, x0, x1, y0, y1, z0, z1) => {
    const m = mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), n);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return m;
  };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const tube = (n, pts, r, seg, rad) => {
    const c = new THREE.CatmullRomCurve3(pts);
    mesh(new THREE.TubeGeometry(c, seg, r, rad, false), n);
    return c;
  };
  let seed = 12345;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // ---- key dimensions (metres)
  const HW = 3.0, HD = 3.32, T = 0.55;   // half width, half depth, wall thickness
  const WT = 2.42, RT = 2.68, PY = 0.12; // wall top, roof top, sand pad top
  const RE = HD + 0.16;                  // roof slab edge (front/back)
  const DX0 = -0.46, DX1 = 0.22, DTOP = 1.47; // doorway
  const dz = HD - 3.45, dy = RT - 2.6;   // shifts for facade-hugging details

  // ---- sand pad (rounded, slightly irregular slab)
  {
    const hx = 3.88, hz = 4.23, R = 0.88, pts = [];
    const corners = [[hx - R, hz - R, 0], [-(hx - R), hz - R, 0.5], [-(hx - R), -(hz - R), 1], [hx - R, -(hz - R), 1.5]];
    for (let c = 0; c < 4; c++) {
      const [cx, cy, a0] = corners[c];
      for (let i = 0; i <= 6; i++) {
        const a = (a0 + i / 12) * Math.PI;
        pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
      }
      const [nx, ny, na] = corners[(c + 1) % 4];
      const e0 = [cx + R * Math.cos((a0 + 0.5) * Math.PI), cy + R * Math.sin((a0 + 0.5) * Math.PI)];
      const e1 = [nx + R * Math.cos(na * Math.PI), ny + R * Math.sin(na * Math.PI)];
      for (let k = 1; k <= 4; k++) {
        const t = k / 5;
        pts.push([e0[0] + (e1[0] - e0[0]) * t, e0[1] + (e1[1] - e0[1]) * t]);
      }
    }
    const s = new THREE.Shape();
    pts.forEach((p, i) => {
      const f = 1 - 0.012 * rnd();
      if (i === 0) s.moveTo(p[0] * f, p[1] * f); else s.lineTo(p[0] * f, p[1] * f);
    });
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.04, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.12, bevelSegments: 2, curveSegments: 2
    });
    const m = mesh(geo, 'sand');
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.04;
  }

  // ---- walls (hollow, doorway in front)
  box('stone', -HW, HW, 0, WT, -HD, -HD + T);
  box('stone', HW - T, HW, 0, WT, -HD + T, HD - T);
  box('stone', -HW, -HW + T, 0, WT, -HD + T, HD - T);
  box('stone', -HW, DX0, 0, WT, HD - T, HD);
  box('stone', DX1, HW, 0, WT, HD - T, HD);
  box('stone', DX0, DX1, DTOP, WT, HD - T, HD);

  // ---- roof / cornice slab with the well opening
  {
    const s = new THREE.Shape();
    s.moveTo(-3.16, -RE); s.lineTo(3.16, -RE); s.lineTo(3.16, RE); s.lineTo(-3.16, RE);
    const h = new THREE.Path();
    h.moveTo(0.17, 0.27); h.lineTo(0.17, 0.93); h.lineTo(0.83, 0.93); h.lineTo(0.83, 0.27);
    s.holes.push(h);
    const m = mesh(new THREE.ExtrudeGeometry(s, { depth: RT - WT, bevelEnabled: false }), 'stone');
    m.rotation.x = -Math.PI / 2;
    m.position.y = WT;
  }
  // raised frame round the roof opening (centre x 0.5, z -0.6)
  {
    const cx = 0.5, cz = -0.6, a = 0.52, b = 0.33, y1 = RT + 0.1;
    box('stone_light', cx - a, cx + a, RT, y1, cz - a, cz - b);
    box('stone_light', cx - a, cx + a, RT, y1, cz + b, cz + a);
    box('stone_light', cx - a, cx - b, RT, y1, cz - b, cz + b);
    box('stone_light', cx + b, cx + a, RT, y1, cz - b, cz + b);
  }

  // ---- stepped corbels under the cornice
  const tiers = [[0.44, WT - 0.13, WT, 0.2], [0.32, WT - 0.25, WT - 0.13, 0.14], [0.2, WT - 0.37, WT - 0.25, 0.08]];
  const xs = [-2.6, -1.56, -0.52, 0.52, 1.56, 2.6];
  const zc = HD - 0.32;
  const zs = [-3, -2, -1, 0, 1, 2, 3].map((k) => (k * zc) / 3);
  xs.forEach((x) => tiers.forEach(([w, y0, y1, p]) => {
    box('stone', x - w / 2, x + w / 2, y0, y1, HD - 0.02, HD + p);
    box('stone', x - w / 2, x + w / 2, y0, y1, -HD - p, -HD + 0.02);
  }));
  zs.forEach((z) => tiers.forEach(([w, y0, y1, p]) => {
    box('stone', HW - 0.02, HW + p, y0, y1, z - w / 2, z + w / 2);
    box('stone', -HW - p, -HW + 0.02, y0, y1, z - w / 2, z + w / 2);
  }));

  // ---- string courses
  const band = (y0, y1, splitFront) => {
    const P = 0.07, E = HW + P;
    box('stone', -E, E, y0, y1, -HD - P, -HD + 0.02);
    box('stone', HW - 0.02, E, y0, y1, -HD, HD);
    box('stone', -E, -HW + 0.02, y0, y1, -HD, HD);
    if (splitFront) {
      box('stone', -E, -0.74, y0, y1, HD - 0.02, HD + P);
      box('stone', 0.5, E, y0, y1, HD - 0.02, HD + P);
    } else {
      box('stone', -E, E, y0, y1, HD - 0.02, HD + P);
    }
  };
  band(1.88, 1.98, false);
  band(1.28, 1.38, true);

  // ---- door surround
  box('stone_light', -0.74, DX0, PY - 0.02, DTOP, HD - 0.02, HD + 0.06);
  box('stone_light', DX1, 0.5, PY - 0.02, DTOP, HD - 0.02, HD + 0.06);
  box('stone_light', -0.78, 0.54, DTOP, 1.78, HD - 0.02, HD + 0.08);

  // ---- sand drifts (lathe quarters at the back corners + extruded back dune)
  const prof = [[1, 0], [0.86, 0.09], [0.72, 0.2], [0.57, 0.34], [0.42, 0.5], [0.28, 0.67], [0.15, 0.83], [0.05, 0.95], [0, 1]];
  const lp = prof.map((p) => new THREE.Vector2(p[0], p[1]));
  const SY = 0.1, HB = 1.95, RX = 0.9, RZB = 0.82;
  const drift = (x, z, ph0, sx, sy, sz, seg, phLen) => {
    const m = mesh(new THREE.LatheGeometry(lp, seg, ph0, phLen || Math.PI / 2), 'sand');
    m.position.set(x, SY, z);
    m.scale.set(sx, sy, sz);
    return m;
  };
  drift(HW, -HD, 0, RX, HB, 6.0, 16);                 // +x side, running toward the front
  drift(HW, -HD, Math.PI / 2, RX, HB, RZB, 6);        // +x back corner wrap
  drift(-HW, -HD, Math.PI, RX, HB, RZB, 6);           // -x back corner wrap
  drift(-HW, -HD, 1.5 * Math.PI, RX, HB, 4.6, 16);    // -x side, running toward the front
  {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    prof.forEach((p) => s.lineTo(p[0] * RZB, p[1] * HB));
    const m = mesh(new THREE.ExtrudeGeometry(s, { depth: 2 * HW, bevelEnabled: false }), 'sand');
    m.rotation.y = Math.PI / 2;
    m.position.set(-HW, SY, -HD);
  }
  // low sand heaps at the front wall
  drift(-2.1, HD, -Math.PI / 2, 0.85, 0.28, 0.55, 12, Math.PI);
  drift(2.2, HD, -Math.PI / 2, 0.75, 0.2, 0.5, 12, Math.PI);

  // ---- fig tree on the roof, front-left
  {
    const m = mesh(new THREE.CylinderGeometry(0.2, 0.36, 0.3, 10), 'bark');
    m.position.set(-1.5, RT + 0.15, 2.5);
  }
  tube('bark', [V(-1.36, RT, 2.62), V(-1.42, 2.88, 2.52), V(-1.56, 3.1, 2.38), V(-1.5, 3.32, 2.22)], 0.13, 12, 8);
  tube('bark', [V(-1.68, RT, 2.56), V(-1.6, 2.92, 2.46), V(-1.44, 3.15, 2.46), V(-1.3, 3.36, 2.52)], 0.11, 12, 8);
  tube('bark', [V(-1.5, RT, 2.34), V(-1.56, 2.92, 2.3), V(-1.66, 3.15, 2.22), V(-1.82, 3.34, 2.14)], 0.1, 12, 8);

  const blobs = [
    [-1.5, 3.65, 2.1, 1.1, 0.42, 1.0],
    [-2.5, 3.5, 2.6, 0.9, 0.38, 0.85],
    [-0.5, 3.5, 2.5, 0.95, 0.38, 0.85],
    [-1.6, 3.45, 3.3, 0.9, 0.35, 0.6],
    [-1.2, 3.5, 1.1, 0.9, 0.35, 0.75],
    [-2.9, 3.25, 1.9, 0.55, 0.32, 0.6],
    [0.2, 3.25, 1.7, 0.55, 0.3, 0.6],
    [-2.2, 3.85, 1.7, 0.7, 0.28, 0.6],
    [-0.9, 3.9, 2.9, 0.65, 0.25, 0.55],
    [-2.7, 3.2, 3.3, 0.6, 0.3, 0.5],
    [-1.9, 3.4, 3.7, 0.7, 0.3, 0.42]
  ];
  const F = V(-1.5, 3.3, 2.3);
  blobs.forEach(([cx, cy, cz, rx, ry, rz]) => {
    const m = mesh(new THREE.SphereGeometry(1, 12, 8), 'foliage');
    m.position.set(cx, cy, cz);
    m.scale.set(rx, ry, rz);
    m.rotation.y = rnd() * Math.PI;
    const end = V(cx, cy - ry * 0.4, cz);
    const mid = V((F.x + cx) / 2, (F.y + end.y) / 2 + 0.08, (F.z + cz) / 2);
    tube('bark', [F.clone(), mid, end], 0.055, 8, 5);
  });

  // roots spreading over the roof
  tube('bark', [V(-1.6, RT + 0.04, 2.6), V(-2.2, RT + 0.03, 2.95), V(-2.75, RT + 0.02, 3.3)], 0.06, 10, 6);
  tube('bark', [V(-1.6, RT + 0.04, 2.4), V(-2.1, RT + 0.03, 1.9), V(-2.55, RT + 0.02, 1.45)], 0.06, 10, 6);
  tube('bark', [V(-1.4, RT + 0.04, 2.4), V(-0.9, RT + 0.03, 2.0), V(-0.45, RT + 0.02, 1.65)], 0.055, 10, 6);

  // aerial roots hanging down the front facade
  const hang = (roofPath, sx, gx, r, stopY) => {
    const d = gx - sx;
    let pts = roofPath.slice();
    pts.push(
      V(sx, RT + r, 3.36 + dz), V(sx, RT + r * 0.9, 3.64 + dz), V(sx + d * 0.08, 2.5 + dy, 3.72 + dz + r),
      V(sx + d * 0.2, 2.15 + dy, 3.68 + dz + r), V(sx + d * 0.35, 1.9 + dy, 3.54 + dz + r),
      V(sx + d * 0.55, 1.35, 3.54 + dz + r), V(sx + d * 0.8, 0.8, 3.53 + dz + r),
      V(gx, 0.4, 3.54 + dz + r), V(gx + 0.06, PY + r * 0.5, 3.62 + dz + r)
    );
    if (stopY) pts = pts.filter((p) => p.y >= stopY);
    return tube('bark', pts, r, 28, 6);
  };
  const leftStart = (sx) => [V(-1.5 + (sx + 1.5) * 0.3, RT + 0.12, 2.6)];
  const rightStart = (sx, r) => [V(-1.25, RT + 0.12, 2.65), V(-0.6, RT + r, 3.15 + dz), V(sx - 0.35, RT + r, 3.3 + dz)];
  const curves = [];
  [[-2.0, -2.2, 0.08], [-1.75, -1.85, 0.11], [-1.45, -1.45, 0.08], [-1.2, -1.05, 0.09], [-2.5, -2.7, 0.07]]
    .forEach(([sx, gx, r]) => curves.push(hang(leftStart(sx), sx, gx, r)));
  curves.push(hang(leftStart(-1.6), -1.6, -1.62, 0.05, 0.9));
  [[0.75, 0.8, 0.09], [0.95, 1.1, 0.075], [1.2, 1.4, 0.065]]
    .forEach(([sx, gx, r]) => curves.push(hang(rightStart(sx, r), sx, gx, r)));

  // ivy clumps along the hanging roots
  curves.forEach((c) => {
    for (let i = 0; i < 6; i++) {
      const t = 0.3 + i * 0.12;
      if (t > 0.97) break;
      const p = c.getPointAt(t);
      if (p.y > 2.3 + dy || p.y < 0.35 || rnd() < 0.3) continue;
      const m = mesh(new THREE.SphereGeometry(1, 8, 6), 'foliage');
      m.position.set(p.x + (rnd() - 0.5) * 0.2, p.y, p.z + 0.05);
      m.scale.set(0.14 + rnd() * 0.12, 0.18 + rnd() * 0.16, 0.07);
    }
  });
  // foliage along the cornice top
  [[-0.7, 3.25], [-0.05, 3.42], [0.55, 3.45], [-2.3, 3.4], [-2.9, 3.3]].forEach(([x, z]) => {
    const m = mesh(new THREE.SphereGeometry(1, 8, 6), 'foliage');
    m.position.set(x, RT + 0.05, z + dz);
    m.scale.set(0.32, 0.09, 0.22);
  });

  // ---- rocks on the sand (kept above y = 0)
  const rocks = [
    [-3.35, 3.6, 0.26], [-3.0, 4.02, 0.16], [-1.9, 4.02, 0.2], [-0.45, 3.98, 0.13], [0.95, 4.05, 0.18],
    [2.05, 3.88, 0.24], [3.2, 3.75, 0.2], [3.6, 3.0, 0.16], [-3.6, 2.55, 0.18], [-3.6, 1.4, 0.14],
    [3.6, 2.0, 0.16], [-2.55, 4.12, 0.11], [1.55, 4.12, 0.12]
  ];
  rocks.forEach(([x, z, s]) => {
    const m = mesh(new THREE.SphereGeometry(1, 7, 5), 'rock');
    const sy = s * (0.45 + rnd() * 0.2);
    m.position.set(x, PY + sy * 0.6, z);
    m.scale.set(s * (1 + rnd() * 0.3), sy, s * (0.8 + rnd() * 0.3));
    m.rotation.set((rnd() - 0.5) * 0.16, rnd() * Math.PI, (rnd() - 0.5) * 0.16);
  });

  // ---- dry grass tufts
  const tufts = [[-3.25, 3.15], [-2.75, 3.95], [-0.95, 3.85], [1.65, 3.7], [2.85, 3.65],
    [3.55, 3.3], [-3.55, 0.6], [3.6, 2.5], [0.6, 4.05], [-3.6, 1.95]];
  tufts.forEach(([x, z]) => {
    for (let k = 0; k < 4; k++) {
      const h = 0.22 + rnd() * 0.15;
      const m = mesh(new THREE.ConeGeometry(0.025, h, 4), 'dry_grass');
      const a = rnd() * Math.PI * 2;
      m.position.set(x + Math.cos(a) * 0.05, PY + h * 0.45, z + Math.sin(a) * 0.05);
      m.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
    }
  });

  return root;
}
```