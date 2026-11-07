```json
{"objects": [
  {"name": "spire_capped", "size_m": [7.58, 10.73, 7.58],
   "views": [{"label": "front", "box": [25, 17, 338, 460], "cam": [0, 0, 1], "up": [0, 1, 0]}]},
  {"name": "mushroom", "size_m": [9.37, 6.25, 9.37],
   "views": [{"label": "front", "box": [365, 195, 752, 453], "cam": [0, 0, 1], "up": [0, 1, 0]}]},
  {"name": "hourglass", "size_m": [7.72, 9.54, 7.72],
   "views": [{"label": "front", "box": [783, 64, 1102, 458], "cam": [0, 0, 1], "up": [0, 1, 0]}]},
  {"name": "twin_spires", "size_m": [11.67, 10.05, 8.41],
   "views": [{"label": "front", "box": [30, 491, 512, 906], "cam": [0, 0, 1], "up": [0, 1, 0]}]},
  {"name": "stump", "size_m": [9.10, 7.17, 9.10],
   "views": [{"label": "front", "box": [530, 604, 906, 900], "cam": [0, 0, 1], "up": [0, 1, 0]}]},
  {"name": "stepped_tower", "size_m": [14.04, 17.97, 14.04],
   "views": [{"label": "front", "box": [925, 160, 1505, 902], "cam": [0, 0, 1], "up": [0, 1, 0]}]}
 ],
 "notes": "Six free-standing banded red/orange/cream hoodoos (capped spire, mushroom, hourglass, twin spires, flat stump, stepped tower), each on a scree apron. Scale bar 413 px = 10 m (41.3 px/m), so heights run from 6.3 to 18 m. Each is drawn only once, as a near-front view seen slightly from above. Depth is unknown: footprints are assumed round (depth = apron width), except the twin spires, whose apron is flattened to 0.72 of its width."}
```

```js
function build(THREE) {
  // Scale bar: 413 px = 10 m (41.3 px/m). All numbers below are metres read off the sheet.
  const COL = {
    banded_sandstone: 0xc9845c,
    pale_sandstone: 0xd9b384,
    caprock: 0xa77a58,
    caprock_dark: 0x6b4c36,
    scree: 0xb48b63,
    rubble: 0xa47458,
    dry_grass: 0xb5975a
  };
  const mats = {};
  function mesh(geo, name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COL[name] });
    const m = new THREE.Mesh(geo, mats[name]);
    m.name = name;
    return m;
  }
  let seed = 1;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function V(x, y) { return new THREE.Vector2(x, y); }
  function interp(keys, x) {
    if (x <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (x <= keys[i][0]) {
        const a = keys[i - 1], b = keys[i];
        const t = (x - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return keys[keys.length - 1][1];
  }
  // Eroded column: keys [[y, r], ...], resampled with small seeded banding (mostly inward)
  function column(keys, seg, jit, step) {
    const y0 = keys[0][0], y1 = keys[keys.length - 1][0];
    const n = Math.max(2, Math.round((y1 - y0) / step));
    const pts = [V(0, y0)];
    for (let i = 0; i <= n; i++) {
      const y = y0 + (y1 - y0) * i / n;
      let r = interp(keys, y);
      if (i > 0 && i < n) r *= 1 + jit * (rnd() - 0.6);
      pts.push(V(r, y));
    }
    pts.push(V(0, y1));
    return new THREE.LatheGeometry(pts, seg);
  }
  // Direct profile [[r, y], ...] listed bottom to top
  function lathe(prof, seg) {
    return new THREE.LatheGeometry(prof.map(p => V(p[0], p[1])), seg);
  }
  const SCREE_T = [[0, 1], [0.22, 0.95], [0.4, 0.78], [0.6, 0.45], [0.8, 0.18], [1, 0]];
  function screeY(d, R, h) { return interp(SCREE_T, Math.min(1, d / R)) * h; }
  function scree(R, h, sz) {
    const pts = [V(0, 0), V(R, 0)];
    for (let i = SCREE_T.length - 2; i >= 0; i--) pts.push(V(SCREE_T[i][0] * R, SCREE_T[i][1] * h));
    const m = mesh(new THREE.LatheGeometry(pts, 20), 'scree');
    m.scale.z = sz;
    return m;
  }
  function put(g, geo, name, x, ry, sz) {
    const m = mesh(geo, name);
    m.position.x = x;
    m.rotation.y = ry || 0;
    if (sz) m.scale.z = sz;
    g.add(m);
    return m;
  }
  const rockGeo = new THREE.SphereGeometry(0.5, 6, 4);
  const grassGeo = new THREE.ConeGeometry(0.3, 0.55, 5);
  function rubble(g, n, R, h, rIn, rOut, sMin, sMax, sz) {
    for (let i = 0; i < n; i++) {
      const a = (i + rnd() * 0.8) / n * Math.PI * 2;
      const d = rIn + (rOut - rIn) * rnd();
      const s = sMin + (sMax - sMin) * rnd();
      const m = mesh(rockGeo, 'rubble');
      m.scale.set(s * (0.9 + 0.4 * rnd()), s * (0.55 + 0.3 * rnd()), s * (0.9 + 0.4 * rnd()));
      m.rotation.set((rnd() - 0.5) * 0.6, rnd() * 6.28, (rnd() - 0.5) * 0.6);
      m.position.set(Math.sin(a) * d, screeY(d, R, h) + m.scale.y * 0.42, Math.cos(a) * d * sz);
      g.add(m);
    }
  }
  function grass(g, n, R, h, rad, sz) {
    for (let i = 0; i < n; i++) {
      const a = (i + 0.3 + rnd() * 0.5) / n * Math.PI * 2;
      const d = rad * (0.95 + 0.05 * rnd());
      const s = 0.8 + 0.6 * rnd();
      const m = mesh(grassGeo, 'dry_grass');
      m.scale.set(s, s, s);
      m.position.set(Math.sin(a) * d, screeY(d, R, h) + 0.25 * s, Math.cos(a) * d * sz);
      g.add(m);
    }
  }

  function spireCapped() {
    seed = 101;
    const g = new THREE.Group();
    const R = 3.79, h = 0.9;
    g.add(scree(R, h, 1));
    const p = put(g, column([[0, 2.3], [0.73, 2.06], [1.45, 1.74], [3.15, 1.38], [5.09, 0.99],
      [7.5, 0.70], [9.15, 0.60], [9.35, 0.60]], 14, 0.06, 0.4), 'banded_sandstone', -0.26, 0.2);
    p.rotation.z = -0.025; // slight lean toward +x, as drawn
    put(g, lathe([[0, 9.1], [0.7, 9.1], [1.05, 9.28], [1.19, 9.7], [1.16, 10.15], [0.95, 10.5],
      [0.55, 10.7], [0, 10.73]], 9), 'caprock_dark', -0.06, 0.35);
    rubble(g, 12, R, h, 2.1, 3.2, 0.35, 0.8, 1);
    grass(g, 4, R, h, 3.1, 1);
    return g;
  }

  function mushroom() {
    seed = 202;
    const g = new THREE.Group();
    const R = 4.69, h = 0.85;
    g.add(scree(R, h, 1));
    put(g, column([[0, 3.15], [0.8, 2.95], [1.53, 2.69], [2.74, 2.45], [4.07, 2.3], [4.45, 2.28]],
      16, 0.05, 0.35), 'banded_sandstone', 0.35, 0.1);
    put(g, lathe([[0, 4.25], [2.2, 4.25], [2.8, 4.38], [3.1, 4.72], [3.1, 5.1], [2.9, 5.6],
      [2.4, 6.0], [1.3, 6.2], [0, 6.25]], 12), 'caprock', 0.45, 0.2, 0.92);
    rubble(g, 14, R, h, 3.4, 4.1, 0.35, 0.8, 1);
    grass(g, 4, R, h, 4.0, 1);
    return g;
  }

  function hourglass() {
    seed = 303;
    const g = new THREE.Group();
    const R = 3.86, h = 0.85;
    g.add(scree(R, h, 1));
    put(g, column([[0, 2.7], [0.8, 2.42], [1.4, 2.1], [2.62, 1.7], [3.83, 1.27], [4.79, 0.97],
      [5.88, 0.75], [6.49, 0.82], [6.7, 0.9]], 14, 0.05, 0.35), 'banded_sandstone', 0.06, 0.15);
    put(g, lathe([[0, 6.6], [0.86, 6.6], [1.05, 6.9], [1.26, 7.2], [1.42, 7.6], [1.5, 7.94],
      [1.6, 8.3], [1.65, 8.55], [1.72, 8.9], [1.77, 9.2], [1.72, 9.42], [1.35, 9.5],
      [0.7, 9.54], [0, 9.53]], 13), 'pale_sandstone', 0.06, 0.4, 0.9);
    rubble(g, 12, R, h, 2.6, 3.25, 0.3, 0.75, 1);
    grass(g, 4, R, h, 3.25, 1);
    return g;
  }

  function twinSpires() {
    seed = 404;
    const g = new THREE.Group();
    const R = 5.84, h = 1.0, sz = 0.72;
    g.add(scree(R, h, sz));
    // left, shorter spire
    put(g, column([[0, 3.1], [1.36, 2.78], [2.57, 2.18], [3.78, 1.53], [4.99, 1.09], [6.2, 0.85],
      [6.6, 0.84]], 14, 0.05, 0.4), 'banded_sandstone', -2.47, 0.1, 0.9);
    put(g, lathe([[0, 6.45], [0.75, 6.45], [1.0, 6.6], [1.07, 6.85], [0.97, 7.12], [0.55, 7.27],
      [0, 7.29]], 9), 'caprock', -2.47, 0.5);
    // right, taller spire
    put(g, column([[0, 3.7], [0.87, 3.4], [1.84, 2.95], [3.05, 2.47], [4.5, 2.06], [6.44, 1.53],
      [8.38, 1.38], [8.85, 1.36]], 16, 0.05, 0.4), 'banded_sandstone', 1.53, 0.25);
    put(g, lathe([[0, 8.7], [1.2, 8.7], [1.5, 8.86], [1.6, 9.2], [1.52, 9.65], [1.1, 9.95],
      [0, 10.05]], 10), 'caprock', 1.53, 0.3);
    // saddle joining the two up to the col
    const sd = mesh(new THREE.CylinderGeometry(0.55, 1.6, 3.9, 8), 'banded_sandstone');
    sd.position.set(-0.8, 1.95, 0);
    g.add(sd);
    rubble(g, 16, R, h, 4.6, 5.3, 0.35, 0.7, sz);
    grass(g, 5, R, h, 4.95, sz);
    return g;
  }

  function stump() {
    seed = 505;
    const g = new THREE.Group();
    const R = 4.55, h = 0.75;
    g.add(scree(R, h, 1));
    put(g, column([[0, 3.6], [0.6, 3.45], [1.21, 3.27], [2.66, 2.9], [4.36, 2.62], [6.05, 2.3],
      [6.85, 2.17], [7.0, 2.1], [7.12, 1.9], [7.17, 1.3]], 11, 0.04, 0.35), 'banded_sandstone', 0.19, 0.15);
    rubble(g, 12, R, h, 3.75, 3.95, 0.3, 0.7, 1);
    grass(g, 4, R, h, 3.85, 1);
    return g;
  }

  function steppedTower() {
    seed = 606;
    const g = new THREE.Group();
    const R = 7.02, h = 1.3;
    g.add(scree(R, h, 1));
    // tier 1 (base) + ledge
    put(g, column([[0, 6.4], [1.0, 6.3], [1.74, 6.05], [3.44, 5.55], [5.1, 5.05]], 18, 0.04, 0.4),
      'banded_sandstone', 0.5, 0.1);
    put(g, lathe([[0, 4.7], [4.9, 4.7], [5.2, 4.9], [5.25, 5.15], [5.0, 5.4], [0, 5.4]], 18),
      'pale_sandstone', 0.9, 0.2);
    // tier 2 + ledge
    put(g, column([[5.2, 4.84], [6.83, 4.72], [7.9, 4.6]], 16, 0.04, 0.4), 'banded_sandstone', 0.85, 0.3);
    put(g, lathe([[0, 7.6], [4.6, 7.6], [4.85, 7.8], [4.85, 8.05], [4.6, 8.3], [0, 8.3]], 16),
      'pale_sandstone', 0.95, 0.1);
    // tier 3 + ledge
    put(g, column([[8.2, 3.2], [9.5, 3.17], [10.7, 3.12]], 14, 0.05, 0.4), 'banded_sandstone', 1.14, 0.2);
    put(g, lathe([[0, 10.45], [3.1, 10.45], [3.35, 10.65], [3.35, 10.95], [3.1, 11.15], [0, 11.15]], 14),
      'pale_sandstone', 1.23, 0.15);
    // tier 4 + ledge
    put(g, column([[11.0, 2.6], [13.85, 2.4], [14.6, 2.25]], 14, 0.05, 0.4), 'banded_sandstone', 1.0, 0.1);
    put(g, lathe([[0, 14.45], [2.15, 14.45], [2.35, 14.6], [2.35, 14.8], [2.15, 14.95], [0, 14.95]], 12),
      'pale_sandstone', 1.2, 0.25);
    // tier 5 (summit spire) + cap
    put(g, column([[14.8, 1.4], [16.5, 1.08], [17.25, 0.95]], 12, 0.05, 0.4), 'banded_sandstone', 1.1, 0.2);
    put(g, lathe([[0, 17.15], [0.7, 17.15], [0.87, 17.35], [0.85, 17.65], [0.6, 17.88], [0, 17.97]], 10),
      'pale_sandstone', 1.67, 0.3);
    rubble(g, 18, R, h, 6.0, 6.35, 0.4, 0.85, 1);
    grass(g, 5, R, h, 6.3, 1);
    return g;
  }

  return {
    spire_capped: spireCapped(),
    mushroom: mushroom(),
    hourglass: hourglass(),
    twin_spires: twinSpires(),
    stump: stump(),
    stepped_tower: steppedTower()
  };
}
```