function build(THREE) {
  const COL = {
    paint_green: 0x5e6a3b,
    rusty_iron: 0x5b4837,
    frosted_glass: 0xd5d3c9,
    black_plastic: 0x2b2b29,
    webbing: 0x4a4946,
    grey_plastic: 0x56595a,
    clear_plastic: 0xc8c9c2
  };
  const mats = {};
  function mk(geo, name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COL[name] });
    const m = new THREE.Mesh(geo, mats[name]);
    m.name = name;
    return m;
  }
  const V2 = (x, y) => new THREE.Vector2(x, y);

  // ===================== LANTERN =====================
  const lantern = new THREE.Group();
  lantern.name = 'lantern';
  // the sheet's side views are a little narrower than the front: slight oval body
  const body = new THREE.Group();
  body.scale.set(1, 1, 0.91);
  lantern.add(body);
  const topPart = new THREE.Group();
  topPart.scale.set(1, 1, 0.96);
  lantern.add(topPart);
  const SEG = 28;

  // bottom rusty foot ring (closed underneath)
  body.add(mk(new THREE.LatheGeometry([
    V2(0, 0), V2(0.0485, 0), V2(0.0494, 0.0015), V2(0.0494, 0.0105),
    V2(0.0472, 0.0116), V2(0.0455, 0.0116)
  ], SEG), 'rusty_iron'));
  // green painted base drum
  body.add(mk(new THREE.LatheGeometry([
    V2(0.0466, 0.0114), V2(0.0470, 0.0135), V2(0.0466, 0.0440),
    V2(0.0455, 0.0460), V2(0.0405, 0.0462)
  ], SEG), 'paint_green'));
  // rusty shoulder ring under the cage
  body.add(mk(new THREE.LatheGeometry([
    V2(0.0400, 0.0458), V2(0.0416, 0.0462), V2(0.0416, 0.0541), V2(0.0360, 0.0546)
  ], SEG), 'rusty_iron'));

  // frosted globe
  const glass = mk(new THREE.CylinderGeometry(0.0363, 0.0363, 0.097, 24, 1, true), 'frosted_glass');
  glass.position.y = 0.103;
  body.add(glass);

  // cage rings
  const ringGeo = new THREE.TorusGeometry(0.039, 0.0018, 6, SEG);
  [0.0555, 0.0970, 0.1495].forEach(function (y) {
    const r = mk(ringGeo, 'rusty_iron');
    r.rotation.x = Math.PI / 2;
    r.position.y = y;
    body.add(r);
  });
  // cage bars
  const barGeo = new THREE.CylinderGeometry(0.0016, 0.0016, 0.095, 6, 1, true);
  for (let k = 0; k < 8; k++) {
    const a = (22.5 + 45 * k) * Math.PI / 180;
    const bar = mk(barGeo, 'rusty_iron');
    bar.position.set(0.039 * Math.sin(a), 0.102, 0.039 * Math.cos(a));
    body.add(bar);
  }

  // vent band under the cap
  const vent = mk(new THREE.CylinderGeometry(0.039, 0.039, 0.0155, SEG, 1, true), 'paint_green');
  vent.position.y = 0.15875;
  topPart.add(vent);
  // domed cap
  topPart.add(mk(new THREE.LatheGeometry([
    V2(0.0385, 0.1655), V2(0.0417, 0.1655), V2(0.0420, 0.1725), V2(0.0414, 0.1800),
    V2(0.0398, 0.1853), V2(0.0365, 0.1885), V2(0.0280, 0.1897), V2(0.0120, 0.1902), V2(0, 0.1903)
  ], SEG), 'paint_green'));

  // handle pivot lugs
  [-1, 1].forEach(function (s) {
    const lug = mk(new THREE.CylinderGeometry(0.0045, 0.0045, 0.016, 8), 'rusty_iron');
    lug.rotation.z = Math.PI / 2;
    lug.position.set(s * 0.045, 0.153, 0);
    lantern.add(lug);
  });

  // wire bail handle: pivots on the lug axis, leaning ~6 degrees toward the back (both side views)
  const handlePivot = new THREE.Group();
  handlePivot.position.set(0, 0.153, 0);
  handlePivot.rotation.x = -0.105;
  lantern.add(handlePivot);
  const hp = [
    [-0.0505, 0.153], [-0.0500, 0.165], [-0.0478, 0.185], [-0.0445, 0.200], [-0.0370, 0.2110],
    [-0.0230, 0.2155], [0, 0.2160], [0.0230, 0.2155], [0.0370, 0.2110], [0.0445, 0.200],
    [0.0478, 0.185], [0.0500, 0.165], [0.0505, 0.153]
  ].map(function (p) { return new THREE.Vector3(p[0], p[1] - 0.153, 0); });
  handlePivot.add(mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hp), 48, 0.0021, 6, false), 'rusty_iron'));

  // dimmer knob on the front of the base
  const knob = mk(new THREE.CylinderGeometry(0.011, 0.011, 0.011, 16), 'black_plastic');
  knob.rotation.x = Math.PI / 2;
  knob.position.set(-0.003, 0.029, 0.0465);
  lantern.add(knob);
  const knobCap = mk(new THREE.CylinderGeometry(0.0072, 0.0072, 0.0015, 16), 'black_plastic');
  knobCap.rotation.x = Math.PI / 2;
  knobCap.position.set(-0.003, 0.029, 0.0525);
  lantern.add(knobCap);

  // ===================== HEADLAMP =====================
  const headlamp = new THREE.Group();
  headlamp.name = 'headlamp';
  const hl = new THREE.Group();
  hl.position.z = -0.0024; // centre the overall depth (lens front 0.0688, battery back -0.064) on z = 0
  headlamp.add(hl);

  const A = 0.0575, B = 0.046, T = 0.003, N = 2.2;
  const BAND_Y0 = 0.009, BAND_H = 0.018; // band centred on the lamp's mid-height
  function sePt(a, b, t) {
    const c = Math.cos(t), s = Math.sin(t);
    return [a * Math.sign(c) * Math.pow(Math.abs(c), 2 / N),
            b * Math.sign(s) * Math.pow(Math.abs(s), 2 / N)];
  }

  // elastic head loop (rounded oval band with thickness)
  const outer = new THREE.Shape();
  const inner = new THREE.Path();
  const NP = 48;
  for (let i = 0; i < NP; i++) {
    const t = i / NP * Math.PI * 2;
    const p = sePt(A, B, t), q = sePt(A - T, B - T, t);
    if (i === 0) { outer.moveTo(p[0], p[1]); inner.moveTo(q[0], q[1]); }
    else { outer.lineTo(p[0], p[1]); inner.lineTo(q[0], q[1]); }
  }
  outer.holes.push(inner);
  const band = mk(new THREE.ExtrudeGeometry(outer, { depth: BAND_H, bevelEnabled: false }), 'webbing');
  band.rotation.x = -Math.PI / 2;
  band.position.y = BAND_Y0;
  hl.add(band);

  // over-the-head strap (flat arched strip, front to back), points are (z, y)
  const sp = [[0.050, 0.034], [0.049, 0.049], [0.043, 0.0625], [0.030, 0.073], [0.010, 0.0785],
              [-0.010, 0.0775], [-0.028, 0.0705], [-0.041, 0.058], [-0.048, 0.045], [-0.049, 0.034]];
  const scurve = new THREE.CatmullRomCurve3(sp.map(function (p) { return new THREE.Vector3(p[0], p[1], 0); }));
  const cp = scurve.getPoints(24);
  const ST = 0.0016;
  const upper = [], lower = [];
  for (let i = 0; i < cp.length; i++) {
    const a = cp[Math.max(0, i - 1)], b = cp[Math.min(cp.length - 1, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y;
    const L = Math.hypot(tx, ty) || 1;
    tx /= L; ty /= L;
    const nx = -ty, ny = tx;
    upper.push([cp[i].x + nx * ST, cp[i].y + ny * ST]);
    lower.push([cp[i].x - nx * ST, cp[i].y - ny * ST]);
  }
  const sShape = new THREE.Shape();
  sShape.moveTo(upper[0][0], upper[0][1]);
  for (let i = 1; i < upper.length; i++) sShape.lineTo(upper[i][0], upper[i][1]);
  for (let i = lower.length - 1; i >= 0; i--) sShape.lineTo(lower[i][0], lower[i][1]);
  const SW = 0.020;
  const sGeo = new THREE.ExtrudeGeometry(sShape, { depth: SW, bevelEnabled: false });
  sGeo.translate(0, 0, -SW / 2);
  const strap = mk(sGeo, 'webbing');
  strap.rotation.y = -Math.PI / 2; // shape x -> world z, extrusion -> world x
  strap.position.x = 0;
  hl.add(strap);

  function rrect(w, h, r) {
    const s = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  // lamp mount clip behind the housing (band threads through it)
  const mount = mk(new THREE.BoxGeometry(0.050, 0.034, 0.010), 'grey_plastic');
  mount.position.set(0, 0.022, 0.0455);
  hl.add(mount);
  // lamp housing (y 0 .. 0.036, z 0.0485 .. 0.067)
  const housing = mk(new THREE.ExtrudeGeometry(rrect(0.054, 0.033, 0.007), {
    depth: 0.0155, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015,
    bevelSegments: 1, curveSegments: 3
  }), 'grey_plastic');
  housing.position.set(0, 0.018, 0.050);
  hl.add(housing);
  // lens window
  const lens = mk(new THREE.ExtrudeGeometry(rrect(0.038, 0.025, 0.004), {
    depth: 0.002, bevelEnabled: false, curveSegments: 3
  }), 'clear_plastic');
  lens.position.set(0, 0.0175, 0.0668);
  hl.add(lens);

  // rear battery box (y 0.0015 .. 0.0295, z -0.064 .. -0.045)
  const batt = mk(new THREE.ExtrudeGeometry(rrect(0.046, 0.025, 0.006), {
    depth: 0.016, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015,
    bevelSegments: 1, curveSegments: 3
  }), 'grey_plastic');
  batt.position.set(0, 0.0155, -0.0625);
  hl.add(batt);
  // strap clip on top of the battery box
  const clip = mk(new THREE.BoxGeometry(0.036, 0.010, 0.010), 'grey_plastic');
  clip.position.set(0, 0.031, -0.049);
  hl.add(clip);

  // slide buckle on the +x side, just behind the middle (side view)
  const targetZ = -0.011;
  let tb = 0, bestD = 1;
  for (let i = 0; i <= 200; i++) {
    const t = -i / 200 * Math.PI / 2;
    const d = Math.abs(sePt(A, B, t)[1] - targetZ);
    if (d < bestD) { bestD = d; tb = t; }
  }
  const p0 = sePt(A, B, tb), pa = sePt(A, B, tb - 0.02), pb = sePt(A, B, tb + 0.02);
  let tx = pb[0] - pa[0], tz = pb[1] - pa[1];
  const tl = Math.hypot(tx, tz) || 1;
  tx /= tl; tz /= tl;
  let nx = tz, nz = -tx;
  if (nx * p0[0] + nz * p0[1] < 0) { nx = -nx; nz = -nz; }
  const buckle = mk(new THREE.BoxGeometry(0.0035, 0.023, 0.011), 'grey_plastic');
  buckle.position.set(p0[0] + nx * 0.001, BAND_Y0 + BAND_H / 2, p0[1] + nz * 0.001);
  buckle.rotation.y = Math.atan2(tx, tz);
  hl.add(buckle);

  return { lantern: lantern, headlamp: headlamp };
}
