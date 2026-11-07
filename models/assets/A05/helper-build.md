```json
{"objects": [
  {"name": "door_badge", "size_m": [0.44, 0.44, 0.004],
   "views": [{"label": "LAST ROAD badge (front)", "box": [18, 168, 739, 890], "cam": [0, 0, 1], "up": [0, 1, 0]}]},
  {"name": "registration_letters", "size_m": [0.459, 0.18, 0.002],
   "views": [{"label": "LR-OLV lettering (front)", "box": [762, 222, 1515, 518], "cam": [0, 0, 1], "up": [0, 1, 0]}]},
  {"name": "name_plate", "size_m": [0.468, 0.113, 0.003],
   "views": [{"label": "Wayfarer plate (front)", "box": [740, 641, 1508, 826], "cam": [0, 0, 1], "up": [0, 1, 0]}]}
 ],
 "notes": "Scale bar is 164 px = 10 cm. The round tin door badge (outfit name LAST ROAD) is about 44 cm across with a rolled cream rim. The plane's registration LR-OLV is about 18 cm tall and 46 cm long; it is modelled as 2 mm cut-out letters, with the letter shapes traced approximately from the condensed type. The 'Wayfarer' script sits on a flat 47 x 11 cm green plate. Only front views are drawn, so the backs get guessed colours."}
```

```js
function build(THREE) {
  const S = 0.1 / 164; // metres per pixel (scale bar: 164 px = 10 cm)
  const mats = {};
  function mesh(geo, name, color) {
    if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color: color });
    const m = new THREE.Mesh(geo, mats[name]);
    m.name = name;
    return m;
  }
  const GREEN = 0x5c723a, CREAM = 0xd8ceae, BLACK = 0x2c2b27;

  // ---------------- door badge: round tin sign with rolled rim ----------------
  const badge = new THREE.Group();
  badge.name = 'door_badge';
  const R = 0.22;
  const disc = mesh(new THREE.CylinderGeometry(R - 0.0015, R - 0.0015, 0.003, 48), 'paint_green', GREEN);
  disc.rotation.x = Math.PI / 2; // face toward +z
  disc.position.y = R;
  badge.add(disc);
  const rim = mesh(new THREE.TorusGeometry(R - 0.002, 0.002, 6, 48), 'paint_cream', CREAM);
  rim.position.y = R;
  badge.add(rim);

  // ---------------- registration letters LR-OLV (thin cut-outs) ----------------
  const letters = new THREE.Group();
  letters.name = 'registration_letters';
  const CX = 1138.5, BY = 518, D = 0.002;
  const X = px => (px - CX) * S;
  const Y = py => (BY - py) * S;
  function vecs(pts) { return pts.map(p => new THREE.Vector2(X(p[0]), Y(p[1]))); }
  function makeShape(outer, holes) {
    const o = vecs(outer);
    if (!THREE.ShapeUtils.isClockWise(o)) o.reverse();
    const sh = new THREE.Shape(o);
    (holes || []).forEach(h => {
      const hv = vecs(h);
      if (THREE.ShapeUtils.isClockWise(hv)) hv.reverse();
      sh.holes.push(new THREE.Path(hv));
    });
    return sh;
  }
  function letter(outer, holes) {
    const g = new THREE.ExtrudeGeometry(makeShape(outer, holes), { depth: D, bevelEnabled: false, steps: 1 });
    g.translate(0, 0, -D / 2);
    letters.add(mesh(g, 'paint_black', BLACK));
  }
  function rrect(x0, y0, x1, y1, rx, ry, n) {
    const pts = [];
    const c = [
      [x1 - rx, y0 + ry, -Math.PI / 2, 0],
      [x1 - rx, y1 - ry, 0, Math.PI / 2],
      [x0 + rx, y1 - ry, Math.PI / 2, Math.PI],
      [x0 + rx, y0 + ry, Math.PI, 1.5 * Math.PI]
    ];
    c.forEach(k => {
      for (let i = 0; i <= n; i++) {
        const a = k[2] + (k[3] - k[2]) * i / n;
        pts.push([k[0] + rx * Math.cos(a), k[1] + ry * Math.sin(a)]);
      }
    });
    return pts;
  }

  // L
  letter([[762, 222], [812, 222], [812, 470], [850, 470], [850, 518], [762, 518]]);
  // R
  const rOuter = [[858, 222]];
  for (let i = 0; i <= 6; i++) {
    const a = -Math.PI / 2 + (Math.PI / 2) * i / 6;
    rOuter.push([925 + 43 * Math.cos(a), 265 + 43 * Math.sin(a)]);
  }
  rOuter.push([968, 345], [960, 375], [952, 392], [962, 410], [968, 430], [968, 518],
              [922, 518], [912, 405], [908, 410], [908, 518], [858, 518]);
  const rHole = [[908, 268], [918, 268], [925, 274], [928, 288], [928, 328], [924, 340], [916, 345], [908, 345]];
  letter(rOuter, [rHole]);
  // hyphen
  letter([[976, 350], [1040, 350], [1040, 395], [976, 395]]);
  // O
  letter(rrect(1050, 222, 1168, 518, 48, 58, 8), [rrect(1098, 272, 1120, 468, 11, 22, 6)]);
  // L
  letter([[1180, 222], [1230, 222], [1230, 470], [1290, 470], [1290, 518], [1180, 518]]);
  // V
  letter([[1298, 222], [1356, 222], [1407, 411], [1458, 222], [1515, 222], [1435, 518], [1378, 518]]);

  // ---------------- Wayfarer name plate ----------------
  const plate = new THREE.Group();
  plate.name = 'name_plate';
  const pw = 768 * S, ph = 185 * S;
  const board = mesh(new THREE.BoxGeometry(pw, ph, 0.003), 'paint_green', GREEN);
  board.position.y = ph / 2;
  plate.add(board);

  return { door_badge: badge, registration_letters: letters, name_plate: plate };
}
```