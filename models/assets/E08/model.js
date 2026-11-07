function build(THREE) {
  const mats = {};
  function mat(name, color, rough, metal) {
    if (!mats[name]) {
      mats[name] = new THREE.MeshStandardMaterial({
        color: color,
        roughness: rough === undefined ? 0.85 : rough,
        metalness: metal || 0
      });
    }
    return mats[name];
  }
  function add(parent, geo, name, color, rough, metal) {
    const m = new THREE.Mesh(geo, mat(name, color, rough, metal));
    m.name = name;
    parent.add(m);
    return m;
  }
  function box(parent, name, color, w, h, d, x, y, z) {
    const m = add(parent, new THREE.BoxGeometry(w, h, d), name, color);
    m.position.set(x, y, z);
    return m;
  }
  // rounded rectangle as explicit points (no near-duplicate vertices)
  function rrShape(w, h, r, seg, cx, cy) {
    const pts = [];
    const hw = w / 2 - r, hh = h / 2 - r;
    const cs = [[hw, hh], [-hw, hh], [-hw, -hh], [hw, -hh]];
    for (let c = 0; c < 4; c++) {
      for (let i = 0; i <= seg; i++) {
        const a = (c + i / seg) * Math.PI / 2;
        pts.push(new THREE.Vector2(cx + cs[c][0] + r * Math.cos(a), cy + cs[c][1] + r * Math.sin(a)));
      }
    }
    return new THREE.Shape(pts);
  }
  // vertical extrusion of a rounded footprint (w along x, d along z), from y0 to y0+height
  function vExtrude(w, d, r, height, bt, bs, segs, y0) {
    let geo;
    if (bt > 0) {
      const shape = rrShape(w - 2 * bs, d - 2 * bs, Math.max(0.004, r - bs), 5, 0, 0);
      geo = new THREE.ExtrudeGeometry(shape, {
        depth: height - 2 * bt, bevelEnabled: true,
        bevelThickness: bt, bevelSize: bs, bevelSegments: segs, curveSegments: 4
      });
      geo.translate(0, 0, bt);
    } else {
      const shape = rrShape(w, d, r, 5, 0, 0);
      geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 4 });
    }
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, y0, 0);
    return geo;
  }
  // extrusion of a front profile along z, centred on z = 0 with total depth
  function zExtrude(shape, depth, bt, bs, segs) {
    const opts = { depth: depth - 2 * bt, bevelEnabled: bt > 0, curveSegments: 4 };
    if (bt > 0) { opts.bevelThickness = bt; opts.bevelSize = bs; opts.bevelSegments = segs; }
    const geo = new THREE.ExtrudeGeometry(shape, opts);
    geo.translate(0, 0, -depth / 2 + bt);
    return geo;
  }

  const CANVAS = 0x4b5262, ROPE = 0xa89270, TAG = 0x8a867c;
  const OLIVE = 0x5d6539, CREAM = 0xd5cbb3, GREY = 0xb0a994;

  // ================= MAIL BAG =================
  const bag = new THREE.Group();
  bag.name = 'mail_bag';
  const BZ = 0.86; // depth / width ratio of the sack (side view ~0.27 m deep)
  const prof = [
    [0.0, 0.0], [0.07, 0.0], [0.12, 0.006], [0.145, 0.022], [0.155, 0.06], [0.157, 0.14],
    [0.154, 0.25], [0.148, 0.35], [0.140, 0.44], [0.126, 0.52], [0.108, 0.585], [0.095, 0.625],
    [0.104, 0.645], [0.113, 0.663], [0.103, 0.674], [0.082, 0.666], [0.07, 0.625], [0.0, 0.605]
  ];
  const sack = add(bag, new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 28), 'canvas', CANVAS);
  sack.scale.z = BZ;

  // drawstring around the gathered neck
  const ring = add(bag, new THREE.TorusGeometry(0.099, 0.008, 6, 28), 'rope', ROPE);
  ring.rotation.x = Math.PI / 2;
  ring.scale.set(1, BZ, 1);
  ring.position.y = 0.615;

  // cord hanging down the front to the knot (sits on the deeper sack surface)
  const cordPts = [
    [0.02, 0.615, 0.092], [0.045, 0.57, 0.097], [0.065, 0.50, 0.105], [0.078, 0.44, 0.109],
    [0.085, 0.38, 0.110], [0.095, 0.29, 0.111], [0.105, 0.21, 0.107], [0.11, 0.16, 0.105]
  ].map(p => new THREE.Vector3(p[0], p[1], p[2]));
  add(bag, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cordPts), 36, 0.007, 6, false), 'rope', ROPE);

  // knot and dangling tails
  const knot = add(bag, new THREE.SphereGeometry(0.016, 8, 6), 'rope', ROPE);
  knot.position.set(0.11, 0.15, 0.106);
  const tailA = [[0.104, 0.15, 0.107], [0.099, 0.125, 0.113], [0.097, 0.10, 0.117]].map(p => new THREE.Vector3(p[0], p[1], p[2]));
  const tailB = [[0.116, 0.15, 0.105], [0.122, 0.125, 0.108], [0.125, 0.105, 0.110]].map(p => new THREE.Vector3(p[0], p[1], p[2]));
  add(bag, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tailA), 8, 0.006, 5, false), 'rope', ROPE);
  add(bag, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tailB), 8, 0.006, 5, false), 'rope', ROPE);

  // oval metal tag on the cord
  const tag = add(bag, new THREE.CylinderGeometry(0.03, 0.03, 0.005, 16), 'tin', TAG, 0.6, 0.5);
  tag.rotation.x = Math.PI / 2;
  tag.scale.set(1, 1, 1.35);
  tag.position.set(0.081, 0.40, 0.120);

  // ================= FIRST AID KIT =================
  const kit = new THREE.Group();
  kit.name = 'first_aid_kit';
  const KW = 0.66, KH = 0.485, KD = 0.30;

  // main shell (front profile with rounded corners)
  add(kit, zExtrude(rrShape(KW - 0.024, KH - 0.024, 0.023, 4, 0, KH / 2), KD, 0.012, 0.012, 2), 'plastic_olive', OLIVE);
  // lid seam ridge running round the case
  add(kit, vExtrude(KW + 0.012, KD + 0.012, 0.016, 0.017, 0, 0, 0, 0.415), 'plastic_olive', OLIVE);
  // vertical corner ribs, front and back
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box(kit, 'plastic_olive', OLIVE, 0.022, 0.37, 0.008, sx * 0.30, 0.215, sz * (KD / 2 + 0.004));
    }
  }
  for (const sx of [-1, 1]) {
    // front latches: plate down the face plus a cap wrapping over the top edge
    box(kit, 'plastic_olive', OLIVE, 0.062, 0.135, 0.018, sx * 0.19, 0.40, KD / 2 + 0.009);
    box(kit, 'plastic_olive', OLIVE, 0.062, 0.02, 0.055, sx * 0.19, 0.495, KD / 2 - 0.0095);
    // back hinges
    box(kit, 'plastic_olive', OLIVE, 0.062, 0.09, 0.016, sx * 0.19, 0.425, -KD / 2 - 0.008);
    box(kit, 'plastic_olive', OLIVE, 0.062, 0.02, 0.05, sx * 0.19, 0.495, -KD / 2 + 0.009);
    // handle mounts
    box(kit, 'plastic_olive', OLIVE, 0.06, 0.016, 0.075, sx * 0.128, 0.492, 0);
  }
  // carry handle (inverted U, front profile)
  const hs = new THREE.Shape();
  hs.moveTo(-0.15, 0.48);
  hs.lineTo(-0.15, 0.556);
  hs.quadraticCurveTo(-0.15, 0.579, -0.127, 0.579);
  hs.lineTo(0.127, 0.579);
  hs.quadraticCurveTo(0.15, 0.579, 0.15, 0.556);
  hs.lineTo(0.15, 0.48);
  hs.lineTo(0.112, 0.48);
  hs.lineTo(0.112, 0.546);
  hs.lineTo(-0.112, 0.546);
  hs.lineTo(-0.112, 0.48);
  add(kit, zExtrude(hs, 0.05, 0, 0, 0), 'plastic_olive', OLIVE);

  // ================= COLD BOX =================
  const cold = new THREE.Group();
  cold.name = 'cold_box';
  // tub with rounded bottom edges (top bevel hidden under the lid band)
  add(cold, vExtrude(0.79, 0.48, 0.06, 0.49, 0.025, 0.02, 3, 0), 'plastic_cream', CREAM);
  // lid lip band (widest line on the front view)
  add(cold, vExtrude(0.825, 0.505, 0.07, 0.03, 0, 0, 0, 0.466), 'plastic_cream', CREAM);
  // lid straight wall: ends inside the crown's straight section so no ledge shows
  add(cold, vExtrude(0.80, 0.49, 0.065, 0.064, 0, 0, 0, 0.494), 'plastic_cream', CREAM);
  // lid crown with rounded top edges
  add(cold, vExtrude(0.80, 0.49, 0.065, 0.131, 0.06, 0.055, 3, 0.494), 'plastic_cream', CREAM);
  for (const sx of [-1, 1]) {
    // front latches: strap, top block on the lid, keeper on the tub
    box(cold, 'plastic_grey', GREY, 0.07, 0.15, 0.022, sx * 0.228, 0.44, 0.251);
    box(cold, 'plastic_grey', GREY, 0.085, 0.04, 0.03, sx * 0.228, 0.515, 0.257);
    box(cold, 'plastic_grey', GREY, 0.08, 0.03, 0.03, sx * 0.228, 0.38, 0.255);
    // back hinges
    box(cold, 'plastic_grey', GREY, 0.08, 0.06, 0.026, sx * 0.228, 0.49, -0.256);
  }

  return { mail_bag: bag, first_aid_kit: kit, cold_box: cold };
}
