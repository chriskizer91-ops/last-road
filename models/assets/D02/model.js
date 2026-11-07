function build(THREE) {
  const tree = new THREE.Group();
  tree.name = 'bottle_tree';

  // fixed seeded sequence (mulberry32) so every run is identical
  let seed = 20402;
  function rand() {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function rr(a, b) { return a + (b - a) * rand(); }

  const M = {
    bark: new THREE.MeshStandardMaterial({ color: 0xa89a86, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide }),
    hollow_wood: new THREE.MeshStandardMaterial({ color: 0x33241a, roughness: 1.0, metalness: 0.0, side: THREE.DoubleSide }),
    leaves: new THREE.MeshStandardMaterial({ color: 0xb2b676, roughness: 0.9, metalness: 0.0 }),
    seed_pods: new THREE.MeshStandardMaterial({ color: 0x936843, roughness: 0.85, metalness: 0.0 }),
    dry_grass: new THREE.MeshStandardMaterial({ color: 0xbd9b5c, roughness: 1.0, metalness: 0.0, side: THREE.DoubleSide })
  };
  function add(geo, name, parent) {
    const m = new THREE.Mesh(geo, M[name]);
    m.name = name;
    (parent || tree).add(m);
    return m;
  }

  // ---------- trunk: bell / bottle shaped lathe, with a hollow at the front base ----------
  const HOLE = -0.065;               // hollow sits ~0.3 m left of centre on the front
  const trunk = new THREE.Group();
  trunk.name = 'trunk';
  trunk.rotation.y = HOLE;
  tree.add(trunk);

  const v2 = (arr) => arr.map((p) => new THREE.Vector2(p[0], p[1]));
  const SEG = 36;                    // 10 degree steps
  const GAP = Math.PI / 18;          // gap half-angle = one step, so rings line up
  const lowerProfile = [[4.64, 0.0], [4.62, 0.9], [4.58, 1.8], [4.53, 2.55]];
  const upperProfile = [
    [4.53, 2.55], [4.40, 3.3], [4.14, 4.4], [3.77, 5.6], [3.36, 6.8], [2.93, 7.9],
    [2.58, 8.8], [2.2, 9.5], [1.75, 9.95], [1.15, 10.2], [0.55, 10.32], [0.0, 10.36]
  ];
  add(new THREE.LatheGeometry(v2(lowerProfile), SEG - 2, GAP, Math.PI * 2 - 2 * GAP), 'bark', trunk);
  add(new THREE.LatheGeometry(v2(upperProfile), SEG), 'bark', trunk);

  // hollow interior: dark back wall, side walls, ceiling, floor
  const hw = 0.84, zc = 3.55, zf = 4.43, hh = 2.6;
  const backWall = add(new THREE.CylinderGeometry(hw, hw, hh, 12, 1, true, Math.PI / 2, Math.PI), 'hollow_wood', trunk);
  backWall.position.set(0, hh / 2, zc);
  for (const sx of [-1, 1]) {
    const w = add(new THREE.BoxGeometry(0.06, hh, zf - zc), 'hollow_wood', trunk);
    w.position.set(sx * (hw + 0.03), hh / 2, (zc + zf) / 2);
  }
  const ceil = add(new THREE.BoxGeometry(2 * hw + 0.1, 0.08, zf - (zc - hw)), 'hollow_wood', trunk);
  ceil.position.set(0, 2.55, (zf + zc - hw) / 2);
  const floor = add(new THREE.BoxGeometry(2 * hw + 0.1, 0.04, zf - (zc - hw)), 'hollow_wood', trunk);
  floor.position.set(0, 0.02, (zf + zc - hw) / 2);

  // bark lip framing the pointed-arch opening
  const sh = new THREE.Shape();
  sh.moveTo(-0.92, 0);
  sh.lineTo(-0.72, 0);
  sh.lineTo(-0.68, 1.0);
  sh.quadraticCurveTo(-0.6, 2.05, 0, 2.35);
  sh.quadraticCurveTo(0.6, 2.05, 0.68, 1.0);
  sh.lineTo(0.72, 0);
  sh.lineTo(0.92, 0);
  sh.lineTo(0.92, 2.65);
  sh.lineTo(-0.92, 2.65);
  sh.lineTo(-0.92, 0);
  const lip = add(new THREE.ExtrudeGeometry(sh, { depth: 0.35, bevelEnabled: false, curveSegments: 6 }), 'bark', trunk);
  lip.position.set(0, 0, 4.27);

  // ---------- buttress roots (elongated ellipsoids hugging the trunk base) ----------
  const rootGeo = new THREE.SphereGeometry(1, 8, 5);
  function placeRoot(phi, ra, ya, rb, yb, w, t) {
    const L = Math.hypot(rb - ra, yb - ya);
    const theta = Math.atan2(ra - rb, ya - yb);
    const m = add(rootGeo, 'bark');
    m.scale.set(w, L * 0.53, t);
    m.rotation.set(theta, phi, 0, 'YXZ');
    const rc = (ra + rb) / 2, yc = (ya + yb) / 2;
    m.position.set(rc * Math.sin(phi), yc, rc * Math.cos(phi));
  }
  const nRoots = 12;
  for (let k = 0; k < nRoots; k++) {
    const phi = HOLE + 0.45 + k * (Math.PI * 2 - 0.9) / (nRoots - 1) + rr(-0.05, 0.05);
    placeRoot(phi, 4.15, rr(2.8, 3.8), rr(5.1, 5.5), 0.3, rr(0.5, 0.75), 0.5);
    placeRoot(phi + rr(-0.04, 0.04), 4.6, 1.0, rr(6.2, 7.1), 0.15, rr(0.45, 0.6), 0.42);
  }

  // ---------- crown ----------
  const ZS = 0.95;
  function P(r, phi, y) { return new THREE.Vector3(r * Math.sin(phi), y, r * Math.cos(phi) * ZS); }

  // tapered branch: a unit-radius tube whose rings are resized from r0 (base) to r1 (tip)
  function branch(pts, r0, r1, ts, rs) {
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(curve, ts, 1, rs, false);
    const pos = g.attributes.position, nor = g.attributes.normal;
    for (let i = 0; i <= ts; i++) {
      const k1 = r0 + (r1 - r0) * (i / ts) - 1;
      for (let j = 0; j <= rs; j++) {
        const k = i * (rs + 1) + j;
        pos.setXYZ(k,
          pos.getX(k) + k1 * nor.getX(k),
          pos.getY(k) + k1 * nor.getY(k),
          pos.getZ(k) + k1 * nor.getZ(k));
      }
    }
    pos.needsUpdate = true;
    g.computeBoundingBox();
    g.computeBoundingSphere();
    add(g, 'bark');
    return curve;
  }

  const jointGeo = new THREE.SphereGeometry(1, 8, 5);
  function joint(p, r) {
    const s = add(jointGeo, 'bark');
    s.scale.setScalar(r);
    s.position.copy(p);
  }

  const forks = [];
  const podJobs = [];

  // six main limbs climbing out of the neck
  for (let i = 0; i < 6; i++) {
    const phi = 0.3 + i * Math.PI / 3 + rr(-0.1, 0.1);
    const b = rr(-0.12, 0.12);
    const rE = rr(3.4, 3.9), yE = rr(10.8, 11.15);
    const end = P(rE, phi + b, yE);
    branch([P(0.7, phi, 8.6), P(1.8, phi, 9.45), P(2.75, phi + b * 0.5, 10.35), end], 0.8, 0.33, 10, 12);
    joint(end, 0.35);
    forks.push({ r: rE, phi: phi + b, y: yE, kind: 'main' });
  }

  // three steep limbs from the crown centre
  for (let j = 0; j < 3; j++) {
    const phi = 1.0 + j * (Math.PI * 2 / 3) + rr(-0.2, 0.2);
    const rE = rr(1.6, 2.0), yE = rr(11.3, 11.55);
    const end = P(rE, phi, yE);
    branch([P(0.0, phi, 9.7), P(0.5, phi, 10.55), P(1.1, phi, 11.1), end], 0.5, 0.24, 8, 10);
    joint(end, 0.26);
    forks.push({ r: rE, phi: phi, y: yE, kind: 'up' });
  }

  // four lower side limbs leaving the shoulders, carrying pods
  const sidePhis = [0.82, 2.91, 3.96, 6.05];
  for (const p0 of sidePhis) {
    const phi = p0 + rr(-0.12, 0.12);
    const b = rr(-0.1, 0.1);
    const rE = rr(4.7, 5.1), yE = rr(9.0, 9.35);
    const end = P(rE, phi + b, yE);
    const c = branch([P(1.8, phi, 7.5), P(3.1, phi, 8.25), P(4.1, phi + b * 0.5, 8.7), end], 0.58, 0.26, 8, 10);
    joint(end, 0.28);
    podJobs.push({ p: c.getPoint(0.72), len: rr(1.1, 1.5) });
    forks.push({ r: rE, phi: phi + b, y: yE, kind: 'side' });
  }

  // secondary branches -> tertiary twigs -> buds, pods
  const SEC = {
    main: [[-0.9, 1.7, 0.5, 'a'], [0.1, 1.0, 0.65, 'c'], [0.9, 1.95, -0.1, 'b']],
    side: [[-0.7, 1.3, 0.35, 'd'], [0.7, 1.3, 0.45, 'd']],
    up: [[-0.8, 1.0, 0.3, 'c'], [0.8, 1.0, 0.3, 'c']]
  };
  const SECR = { main: [0.3, 0.13], side: [0.24, 0.11], up: [0.22, 0.11] };
  // [dr min, dr max, dy min, dy max] per twig kind
  const TER = { a: [0.8, 1.3, 0.0, 0.35], b: [0.9, 1.4, -0.4, 0.2], c: [0.35, 0.75, 0.05, 0.25], d: [0.5, 0.9, -0.3, 0.35] };
  const budGeo = new THREE.OctahedronGeometry(0.22, 0);

  for (const F of forks) {
    const flip = rand() < 0.5 ? -1 : 1;
    const start = P(F.r, F.phi, F.y);
    for (const s of SEC[F.kind]) {
      const dp = (flip * s[0] + rr(-0.12, 0.12)) / F.r;
      const dr = s[1] * rr(0.9, 1.1);
      const dy = s[2] + rr(-0.1, 0.1);
      const r2 = F.r + dr, p2 = F.phi + dp, y2 = F.y + dy;
      const e2 = P(r2, p2, y2);
      branch([start, P(F.r + dr * 0.5, F.phi + dp * 0.5, F.y + dy * 0.65), e2],
        SECR[F.kind][0], SECR[F.kind][1], 6, 7);

      const T = TER[s[3]];
      for (let t = 0; t < 3; t++) {
        const lat = (t - 1) * rr(0.5, 0.8) + rr(-0.1, 0.1);
        const dp3 = lat / r2;
        const dr3 = rr(T[0], T[1]), dy3 = rr(T[2], T[3]);
        const e3 = P(r2 + dr3, p2 + dp3, y2 + dy3);
        const c3 = branch([e2, P(r2 + dr3 * 0.5, p2 + dp3 * 0.5, y2 + dy3 * 0.6), e3], 0.11, 0.045, 4, 4);

        const bud = add(budGeo, 'leaves');
        bud.position.copy(e3);
        bud.rotation.set(rr(0, 1), rr(0, 3), 0);
        bud.scale.set(1, 0.8, 1).multiplyScalar(rr(0.8, 1.15));

        if ((s[3] === 'b' || s[3] === 'd') && rand() < 0.55) {
          podJobs.push({ p: c3.getPoint(rr(0.35, 0.7)), len: rr(0.35, 1.0) });
        }
      }
    }
  }

  // hanging seed pods on short stalks
  const podGeo = new THREE.SphereGeometry(1, 6, 4);
  const stalkGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 3, 1, true);
  let pods = 0;
  for (const J of podJobs) {
    if (pods >= 34) break;
    const st = add(stalkGeo, 'bark');
    st.scale.set(1, J.len, 1);
    st.position.set(J.p.x, J.p.y - J.len / 2, J.p.z);
    const pod = add(podGeo, 'seed_pods');
    pod.scale.set(0.16, 0.32, 0.16);
    pod.position.set(J.p.x, J.p.y - J.len - 0.28, J.p.z);
    pods++;
  }

  // ---------- dry grass tufts around the root ends ----------
  const tuftGeo = new THREE.ConeGeometry(1, 1, 5, 1, true);
  for (let i = 0; i < 22; i++) {
    const a = i * (Math.PI * 2 / 22) + rr(-0.1, 0.1);
    const r = rr(5.6, 7.0);
    const h = rr(0.25, 0.5), rad = rr(0.18, 0.35);
    const t = add(tuftGeo, 'dry_grass');
    t.scale.set(rad, h, rad);
    t.position.set(r * Math.sin(a), h / 2, r * Math.cos(a) * 0.95);
  }

  return tree;
}
