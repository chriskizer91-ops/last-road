```json
{"objects": [{"name": "vulture", "size_m": [2.4, 0.63, 0.55],
  "views": [
    {"label": "underside (top row)", "box": [108, 8, 1426, 300], "cam": [0, -1, 0], "up": [0, 0, 1]},
    {"label": "top (middle row)", "box": [105, 322, 1426, 630], "cam": [0, 1, 0], "up": [0, 0, 1]},
    {"label": "front, head-on (bottom centre)", "box": [320, 608, 1218, 842], "cam": [0, 0, 1], "up": [0, 1, 0]}
  ]}],
 "notes": "Griffon-type vulture in a soaring pose: wings in a shallow V (about 22 degrees) with spread primary 'fingers'. The 2.4 m scale bar is taken as the tip-to-tip span; the head-on view is drawn at a smaller scale than the top and underside views. The two perched birds (bottom left and right) show a different, wings-folded pose, so they are left out. The top and underside drawings disagree a little on head and tail length, so the model splits the difference."}
```

```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'vulture';

  const matCache = {};
  function mat(name, color) {
    if (!matCache[name]) {
      const m = new THREE.MeshStandardMaterial({ color: color, roughness: 0.92, metalness: 0.0 });
      m.name = name;
      matCache[name] = m;
    }
    return matCache[name];
  }
  const BROWN = mat('feather_brown', 0x4e3d2d);
  const DARK = mat('feather_dark', 0x3a3029);
  const CREAM = mat('feather_cream', 0xe2d7be);
  const SKIN = mat('skin_pink', 0xb98a86);
  const BEAK = mat('beak_horn', 0x5a5c60);
  const LEG = mat('skin_grey', 0x8e897c);

  function add(geo, m, parent) {
    const o = new THREE.Mesh(geo, m);
    o.name = m.name;
    (parent || root).add(o);
    return o;
  }

  function ellipsoid(r, pos, m, ws, hs, parent) {
    const o = add(new THREE.SphereGeometry(1, ws, hs), m, parent);
    o.scale.set(r[0], r[1], r[2]);
    o.position.set(pos[0], pos[1], pos[2]);
    return o;
  }

  const UP = new THREE.Vector3(0, 1, 0);
  function limb(a, b, ra, rb, seg, m, parent) {
    const A = new THREE.Vector3(a[0], a[1], a[2]);
    const B = new THREE.Vector3(b[0], b[1], b[2]);
    const d = new THREE.Vector3().subVectors(B, A);
    const len = d.length();
    const o = add(new THREE.CylinderGeometry(rb, ra, len, seg, 1), m, parent);
    o.position.copy(A).addScaledVector(d, 0.5);
    o.quaternion.setFromUnitVectors(UP, d.clone().normalize());
    return o;
  }

  // flat plate: 2D points [u, z] lying in the XZ plane, thickness along y, centred at yc
  function slab(pts, depth, yc) {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    const g = new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: false, steps: 1, curveSegments: 1 });
    g.rotateX(Math.PI / 2);          // shape y -> model z, extrusion -> -y
    g.translate(0, yc + depth / 2, 0);
    return g;
  }

  // ---------- body, ruff, neck, head ----------
  ellipsoid([0.1, 0.1, 0.2], [0, 0.1, 0], BROWN, 18, 12);            // body, belly touches y=0
  ellipsoid([0.085, 0.085, 0.045], [0, 0.125, 0.15], CREAM, 16, 10);  // white ruff
  limb([0, 0.125, 0.13], [0, 0.127, 0.205], 0.03, 0.026, 10, SKIN);   // bare neck
  ellipsoid([0.032, 0.035, 0.045], [0, 0.127, 0.215], SKIN, 12, 10);  // head
  const beak = add(new THREE.ConeGeometry(0.013, 0.035, 8), BEAK);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.12, 0.258);
  const hook = add(new THREE.ConeGeometry(0.006, 0.016, 6), BEAK);
  hook.rotation.x = Math.PI;
  hook.position.set(0, 0.111, 0.268);

  // ---------- tail ----------
  const TAIL = [[-0.05, -0.06], [0.05, -0.06], [0.10, -0.235], [0.085, -0.262], [0.04, -0.272],
                [0, -0.275], [-0.04, -0.272], [-0.085, -0.262], [-0.10, -0.235]];
  add(slab(TAIL, 0.018, 0.085), DARK);

  // ---------- legs tucked back under the tail ----------
  [-1, 1].forEach(function (s) {
    ellipsoid([0.03, 0.028, 0.05], [s * 0.035, 0.045, -0.06], BROWN, 8, 6);
    const ank = [s * 0.028, 0.034, -0.175];
    limb([s * 0.035, 0.034, -0.085], ank, 0.011, 0.009, 8, LEG);
    [[-0.016, -0.05], [0, -0.058], [0.016, -0.05]].forEach(function (t) {
      limb(ank, [ank[0] + s * t[0], 0.03, ank[2] + t[1]], 0.006, 0.0015, 6, LEG);
    });
  });

  // ---------- wings ----------
  const DIH = 22.5 * Math.PI / 180;   // dihedral (shallow V seen head-on)
  const PITCH = 9 * Math.PI / 180;    // nose-up, shows underside band in front view
  const HX = 0.09, HY = 0.15;         // wing hinge on the body
  const C = Math.cos(DIH);
  // planform in top-view projected coordinates [X outward, z]
  const PLAN = [
    [0.05, 0.128], [0.30, 0.16], [0.50, 0.175], [0.67, 0.185], [0.86, 0.195],
    [0.95, 0.19], [1.0, 0.16], [1.025, 0.095], [1.0, 0.025], [0.95, -0.03],
    [0.86, -0.07], [0.67, -0.11], [0.50, -0.13], [0.30, -0.145], [0.05, -0.15]
  ];
  const PIV = [0.88, 0.075];          // where the primaries fan from
  const FING = [[38, 0.26], [26, 0.30], [14, 0.32], [3, 0.33], [-9, 0.315], [-21, 0.285], [-32, 0.25]];
  const PROF = [[0, -0.017], [0.55, -0.016], [0.88, -0.010], [1.0, 0], [0.88, 0.010], [0.55, 0.016], [0, 0.017]];

  function wing(sign) {
    const g = new THREE.Group();
    g.position.set(sign * HX, HY, 0);
    g.rotation.z = sign * DIH;
    root.add(g);
    const p = new THREE.Group();
    p.rotation.x = -PITCH;
    g.add(p);
    const U = function (X) { return sign * (X - HX) / C; };

    // arm + hand plate
    add(slab(PLAN.map(function (q) { return [U(q[0]), q[1]]; }), 0.022, 0), BROWN, p);

    // separated primary feathers ("fingers"), slightly stacked so they never share a plane
    FING.forEach(function (f, i) {
      const a = f[0] * Math.PI / 180, r0 = 0.05, L = f[1] - r0;
      const ca = Math.cos(a), sa = Math.sin(a);
      const pts = PROF.map(function (q) {
        const along = r0 + q[0] * L, across = q[1];
        const X = PIV[0] + along * ca - across * sa;
        const Z = PIV[1] + along * sa + across * ca;
        return [U(X), Z];
      });
      add(slab(pts, 0.008, -0.005 + i * 0.0015), DARK, p);
    });

    // rounded leading edge of the arm
    limb([U(0.05), 0.002, 0.116], [U(0.9), 0.002, 0.18], 0.02, 0.011, 10, BROWN, p);
  }
  wing(1);
  wing(-1);

  return root;
}
```