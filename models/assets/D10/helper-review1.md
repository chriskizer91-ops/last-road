- **Shapes, sizes and cameras are right.** Front, side and top fit around 0.9 for all three arches. The side views read correctly as the −x side.
- **Arch 3's front at 0.601 is not a bad box or camera.** On the sheet, a dirt and rubble line runs right across under the opening, and the crack is a dark fissure, not daylight. That closes the opening, so the sheet's outline reads as a solid dome. The model's floor is open and its crack lets light through, so the opening area counts as a mismatch, which gives about 0.6.
- **Fix for Arch 3, both parts drawn on the sheet:**
  - A low continuous debris strip across the floor of the opening. It sits under the beam, so the top view doesn't change.
  - The crown crack now opens from the top as a notch about 40% of the thickness deep, then seals toward the intrados. The painted dark line carries the rest of the fissure.
  - Whether this lifts the score depends on how the model's outline is read. Both changes match the sheet either way.
- **Arch 2's top at 0.72 comes from the sheet itself.** The top view bows the crown about 6 m back, but the side view only allows about 1.3 m. The −3 m crown offset is a compromise between the two, so I've left it.

```js
function build(THREE) {
  const mats = {};
  function mat(name, color) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: color, roughness: 0.95, metalness: 0.0 });
    return mats[name];
  }
  const ROCK = 'red_sandstone';
  const RUB = 'sandstone_rubble';
  const rockMat = mat(ROCK, 0xc4734f);
  const rubMat = mat(RUB, 0xb5765a);
  const SPH = new THREE.SphereGeometry(1, 7, 5);

  function makeRng(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function table(tab, v) {
    if (v <= tab[0][0]) return tab[0][1];
    for (let i = 0; i < tab.length - 1; i++) {
      const a = tab[i], b = tab[i + 1];
      if (v <= b[0]) return a[1] + (v - a[0]) / (b[0] - a[0]) * (b[1] - a[1]);
    }
    return tab[tab.length - 1][1];
  }

  // x where a horizontal line at height y crosses the polyline (leftmost or rightmost)
  function xAtY(poly, y, pickMax) {
    let best = null;
    for (let i = 0; i < poly.length - 1; i++) {
      const a = poly[i], b = poly[i + 1];
      const lo = Math.min(a[1], b[1]) - 1e-7, hi = Math.max(a[1], b[1]) + 1e-7;
      if (y < lo || y > hi) continue;
      let x;
      if (Math.abs(b[1] - a[1]) < 1e-9) x = pickMax ? Math.max(a[0], b[0]) : Math.min(a[0], b[0]);
      else x = a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]);
      if (best === null || (pickMax ? x > best : x < best)) best = x;
    }
    return best;
  }

  // ray from (cx,cy) at angle ang against the polyline; nearest or farthest hit
  function rayHit(poly, cx, cy, ang, far) {
    const dx = Math.cos(ang), dy = Math.sin(ang);
    let best = null, bestT = far ? -Infinity : Infinity;
    for (let i = 0; i < poly.length - 1; i++) {
      const ax = poly[i][0], ay = poly[i][1];
      const ex = poly[i + 1][0] - ax, ey = poly[i + 1][1] - ay;
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-12) continue;
      const qx = ax - cx, qy = ay - cy;
      const t = (qx * ey - qy * ex) / den;
      const u = (qx * dy - qy * dx) / den;
      if (u < -1e-6 || u > 1 + 1e-6 || t <= 1e-6) continue;
      if (far ? t > bestT : t < bestT) { bestT = t; best = [cx + dx * t, cy + dy * t]; }
    }
    return best;
  }

  // one slab: a front-view polygon extruded through depth, centred on zc
  function addPrism(group, pts, depth, zc) {
    const p = [];
    for (const q of pts) {
      if (p.length && Math.hypot(q[0] - p[p.length - 1][0], q[1] - p[p.length - 1][1]) < 1e-3) continue;
      p.push(q);
    }
    if (p.length > 2 && Math.hypot(p[0][0] - p[p.length - 1][0], p[0][1] - p[p.length - 1][1]) < 1e-3) p.pop();
    if (p.length < 3 || !(depth > 0)) return;
    let area = 0;
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      area += a[0] * b[1] - b[0] * a[1];
    }
    if (Math.abs(area) < 1e-4) return;
    const shape = new THREE.Shape();
    shape.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) shape.lineTo(p[i][0], p[i][1]);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, steps: 1, curveSegments: 1 });
    const mesh = new THREE.Mesh(geo, rockMat);
    mesh.name = ROCK;
    mesh.position.z = zc - depth / 2;
    group.add(mesh);
  }

  function addBoulder(group, x, y, z, rx, ry, rz, rotY) {
    const m = new THREE.Mesh(SPH, rubMat);
    m.name = RUB;
    m.position.set(x, y, z);
    m.scale.set(rx, ry, rz);
    m.rotation.y = rotY;
    group.add(m);
  }

  function buildArch(cfg) {
    const g = new THREE.Group();
    const s = cfg.s, cx = cfg.cx, gy = cfg.gy;
    const conv = (arr) => arr.map((p) => [(p[0] - cx) / s, (gy - p[1]) / s]);
    const outer = conv(cfg.outer);
    const inner = conv(cfg.inner);
    const ys = (gy - cfg.ysPx) / s;
    const Cx = (cfg.cPx - cx) / s, Cy = ys;
    let H = 0, halfW = 0;
    for (const p of outer) { H = Math.max(H, p[1]); halfW = Math.max(halfW, Math.abs(p[0])); }
    const R = 0.35 * (xAtY(outer, ys, true) - xAtY(outer, ys, false));

    function depthAt(mx, my, ph) {
      let d = table(cfg.depth, my);
      if (cfg.cn) {
        const t = Math.abs(mx) / cfg.cnW;
        if (t < 1) d *= 1 - cfg.cn * 0.5 * (1 + Math.cos(Math.PI * t));
      }
      d *= 1 + cfg.asym * (mx / halfW);
      d *= 1 + 0.035 * Math.sin(ph + cfg.seed * 1.7) + 0.025 * Math.sin(ph * 2.3 + cfg.seed * 0.9);
      return d;
    }
    function zAt(my, ph) {
      const t = Math.min(1, Math.max(0, my / H));
      return cfg.zCrown * t * t + 0.22 * Math.sin(ph * 1.3 + cfg.seed * 2.1);
    }

    // ---- legs: horizontal bands from the ground up to the springing line
    function legLevels(side) {
      const lv = [0, ys];
      const n = Math.max(2, Math.ceil(ys / 2.5));
      for (let i = 1; i < n; i++) lv.push(ys * i / n);
      for (const poly of [outer, inner]) for (const p of poly) {
        if (p[1] > 0.05 && p[1] < ys - 0.05 && Math.sign(p[0] - Cx) === side) lv.push(p[1]);
      }
      lv.sort((a, b) => a - b);
      const out = [lv[0]];
      for (let i = 1; i < lv.length; i++) if (lv[i] - out[out.length - 1] > 0.4) out.push(lv[i]);
      out[out.length - 1] = ys;
      return out;
    }
    for (const side of [-1, 1]) {
      const pick = side > 0;
      const lv = legLevels(side);
      for (let i = 0; i < lv.length - 1; i++) {
        const y0 = lv[i], y1 = lv[i + 1];
        const xo0 = xAtY(outer, y0, pick), xi0 = xAtY(inner, y0, pick);
        const xo1 = xAtY(outer, y1, pick), xi1 = xAtY(inner, y1, pick);
        if (xo0 === null || xi0 === null || xo1 === null || xi1 === null) continue;
        const my = (y0 + y1) / 2, mx = (xo0 + xi0 + xo1 + xi1) / 4;
        const u = side < 0 ? my : (2 * ys + Math.PI * R - my);
        const ph = u * 0.35;
        addPrism(g, [[xo0, y0], [xi0, y0], [xi1, y1], [xo1, y1]], depthAt(mx, my, ph), zAt(my, ph));
      }
    }

    // ---- upper part: wedges fanned from the centre of the opening
    let angs = [];
    for (let i = 0; i <= cfg.nFan; i++) angs.push(Math.PI * i / cfg.nFan);
    for (const poly of [outer, inner]) for (const p of poly) {
      if (p[1] > Cy + 1e-3) angs.push(Math.atan2(p[1] - Cy, p[0] - Cx));
    }
    let crackLo = null, crackHi = null;
    if (cfg.crackPx) {
      const kx = (cfg.crackPx[0] - cx) / s, ky = (gy - cfg.crackPx[1]) / s;
      const ca = Math.atan2(ky - Cy, kx - Cx);
      crackLo = ca - cfg.crackGap; crackHi = ca + cfg.crackGap;
      angs = angs.filter((a) => !(a > crackLo && a < crackHi));
      angs.push(crackLo, crackHi);
    }
    angs.sort((a, b) => a - b);
    const A = [angs[0]];
    for (let i = 1; i < angs.length; i++) if (angs[i] - A[A.length - 1] > 0.012) A.push(angs[i]);
    A[A.length - 1] = Math.PI;
    A[0] = 0;
    for (let i = 0; i < A.length - 1; i++) {
      const a0 = A[i], a1 = A[i + 1], am = (a0 + a1) / 2;
      const inCrack = crackLo !== null && am > crackLo && am < crackHi;
      const i0 = rayHit(inner, Cx, Cy, a0, false);
      let o0 = rayHit(outer, Cx, Cy, a0, true);
      const i1 = rayHit(inner, Cx, Cy, a1, false);
      let o1 = rayHit(outer, Cx, Cy, a1, true);
      if (!i0 || !o0 || !i1 || !o1) continue;
      if (inCrack) {
        // crack opens from the top as a notch, sealed toward the intrados (no daylight through)
        const f = cfg.crackSeal;
        o0 = [i0[0] + (o0[0] - i0[0]) * f, i0[1] + (o0[1] - i0[1]) * f];
        o1 = [i1[0] + (o1[0] - i1[0]) * f, i1[1] + (o1[1] - i1[1]) * f];
      }
      const mx = (i0[0] + o0[0] + o1[0] + i1[0]) / 4;
      const my = (i0[1] + o0[1] + o1[1] + i1[1]) / 4;
      const ph = (ys + (Math.PI - am) * R) * 0.35;
      addPrism(g, [i0, o0, o1, i1], depthAt(mx, my, ph), zAt(my, ph));
    }

    // ---- rubble around the feet (fixed seed)
    const rnd = makeRng(cfg.seed * 7919 + 13);
    for (const side of [-1, 1]) {
      const pick = side > 0;
      const xo = xAtY(outer, 0, pick), xi = xAtY(inner, 0, pick);
      const Df = depthAt((xo + xi) / 2, 0.5, 0);
      for (let k = 0; k < cfg.nRub; k++) {
        const r = 0.45 + Math.pow(rnd(), 2) * cfg.rubMax;
        let x, z;
        if (rnd() < 0.65) {
          x = xo + (xi - xo) * rnd();
          if (side < 0) x = Math.max(x, xo + r * 0.8); else x = Math.min(x, xo - r * 0.8);
          const fz = rnd() < 0.5 ? -1 : 1;
          z = fz * (Df / 2 + rnd() * 1.4 - 0.9);
        } else {
          x = xi - side * (r * 0.5 + rnd() * cfg.spill);
          z = (rnd() - 0.5) * Df * 0.9;
        }
        const ry = r * (0.55 + rnd() * 0.3);
        addBoulder(g, x, ry * 0.45, z, r * (0.8 + 0.4 * rnd()), ry, r * (0.8 + 0.4 * rnd()), rnd() * Math.PI);
      }
    }
    for (const b of cfg.big) {
      const x = (b[0] - cx) / s;
      const top = (gy - b[1]) / s;
      const ry = top * 0.55;
      addBoulder(g, x, top - ry, b[2], b[3], ry, b[4], rnd() * Math.PI);
    }

    if (cfg.extra) cfg.extra(g);
    return g;
  }

  const A1 = {
    seed: 1, s: 6.44, cx: 405, gy: 328, ysPx: 215, cPx: 412,
    outer: [[55,328],[58,300],[62,250],[65,200],[70,150],[76,110],[84,70],[92,45],[105,28],[130,20],[200,17],[300,18],[400,20],[480,18],[560,20],[640,22],[680,28],[705,45],[722,75],[733,110],[740,150],[744,200],[748,250],[752,300],[755,328]],
    inner: [[258,328],[252,290],[246,250],[244,215],[246,180],[255,150],[268,125],[285,108],[310,100],[360,97],[420,98],[480,98],[530,102],[555,112],[568,128],[575,150],[578,180],[580,215],[582,250],[584,290],[582,328]],
    depth: [[0,27],[8,25],[20,22.5],[33,23.5],[42,24],[49,22]],
    cn: 0.12, cnW: 26, asym: 0.06, zCrown: -1.0, nFan: 24,
    nRub: 14, rubMax: 1.6, spill: 4.5,
    big: [[607,285,7.0,3.3,3.0],[552,312,9.5,1.6,1.5],[528,318,3.0,1.2,1.1],[282,316,8.0,1.5,1.4],[232,318,-6.0,1.3,1.2],[300,322,-4.0,1.0,1.0]]
  };

  const A2 = {
    seed: 2, s: 6.88, cx: 395.5, gy: 667, ysPx: 600, cPx: 393.75,
    outer: [[108,667],[112,630],[120,595],[130,560],[145,525],[165,493],[190,466],[220,444],[255,427],[295,417],[340,413],[390,413],[440,417],[485,427],[525,444],[560,466],[590,493],[615,523],[635,555],[650,590],[662,625],[672,650],[683,667]],
    inner: [[245,667],[240,630],[240,600],[245,565],[256,535],[272,507],[295,485],[325,469],[360,462],[400,461],[440,465],[475,477],[505,497],[527,525],[540,555],[547,590],[549,630],[550,667]],
    depth: [[0,18.5],[7,16.5],[17,13],[26,10],[31,7.8],[35,6.5]],
    cn: 0, cnW: 1, asym: 0.1, zCrown: -3.0, nFan: 28,
    nRub: 11, rubMax: 1.3, spill: 3.5,
    big: [[215,638,6.0,2.0,1.8],[252,646,7.0,1.4,1.3],[528,640,5.5,1.9,1.7],[546,632,-6.0,2.0,1.8],[160,655,8.5,1.2,1.1]]
  };

  const A3 = {
    seed: 3, s: 7.6, cx: 393, gy: 946, ysPx: 885, cPx: 374,
    outer: [[158,946],[162,910],[168,875],[178,840],[195,808],[220,785],[255,768],[300,760],[350,757],[395,759],[405,767],[414,759],[440,758],[480,763],[515,775],[545,795],[568,820],[585,850],[597,885],[608,915],[618,935],[628,946]],
    inner: [[258,946],[254,915],[255,885],[262,858],[278,835],[300,820],[330,812],[365,810],[400,812],[435,813],[462,820],[480,835],[490,858],[493,885],[492,915],[490,946]],
    depth: [[0,18],[6,16],[13,13],[19,11.2],[25,10]],
    cn: 0, cnW: 1, asym: 0.15, zCrown: -1.2, nFan: 26,
    nRub: 10, rubMax: 1.0, spill: 3.0,
    crackPx: [405, 767], crackGap: 0.011, crackSeal: 0.6,
    big: [[455,928,4.0,1.3,1.2],[472,933,6.5,1.0,1.0],[190,933,7.0,1.0,0.9],[362,937,3.5,0.9,0.8],[268,934,-3.0,1.0,1.0]],
    extra: function (g) {
      // fallen block lying tilted under the cracked crown
      const blk = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.5, 5.5), rockMat);
      blk.name = ROCK;
      blk.position.set(2.9, 3.38, 1.0);
      blk.rotation.set(0, 0.12, 0.3);
      g.add(blk);
      const chip = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 1.8), rockMat);
      chip.name = ROCK;
      chip.position.set(-2.6, 0.6, 2.8);
      chip.rotation.set(0.1, 0.5, -0.15);
      g.add(chip);
      // debris floor right across the opening, leg to leg (the sheet's dirt/rubble line);
      // kept under the beam so the top view is unchanged
      const rnd = makeRng(4242);
      const x0 = -17.4, x1 = 12.4, n = 24;
      for (let k = 0; k <= n; k++) {
        const x = x0 + (x1 - x0) * k / n + (rnd() - 0.5) * 0.2;
        const r = 0.95 + rnd() * 0.45;
        const ry = 0.32 + rnd() * 0.22;
        const z = -1.0 + (rnd() - 0.5) * 4.5;
        addBoulder(g, x, ry * 0.45, z, r, ry, r, rnd() * Math.PI);
      }
    }
  };

  const wide = buildArch(A1); wide.name = 'arch_wide';
  const round = buildArch(A2); round.name = 'arch_round';
  const broken = buildArch(A3); broken.name = 'arch_broken';
  return { arch_wide: wide, arch_round: round, arch_broken: broken };
}
```