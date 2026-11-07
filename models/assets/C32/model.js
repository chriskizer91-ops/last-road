function build(THREE) {
  const root = new THREE.Group();
  root.name = 'the_weir';

  const COLORS = {
    stone: 0x716857,
    wet_stone: 0x56543f,
    rock: 0x958c7a,
    water: 0x3b4842,
    timber: 0x2f2720,
    carved_stone: 0x8c8068
  };
  const mats = {};
  function mat(name) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: COLORS[name] });
    return mats[name];
  }
  function addMesh(geo, name) {
    const m = new THREE.Mesh(geo, mat(name));
    m.name = name;
    root.add(m);
    return m;
  }
  function boxMM(name, x0, x1, y0, y1, z0, z1) {
    const m = addMesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), name);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return m;
  }

  // ---------- key dimensions (metres) ----------
  const ZF = -0.5;                    // gatehouse front face z
  const GX0 = 10.8, GX1 = 18.05;      // gatehouse body x range
  const GZ0 = ZF - 6.8, GZ1 = ZF;     // gatehouse body z range
  const GH = 5.75;                    // body top (under frieze)
  const GCX = (GX0 + GX1) / 2, GCZ = (GZ0 + GZ1) / 2;

  // ---------- curved stepped weir wall ----------
  // plan: circular arc, centre (AX, AZ), back face radius R0; bows toward +z
  const AX = 2.0, AZ = ZF - 39.6;
  const R0 = 38.0, CREST = 1.5, NSTEP = 5;
  const XCUT = 10.9;                  // wall ends flush inside gatehouse side
  const TH_L = -0.464;                // radial cut at the left abutment
  const TH_E = Math.asin((XCUT - AX) / 42.8);
  function depthAt(th) {              // treads deeper mid-span (as top view)
    let s = (th - TH_L) / (TH_E - TH_L);
    s = Math.max(0, Math.min(1, s));
    return 4.8 + 1.4 * Math.sin(Math.PI * s);
  }
  function boundary(k) {
    if (k === 0) return function () { return R0; };
    return function (th) { return R0 + CREST + (k - 1) * (depthAt(th) - CREST) / NSTEP; };
  }
  function constR(r) { return function () { return r; }; }
  function endAngle(rf) {
    let lo = 0, hi = 0.7;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      if (AX + rf(mid) * Math.sin(mid) < XCUT) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }
  // each tier is built from short segments so caps are small quads, not long slivers
  const NSEG = 36;
  function tier(name, rin, rout, y0, y1) {
    const eIn = endAngle(rin), eOut = endAngle(rout);
    const h = y1 - y0;
    function pt(rf, e, t) {
      const th = TH_L + (e - TH_L) * t, r = rf(th);
      return new THREE.Vector2(AX + r * Math.sin(th), -(AZ + r * Math.cos(th)));
    }
    for (let i = 0; i < NSEG; i++) {
      const t0 = i / NSEG, t1 = (i + 1) / NSEG;
      const shape = new THREE.Shape([
        pt(rin, eIn, t0), pt(rin, eIn, t1), pt(rout, eOut, t1), pt(rout, eOut, t0)
      ]);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, steps: 1 });
      geo.rotateX(-Math.PI / 2);     // shape (x,-z) -> plan, extrusion -> +y
      const m = addMesh(geo, name);
      m.position.y = y0;
    }
  }

  // back plinth band (ledge seen on the Back view)
  tier('stone', constR(R0 - 0.25), constR(R0), 0, 2.2);
  // crest body
  tier('stone', boundary(0), boundary(1), 0, 3.5);
  // coping course, overhanging both faces
  tier('stone', constR(R0 - 0.15), constR(R0 + CREST + 0.1), 3.5, 3.8);
  // five downstream steps
  const stepTops = [3.15, 2.5, 1.9, 1.3, 0.7];
  for (let k = 1; k <= NSTEP; k++) {
    tier('wet_stone', boundary(k), boundary(k + 1), 0, stepTops[k - 1]);
  }
  // terminal block on the crest at the left end
  const thP = TH_L + 0.015, rP = R0 + 0.75;
  const pier = addMesh(new THREE.BoxGeometry(1.1, 0.42, 1.65), 'stone');
  pier.position.set(AX + rP * Math.sin(thP), 3.8 + 0.21, AZ + rP * Math.cos(thP));
  pier.rotation.y = thP;

  // ---------- gatehouse ----------
  boxMM('stone', GX0 - 0.2, GX1 + 0.2, 0, 1.0, GZ0 - 0.2, GZ1 + 0.2);      // base course
  const fz0 = GZ1 - 0.6, fz1 = GZ1;                                      // front skin depth
  boxMM('stone', GX0, GX1, 0, GH, GZ0, fz0);                              // core
  const DX0 = 12.87, DX1 = 13.73, DY0 = 1.6, DY1 = 4.0;                   // doorway
  const OX0 = 15.32, OX1 = 16.08, OY0 = 1.6, OY1 = 2.23;                  // sluice outlet
  boxMM('stone', GX0, DX0, 0, GH, fz0, fz1);
  boxMM('stone', DX1, OX0, 0, GH, fz0, fz1);
  boxMM('stone', OX1, GX1, 0, GH, fz0, fz1);
  boxMM('stone', DX0, DX1, 0, DY0, fz0, fz1);
  boxMM('stone', DX0, DX1, DY1, GH, fz0, fz1);
  boxMM('stone', OX0, OX1, 0, OY0, fz0, fz1);
  boxMM('stone', OX0, OX1, OY1, GH, fz0, fz1);
  // frieze and cap slab
  boxMM('stone', GX0 - 0.1, GX1 + 0.1, GH, 6.1, GZ0 - 0.1, GZ1 + 0.1);
  boxMM('stone', GX0 - 0.225, GX1 + 0.225, 6.1, 6.55, GZ0 - 0.225, GZ1 + 0.225);

  // stepped corbels under the frieze
  const CT = [[1.1, 5.45, 5.75], [0.75, 5.2, 5.45], [0.45, 4.95, 5.2]];
  const CP = 0.2;
  function corbelFB(xc, zFace, dir) {
    for (let i = 0; i < CT.length; i++) {
      const t = CT[i];
      const z0 = dir > 0 ? zFace : zFace - CP, z1 = dir > 0 ? zFace + CP : zFace;
      boxMM('stone', xc - t[0] / 2, xc + t[0] / 2, t[1], t[2], z0, z1);
    }
  }
  function corbelSide(zc, xFace, dir) {
    for (let i = 0; i < CT.length; i++) {
      const t = CT[i];
      const x0 = dir > 0 ? xFace : xFace - CP, x1 = dir > 0 ? xFace + CP : xFace;
      boxMM('stone', x0, x1, t[1], t[2], zc - t[0] / 2, zc + t[0] / 2);
    }
  }
  [-2.9, -1.45, 0, 1.45, 2.9].forEach(function (o) {
    corbelFB(GCX + o, GZ1, 1);
    corbelFB(GCX + o, GZ0, -1);
  });
  [-2.55, -0.85, 0.85, 2.55].forEach(function (o) {
    corbelSide(GCZ + o, GX1, 1);
    corbelSide(GCZ + o, GX0, -1);
  });

  // door surround, recessed timber door, steps
  boxMM('stone', DX0 - 0.22, DX0, DY0, DY1, GZ1, GZ1 + 0.08);
  boxMM('stone', DX1, DX1 + 0.22, DY0, DY1, GZ1, GZ1 + 0.08);
  boxMM('stone', DX0 - 0.32, DX1 + 0.32, DY1, DY1 + 0.35, GZ1, GZ1 + 0.1);
  boxMM('timber', DX0, DX1, DY0, DY1, fz0, fz0 + 0.08);
  boxMM('stone', DX0 - 0.32, DX1 + 0.32, 0, 1.3, GZ1, GZ1 + 0.65);
  boxMM('stone', DX0 - 0.32, DX1 + 0.32, 0, 0.65, GZ1 + 0.65, GZ1 + 1.1);

  // carved hand panel (frame + plaque; the hand itself is left to the picture)
  const HX0 = 15.18, HX1 = 16.35, HY0 = 2.43, HY1 = 4.05, FB = 0.12;
  boxMM('stone', HX0, HX1, HY1 - FB, HY1, GZ1, GZ1 + 0.07);
  boxMM('stone', HX0, HX1, HY0, HY0 + FB, GZ1, GZ1 + 0.07);
  boxMM('stone', HX0, HX0 + FB, HY0 + FB, HY1 - FB, GZ1, GZ1 + 0.07);
  boxMM('stone', HX1 - FB, HX1, HY0 + FB, HY1 - FB, GZ1, GZ1 + 0.07);
  boxMM('carved_stone', HX0 + FB, HX1 - FB, HY0 + FB, HY1 - FB, GZ1, GZ1 + 0.03);

  // ---------- outlet channel toward +z: short chute, then a low run on the ground ----------
  function profileX(name, pts, x0, x1) {
    const shape = new THREE.Shape(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: x1 - x0, bevelEnabled: false, steps: 1 });
    geo.rotateY(-Math.PI / 2);        // shape u -> z, v -> y, extrusion -> -x
    const m = addMesh(geo, name);
    m.position.x = x1;
    return m;
  }
  const CL = 8.0;
  const zc0 = GZ1, zc1 = GZ1 + CL, zk = GZ1 + 3.0;   // knee where the chute meets the run
  const FK = 0.3, FE = 0.08, WH = 0.4, WT = 0.12;     // floor at knee / end, wall rise, water depth
  // channel bed
  profileX('stone', [[zc0, 0], [zc1, 0], [zc1, FE], [zk, FK], [zc0, OY0]], OX0, OX1);
  // water film
  profileX('water', [[zc0, OY0], [zk, FK], [zc1, FE], [zc1, FE + WT], [zk, FK + WT], [zc0, OY0 + WT]], OX0, OX1);
  // side walls
  const wallPts = [[zc0, 0], [zc1, 0], [zc1, FE + WH], [zk, FK + WH], [zc0, OY0 + WH]];
  profileX('stone', wallPts, OX0 - 0.35, OX0);
  profileX('stone', wallPts, OX1, OX1 + 0.35);
  boxMM('water', OX0, OX1, OY0, OY0 + 0.12, fz0, fz1);

  // ---------- rocks (fixed list) ----------
  const domeGeo = new THREE.SphereGeometry(1, 9, 4, 0, Math.PI * 2, 0, Math.PI / 2);
  const ballGeo = new THREE.SphereGeometry(1, 9, 6);
  // [x, zRel(from ZF), sx, height, sz, rotY]
  const domes = [
    [-17.3, -3.0, 1.6, 2.4, 2.4, 0.3],
    [-18.0, -1.3, 0.9, 1.4, 1.2, 0.6],
    [-18.0, -4.3, 0.8, 1.8, 1.1, 0.9],
    [-17.0, -0.4, 0.9, 0.8, 0.9, 1.7],
    [-15.8, -6.0, 1.1, 2.2, 0.9, 0.4],
    [18.35, -1.2, 0.6, 2.0, 1.3, 0.2],
    [18.25, -3.6, 0.7, 2.5, 1.5, 0.1],
    [18.0, 0.6, 0.9, 0.9, 0.9, 1.2],
    [18.0, -5.8, 0.8, 1.6, 1.1, 0.8],
    [14.45, 1.6, 0.5, 0.7, 0.9, 0.3],
    [14.4, 3.6, 0.55, 0.55, 0.8, 1.0],
    [14.45, 5.6, 0.5, 0.45, 0.9, 0.5],
    [14.5, 7.1, 0.45, 0.4, 0.35, 0.2],
    [16.95, 1.5, 0.5, 0.7, 0.9, 0.6],
    [17.0, 3.4, 0.55, 0.55, 0.9, 1.3],
    [16.95, 5.4, 0.5, 0.45, 0.8, 0.2],
    [16.9, 7.0, 0.45, 0.4, 0.45, 0.9],
    [11.6, 1.2, 0.7, 0.6, 0.8, 0.4],
    [12.3, 2.5, 0.6, 0.5, 0.7, 1.1],
    [11.4, 3.9, 0.6, 0.45, 0.6, 0.7]
  ];
  for (let i = 0; i < domes.length; i++) {
    const d = domes[i];
    const m = addMesh(domeGeo, 'rock');
    m.position.set(d[0], 0, ZF + d[1]);
    m.scale.set(d[2], d[3], d[4]);
    m.rotation.y = d[5];
  }
  // stacked boulders on the left abutment: [x, y, zRel, sx, sy, sz, rotY]
  const balls = [
    [-16.6, 2.6, -4.2, 1.2, 1.1, 1.4, 1.1],
    [-16.2, 3.4, -5.2, 0.9, 0.8, 1.0, 2.0]
  ];
  for (let i = 0; i < balls.length; i++) {
    const b = balls[i];
    const m = addMesh(ballGeo, 'rock');
    m.position.set(b[0], b[1], ZF + b[2]);
    m.scale.set(b[3], b[4], b[5]);
    m.rotation.y = b[6];
  }

  return root;
}
