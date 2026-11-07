You built the 3D model below from Christopher's reference sheet C03 · The channel marker stone. It has been built, unwrapped, and
painted from the sheet's flat views (each view's outline fitted to your model's: the fit's overlap is 1.0 when the
outlines match exactly). The first image is the sheet. The second image is the compare sheet: the sheet on top, your
painted model under it from the front, the +x side, the top and three-quarter.

The fit per view: {"model": {"Front": {"iou": 0.966, "turn_deg": 0.43}, "Side": {"iou": 0.953, "turn_deg": 1.01}, "Back": {"iou": 0.97, "turn_deg": -0.41}, "Top": {"iou": 0.738, "turn_deg": -2.56}}}
The model's size in metres (x, y, z) and triangles: {"model": {"tris": 764, "size": [0.51, 1.35, 0.615], "min": [-0.255, 0, -0.308]}}

Your code and the views you gave:
```json
{"objects": [{"name": "channel_marker_stone", "size_m": [0.51, 1.35, 0.615],
  "views": [
    {"label": "Front", "box": [37, 54, 263, 668], "cam": [0, 0, 1], "up": [0, 1, 0]},
    {"label": "Side", "box": [295, 56, 567, 651], "cam": [-1, 0, 0], "up": [0, 1, 0]},
    {"label": "Back", "box": [597, 56, 839, 651], "cam": [0, 0, -1], "up": [0, 1, 0]},
    {"label": "Top", "box": [466, 749, 844, 949], "cam": [0, 1, 0], "up": [1, 0, 0]}
  ]}],
 "notes": "An L-shaped marker stone. It has an upright slab with a shallow gabled top and a recessed niche holding a carved hand in relief. A groove runs down from below the niche and continues forward along a footplate at the base. From the 1 m scale bar (about 440 px) it is about 1.35 m tall, 0.51 m wide and 0.62 m deep, with a footplate projecting about 0.36 m. The back face leans in slightly, 0.26 m thick at the base and 0.195 m at the shoulder. The second 'Side' view also shows the footplate pointing right, so it is a mirrored copy and cannot be the +x side; only the first is listed, as the -x side. The top view draws the footplate about twice as long as the side view does, so the model follows the front, side and back views and the scale bar."}

```
```js
function build(THREE) {
  const g = new THREE.Group();
  g.name = 'channel_marker_stone';
  const stone = new THREE.MeshStandardMaterial({ color: 0x7a6a55, roughness: 0.95, metalness: 0.0 });

  // --- dimensions (metres) ---
  const W = 0.51, H = 1.35, yS = 1.21;          // slab width, peak height, shoulder height
  const tB = 0.26, tT = 0.195;                  // slab thickness at base / at shoulder (back leans in)
  const footD = 0.355, footH = 0.155, footW = 0.49;
  const zBack = -(tB + footD) / 2;              // back of slab at ground
  const zf = zBack + tB;                        // slab front face
  const zFront = zf + footD;                    // toe of the footplate
  const rec = 0.04;                             // niche depth
  const zN = zf - rec;                          // niche floor = body front
  const zTopBack = zf - tT;                     // back face at shoulder height
  const gw = 0.021;                             // half groove width
  const gDepth = 0.025;                         // groove depth
  const gFloorY = footH - gDepth;               // groove floor on the footplate
  const nX = 0.13, nY0 = 0.905, nY1 = 1.165;    // niche half-width and y range
  const gTop = 0.87;                            // top of the vertical groove

  function addMesh(geo) {
    const m = new THREE.Mesh(geo, stone);
    m.name = 'stone';
    g.add(m);
    return m;
  }
  function box(x0, x1, y0, y1, za, zb) {
    const m = addMesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, zb - za));
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (za + zb) / 2);
    return m;
  }

  // --- main slab body: side profile (sloped back) extruded across the width ---
  const prof = new THREE.Shape();           // shape x = -z(model), shape y = y
  prof.moveTo(-zBack, 0);
  prof.lineTo(-zN, 0);
  prof.lineTo(-zN, yS);
  prof.lineTo(-zTopBack, yS);
  prof.closePath();
  const body = addMesh(new THREE.ExtrudeGeometry(prof, { depth: W, bevelEnabled: false }));
  body.rotation.y = Math.PI / 2;
  body.position.x = -W / 2;

  // --- gabled cap ---
  const capShape = new THREE.Shape();
  capShape.moveTo(-W / 2, yS);
  capShape.lineTo(W / 2, yS);
  capShape.lineTo(0, H);
  capShape.closePath();
  const cap = addMesh(new THREE.ExtrudeGeometry(capShape, { depth: tT, bevelEnabled: false }));
  cap.position.z = zf - tT;

  // --- front skin around the niche and the vertical groove (z from zN to zf) ---
  box(-W / 2, -nX, 0, yS, zN, zf);                 // left column
  box(nX, W / 2, 0, yS, zN, zf);                   // right column
  box(-nX, nX, nY1, yS, zN, zf);                   // band above niche
  box(-nX, nX, gTop, nY0, zN, zf);                 // band between niche and groove
  box(-nX, -gw, footH, gTop, zN, zf);              // left of groove
  box(gw, nX, footH, gTop, zN, zf);                // right of groove
  box(-gw, gw, gFloorY, gTop, zN, zf - gDepth);    // groove floor (vertical part)

  // --- footplate with the groove running to its toe ---
  box(-footW / 2, footW / 2, 0, gFloorY, zN, zFront);   // main block
  box(-footW / 2, -gw, gFloorY, footH, zN, zFront);     // left lip of groove
  box(gw, footW / 2, gFloorY, footH, zN, zFront);       // right lip of groove

  // --- carved hand in the niche ---
  const palm = addMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.026, 16));
  palm.rotation.x = Math.PI / 2;
  palm.scale.set(1, 1, 0.92);
  palm.position.set(0.012, 1.0, zN + 0.013);

  const digits = [
    // baseX, baseY, length, tilt (rad, + leans left), radius
    [-0.030, 1.040, 0.085, 0.09, 0.013],   // index
    [-0.003, 1.045, 0.095, 0.02, 0.013],   // middle
    [0.024, 1.040, 0.088, -0.06, 0.013],   // ring
    [0.050, 1.030, 0.068, -0.16, 0.012],   // little
    [-0.035, 0.980, 0.065, 0.85, 0.015]    // thumb
  ];
  for (let i = 0; i < digits.length; i++) {
    const d = digits[i];
    const bx = d[0], by = d[1], L = d[2], a = d[3], r = d[4];
    const dx = -Math.sin(a), dy = Math.cos(a);
    const cyl = addMesh(new THREE.CylinderGeometry(r, r, L, 8));
    cyl.rotation.z = a;
    cyl.position.set(bx + dx * L / 2, by + dy * L / 2, zN + 0.011);
    const tip = addMesh(new THREE.SphereGeometry(r, 8, 6));
    tip.position.set(bx + dx * L, by + dy * L, zN + 0.011);
  }

  return g;
}

```

Look hard at the shape against the sheet: proportions, heights, missing or extra parts, parts in the wrong place,
anything facing the wrong way, a view whose box or camera was wrong (a low overlap often means that). Then answer with:
- A few short lines: what's wrong that matters (or that it's right).
- If anything should change: the corrected JSON block (```json, the whole thing) when the views need fixing, and/or the
  whole corrected build function (```js). If it's right as it is, write NO CHANGES and nothing else after the lines.
Same rules as before: three.js's own geometries only, front faces +z, y up, stands on y = 0, triangle budget 8,000.
