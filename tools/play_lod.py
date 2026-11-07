"""A PLAY MODEL (last-road, Nov 2026): traffic_lod.py from salt-mini-plus, with the wheels made for the car you drive:
   WSTEPS=<n> sets how many sides the plain wheel has; WHIGH=<triangles> uses the Studio car's own wheel (high_wheel,
   its real tread) cut down to that many triangles instead of the plain one. Everything else is traffic_lod.py's:
   usage: WSTEPS=24 python3 tools/play_lod.py <export-dir>/bake-in <out-dir> <triangles>   (Blender's Python)

What it was made from, traffic_lod.py: A traffic car: the game's own car (export_parts.js bake-in) brought down to a set number of triangles, for traffic
   only, in the bake-in form so bake.py can put the Studio car's surface on it as for the game's own.
   What traffic doesn't need is left out or made simple:
   - the hood is part of the body (it never opens); what it hides and the engine bay are gone
   - the door shut lines (thin strips laid on the paint) are gone: the bake paints the Studio car's on
   - the underside is one dark box with a liner over each wheel; the glass stays the game's, solid (no cabin behind it), with its flat panes merged
   - the wheels don't turn: each is a plain round tyre and a dished face, the Studio wheel baked onto it
   - the lamps keep their own triangles (merged where flat), so they still light
   - the rest of the body is welded and brought down (flat areas merged first, then Blender's Decimate, left and
     right kept the same) to what's left of the count
   usage: python3 models/tools/traffic_lod.py <export-dir>/bake-in <out-dir> <triangles>
   writes into <out-dir>: low_skin.bin, low_glass.bin, low_under.bin, low_wheel.bin and lod.json (the counts)"""
import sys, os, json, math
import numpy as np
import bpy
IN, OUT, TARGET = sys.argv[1], sys.argv[2], int(sys.argv[3])
os.makedirs(OUT, exist_ok=True)
man = json.load(open(os.path.join(IN, 'manifest.json'))); MAT, SM = man['MAT'], man['SM']
bpy.ops.wm.read_factory_settings(use_empty=True)
def load(name):
    n = man['pieces'][name]['tris']; raw = np.fromfile(os.path.join(IN, name + '.bin'), dtype=np.float32)
    return (raw[:n * 9].reshape(-1, 3, 3).copy(), raw[n * 9:n * 18].reshape(-1, 3, 3).copy(), raw[n * 18:n * 30].reshape(-1, 3, 4).copy(),
            raw[n * 30:n * 31].astype(np.int32), raw[n * 31:n * 32].astype(np.int32) if len(raw) >= n * 32 else np.zeros(n, np.int32))
def facing(P, N, C):
    # (the game keeps no one winding: each triangle turned to face the way its normals do, so the welded mesh has one
    #  outside, as bake.py does)
    g = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); bad = (g * N.sum(1)).sum(1) < 0
    for A in (P, N, C): A[bad] = A[bad][:, ::-1]
    return P, N, C
def mesh(name, P, C, M):
    """triangles into one welded Blender object: the game material in the material index, the colour on each corner"""
    me = bpy.data.meshes.new(name); n = len(P)
    me.from_pydata(P.reshape(-1, 3).tolist(), [], [(3 * i, 3 * i + 1, 3 * i + 2) for i in range(n)])
    ids = sorted(set(M.tolist())); slot = {m: k for k, m in enumerate(ids)}
    for m in ids: me.materials.append(bpy.data.materials.get('gm%d' % m) or bpy.data.materials.new('gm%d' % m))
    me.polygons.foreach_set('material_index', np.array([slot[m] for m in M], np.int32))
    a = me.color_attributes.new('col', 'FLOAT_COLOR', 'CORNER'); a.data.foreach_set('color', C.reshape(-1).astype(np.float32))
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob); return ob
def edit(ob, fn):
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.scene.objects: o.select_set(o == ob)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); fn(); bpy.ops.object.mode_set(mode='OBJECT')
def weld(ob, d=.0006): edit(ob, lambda: bpy.ops.mesh.remove_doubles(threshold=d))
def flatten(ob, deg):
    # (flat areas merged into bigger faces, then cut back into triangles: the shape doesn't change at all)
    def f():
        bpy.ops.mesh.dissolve_limited(angle_limit=math.radians(deg), delimit={'MATERIAL'})
        bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.quads_convert_to_tris(quad_method='BEAUTY', ngon_method='BEAUTY')
    edit(ob, f)
def tris(ob): ob.data.calc_loop_triangles(); return len(ob.data.loop_triangles)
def decimate(ob, want, sym=True):
    for _ in range(4):
        have = tris(ob)
        if have <= want * 1.02: return have
        md = ob.modifiers.new('d', 'DECIMATE'); md.decimate_type = 'COLLAPSE'; md.ratio = max(.02, want / have * .995)
        md.use_collapse_triangulate = True; md.use_symmetry = sym; md.symmetry_axis = 'Z'
        bpy.context.view_layer.objects.active = ob; bpy.ops.object.modifier_apply(modifier=md.name)
    return tris(ob)
def out(ob, path, part=0, smooth=35):
    """the object back to the bake-in form: positions, normals (smooth up to an angle), colours, material, part"""
    edit(ob, lambda: None); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(smooth))
    me = ob.data; me.calc_loop_triangles(); T = me.loop_triangles; n = len(T)
    li = np.zeros(n * 3, np.int32); T.foreach_get('loops', li)
    vi = np.zeros(len(me.loops), np.int32); me.loops.foreach_get('vertex_index', vi)
    co = np.zeros(len(me.vertices) * 3, np.float32); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    nr = np.zeros(len(me.loops) * 3, np.float32); me.corner_normals.foreach_get('vector', nr); nr = nr.reshape(-1, 3)
    cl = np.ones(len(me.loops) * 4, np.float32)
    if 'col' in me.color_attributes: me.color_attributes['col'].data.foreach_get('color', cl)
    cl = cl.reshape(-1, 4)
    pi = np.zeros(n, np.int32); T.foreach_get('polygon_index', pi)
    mi = np.zeros(len(me.polygons), np.int32); me.polygons.foreach_get('material_index', mi)
    gm = np.array([int(me.materials[k].name[2:]) for k in mi[pi]], np.float32)
    P, N, C = co[vi[li]], nr[li], cl[li]
    with open(path, 'wb') as f:
        for A in (P, N, C, gm, np.full(n, part, np.float32)): f.write(np.ascontiguousarray(A, np.float32).tobytes())
    return n
def wheel(R, rim, zi, zo, n, prof):
    """a plain wheel about z (the outside at +z, as the game's): a profile (radius, z) turned n times round; the tyre
       TYRE, the face RIM"""
    P, M = [], []
    for (r0, z0, m), (r1, z1, _) in zip(prof, prof[1:]):
        for k in range(n):
            a0, a1 = 2 * math.pi * k / n, 2 * math.pi * (k + 1) / n
            v = lambda r, z, a: (r * math.cos(a), r * math.sin(a), z)
            A, B, C_, D_ = v(r0, z0, a0), v(r0, z0, a1), v(r1, z1, a1), v(r1, z1, a0)
            # (wound to face out: the tread outwards, the face towards +z)
            if r0 > 1e-6: P.append((A, C_, B)); M.append(m)
            if r1 > 1e-6: P.append((A, D_, C_)); M.append(m)
    return np.array(P, np.float32), np.array(M, np.int32)
# ---------- the pieces ----------
L = {k: MAT[k] for k in ('HEAD', 'TAIL', 'LED', 'AMBER', 'REV', 'HALO') if k in MAT}
LAMP = set(L.values())
P, N, C, M, G = load('low_skin')
keep = (G != 2) & (M != MAT['SHUT']); P, N, C, M = P[keep], N[keep], C[keep], M[keep]
P, N, C = facing(P, N, C)
lamp = np.isin(M, list(LAMP))
gP, gN, gC, gM, _ = load('low_glass'); gP, gN, gC = facing(gP, gN, gC)
uP, uN, uC, uM, _ = load('low_under')
wP, wN, wC, wM, _ = load('low_wheel')
R = float(np.hypot(wP[..., 0], wP[..., 1]).max()); zi, zo = float(wP[..., 2].min()), float(wP[..., 2].max())
# the wheel: how many times round and how many steps across, by the count
T, Y, W = MAT['TYRE'], MAT['RIM'], MAT['TYRE']
if TARGET >= 20000:
    n = 28; prof = [(0, .13, Y), (.07, .128, Y), (.17, .113, Y), (.25, .128, Y), (.266, .133, T), (.305, .138, T), (.336, .128, T), (R, .10, T),
                    (R, -.10, T), (.336, -.128, T), (.305, -.138, T), (.266, -.132, T), (.2, -.1, T), (0, -.1, T)]
elif TARGET >= 8000:
    n = 18; prof = [(0, .13, Y), (.17, .113, Y), (.25, .128, Y), (.266, .133, T), (.322, .136, T), (R, .10, T), (R, -.10, T), (.3, -.138, T), (0, -.1, T)]
else:
    n = 12; prof = [(0, .13, Y), (.25, .125, Y), (.266, .133, T), (R, .10, T), (R, -.10, T), (.28, -.138, T), (0, -.1, T)]
n = int(os.environ.get('WSTEPS', n))
# (the profile's sizes are the game Coupe's wheel, 0.35 m: scaled to this car's)
s = R / .35; prof = [(r * s if r != R else R, z * s, m) for r, z, m in prof]
WP, WM = wheel(R, .266 * s, zi, zo, n, prof)
WHIGH = int(os.environ.get('WHIGH', 0))
if WHIGH:
    hP, hN, hC, hM, _ = load('high_wheel'); hP, hN, hC = facing(hP, hN, hC)
# the underside: one dark box inside the body, from below
# (between the wheels and inside the sills, so it never shows past the body's own edges)
D = man['D']; ax = (D['uC'] - D['uFa'], D['uC'] - D['uRa'])
x0, x1 = min(ax) + R * .8, max(ax) - R * .8; z1 = D['track'] / 2 - .2; y0 = uP[..., 1].min() + .02; y1 = y0 + .12
c = lambda x, y, z: (x, y, z)
q = lambda a, b, cc, d: [(a, b, cc), (a, cc, d)]
box = (q(c(x0, y0, -z1), c(x1, y0, -z1), c(x1, y0, z1), c(x0, y0, z1)) + q(c(x0, y0, z1), c(x1, y0, z1), c(x1, y1, z1), c(x0, y1, z1)) +
       q(c(x1, y0, -z1), c(x0, y0, -z1), c(x0, y1, -z1), c(x1, y1, -z1)) + q(c(x1, y0, z1), c(x1, y0, -z1), c(x1, y1, -z1), c(x1, y1, z1)) +
       q(c(x0, y0, -z1), c(x0, y0, z1), c(x0, y1, z1), c(x0, y1, -z1)))
# and a dark liner round each wheel: a half tube over the tyre from the body's side in, closed at its inner end (so
# the arch isn't open to the sky behind the tyre)
zin, zout, ra = D['track'] / 2 - .2, D['track'] / 2 + .16, R + .045
na = 14 if TARGET >= 20000 else 10 if TARGET >= 8000 else 7
for xc in ax:
    for sd in (1, -1):
        for k in range(na):
            a0, a1 = math.radians(4 + 172 * k / na), math.radians(4 + 172 * (k + 1) / na)
            pt = lambda a, z: (xc + ra * math.cos(a), R + ra * math.sin(a), sd * z)
            box += q(pt(a0, zout), pt(a1, zout), pt(a1, zin), pt(a0, zin))
            box.append(((xc, R, sd * zin), pt(a1, zin), pt(a0, zin)))
UP = np.array(box, np.float32); UM = np.full(len(UP), uM[0], np.int32)
# ---------- brought down ----------
body = mesh('body', P[~lamp], C[~lamp], M[~lamp]); weld(body); flatten(body, .5)
lamps = mesh('lamps', P[lamp], C[lamp], M[lamp]); weld(lamps); flatten(lamps, 3)
glass = mesh('glass', gP, gC, gM); weld(glass); flatten(glass, 1.5)
nl, ng = tris(lamps), tris(glass)
if TARGET < 8000: ng = decimate(glass, max(60, int(TARGET * .025))); nl = decimate(lamps, max(80, int(TARGET * .03)))
elif TARGET < 20000: ng = decimate(glass, int(TARGET * .03))
want = TARGET - 4 * (WHIGH or len(WP)) - len(UP) - nl - ng
flat = tris(body); nb = decimate(body, want)
# ---------- written ----------
sk = os.path.join(OUT, 'low_skin.bin')
# (the body and the lamps go out as one piece, the skin, as the game's own)
n1 = out(body, sk + '.a'); n2 = out(lamps, sk + '.b')
def cat(a, b, dst, na, nb):
    A = np.fromfile(a, np.float32); B = np.fromfile(b, np.float32); parts = []
    for off, w in ((0, 9), (9, 9), (18, 12), (30, 1), (31, 1)):
        parts += [A[off * na:(off + w) * na], B[off * nb:(off + w) * nb]]
    np.concatenate(parts).tofile(dst); os.remove(a); os.remove(b)
cat(sk + '.a', sk + '.b', sk, n1, n2)
n3 = out(glass, os.path.join(OUT, 'low_glass.bin'), smooth=20)
def raw(path, P, M):
    n = len(P); g = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); g /= np.linalg.norm(g, axis=1, keepdims=True) + 1e-12
    Nn = np.repeat(g[:, None], 3, 1)
    Cc = np.ones((n, 3, 4), np.float32) * np.array([.028, .028, .028, 1], np.float32)
    with open(path, 'wb') as f:
        for A in (P, Nn, Cc, M.astype(np.float32), np.zeros(n, np.float32)): f.write(np.ascontiguousarray(A, np.float32).tobytes())
    return n
n4 = raw(os.path.join(OUT, 'low_under.bin'), UP, UM)
# the wheel: welded and smoothed in Blender too, so the tyre reads round
if WHIGH:
    wob = mesh('wheel', hP, hC, hM); weld(wob, .0002); decimate(wob, WHIGH, sym=False)
    n5 = out(wob, os.path.join(OUT, 'low_wheel.bin'), smooth=35)
else:
    wob = mesh('wheel', WP, np.ones((len(WP), 3, 4), np.float32), WM); weld(wob, .0002)
    n5 = out(wob, os.path.join(OUT, 'low_wheel.bin'), smooth=50)
counts = {'target': TARGET, 'body': n1, 'lamps': n2, 'glass': n3, 'under': n4, 'wheel': n5, 'wheels': 4 * n5,
          'total': n1 + n2 + n3 + n4 + 4 * n5, 'body_before': int((~lamp).sum()), 'body_flattened': flat, 'wheel_steps': 0 if WHIGH else n, 'wheel_from_studio': WHIGH}
json.dump(counts, open(os.path.join(OUT, 'lod.json'), 'w'), indent=1)
print(json.dumps(counts))
