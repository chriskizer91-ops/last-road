- **Top view contradicts the other views.** The Top drawing shows the whole back of the hand from above, as if the hand lay flat. Front, Back and Right Side all agree the hand stands upright against the stone. Top had the lowest overlap (0.758). Painting from it also smeared the grey gaps between the fingers across the top of the forearm, as the top and three-quarter renders show. I've dropped it, the same way Left Side was dropped.
- **Fingers and thumb are too thin.** On the sheet the gloved fingers are about 2.8–3 cm wide. The model's are about 2 cm, and they look like bare bones.
- **Side profile is wrong.** The model's hand is a flat 3 cm slab meeting the arm in a hard L. The Right Side drawing shows a wedge: thin at the fingertips and about 6 cm thick at the wrist, curving into the top of the forearm. I've added a dorsal dome and made the palm slab thicker.
- **Glove ends too late.** On every drawing the glove stops partway up the forearm, with the strap and snap near its open end. Bare wrist skin shows before the rolled sleeve. The model ran leather straight into the sleeve, with the strap at the wrist.
- **Right Side box was too high.** Its top sat on the stone slab's top edge, about 20 px above the fingertips.

```json
{
  "objects": [
    {
      "name": "gloved_hand",
      "size_m": [0.18, 0.32, 0.32],
      "views": [
        {"label": "Front", "box": [235, 28, 429, 372], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Back", "box": [733, 27, 946, 372], "cam": [0, 0, -1], "up": [0, 1, 0]},
        {"label": "Right Side", "box": [548, 430, 826, 637], "cam": [1, 0, 0], "up": [0, 1, 0]}
      ]
    }
  ],
  "notes": "Right hand in a worn tan leather glove pressed palm-flat on a vertical stone face (palm toward -z, back of hand toward +z, thumb on -x). The wrist is bent back so the forearm comes toward the viewer, dipping about 12 degrees as a compromise between the Front/Back drawings and the Right Side drawing. The glove's cuff runs about 17 cm up the forearm with the snap strap near its open end, then bare wrist skin, then a rolled khaki sleeve. Scale bar: 10 cm = 87 px. Two drawings are left out on purpose. Left Side shows a relaxed hand in a different pose, with the sleeve on the opposite side to this model. Top shows the whole back of the hand from above, as if the hand lay flat; that contradicts Front, Back and Right Side, where the hand stands upright against the stone, and painting it put finger shapes and background grey onto the forearm. The top of the forearm and the -x side are therefore filled from neighbouring views."
}
```

```js
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
    skin: new THREE.MeshStandardMaterial({ color: 0x8c6a50, roughness: 0.7, metalness: 0.0 }),
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

  // ---- Palm: thick slab, palm face on z = 0 (stone), back of hand toward +z ----
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
    depth: 2.6, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.45,
    bevelSegments: 2, curveSegments: 4
  });
  const palm = mesh(g, palmGeo, 'leather');
  palm.position.z = 0.5; // spans z 0 .. 3.6

  // ---- Back-of-hand dome: thickens the hand toward the wrist (wedge seen in the side drawing) ----
  const dome = mesh(g, new THREE.SphereGeometry(1, 16, 10, 0, Math.PI), 'leather'); // +z half only
  dome.position.set(-0.3, 2.4, 0.05);
  dome.scale.set(4.4, 6.2, 4.6);

  // ---- Four fat gloved fingers, spread, lying flat on the stone ----
  const fingers = [
    { b: [-4.6, 8.6], t: [-5.9, 18.0], r: 1.3 },  // index
    { b: [-1.6, 9.6], t: [-2.0, 20.1], r: 1.38 }, // middle
    { b: [1.4, 8.9], t: [2.4, 18.7], r: 1.3 },    // ring
    { b: [3.8, 7.0], t: [5.5, 14.4], r: 1.15 }    // little
  ];
  const fr = [0, 0.45, 0.75, 1.0];
  const rk = [1.1, 1.0, 0.95, 0.88];
  for (const f of fingers) {
    const pts = fr.map((u, i) => {
      const rr = f.r * rk[i];
      const z = i === 0 ? 1.9 : rr * FLAT;
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
      bone(pts[i].p, pts[i + 1].p, pts[i].r * (i === 0 ? 0.94 : 1), pts[i + 1].r);
    }
    pts.forEach((q, i) => knuckle(q.p, q.r, i === 3 ? 1.15 : 1));
  }

  // ---- Thumb, splayed out to -x ----
  const th = [
    { p: new THREE.Vector3(-4.0, 1.8, 1.9), r: 1.75 },
    { p: new THREE.Vector3(-6.9, 5.0, 1.45), r: 1.55 },
    { p: new THREE.Vector3(-8.8, 7.7, 1.3), r: 1.45 },
    { p: new THREE.Vector3(-10.1, 10.0, 1.15), r: 1.3 }
  ];
  for (let i = 0; i < 3; i++) bone(th[i].p, th[i + 1].p, th[i].r, th[i + 1].r);
  th.forEach((q) => knuckle(q.p, q.r, 1));

  // ---- Wrist heel, rounding the bend between hand and forearm ----
  const wrist = mesh(g, new THREE.SphereGeometry(1, 16, 12), 'leather');
  wrist.position.set(0.4, -1.2, 2.2);
  wrist.scale.set(3.9, 2.7, 2.2);

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
  tube(0.5, 17.5, 3.5, 4.1, 'leather', 20, 2);   // glove cuff, flaring slightly
  tube(13.0, 15.6, 4.12, 4.2, 'leather', 20, 1); // snap strap near the cuff's open end
  const snap = mesh(arm, new THREE.CylinderGeometry(0.8, 0.95, 0.45, 14), 'tarnished_brass');
  snap.rotation.x = -Math.PI / 2; // faces local -z = top (back-of-wrist) side
  snap.position.set(0, 14.3, -4.38);
  tube(17.0, 23.5, 3.8, 4.0, 'skin', 16, 1);     // bare wrist between glove and sleeve
  tube(22.5, 30.5, 4.7, 4.75, 'canvas', 20, 1);  // sleeve
  tube(22.5, 27.0, 5.0, 5.0, 'canvas', 20, 1);   // rolled cuff
  for (const s of [22.5, 27.0]) {
    const lip = mesh(arm, new THREE.TorusGeometry(4.8, 0.4, 6, 20), 'canvas');
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
```