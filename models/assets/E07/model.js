function build(THREE) {
  const COL = {
    weathered_wood: 0x7f7262,
    hemp_rope: 0xb39a74,
    rusty_iron: 0x7a4c32,
    muddy_iron: 0x9e6741,
    mud: 0xa47448,
    orange_rope: 0xbf6a3c,
    olive_canvas: 0x6b6a4b,
    red_canvas: 0xa8302c
  };
  const mats = {};
  function M(geo, name) {
    if (!mats[name]) {
      mats[name] = new THREE.MeshStandardMaterial({
        color: COL[name],
        roughness: 0.92,
        metalness: name.indexOf('iron') >= 0 ? 0.3 : 0.0
      });
    }
    const m = new THREE.Mesh(geo, mats[name]);
    m.name = name;
    return m;
  }
  const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
  function tube(pts, segs, r, radial, name) {
    const curve = new THREE.CatmullRomCurve3(pts.map(V));
    return M(new THREE.TubeGeometry(curve, segs, r, radial, false), name);
  }
  function rod(p1, p2, r, segs, name) {
    const a = V(p1), b = V(p2);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = M(new THREE.CylinderGeometry(r, r, len, segs), name);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
  }
  function extrudeXY(pts, opts) {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    return new THREE.ExtrudeGeometry(s, opts);
  }
  let seed = 20240607;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

  // ---------- wheel chocks (pair linked by hemp rope) ----------
  function buildChocks() {
    const g = new THREE.Group();
    g.name = 'wheel_chocks';
    const gap = 0.05, L = 0.196, H = 0.10, Ht = 0.022, flat = 0.02, D = 0.096, zBack = -0.070;
    [-1, 1].forEach((s) => {
      // tall end faces inward (toward x = 0), slope runs down to the outer thin end
      const prof = [[0, 0], [L, 0], [L, Ht], [flat, H], [0, H]].map((p) => [s * (gap + p[0]), p[1]]);
      const m = M(extrudeXY(prof, { depth: D, bevelEnabled: false }), 'weathered_wood');
      m.position.z = zBack; // spans z -0.070 .. 0.026
      g.add(m);
    });
    // rope leaves the front faces through the holes near the inner ends and sags forward onto the ground
    g.add(tube([
      [-0.081, 0.052, 0.016], [-0.080, 0.041, 0.034], [-0.071, 0.020, 0.051],
      [-0.045, 0.0075, 0.0625], [0, 0.0048, 0.0665], [0.045, 0.0075, 0.0625],
      [0.071, 0.020, 0.051], [0.080, 0.041, 0.034], [0.081, 0.052, 0.016]
    ], 24, 0.0045, 5, 'hemp_rope'));
    return g;
  }

  // ---------- screw-in ground anchor ----------
  function buildAnchor(name, mudTop, phase) {
    const g = new THREE.Group();
    g.name = name;
    // eye ring, ~4.7 cm across, top at 0.44
    const ring = M(new THREE.TorusGeometry(0.0178, 0.0055, 6, 16), 'rusty_iron');
    ring.position.y = 0.4165;
    g.add(ring);
    // shaft from tip base into the ring
    const shaft = M(new THREE.CylinderGeometry(0.007, 0.007, 0.367, 8, 1, true), 'rusty_iron');
    shaft.position.y = 0.035 + 0.1835;
    g.add(shaft);
    // collar just under the eye
    const collar = M(new THREE.CylinderGeometry(0.013, 0.013, 0.024, 8), 'rusty_iron');
    collar.position.y = 0.381;
    g.add(collar);
    // pointed tip
    const tip = M(new THREE.ConeGeometry(0.0075, 0.042, 8), 'muddy_iron');
    tip.rotation.x = Math.PI; // point down to y = 0
    tip.position.y = 0.021;
    g.add(tip);
    // helical flight from ~27 cm down to the tip, tapering toward the point
    const pts = [];
    const turns = 5, n = 40, yTop = 0.268, yBot = 0.042;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = phase + t * turns * Math.PI * 2;
      const y = yTop - t * (yTop - yBot);
      const r = 0.0135 - 0.005 * t * t;
      pts.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    }
    g.add(tube(pts, 40, 0.0055, 4, 'muddy_iron'));
    // caked mud packed between the lower flights
    const mh = mudTop - 0.045;
    const mud = M(new THREE.CylinderGeometry(0.0115, 0.0095, mh, 8, 1, true), 'mud');
    mud.position.y = 0.045 + mh / 2;
    g.add(mud);
    return g;
  }

  // ---------- coiled orange rope lying flat ----------
  function buildCoil(name, w, d, tail) {
    const g = new THREE.Group();
    g.name = name;
    const rr = 0.0095, sz = d / w, step = 0.015, lift = rr * 0.951;
    const R0 = w / 2 - rr;
    const ys = [0, 0.006, 0.003, 0.0085];
    for (let i = 0; i < 4; i++) {
      const t = M(new THREE.TorusGeometry(R0 - i * step, rr, 5, 16), 'orange_rope');
      t.rotation.x = Math.PI / 2;
      t.scale.set(1, sz, 1);
      const j = i === 0 ? 0 : 0.0024;
      t.position.set((rnd() - 0.5) * j, lift + ys[i], (rnd() - 0.5) * j);
      g.add(t);
    }
    if (tail) g.add(rod(tail[0], tail[1], rr, 6, 'orange_rope'));
    return g;
  }

  // ---------- olive canvas stake bag with drawstring ----------
  function buildBag() {
    const g = new THREE.Group();
    g.name = 'stake_bag';
    const outline = [
      [-0.112, 0.000], [0.115, 0.000], [0.124, 0.010], [0.122, 0.150], [0.115, 0.300],
      [0.107, 0.345], [0.093, 0.385], [0.068, 0.405], [0.050, 0.418], [0.058, 0.432],
      [0.030, 0.438], [0.000, 0.434], [-0.030, 0.438], [-0.060, 0.432], [-0.055, 0.418],
      [-0.074, 0.405], [-0.103, 0.385], [-0.115, 0.345], [-0.120, 0.300], [-0.122, 0.150],
      [-0.121, 0.010]
    ];
    const geo = extrudeXY(outline, {
      depth: 0.06, bevelEnabled: true, bevelThickness: 0.012,
      bevelSize: 0.008, bevelOffset: -0.008, bevelSegments: 2, curveSegments: 1
    });
    geo.translate(0, 0, -0.03);
    g.add(M(geo, 'olive_canvas'));
    // cord cinched around the neck
    const neck = M(new THREE.TorusGeometry(0.056, 0.004, 4, 12), 'hemp_rope');
    neck.rotation.x = Math.PI / 2;
    neck.scale.set(1, 0.8, 1);
    neck.position.y = 0.418;
    g.add(neck);
    // left drawstring, knot, frayed tassel
    g.add(tube([[-0.050, 0.420, 0.030], [-0.085, 0.400, 0.035], [-0.113, 0.365, 0.030],
      [-0.128, 0.320, 0.025], [-0.131, 0.292, 0.020]], 12, 0.004, 4, 'hemp_rope'));
    const kL = M(new THREE.SphereGeometry(0.0075, 6, 4), 'hemp_rope');
    kL.position.set(-0.131, 0.287, 0.020);
    g.add(kL);
    const tL = M(new THREE.ConeGeometry(0.009, 0.030, 6), 'hemp_rope');
    tL.position.set(-0.132, 0.266, 0.020);
    g.add(tL);
    // right drawstring, knot, frayed tassel
    g.add(tube([[0.050, 0.424, 0.030], [0.090, 0.408, 0.035], [0.120, 0.372, 0.030],
      [0.133, 0.325, 0.025], [0.137, 0.292, 0.020]], 12, 0.004, 4, 'hemp_rope'));
    const kR = M(new THREE.SphereGeometry(0.0075, 6, 4), 'hemp_rope');
    kR.position.set(0.137, 0.287, 0.020);
    g.add(kR);
    const tR = M(new THREE.ConeGeometry(0.009, 0.045, 6), 'hemp_rope');
    tR.position.set(0.139, 0.262, 0.020);
    g.add(tR);
    return g;
  }

  // ---------- red pitot cover with streamer, lying flat ----------
  function buildPitot() {
    const g = new THREE.Group();
    g.name = 'pitot_cover';
    const sleeve = M(new THREE.CylinderGeometry(0.024, 0.036, 0.12, 12), 'red_canvas');
    sleeve.rotation.z = -Math.PI / 2 - 0.07; // narrow cuff toward +x
    sleeve.scale.set(0.65, 1, 1);            // cloth sags flat
    sleeve.position.set(-0.051, 0.0199, -0.048);
    g.add(sleeve);
    // streamer outline in (x, z), extruded 3 mm upward
    const xz = [
      [0.000, -0.075], [0.066, -0.066], [0.097, -0.048], [0.111, -0.017], [0.105, 0.015],
      [0.070, 0.041], [0.013, 0.062], [-0.023, 0.083], [-0.034, 0.055], [0.009, 0.038],
      [0.058, 0.018], [0.080, 0.000], [0.081, -0.017], [0.070, -0.030], [0.043, -0.036],
      [0.000, -0.037]
    ];
    const strip = M(extrudeXY(xz.map((p) => [p[0], -p[1]]), { depth: 0.003, bevelEnabled: false }), 'red_canvas');
    strip.rotation.x = -Math.PI / 2;
    g.add(strip);
    return g;
  }

  return {
    wheel_chocks: buildChocks(),
    ground_anchor_1: buildAnchor('ground_anchor_1', 0.195, 0.0),
    ground_anchor_2: buildAnchor('ground_anchor_2', 0.135, 1.3),
    ground_anchor_3: buildAnchor('ground_anchor_3', 0.165, 2.6),
    rope_coil_1: buildCoil('rope_coil_1', 0.214, 0.184, [[-0.033, 0.0095, 0.074], [-0.045, 0.0095, 0.092]]),
    rope_coil_2: buildCoil('rope_coil_2', 0.206, 0.190, null),
    rope_coil_3: buildCoil('rope_coil_3', 0.213, 0.190, null),
    stake_bag: buildBag(),
    pitot_cover: buildPitot()
  };
}
