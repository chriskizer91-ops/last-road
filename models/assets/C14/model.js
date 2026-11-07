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

  // ---------------- WINGS (causeway embankment walls with culverts) ----------------
  const HW = 2.45;   // wing body top (road surface)
  const HC = 2.6;    // coping top
  const wingHalves = [
    { c0: 4.2, c1: 6.64, h: 1.66, z0: 0, z1: 2.2 },     // front half (front-view culverts)
    { c0: 4.05, c1: 6.55, h: 2.1, z0: -2.2, z1: 0 }     // back half (back-view culverts, taller)
  ];
  for (const s of [-1, 1]) {
    for (const w of wingHalves) {
      const pts = [
        [3.0, 0], [w.c0, 0], [w.c0, w.h], [w.c1, w.h], [w.c1, 0],
        [11.05, 0], [10.5, HW], [3.0, HW]
      ].map(p => [p[0] * s, p[1]]);
      extrude('stone', pts, w.z0, w.z1);
    }
    // coping kerbs along front and back edges of the road
    box('stone', 3.0 * s, 9.7 * s, HW, HC, 1.8, 2.28);
    box('stone', 3.0 * s, 9.7 * s, HW, HC, -2.28, -1.8);
    // wider end cap at the outer end
    box('stone', 9.7 * s, 10.47 * s, HW, HC, -2.3, 2.3);
    // abutment pier where the wing meets the tower
    box('stone', 3.0 * s, 4.0 * s, 0, HC, -2.7, 2.7);
  }

  // ---------------- GATEHOUSE TOWER (battered in x) ----------------
  const hb = y => 3.5 - 0.1 * y; // half-width of battered tower at height y
  const YS = 2.13;  // door sill / passage floor
  const YT = 5.4;   // top of tower body (under cornice slab)
  const lower = (cw, ch) => [
    [-3.5, 0], [-cw, 0], [-cw, ch], [cw, ch], [cw, 0], [3.5, 0], [hb(YS), YS], [-hb(YS), YS]
  ];
  extrude('stone', lower(1.2, 1.2), 0, 3.9);       // front half, low culvert
  extrude('stone', lower(1.15, 1.95), -4.5, 0);    // back half incl. rear landing apron
  const upper = dh => [
    [-hb(YS), YS], [-0.55, YS], [-0.55, dh], [0.55, dh], [0.55, YS], [hb(YS), YS], [hb(YT), YT], [-hb(YT), YT]
  ];
  extrude('stone', upper(3.85), 0, 3.9);           // front half with doorway
  extrude('stone', upper(4.0), -3.9, 0);           // back half with doorway

  // plank floor through the passage
  box('timber', -0.53, 0.53, YS, YS + 0.04, -3.9, 3.9);

  // door surrounds (projecting frames)
  for (const side of [1, -1]) {
    const dh = side > 0 ? 3.85 : 4.0;
    const lt = side > 0 ? 4.26 : 4.3;
    const za = 3.9 * side, zb = 4.02 * side;
    box('stone', -1.22, -0.55, YS, dh, za, zb);
    box('stone', 0.55, 1.22, YS, dh, za, zb);
    box('stone', -1.22, 1.22, dh, lt, za, zb);
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

  // ---------------- FRONT STAIR BLOCK ----------------
  extrude('stone', [
    [-2.45, 0], [-1.2, 0], [-1.2, 1.2], [1.2, 1.2], [1.2, 0], [2.45, 0], [2.45, 1.6], [-2.45, 1.6]
  ], 3.9, 5.3);
  const stepFronts = [5.15, 4.88, 4.61, 4.34];
  for (let k = 0; k < 4; k++) {
    const top = 1.6 + (k + 1) * 0.1325;
    box('stone', -1.45, 1.45, 1.6, top, 3.9, stepFronts[k]);
  }
  for (const s of [-1, 1]) {
    box('stone', 1.45 * s, 2.45 * s, 1.6, 2.22, 3.9, 5.3);
  }

  // ---------------- TREE growing in the left front culvert ----------------
  add(new THREE.ConeGeometry(0.4, 0.35, 8), 'bark', -5.32, 0.175, 1.55);
  add(new THREE.CylinderGeometry(0.11, 0.2, 0.95, 8), 'bark', -5.32, 0.475, 1.55);
  const br1 = add(new THREE.CylinderGeometry(0.05, 0.08, 0.6, 6), 'bark', -5.55, 1.05, 1.55);
  br1.rotation.z = 0.8;
  const br2 = add(new THREE.CylinderGeometry(0.05, 0.08, 0.6, 6), 'bark', -5.1, 1.08, 1.6);
  br2.rotation.z = -0.75;
  const canopyGeo = new THREE.SphereGeometry(1, 8, 6);
  const canopy = [
    [-5.95, 1.22, 1.55, 0.55, 0.30, 0.50],
    [-5.30, 1.33, 1.60, 0.60, 0.30, 0.55],
    [-4.70, 1.20, 1.55, 0.45, 0.28, 0.45],
    [-5.40, 1.18, 1.15, 0.50, 0.26, 0.45]
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
  const culverts = [[-6.5, -4.3, 2.0, -2.0], [4.3, 6.5, 2.0, -2.0], [-1.1, 1.1, 5.0, -4.2]];
  for (const [a, b, zf, zb] of culverts) {
    for (let i = 0; i < 4; i++) {
      rock(a + (b - a) * rnd(), zf - 0.6 * rnd(), 0.12 + 0.12 * rnd());
      rock(a + (b - a) * rnd(), zb + 0.6 * rnd(), 0.12 + 0.12 * rnd());
    }
  }
  const looseRocks = [[-8.6, 2.5], [-3.0, 2.5], [5.2, 2.5], [9.5, 2.45], [-2.0, 5.45], [2.2, 5.45],
                      [-9.0, -2.5], [-2.9, -2.5], [2.9, -2.5], [8.2, -2.5]];
  for (const [x, z] of looseRocks) rock(x, z, 0.15 + 0.12 * rnd());

  // ---------------- DRY GRASS TUFTS ----------------
  const tuftGeo = new THREE.ConeGeometry(0.22, 0.42, 6);
  function tuft(x, z) {
    const s = 0.7 + 0.6 * rnd();
    const m = add(tuftGeo, 'dry_grass', x, 0.21 * s, z);
    m.scale.set(s, s, s);
  }
  for (const x of [-10.3, -9.3, -8.4, -7.2, -3.6, 3.55, 7.3, 8.6, 9.9]) tuft(x, 2.35);
  for (const x of [-10.2, -8.0, -7.1, 3.7, 7.2, 9.0, 10.3]) tuft(x, -2.35);
  tuft(-2.3, 5.4); tuft(1.7, 5.4);
  tuft(-2.8, -4.6); tuft(2.6, -4.6);
  tuft(-10.95, 1.2); tuft(10.95, -1.0);

  return root;
}
