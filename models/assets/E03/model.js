function build(THREE) {
  const root = new THREE.Group();
  root.name = 'gloved_hand';
  // Modelled in centimetres inside g, then scaled to metres.
  const g = new THREE.Group();
  g.name = 'gloved_hand_cm';
  g.scale.set(0.01, 0.01, 0.01);
  root.add(g);

  const MAT = {
    leather: new THREE.MeshStandardMaterial({ color: 0x8a5c33, roughness: 0.85, metalness: 0.0 }),
    canvas: new THREE.MeshStandardMaterial({ color: 0x9f9474, roughness: 0.95, metalness: 0.0 }),
    tarnished_brass: new THREE.MeshStandardMaterial({ color: 0x5f4c3c, roughness: 0.6, metalness: 0.35 })
  };
  const UP = new THREE.Vector3(0, 1, 0);
  const FLAT = 0.88; // gloved digits squashed a little against the stone

  function mesh(parent, geo, name) {
    const m = new THREE.Mesh(geo, MAT[name]);
    m.name = name;
    parent.add(m);
    return m;
  }
  function bone(a, b, ra, rb) {
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    const m = mesh(g, new THREE.CylinderGeometry(rb, ra, len, 10, 1, false), 'leather');
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(UP, d.normalize());
    m.scale.set(1, 1, FLAT);
    return m;
  }
  function knuckle(p, r, sy) {
    const m = mesh(g, new THREE.SphereGeometry(r, 10, 7), 'leather');
    m.position.copy(p);
    m.scale.set(1, sy || 1, FLAT);
    return m;
  }

  // ---- Palm: flat slab, palm face on z = 0 (stone), back of hand toward +z ----
  const ps = new THREE.Shape();
  ps.moveTo(0.4, -1.2);
  ps.quadraticCurveTo(-3.4, -1.3, -4.9, 1.0);
  ps.quadraticCurveTo(-6.1, 3.0, -5.9, 5.4);
  ps.quadraticCurveTo(-5.4, 6.6, -5.3, 7.8);
  ps.quadraticCurveTo(-5.3, 9.0, -4.0, 9.2);
  ps.quadraticCurveTo(-1.8, 9.9, 0.4, 9.3);
  ps.quadraticCurveTo(2.2, 8.9, 3.4, 7.9);
  ps.quadraticCurveTo(4.6, 6.8, 4.5, 4.8);
  ps.quadraticCurveTo(4.5, 1.6, 3.6, -0.2);
  ps.quadraticCurveTo(2.6, -1.2, 0.4, -1.2);
  const palmGeo = new THREE.ExtrudeGeometry(ps, {
    depth: 2.2, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4,
    bevelSegments: 2, curveSegments: 4
  });
  const palm = mesh(g, palmGeo, 'leather');
  palm.position.z = 0.4; // spans z 0 .. 3.0

  // ---- Four fingers, spread, lying flat on the stone ----
  const fingers = [
    { b: [-4.9, 8.6], t: [-6.0, 18.0], r: 1.05 }, // index
    { b: [-1.7, 9.6], t: [-2.0, 20.1], r: 1.12 }, // middle
    { b: [1.4, 8.8], t: [2.4, 18.7], r: 1.05 },   // ring
    { b: [3.9, 6.8], t: [5.6, 14.3], r: 0.92 }    // little
  ];
  const fr = [0, 0.45, 0.75, 1.0];
  const rk = [1.12, 1.0, 0.94, 0.86];
  for (const f of fingers) {
    const pts = fr.map((u, i) => {
      const rr = f.r * rk[i];
      const z = i === 0 ? 1.55 : rr * FLAT;
      return {
        p: new THREE.Vector3(
          f.b[0] + (f.t[0] - f.b[0]) * u,
          f.b[1] + (f.t[1] - f.b[1]) * u,
          z
        ),
        r: rr
      };
    });
    for (let i = 0; i < 3; i++) {
      bone(pts[i].p, pts[i + 1].p, pts[i].r * (i === 0 ? 0.92 : 1), pts[i + 1].r);
    }
    pts.forEach((q, i) => knuckle(q.p, q.r, i === 3 ? 1.15 : 1));
  }

  // ---- Thumb, splayed out to -x ----
  const th = [
    { p: new THREE.Vector3(-4.0, 1.8, 1.6), r: 1.5 },
    { p: new THREE.Vector3(-6.9, 5.0, 1.4), r: 1.3 },
    { p: new THREE.Vector3(-8.8, 7.7, 1.25), r: 1.2 },
    { p: new THREE.Vector3(-10.2, 10.1, 1.1), r: 1.08 }
  ];
  for (let i = 0; i < 3; i++) bone(th[i].p, th[i + 1].p, th[i].r, th[i + 1].r);
  th.forEach((q) => knuckle(q.p, q.r, 1));

  // ---- Wrist heel, rounding the bend between hand and forearm ----
  const wrist = mesh(g, new THREE.SphereGeometry(1, 16, 12), 'leather');
  wrist.position.set(0.4, -1.2, 2.0);
  wrist.scale.set(3.8, 2.6, 2.0);

  // ---- Forearm: comes toward +z, dipping 12 degrees; local +y runs along the arm ----
  const arm = new THREE.Group();
  arm.name = 'forearm';
  arm.position.set(0.6, 0.3, 1.6);
  arm.rotation.x = Math.PI / 2 + THREE.MathUtils.degToRad(12);
  g.add(arm);
  function tube(s0, s1, r0, r1, name, seg, hseg) {
    const m = mesh(arm, new THREE.CylinderGeometry(r1, r0, s1 - s0, seg, hseg || 1, false), name);
    m.position.y = (s0 + s1) / 2;
    return m;
  }
  tube(0.5, 19.0, 3.6, 4.4, 'leather', 20, 2); // glove gauntlet, flaring
  tube(3.0, 5.6, 3.95, 4.05, 'leather', 20, 1); // wrist strap band
  const snap = mesh(arm, new THREE.CylinderGeometry(0.8, 0.95, 0.45, 14), 'tarnished_brass');
  snap.rotation.x = -Math.PI / 2; // faces local -z = top (back-of-wrist) side
  snap.position.set(0, 4.3, -4.15);
  tube(18.0, 30.0, 5.0, 5.05, 'canvas', 20, 1); // sleeve
  tube(17.0, 22.5, 5.3, 5.3, 'canvas', 20, 1); // rolled cuff
  for (const s of [17.0, 22.5]) {
    const lip = mesh(arm, new THREE.TorusGeometry(5.0, 0.42, 6, 20), 'canvas');
    lip.rotation.x = Math.PI / 2;
    lip.position.y = s;
  }

  // ---- Stand on y = 0, centred on x and z ----
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(g, true);
  const c = box.getCenter(new THREE.Vector3());
  g.position.set(-c.x, -box.min.y, -c.z);
  root.updateMatrixWorld(true);
  return root;
}
