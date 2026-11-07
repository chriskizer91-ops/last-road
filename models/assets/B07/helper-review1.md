- **Sawhorse (overlap 0.40):** this was the real problem. On the sheet it stands on a rectangular dirt patch about 1.3 × 0.6 m, and its top view is almost entirely that patch. The model had no ground, so the top and front views could never match. I've added a low dirt slab with a few grass tufts, and widened the front and top boxes to cover the patch.
- **Sawhorse shape:** the side view on the sheet is a true "A" that is wider at the feet (about 0.62 m spread). The model was a narrow trapezoid. The legs now converge to the beam at the top, splay to ±0.3 m at the bottom, and splay slightly outward in x as on the front view. The chain is moved to match, the plank is a little thicker, and the bolt heads are added.
- **Windsock height:** the mouth hoop sat about 0.1 m too high, and its top was the model's highest point instead of the finial. The sheet puts the mouth centre at about 2.69 m and the finial at about 3.02 m. I lowered the pole top, collar, swivel and finial, and set the droop to 0.24 rad. The sheet's tail bottom (about 2.20 m) and mouth bottom (about 2.38 m) now match.
- **Drums and tyre:** these are right. Their sizes, the orange band height, the bung positions and the half-buried tyre arch match the sheet.
- **Remaining windsock gap:** most of the lost overlap comes from the sheet drawing the stone ring and the hoop in slight perspective. The model can't follow that without distorting.

```json
{
  "objects": [
    {
      "name": "windsock",
      "size_m": [2.17, 3.02, 0.94],
      "views": [
        {"label": "profile (sock pointing right)", "box": [10, 18, 481, 746], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "end view looking into the sock mouth", "box": [488, 36, 744, 746], "cam": [-1, 0, 0], "up": [0, 1, 0]},
        {"label": "top view with sock", "box": [18, 783, 503, 962], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "sawhorse",
      "size_m": [1.30, 0.52, 0.64],
      "views": [
        {"label": "front (on dirt patch)", "box": [782, 100, 1080, 222], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "side (A-frame with chain)", "box": [1104, 92, 1258, 222], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "top (dirt patch)", "box": [1279, 109, 1516, 221], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "drum_white",
      "size_m": [0.64, 0.80, 0.64],
      "views": [
        {"label": "front", "box": [826, 283, 982, 470], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "side", "box": [1097, 289, 1238, 470], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "top", "box": [1319, 300, 1474, 456], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "drum_orange",
      "size_m": [0.64, 0.80, 0.64],
      "views": [
        {"label": "front", "box": [826, 521, 984, 718], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "side", "box": [1097, 525, 1238, 718], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "top", "box": [1318, 566, 1476, 714], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "tire",
      "size_m": [0.96, 0.54, 0.22],
      "views": [
        {"label": "front (half-buried tire face)", "box": [806, 788, 1032, 916], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "side (tread)", "box": [1126, 772, 1172, 932], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "top", "box": [1288, 838, 1482, 895], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    }
  ],
  "notes": "Strip-marker set; the scale bar gives 1 m = 230 px. The set holds:\n- A ~3.0 m galvanised windsock pole. Its ~1.55 m orange/white sock has its mouth centre at ~2.69 m and droops ~14 degrees. A ~0.9 m ring of whitewashed stones sits at its base.\n- A 1.12 m white timber A-frame sawhorse with a chain. Its legs splay to ~0.62 m at the feet, and it stands on a 1.3 x 0.64 m dirt patch with grass tufts. The sheet's top view of it is mostly that patch.\n- Two 0.64 x 0.8 m drums: plain white, and white with an orange lower band.\n- A ~0.96 m whitewashed tyre, half-buried upright.\nThe views are drawn at slightly different scales, so sizes are compromises. The sheet's stone ring and sock hoop are drawn in slight perspective, which the orthographic fit can't follow. The second windsock top view shows the base without the sock and is left out. Dirt patches are modelled under the windsock and the sawhorse only; the drum and tyre views are cropped to the object."
}
```

```js
function build(THREE) {
  const mats = {};
  function mat(name, color, extra) {
    if (!mats[name]) {
      const p = { color: color, roughness: 0.85, metalness: 0.0 };
      if (extra) for (const k in extra) p[k] = extra[k];
      mats[name] = new THREE.MeshStandardMaterial(p);
    }
    return mats[name];
  }
  function mk(geo, name, color, extra) {
    const m = new THREE.Mesh(geo, mat(name, color, extra));
    m.name = name;
    return m;
  }
  let seed = 20240607;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function V(a) { return new THREE.Vector3(a[0], a[1], a[2]); }
  function rod(parent, a, b, r, name, color) {
    const geo = new THREE.TubeGeometry(new THREE.LineCurve3(V(a), V(b)), 1, r, 6, false);
    const m = mk(geo, name, color);
    parent.add(m);
    return m;
  }

  const COL = {
    dirt: 0xa5694a,
    stone: 0xdedbd3,
    galv: 0x9b9c98,
    rust: 0x7d4b2e,
    canvasO: 0xd66f3b,
    canvasW: 0xdcd3c3,
    timber: 0xdad3c4,
    steelW: 0xd6d0c4,
    orange: 0xd5743d,
    rustSteel: 0x9e5d36,
    rubber: 0xd4d0c6,
    grass: 0xa39260
  };

  function tuft(parent, x, z, y0, s) {
    for (let i = 0; i < 5; i++) {
      const h = (0.07 + rnd() * 0.05) * s;
      const geo = new THREE.ConeGeometry(0.007 * s, h, 4, 1, true);
      geo.translate(0, h / 2, 0);
      const b = mk(geo, 'dry_grass', COL.grass, { side: THREE.DoubleSide });
      b.position.set(x + (rnd() - 0.5) * 0.04, y0, z + (rnd() - 0.5) * 0.04);
      b.rotation.set((rnd() - 0.5) * 0.7, rnd() * Math.PI, (rnd() - 0.5) * 0.7);
      parent.add(b);
    }
  }

  // ---------------- WINDSOCK ----------------
  function windsock() {
    const g = new THREE.Group();
    const root = new THREE.Group();
    g.add(root);

    const dirtR = 0.47;
    const dirt = mk(new THREE.CylinderGeometry(0.455, dirtR, 0.04, 28), 'dirt', COL.dirt);
    dirt.position.y = 0.02;
    root.add(dirt);

    // ring of whitewashed stones
    const stoneGeo = new THREE.SphereGeometry(1, 8, 6);
    const n = 18;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.1;
      const rr = 0.375 + (rnd() - 0.5) * 0.025;
      const s = mk(stoneGeo, 'stone', COL.stone);
      const sy = 0.032 + rnd() * 0.012;
      s.scale.set(0.042 + rnd() * 0.012, sy, 0.056 + rnd() * 0.012);
      s.position.set(Math.cos(a) * rr, 0.04 + sy * 0.55, Math.sin(a) * rr);
      s.rotation.y = -a + (rnd() - 0.5) * 0.3;
      root.add(s);
    }

    // base plate + gussets
    const plate = mk(new THREE.CylinderGeometry(0.09, 0.09, 0.025, 16), 'rusty_iron', COL.rust);
    plate.position.y = 0.0525;
    root.add(plate);
    for (let k = 0; k < 4; k++) {
      const sh = new THREE.Shape();
      sh.moveTo(0, 0);
      sh.lineTo(0.08, 0);
      sh.lineTo(0, 0.17);
      sh.lineTo(0, 0);
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false });
      geo.translate(0.04, 0, -0.006);
      const gu = mk(geo, 'rusty_iron', COL.rust);
      gu.position.y = 0.065;
      gu.rotation.y = k * Math.PI / 2;
      root.add(gu);
    }

    // pole
    const poleTop = 2.33;
    const poleLen = poleTop - 0.04;
    const pole = mk(new THREE.CylinderGeometry(0.045, 0.045, poleLen, 12), 'galvanised_steel', COL.galv);
    pole.position.y = 0.04 + poleLen / 2;
    root.add(pole);
    const joint = mk(new THREE.CylinderGeometry(0.052, 0.052, 0.05, 12), 'galvanised_steel', COL.galv);
    joint.position.y = 1.12;
    root.add(joint);
    const collar = mk(new THREE.CylinderGeometry(0.058, 0.058, 0.08, 12), 'rusty_iron', COL.rust);
    collar.position.y = poleTop;
    root.add(collar);

    // swivel spindle, bearings, finial
    const spBot = poleTop + 0.04, spTop = 2.95;
    const spindle = mk(new THREE.CylinderGeometry(0.024, 0.024, spTop - spBot, 10), 'rusty_iron', COL.rust);
    spindle.position.y = (spBot + spTop) / 2;
    root.add(spindle);
    const bLo = 2.42, bHi = 2.88;
    for (const by of [bLo, bHi]) {
      const b = mk(new THREE.CylinderGeometry(0.034, 0.034, 0.06, 10), 'rusty_iron', COL.rust);
      b.position.y = by;
      root.add(b);
    }
    const fin = mk(new THREE.ConeGeometry(0.028, 0.07, 8), 'rusty_iron', COL.rust);
    fin.position.y = spTop + 0.035;
    root.add(fin);

    // sock + frame ring (tilted with the droop)
    const d = 0.24, mx = 0.16, my = 2.69, ringR = 0.30, L = 1.55, r0 = 0.29, r1 = 0.12;
    const cd = Math.cos(d), sd = Math.sin(d);
    const sock = new THREE.Group();
    sock.position.set(mx, my, 0);
    sock.rotation.z = -d;
    root.add(sock);

    const ring = mk(new THREE.TorusGeometry(ringR, 0.012, 6, 32), 'rusty_iron', COL.rust);
    ring.rotation.y = Math.PI / 2;
    sock.add(ring);
    rod(sock, [0, 0, -ringR], [0, 0, ringR], 0.008, 'rusty_iron', COL.rust);

    const nb = 5;
    for (let i = 0; i < nb; i++) {
      const ra = r0 + (r1 - r0) * (i / nb);
      const rb = r0 + (r1 - r0) * ((i + 1) / nb);
      const isO = i % 2 === 0;
      const band = mk(
        new THREE.CylinderGeometry(rb, ra, L / nb, 20, 1, true),
        isO ? 'canvas_orange' : 'canvas_white',
        isO ? COL.canvasO : COL.canvasW,
        { side: THREE.DoubleSide }
      );
      band.rotation.z = -Math.PI / 2;
      band.position.x = (L / nb) * (i + 0.5);
      sock.add(band);
    }

    // arms from swivel to ring
    rod(root, [0.02, bHi, 0], [mx + ringR * sd, my + ringR * cd - 0.005, 0], 0.01, 'rusty_iron', COL.rust);
    rod(root, [0.02, bLo, 0], [mx - ringR * sd, my - ringR * cd, 0], 0.01, 'rusty_iron', COL.rust);

    // centre bounding box on x
    const xTail = mx + L * cd + r1 * sd;
    root.position.x = -(xTail - dirtR) / 2;
    return g;
  }

  // ---------------- SAWHORSE ----------------
  function sawhorse() {
    const g = new THREE.Group();
    const T = ['painted_timber', COL.timber];

    // dirt patch
    const patchW = 1.30, patchD = 0.64, patchH = 0.045;
    const patch = mk(new THREE.BoxGeometry(patchW, patchH, patchD), 'dirt', COL.dirt);
    patch.position.y = patchH / 2;
    g.add(patch);

    // top plank
    const beamL = 1.12, beamH = 0.13, beamD = 0.09, top = 0.52;
    const beam = mk(new THREE.BoxGeometry(beamL, beamH, beamD), T[0], T[1]);
    beam.position.y = top - beamH / 2;
    g.add(beam);

    // A-frame legs: converge on the plank at the top, splay in z (and a little in x) at the feet
    const legW = 0.10, legT = 0.07;
    const xTop = 0.46, xBot = 0.495, yTop = 0.50, yBot = 0.035, zTop = 0.03, zBot = 0.265;
    const up = new THREE.Vector3(0, 1, 0);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const a = new THREE.Vector3(sx * xBot, yBot, sz * zBot);
        const b = new THREE.Vector3(sx * xTop, yTop, sz * zTop);
        const dir = b.clone().sub(a);
        const len = dir.length();
        dir.normalize();
        const leg = mk(new THREE.BoxGeometry(legW, len, legT), T[0], T[1]);
        leg.position.copy(a).add(b).multiplyScalar(0.5);
        leg.quaternion.setFromUnitVectors(up, dir);
        g.add(leg);

        // bolt head where the leg meets the plank
        const bolt = mk(new THREE.CylinderGeometry(0.015, 0.015, 0.012, 8), 'rusty_iron', COL.rust);
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(sx * 0.465, 0.45, sz * 0.097);
        g.add(bolt);
      }
      // chain between the leg pair
      const yc = 0.17;
      const t = (yc - yBot) / (yTop - yBot);
      const xc = sx * (xBot + (xTop - xBot) * t);
      const zc = zBot + (zTop - zBot) * t - 0.02;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xc, yc, -zc),
        new THREE.Vector3(xc, yc - 0.04, 0),
        new THREE.Vector3(xc, yc, zc)
      ]);
      const chain = mk(new THREE.TubeGeometry(curve, 10, 0.01, 5, false), 'rusty_iron', COL.rust);
      g.add(chain);
    }

    // grass tufts on the patch
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tuft(g, sx * 0.55, sz * 0.24, patchH, 1.0);
    tuft(g, -0.12, 0.13, patchH, 1.1);
    tuft(g, 0.16, -0.10, patchH, 1.0);
    tuft(g, 0.03, 0.22, patchH, 0.9);
    return g;
  }

  // ---------------- DRUMS ----------------
  function drum(orangeBand, bungs) {
    const g = new THREE.Group();
    const R = 0.305, H = 0.80, bodyTop = 0.775, band = 0.31, seg = 28;
    const W = ['painted_steel', COL.steelW];
    const O = ['paint_orange', COL.orange];

    if (orangeBand) {
      const lo = mk(new THREE.CylinderGeometry(R, R, band, seg), O[0], O[1]);
      lo.position.y = band / 2;
      g.add(lo);
      const up = mk(new THREE.CylinderGeometry(R, R, bodyTop - band, seg), W[0], W[1]);
      up.position.y = band + (bodyTop - band) / 2;
      g.add(up);
    } else {
      const body = mk(new THREE.CylinderGeometry(R, R, bodyTop, seg), W[0], W[1]);
      body.position.y = bodyTop / 2;
      g.add(body);
    }

    const lowM = orangeBand ? O : W;
    const bc = mk(new THREE.TorusGeometry(R + 0.002, 0.014, 6, seg), lowM[0], lowM[1]);
    bc.rotation.x = Math.PI / 2;
    bc.position.y = 0.014;
    g.add(bc);

    const tr = mk(new THREE.TorusGeometry(R, 0.016, 6, seg), 'rusty_steel', COL.rustSteel);
    tr.rotation.x = Math.PI / 2;
    tr.position.y = H - 0.016;
    g.add(tr);

    for (const hy of [0.24, 0.53]) {
      const nm = (orangeBand && hy < band) ? O : W;
      const h = mk(new THREE.TorusGeometry(R, 0.011, 6, seg), nm[0], nm[1]);
      h.rotation.x = Math.PI / 2;
      h.position.y = hy;
      g.add(h);
    }

    for (const b of bungs) {
      const bg = mk(new THREE.CylinderGeometry(0.032, 0.034, 0.02, 12), 'rusty_steel', COL.rustSteel);
      bg.position.set(b[0] * R, bodyTop + 0.01, b[1] * R);
      g.add(bg);
    }
    return g;
  }

  // ---------------- TIRE ----------------
  function tire() {
    const g = new THREE.Group();
    const bs = 0.03, bt = 0.04, depth = 0.14;
    const Ro = 0.45, Ri = 0.32, c = 0.03;
    const to = Math.asin(c / Ro), ti = Math.asin(c / Ri);
    const sh = new THREE.Shape();
    const ox = Ro * Math.cos(to);
    const ix = Ri * Math.cos(ti);
    sh.moveTo(ox, 0);
    sh.absarc(0, c, Ro, -to, Math.PI + to, false);
    sh.lineTo(-ix, 0);
    sh.absarc(0, c, Ri, Math.PI + ti, -ti, true);
    sh.lineTo(ox, 0);
    const geo = new THREE.ExtrudeGeometry(sh, {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: bt,
      bevelSize: bs,
      bevelSegments: 3,
      curveSegments: 16
    });
    const t = mk(geo, 'painted_rubber', COL.rubber);
    t.position.set(0, bs, -depth / 2);
    g.add(t);
    return g;
  }

  return {
    windsock: windsock(),
    sawhorse: sawhorse(),
    drum_white: drum(false, [[0.32, -0.46], [-0.36, 0.72]]),
    drum_orange: drum(true, [[0.31, -0.70], [-0.37, 0.70]]),
    tire: tire()
  };
}
```