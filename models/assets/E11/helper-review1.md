- **Farm jack (overlap 0.539):** the main problem. The holed standard bar sits about 25 px left of the sheet's bar.
  - The sheet's bar runs down under the clamp like the stroke of a "1": the flag sticks out left and the clamp's bottom-right corner hugs the bar's right edge.
  - The nose and the housing's left edge also meet the bar there, at about x −0.085.
  - The bar was also too thin (32 px against about 40 px), and it had no through-holes, though the sheet shows a column of them.
- **Jack fix:** move the bar to x −0.085…−0.039 (0.046 wide), cut 33 round through-holes about 26 mm apart, and refit the pedestal top to the bar.
- **Shovel (0.832):** blade shoulders, socket, shaft, ferrule and D-handle heights and widths line up with the sheet. It's fine.
- **Sand ladder (0.955):** good. The lopsided slots are kept as drawn.
- **Views:** the boxes and cameras are right. The stacked pair is a perspective drawing, so no flat view is missing. The JSON is unchanged.

```js
function build(THREE) {
  const COLORS = {
    orange_plastic: 0xd2683f,
    rusty_iron: 0x5f4b40,
    timber: 0x8a7b66,
    paint_red: 0x82362c,
    rubber: 0x2c2927
  };
  const mats = {};
  function mesh(geo, name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name] });
    const m = new THREE.Mesh(geo, mats[name]);
    m.name = name;
    return m;
  }
  function boxAt(name, x0, y0, x1, y1, d, z) {
    const m = mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), d), name);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, z || 0);
    return m;
  }
  function cylBetween(name, a, b, r0, r1, seg) {
    const A = new THREE.Vector3(a[0], a[1], a[2] || 0);
    const B = new THREE.Vector3(b[0], b[1], b[2] || 0);
    const dir = new THREE.Vector3().subVectors(B, A);
    const len = dir.length();
    const m = mesh(new THREE.CylinderGeometry(r1, r0, len, seg), name);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
  }

  // ================= SAND LADDER (lies flat, length along x) =================
  const ladder = new THREE.Group();
  {
    const L = 0.53, W = 0.157, c = 0.055;
    const s = new THREE.Shape();
    s.moveTo(-L + c, -W);
    s.lineTo(L - c, -W);
    s.lineTo(L, -W + c);
    s.lineTo(L, W - c);
    s.lineTo(L - c, W);
    s.lineTo(-L + c, W);
    s.lineTo(-L, W - c);
    s.lineTo(-L, -W + c);
    s.closePath();
    function slotH(cx, cy, a, r) {
      const p = new THREE.Path();
      p.moveTo(cx - a, cy - r);
      p.lineTo(cx + a, cy - r);
      p.absarc(cx + a, cy, r, -Math.PI / 2, Math.PI / 2, false);
      p.lineTo(cx - a, cy + r);
      p.absarc(cx - a, cy, r, Math.PI / 2, Math.PI * 1.5, false);
      return p;
    }
    function slotV(cx, cy, a, r) {
      const p = new THREE.Path();
      p.moveTo(cx + r, cy - a);
      p.lineTo(cx + r, cy + a);
      p.absarc(cx, cy + a, r, 0, Math.PI, false);
      p.lineTo(cx - r, cy - a);
      p.absarc(cx, cy - a, r, Math.PI, Math.PI * 2, false);
      return p;
    }
    [-0.25, 0.035, 0.315].forEach(function (x) {
      s.holes.push(slotH(x, 0.124, 0.03, 0.013));
      s.holes.push(slotH(x, -0.124, 0.03, 0.013));
    });
    s.holes.push(slotV(-0.49, 0, 0.025, 0.009));
    s.holes.push(slotV(0.49, 0, 0.025, 0.009));
    const plate = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: false, curveSegments: 4 }), 'orange_plastic');
    plate.rotation.x = -Math.PI / 2; // shape plane -> ground plane, extrusion goes up
    ladder.add(plate);

    const rows = [-0.068, 0, 0.068];
    rows.forEach(function (z) {
      // raised rib under each row of teeth
      ladder.add(boxAt('orange_plastic', -0.41, 0.022, 0.41, 0.030, 0.036, z));
      for (let i = 0; i < 16; i++) {
        const nub = mesh(new THREE.CylinderGeometry(0.006, 0.015, 0.016, 4, 1), 'orange_plastic');
        nub.rotation.y = Math.PI / 4;
        nub.position.set(-0.39 + i * 0.052, 0.038, z);
        ladder.add(nub);
      }
    });
  }

  // ================= SHOVEL (stands on its tip, blade faces +z) =================
  const shovel = new THREE.Group();
  {
    const b = new THREE.Shape();
    b.moveTo(-0.112, 0.293);
    b.lineTo(-0.110, 0.165);
    b.quadraticCurveTo(-0.095, 0.055, -0.014, 0.006);
    b.quadraticCurveTo(0, -0.006, 0.014, 0.006);
    b.quadraticCurveTo(0.095, 0.055, 0.110, 0.165);
    b.lineTo(0.112, 0.293);
    b.closePath();
    const blade = mesh(new THREE.ExtrudeGeometry(b, { depth: 0.004, bevelEnabled: false, curveSegments: 10 }), 'rusty_iron');
    blade.position.z = -0.002;
    shovel.add(blade);

    // rolled step along the top of the blade
    shovel.add(boxAt('rusty_iron', -0.112, 0.287, 0.112, 0.295, 0.016, -0.006));

    // frog ridge on the back of the blade
    const frog = mesh(new THREE.ConeGeometry(0.022, 0.13, 8), 'rusty_iron');
    frog.rotation.x = Math.PI;
    frog.scale.z = 0.5;
    frog.position.set(0, 0.225, -0.006);
    shovel.add(frog);

    // lower socket
    const sock = mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.14, 10), 'rusty_iron');
    sock.position.y = 0.36;
    shovel.add(sock);

    // wooden shaft
    const shaft = mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.40, 10), 'timber');
    shaft.position.y = 0.627;
    shovel.add(shaft);

    // upper ferrule
    const fer = mesh(new THREE.CylinderGeometry(0.017, 0.024, 0.075, 10), 'rusty_iron');
    fer.position.y = 0.8625;
    shovel.add(fer);

    // D-handle arms
    [-1, 1].forEach(function (sx) {
      const pts = [
        new THREE.Vector3(sx * 0.008, 0.893, 0),
        new THREE.Vector3(sx * 0.030, 0.918, 0),
        new THREE.Vector3(sx * 0.052, 0.947, 0),
        new THREE.Vector3(sx * 0.064, 0.975, 0),
        new THREE.Vector3(sx * 0.067, 1.000, 0)
      ];
      const arm = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.008, 6, false), 'rusty_iron');
      shovel.add(arm);
      const cap = mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.016, 10), 'rusty_iron');
      cap.rotation.z = Math.PI / 2;
      cap.position.set(sx * 0.066, 0.988, 0);
      shovel.add(cap);
    });

    // wooden grip
    const grip = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 12), 'timber');
    grip.rotation.z = Math.PI / 2;
    grip.position.y = 0.988;
    shovel.add(grip);
  }

  // ================= FARM JACK (front shows the holed bar face) =================
  const jack = new THREE.Group();
  {
    // standard bar with its column of through-holes (bar sits under the clamp like the stroke of a "1")
    const bs = new THREE.Shape();
    bs.moveTo(-0.085, 0.03);
    bs.lineTo(-0.039, 0.03);
    bs.lineTo(-0.039, 0.99);
    bs.lineTo(-0.085, 0.99);
    bs.closePath();
    for (let i = 0; i < 33; i++) {
      const h = new THREE.Path();
      h.absarc(-0.062, 0.09 + i * 0.0265, 0.0078, 0, Math.PI * 2, true);
      bs.holes.push(h);
    }
    const bar = mesh(new THREE.ExtrudeGeometry(bs, { depth: 0.03, bevelEnabled: false, curveSegments: 4 }), 'paint_red');
    bar.position.z = -0.015;
    jack.add(bar);

    // top clamp with hole
    const tc = new THREE.Shape();
    tc.moveTo(-0.1218, 0.9805);
    tc.lineTo(-0.1218, 1.0126);
    tc.lineTo(-0.0897, 1.0471);
    tc.lineTo(-0.0126, 1.0471);
    tc.lineTo(-0.0034, 1.0379);
    tc.lineTo(-0.0034, 1.0057);
    tc.lineTo(-0.0276, 0.9805);
    tc.closePath();
    const hole = new THREE.Path();
    hole.absarc(-0.0218, 1.0241, 0.0075, 0, Math.PI * 2, true);
    tc.holes.push(hole);
    const clamp = mesh(new THREE.ExtrudeGeometry(tc, { depth: 0.034, bevelEnabled: false, curveSegments: 8 }), 'paint_red');
    clamp.position.z = -0.017;
    jack.add(clamp);

    // base plate and pedestal (pedestal top wraps the bar)
    jack.add(boxAt('paint_red', -0.1414, 0, -0.030, 0.024, 0.09));
    const ped = new THREE.Shape();
    ped.moveTo(-0.131, 0.0241);
    ped.lineTo(-0.030, 0.0241);
    ped.lineTo(-0.034, 0.0770);
    ped.lineTo(-0.092, 0.0770);
    ped.closePath();
    const pedestal = mesh(new THREE.ExtrudeGeometry(ped, { depth: 0.05, bevelEnabled: false }), 'paint_red');
    pedestal.position.z = -0.025;
    jack.add(pedestal);

    // climbing mechanism housing around the bar
    jack.add(boxAt('paint_red', -0.0966, 0.2103, -0.0069, 0.4057, 0.07));
    // lifting nose (toe) and its down-turned lip
    jack.add(boxAt('paint_red', -0.1609, 0.2644, -0.085, 0.2816, 0.05));
    jack.add(boxAt('paint_red', -0.1609, 0.2379, -0.1425, 0.2678, 0.05));
    // connecting link to the handle socket
    jack.add(boxAt('paint_red', -0.0122, 0.379, 0.0328, 0.414, 0.05));

    // pins through the housing
    [[-0.0414, 0.377], [-0.0276, 0.3138], [-0.0471, 0.2391]].forEach(function (p) {
      const pin = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8), 'paint_red');
      pin.rotation.x = Math.PI / 2;
      pin.position.set(p[0], p[1], 0);
      jack.add(pin);
    });

    // handle socket, handle tube, rubber grip
    jack.add(cylBetween('paint_red', [0.0218, 0.377], [0.0506, 0.4575], 0.017, 0.017, 10));
    jack.add(cylBetween('paint_red', [0.0483, 0.446], [0.1161, 0.8483], 0.011, 0.011, 10));
    jack.add(cylBetween('rubber', [0.1161, 0.8483], [0.1448, 1.0172], 0.0135, 0.0135, 10));
  }

  return { sand_ladder: ladder, shovel: shovel, farm_jack: jack };
}
```