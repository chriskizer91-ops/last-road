```json
{"objects": [{"name": "bottle_tree", "size_m": [15.2, 12.3, 14.4],
  "views": [
    {"label": "Front", "box": [18, 38, 502, 432], "cam": [0, 0, 1], "up": [0, 1, 0]},
    {"label": "Side", "box": [537, 33, 1000, 432], "cam": [1, 0, 0], "up": [0, 1, 0]},
    {"label": "Back", "box": [1033, 38, 1516, 432], "cam": [0, 0, -1], "up": [0, 1, 0]},
    {"label": "Top", "box": [140, 488, 625, 945], "cam": [0, 1, 0], "up": [0, 0, -1]}
  ]}],
 "notes": "A giant baobab (bottle tree): a bell-shaped trunk about 9 m across above buttress roots, a dark hollow at the front base, a leafless crown with green buds and hanging seed pods, on a dirt patch. The 10 m bar measures about 31.9 px/m, giving roughly 15.2 m wide, 12.3 m tall and 14.4 m deep. Assumptions: the single side view is taken as +x, the top view has the front at the bottom, and the three-quarter view is left out."}
```

```js
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
    dirt: new THREE.MeshStandardMaterial({ color: 0xa66d47, roughness: 1.0, metalness: 0.0 }),
    dry_grass: new THREE.MeshStandardMaterial({ color: 0xbd9b5c, roughness: 1.0, metalness: 0.0, side: THREE.DoubleSide })
  };
  function add(geo, name, parent) {
    const m = new THREE.Mesh(geo, M[name]);
    m.name = name;
    (parent || tree).add(m);
    return m;
  }

  // ---------- ground patch (dirt disc under the tree) ----------
  const ground = add(new THREE.CylinderGeometry(7.2, 7.55, 0.1, 32, 1), 'dirt');
  ground.position.y = 0.05;
  ground.scale.z = 0.95;

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
    [2.58, 8.8], [2.18, 9.5], [1.78, 10.0], [1.28, 10.4], [0.68, 10.66], [0.0, 10.76]
  ];
  add(new THREE.LatheGeometry(v2(lowerProfile), SEG - 2, GAP, Math.PI * 2 - 2 * GAP), 'bark', trunk);
  add(new THREE.LatheGeometry(v2(upperProfile), SEG), 'bark', trunk);

  // hollow interior: dark back wall, side walls, ceiling (floor is the dirt disc)
  const hw = 0.84, zc = 3.55, zf = 4.43, hh = 2.6;
  const backWall = add(new THREE.CylinderGeometry(hw, hw, hh, 12, 1, true, Math.PI / 2, Math.PI), 'hollow_wood', trunk);
  backWall.position.set(0, hh / 2, zc);
  for (const sx of [-1, 1]) {
    const w = add(new THREE.BoxGeometry(0.06, hh, zf - zc), 'hollow_wood', trunk);
    w.position.set(sx * (hw + 0.03), hh / 2, (zc + zf) / 2);
  }
  const ceil = add(new THREE.BoxGeometry(2 * hw + 0.1, 0.08, zf - (zc - hw)), 'hollow_wood', trunk);
  ceil.position.set(0, 2.55, (zf + zc - hw) / 2);

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
    placeRoot(phi + rr(-0.04, 0.04), 4.6, 1.0, rr(6.2, 7.1), 0.0, rr(0.45, 0.6), 0.42);
  }

  // ---------- crown ----------
  const ZS = 0.95;
  function P(r, phi, y) { return new THREE.Vector3(r * Math.sin(phi), y, r * Math.cos(phi) * ZS); }
  function limb(pts, radius, ts, rs) {
    const c = new THREE.CatmullRomCurve3(pts);
    add(new THREE.TubeGeometry(c, ts, radius, rs, false), 'bark');
    return c;
  }
  const knotGeo1 = new THREE.SphereGeometry(1, 7, 5);
  const knotGeo2 = new THREE.SphereGeometry(0.25, 6, 4);
  const budGeo = new THREE.SphereGeometry(0.28, 5, 3);
  const podGeo = new THREE.SphereGeometry(1, 6, 4);
  const stalkGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 3, 1, true);

  const limbs = [];
  // outer spreading limbs leaving the shoulders
  for (let i = 0; i < 7; i++) {
    const phi = 0.25 + i * (Math.PI * 2 / 7) + rr(-0.12, 0.12);
    const bend = (i % 2 ? 1 : -1) * rr(0.04, 0.12);
    const rE = rr(3.8, 4.3), yE = rr(9.6, 10.2);
    const end = P(rE, phi + bend, yE);
    limb([P(0.6, phi, 8.9), P(1.7, phi, 9.3), P(2.9, phi + bend * 0.5, (9.3 + yE) / 2 + 0.05), end], 0.5, 8, 10);
    const kn = add(knotGeo1, 'bark');
    kn.scale.setScalar(0.53);
    kn.position.copy(end);
    limbs.push({ r: rE, phi: phi + bend, y: yE, outer: true });
  }
  // inner steep limbs rising from the neck
  for (let j = 0; j < 4; j++) {
    const phi = 0.9 + j * (Math.PI / 2) + rr(-0.15, 0.15);
    const rE = rr(2.1, 2.6), yE = rr(11.2, 11.45);
    const end = P(rE, phi, yE);
    limb([P(0.2, phi, 9.6), P(0.75, phi, 10.45), P(1.45, phi, 10.95), end], 0.4, 8, 10);
    const kn = add(knotGeo1, 'bark');
    kn.scale.setScalar(0.42);
    kn.position.copy(end);
    limbs.push({ r: rE, phi: phi, y: yE, outer: false });
  }

  // secondary branches, tertiary twigs, buds, hanging pods
  for (const L of limbs) {
    const specs = L.outer
      ? [[-0.30, 1.5, 0.15, 0], [0.02, 0.9, 0.95, 1], [0.30, 1.5, 0.25, 0]]
      : [[-0.35, 1.0, 0.25, 2], [0.35, 1.0, 0.25, 2]];
    for (const s of specs) {
      const d = s[0] + rr(-0.06, 0.06);
      const dr = s[1] * rr(0.85, 1.1);
      const dy = s[2] + rr(-0.1, 0.1);
      const kind = s[3];
      const r2 = L.r + dr, p2 = L.phi + d, y2 = L.y + dy;
      const e2 = P(r2, p2, y2);
      limb([P(L.r, L.phi, L.y), P(L.r + dr * 0.5, L.phi + d * 0.5, L.y + dy * 0.35), e2], 0.24, 6, 7);
      add(knotGeo2, 'bark').position.copy(e2);

      for (const side of [-1, 1]) {
        let dr3, dy3;
        if (kind === 0) { dr3 = rr(0.95, 1.35); dy3 = rr(0.1, 0.5); }
        else if (kind === 1) { dr3 = rr(0.5, 0.8); dy3 = rr(0.4, 0.7); }
        else { dr3 = rr(0.5, 0.9); dy3 = rr(0.05, 0.25); }
        const d3 = side * rr(0.45, 0.75) / r2;
        const r3 = r2 + dr3, p3 = p2 + d3, y3 = y2 + dy3;
        const c3 = limb([e2, P(r2 + dr3 * 0.5, p2 + d3 * 0.5, y2 + dy3 * 0.3), P(r3, p3, y3)], 0.1, 5, 4);

        const bud = add(budGeo, 'leaves');
        bud.position.copy(P(r3, p3, y3 + 0.05));
        bud.scale.set(1, 0.8, 1);

        if (kind === 0 && rand() < 0.6) {
          const hang = c3.getPoint(0.45);
          const ls = rr(0.9, 1.8);
          const st = add(stalkGeo, 'bark');
          st.scale.set(1, ls, 1);
          st.position.set(hang.x, hang.y - ls / 2, hang.z);
          const pod = add(podGeo, 'seed_pods');
          pod.scale.set(0.15, 0.3, 0.15);
          pod.position.set(hang.x, hang.y - ls - 0.26, hang.z);
        }
      }
    }
  }

  // ---------- dry grass tufts around the patch rim ----------
  const tuftGeo = new THREE.ConeGeometry(1, 1, 5, 1, true);
  for (let i = 0; i < 22; i++) {
    const a = i * (Math.PI * 2 / 22) + rr(-0.1, 0.1);
    const r = rr(5.9, 7.2);
    const h = rr(0.25, 0.5), rad = rr(0.18, 0.35);
    const t = add(tuftGeo, 'dry_grass');
    t.scale.set(rad, h, rad);
    t.position.set(r * Math.sin(a), 0.1 + h / 2, r * Math.cos(a) * 0.95);
  }

  return tree;
}
```