The overall build is right. Length (about 2.63 m), horn and hump heights, dewlap, ears, tail position, all four cameras and the head-right side views match the sheet. The 2.679 m length and 0.84 m width it reports are only loose bounding boxes on rotated parts. Leaving out the running poses is correct, and only one side is drawn. Things worth fixing:

- **Body too narrow:** the barrel is about 0.59 m wide against about 0.65 m on the front view. The torso is widened.
- **Neck reads as a block:** the neck is a flat-sided extruded slab, so it shows as a box in the ¾ and top views. Its topline also sits almost level with the hump top, so the hump barely shows. It's replaced with a rounded, tapered neck whose top runs at about 1.63 m, below the 1.74 m hump, as the sheet draws it.
- **Ears too low:** the ears hang lower and more steeply than the front view draws them, so the tips are raised a little. This is still a compromise between the two views.
- **Legs a little thin:** the forearm, cannon and gaskin are slightly thinner than drawn, and the buttock-to-hock line sits too far forward.
- **Tail switch too short:** the sheet runs it from about 0.25 m to 0.68 m, against 0.23–0.50 m on the model.

```js
function build(THREE) {
  const PI = Math.PI;
  const UP = new THREE.Vector3(0, 1, 0);

  function makeCattle(pal) {
    const g = new THREE.Group();
    const cache = {};

    function mat(role) {
      const name = pal[role][0];
      if (!cache[name]) {
        cache[name] = new THREE.MeshStandardMaterial({ color: pal[role][1], roughness: 0.92, metalness: 0.0 });
      }
      return cache[name];
    }
    function add(geom, role, x, y, z) {
      const mesh = new THREE.Mesh(geom, mat(role));
      mesh.name = pal[role][0];
      mesh.position.set(x, y, z);
      g.add(mesh);
      return mesh;
    }
    function ellip(role, c, r, ws, hs, rx) {
      const m = add(new THREE.SphereGeometry(1, ws, hs), role, c[0], c[1], c[2]);
      m.scale.set(r[0], r[1], r[2]);
      if (rx) m.rotation.x = rx;
      return m;
    }
    function limb(role, top, bot, rTop, rBot, seg, sx) {
      const a = new THREE.Vector3(top[0], top[1], top[2]);
      const b = new THREE.Vector3(bot[0], bot[1], bot[2]);
      const d = new THREE.Vector3().subVectors(a, b);
      const len = d.length();
      d.normalize();
      const m = add(new THREE.CylinderGeometry(rTop, rBot, len, seg, 1, true), role,
        (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      m.quaternion.setFromUnitVectors(UP, d);
      if (sx) m.scale.set(sx, 1, 1);
      return m;
    }
    function lathe(prof, seg) {
      return new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), seg);
    }
    // side-profile slab: pts are (z, y); extruded across x, centred on x = 0
    function sideSlab(role, pts, depth, bt, bs, bseg) {
      const shape = new THREE.Shape();
      shape.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: depth, steps: 1, bevelEnabled: true,
        bevelThickness: bt, bevelSize: bs, bevelSegments: bseg, curveSegments: 1
      });
      geom.translate(0, 0, -depth / 2);
      const m = add(geom, role, 0, 0, 0);
      m.rotation.y = -PI / 2; // shape x -> world z, extrusion -> world x
      return m;
    }

    // ---- torso (barrel + hindquarters), lathe along z, elliptical section (~0.66 m wide)
    const torso = add(lathe([
      [0.0, -1.225], [0.17, -1.215], [0.27, -1.195], [0.33, -1.14], [0.365, -1.0],
      [0.38, -0.75], [0.395, -0.45], [0.425, -0.15], [0.43, 0.15], [0.41, 0.40],
      [0.33, 0.58], [0.0, 0.67]
    ], 12), 'body', 0, 1.095, 0);
    torso.rotation.x = PI / 2;
    torso.scale.set(0.77, 1, 1);

    // ---- hump
    ellip('neck', [0, 1.49, 0.21], [0.155, 0.255, 0.27], 12, 6);

    // ---- neck: rounded tapered lathe from the shoulder up to the poll,
    //      axis tilted ~18 degrees up; topline ~1.63 m, below the hump
    const neck = add(lathe([
      [0.0, -0.05], [0.25, -0.02], [0.36, 0.08], [0.345, 0.20], [0.33, 0.30],
      [0.27, 0.50], [0.21, 0.62], [0.12, 0.69], [0.0, 0.71]
    ], 12), 'neck', 0, 1.22, 0.30);
    neck.rotation.x = 1.249;
    neck.scale.set(0.58, 1, 1);

    // ---- dewlap (thin hanging fold from throat to brisket)
    sideSlab('neck', [
      [0.90, 1.18], [0.90, 1.09], [0.81, 0.93], [0.68, 0.80], [0.57, 0.66],
      [0.47, 0.56], [0.40, 0.55], [0.34, 0.61], [0.33, 0.76], [0.50, 0.96],
      [0.70, 1.10], [0.84, 1.22]
    ], 0.05, 0.025, 0.02, 1);

    // ---- head: skull lathe along a 32 degree down-tilted axis
    const head = add(lathe([
      [0.0, 0.0], [0.12, 0.02], [0.14, 0.10], [0.135, 0.24],
      [0.115, 0.36], [0.09, 0.46], [0.07, 0.52], [0.0, 0.55]
    ], 10), 'head', 0, 1.56, 0.83);
    head.rotation.x = 2.138;
    head.scale.set(0.95, 1, 1);

    // jaw / cheeks
    ellip('head', [0, 1.27, 1.06], [0.10, 0.12, 0.22], 8, 6, -0.25);
    // muzzle pad
    ellip('nose', [0, 1.276, 1.277], [0.075, 0.062, 0.036], 6, 4, 0.566);

    // ---- horns (short, up and slightly out)
    for (const s of [-1, 1]) {
      limb('horn', [s * 0.15, 1.71, 0.885], [s * 0.075, 1.61, 0.89], 0.026, 0.036, 8);
      limb('horn', [s * 0.185, 1.775, 0.87], [s * 0.15, 1.71, 0.885], 0.0, 0.026, 8);
    }

    // ---- ears (long, broad, drooping outward and down; tips a little higher than before)
    for (const s of [-1, 1]) {
      const B = new THREE.Vector3(s * 0.10, 1.52, 0.87);
      const T = new THREE.Vector3(s * 0.33, 1.21, 0.85);
      const L = new THREE.Vector3().subVectors(T, B);
      const len = L.length();
      L.normalize();
      const N = new THREE.Vector3(s * 0.6, 0, 0.8);
      N.addScaledVector(L, -N.dot(L)).normalize();
      const W = new THREE.Vector3().crossVectors(L, N);
      const e = add(new THREE.SphereGeometry(1, 8, 6), 'ear',
        (B.x + T.x) / 2, (B.y + T.y) / 2, (B.z + T.z) / 2);
      e.scale.set(0.095, len / 2, 0.022);
      e.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(W, L, N));
    }

    // ---- legs
    function hoof(x, z) {
      const h = add(new THREE.CylinderGeometry(0.047, 0.066, 0.085, 8), 'hoof', x, 0.0425, z);
      h.scale.set(1, 1, 1.15);
    }
    function frontLeg(s, dz) {
      const x = s * 0.14;
      limb('body', [x, 0.84, 0.31 + dz], [x, 0.40, 0.245 + dz], 0.097, 0.06, 8, 0.8); // forearm
      ellip('legs', [x, 0.40, 0.245 + dz], [0.056, 0.066, 0.068], 6, 4);             // knee
      limb('legs', [x, 0.40, 0.245 + dz], [x, 0.06, 0.25 + dz], 0.05, 0.054, 8);      // cannon
      hoof(x, 0.26 + dz);
    }
    function hindLeg(s, dz) {
      const x = s * 0.14;
      ellip('body', [s * 0.155, 0.97, -0.96 + dz * 0.5], [0.14, 0.33, 0.255], 8, 6);  // thigh
      limb('body', [x, 0.80, -0.95 + dz], [x, 0.43, -1.075 + dz], 0.118, 0.064, 8, 0.8); // gaskin
      ellip('legs', [x, 0.43, -1.085 + dz], [0.058, 0.072, 0.072], 6, 4);            // hock
      limb('legs', [x, 0.43, -1.075 + dz], [x, 0.06, -1.02 + dz], 0.05, 0.054, 8);    // cannon
      hoof(x, -1.01 + dz);
    }
    frontLeg(-1, 0.03);  // near side (-x) in the sheet's side view
    frontLeg(1, -0.04);
    hindLeg(-1, -0.04);
    hindLeg(1, 0.07);

    // ---- sheath
    ellip('body', [0, 0.70, -0.43], [0.055, 0.09, 0.065], 6, 4);

    // ---- tail: over the rump, hanging behind the thighs, long dark switch
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.40, -1.15),
      new THREE.Vector3(0, 1.39, -1.225),
      new THREE.Vector3(0, 1.22, -1.262),
      new THREE.Vector3(0, 0.95, -1.27),
      new THREE.Vector3(0, 0.76, -1.268),
      new THREE.Vector3(0, 0.60, -1.265)
    ]);
    add(new THREE.TubeGeometry(tailCurve, 10, 0.022, 5, false), 'body', 0, 0, 0);
    add(lathe([
      [0.0, 0.24], [0.04, 0.30], [0.055, 0.40], [0.046, 0.52], [0.026, 0.63], [0.0, 0.68]
    ], 6), 'tail', 0, 0, -1.265);

    return g;
  }

  const cream = makeCattle({
    body: ['hide_cream', 0xd6c4a8],
    head: ['hide_cream', 0xd6c4a8],
    neck: ['hide_grey', 0x9a948b],
    legs: ['hide_dusty', 0xc9a27f],
    ear: ['ear_skin', 0xd8b19c],
    horn: ['horn', 0x6b6258],
    hoof: ['hoof', 0x5b5550],
    nose: ['nose_skin', 0x3e3936],
    tail: ['tail_hair', 0x3b3531]
  });
  const red = makeCattle({
    body: ['hide_red', 0xa65b35],
    head: ['hide_red', 0xa65b35],
    neck: ['hide_dark_red', 0x8e4c2e],
    legs: ['hide_tan', 0xc39a72],
    ear: ['ear_skin', 0xc98f70],
    horn: ['horn', 0x544a42],
    hoof: ['hoof', 0x4c4642],
    nose: ['nose_skin', 0x3a302b],
    tail: ['tail_hair', 0x3a2c25]
  });
  const grey = makeCattle({
    body: ['hide_light_grey', 0xbebbb4],
    head: ['hide_charcoal', 0x56524f],
    neck: ['hide_charcoal', 0x56524f],
    legs: ['hide_dusty', 0xcdb597],
    ear: ['ear_skin', 0xc9a493],
    horn: ['horn', 0x4e4843],
    hoof: ['hoof', 0x504b47],
    nose: ['nose_skin', 0x2f2b29],
    tail: ['tail_hair', 0x3a3532]
  });

  return { cattle_cream: cream, cattle_red: red, cattle_grey: grey };
}
```