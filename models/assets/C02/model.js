function build(THREE) {
  const stone = new THREE.MeshStandardMaterial({ color: 0x6b5a48, roughness: 0.95, metalness: 0.0 });

  // Rounded, bevelled slab: outline spans x in [-w/2, w/2], y in [0, h], z in [-d/2, d/2]; front faces +z.
  function slabGeo(w, h, d, r, bev, curveSeg, bevSeg) {
    const x0 = -w / 2 + bev, x1 = w / 2 - bev, y0 = bev, y1 = h - bev;
    const rr = Math.max(0.0005, r - bev);
    const s = new THREE.Shape();
    s.moveTo(x0 + rr, y0);
    s.lineTo(x1 - rr, y0);
    s.quadraticCurveTo(x1, y0, x1, y0 + rr);
    s.lineTo(x1, y1 - rr);
    s.quadraticCurveTo(x1, y1, x1 - rr, y1);
    s.lineTo(x0 + rr, y1);
    s.quadraticCurveTo(x0, y1, x0, y1 - rr);
    s.lineTo(x0, y0 + rr);
    s.quadraticCurveTo(x0, y0, x0 + rr, y0);
    const core = d - 2 * bev;
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: core,
      steps: 1,
      bevelEnabled: true,
      bevelThickness: bev,
      bevelSize: bev,
      bevelSegments: bevSeg,
      curveSegments: curveSeg
    });
    geo.translate(0, 0, -core / 2);
    geo.computeVertexNormals();
    return geo;
  }

  const names = [
    'glyph_waves', 'glyph_equals', 'glyph_circle_dot', 'glyph_stairs', 'glyph_sun', 'glyph_mountain', 'glyph_bowl', 'glyph_boat',
    'glyph_person', 'glyph_arch', 'glyph_wave', 'glyph_fork', 'glyph_three_bars', 'glyph_horizon_disc', 'glyph_dome', 'glyph_corner',
    'glyph_double_arc', 'glyph_basin', 'glyph_x_cross', 'glyph_plus_cross', 'glyph_three_dots', 'glyph_bar_dot', 'glyph_ring', 'glyph_arc_dot',
    'glyph_two_bars', 'glyph_slashes', 'glyph_chevron_up', 'glyph_chevron_down', 'glyph_zigzags', 'glyph_dash_steps', 'glyph_tee', 'glyph_doorway_dot',
    'glyph_four_dots', 'glyph_s_curve', 'glyph_double_wave', 'glyph_branch', 'glyph_rainbow', 'glyph_tree_rune', 'glyph_diamond', 'glyph_crosshair'
  ];

  const out = {};
  const tileBase = slabGeo(0.16, 0.16, 0.035, 0.012, 0.004, 2, 1);

  for (let i = 0; i < names.length; i++) {
    const g = new THREE.Group();
    g.name = names[i];
    const m = new THREE.Mesh(tileBase.clone(), stone);
    m.name = 'stone';
    g.add(m);
    out[names[i]] = g;
  }

  // Large hand-print tablet
  const hand = new THREE.Group();
  hand.name = 'hand_tablet';
  const slab = new THREE.Mesh(slabGeo(0.45, 0.62, 0.07, 0.025, 0.008, 3, 2), stone);
  slab.name = 'stone';
  hand.add(slab);
  out['hand_tablet'] = hand;

  return out;
}
