- **Shoulders are too high (the main problem).** The shoulder balls sit at y 1.84, which puts their tops at about 2.0 m, level with the neck base. The torso lathe also stays wide up to 1.92. Together these make hunched, wing-like humps. The sheet's shoulders slope from about 1.97 m at the neck to about 1.78 m at x ±0.6.
- **The head is too big.** It is 0.55 m across with the ears and 0.53 m deep. The sheet's head is about 0.40 m wide and about 0.42 m deep, running from z −0.65 to −0.25. The chin is at about 2.12 m.
- **The chest sits too far forward.** It is at z ≈ −0.04, but the side view puts the chest front at about −0.2. The back is also slightly short of the sheet's hunched line at z ≈ −0.85.
- **Hands are thin and twiggy.** The palms are about 0.2 m wide with spaced pencil fingers. The sheet's hands are broad, about 0.28 m.
- **The resting hand's fingertips go into the knee.** They should drape over the front of it.
- **The arms and sleeves sit a little wide.**
- **The views are right.** The −x side camera agrees with the open hand nearest the viewer, and the boxes are fine. Only the build changes.

```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'seated_figure';
  const stone = new THREE.MeshStandardMaterial({ color: 0x87765a, roughness: 0.95, metalness: 0.0 });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const Y = V(0, 1, 0);

  function add(geo, parent) {
    const m = new THREE.Mesh(geo, stone);
    m.name = 'stone';
    (parent || root).add(m);
    return m;
  }
  function box(w, h, d, x, y, z) {
    const m = add(new THREE.BoxGeometry(w, h, d));
    m.position.set(x, y, z);
    return m;
  }
  function ell(x, y, z, rx, ry, rz, ws, hs, parent) {
    const m = add(new THREE.SphereGeometry(1, ws || 20, hs || 14), parent);
    m.position.set(x, y, z);
    m.scale.set(rx, ry, rz);
    return m;
  }
  function limb(a, b, r0, r1, seg, parent) {
    const d = b.clone().sub(a);
    const len = d.length();
    const m = add(new THREE.CylinderGeometry(r1, r0, len, seg || 12), parent);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(Y, d.normalize());
    return m;
  }

  // ---- Plinth: two tiers with a shallow groove between ----
  const W = 2.18, D = 1.80;
  box(W, 0.32, D, 0, 0.16, 0);
  box(W - 0.05, 0.04, D - 0.05, 0, 0.335, 0);
  box(W, 0.265, D, 0, 0.4825, 0); // top at 0.615

  // ---- Robed torso (lathe, flattened front-to-back), sloping shoulders ----
  const BZ = -0.48;
  const prof = [
    [0.0, 0.60], [0.80, 0.60], [0.82, 0.74], [0.79, 0.94], [0.73, 1.14],
    [0.68, 1.34], [0.65, 1.50], [0.63, 1.62], [0.59, 1.72], [0.50, 1.80],
    [0.36, 1.88], [0.20, 1.94], [0.0, 1.96]
  ];
  const torso = add(new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 32));
  torso.position.set(0, 0, BZ);
  torso.scale.set(1, 1, 0.52);

  // ---- Neck and head (smaller: ~0.40 wide, ~0.42 deep, chin ~2.12) ----
  limb(V(0, 1.86, -0.46), V(0, 2.18, -0.44), 0.13, 0.12, 16);
  ell(0, 2.42, -0.45, 0.185, 0.26, 0.205, 24, 18);   // cranium
  ell(0, 2.25, -0.41, 0.165, 0.13, 0.17);            // broad jaw / cheeks
  ell(0, 2.38, -0.25, 0.035, 0.065, 0.045, 12, 8);   // nose
  for (const s of [-1, 1]) ell(s * 0.185, 2.40, -0.47, 0.03, 0.075, 0.05, 12, 8); // ears

  // ---- Crossed legs / lap under the robe ----
  for (const s of [-1, 1]) ell(s * 0.58, 0.88, 0.30, 0.42, 0.27, 0.45); // knees
  limb(V(-0.62, 0.76, 0.50), V(0.62, 0.76, 0.50), 0.15, 0.15, 16);       // crossed shins
  ell(0, 0.86, 0.20, 0.60, 0.20, 0.46);                                  // lap drape
  ell(0, 0.68, 0.17, 0.97, 0.10, 0.56);                                  // robe hem on plinth

  // wide sleeves hanging from the forearms down onto the knees
  for (const s of [-1, 1]) ell(s * 0.74, 1.04, -0.12, 0.15, 0.26, 0.30);

  // ---- Hands (broad palm, thick touching fingers) ----
  function hand(Wp, Tp, curl) {
    const h = new THREE.Group();
    h.position.copy(Wp);
    h.lookAt(Tp);                       // local +z toward fingertips
    h.scale.setScalar(Wp.distanceTo(Tp) / 0.42);
    root.add(h);
    ell(0, 0, 0.11, 0.11, 0.042, 0.13, 16, 10, h); // palm
    const lens = [0.17, 0.20, 0.19, 0.15];
    for (let i = 0; i < 4; i++) {
      const L = lens[i];
      const a = V(-0.075 + i * 0.05, 0, 0.20);
      const b = V(a.x * 1.08, Math.sin(curl) * L, 0.20 + Math.cos(curl) * L);
      limb(a, b, 0.028, 0.023, 8, h);
    }
    // thumb (on local -x for both hands)
    limb(V(-0.08, 0, 0.05), V(-0.17, Math.sin(curl) * 0.05 + 0.01, 0.15), 0.032, 0.026, 8, h);
  }

  // ---- Arms (shoulders lowered onto the sloping shoulder line) ----
  const arms = [
    // -x: figure's right arm, open palm held out
    { S: V(-0.52, 1.66, -0.48), E: V(-0.70, 1.20, -0.22), W: V(-0.62, 1.22, 0.16), T: V(-0.95, 1.25, 0.55), curl: 0.18 },
    // +x: figure's left arm, hand draped over the front of the knee
    { S: V(0.52, 1.66, -0.48), E: V(0.70, 1.20, -0.22), W: V(0.64, 1.20, 0.28), T: V(0.62, 0.97, 0.74), curl: -0.25 }
  ];
  for (const a of arms) {
    ell(a.S.x, a.S.y, a.S.z, 0.17, 0.16, 0.19);      // shoulder
    limb(a.S, a.E, 0.17, 0.16);                       // upper arm in sleeve
    ell(a.E.x, a.E.y, a.E.z, 0.16, 0.16, 0.16);      // elbow
    limb(a.E, a.W, 0.15, 0.12);                       // forearm in sleeve
    const dir = a.T.clone().sub(a.W).normalize();
    limb(a.W.clone().addScaledVector(dir, -0.10), a.W.clone().addScaledVector(dir, -0.01), 0.125, 0.135); // cuff
    limb(a.W.clone().addScaledVector(dir, -0.05), a.W.clone().addScaledVector(dir, 0.06), 0.085, 0.08, 10); // wrist
    hand(a.W, a.T, a.curl);
  }

  return root;
}
```