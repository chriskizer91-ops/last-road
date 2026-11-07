You built the 3D model below from Christopher's reference sheet B02 · The hangar and Outfitter bay, outside. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"model": {"Front": {"iou": 0.987, "turn_deg": 0.15}, "Right": {"iou": 0.991, "turn_deg": -0.0}, "Back": {"iou": 0.98, "turn_deg": -0.24}, "Left": {"iou": 0.985, "turn_deg": 0.01}, "Top": {"iou": 0.958, "turn_deg": 0.22}}}
The model's size in metres (x, y, z) and triangles: {"model": {"tris": 3764, "size": [20.26, 5.95, 14.83], "min": [-10.08, 0, -7.4]}}

Your code and the views you gave:
```json
{"objects": [{"name": "hangar", "size_m": [20.3, 5.95, 14.85],
  "views": [
    {"label": "Front", "box": [14, 16, 857, 270], "cam": [0, 0, 1], "up": [0, 1, 0]},
    {"label": "Right", "box": [908, 55, 1523, 268], "cam": [1, 0, 0], "up": [0, 1, 0]},
    {"label": "Back", "box": [21, 319, 828, 557], "cam": [0, 0, -1], "up": [0, 1, 0]},
    {"label": "Left", "box": [928, 344, 1513, 556], "cam": [-1, 0, 0], "up": [0, 1, 0]},
    {"label": "Top", "box": [68, 609, 520, 944], "cam": [0, 1, 0], "up": [0, 0, -1]}
  ]}],
 "notes": "Rusty corrugated-steel hangar. The gable faces the front (+z), with two red sliding doors on an outside track and an open front showing steel trusses and two lamps. There is a roller door on the +x side near the back, and a green lean-to office (window and door) on -x, flush with the front. Scale bar 1 m ≈ 42 px, so the main shed is about 15.8 × 14.5 m, with 4.0 m eaves and a 5.9 m ridge; the office is about 3.9 m wide with 2.6 m eaves. Two things are unclear. The side views draw a flatter roof than the front and back views; I used the front/back pitch. The office depth reads about 9.7 m in the left view but about 12 m in the top view; I used the left view."}

```
```js
function build(THREE) {
  const root = new THREE.Group();
  root.name = 'hangar';

  const COL = {
    corrugated_iron: 0x948779,
    roof_sheeting: 0x8a7b6b,
    paint_green: 0x7b866a,
    paint_red: 0x8b4b3b,
    rusty_iron: 0x7a5741,
    galvanized_steel: 0x9a958c,
    roller_steel: 0x7c7368,
    steel: 0x4c4b48,
    concrete: 0x9c968c,
    glass: 0x47525a,
    timber: 0xbcb09b,
    painted_steel: 0x5f5c55,
    lamp_metal: 0x9a9d99,
    bulb_glass: 0xeee5c8
  };
  const M = {};
  function mat(n) {
    if (!M[n]) M[n] = new THREE.MeshStandardMaterial({ color: COL[n] });
    return M[n];
  }
  function mesh(n, geo, parent) {
    const m = new THREE.Mesh(geo, mat(n));
    m.name = n;
    (parent || root).add(m);
    return m;
  }
  function boxMM(n, x0, y0, z0, x1, y1, z1, parent) {
    const m = mesh(n, new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), parent);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return m;
  }
  function poly(pts) {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    return s;
  }
  function slab(n, pts, holes, depth) {
    const s = poly(pts);
    (holes || []).forEach(h => s.holes.push(poly(h)));
    return mesh(n, new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: false, curveSegments: 1 }));
  }
  const UP = new THREE.Vector3(0, 1, 0);
  function rod(n, a, b, r, segs) {
    const A = new THREE.Vector3(a[0], a[1], a[2]);
    const B = new THREE.Vector3(b[0], b[1], b[2]);
    const d = new THREE.Vector3().subVectors(B, A);
    const len = d.length();
    const m = mesh(n, new THREE.CylinderGeometry(r, r, len, segs || 6));
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, d.normalize());
    return m;
  }

  // ---- key dimensions (metres) ----
  const XL = -5.9, XR = 9.9, XC = 2.0;      // main shed walls, ridge line
  const ZF = 7.25, ZB = -7.25;               // front / back wall faces
  const EAVE = 4.0, RIDGE = 5.8, T = 0.1;    // roof underside at walls / ridge, sheet thickness
  const SL = (RIDGE - EAVE) / (XR - XC);
  const ang = Math.atan(SL), cosA = Math.cos(ang);
  const roofBot = x => RIDGE - SL * Math.abs(x - XC);
  const AX = -9.8, AZB = -2.45, AE = 2.6, AH = 3.55; // lean-to office
  const ASL = (AH - AE) / (XL - AX);
  const aang = Math.atan(ASL);
  const OPL = -2.45, OPR = 6.45, OPH = 3.65; // hangar door opening
  const OV = 0.2, ZOV = 0.15;

  // ---- slabs ----
  boxMM('concrete', XL - 0.08, 0, ZB - 0.08, XR + 0.08, 0.08, ZF + 0.15);
  boxMM('concrete', AX - 0.08, 0, AZB - 0.08, XL - 0.08, 0.08, ZF + 0.08);

  // ---- main shed walls ----
  const front = slab('corrugated_iron',
    [[XL, 0], [OPL, 0], [OPL, OPH], [OPR, OPH], [OPR, 0], [XR, 0], [XR, EAVE], [XC, RIDGE], [XL, EAVE]], null, 0.1);
  front.position.z = ZF - 0.1;
  const back = slab('corrugated_iron', [[XL, 0], [XR, 0], [XR, EAVE], [XC, RIDGE], [XL, EAVE]], null, 0.1);
  back.position.z = ZB;
  boxMM('corrugated_iron', XL, 0, ZB, XL + 0.1, EAVE, ZF);
  // right wall (+x) with roller-door opening at z -5.8..-3.0 (local u = -z)
  const right = slab('corrugated_iron',
    [[ZB, 0], [3.0, 0], [3.0, 3.0], [5.8, 3.0], [5.8, 0], [ZF, 0], [ZF, EAVE], [ZB, EAVE]], null, 0.1);
  right.rotation.y = Math.PI / 2;
  right.position.x = XR - 0.1;

  // ---- main roof ----
  const xa = XL - OV, xb = XR + OV;
  const ya = roofBot(xa), yb = roofBot(xb);
  const roof = slab('roof_sheeting',
    [[xa, ya], [XC, RIDGE], [xb, yb], [xb, yb + T], [XC, RIDGE + T], [xa, ya + T]], null, (ZF - ZB) + 2 * ZOV);
  roof.position.z = ZB - ZOV;
  boxMM('roof_sheeting', XC - 0.22, RIDGE + 0.04, ZB - ZOV, XC + 0.22, RIDGE + 0.15, ZF + ZOV);
  // barge boards on both gables
  [ZF + ZOV - 0.025, ZB - ZOV + 0.025].forEach(z => {
    [[xa, XC, ang], [XC, xb, -ang]].forEach(([x0, x1, a]) => {
      const cx = (x0 + x1) / 2;
      const b = mesh('rusty_iron', new THREE.BoxGeometry((x1 - x0) / cosA, 0.2, 0.05));
      b.position.set(cx, roofBot(cx) + 0.01, z);
      b.rotation.z = a;
    });
  });

  // ---- lean-to office ----
  const DL = -6.95, DR = -6.05, DH = 2.2;
  const afront = slab('paint_green',
    [[AX, 0], [DL, 0], [DL, DH], [DR, DH], [DR, 0], [XL, 0], [XL, AH], [AX, AE]],
    [[[-8.9, 1.12], [-7.3, 1.12], [-7.3, 2.2], [-8.9, 2.2]]], 0.1);
  afront.position.z = ZF - 0.1;
  const aback = slab('paint_green', [[AX, 0], [XL, 0], [XL, AH], [AX, AE]], null, 0.1);
  aback.position.z = AZB;
  const aside = slab('paint_green',
    [[AZB, 0], [4.9, 0], [4.9, DH], [5.9, DH], [5.9, 0], [ZF, 0], [ZF, AE], [AZB, AE]],
    [[[0.75, 1.15], [2.6, 1.15], [2.6, 2.2], [0.75, 2.2]]], 0.1);
  aside.rotation.y = -Math.PI / 2;
  aside.position.x = AX + 0.1;
  // lean-to roof
  const axa = AX - 0.2, aya = AE - ASL * 0.2;
  const aroof = slab('roof_sheeting',
    [[axa, aya], [XL, AH], [XL, AH + 0.09], [axa, aya + 0.09]], null, (ZF + 0.15) - (AZB - 0.15));
  aroof.position.z = AZB - 0.15;
  boxMM('roof_sheeting', XL - 0.06, AH + 0.02, AZB - 0.15, XL, AH + 0.25, ZF + 0.15); // wall flashing
  [ZF + 0.125, AZB - 0.125].forEach(z => {
    const cx = (axa + XL) / 2;
    const b = mesh('rusty_iron', new THREE.BoxGeometry((XL - axa) / Math.cos(aang), 0.15, 0.05));
    b.position.set(cx, AE + ASL * (cx - AX) + 0.02, z);
    b.rotation.z = aang;
  });

  // ---- windows and small doors (local: x across, y up, +z out of wall) ----
  function windowUnit(w, h, cols, rows) {
    const gr = new THREE.Group();
    const f = 0.06;
    boxMM('glass', -w / 2, 0, -0.07, w / 2, h, -0.05, gr);
    boxMM('painted_steel', -w / 2, 0, -0.1, -w / 2 + f, h, 0.0, gr);
    boxMM('painted_steel', w / 2 - f, 0, -0.1, w / 2, h, 0.0, gr);
    boxMM('painted_steel', -w / 2, h - f, -0.1, w / 2, h, 0.0, gr);
    boxMM('painted_steel', -w / 2, 0, -0.1, w / 2, f, 0.0, gr);
    for (let i = 1; i < cols; i++) {
      const x = -w / 2 + w * i / cols;
      boxMM('painted_steel', x - 0.02, f, -0.08, x + 0.02, h - f, -0.03, gr);
    }
    for (let j = 1; j < rows; j++) {
      const y = h * j / rows;
      boxMM('painted_steel', -w / 2 + f, y - 0.02, -0.08, w / 2 - f, y + 0.02, -0.03, gr);
    }
    boxMM('rusty_iron', -w / 2 - 0.08, -0.05, -0.02, w / 2 + 0.08, 0.0, 0.1, gr);
    boxMM('rusty_iron', -w / 2 - 0.06, h, -0.01, w / 2 + 0.06, h + 0.05, 0.06, gr);
    root.add(gr);
    return gr;
  }
  function doorUnit(w, h) {
    const gr = new THREE.Group();
    boxMM('timber', -w / 2 + 0.02, 0.02, -0.07, w / 2 - 0.02, h - 0.02, -0.02, gr);
    boxMM('rusty_iron', -w / 2 - 0.07, 0, -0.01, -w / 2 + 0.01, h + 0.07, 0.04, gr);
    boxMM('rusty_iron', w / 2 - 0.01, 0, -0.01, w / 2 + 0.07, h + 0.07, 0.04, gr);
    boxMM('rusty_iron', -w / 2 - 0.07, h, -0.01, w / 2 + 0.07, h + 0.07, 0.04, gr);
    boxMM('rusty_iron', w / 2 - 0.17, 0.95, -0.02, w / 2 - 0.11, 1.1, 0.03, gr);
    root.add(gr);
    return gr;
  }
  const w1 = windowUnit(1.6, 1.08, 3, 2);
  w1.position.set(-8.1, 1.12, ZF);
  const w2 = windowUnit(1.85, 1.05, 4, 2);
  w2.rotation.y = -Math.PI / 2;
  w2.position.set(AX, 1.15, 1.675);
  const d1 = doorUnit(0.9, DH);
  d1.position.set((DL + DR) / 2, 0, ZF);
  const d2 = doorUnit(1.0, DH);
  d2.rotation.y = -Math.PI / 2;
  d2.position.set(AX, 0, 5.4);

  // ---- big sliding doors on exterior track ----
  const DZ0 = ZF + 0.03, DZ1 = ZF + 0.11;
  [[-5.45, OPL], [OPR, 9.45]].forEach(([x0, x1], i) => {
    boxMM('paint_red', x0, 0.05, DZ0, x1, 3.72, DZ1);
    const hx = i === 0 ? x1 - 0.2 : x0 + 0.2;
    boxMM('rusty_iron', hx - 0.03, 1.75, DZ1, hx + 0.03, 2.15, DZ1 + 0.05);
    [x0 + 0.3, x1 - 0.3].forEach(cx =>
      boxMM('rusty_iron', cx - 0.06, 3.62, DZ1 - 0.02, cx + 0.06, 3.84, DZ1 + 0.03));
  });
  boxMM('rusty_iron', -5.75, 3.78, ZF + 0.08, 9.75, 3.9, ZF + 0.18);
  [-5.6, -3.4, 0.0, 2.0, 4.0, 7.4, 9.6].forEach(x =>
    boxMM('rusty_iron', x - 0.05, 3.8, ZF, x + 0.05, 3.88, ZF + 0.08));

  // ---- roller door on +x side ----
  boxMM('roller_steel', XR - 0.1, 0.03, -5.8, XR - 0.04, 3.0, -3.0);
  boxMM('rusty_iron', XR - 0.1, 0.03, -5.8, XR - 0.02, 0.12, -3.0);
  boxMM('rusty_iron', XR - 0.02, 0, -5.92, XR + 0.06, 3.0, -5.8);
  boxMM('rusty_iron', XR - 0.02, 0, -3.0, XR + 0.06, 3.0, -2.88);
  boxMM('rusty_iron', XR - 0.02, 3.0, -5.92, XR + 0.07, 3.2, -2.88);
  boxMM('roller_steel', XR - 0.5, 3.0, -5.85, XR - 0.1, 3.42, -2.95);

  // ---- corner trims ----
  const trim = (x, z, h) => boxMM('rusty_iron', x - 0.05, 0, z - 0.05, x + 0.05, h, z + 0.05);
  trim(XR, ZF, EAVE); trim(XR, ZB, EAVE); trim(XL, ZB, EAVE); trim(XL, ZF, EAVE);
  trim(AX, ZF, AE); trim(AX, AZB, AE);

  // ---- gutters and downpipes ----
  boxMM('galvanized_steel', XR + 0.12, 3.82, ZB - ZOV, XR + 0.28, 3.95, ZF + ZOV);
  boxMM('galvanized_steel', XL - 0.28, 3.82, ZB - ZOV, XL - 0.12, 3.95, ZF + ZOV);
  boxMM('galvanized_steel', AX - 0.28, aya - 0.12, AZB - 0.15, AX - 0.12, aya, ZF + 0.15);
  const pipe = (x, z, h) => {
    const m = mesh('galvanized_steel', new THREE.CylinderGeometry(0.05, 0.05, h, 8));
    m.position.set(x, h / 2, z);
  };
  pipe(XR + 0.12, ZF - 0.15, 3.85);
  pipe(XR + 0.12, ZB + 0.15, 3.85);
  pipe(XL - 0.12, ZB + 0.15, 3.85);
  pipe(AX - 0.12, ZF - 0.15, aya - 0.1);
  pipe(AX - 0.12, AZB + 0.15, aya - 0.1);

  // ---- interior steel frame ----
  const PUR = 0.14, RD = 0.28, CH = 3.41;
  const topY = x => roofBot(x) - (PUR + RD) / cosA;
  [-6.95, -2.35, 2.35, 6.95].forEach(z => {
    boxMM('steel', XL + 0.1, 0.08, z - 0.1, XL + 0.3, roofBot(XL + 0.3) - PUR - 0.05, z + 0.1);
    boxMM('steel', XR - 0.3, 0.08, z - 0.1, XR - 0.1, roofBot(XR - 0.3) - PUR - 0.05, z + 0.1);
    [[XL + 0.1, XC, ang], [XC, XR - 0.1, -ang]].forEach(([x0, x1, a]) => {
      const cx = (x0 + x1) / 2;
      const r = mesh('steel', new THREE.BoxGeometry((x1 - x0) / cosA + 0.1, RD, 0.16));
      r.position.set(cx, roofBot(cx) - (PUR + RD / 2) / cosA, z);
      r.rotation.z = a;
    });
    boxMM('steel', XL + 0.3, CH - 0.05, z - 0.06, XR - 0.3, CH + 0.05, z + 0.06);
    for (let k = 0; k <= 4; k++) {
      [1, -1].forEach(sgn => {
        if (k === 0 && sgn === -1) return;
        const x = XC + sgn * k * 1.6;
        rod('steel', [x, CH + 0.05, z], [x, topY(x), z], 0.035);
        if (k < 4) {
          const x2 = XC + sgn * (k + 1) * 1.6;
          rod('steel', [x, topY(x), z], [x2, CH + 0.05, z], 0.03);
        }
      });
    }
  });
  // purlins
  [1.0, 2.6, 4.2, 5.8, 7.4].forEach(dd => [1, -1].forEach(sgn => {
    const x = XC + sgn * dd;
    boxMM('steel', x - 0.05, roofBot(x) - PUR, ZB + 0.1, x + 0.05, roofBot(x) - 0.005, ZF - 0.1);
  }));
  // back wall posts, girts and bracing
  [-4.1, -1.37, 1.37, 4.1].forEach(o => {
    const x = XC + o;
    boxMM('steel', x - 0.08, 0.08, ZB + 0.1, x + 0.08, roofBot(x) - PUR - 0.02, ZB + 0.24);
  });
  [1.8, 3.15].forEach(y => {
    boxMM('steel', XL + 0.1, y - 0.07, ZB + 0.1, XR - 0.1, y + 0.07, ZB + 0.18);
    boxMM('steel', XL + 0.1, y - 0.07, ZB + 0.1, XL + 0.18, y + 0.07, ZF - 0.1);
    boxMM('steel', XR - 0.18, y - 0.07, -2.85, XR - 0.1, y + 0.07, ZF - 0.1);
    boxMM('steel', XR - 0.18, y - 0.07, ZB + 0.1, XR - 0.1, y + 0.07, -5.95);
  });
  boxMM('steel', XL + 0.1, 1.73, ZF - 0.18, OPL, 1.87, ZF - 0.1);
  boxMM('steel', OPR, 1.73, ZF - 0.18, XR - 0.1, 1.87, ZF - 0.1);
  [[XC - 4.1, XC - 1.37], [XC + 1.37, XC + 4.1]].forEach(([x0, x1]) => {
    const z = ZB + 0.2;
    rod('steel', [x0, 0.3, z], [x1, 3.1, z], 0.02);
    rod('steel', [x1, 0.3, z], [x0, 3.1, z], 0.02);
  });
  [XL + 0.22, XR - 0.22].forEach(x => {
    rod('steel', [x, 0.3, 2.35], [x, 3.1, 6.95], 0.02);
    rod('steel', [x, 0.3, 6.95], [x, 3.1, 2.35], 0.02);
  });

  // ---- hanging lamps ----
  [-2.75, 2.75].forEach(o => {
    const x = XC + o, z = 2.35;
    rod('steel', [x, CH - 0.05, z], [x, 3.2, z], 0.012, 6);
    const shade = mesh('lamp_metal', new THREE.ConeGeometry(0.24, 0.16, 12));
    shade.position.set(x, 3.13, z);
    const bulb = mesh('bulb_glass', new THREE.SphereGeometry(0.06, 8, 6));
    bulb.position.set(x, 3.04, z);
  });

  return root;
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 40,000.
