"""Where a person can stand in and on his models: for each big model (a walk site or a landmark), a grid over its
ground plan, and for each cell the heights of free space (where a person fits) straight up through it, found by
casting rays down through the model (its faces all face outward, so a ray going down enters stone at a top and
leaves it at an underside). Each cell keeps three things: the underside over the ground (c0: the space from the
ground up to it is free), one free room part way up (f1 its floor, c1 its ceiling) and the top (f2: the floor
that has only sky over it). A cell is the most cautious of its own nine rays and its eight neighbours' (so a
person's width is already in it: you stop a cell short of a wall). Empty columns are marked 255.
Written into src/lr-walk.js (window.LR_WALK), for the game's feet (src/lr-game.js: lrWalkFloor).
usage: /home/claude/bl/bin/python tools/world/walkgrid.py  (from last-road's top; Blender's python for its BVH)"""
import bpy  # noqa: F401  (Blender's python: mathutils comes with it)
import sys, os, json, gzip, base64, math
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INF = 1e9

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

def column(B, x, z, top):
    """the free spans (lo, hi) straight up through (x, z), lowest first"""
    o = Vector((x, top, z)); d = Vector((0, -1, 0)); free = []; hi = INF; solid = False; n = 0
    while n < 64:
        h = B.ray_cast(o, d, 1e5)
        if h[0] is None: break
        y = h[0].y; enter = h[1].dot(d) < 0; n += 1
        if enter:
            if not solid: free.append((y, hi)); solid = True
        else:
            if solid: hi = y; solid = False
            else: free.append((y, hi)); hi = y - .05      # (a face seen from behind while in the open: a thin sheet)
        o = h[0] + d * 1e-4
    if not solid: free.append((-INF, hi))
    return sorted(free), n

def meet(A, B):
    out = []
    for a0, a1 in A:
        for b0, b1 in B:
            lo, hi = max(a0, b0), min(a1, b1)
            if hi > lo: out.append((lo, hi))
    return sorted(out)

def grid(vs, faces, cell):
    used = sorted({i for f in faces for i in f}); P = np.array([vs[i] for i in used])
    mn, mx = P.min(0), P.max(0); B = BVHTree.FromPolygons(vs, faces, all_triangles=False)
    x0, z0 = mn[0] - cell, mn[2] - cell; nx = int(math.ceil((mx[0] - x0 + cell) / cell)); nz = int(math.ceil((mx[2] - z0 + cell) / cell))
    top = mx[1] + 1; raw = [[None] * nx for _ in range(nz)]; hits = np.zeros((nz, nx), bool)
    for j in range(nz):
        for i in range(nx):
            cx, cz = x0 + (i + .5) * cell, z0 + (j + .5) * cell; F = [(-INF, INF)]; any_hit = False
            for a in (-1, 0, 1):
                for b in (-1, 0, 1):
                    fr, n = column(B, cx + a * cell / 3, cz + b * cell / 3, top)
                    if n: any_hit = True
                    F = meet(F, fr)
            raw[j][i] = F; hits[j, i] = any_hit
    y0 = mn[1] - .5; st = max(.04, (mx[1] + .5 - y0) / 250)
    qd = lambda v: int(min(254, max(1, math.floor((v - y0) / st))))   # a ceiling, down
    qu = lambda v: int(min(254, max(1, math.ceil((v - y0) / st))))    # a floor, up
    planes = np.zeros((4, nz, nx), np.uint8)
    for j in range(nz):
        for i in range(nx):
            # the cell and its neighbours, the most cautious
            F = [(-INF, INF)]; hit = False
            for b in (-1, 0, 1):
                for a in (-1, 0, 1):
                    jj, ii = j + b, i + a
                    if 0 <= jj < nz and 0 <= ii < nx:
                        F = meet(F, raw[jj][ii]); hit |= hits[jj, ii]
            if not hit: planes[:, j, i] = (255, 0, 0, 0); continue
            c0 = next((hi for lo, hi in F if lo <= -INF / 2), -INF)
            topf = next((lo for lo, hi in F if hi >= INF / 2), None)
            mids = [(lo, hi) for lo, hi in F if lo > -INF / 2 and hi < INF / 2 and hi - lo > 1.0]
            m = max(mids, key=lambda s: s[1] - s[0]) if mids else None
            planes[0, j, i] = qd(c0) if c0 > -INF / 2 else 1
            if m: planes[1, j, i] = qu(m[0]); planes[2, j, i] = qd(m[1])
            planes[3, j, i] = qu(topf) if topf is not None else 254
    return dict(c=cell, nx=nx, nz=nz, x0=round(float(x0), 3), z0=round(float(z0), 3), y0=round(float(y0), 3), st=round(st, 4)), planes

# the walk sites and landmarks: every placed model of these whose ground plan is 3 m or more across
IDS = ['C04', 'C07', 'C14', 'C16', 'C21', 'C26', 'C28', 'C32', 'C35', 'D02', 'D03', 'D05', 'D10', 'D12', 'D13', 'D14', 'D16', 'D18']
out = {}
for ID in (sys.argv[1:] or IDS):
    vs, objs = read(f'{ROOT}/models/assets/{ID}/model_uv.obj')
    for name, faces in objs.items():
        P = np.array([vs[i] for i in sorted({i for f in faces for i in f})]); size = P.max(0) - P.min(0); ext = max(size[0], size[2])
        if ext < 3: continue
        cell = .25 if ext <= 25 else .5 if ext <= 70 else 1.0
        meta, planes = grid(vs, faces, cell)
        meta['z'] = base64.b64encode(gzip.compress(planes.tobytes(), 9)).decode()
        out[f'{ID}/{name}'] = meta
        print(ID, name, f'{meta["nx"]}x{meta["nz"]} cells of {cell} m', len(meta['z']) // 1024, 'KB', flush=True)
open(f'{ROOT}/src/lr-walk.js', 'w').write('/* GENERATED by tools/world/walkgrid.py: where a person can stand in and on his big models */\nwindow.LR_WALK=' + json.dumps(out, separators=(',', ':')) + ';\n')
print('src/lr-walk.js', os.path.getsize(f'{ROOT}/src/lr-walk.js') // 1024, 'KB')
