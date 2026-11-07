```json
{"objects": [{"name": "big_cat", "size_m": [0.54, 1.52, 2.6],
  "views": [
    {"label": "standing side view on the rock (top left, facing left)", "box": [94, 10, 904, 484], "cam": [1, 0, 0], "up": [0, 1, 0]},
    {"label": "front view on the rock (top right)", "box": [1121, 21, 1291, 494], "cam": [0, 0, 1], "up": [0, 1, 0]}
  ]}],
 "notes": "An adult lioness (no mane) standing alert, about 2.6 m from nose to tail tip, taken from the 2.6 m end of the scale bar. That makes her about 1.25 m at the shoulder and 1.5 m to the ear tips. The bar's own ticks are uneven, and read literally they would make her about 3.7 m long, so I used the 2.6 m label as her length. The rock is not modelled. The bottom-left walking drawing is a different pose and the bottom-right is a scene shot, so neither is listed as a view."}
```

```js
function build(THREE) {
  const cat = new THREE.Group();
  cat.name = 'big_cat';

  // Side view (top-left drawing) -> model metres: 311 px per metre,
  // nose on the left of the sheet = +z, paws (sheet y 482) at y = 0.
  const PX = 311;
  const Z = (px) => (499 - px) / PX;
  const Y = (py) => (482 - py) / PX;

  const M = {
    fur_tawny: new THREE.MeshStandardMaterial({ color: 0xbf8b4c, roughness: 0.95, metalness: 0 }),
    fur_cream: new THREE.MeshStandardMaterial({ color: 0xd9c4a0, roughness: 0.95, metalness: 0 }),
    fur_dark: new THREE.MeshStandardMaterial({ color: 0x2e2520, roughness: 1.0, metalness: 0 }),
    nose_leather: new THREE.MeshStandardMaterial({ color: 0x5a3c34, roughness: 0.7, metalness: 0 })
  };

  const sphCache = {};
  function sphere(w, h) {
    const k = w + 'x' + h;
    if (!sphCache[k]) sphCache[k] = new THREE.SphereGeometry(1, w, h);
    return sphCache[k];
  }
  // ellipsoid: scaled unit sphere
  function ell(mat, x, y, z, rx, ry, rz, w, h, ax, ay, az) {
    const m = new THREE.Mesh(sphere(w, h), M[mat]);
    m.name = mat;
    m.position.set(x, y, z);
    m.scale.set(rx, ry, rz);
    m.rotation.set(ax || 0, ay || 0, az || 0);
    cat.add(m);
    return m;
  }
  // tapered cylinder from point a (radius ra) to point b (radius rb)
  const UP = new THREE.Vector3(0, 1, 0);
  function limb(mat, a, b, ra, rb, closed) {
    const A = new THREE.Vector3(a[0], a[1], a[2]);
    const B = new THREE.Vector3(b[0], b[1], b[2]);
    const d = new THREE.Vector3().subVectors(B, A);
    const len = d.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rb, ra, len, 10, 1, !closed), M[mat]);
    m.name = mat;
    m.position.copy(A).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(UP, d.normalize());
    cat.add(m);
    return m;
  }

  // ---- torso ----
  ell('fur_tawny', 0, 0.95, 0.60, 0.20, 0.33, 0.32, 14, 10);   // chest
  ell('fur_tawny', 0, 0.93, 0.12, 0.20, 0.33, 0.56, 16, 12);   // ribs and loin
  ell('fur_tawny', 0, 0.96, -0.42, 0.19, 0.26, 0.28, 14, 10);  // croup
  ell('fur_cream', 0, 0.66, 0.06, 0.15, 0.11, 0.26, 12, 8);    // slack belly

  // shoulders and haunches, both sides
  for (const s of [1, -1]) {
    ell('fur_tawny', s * 0.155, 0.82, 0.68, 0.115, 0.26, 0.15, 12, 8);
    ell('fur_tawny', s * 0.11, 0.83, -0.45, 0.11, 0.33, 0.25, 14, 10);
  }

  // ---- neck and head ----
  ell('fur_tawny', 0, 1.10, 0.79, 0.17, 0.32, 0.21, 12, 10, 0.63);   // neck, tilted up-forward
  ell('fur_tawny', 0, 1.20, 0.70, 0.15, 0.12, 0.22, 12, 8, -0.26);   // nape line to withers
  ell('fur_tawny', 0, 1.30, 1.04, 0.17, 0.15, 0.17, 14, 10);         // cranium
  ell('fur_cream', 0, 1.205, 1.205, 0.09, 0.085, 0.095, 12, 8);      // muzzle
  ell('fur_cream', 0, 1.16, 1.08, 0.18, 0.085, 0.13, 12, 8);         // cheeks and jaw
  ell('nose_leather', 0, 1.245, 1.282, 0.035, 0.025, 0.02, 8, 6);    // nose
  for (const s of [1, -1]) {
    ell('fur_tawny', s * 0.14, 1.435, 0.97, 0.065, 0.08, 0.035, 8, 6, -0.1, 0, -s * 0.3); // rounded ears
  }

  // ---- front legs ----
  function frontLeg(s, zElbow, zWrist, zPaw) {
    const sh = [s * 0.15, 0.90, zElbow];
    const el = [s * 0.14, Y(300), zElbow];
    const wr = [s * 0.135, Y(428), zWrist];
    const pa = [s * 0.13, 0.055, zPaw];
    limb('fur_tawny', sh, el, 0.10, 0.092);
    limb('fur_tawny', el, wr, 0.09, 0.07);
    limb('fur_tawny', wr, [pa[0], 0.08, pa[2] - 0.02], 0.07, 0.068);
    ell('fur_tawny', el[0], el[1], el[2], 0.092, 0.092, 0.092, 8, 6);
    ell('fur_tawny', wr[0], wr[1], wr[2], 0.07, 0.07, 0.07, 8, 6);
    ell('fur_cream', pa[0], pa[1], pa[2], 0.115, 0.055, 0.10, 10, 6);
  }
  frontLeg(1, Z(285), Z(265), Z(258));          // near (left) foreleg
  frontLeg(-1, Z(300), Z(292), Z(290) + 0.02);  // far (right) foreleg

  // ---- hind legs ----
  function hindLeg(s, hip, stifle, hock, zPaw) {
    const hp = [s * 0.11, hip[0], hip[1]];
    const st = [s * 0.12, stifle[0], stifle[1]];
    const hk = [s * 0.12, hock[0], hock[1]];
    const pa = [s * 0.12, 0.055, zPaw];
    limb('fur_tawny', hp, st, 0.11, 0.09);
    limb('fur_tawny', st, hk, 0.08, 0.06);
    limb('fur_tawny', hk, [pa[0], 0.08, pa[2] - 0.03], 0.058, 0.055);
    ell('fur_tawny', st[0], st[1], st[2], 0.085, 0.085, 0.085, 8, 6);
    ell('fur_tawny', hk[0], hk[1], hk[2], 0.062, 0.062, 0.062, 8, 6);
    ell('fur_cream', pa[0], pa[1], pa[2], 0.10, 0.055, 0.095, 10, 6);
  }
  // near (left) hind leg set back, hock well behind
  hindLeg(1, [Y(175), Z(665)], [Y(318), Z(628)], [Y(396), Z(745)], Z(722));
  // far (right) hind leg stepped forward under the belly
  hindLeg(-1, [Y(185), Z(650)], [0.56, -0.21], [0.27, -0.26], Z(548));

  // ---- tail ----
  limb('fur_tawny', [0, 1.10, -0.60], [0, 0.88, -0.75], 0.06, 0.042, true); // thick root
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.08, -0.63),
    new THREE.Vector3(0, 0.99, -0.71),
    new THREE.Vector3(0, 0.86, -0.765),
    new THREE.Vector3(0, 0.714, -0.823),
    new THREE.Vector3(0, 0.521, -0.92),
    new THREE.Vector3(0, 0.408, -1.016),
    new THREE.Vector3(0, 0.355, -1.10),
    new THREE.Vector3(0, 0.335, -1.17)
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 24, 0.034, 8, false), M.fur_tawny);
  tail.name = 'fur_tawny';
  cat.add(tail);
  ell('fur_dark', 0, 0.335, -1.188, 0.07, 0.10, 0.108, 10, 8); // black tail tuft

  return cat;
}
```