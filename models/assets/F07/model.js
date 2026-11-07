function build(THREE) {
  const COL = { termite_clay: 0xb05a3a, loose_soil: 0xa8653f, dry_grass: 0xb3a473 };
  const mats = {};
  function mat(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COL[name], roughness: 0.95, metalness: 0 });
    return mats[name];
  }
  function mesh(geo, name) {
    const m = new THREE.Mesh(geo, mat(name));
    m.name = name;
    return m;
  }
  let seed = 12345;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  function lathe(prof, segs) {
    return new THREE.LatheGeometry(prof.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), segs);
  }
  function radiusAt(prof, h) {
    if (h <= prof[1][1]) return prof[1][0];
    for (let i = 1; i < prof.length - 1; i++) {
      const a = prof[i], b = prof[i + 1];
      if (h >= a[1] && h <= b[1]) {
        const t = (h - a[1]) / Math.max(1e-6, b[1] - a[1]);
        return a[0] + (b[0] - a[0]) * t;
      }
    }
    return 0;
  }
  function heightAt(prof, r) {
    for (let i = 1; i < prof.length - 1; i++) {
      const a = prof[i], b = prof[i + 1];
      if (r <= a[0] && r >= b[0]) {
        const t = (a[0] - r) / Math.max(1e-6, a[0] - b[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return 0;
  }
  // bullet-shaped spire: base radius r0, height h, near-top radius rt
  function spireGeo(r0, h, rt) {
    return lathe([
      [0, 0], [r0, 0], [r0 * 0.92, h * 0.3], [(r0 + rt) / 2, h * 0.6],
      [rt * 1.1, h * 0.82], [rt * 0.9, h * 0.92], [rt * 0.5, h * 0.98], [0, h]
    ], 8);
  }

  const blob = new THREE.SphereGeometry(1, 8, 5);
  const blade = new THREE.ConeGeometry(1, 1, 3, 1, true);

  // ellipsoid rib / lump laid on a lathe body's surface, following its taper
  function addBlob(parent, prof, theta, hc, sx, sy, sz) {
    const R = radiusAt(prof, hc);
    const lo = Math.max(0, hc - 0.25), hi = hc + 0.25;
    const slope = (radiusAt(prof, lo) - radiusAt(prof, hi)) / (hi - lo);
    const piv = new THREE.Group();
    piv.rotation.y = theta;
    const m = mesh(blob, 'termite_clay');
    m.scale.set(sx, sy, sz);
    m.position.set(0, hc, R - sz * 0.55);
    m.rotation.x = -Math.atan(slope);
    piv.add(m);
    parent.add(piv);
  }
  function apron(parent, rTop, rBot, h) {
    const m = mesh(new THREE.CylinderGeometry(rTop, rBot, h, 16), 'loose_soil');
    m.position.y = h / 2;
    parent.add(m);
  }
  function tuft(parent, x, z, y, h, n, lean) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.8;
      const bh = h * (0.55 + rnd() * 0.45);
      const piv = new THREE.Group();
      piv.rotation.set(lean * (0.5 + rnd() * 0.7), a, 0, 'YXZ');
      const b = mesh(blade, 'dry_grass');
      const r = 0.008 + rnd() * 0.006;
      b.scale.set(r, bh, r);
      b.position.y = bh / 2;
      piv.add(b);
      g.add(piv);
    }
    parent.add(g);
  }
  function stalk(parent, x, z, y, len, tx, tz) {
    const piv = new THREE.Group();
    piv.position.set(x, y, z);
    piv.rotation.set(tx, 0, tz);
    const b = mesh(blade, 'dry_grass');
    b.scale.set(0.006, len, 0.006);
    b.position.y = len / 2;
    piv.add(b);
    parent.add(piv);
  }

  // ---------------- cathedral mound (left) ----------------
  const cat = new THREE.Group();
  const catProf = [[0, 0], [0.70, 0], [0.67, 0.15], [0.59, 0.5], [0.51, 1.0], [0.42, 1.5],
    [0.34, 2.0], [0.29, 2.4], [0.23, 2.7], [0.14, 2.88], [0, 2.95]];
  const tower = new THREE.Group();
  tower.rotation.z = -0.038; // slight lean to +x as on the sheet
  tower.position.y = 0.027;  // keep the tilted base edge on y = 0
  tower.add(mesh(lathe(catProf, 18), 'termite_clay'));
  for (let i = 0; i < 12; i++) {
    const L = 1.5 + rnd() * 0.8;
    addBlob(tower, catProf, i * Math.PI / 6 + (rnd() - 0.5) * 0.2, L / 2 + rnd() * 0.25,
      0.12 + rnd() * 0.04, L / 2, 0.08 + rnd() * 0.03);
  }
  for (let i = 0; i < 9; i++) {
    const L = 0.9 + rnd() * 0.5;
    addBlob(tower, catProf, (i + 0.5) * Math.PI * 2 / 9 + (rnd() - 0.5) * 0.3, 1.75 + rnd() * 0.3,
      0.09 + rnd() * 0.03, L / 2, 0.07);
  }
  cat.add(tower);
  // [x, z, baseY, topY, r0, rTop]
  const catSpires = [
    [-0.065, 0.0, 1.95, 3.195, 0.19, 0.10],
    [0.134, -0.06, 2.05, 3.09, 0.16, 0.085],
    [0.10, 0.13, 2.10, 2.93, 0.14, 0.08],
    [0.33, 0.0, 2.15, 2.93, 0.12, 0.07],
    [0.25, 0.15, 2.00, 2.70, 0.13, 0.075],
    [-0.02, -0.16, 2.10, 2.85, 0.14, 0.08]
  ];
  catSpires.forEach(function (s) {
    const m = mesh(spireGeo(s[4], s[3] - s[2], s[5]), 'termite_clay');
    m.position.set(s[0], s[2], s[1]);
    cat.add(m);
  });
  apron(cat, 0.74, 0.86, 0.06);
  tuft(cat, -0.76, 0.15, 0.02, 0.32, 7, 0.5);
  tuft(cat, -0.72, -0.25, 0.02, 0.25, 6, 0.5);
  tuft(cat, 0.76, 0.05, 0.02, 0.55, 7, 0.4);
  tuft(cat, 0.70, 0.35, 0.02, 0.30, 6, 0.5);
  tuft(cat, -0.45, 0.58, 0.02, 0.18, 5, 0.6);
  tuft(cat, 0.20, 0.68, 0.02, 0.15, 5, 0.6);

  // ---------------- twin-spired mound (middle) ----------------
  const spi = new THREE.Group();
  const spiProf = [[0, 0], [0.77, 0], [0.75, 0.15], [0.67, 0.4], [0.58, 0.7], [0.48, 0.9],
    [0.38, 1.12], [0.29, 1.30], [0.16, 1.42], [0, 1.47]];
  const spiBody = new THREE.Group();
  spiBody.rotation.z = -0.035;
  spiBody.position.y = 0.027; // keep the tilted base edge on y = 0
  spiBody.add(mesh(lathe(spiProf, 18), 'termite_clay'));
  // [theta, h, sx, sy, sz] lumps
  const lumps = [
    [-0.1, 0.99, 0.20, 0.16, 0.10], [0.4, 0.38, 0.18, 0.14, 0.10], [-0.77, 0.78, 0.16, 0.14, 0.09],
    [1.35, 0.65, 0.15, 0.18, 0.08], [-1.55, 0.30, 0.18, 0.15, 0.08], [3.0, 0.60, 0.20, 0.18, 0.10],
    [2.2, 1.0, 0.16, 0.14, 0.09]
  ];
  lumps.forEach(function (l) { addBlob(spiBody, spiProf, l[0], l[1], l[2], l[3], l[4]); });
  spi.add(spiBody);
  const spiSpires = [
    [-0.11, 0.05, 1.10, 1.60, 0.13, 0.075],
    [0.16, 0.0, 1.15, 1.84, 0.19, 0.11]
  ];
  spiSpires.forEach(function (s) {
    const m = mesh(spireGeo(s[4], s[3] - s[2], s[5]), 'termite_clay');
    m.position.set(s[0], s[2], s[1]);
    spi.add(m);
  });
  apron(spi, 0.78, 0.86, 0.06);
  tuft(spi, -0.74, 0.10, 0.02, 0.26, 6, 0.5);
  tuft(spi, -0.60, 0.45, 0.02, 0.15, 5, 0.6);
  tuft(spi, 0.76, 0.05, 0.02, 0.28, 6, 0.5);
  tuft(spi, 0.62, 0.45, 0.02, 0.14, 5, 0.6);
  tuft(spi, 0.0, -0.75, 0.02, 0.20, 5, 0.5);

  // ---------------- grassy dome mound (right) ----------------
  const dome = new THREE.Group();
  const domeProf = [[0, 0], [0.77, 0], [0.75, 0.1], [0.69, 0.28], [0.61, 0.46], [0.50, 0.60],
    [0.35, 0.69], [0.20, 0.735], [0, 0.75]];
  dome.add(mesh(lathe(domeProf, 20), 'termite_clay'));
  apron(dome, 0.76, 0.82, 0.03);
  // [x, z, height, blades, lean]
  const domeTufts = [
    [-0.20, 0.05, 0.40, 8, 0.45], [-0.05, -0.15, 0.32, 7, 0.45], [-0.36, 0.15, 0.26, 6, 0.5],
    [0.33, 0.05, 0.28, 7, 0.45], [0.55, -0.12, 0.26, 6, 0.5], [0.60, 0.28, 0.18, 5, 0.55],
    [-0.62, 0.0, 0.24, 6, 0.55], [-0.52, 0.38, 0.16, 5, 0.6], [-0.28, 0.62, 0.12, 5, 0.6],
    [0.42, 0.58, 0.12, 5, 0.6], [0.10, -0.50, 0.20, 6, 0.5], [0.76, 0.12, 0.14, 4, 0.6],
    [-0.76, 0.12, 0.14, 4, 0.6]
  ];
  domeTufts.forEach(function (t) {
    const y = heightAt(domeProf, Math.sqrt(t[0] * t[0] + t[1] * t[1])) - 0.02;
    tuft(dome, t[0], t[1], Math.max(0.01, y), t[2], t[3], t[4]);
  });
  // tall seed stalks: [x, z, len, tiltX, tiltZ]
  const stalks = [
    [-0.13, 0.02, 0.43, 0.05, 0.05], [-0.25, 0.05, 0.35, 0.0, 0.15], [0.0, -0.05, 0.33, -0.1, -0.12],
    [0.54, 0.0, 0.42, 0.0, -0.10], [0.60, 0.10, 0.30, 0.0, -0.30], [-0.55, 0.10, 0.30, 0.0, 0.30]
  ];
  stalks.forEach(function (s) {
    const y = heightAt(domeProf, Math.sqrt(s[0] * s[0] + s[1] * s[1])) - 0.02;
    stalk(dome, s[0], s[1], Math.max(0.01, y), s[2], s[3], s[4]);
  });

  return { cathedral_mound: cat, spired_mound: spi, dome_mound: dome };
}
