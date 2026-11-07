function build(THREE) {
  const COLORS = {
    bark: 0x5c4a36,
    leaves: 0x4a6030,
    leaves_light: 0x7b8b3b,
    lichen: 0xaab093,
    fern: 0x5e7c2f,
    moss: 0x6f7936
  };
  const MATS = {};
  function mesh(geo, name) {
    if (!MATS[name]) {
      MATS[name] = new THREE.MeshStandardMaterial({ color: COLORS[name], roughness: 0.95, metalness: 0 });
    }
    const m = new THREE.Mesh(geo, MATS[name]);
    m.name = name;
    return m;
  }

  // fixed seeded sequence (same every run)
  let seed = 20240610;
  function rnd() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const UP = V(0, 1, 0);
  const blobGeo = new THREE.SphereGeometry(1, 7, 5);
  const strandGeo = new THREE.ConeGeometry(1, 1, 5, 1, false);
  const frondGeo = new THREE.ConeGeometry(0.14, 1, 4, 1, false);

  // tapered cylinder from a to b
  function cyl(g, a, b, r0, r1, radial, name) {
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    if (len < 1e-4) return;
    const geo = new THREE.CylinderGeometry(r1, r0, len + Math.min(r0, r1) * 0.8, radial, 1, false);
    const m = mesh(geo, name);
    m.position.addVectors(a, b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, d.normalize());
    g.add(m);
  }

  // a branch / trunk / root: chain of tapered cylinders along a smooth curve
  function limb(g, pts, radii, nSeg, radial, name) {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => V(p[0], p[1], p[2])));
    const rAt = t => {
      const f = t * (radii.length - 1);
      const i = Math.min(Math.floor(f), radii.length - 2);
      const u = f - i;
      return radii[i] * (1 - u) + radii[i + 1] * u;
    };
    let prev = curve.getPoint(0);
    for (let s = 1; s <= nSeg; s++) {
      const p = curve.getPoint(s / nSeg);
      cyl(g, prev, p, rAt((s - 1) / nSeg), rAt(s / nSeg), radial, name || 'bark');
      prev = p;
    }
    return curve;
  }

  // buttressed base of the trunk
  function flare(g, bz, prof, segs) {
    const geo = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), segs);
    const m = mesh(geo, 'bark');
    m.position.set(0, 0, bz);
    g.add(m);
  }

  // surface roots radiating from the trunk base
  function roots(g, bz, n, reaches, h0, inner, mid, midH, rads) {
    const half = n / 2;
    for (let i = 0; i < n; i++) {
      const a = i * 2 * Math.PI / n + ((i % half) === 0 ? 0 : (rnd() - 0.5) * 0.35);
      const sx = Math.sin(a), sz = Math.cos(a);
      const R = reaches[i] - rads[2];
      limb(g, [
        [sx * inner, h0, bz + sz * inner],
        [sx * mid, midH, bz + sz * mid],
        [sx * R, rads[2] + 0.01, bz + sz * R]
      ], rads, 3, 6, 'bark');
    }
  }

  function blob(g, x, y, z, sx, sy, sz, name) {
    const m = mesh(blobGeo, name);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    g.add(m);
    return m;
  }

  // hanging lichen strand (old man's beard), tip down
  function strand(g, x, y, z, len, r) {
    const m = mesh(strandGeo, 'lichen');
    m.scale.set(r, len, r);
    m.rotation.x = Math.PI;
    m.position.set(x, y - len / 2, z);
    g.add(m);
  }

  // epiphytic fern: fan of flattened fronds
  function fern(g, p, az, size, upward) {
    for (let k = 0; k < 7; k++) {
      const a = az + (k - 3) * 0.5 + (rnd() - 0.5) * 0.3;
      const el = (upward ? 0.7 : 0.15) + rnd() * 0.5;
      const v = V(Math.cos(el) * Math.sin(a), Math.sin(el), Math.cos(el) * Math.cos(a));
      const L = size * (0.75 + rnd() * 0.4);
      const m = mesh(frondGeo, 'fern');
      m.scale.set(size, L, size * 0.3);
      m.quaternion.setFromUnitVectors(UP, v);
      m.position.set(p[0] + v.x * L / 2, p[1] + v.y * L / 2, p[2] + v.z * L / 2);
      g.add(m);
    }
  }

  // foliage: each lobe = a core ellipsoid + leaf clumps on its surface
  function crown(g, lobes, n, rcBase, prob, lichLen, sr) {
    for (const L of lobes) {
      const cx = L[0], cy = L[1], cz = L[2], rx = L[3], ry = L[4], rz = L[5];
      blob(g, cx, cy, cz, rx * 0.8, ry * 0.8, rz * 0.8, 'leaves');
      const cap = Math.min(rx, ry / 0.8, rz) * 0.75;
      for (let i = 0; i < n; i++) {
        const dy = 1 - 2 * (i + 0.5) / n;
        const rr = Math.sqrt(Math.max(0, 1 - dy * dy));
        const th = i * 2.39996 + rnd() * 0.6 + cx * 0.7 + cz * 1.3;
        const dx = Math.cos(th) * rr, dz = Math.sin(th) * rr;
        const rc = Math.min(rcBase * (0.8 + rnd() * 0.4), cap);
        const px = cx + dx * Math.max(rx - rc, 0.05);
        const py = cy + dy * Math.max(ry - rc * 0.8, 0.05);
        const pz = cz + dz * Math.max(rz - rc, 0.05);
        const light = dy > 0.2 && rnd() < 0.45;
        blob(g, px, py, pz, rc, rc * 0.8, rc, light ? 'leaves_light' : 'leaves');
        if (dy < -0.3 && rnd() < prob) {
          strand(g, px + (rnd() - 0.5) * rc, py - rc * 0.5, pz + (rnd() - 0.5) * rc,
            lichLen * (0.5 + rnd() * 0.7), sr * (0.8 + rnd() * 0.5));
        }
      }
    }
  }

  function largeTree() {
    const g = new THREE.Group();
    g.name = 'large_tree';
    const bz = -2.3;
    flare(g, bz, [[1.45, 0], [1.2, 0.2], [1.0, 0.5], [0.9, 0.9], [0.84, 1.5]], 12);
    roots(g, bz, 8, [2.45, 2.2, 2.0, 2.3, 2.55, 2.1, 1.9, 2.35], 1.5, 0.55, 1.3, 0.5, [0.42, 0.24, 0.07]);

    // trunk: rises, leans, then bends hard toward +z under the crown
    limb(g, [[0, 0.5, bz], [0, 1.4, -2.4], [0, 2.6, -2.3], [0, 3.5, -1.85], [0, 4.05, -0.8],
             [0, 4.45, 0.3], [0.1, 5.3, 0.75], [0.1, 6.6, 0.45], [0, 7.6, 0.2]],
         [0.9, 0.8, 0.7, 0.6, 0.52, 0.46, 0.38, 0.28, 0.18], 12, 10);

    // main limbs
    limb(g, [[0.1, 3.4, -2.2], [0.3, 4.5, -2.7], [0.3, 5.6, -3.1], [0.5, 6.7, -3.0], [0.4, 7.5, -2.7]], [0.38, 0.12], 4, 6);
    const b2 = limb(g, [[0, 4.4, 0.5], [0.1, 4.55, 1.5], [0.2, 4.65, 2.5], [0.3, 5.0, 3.5], [0.3, 5.5, 4.3]], [0.3, 0.08], 4, 6);
    limb(g, [[0, 5.2, 0.6], [-0.4, 6.3, -0.4], [-0.5, 7.3, -1.3], [-0.4, 8.0, -1.8]], [0.28, 0.1], 3, 6);
    limb(g, [[0, 4.7, 0.4], [-1.1, 5.4, 0.5], [-2.2, 6.1, 0.4], [-3.0, 6.6, 0.2]], [0.26, 0.08], 3, 6);
    limb(g, [[0, 4.2, -0.4], [1.1, 4.9, -0.6], [2.2, 5.7, -0.6], [3.0, 6.3, -0.5]], [0.26, 0.08], 3, 6);
    limb(g, [[0.1, 6.0, 0.65], [0.3, 7.0, 1.4], [0.2, 7.8, 2.2]], [0.22, 0.08], 3, 6);
    limb(g, [[0.2, 3.8, -1.6], [1.1, 4.6, -2.3], [1.8, 5.5, -2.9]], [0.24, 0.08], 3, 6);
    limb(g, [[-0.2, 3.6, -1.9], [-1.0, 4.6, -2.6], [-1.6, 5.5, -3.2]], [0.24, 0.08], 3, 6);
    limb(g, [[0.2, 5.0, 0.8], [0.6, 5.6, 2.0], [0.4, 6.2, 3.1]], [0.22, 0.08], 3, 6);

    // crown lobes [x, y, z, rx, ry, rz]
    crown(g, [
      [0, 7.7, -0.6, 3.2, 1.45, 2.6],
      [0.2, 7.6, -3.0, 2.6, 1.2, 1.5],
      [-0.2, 5.9, -2.95, 2.5, 1.1, 1.05],
      [0, 7.7, 2.2, 2.9, 0.95, 1.5],
      [0.2, 6.1, 3.4, 2.6, 1.25, 1.5],
      [0, 5.9, 0.4, 2.7, 1.2, 2.2],
      [-2.5, 6.9, 0.2, 1.4, 1.4, 2.6],
      [2.5, 7.0, -0.5, 1.4, 1.4, 2.6]
    ], 12, 0.85, 0.6, 1.0, 0.08);

    // lichen hanging from the long right limb and under the crown edges
    for (let k = 0; k < 7; k++) {
      const p = b2.getPoint(0.2 + k * 0.1);
      strand(g, p.x + (rnd() - 0.5) * 0.4, p.y - 0.12, p.z, 0.5 + rnd() * 0.7, 0.07);
    }
    for (let k = 0; k < 4; k++) strand(g, -0.8 + k * 0.6, 5.1, -3.5 + k * 0.2, 0.6 + rnd() * 0.5, 0.07);
    for (let k = 0; k < 3; k++) strand(g, -0.5 + k * 0.7, 5.1, 3.0 + k * 0.4, 0.4 + rnd() * 0.4, 0.06);

    // ferns on the trunk and the bend
    fern(g, [0.15, 3.55, -2.75], Math.PI, 0.95, false);
    fern(g, [0.3, 2.75, -2.95], Math.PI - 0.4, 0.75, false);
    fern(g, [0.2, 4.45, -1.0], 0, 0.8, true);
    fern(g, [-0.75, 3.4, -2.3], -Math.PI / 2, 0.8, false);
    fern(g, [0.75, 1.1, -2.1], Math.PI / 2, 0.5, false);

    // moss cushions on the bend
    blob(g, 0, 4.25, -1.2, 0.45, 0.22, 0.7, 'moss');
    blob(g, 0.35, 3.0, -2.75, 0.35, 0.45, 0.25, 'moss');
    return g;
  }

  function smallTree() {
    const g = new THREE.Group();
    g.name = 'small_tree';
    const bz = -2.48;
    flare(g, bz, [[0.72, 0], [0.58, 0.12], [0.46, 0.32], [0.4, 0.62], [0.36, 0.95]], 10);
    roots(g, bz, 6, [1.28, 1.0, 0.9, 1.22, 0.95, 1.1], 0.75, 0.28, 0.7, 0.25, [0.2, 0.12, 0.045]);

    // leaning trunk
    limb(g, [[0, 0.3, bz], [0, 1.1, -2.4], [0, 2.06, -2.16], [0, 3.03, -1.76], [0.05, 3.6, -1.25]],
         [0.4, 0.34, 0.3, 0.26, 0.2], 6, 8);

    // wind-swept limbs streaming toward +z (and swinging toward +x at the tip)
    limb(g, [[0, 3.5, -1.3], [0.2, 3.95, -0.4], [0.5, 4.3, 0.8], [0.9, 4.6, 2.1], [1.3, 4.8, 3.2]], [0.18, 0.04], 4, 6);
    limb(g, [[0, 3.4, -1.4], [-0.5, 3.7, -0.4], [-0.9, 3.8, 0.4], [-1.1, 3.85, 0.9]], [0.15, 0.04], 3, 6);
    limb(g, [[0, 3.55, -1.3], [0.8, 3.95, -0.6], [1.4, 4.25, 0.5], [1.8, 4.5, 1.6]], [0.14, 0.04], 3, 6);
    limb(g, [[0, 3.4, -1.5], [-0.1, 3.9, -1.5], [0.1, 4.2, -1.1]], [0.13, 0.04], 3, 6);
    const droop = limb(g, [[0, 3.45, -1.1], [0.2, 3.35, -0.5], [0.3, 2.85, -0.15], [0.3, 2.2, -0.25]], [0.1, 0.03], 3, 6);
    limb(g, [[-0.3, 3.6, 0.1], [-0.45, 3.1, 0.15], [-0.5, 2.4, 0.1]], [0.07, 0.03], 3, 6);
    limb(g, [[0, 2.8, -1.95], [0.7, 3.3, -2.0], [1.1, 3.7, -1.8]], [0.1, 0.03], 3, 6);
    limb(g, [[0, 3.0, -1.85], [-0.8, 3.5, -2.0], [-1.3, 3.9, -1.7]], [0.1, 0.03], 3, 6);

    // sheared crown: a wedge, deep and low by the trunk, thin and highest at the +z tip,
    // footprint widest near z=0 (bulging to -x) and the tip swung toward +x
    crown(g, [
      [0.3, 3.85, -1.2, 1.3, 0.5, 0.7],
      [-0.05, 4.1, 0.2, 2.25, 0.75, 1.1],
      [0.5, 4.35, 1.5, 1.8, 0.7, 1.05],
      [1.1, 4.65, 2.6, 1.2, 0.5, 0.85],
      [1.45, 4.85, 3.35, 0.6, 0.32, 0.45],
      [-0.4, 3.55, 0.6, 1.5, 0.35, 0.9]
    ], 10, 0.5, 0.5, 0.5, 0.045);

    // lichen on the drooping branchlets and under the crown
    for (let k = 0; k < 4; k++) {
      const p = droop.getPoint(0.4 + k * 0.2);
      strand(g, p.x + (rnd() - 0.5) * 0.3, p.y - 0.05, p.z + (rnd() - 0.5) * 0.2, 0.25 + rnd() * 0.2, 0.04);
    }
    strand(g, 0.5, 3.25, 0.9, 0.3 + rnd() * 0.3, 0.045);
    strand(g, -0.8, 3.25, 0.5, 0.3 + rnd() * 0.3, 0.045);
    strand(g, 0.8, 3.7, 1.9, 0.3 + rnd() * 0.3, 0.045);
    strand(g, 1.2, 4.2, 2.8, 0.25 + rnd() * 0.25, 0.04);

    // ferns and moss on the trunk
    fern(g, [0, 1.5, -2.62], Math.PI, 0.4, false);
    fern(g, [-0.3, 2.5, -2.05], -Math.PI / 2, 0.45, false);
    blob(g, 0, 3.3, -1.55, 0.3, 0.2, 0.4, 'moss');
    return g;
  }

  return { large_tree: largeTree(), small_tree: smallTree() };
}
