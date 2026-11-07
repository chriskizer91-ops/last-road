"""A model's colour, painted from its reference sheet: for each object of model_uv.obj, each view the helper found on the
sheet (its box, and the camera it was drawn from) is cut out, the object's outline fitted to it (scale, turn, shift),
and every texel coloured from the views that see it squarely (a depth test hides what's behind). Texels no view sees
take their neighbours' colour, then their material's middle colour. As tools/truck_livery.py does for the truck.
usage: python3 project.py <model dir> <sheet.png> <views.json> <picture size>
writes <object>_albedo.png (the colour), <object>_albedo_ao.png (with the crease shade, gently), fit.json"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage, optimize
D, SHEET, VJ, N = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
V = json.load(open(VJ)); MATC = json.load(open(os.path.join(D, 'materials.json')))
sheet = Image.open(SHEET).convert('RGB')
# ---------- the OBJ: per object, its triangles (point, picture coordinate, normal, material) ----------
vs, vts, vns = [], [], []; objs = {}; cur = None; mat = 'mat'
for line in open(os.path.join(D, 'model_uv.obj')):
    t = line.split()
    if not t: continue
    if t[0] == 'v': vs.append([float(x) for x in t[1:4]])
    elif t[0] == 'vt': vts.append([float(x) for x in t[1:3]])
    elif t[0] == 'vn': vns.append([float(x) for x in t[1:4]])
    elif t[0] == 'o': cur = t[1]; objs.setdefault(cur, [])
    elif t[0] == 'usemtl': mat = t[1].split('.')[0]
    elif t[0] == 'f':
        if cur is None: cur = 'model'; objs.setdefault(cur, [])
        c = [list(map(lambda q: int(q) if q else 0, p.split('/'))) + [0, 0] for p in t[1:4]]; objs[cur].append((c, mat))
vs, vts, vns = np.array(vs), np.array(vts), np.array(vns)
lin = lambda x: np.where(x <= .04045, x / 12.92, ((x + .055) / 1.055) ** 2.4)
srgb = lambda x: np.where(x <= .0031308, x * 12.92, 1.055 * np.power(np.clip(x, 0, None), 1 / 2.4) - .055)
def axes(cam, up):
    z = np.array(cam, float); z /= np.linalg.norm(z); u = np.array(up, float); x = np.cross(u, z); x /= np.linalg.norm(x); y = np.cross(z, x); return x, y, z
def cutout(im):
    a = np.asarray(im, np.float64); edge = np.concatenate([a[:5].reshape(-1, 3), a[-5:].reshape(-1, 3), a[:, :5].reshape(-1, 3), a[:, -5:].reshape(-1, 3)])
    bg = np.median(edge, 0); dd = np.sqrt(((a - bg) ** 2).sum(2)); sat = a.max(2) - a.min(2)
    m = (dd > 24) | ((dd > 13) & (sat > 20)); m = ndimage.binary_opening(m, iterations=1); lab, nl = ndimage.label(m)
    if nl > 1: sz = ndimage.sum(m, lab, range(1, nl + 1)); m = np.isin(lab, 1 + np.nonzero(sz > sz.max() * .03)[0])
    return ndimage.binary_fill_holes(ndimage.binary_closing(m, iterations=2))
fits = {}; ID = os.path.basename(os.path.normpath(D))
def sample(G, pts, nrms):
    """the colour each point takes from one fitted view, and how much (facing it squarely, in sight, inside the cut-out)"""
    x, y, z, a0, b0, K = G['x'], G['y'], G['z'], G['a0'], G['b0'], G['K']; m, me, Z = G['m'], G['me'], G['Z']
    ta, tb, td = pts @ x, pts @ y, pts @ z
    Xp = (ta - a0) * K * G['sx']; Yp = (b0 - tb) * K * G['sy']; c, s = np.cos(G['th']), np.sin(G['th']); u = (c * Xp - s * Yp + G['tx']) * G['ds']; v = (s * Xp + c * Yp + G['ty']) * G['ds']
    zx = ((ta - a0) * K).round().astype(int).clip(0, G['Wd'] - 1); zy = ((b0 - tb) * K).round().astype(int).clip(0, G['Hd'] - 1)
    vis = td >= ndimage.maximum_filter(Z, size=3)[zy, zx] - .03; face = (nrms @ z).clip(0, 1) ** 2
    inside = (u >= 0) & (u < m.shape[1] - 1) & (v >= 0) & (v < m.shape[0] - 1)
    ui, vi = u.clip(0, m.shape[1] - 1).round().astype(int), v.clip(0, m.shape[0] - 1).round().astype(int)
    w = face * vis * (inside & me[vi, ui]) * (G['iou'] ** 2)
    col = np.stack([ndimage.map_coordinates(G['A'][..., ch], [v, u], order=1, mode='nearest') for ch in range(3)], 1)
    return col, w
for name, faces in objs.items():
    P = np.array([[vs[c[0] - 1] for c in f] for f, m in faces]); UV = np.array([[vts[c[1] - 1] if c[1] else [0, 0] for c in f] for f, m in faces])
    NR = np.array([[vns[c[2] - 1] if c[2] else [0, 1, 0] for c in f] for f, m in faces]); MN = [m for f, m in faces]
    mats = sorted(set(MN)); MI = np.array([mats.index(m) for m in MN])
    # texel -> point, normal, material (pictures' top row is v = 1)
    pos = np.zeros((N, N, 3)); nrm = np.zeros((N, N, 3)); cov = np.zeros((N, N), bool); tm = np.full((N, N), -1)
    U = np.stack([UV[..., 0] * N - .5, (1 - UV[..., 1]) * N - .5], -1)
    for k in range(len(P)):
        a, b2, c = U[k]
        x0, x1 = int(np.floor(min(a[0], b2[0], c[0]))), int(np.ceil(max(a[0], b2[0], c[0]))); y0, y1 = int(np.floor(min(a[1], b2[1], c[1]))), int(np.ceil(max(a[1], b2[1], c[1])))
        x0, y0 = max(x0, 0), max(y0, 0); x1, y1 = min(x1, N - 1), min(y1, N - 1)
        if x1 < x0 or y1 < y0: continue
        X, Y = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1)); d = (b2[1] - c[1]) * (a[0] - c[0]) + (c[0] - b2[0]) * (a[1] - c[1])
        if abs(d) < 1e-12: continue
        w0 = ((b2[1] - c[1]) * (X - c[0]) + (c[0] - b2[0]) * (Y - c[1])) / d; w1 = ((c[1] - a[1]) * (X - c[0]) + (a[0] - c[0]) * (Y - c[1])) / d; w2 = 1 - w0 - w1
        m = (w0 >= -1e-3) & (w1 >= -1e-3) & (w2 >= -1e-3)
        if not m.any(): continue
        yy, xx = Y[m], X[m]; W = np.stack([w0[m], w1[m], w2[m]], 1)
        pos[yy, xx] = W @ P[k]; nn = W @ NR[k]; nrm[yy, xx] = nn / np.linalg.norm(nn, axis=1, keepdims=True).clip(1e-9); cov[yy, xx] = True; tm[yy, xx] = MI[k]
    py, px = np.nonzero(cov); pp = pos[py, px]; pn = nrm[py, px]
    acc_c = np.zeros((len(pp), 3)); acc_w = np.zeros(len(pp)); fits[name] = {}; GOOD = []
    ob = next((o for o in V['objects'] if o['name'] == name), V['objects'][0] if len(V['objects']) == 1 else None)
    for vw in (ob['views'] if ob else []):
        x, y, z = axes(vw['cam'], vw['up']); K = 100.0
        a, bb, dd = P.reshape(-1, 3) @ x, P.reshape(-1, 3) @ y, P.reshape(-1, 3) @ z
        a0, b0 = a.min() - .05, bb.max() + .05; Wd, Hd = int((a.max() - a0 + .05) * K) + 2, int((b0 - bb.min() + .05) * K) + 2
        if Wd * Hd > 9e6: K = K * np.sqrt(9e6 / (Wd * Hd)); Wd, Hd = int((a.max() - a0 + .05) * K) + 2, int((b0 - bb.min() + .05) * K) + 2
        Z = np.full((Hd, Wd), -1e9); X3 = ((a - a0) * K).reshape(-1, 3); Y3 = ((b0 - bb) * K).reshape(-1, 3); D3 = dd.reshape(-1, 3)
        for k in range(len(X3)):
            xa, ya, za = X3[k], Y3[k], D3[k]
            x0, x1 = max(int(np.floor(xa.min())), 0), min(int(np.ceil(xa.max())), Wd - 1); y0, y1 = max(int(np.floor(ya.min())), 0), min(int(np.ceil(ya.max())), Hd - 1)
            if x1 < x0 or y1 < y0: continue
            XX, YY = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1)); den = (ya[1] - ya[2]) * (xa[0] - xa[2]) + (xa[2] - xa[1]) * (ya[0] - ya[2])
            if abs(den) < 1e-9: continue
            w0 = ((ya[1] - ya[2]) * (XX - xa[2]) + (xa[2] - xa[1]) * (YY - ya[2])) / den; w1 = ((ya[2] - ya[0]) * (XX - xa[2]) + (xa[0] - xa[2]) * (YY - ya[2])) / den; w2 = 1 - w0 - w1
            mm = (w0 >= -.03) & (w1 >= -.03) & (w2 >= -.03)
            if mm.any(): zz = w0 * za[0] + w1 * za[1] + w2 * za[2]; Z[YY[mm], XX[mm]] = np.maximum(Z[YY[mm], XX[mm]], zz[mm])
        bx = vw['box']; mx, my = int((bx[2] - bx[0]) * .06) + 6, int((bx[3] - bx[1]) * .06) + 6
        X0, Y0, X1, Y1 = max(int(bx[0]) - mx, 0), max(int(bx[1]) - my, 0), min(int(bx[2]) + mx, sheet.width), min(int(bx[3]) + my, sheet.height)
        crop = sheet.crop((X0, Y0, X1, Y1)); m = cutout(crop)
        if m.sum() < 50: fits[name][vw['label']] = {'iou': 0}; continue
        ds = max(1, int(round(m.shape[1] / 480))); ms = m[::ds, ::ds].astype(float); hs, ws = ms.shape; mmk = Z > -1e8
        ys, xs = np.nonzero(ms > .5); yz, xz = np.nonzero(mmk)
        sx0 = (xs.max() - xs.min() + 1) / (xz.max() - xz.min() + 1); sy0 = (ys.max() - ys.min() + 1) / (yz.max() - yz.min() + 1)
        tx0 = xs.min() - xz.min() * sx0; ty0 = ys.min() - yz.min() * sy0
        gy, gx = np.mgrid[0:hs, 0:ws].astype(float); sm = ndimage.gaussian_filter(ms, 1.0); mmf = ndimage.gaussian_filter(mmk.astype(float), 1.0)
        def pred(p):
            sx, sy, th, tx, ty = p; c, s = np.cos(th), np.sin(th); Xq = gx - tx; Yq = gy - ty
            return ndimage.map_coordinates(mmf, [(-s * Xq + c * Yq) / sy, (c * Xq + s * Yq) / sx], order=1, cval=0)
        def cost(p):
            if p[0] <= 0 or p[1] <= 0: return 9
            q = pred(p); return -(2 * (q * sm).sum() / (q.sum() + sm.sum() + 1e-9)) + 3 * max(0, abs(np.log(p[1] / p[0])) - .2) ** 2 + 2 * max(0, abs(p[2]) - .05) ** 2
        best = optimize.minimize(cost, np.array([sx0, sy0, 0, tx0, ty0]), method='Powell', options={'xtol': 1e-3, 'ftol': 1e-5, 'maxiter': 3000})
        q = pred(best.x) > .5; iou = float((q & (ms > .5)).sum() / ((q | (ms > .5)).sum() + 1e-9)); sx, sy, th, tx, ty = best.x
        fits[name][vw['label']] = {'iou': round(iou, 3), 'turn_deg': round(float(np.degrees(th)), 2)}; print(ID, name, vw['label'], fits[name][vw['label']], flush=True)
        if iou < .55: continue
        G = dict(x=x, y=y, z=z, a0=a0, b0=b0, K=K, sx=sx, sy=sy, th=th, tx=tx, ty=ty, ds=ds, m=m, Z=Z, Wd=Wd, Hd=Hd, iou=iou,
                 me=ndimage.binary_erosion(m, iterations=2), A=lin(np.asarray(crop, np.float64) / 255)); GOOD.append(G)
        col, w = sample(G, pp, pn); acc_c += col * w[:, None]; acc_w += w
    # (faces no view sees, the far side of a thing drawn from one side only: from the view of the near side, as if
    #  the thing were the same both sides (the point and its facing mirrored through the middle along that view's
    #  axis), where that mirrored point is in sight in that view)
    un = acc_w <= .02
    if un.any() and GOOD:
        lo, hi = P.reshape(-1, 3).min(0), P.reshape(-1, 3).max(0); mid = (lo + hi) / 2
        for G in GOOD:
            k = int(np.argmax(np.abs(G['z']))); q = pp[un].copy(); qn = pn[un].copy(); q[:, k] = 2 * mid[k] - q[:, k]; qn[:, k] *= -1
            col, w = sample(G, q, qn); w *= .6; idx = np.nonzero(un)[0]; acc_c[idx] += col * w[:, None]; acc_w[idx] += w
    colr = np.zeros((N, N, 3)); got = np.zeros((N, N), bool); seen = acc_w > .02
    colr[py[seen], px[seen]] = acc_c[seen] / acc_w[seen][:, None]; got[py[seen], px[seen]] = True
    fill = got.copy()
    for it in range(24):
        todo = cov & ~fill
        if not todo.any(): break
        s_ = ndimage.uniform_filter(colr * fill[..., None], (5, 5, 1)); c_ = ndimage.uniform_filter(fill.astype(float), 5)
        new = todo & (c_ > .05) & (tm == ndimage.maximum_filter(np.where(fill, tm, -1), 5)); colr[new] = s_[new] / c_[new][:, None]; fill |= new
    for i, mn in enumerate(mats):
        rest = cov & ~fill & (tm == i)
        if not rest.any(): continue
        g = got & (tm == i)
        mid = np.median(colr[g], 0) if g.sum() > 50 else lin(np.array([int(MATC.get(mn, '#888888')[k:k + 2], 16) for k in (1, 3, 5)]) / 255.)
        colr[rest] = mid; fill |= rest
    grow = cov.copy(); cl = colr.copy()
    for it in range(8):
        s_ = ndimage.uniform_filter(cl * grow[..., None], (3, 3, 1)); c_ = ndimage.uniform_filter(grow.astype(float), 3); new = ~grow & (c_ > .1)
        cl[new] = s_[new] / c_[new][:, None]; grow |= new
    colr = cl; colr[~grow] = colr[cov].mean(0) if cov.any() else .5
    Image.fromarray((srgb(colr.clip(0, 1)) * 255 + .5).astype(np.uint8)).save(os.path.join(D, name + '_albedo.png'))
    aop = os.path.join(D, name + '_ao.png'); ao = np.asarray(Image.open(aop).convert('L').resize((N, N)), np.float64)[..., None] / 255 if os.path.exists(aop) else 1
    Image.fromarray((srgb((colr * (.72 + .28 * ao)).clip(0, 1)) * 255 + .5).astype(np.uint8)).save(os.path.join(D, name + '_albedo_ao.png'))
    fits[name]['texels'] = {'covered': int(cov.sum()), 'seen': int(got.sum())}
    print(ID, name, 'texels covered', int(cov.sum()), 'seen by a view', int(got.sum()), flush=True)
json.dump(fits, open(os.path.join(D, 'fit.json'), 'w'), indent=1)
