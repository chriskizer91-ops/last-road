function build(THREE) {
  const PX = 1 / 431; // metres per sheet pixel (scale bar: 0..1.0 m spans x 548..979)
  const UP = new THREE.Vector3(0, 1, 0);

  const COLORS = {
    rufous_hide: 0xb4733f,
    fawn_hide: 0xc79a69,
    white_fur: 0xe5ddce,
    black_fur: 0x2b2521,
    hoof: 0x3a332e,
    horn: 0x4b4034
  };
  const MATS = {};
  function mat(name) {
    if (!MATS[name]) MATS[name] = new THREE.MeshStandardMaterial({ color: COLORS[name], roughness: 0.9, metalness: 0.0 });
    return MATS[name];
  }

  const FRONT_R = { upper: [0.030, 0.016], cannon: [0.012, 0.011], pastern: [0.012, 0.010], hoof: [0.011, 0.015], joint: [0.018, 0.015] };
  const HIND_R  = { upper: [0.034, 0.017], cannon: [0.013, 0.011], pastern: [0.012, 0.010], hoof: [0.011, 0.015], joint: [0.019, 0.015] };
  const EAR_PROFILE = [[0, 0], [0.55, 0.06], [0.9, 0.25], [1, 0.5], [0.75, 0.78], [0.3, 0.94], [0, 1]];

  function antelope(d) {
    const root = new THREE.Group();
    root.name = d.name;
    const Z = (px) => (px - d.zc) * PX;          // side-view x pixel -> model z (front = +z)
    const Y = (py) => (d.gy - py) * PX;          // side-view y pixel -> model height
    const V = (p, x) => new THREE.Vector3(x || 0, Y(p[1]), Z(p[0]));

    function mesh(geo, name, parent) {
      const m = new THREE.Mesh(geo, mat(name));
      m.name = name;
      (parent || root).add(m);
      return m;
    }
    // side-profile slab: exact side outline, rounded edges, centred on x = 0
    function slab(pts, width, bevel, name) {
      const bt = bevel[0], bs = bevel[1];
      const s = new THREE.Shape();
      s.moveTo(Z(pts[0][0]), Y(pts[0][1]));
      for (let i = 1; i < pts.length; i++) s.lineTo(Z(pts[i][0]), Y(pts[i][1]));
      const depth = Math.max(0.004, width - 2 * bt);
      const geo = new THREE.ExtrudeGeometry(s, {
        depth: depth, steps: 1, curveSegments: 1, bevelEnabled: true,
        bevelThickness: bt, bevelSize: bs, bevelOffset: -bs, bevelSegments: 3
      });
      const m = mesh(geo, name);
      m.rotation.y = -Math.PI / 2;   // shape x -> +z, extrusion -> -x
      m.position.x = depth / 2;
      return m;
    }
    function blob(c, s, name, ws, hs) {
      const m = mesh(new THREE.SphereGeometry(1, ws, hs), name);
      m.position.copy(V(c));
      m.scale.set(s[0], s[1], s[2]);
      return m;
    }
    function seg(parent, a, b, r1, r2, name, radial, open) {
      const dir = new THREE.Vector3().subVectors(b, a);
      const len = dir.length();
      const m = mesh(new THREE.CylinderGeometry(r2, r1, len, radial, 1, !!open), name, parent);
      m.position.copy(a).addScaledVector(dir, 0.5);
      m.quaternion.setFromUnitVectors(UP, dir.normalize());
      return m;
    }

    // body
    slab(d.torso, d.torsoW, d.torsoBevel, 'rufous_hide');
    blob(d.barrel.c, d.barrel.s, 'rufous_hide', 14, 10);
    blob(d.belly.c, d.belly.s, 'white_fur', 10, 6);
    blob(d.rump.c, d.rump.s, 'white_fur', 10, 6);

    // neck and head
    slab(d.neck, d.neckW, d.neckBevel, 'rufous_hide');
    slab(d.head, d.headW, d.headBevel, 'rufous_hide');
    blob(d.cranium.c, d.cranium.s, 'rufous_hide', 10, 8);

    // ears (leaf-shaped, flattened front-to-back)
    [-1, 1].forEach((sx) => {
      const a = V(d.ear.base, sx * d.ear.baseX);
      const b = V(d.ear.tip, sx * d.ear.tipX);
      const dir = new THREE.Vector3().subVectors(b, a);
      const L = dir.length();
      const prof = EAR_PROFILE.map((p) => new THREE.Vector2(p[0] * d.ear.r, p[1] * L));
      const m = mesh(new THREE.LatheGeometry(prof, 8), 'rufous_hide');
      m.position.copy(a);
      m.quaternion.setFromUnitVectors(UP, dir.normalize());
      m.scale.set(1, 1, 0.6);
    });

    // horns (ram only): tapered chain, lyre-shaped
    if (d.horn) {
      [-1, 1].forEach((sx) => {
        const P = d.horn.pts.map((p) => V(p, sx * p[2]));
        for (let i = 0; i < P.length - 1; i++) {
          seg(root, P[i], P[i + 1], d.horn.r[i], d.horn.r[i + 1], 'horn', 6, false);
        }
      });
    }

    // tail: short stem + black tuft
    const tr = V(d.tail.root), tm = V(d.tail.mid), tt = V(d.tail.top), tp = V(d.tail.tip);
    seg(root, tr, tm, 0.016, 0.013, 'white_fur', 6, false);
    const tdir = new THREE.Vector3().subVectors(tp, tt);
    const tlen = tdir.length();
    const tuft = mesh(new THREE.SphereGeometry(1, 8, 6), 'black_fur');
    tuft.position.copy(tt).addScaledVector(tdir, 0.5);
    tuft.quaternion.setFromUnitVectors(UP, tdir.clone().normalize());
    tuft.scale.set(0.022, tlen / 2, 0.022);

    // legs: each in a group pivoting at the elbow / stifle
    d.legs.forEach((Lg) => {
      const grp = new THREE.Group();
      grp.name = Lg.name;
      const n = Lg.pts.length;
      const P = Lg.pts.map((p, i) => V(p, Lg.x[0] + (Lg.x[1] - Lg.x[0]) * i / (n - 1)));
      grp.position.copy(P[0]);
      const Q = P.map((v) => v.clone().sub(P[0]));
      const r = Lg.hind ? HIND_R : FRONT_R;
      seg(grp, Q[0], Q[1], r.upper[0], r.upper[1], 'fawn_hide', 8, true);
      seg(grp, Q[1], Q[2], r.cannon[0], r.cannon[1], 'fawn_hide', 8, true);
      seg(grp, Q[2], Q[3], r.pastern[0], r.pastern[1], 'fawn_hide', 8, true);
      seg(grp, Q[3], Q[4], r.hoof[0], r.hoof[1], 'hoof', 8, false);
      for (let j = 0; j < 2; j++) {
        const s = mesh(new THREE.SphereGeometry(r.joint[j], 6, 4), 'fawn_hide', grp);
        s.position.copy(Q[j + 1]);
      }
      root.add(grp);
    });

    return root;
  }

  // ---- landmark data, in sheet pixels of each side view (x right = forward, y down) ----
  const MALE = {
    name: 'antelope_male', zc: 320, gy: 545,
    torso: [[140,240],[165,225],[210,216],[270,212],[330,214],[380,220],[406,236],[421,265],[425,300],[416,330],
            [396,345],[350,353],[290,356],[242,352],[218,343],[212,372],[182,394],[152,380],[134,342],[128,296],[132,262]],
    torsoW: 0.22, torsoBevel: [0.07, 0.045],
    barrel: { c: [285, 290], s: [0.125, 0.14, 0.27] },
    belly: { c: [300, 334], s: [0.095, 0.05, 0.17] },
    rump: { c: [142, 272], s: [0.075, 0.07, 0.035] },
    neck: [[372,226],[408,206],[440,176],[466,147],[486,140],[497,198],[474,226],[450,254],[430,290],[402,306]],
    neckW: 0.105, neckBevel: [0.035, 0.022],
    head: [[468,150],[478,129],[495,130],[512,144],[528,161],[538,174],[543,184],[537,195],[522,201],[502,207],[486,201],[472,182]],
    headW: 0.075, headBevel: [0.025, 0.014],
    cranium: { c: [482, 160], s: [0.055, 0.04, 0.045] },
    ear: { base: [468, 140], baseX: 0.05, tip: [422, 110], tipX: 0.168, r: 0.032 },
    horn: {
      pts: [[484,136,0.033],[474,99,0.072],[460,70,0.11],[445,45,0.132],[432,21,0.138]],
      r: [0.017, 0.014, 0.011, 0.008, 0.003]
    },
    tail: { root: [140, 250], mid: [127, 296], top: [129, 288], tip: [118, 344] },
    legs: [
      { name: 'leg_front_right', hind: false, x: [-0.077, -0.06], pts: [[398,330],[390,438],[383,513],[384,530],[386,545]] },
      { name: 'leg_front_left',  hind: false, x: [0.077, 0.06],   pts: [[392,330],[380,438],[369,513],[369,530],[370,545]] },
      { name: 'leg_hind_right',  hind: true,  x: [-0.068, -0.045], pts: [[198,365],[168,445],[178,513],[182,530],[185,545]] },
      { name: 'leg_hind_left',   hind: true,  x: [0.068, 0.045],   pts: [[186,368],[146,442],[116,513],[109,530],[105,545]] }
    ]
  };

  const FEMALE = {
    name: 'antelope_female', zc: 785.5, gy: 546,
    torso: [[612,244],[636,232],[680,226],[740,223],[800,226],[835,232],[861,248],[875,275],[879,305],[867,333],
            [846,346],[800,352],[745,355],[705,350],[686,340],[680,372],[650,392],[620,374],[605,336],[601,295],[606,262]],
    torsoW: 0.21, torsoBevel: [0.068, 0.043],
    barrel: { c: [750, 292], s: [0.122, 0.14, 0.27] },
    belly: { c: [765, 333], s: [0.092, 0.05, 0.17] },
    rump: { c: [616, 272], s: [0.072, 0.068, 0.035] },
    neck: [[826,232],[862,204],[892,174],[912,152],[928,146],[938,205],[912,234],[890,264],[874,294],[848,306]],
    neckW: 0.09, neckBevel: [0.03, 0.02],
    head: [[912,158],[920,143],[936,145],[955,157],[975,170],[990,182],[997,191],[991,201],[976,206],[956,212],[939,208],[922,190]],
    headW: 0.07, headBevel: [0.023, 0.013],
    cranium: { c: [926, 165], s: [0.05, 0.038, 0.042] },
    ear: { base: [916, 150], baseX: 0.048, tip: [888, 103], tipX: 0.147, r: 0.03 },
    horn: null,
    tail: { root: [612, 250], mid: [601, 295], top: [603, 287], tip: [591, 341] },
    legs: [
      { name: 'leg_front_right', hind: false, x: [-0.076, -0.066], pts: [[858,332],[846,440],[838,513],[840,530],[842,546]] },
      { name: 'leg_front_left',  hind: false, x: [0.076, 0.066],   pts: [[850,332],[833,440],[820,513],[820,530],[821,546]] },
      { name: 'leg_hind_right',  hind: true,  x: [-0.064, -0.042], pts: [[668,368],[640,448],[650,513],[653,530],[656,546]] },
      { name: 'leg_hind_left',   hind: true,  x: [0.064, 0.042],   pts: [[658,370],[620,445],[594,513],[587,530],[582,546]] }
    ]
  };

  return {
    antelope_male: antelope(MALE),
    antelope_female: antelope(FEMALE)
  };
}
