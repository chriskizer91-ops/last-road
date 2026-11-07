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
  const DIH = 21 * Math.PI / 180;     // dihedral (shallow V seen head-on)
  const PITCH = 16 * Math.PI / 180;   // nose-up: shows the underside band in the head-on view
  const HX = 0.09, HY = 0.15;         // wing hinge on the body
  const C = Math.cos(DIH), SD = Math.sin(DIH);
  const CP = Math.cos(PITCH), SP = Math.sin(PITCH);

  // planform in top-view projected coordinates [X outward, z]
  const PLAN = [
    [0.05, 0.11], [0.30, 0.115], [0.50, 0.128], [0.67, 0.15], [0.80, 0.172], [0.88, 0.188],
    [0.93, 0.185], [0.96, 0.16], [0.975, 0.115], [0.96, 0.068], [0.925, 0.025], [0.86, -0.015],
    [0.76, -0.055], [0.62, -0.09], [0.45, -0.12], [0.25, -0.14], [0.05, -0.15]
  ];
  const PIV = [0.80, 0.105];          // where the primaries fan from
  const FING = [[26, 0.34], [19.5, 0.375], [13, 0.40], [6.5, 0.41], [0, 0.40], [-6.5, 0.375], [-13, 0.345]];
  const PROF = [[0, -0.017], [0.55, -0.016], [0.88, -0.010], [1.0, 0], [0.88, 0.010], [0.55, 0.016], [0, 0.017]];
  // rounded leading edge: [X, z, radius]
  const LEAD = [[0.05, 0.10, 0.02], [0.50, 0.128, 0.015], [0.86, 0.18, 0.011]];

  function wing(sign) {
    const g = new THREE.Group();
    g.position.set(sign * HX, HY, 0);
    g.rotation.z = sign * DIH;
    root.add(g);
    const p = new THREE.Group();
    p.rotation.x = -PITCH;
    g.add(p);
    // top-view point [X, z] -> wing-local [u, zl], so the planform stays true from above after dihedral + pitch
    const L = function (X, z) {
      const zl = z / CP;
      return [sign * (X - HX + zl * SP * SD) / C, zl];
    };

    // arm + hand plate
    add(slab(PLAN.map(function (q) { return L(q[0], q[1]); }), 0.022, 0), BROWN, p);

    // separated primary feathers ("fingers"), slightly stacked so they never share a plane
    FING.forEach(function (f, i) {
      const a = f[0] * Math.PI / 180, r0 = 0.05, len = f[1] - r0;
      const ca = Math.cos(a), sa = Math.sin(a);
      const pts = PROF.map(function (q) {
        const along = r0 + q[0] * len, across = q[1];
        const X = PIV[0] + along * ca - across * sa;
        const Z = PIV[1] + along * sa + across * ca;
        return L(X, Z);
      });
      add(slab(pts, 0.008, -0.005 + i * 0.0015), DARK, p);
    });

    // rounded leading edge of the arm, two segments following the curve
    for (let k = 0; k < LEAD.length - 1; k++) {
      const a = L(LEAD[k][0], LEAD[k][1]);
      const b = L(LEAD[k + 1][0], LEAD[k + 1][1]);
      limb([a[0], 0, a[1]], [b[0], 0, b[1]], LEAD[k][2], LEAD[k + 1][2], 10, BROWN, p);
    }
  }
  wing(1);
  wing(-1);

  return root;
}
