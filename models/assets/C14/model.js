function build(THREE) {
  const root = new THREE.Group();
  root.name = 'causeway_gate';
  const g = new THREE.Group();
  g.position.z = -0.4; // centre the footprint (stairs at front, apron at back)
  root.add(g);

  const COLORS = {
    stone: 0x786850,
    timber: 0x6b5a46,
    rubble: 0x8a7e70,
    bark: 0x6d5f4e,
    foliage: 0x7e8a3e,
    dry_grass: 0xc49a55
  };
  const mats = {};
  function mat(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name], roughness: 0.95, metalness: 0.0 });
    return mats[name];
  }
  function add(geo, name, x, y, z) {
    const m = new THREE.Mesh(geo, mat(name));
    m.name = name;
    m.position.set(x, y, z);
    g.add(m);
    return m;
  }
  function box(name, x0, x1, y0, y1, z0, z1) {
    const ax = Math.min(x0, x1), bx = Math.max(x0, x1);
    const az = Math.min(z0, z1), bz = Math.max(z0, z1);
    return add(new THREE.BoxGeometry(bx - ax, y1 - y0, bz - az), name, (ax + bx) / 2, (y0 + y1) / 2, (az + bz) / 2);
  }
  function extrude(name, pts, z0, z1) {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    const geo = new THREE.ExtrudeGeometry(s, { depth: z1 - z0, bevelEnabled: false, steps: 1, curveSegments: 1 });
    return add(geo, name, 0, 0, z0);
  }

  // ---------------- WINGS (slim causeway embankment with one culvert each) ----------------
  const HW = 2.45;   // wing body top (road surface)
  const HC = 2.6;    // coping top
  const WZ0 = -1.9, WZ1 = 1.45;          // back / front faces of the wings (local)
  const C0 = 4.2, C1 = 6.62, CH = 1.66;  // culvert span and height
  for (const s of [-1, 1]) {
    const pts = [
      [3.0, 0], [C0, 0], [C0, CH], [C1, CH], [C1, 0],
      [11.05, 0], [10.5, HW], [3.0, HW]
    ].map(p => [p[0] * s, p[1]]);
    extrude('stone', pts, WZ0, WZ1);
    // coping kerbs along front and back edges of the road
    box('stone', 3.0 * s, 9.7 * s, HW, HC, WZ1 - 0.4, WZ1 + 0.08);
    box('stone', 3.0 * s, 9.7 * s, HW, HC, WZ0 - 0.08, WZ0 + 0.4);
    // wider end cap at the outer end
    box('stone', 9.7 * s, 10.47 * s, HW, HC, WZ0 - 0.1, WZ1 + 0.1);
    // abutment pier / stepped plinth where the wing meets the tower
    box('stone', 3.0 * s, 4.1 * s, 0, HW, -3.3, 3.3);
  }

  // ---------------- GATEHOUSE TOWER (battered in x) ----------------
  const hb = y => 3.5 - 0.1 * y; // half-width of battered tower at height y
  const YS = 2.13;  // door sill / passage floor
  const YT = 5.4;   // top of tower body (under cornice slab)
  const DH = 3.95;  // door head
  // lower body with the creek passage (1.6 m) running front to back, incl. rear apron
  extrude('stone', [
    [-3.5, 0], [-1.2, 0], [-1.2, 1.6], [1.2, 1.6], [1.2, 0], [3.5, 0], [hb(YS), YS], [-hb(YS), YS]
  ], -4.5, 3.9);
  // upper body with the through doorway
  extrude('stone', [
    [-hb(YS), YS], [-0.55, YS], [-0.55, DH], [0.55, DH], [0.55, YS], [hb(YS), YS], [hb(YT), YT], [-hb(YT), YT]
  ], -3.9, 3.9);

  // plank floor through the passage
  box('timber', -0.53, 0.53, YS, YS + 0.04, -3.9, 3.9);

  // door surrounds (projecting frames)
  for (const side of [1, -1]) {
    const za = 3.9 * side, zb = 4.02 * side;
    box('stone', -1.22, -0.55, YS, DH, za, zb);
    box('stone', 0.55, 1.22, YS, DH, za, zb);
    box('stone', -1.22, 1.22, DH, DH + 0.4, za, zb);
  }

  // string course around the tower
  const sc0 = 3.55, sc1 = 3.67;
  for (const s of [-1, 1]) {
    box('stone', 3.09 * s, 3.21 * s, sc0, sc1, -3.96, 3.96);
    box('stone', 1.22 * s, 3.21 * s, sc0, sc1, 3.9, 3.96);
    box('stone', 1.22 * s, 3.21 * s, sc0, sc1, -3.96, -3.9);
  }

  // stepped corbels under the cornice
  const layers = [[5.26, 5.40, 0.62, 0.24], [5.12, 5.26, 0.44, 0.16], [4.98, 5.12, 0.26, 0.08]];
  for (const x of [-2.65, -1.32, 0, 1.32, 2.65]) {
    for (const [y0, y1, w, p] of layers) {
      box('stone', x - w / 2, x + w / 2, y0, y1, 3.85, 3.9 + p);
      box('stone', x - w / 2, x + w / 2, y0, y1, -3.9 - p, -3.85);
    }
  }
  for (const z of [-3.3, -1.65, 0, 1.65, 3.3]) {
    for (const [y0, y1, w, p] of layers) {
      const f = hb((y0 + y1) / 2);
      box('stone', f - 0.05, f + p, y0, y1, z - w / 2, z + w / 2);
      box('stone', -f + 0.05, -f - p, y0, y1, z - w / 2, z + w / 2);
    }
  }

  // cornice slab and raised roof rim
  box('stone', -3.25, 3.25, 5.40, 5.60, -4.15, 4.15);
  box('stone', -3.25, 3.25, 5.60, 5.70, 3.85, 4.15);
  box('stone', -3.25, 3.25, 5.60, 5.70, -4.15, -3.85);
  box('stone', -3.25, -2.95, 5.60, 5.70, -3.85, 3.85);
  box('stone', 2.95, 3.25, 5.60, 5.70, -3.85, 3.85);

  // ---------------- FRONT STAIR BLOCK (lower culvert mouth) ----------------
  extrude('stone', [
    [-2.45, 0], [-1.2, 0], [-1.2, 1.25], [1.2, 1.25], [1.2, 0], [2.45, 0], [2.45, 1.6], [-2.45, 1.6]
  ], 3.9, 5.3);
  const stepFronts = [5.15, 4.88, 4.61, 4.34];
  for (let k = 0; k < 4; k++) {
    const top = 1.6 + (k + 1) * 0.1325;
    box('stone', -1.45, 1.45, 1.6, top, 3.9, stepFronts[k]);
  }
  for (const s of [-1, 1]) {
    box('stone', 1.45 * s, 2.45 * s, 1.6, 2.22, 3.9, 5.3);
  }

  // ---------------- TREE growing in the left culvert mouth ----------------
  const TX = -5.35, TZ = 1.0;
  add(new THREE.ConeGeometry(0.45, 0.4, 8), 'bark', TX, 0.2, TZ);
  add(new THREE.CylinderGeometry(0.13, 0.24, 1.0, 8), 'bark', TX, 0.5, TZ);
  const br1 = add(new THREE.CylinderGeometry(0.05, 0.08, 0.6, 6), 'bark', TX - 0.25, 1.08, TZ);
  br1.rotation.z = 0.8;
  const br2 = add(new THREE.CylinderGeometry(0.05, 0.08, 0.6, 6), 'bark', TX + 0.25, 1.1, TZ + 0.05);
  br2.rotation.z = -0.75;
  const canopyGeo = new THREE.SphereGeometry(1, 8, 6);
  const canopy = [
    [-6.05, 1.32, 1.00, 0.55, 0.28, 0.45],
    [-5.35, 1.38, 1.05, 0.65, 0.25, 0.50],
    [-4.70, 1.30, 1.00, 0.45, 0.27, 0.42],
    [-5.45, 1.25, 0.60, 0.50, 0.25, 0.40]
  ];
  for (const c of canopy) {
    const m = add(canopyGeo, 'foliage', c[0], c[1], c[2]);
    m.scale.set(c[3], c[4], c[5]);
  }

  // ---------------- RUBBLE (fixed seeded sequence) ----------------
  let seed = 20240611;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  const rockGeo = new THREE.SphereGeometry(1, 7, 5);
  function rock(x, z, r) {
    const m = add(rockGeo, 'rubble', x, 0, z);
    const sy = r * (0.45 + 0.25 * rnd());
    m.scale.set(r * (0.8 + 0.4 * rnd()), sy, r * (0.8 + 0.4 * rnd()));
    m.position.y = sy * 0.6;
    m.rotation.y = rnd() * Math.PI;
  }
  const culverts = [[-6.5, -4.3, WZ1, WZ0], [4.3, 6.5, WZ1, WZ0], [-1.1, 1.1, 5.0, -4.2]];
  for (const [a, b, zf, zb] of culverts) {
    for (let i = 0; i < 4; i++) {
      rock(a + (b - a) * rnd(), zf - 0.6 * rnd(), 0.12 + 0.12 * rnd());
      rock(a + (b - a) * rnd(), zb + 0.6 * rnd(), 0.12 + 0.12 * rnd());
    }
  }
  const looseRocks = [
    [-10.0, WZ1 + 0.05], [-8.6, WZ1 + 0.05], [7.4, WZ1 + 0.05], [9.5, WZ1 + 0.05],
    [-2.0, 5.45], [2.2, 5.45], [-3.0, 4.05], [3.1, 4.05],
    [-9.0, WZ0 - 0.05], [-7.4, WZ0 - 0.05], [8.2, WZ0 - 0.05], [9.8, WZ0 - 0.05],
    [-2.6, -4.6], [2.8, -4.6]
  ];
  for (const [x, z] of looseRocks) rock(x, z, 0.15 + 0.12 * rnd());

  // ---------------- DRY GRASS TUFTS ----------------
  const tuftGeo = new THREE.ConeGeometry(0.22, 0.42, 6);
  function tuft(x, z) {
    const s = 0.7 + 0.6 * rnd();
    const m = add(tuftGeo, 'dry_grass', x, 0.21 * s, z);
    m.scale.set(s, s, s);
  }
  for (const x of [-10.3, -9.3, -8.4, -7.2, 7.3, 8.6, 9.9]) tuft(x, WZ1 + 0.1);
  for (const x of [-10.2, -8.0, -7.1, 7.2, 9.0, 10.3]) tuft(x, WZ0 - 0.1);
  tuft(-3.7, 4.0); tuft(3.65, 3.95);
  tuft(-2.3, 5.4); tuft(1.7, 5.4);
  tuft(-2.8, -4.6); tuft(2.6, -4.6);
  tuft(-11.15, 0.3); tuft(11.15, -0.8);

  return root;
}
