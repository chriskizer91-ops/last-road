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
  // Eroded core with a drifting axis: keys [[y, leftEdge, rightEdge], ...] as seen in the front view.
  // Key heights are kept exactly (so short key gaps stay sharp steps); the axis follows the edge midpoints.
  function core(keys, seg, jit, step) {
    const cKeys = keys.map(k => [k[0], (k[1] + k[2]) / 2]);
    const pts = [V(0, keys[0][0])];
    for (let i = 0; i < keys.length; i++) {
      pts.push(V((keys[i][2] - keys[i][1]) / 2, keys[i][0]));
      if (i < keys.length - 1) {
        const a = keys[i], b = keys[i + 1];
        const n = Math.max(1, Math.round((b[0] - a[0]) / step));
        for (let j = 1; j < n; j++) {
          const t = j / n;
          const y = a[0] + (b[0] - a[0]) * t;
          const r = ((a[2] - a[1]) * (1 - t) + (b[2] - b[1]) * t) / 2;
          pts.push(V(r * (1 + jit * (rnd() - 0.6)), y));
        }
      }
    }
    pts.push(V(0, keys[keys.length - 1][0]));
    const geo = new THREE.LatheGeometry(pts, seg);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) + interp(cKeys, pos.getY(i)));
    pos.needsUpdate = true;
    return geo;
  }
  // Direct profile [[r, y], ...] listed bottom to top
  function lathe(prof, seg) {
    return new THREE.LatheGeometry(prof.map(p => V(p[0], p[1])), seg);
  }
  // Thin overhanging caprock ledge between y0 and y1
  function ledge(y0, y1, r, seg) {
    const t = y1 - y0;
    return lathe([[0, y0], [r - 0.3, y0], [r - 0.05, y0 + 0.3 * t], [r, y0 + 0.6 * t],
      [r - 0.2, y1], [0, y1]], seg);
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
    // flat-topped slab: stays near full width almost to the top, as drawn
    put(g, lathe([[0, 4.25], [2.2, 4.25], [2.8, 4.38], [3.1, 4.72], [3.1, 5.15], [3.0, 5.6],
      [2.7, 6.0], [1.8, 6.2], [0, 6.25]], 12), 'caprock', 0.45, 0.2, 0.92);
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
    // One continuous eroded core. Keys are [y, left edge, right edge] read off the sheet:
    // the left flank is a steady slope, the right flank steps back under each ledge,
    // so the axis drifts from +0.45 m at the ground to +1.5 m at the summit.
    put(g, core([
      [0, -6.1, 7.0], [1.0, -5.8, 6.75], [3.5, -5.0, 6.15], [4.2, -4.75, 6.0], [4.6, -4.6, 5.6],
      [5.5, -4.3, 5.5], [5.9, -4.0, 5.45], [7.0, -3.7, 5.35], [7.4, -3.6, 4.45], [8.5, -3.35, 4.35],
      [8.9, -3.05, 4.35], [10.8, -2.0, 4.2], [11.2, -1.6, 3.65], [14.5, -1.1, 3.5], [14.9, -0.5, 2.9],
      [17.0, 0.7, 2.3], [17.25, 0.85, 2.2]
    ], 20, 0.04, 0.4), 'banded_sandstone', 0);
    // Harder caprock ledges, staggered as drawn: [y0, y1, centre x, radius]
    // right @4.4, left @5.7, right @7.2, left @8.7, near-full rings @11 and @14.7
    const LEDGES = [
      [4.15, 4.8, 0.9, 5.4],
      [5.4, 6.0, 0.15, 4.65],
      [6.95, 7.55, 1.275, 4.575],
      [8.4, 8.95, 0.125, 3.875],
      [10.55, 11.3, 1.2, 3.5],
      [14.4, 14.95, 1.175, 2.575]
    ];
    LEDGES.forEach((l, i) => put(g, ledge(l[0], l[1], l[3], 18), 'pale_sandstone', l[2], 0.3 * i));
    // summit cap
    put(g, lathe([[0, 17.15], [0.7, 17.15], [0.87, 17.35], [0.85, 17.65], [0.6, 17.88], [0, 17.97]], 10),
      'pale_sandstone', 1.67, 0.3);
    rubble(g, 18, R, h, 6.3, 6.65, 0.35, 0.75, 1);
    grass(g, 5, R, h, 6.6, 1);
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
