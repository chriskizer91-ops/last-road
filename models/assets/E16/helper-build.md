```json
{
  "objects": [
    {
      "name": "drop_crate",
      "size_m": [1.62, 1.2, 1.54],
      "views": [
        {"label": "crate, front (top left)", "box": [30, 318, 388, 587], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "crate, top (bottom left)", "box": [30, 652, 388, 991], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "rigged_crate",
      "size_m": [1.62, 2.48, 1.54],
      "views": [
        {"label": "crate with packed chute and harness, front (top middle)", "box": [432, 40, 790, 587], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "crate with packed chute and harness, top (bottom middle)", "box": [432, 650, 790, 991], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "parachute_canopy",
      "size_m": [6.44, 6.62, 6.44],
      "views": [
        {"label": "deployed parachute, front (right; canopy and lines down to the ring)", "box": [843, 5, 1520, 700], "cam": [0, 0, 1], "up": [0, 1, 0]}
      ]
    }
  ],
  "notes": "Orange plywood airdrop crate with weathered timber edge battens, rope side handles and a canvas skid skirt. Rigged version adds a packed olive chute, four khaki risers to a steel hoist ring and tie-down straps. The 1 m scale bar spans 220 px, so the crate is about 1.33 x 1.20 m with a depth of 1.50 m as the top views draw it. The pack, ring and handles sit about 0.1 m toward the back in the top views. The deployed chute is drawn at about 105 px/m (from the crate size there) and slightly from below. It gives a 24-gore canopy about 6.4 m across, with its lines meeting at its origin; place that origin on the rigged crate's ring at (0, 2.41, -0.09)."
}
```

```js
function build(THREE) {
  const COL = {
    paint_orange: 0xc76a35,
    timber: 0xa58a66,
    canvas: 0x9c8b63,
    rope: 0xa89470,
    webbing: 0x968b5f,
    canvas_olive: 0x676b49,
    rusty_iron: 0x84654f,
    fabric_olive: 0x6f7546,
    fabric_cream: 0xd5cdb3,
    cord: 0xcdc2a4
  };
  const mats = {};
  function mesh(geo, name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COL[name] });
    const m = new THREE.Mesh(geo, mats[name]);
    m.name = name;
    return m;
  }
  function box(g, name, w, h, d, x, y, z) {
    const m = mesh(new THREE.BoxGeometry(w, h, d), name);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  }
  // flat strap (box) running from point a to point b, width kept horizontal
  function strap(g, name, a, b, width, thick) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    dir.normalize();
    const w = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir);
    if (w.lengthSq() < 1e-8) w.set(1, 0, 0);
    w.normalize();
    const n = new THREE.Vector3().crossVectors(w, dir).normalize();
    const m = mesh(new THREE.BoxGeometry(width, len, thick), name);
    m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(w, dir, n));
    m.position.copy(a).add(b).multiplyScalar(0.5);
    g.add(m);
    return m;
  }

  // ---------- crate dimensions (scale bar: 220 px = 1 m) ----------
  const W = 1.33, D = 1.50, H = 1.20;
  const t = 0.03;   // batten thickness
  const b = 0.145;  // batten width
  const y0 = 0.02;  // underside of the wooden box (skirt goes to 0)

  function buildCrate() {
    const g = new THREE.Group();
    const top = H - t;
    const hP = top - y0;
    const yP = (top + y0) / 2;

    // plywood body
    box(g, 'paint_orange', W - 2 * t, hP, D - 2 * t, 0, yP, 0);

    // front and back frames
    for (const s of [1, -1]) {
      const z = s * (D / 2 - t / 2);
      box(g, 'timber', b, hP, t, -(W / 2 - b / 2), yP, z);
      box(g, 'timber', b, hP, t, (W / 2 - b / 2), yP, z);
      box(g, 'timber', W - 2 * b, b, t, 0, top - b / 2, z);
      box(g, 'timber', W - 2 * b, b, t, 0, y0 + b / 2, z);
    }
    // side frames
    for (const s of [1, -1]) {
      const x = s * (W / 2 - t / 2);
      const zc = D / 2 - t - b / 2;
      box(g, 'timber', t, hP, b, x, yP, zc);
      box(g, 'timber', t, hP, b, x, yP, -zc);
      const L = D - 2 * t - 2 * b;
      box(g, 'timber', t, b, L, x, top - b / 2, 0);
      box(g, 'timber', t, b, L, x, y0 + b / 2, 0);
    }
    // top perimeter frame
    const yT = H - t / 2;
    box(g, 'timber', W, t, b, 0, yT, D / 2 - b / 2);
    box(g, 'timber', W, t, b, 0, yT, -(D / 2 - b / 2));
    box(g, 'timber', b, t, D - 2 * b, W / 2 - b / 2, yT, 0);
    box(g, 'timber', b, t, D - 2 * b, -(W / 2 - b / 2), yT, 0);

    // canvas skid skirt around the bottom (rounded-ish underside)
    const so = 0.022, sw = W + 2 * so, sd = D + 2 * so;
    box(g, 'canvas', sw, 0.214, sd, 0, 0.157, 0);              // 0.05 .. 0.264
    box(g, 'canvas', sw - 0.02, 0.03, sd - 0.02, 0, 0.035, 0); // 0.02 .. 0.05
    box(g, 'canvas', sw - 0.06, 0.02, sd - 0.06, 0, 0.01, 0);  // 0 .. 0.02

    // rope handles: D-shaped loops on each side, chord running diagonally (up-back to down-front)
    for (const s of [1, -1]) {
      const xs = s * (W / 2 - 0.01);
      const A = new THREE.Vector3(xs, 0.855, -0.30);
      const B = new THREE.Vector3(xs, 0.54, 0.03);
      const M = A.clone().add(B).multiplyScalar(0.5);
      const C = B.clone().sub(A).multiplyScalar(0.5);
      const pts = [new THREE.Vector3(xs - s * 0.03, A.y, A.z)];
      for (let i = 0; i <= 6; i++) {
        const th = -Math.PI / 2 + i * Math.PI / 6;
        pts.push(new THREE.Vector3(
          M.x + s * 0.135 * Math.cos(th),
          M.y + C.y * Math.sin(th),
          M.z + C.z * Math.sin(th)
        ));
      }
      pts.push(new THREE.Vector3(xs - s * 0.03, B.y, B.z));
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.022, 6, false);
      g.add(mesh(tube, 'rope'));
    }
    return g;
  }

  // ---------- 1. plain drop crate ----------
  const crate = buildCrate();
  crate.name = 'drop_crate';

  // ---------- 2. rigged crate ----------
  const rig = buildCrate();
  rig.name = 'rigged_crate';
  const zc = -0.09; // pack / ring centre line (from top views)

  // packed parachute: rounded cushion (superellipse lathe)
  const pa = 0.50, ph = 0.25, pn = 2.8, py0 = 1.19;
  const prof = [];
  for (let i = 0; i <= 14; i++) {
    const th = -Math.PI / 2 + i * Math.PI / 14;
    const c = Math.cos(th), s = Math.sin(th);
    let r = pa * Math.pow(Math.abs(c), 2 / pn);
    if (i === 0 || i === 14) r = 0;
    prof.push(new THREE.Vector2(r, ph + ph * Math.sign(s) * Math.pow(Math.abs(s), 2 / pn)));
  }
  const pack = mesh(new THREE.LatheGeometry(prof, 24), 'canvas_olive');
  pack.scale.set(1, 1, 1.06);
  pack.position.set(0, py0, zc);
  rig.add(pack);

  // tie-down bands hugging the pack (one across x, one across z)
  function bandGeo(a, hh, n, w) {
    const outer = [], inner = [];
    const N = 28;
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      const fc = Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
      const fs = Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
      outer.push(new THREE.Vector2((a + 0.012) * fc, hh + (hh + 0.012) * fs));
      inner.push(new THREE.Vector2(a * 0.995 * fc, hh + hh * 0.995 * fs));
    }
    const shape = new THREE.Shape(outer);
    shape.holes.push(new THREE.Path(inner));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false, steps: 1 });
    geo.translate(0, 0, -w / 2);
    return geo;
  }
  const bandX = mesh(bandGeo(0.50, ph, pn, 0.07), 'webbing');
  bandX.position.set(0, py0, zc);
  rig.add(bandX);
  const bandZ = mesh(bandGeo(0.53, ph, pn, 0.07), 'webbing');
  bandZ.rotation.y = Math.PI / 2;
  bandZ.position.set(0, py0, zc);
  rig.add(bandZ);

  // band tails running out over the crate top
  box(rig, 'webbing', 0.15, 0.035, 0.07, 0.555, 1.1875, zc);
  box(rig, 'webbing', 0.15, 0.035, 0.07, -0.555, 1.1875, zc);
  box(rig, 'webbing', 0.07, 0.035, 0.12, 0, 1.1875, -0.66);
  box(rig, 'webbing', 0.07, 0.035, 0.13, 0, 1.1875, 0.485);

  // vertical tie-down straps on front and back faces
  for (const sz of [1, -1]) {
    for (const sx of [1, -1]) {
      box(rig, 'webbing', 0.075, 0.95, 0.008, sx * 0.54, 0.725, sz * (D / 2 + 0.004));
      box(rig, 'webbing', 0.075, 0.27, 0.008, sx * 0.54, 0.135, sz * (D / 2 + 0.026));
      box(rig, 'webbing', 0.075, 0.008, 0.12, sx * 0.54, H + 0.004, sz * (D / 2 - 0.06));
    }
  }

  // hoist ring
  const ring = mesh(new THREE.TorusGeometry(0.055, 0.012, 8, 20), 'rusty_iron');
  ring.position.set(0, 2.41, zc);
  rig.add(ring);

  // four risers from the top corners up to the ring
  const ringFoot = new THREE.Vector3(0, 2.36, zc);
  for (const sx of [1, -1]) {
    for (const sz of [1, -1]) {
      const corner = new THREE.Vector3(sx * (W / 2 - 0.05), H + 0.01, sz * (D / 2 - 0.05));
      strap(rig, 'webbing', corner, ringFoot, 0.07, 0.008);
    }
  }

  // ---------- 3. deployed parachute canopy ----------
  const can = new THREE.Group();
  can.name = 'parachute_canopy';
  const A = 3.22, Bv = 2.24, yc = 4.38, th = 0.03;
  const phis = [-19.3, -10, 0, 12, 24, 36, 48, 60, 72, 84, 90];
  const cprof = [];
  for (const d of phis) {
    const p = d * Math.PI / 180;
    cprof.push(new THREE.Vector2(Math.max(0, A * Math.cos(p)), yc + Bv * Math.sin(p)));
  }
  for (let i = phis.length - 1; i >= 0; i--) {
    const p = phis[i] * Math.PI / 180;
    cprof.push(new THREE.Vector2(Math.max(0, (A - th) * Math.cos(p)), yc + (Bv - th) * Math.sin(p)));
  }
  cprof.push(cprof[0].clone());

  const NG = 24, dphi = (2 * Math.PI) / NG;
  for (let k = 0; k < NG; k++) {
    const geo = new THREE.LatheGeometry(cprof, 2, -dphi / 2 + k * dphi, dphi);
    can.add(mesh(geo, k % 2 === 0 ? 'fabric_cream' : 'fabric_olive'));
  }

  // suspension lines: from each seam on the hem down to the confluence at the origin
  const up = new THREE.Vector3(0, 1, 0);
  const hemR = 3.03, hemY = 3.64;
  for (let k = 0; k < NG; k++) {
    const p = -dphi / 2 + k * dphi;
    const tip = new THREE.Vector3(hemR * Math.sin(p), hemY, hemR * Math.cos(p));
    const len = tip.length();
    const line = mesh(new THREE.CylinderGeometry(0.012, 0.012, len, 4, 1, true), 'cord');
    line.quaternion.setFromUnitVectors(up, tip.clone().normalize());
    line.position.copy(tip).multiplyScalar(0.5);
    can.add(line);
  }

  return { drop_crate: crate, rigged_crate: rig, parachute_canopy: can };
}
```