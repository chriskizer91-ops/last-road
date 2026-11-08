"""Where the Old Hands' glyphs go on his walk sites: for each site model, the flat upright faces a person can walk up to
and look at, ranked (under the sky before under a roof, deeper into the site first, spaced apart). A person's standing places come from the walk grid
(src/lr-walk.js: tools/world/walkgrid.py), walked in from outside (up steps of half a metre, down any drop of up to
three); from each, rays across at chest height find walls within reach; a wall counts when it is upright and flat
across a glyph's width (four more rays agree). Written into src/lr-finds.js (window.LR_SPOTS): per model, spots in its
own frame [x, y, z, yaw, depth], for the game (src/lr-game.js: LRFD) to put the glyph tiles on.
usage: /home/claude/bl/bin/python tools/world/finds.py  (from last-road's top)"""
import bpy  # noqa: F401
import os, json, gzip, base64, math
from collections import deque
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src = open(f'{ROOT}/src/lr-walk.js').read(); WALK = json.loads(src[src.index('=') + 1:].strip().rstrip(';'))

def read(path):
    vs = []; objs = {}; cur = None
    for line in open(path):
        t = line.split()
        if not t: continue
        if t[0] == 'v': vs.append(tuple(float(x) for x in t[1:4]))
        elif t[0] == 'o': cur = t[1]; objs.setdefault(cur, [])
        elif t[0] == 'f':
            if cur is None: cur = 'model'; objs.setdefault(cur, [])
            objs[cur].append([int(p.split('/')[0]) - 1 for p in t[1:]])
    return vs, objs

# the site models, how deep each stands in its ground (its dy: the ground is that far up its side), and how rough its
# walls may be (rock is rougher than dressed stone)
HOSTS = {'C04/model': (0, .05), 'C07/model': (-1.2, .05), 'C14/model': (0, .05), 'C21/model': (0, .05), 'C26/model': (-2.4, .05),
         'C32/model': (0, .06), 'C35/model': (0, .06), 'D10/arch_wide': (0, .14), 'D10/arch_round': (0, .14), 'D10/arch_broken': (0, .14),
         'D03/model': (0, .14), 'D12/mushroom': (0, .12), 'D12/stump': (0, .12), 'D12/hourglass': (0, .12), 'D12/spire_capped': (0, .12), 'D12/twin_spires': (0, .12), 'D12/stepped_tower': (0, .12)}

def spots(key, dy, tol):
    ID, obj = key.split('/'); vs, objs = read(f'{ROOT}/models/assets/{ID}/model_uv.obj'); B = BVHTree.FromPolygons(vs, objs[obj], all_triangles=False)
    G = WALK[key]; nx, nz, c = G['nx'], G['nz'], G['c']; a = np.frombuffer(gzip.decompress(base64.b64decode(G['z'])), np.uint8).reshape(4, nz, nx)
    Y = lambda q: G['y0'] + q * G['st']; T = -dy
    def floors(j, i):
        if a[0, j, i] == 255: return [T]
        c0, f1, c1, f2 = Y(a[0, j, i]), Y(a[1, j, i]) if a[1, j, i] else None, Y(a[2, j, i]), Y(a[3, j, i])
        fits = lambda g: g + 1.75 <= c0 or (f1 is not None and g + .05 >= f1 - .03 and g + 1.75 <= c1) or g + .05 >= f2 - .03
        out = [T] if fits(T) else []
        for g in (f1, f2):
            if g is not None and g >= T - .05 and fits(g): out.append(g)
        return out
    # walked in from outside
    seen = {}; Q = deque()
    for j in range(nz):
        for i in range(nx):
            if j in (0, nz - 1) or i in (0, nx - 1):
                for g in floors(j, i):
                    if g <= T + .55: seen[(j, i, g)] = 0; Q.append((j, i, g))
    while Q:
        j, i, f = Q.popleft(); d = seen[(j, i, f)]
        for dj, di in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            jj, ii = j + dj, i + di
            if not (0 <= jj < nz and 0 <= ii < nx): continue
            for g in floors(jj, ii):
                if g <= f + .55 and g >= f - 3 and (jj, ii, g) not in seen: seen[(jj, ii, g)] = d + 1; Q.append((jj, ii, g))
    # walls within reach, at chest height
    found = {}
    for (j, i, f), d in seen.items():
        if a[0, j, i] == 255 and d > 3: continue
        if (i + j) % 2: continue
        x, z = G['x0'] + (i + .5) * c, G['z0'] + (j + .5) * c
        sky = a[0, j, i] == 255 or f >= Y(a[3, j, i]) - .05     # (standing under the sky, not under a roof: the light's good)
        for y, k in ((f + hh, k) for hh in (1.0, 1.3, 1.6) for k in range(16)):
            t = k / 16 * 2 * math.pi; dr = Vector((math.cos(t), 0, math.sin(t))); h = B.ray_cast(Vector((x, y, z)), dr, 2.2)
            if h[0] is None: continue
            n = h[1].normalized()
            if abs(n.y) > .15 or n.dot(dr) > -.6: continue
            nh = Vector((n.x, 0, n.z)).normalized(); tg = Vector((-nh.z, 0, nh.x)); ok = True
            for off in (tg * .22, -tg * .22, Vector((0, .2, 0)), Vector((0, -.2, 0))):
                p0 = h[0] + nh * .6 + off; q = B.ray_cast(p0, -nh, 1.2)
                if q[0] is None or abs((q[0] - h[0]).dot(nh)) > tol or q[1].normalized().dot(nh) < .85: ok = False; break
            if not ok: continue
            P = h[0] + nh * .02; kk = (round(P.x / .4), round(P.y / .4), round(P.z / .4))
            score = min(d, 20) + (15 if sky else 0) - abs(P.y - f - 1.3) * 4 - abs(h[2] - 1.3)
            if kk not in found or found[kk][5] < score:
                found[kk] = (round(P.x, 3), round(P.y, 3), round(P.z, 3), round(math.atan2(nh.x, nh.z), 4), d, score)
    best = sorted(found.values(), key=lambda s: -s[5]); pick = []; sep = 2.8 if max(nx, nz) * c > 12 else 1.6
    for s in best:
        if all(math.dist(s[:3], q[:3]) > sep for q in pick): pick.append(s)
        if len(pick) >= 10: break
    return [list(s[:5]) for s in pick], len(seen), len(found)

# the things to find on the smaller models: a point on the thing's face, by a ray in from a side (or down from above)
THINGS = {'C03/model': {'hand': ((0, 1.05, 3), (0, 0, -1))}, 'C28/model': {'figure': ((0, 1.55, 3), (0, 0, -1))}, 'C16/model': {'top': ((0, 5, 0), (0, -1, 0))},
          'C35/model': {'stone': ((0, 6, 0), (0, -1, 0))}, 'D18/table': {'top': ((0, 3, 0), (0, -1, 0))}, 'D18/wreck': {'cockpit': ((0, 6, 0), (0, -1, 0))},
          'D18/fire_ring': {'ash': ((0, 3, 0), (0, -1, 0))}, 'D05/model': {'cab': ((4, 1.2, 2.4), (-1, 0, 0))}, 'D02/model': {'trunk': ((9, 1.7, -1.5), (-1, 0, 0))}}
def things():
    out = {}
    for key, T in THINGS.items():
        ID, obj = key.split('/'); vs, objs = read(f'{ROOT}/models/assets/{ID}/model_uv.obj'); B = BVHTree.FromPolygons(vs, objs[obj], all_triangles=False)
        for name, (o, d) in T.items():
            # (the nearest of five rays: a model can have a seam down its middle that one ray slips through)
            D = Vector(d); side = Vector((1, 0, 0)) if abs(d[0]) < .5 else Vector((0, 0, 1)); up = Vector((0, 1, 0)) if d[1] == 0 else Vector((0, 0, 1))
            hits = [B.ray_cast(Vector(o) + side * a + up * b, D, 50) for a, b in ((0, 0), (.12, 0), (-.12, 0), (0, .12), (0, -.12))]
            hits = [q for q in hits if q[0] is not None]
            if not hits: print('MISSED', key, name); continue
            h = min(hits, key=lambda q: q[3]); h = (Vector(o) + D * h[3],) + tuple(h[1:])
            P = h[0] - Vector(d) * .03; out.setdefault(key, {})[name] = [round(P.x, 3), round(P.y, 3), round(P.z, 3)] + ([round(-d[0], 3), round(-d[2], 3)] if d[1] == 0 else [])
            print(key, name, out[key][name])
    return out
out = {}
for key, (dy, tol) in HOSTS.items():
    S, nseen, nfound = spots(key, dy, tol); out[key] = S
    print(key, 'standing places', nseen, 'wall spots', nfound, 'picked', len(S), [s[4] for s in S], flush=True)
open(f'{ROOT}/src/lr-finds.js', 'w').write('/* GENERATED by tools/world/finds.py: the walls a person can walk up to on his walk sites ([x, y, z, yaw, depth], in each model\'s own frame), and points on the things to find [x, y, z, (the way its face looks: x, z)] */\nwindow.LR_SPOTS=' + json.dumps(out, separators=(',', ':')) + ';\nwindow.LR_THINGS=' + json.dumps(things(), separators=(',', ':')) + ';\n')
print('src/lr-finds.js', os.path.getsize(f'{ROOT}/src/lr-finds.js'), 'bytes')
