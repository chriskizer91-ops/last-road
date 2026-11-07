function build(THREE) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const UP = V(0, 1, 0), ZAX = V(0, 0, 1);

  const mats = {
    paint_green: new THREE.MeshStandardMaterial({ color: 0x5b6a3f, roughness: 0.8, metalness: 0.2 }),
    rusty_iron: new THREE.MeshStandardMaterial({ color: 0x6f553e, roughness: 0.85, metalness: 0.35 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xd4cebf, roughness: 0.5, metalness: 0.0 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x353430, roughness: 0.9, metalness: 0.0 }),
    leather: new THREE.MeshStandardMaterial({ color: 0x87613d, roughness: 0.9, metalness: 0.0 }),
    canvas: new THREE.MeshStandardMaterial({ color: 0xa39b79, roughness: 1.0, metalness: 0.0 })
  };
  function mk(geom, name) {
    const m = new THREE.Mesh(geom, mats[name]);
    m.name = name;
    return m;
  }
  function rod(parent, a, b, r0, r1, seg, name) {
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    const m = mk(new THREE.CylinderGeometry(r1, r0, len, seg), name);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(UP, d.normalize());
    parent.add(m);
    return m;
  }
  function ball(parent, p, r, name, sx, sy, sz, ws, hs) {
    const m = mk(new THREE.SphereGeometry(r, ws || 8, hs || 6), name);
    m.position.copy(p);
    m.scale.set(sx || 1, sy || 1, sz || 1);
    parent.add(m);
    return m;
  }
  function ring(parent, p, axis, R, tube, rs, ts, name) {
    const m = mk(new THREE.TorusGeometry(R, tube, rs, ts), name);
    m.position.copy(p);
    m.quaternion.setFromUnitVectors(ZAX, axis.clone().normalize());
    parent.add(m);
    return m;
  }

  // ================= LANTERN =================
  const lantern = new THREE.Group();
  lantern.name = 'lantern';
  const S = 32;
  const lathe = (pts) => new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), S);
  let m;

  // rusty foot ring
  m = mk(new THREE.CylinderGeometry(0.0572, 0.058, 0.009, S), 'rusty_iron');
  m.position.y = 0.0045; lantern.add(m);
  // green base drum
  lantern.add(mk(lathe([[0.0566, 0.0085], [0.0563, 0.030], [0.0556, 0.049], [0.0542, 0.0535],
                        [0.0505, 0.0548], [0.044, 0.0552]]), 'paint_green'));
  // cage bottom band
  m = mk(new THREE.CylinderGeometry(0.0495, 0.0495, 0.011, S), 'rusty_iron');
  m.position.y = 0.059; lantern.add(m);
  // frosted globe
  m = mk(new THREE.CylinderGeometry(0.042, 0.042, 0.104, S), 'glass');
  m.position.y = 0.112; lantern.add(m);
  // cage rings
  [0.090, 0.127].forEach(y => ring(lantern, V(0, y, 0), UP, 0.0478, 0.0024, 4, 32, 'rusty_iron'));
  // cage bars (8, offset so none sits dead centre front)
  for (let k = 0; k < 8; k++) {
    const a = (k + 0.5) * Math.PI / 4;
    m = mk(new THREE.CylinderGeometry(0.0022, 0.0022, 0.104, 6), 'rusty_iron');
    m.position.set(0.0485 * Math.sin(a), 0.112, 0.0485 * Math.cos(a));
    lantern.add(m);
  }
  // cage top band
  m = mk(new THREE.CylinderGeometry(0.049, 0.049, 0.009, S), 'rusty_iron');
  m.position.y = 0.1625; lantern.add(m);
  // vented collar
  m = mk(new THREE.CylinderGeometry(0.040, 0.041, 0.008, S), 'paint_green');
  m.position.y = 0.170; lantern.add(m);
  // domed cap
  lantern.add(mk(lathe([[0.038, 0.1725], [0.0455, 0.1725], [0.0458, 0.1755], [0.0455, 0.182],
                        [0.0446, 0.1872], [0.0412, 0.1914], [0.0345, 0.1944], [0.022, 0.1961],
                        [0.0, 0.1966]]), 'paint_green'));
  // bail brackets and pivot knobs
  for (const s of [-1, 1]) {
    m = mk(new THREE.BoxGeometry(0.010, 0.010, 0.007), 'rusty_iron');
    m.position.set(s * 0.0505, 0.170, 0); lantern.add(m);
    rod(lantern, V(s * 0.053, 0.171, 0), V(s * 0.0595, 0.171, 0), 0.0042, 0.0042, 10, 'rusty_iron');
  }
  // wire bail
  const bailPts = [[-0.058, 0.170], [-0.056, 0.190], [-0.052, 0.215], [-0.047, 0.231], [-0.038, 0.2365],
                   [-0.015, 0.237], [0.015, 0.237], [0.038, 0.2365], [0.047, 0.231], [0.052, 0.215],
                   [0.056, 0.190], [0.058, 0.170]].map(p => V(p[0], p[1], 0));
  lantern.add(mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bailPts), 48, 0.0025, 6, false), 'rusty_iron'));
  // front dial: bezel + knob
  rod(lantern, V(0, 0.034, 0.053), V(0, 0.034, 0.0578), 0.0145, 0.0145, 16, 'rusty_iron');
  rod(lantern, V(0, 0.034, 0.0525), V(0, 0.034, 0.0655), 0.0122, 0.0118, 16, 'rubber');

  // ================= HANDS (built in lantern space, then centred) =================
  function finishHand(rig, name) {
    const g = new THREE.Group();
    g.name = name;
    rig.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(rig, true);
    const c = box.getCenter(new THREE.Vector3());
    rig.position.set(-c.x, -box.min.y, -c.z);
    g.add(rig);
    g.userData.offsetFromLantern = [c.x, box.min.y, c.z];
    return g;
  }

  // ---- carry hand: fist wrapped round the bail top ----
  const carryRig = new THREE.Group();
  const YB = 0.237, R = 0.0145, ARC = Math.PI * 1.35;
  const fx = [-0.025, -0.007, 0.011, 0.028], ft = [0.0095, 0.0101, 0.0097, 0.0086];
  for (let i = 0; i < 4; i++) {
    const t = mk(new THREE.TorusGeometry(R, ft[i], 6, 10, ARC), 'leather');
    t.position.set(fx[i], YB, 0);
    t.rotation.set(0, Math.PI / 2, Math.PI / 2); // arc: top -> front -> under -> back
    carryRig.add(t);
    ball(carryRig, V(fx[i], YB + R, 0), ft[i] * 1.08, 'leather');
    ball(carryRig, V(fx[i], YB + R * Math.cos(ARC), R * Math.sin(ARC)), ft[i], 'leather');
  }
  // back of hand
  ball(carryRig, V(0.006, 0.260, -0.019), 1, 'leather', 0.041, 0.028, 0.031, 12, 8);
  // thumb across the front of the fingers
  const t0 = V(0.041, 0.252, -0.012), t1 = V(0.041, 0.246, 0.017), t2 = V(0.025, 0.249, 0.027);
  rod(carryRig, t0, t1, 0.0105, 0.0098, 8, 'leather');
  rod(carryRig, t1, t2, 0.0098, 0.009, 8, 'leather');
  ball(carryRig, t1, 0.0098, 'leather');
  ball(carryRig, t2, 0.009, 'leather');
  // glove gauntlet, rolled cuff and sleeve going out to +x, down and back
  const W = V(0.040, 0.259, -0.022);
  const dA = V(1, -0.45, -0.7).normalize();
  const at = s => W.clone().addScaledVector(dA, s);
  rod(carryRig, at(-0.012), at(0.046), 0.026, 0.031, 14, 'leather');
  rod(carryRig, at(0.036), at(0.092), 0.039, 0.040, 18, 'canvas');
  ring(carryRig, at(0.038), dA, 0.038, 0.0085, 6, 20, 'canvas');

  // ---- free hand: open glove hanging beside the lantern, palm toward it ----
  const freeRig = new THREE.Group();
  const Wf = V(-0.115, 0.118, 0.035);
  const hand = new THREE.Group();
  hand.position.copy(Wf);
  hand.rotation.x = -0.40; // fingers point down and a little forward
  freeRig.add(hand);
  // palm
  ball(hand, V(0, -0.035, 0.001), 1, 'leather', 0.0155, 0.040, 0.040, 12, 8);
  // fingers (index nearest +z, curling gently toward +x)
  const fz = [0.026, 0.009, -0.008, -0.025];
  const L1 = [0.036, 0.040, 0.037, 0.030], L2 = [0.030, 0.032, 0.030, 0.025];
  const fr = [0.0086, 0.0089, 0.0086, 0.0076];
  const spl = [0.10, 0.03, -0.04, -0.12];
  for (let i = 0; i < 4; i++) {
    const a1 = 0.18 + 0.05 * i, a2 = a1 + 0.38;
    const p0 = V(0.002, -0.066, fz[i]);
    const p1 = p0.clone().add(V(Math.sin(a1), -Math.cos(a1), spl[i]).normalize().multiplyScalar(L1[i]));
    const p2 = p1.clone().add(V(Math.sin(a2), -Math.cos(a2), spl[i]).normalize().multiplyScalar(L2[i]));
    rod(hand, p0, p1, fr[i] * 1.05, fr[i], 8, 'leather');
    rod(hand, p1, p2, fr[i], fr[i] * 0.92, 8, 'leather');
    ball(hand, p1, fr[i], 'leather');
    ball(hand, p2, fr[i] * 0.92, 'leather');
  }
  // thumb
  const q0 = V(0.004, -0.022, 0.030), q1 = V(0.018, -0.048, 0.047), q2 = V(0.029, -0.072, 0.046);
  rod(hand, q0, q1, 0.0105, 0.0095, 8, 'leather');
  rod(hand, q1, q2, 0.0095, 0.0088, 8, 'leather');
  ball(hand, q1, 0.0095, 'leather');
  ball(hand, q2, 0.0088, 'leather');
  // gauntlet, rolled cuff and sleeve running back (-z) and slightly up
  const F = V(0.05, 0.3, -1).normalize();
  const atf = s => Wf.clone().addScaledVector(F, s);
  rod(freeRig, atf(-0.006), atf(0.036), 0.022, 0.026, 14, 'leather');
  rod(freeRig, atf(0.028), atf(0.095), 0.029, 0.030, 18, 'canvas');
  ring(freeRig, atf(0.030), F, 0.028, 0.008, 6, 20, 'canvas');

  return {
    lantern: lantern,
    carry_hand: finishHand(carryRig, 'carry_hand'),
    free_hand: finishHand(freeRig, 'free_hand')
  };
}
