```json
{
  "objects": [
    {
      "name": "boulder_long_large",
      "size_m": [12.0, 4.23, 8.6],
      "views": [{"label": "front", "box": [15, 2, 1238, 433], "cam": [0, 0, 1], "up": [0, 1, 0]}]
    },
    {
      "name": "boulder_split",
      "size_m": [7.2, 2.86, 6.0],
      "views": [{"label": "front", "box": [100, 478, 835, 770], "cam": [0, 0, 1], "up": [0, 1, 0]}]
    },
    {
      "name": "boulder_balanced",
      "size_m": [5.95, 4.23, 5.2],
      "views": [{"label": "front", "box": [898, 345, 1505, 776], "cam": [0, 0, 1], "up": [0, 1, 0]}]
    },
    {
      "name": "boulder_xs",
      "size_m": [1.57, 0.86, 1.4],
      "views": [{"label": "front", "box": [113, 888, 273, 976], "cam": [0, 0, 1], "up": [0, 1, 0]}]
    },
    {
      "name": "boulder_s",
      "size_m": [2.25, 1.25, 1.9],
      "views": [{"label": "front", "box": [333, 850, 562, 978], "cam": [0, 0, 1], "up": [0, 1, 0]}]
    },
    {
      "name": "boulder_m",
      "size_m": [2.88, 1.67, 2.5],
      "views": [{"label": "front", "box": [620, 811, 914, 981], "cam": [0, 0, 1], "up": [0, 1, 0]}]
    },
    {
      "name": "boulder_l",
      "size_m": [3.76, 1.95, 3.1],
      "views": [{"label": "front", "box": [958, 785, 1342, 984], "cam": [0, 0, 1], "up": [0, 1, 0]}]
    }
  ],
  "notes": "Set of seven lichen-covered granite boulders (Devils Marbles style): a long 11 m loaf, a split dome, a ball balanced on a slab, and four loose boulders about 1-2.8 m wide. Each sits on a red-dirt patch with dry grass. Scale bar: 1 m is about 102 px. Each boulder is drawn only once, as a near-level, slightly elevated view, so I treated each drawing as its front view. All depths (z) are guesses at about 0.55-0.9 of the width."
}
```

```js
function build(THREE) {
  const mats = {
    granite: new THREE.MeshStandardMaterial({ color: 0xaa785f, roughness: 0.95, metalness: 0 }),
    red_dirt: new THREE.MeshStandardMaterial({ color: 0xb4663f, roughness: 1, metalness: 0 }),
    dry_grass: new THREE.MeshStandardMaterial({ color: 0xc3a05f, roughness: 1, metalness: 0 })
  };
  function mesh(geo, name) {
    const m = new THREE.Mesh(geo, mats[name]);
    m.name = name;
    return m;
  }

  // fixed seeded sequence (same every run)
  let seed = 60606;
  function rnd() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  // superellipse boulder profile (radius 1), bottom -> top, y in metres relative to widest line
  function profile(up, down, pUp, pDown, nUp, nDown) {
    const pts = [new THREE.Vector2(0, -down)];
    for (let i = 1; i <= nDown; i++) {
      const a = (Math.PI / 2) * (1 - i / nDown);
      pts.push(new THREE.Vector2(Math.pow(Math.cos(a), 2 / pDown), -down * Math.pow(Math.sin(a), 2 / pDown)));
    }
    for (let i = 1; i < nUp; i++) {
      const a = (Math.PI / 2) * (i / nUp);
      pts.push(new THREE.Vector2(Math.pow(Math.cos(a), 2 / pUp), up * Math.pow(Math.sin(a), 2 / pUp)));
    }
    pts.push(new THREE.Vector2(0, up));
    return pts;
  }

  function blob(o) {
    const pts = profile(o.up, o.down, o.pUp, o.pDown, o.nUp, o.nDown);
    const m = mesh(new THREE.LatheGeometry(pts, o.seg), 'granite');
    m.position.set(o.x, o.yc, o.z || 0);
    m.scale.set(o.R, 1, o.Rz);
    return m;
  }

  // half of a split boulder: half-lathe plus a flat cut face, tilted about the base of the cut
  function halfBlob(o) {
    const pivot = new THREE.Group();
    pivot.position.set(o.xCut, 0, 0);
    pivot.rotation.z = o.tilt;
    const body = new THREE.Group();
    body.position.y = o.yc;
    body.scale.set(o.R, 1, o.Rz);
    pivot.add(body);
    const pts = profile(o.up, o.down, o.pUp, o.pDown, o.nUp, o.nDown);
    const phiStart = o.side > 0 ? 0 : Math.PI;
    body.add(mesh(new THREE.LatheGeometry(pts, o.seg, phiStart, Math.PI), 'granite'));
    const shape = new THREE.Shape();
    shape.moveTo(0, pts[0].y);
    for (let j = 1; j < pts.length; j++) shape.lineTo(pts[j].x, pts[j].y);
    for (let j = pts.length - 2; j >= 1; j--) shape.lineTo(-pts[j].x, pts[j].y);
    const cap = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false }), 'granite');
    cap.rotation.y = Math.PI / 2;
    cap.position.x = -0.01;
    body.add(cap);
    return pivot;
  }

  // low red-dirt mound under each boulder
  function dome(g, rx, rz, h, seg, hseg) {
    const m = mesh(new THREE.SphereGeometry(1, seg, hseg, 0, Math.PI * 2, 0, Math.PI / 2), 'red_dirt');
    m.scale.set(rx, h, rz);
    g.add(m);
    return { rx: rx, rz: rz, h: h };
  }

  // dry grass tufts: three open thin cones fanned out
  const coneGeo = new THREE.ConeGeometry(1, 1, 5, 1, true);
  function grass(g, d, spots) {
    const tilts = [-0.4, 0, 0.4];
    for (let s = 0; s < spots.length; s++) {
      const x = spots[s][0], z = spots[s][1], h = spots[s][2];
      const q = 1 - (x / d.rx) * (x / d.rx) - (z / d.rz) * (z / d.rz);
      const y0 = d.h * Math.sqrt(Math.max(0, q)) - 0.03;
      const rr = h * 0.16;
      for (let k = 0; k < 3; k++) {
        const tz = tilts[k] + (rnd() - 0.5) * 0.2;
        const tx = (rnd() - 0.5) * 0.5;
        const hh = h * (0.8 + rnd() * 0.3);
        const m = mesh(coneGeo, 'dry_grass');
        m.scale.set(rr, hh, rr);
        m.rotation.set(tx, 0, tz);
        const ux = -Math.sin(tz), uy = Math.cos(tz) * Math.cos(tx), uz = Math.cos(tz) * Math.sin(tx);
        const bx = x + (k - 1) * rr * 0.8;
        const bz = z + (rnd() - 0.5) * rr;
        m.position.set(bx + ux * hh / 2, y0 + uy * hh / 2, bz + uz * hh / 2);
        g.add(m);
      }
    }
  }

  // 1. long large boulder (~11 m loaf, high shoulder on the left, tapering tail on the right)
  const g1 = new THREE.Group();
  const d1 = dome(g1, 6.0, 4.3, 0.3, 24, 4);
  g1.add(blob({ x: -0.9, yc: 1.0, R: 4.75, Rz: 3.0, up: 3.2, down: 1.3, pUp: 2.7, pDown: 4, seg: 32, nUp: 10, nDown: 4 }));
  g1.add(blob({ x: 3.5, yc: 1.0, R: 1.85, Rz: 1.8, up: 2.15, down: 1.3, pUp: 2.0, pDown: 3, seg: 20, nUp: 8, nDown: 3 }));
  grass(g1, d1, [
    [-5.75, 0.6, 0.8], [-5.4, 1.6, 0.7], [-4.7, 2.5, 0.6], [-3.8, 3.1, 0.55], [-2.2, 3.4, 0.6],
    [-0.6, 3.5, 0.5], [0.9, 3.4, 0.6], [2.4, 3.1, 0.55], [3.8, 2.6, 0.6], [5.1, 1.6, 0.6],
    [5.55, 0.4, 0.65], [5.4, -1.0, 0.55], [2.0, -3.3, 0.5], [-2.5, -3.4, 0.5], [-5.4, -1.4, 0.6]
  ]);

  // 2. split boulder: two half-domes, the right half leaning away
  const g2 = new THREE.Group();
  const d2 = dome(g2, 3.6, 3.0, 0.2, 24, 4);
  g2.add(halfBlob({ xCut: -0.14, tilt: 0.0, side: -1, yc: 1.0, R: 2.85, Rz: 2.3, up: 1.8, down: 1.3, pUp: 2.5, pDown: 3, seg: 16, nUp: 8, nDown: 4 }));
  g2.add(halfBlob({ xCut: 0.0, tilt: -0.1, side: 1, yc: 1.0, R: 2.65, Rz: 2.2, up: 1.85, down: 1.3, pUp: 2.2, pDown: 3, seg: 16, nUp: 8, nDown: 4 }));
  grass(g2, d2, [
    [-3.3, 0.6, 1.0], [-2.9, 1.6, 0.8], [-2.0, 2.3, 0.6], [-0.6, 2.6, 0.5], [0.07, 1.9, 0.6],
    [1.2, 2.5, 0.7], [2.3, 2.0, 0.85], [3.0, 1.0, 0.9], [3.3, -0.2, 0.8], [-3.2, -0.9, 0.7],
    [0.0, -2.4, 0.6], [2.0, -2.2, 0.6]
  ]);

  // 3. balanced boulder: round ball resting on a flat slab
  const g3 = new THREE.Group();
  const d3 = dome(g3, 2.97, 2.6, 0.2, 24, 4);
  g3.add(blob({ x: -0.19, yc: 0.6, R: 2.33, Rz: 1.9, up: 0.85, down: 0.9, pUp: 3, pDown: 3, seg: 32, nUp: 7, nDown: 3 }));
  g3.add(blob({ x: 0.52, yc: 2.72, R: 1.67, Rz: 1.55, up: 1.51, down: 1.4, pUp: 2.3, pDown: 2.3, seg: 28, nUp: 8, nDown: 6 }));
  grass(g3, d3, [
    [-2.6, 0.5, 0.7], [-2.3, 1.4, 0.6], [-1.0, 2.1, 0.5], [0.6, 2.2, 0.55], [1.9, 1.6, 0.7],
    [2.45, 0.6, 1.1], [2.5, -0.6, 0.9], [-2.4, -1.0, 0.6], [0.3, -2.2, 0.5]
  ]);

  // 4. extra-small boulder (~1 m)
  const g4 = new THREE.Group();
  const d4 = dome(g4, 0.78, 0.7, 0.08, 16, 3);
  g4.add(blob({ x: -0.02, yc: 0.36, R: 0.53, Rz: 0.5, up: 0.5, down: 0.45, pUp: 2.4, pDown: 3.5, seg: 20, nUp: 6, nDown: 3 }));
  grass(g4, d4, [
    [-0.62, 0.15, 0.4], [-0.5, 0.45, 0.3], [0.6, 0.2, 0.35], [0.45, 0.48, 0.3], [0.0, 0.62, 0.22], [-0.3, -0.55, 0.3]
  ]);

  // 5. small boulder (~1.6 m)
  const g5 = new THREE.Group();
  const d5 = dome(g5, 1.12, 0.95, 0.1, 16, 3);
  g5.add(blob({ x: 0.06, yc: 0.6, R: 0.82, Rz: 0.75, up: 0.64, down: 0.7, pUp: 3, pDown: 3, seg: 20, nUp: 7, nDown: 3 }));
  grass(g5, d5, [
    [-0.9, 0.2, 0.55], [-0.75, 0.6, 0.45], [0.95, 0.15, 0.5], [0.75, 0.55, 0.4], [0.1, 0.8, 0.3],
    [-0.6, -0.6, 0.4], [0.5, -0.65, 0.35]
  ]);

  // 6. medium boulder (~2.2 m)
  const g6 = new THREE.Group();
  const d6 = dome(g6, 1.44, 1.25, 0.12, 20, 3);
  g6.add(blob({ x: -0.01, yc: 0.85, R: 1.12, Rz: 1.0, up: 0.8, down: 1.0, pUp: 2.4, pDown: 4, seg: 24, nUp: 8, nDown: 4 }));
  grass(g6, d6, [
    [-1.2, 0.2, 0.75], [-1.0, 0.65, 0.6], [1.2, 0.25, 0.7], [0.95, 0.7, 0.55], [0.1, 1.05, 0.4],
    [-0.6, -0.95, 0.5], [0.7, -0.9, 0.45]
  ]);

  // 7. large loose boulder (~2.8 m)
  const g7 = new THREE.Group();
  const d7 = dome(g7, 1.88, 1.55, 0.15, 20, 3);
  g7.add(blob({ x: 0.1, yc: 0.9, R: 1.42, Rz: 1.25, up: 1.03, down: 1.1, pUp: 2.3, pDown: 4, seg: 24, nUp: 8, nDown: 4 }));
  grass(g7, d7, [
    [-1.55, 0.25, 0.9], [-1.35, 0.75, 0.7], [1.65, 0.25, 0.85], [1.45, 0.8, 0.7], [0.1, 1.3, 0.45],
    [-0.7, 1.2, 0.4], [-0.9, -1.15, 0.55], [0.9, -1.15, 0.5]
  ]);

  return {
    boulder_long_large: g1,
    boulder_split: g2,
    boulder_balanced: g3,
    boulder_xs: g4,
    boulder_s: g5,
    boulder_m: g6,
    boulder_l: g7
  };
}
```