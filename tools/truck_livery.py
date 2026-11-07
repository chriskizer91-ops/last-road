"""A paint job for the Rock & Mud's play model, from a picture made on its template (pictures/templates/rock-mud-paint-
template.png: left, right, top, front and back at known scales), the way salt-mini-plus redtail/tools/livery.py paints
the plane: each view's outline fitted to the model's (scale, turn, shift), then every paint texel of the play model's
body coloured from the views that see it squarely (weighted by how squarely, hidden texels left out by a depth test).
Only the paint (the bake's skin_paint.png) changes; the trim, rack, bumpers and lamps keep the Studio 2's bake.
usage: python3 tools/truck_livery.py <paint picture> <out.png> [bake dir]   (writes out.png: the body's colour, 2048,
without the shade (tools/truck_pack.py adds it), and out-fit.json: each view's fit)"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage, optimize
SRC, OUT = sys.argv[1], sys.argv[2]; B = sys.argv[3] if len(sys.argv) > 3 else 'models/rock-mud/play/bake-50k'
T = json.load(open('pictures/templates/rock-mud-paint-template.json')); N = 2048
def raw(name, uv):
    r = np.fromfile(os.path.join(B, name + '.bin'), dtype=np.float32); k = 10 if uv else 8; n = len(r) // k
    P = r[:n * 3].reshape(-1, 3); Nn = r[n * 3:n * 6].reshape(-1, 3); U = r[n * 6:n * 8].reshape(-1, 2) if uv else None
    return P, Nn, U
P, NR, UV = raw('skin', True); PG, _, _ = raw('glass', False); PU, _, _ = raw('under', False)
TRI = np.arange(len(P)).reshape(-1, 3)
# ---------- texel -> point, normal (the bake's pictures: the top row is v = 1) ----------
pos = np.zeros((N, N, 3)); nrm = np.zeros((N, N, 3)); cov = np.zeros((N, N), bool)
U = np.c_[UV[:, 0] * N - .5, (1 - UV[:, 1]) * N - .5]
for (i0, i1, i2) in TRI:
    a, b2, c = U[i0], U[i1], U[i2]
    x0, x1 = int(np.floor(min(a[0], b2[0], c[0]))), int(np.ceil(max(a[0], b2[0], c[0]))); y0, y1 = int(np.floor(min(a[1], b2[1], c[1]))), int(np.ceil(max(a[1], b2[1], c[1])))
    x0, y0 = max(x0, 0), max(y0, 0); x1, y1 = min(x1, N - 1), min(y1, N - 1)
    if x1 < x0 or y1 < y0: continue
    X, Y = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
    d = (b2[1] - c[1]) * (a[0] - c[0]) + (c[0] - b2[0]) * (a[1] - c[1])
    if abs(d) < 1e-12: continue
    w0 = ((b2[1] - c[1]) * (X - c[0]) + (c[0] - b2[0]) * (Y - c[1])) / d; w1 = ((c[1] - a[1]) * (X - c[0]) + (a[0] - c[0]) * (Y - c[1])) / d; w2 = 1 - w0 - w1
    m = (w0 >= -1e-4) & (w1 >= -1e-4) & (w2 >= -1e-4)
    if not m.any(): continue
    yy, xx = Y[m], X[m]; W = np.stack([w0[m], w1[m], w2[m]], 1)
    pos[yy, xx] = W @ P[[i0, i1, i2]]; nn = W @ NR[[i0, i1, i2]]; nrm[yy, xx] = nn / np.linalg.norm(nn, axis=1, keepdims=True).clip(1e-9); cov[yy, xx] = True
paint = cov & (np.asarray(Image.open(os.path.join(B, 'skin_paint.png')).convert('L')) > 127)
print('texels covered', int(cov.sum()), 'paint', int(paint.sum()), flush=True)
# ---------- the views: (across, up, toward the camera) from the template's cameras ----------
ALL = np.concatenate([P, PG, PU]); ALLT = np.arange(len(ALL)).reshape(-1, 3)
def axes(cam, up):
    z = np.array(cam, float); u = np.array(up, float); x = np.cross(u, z); x /= np.linalg.norm(x); y = np.cross(z, x); return x, y, z
K = 100.0
def zbuffer(x, y, z):
    a, bb, d = ALL @ x, ALL @ y, ALL @ z; a0, b0 = a.min() - .2, bb.max() + .2; Wd, Hd = int((a.max() - a0 + .2) * K) + 2, int((b0 - bb.min() + .2) * K) + 2
    Z = np.full((Hd, Wd), -1e9); X = (a - a0) * K; Y = (b0 - bb) * K
    for i in ALLT:
        xa, ya, za = X[i], Y[i], d[i]
        x0, x1 = max(int(np.floor(xa.min())), 0), min(int(np.ceil(xa.max())), Wd - 1); y0, y1 = max(int(np.floor(ya.min())), 0), min(int(np.ceil(ya.max())), Hd - 1)
        if x1 < x0 or y1 < y0: continue
        XX, YY = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1)); den = (ya[1] - ya[2]) * (xa[0] - xa[2]) + (xa[2] - xa[1]) * (ya[0] - ya[2])
        if abs(den) < 1e-9: continue
        w0 = ((ya[1] - ya[2]) * (XX - xa[2]) + (xa[2] - xa[1]) * (YY - ya[2])) / den; w1 = ((ya[2] - ya[0]) * (XX - xa[2]) + (xa[0] - xa[2]) * (YY - ya[2])) / den; w2 = 1 - w0 - w1
        m = (w0 >= -.02) & (w1 >= -.02) & (w2 >= -.02)
        if m.any(): zz = w0 * za[0] + w1 * za[1] + w2 * za[2]; Z[YY[m], XX[m]] = np.maximum(Z[YY[m], XX[m]], zz[m])
    return Z, a0, b0
def cutout(im):
    a = np.asarray(im, np.float64); h, w = a.shape[:2]; edge = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    bg = np.median(edge, 0); dd = np.sqrt(((a - bg) ** 2).sum(2)); sat = a.max(2) - a.min(2)
    m = (dd > 26) | ((dd > 14) & (sat > 22)); m = ndimage.binary_opening(m, iterations=2); lab, nl = ndimage.label(m)
    if nl > 1: sz = ndimage.sum(m, lab, range(1, nl + 1)); m = np.isin(lab, 1 + np.nonzero(sz > sz.max() * .02)[0])
    return ndimage.binary_fill_holes(m)
def fitview(crop, Z, a0, b0):
    m = cutout(crop); ds = max(1, int(round(m.shape[1] / 520))); ms = m[::ds, ::ds].astype(float); hs, ws = ms.shape
    mm = Z > -1e8; ys, xs = np.nonzero(ms > .5); yz, xz = np.nonzero(mm)
    sx0 = (xs.max() - xs.min()) / (xz.max() - xz.min()); sy0 = (ys.max() - ys.min()) / (yz.max() - yz.min())
    tx0 = xs.min() - xz.min() * sx0; ty0 = ys.min() - yz.min() * sy0
    gy, gx = np.mgrid[0:hs, 0:ws].astype(float); sm = ndimage.gaussian_filter(ms, 1.2); mmf = ndimage.gaussian_filter(mm.astype(float), 1.2)
    def pred(p):
        sx, sy, th, tx, ty = p; c, s = np.cos(th), np.sin(th); X = gx - tx; Y = gy - ty
        return ndimage.map_coordinates(mmf, [(-s * X + c * Y) / sy, (c * X + s * Y) / sx], order=1, cval=0)
    def cost(p): q = pred(p); r = p[1] / p[0]; return -(2 * (q * sm).sum() / (q.sum() + sm.sum() + 1e-9)) + 4 * max(0, abs(np.log(r)) - .12) ** 2 + 2 * max(0, abs(p[2]) - .04) ** 2
    best = optimize.minimize(cost, np.array([sx0, sy0, 0, tx0, ty0]), method='Powell', options={'xtol': 1e-3, 'ftol': 1e-5, 'maxiter': 4000})
    q = pred(best.x) > .5; iou = (q & (ms > .5)).sum() / ((q | (ms > .5)).sum() + 1e-9); sx, sy, th, tx, ty = best.x
    def to_px(a, bb):
        X = (a - a0) * K * sx; Y = (b0 - bb) * K * sy; c, s = np.cos(th), np.sin(th)
        return (c * X - s * Y + tx) * ds, (s * X + c * Y + ty) * ds
    return to_px, m, {'iou': round(float(iou), 3), 'px_per_m': [round(float(sx * K * ds), 1), round(float(sy * K * ds), 1)], 'turn_deg': round(float(np.degrees(th)), 2)}
lin = lambda x: np.where(x <= .04045, x / 12.92, ((x + .055) / 1.055) ** 2.4)
srgb = lambda x: np.where(x <= .0031308, x * 12.92, 1.055 * np.power(np.clip(x, 0, None), 1 / 2.4) - .055)
sheet = Image.open(SRC).convert('RGB')
if sheet.size != tuple(T['sheet']): sheet = sheet.resize(tuple(T['sheet']), Image.LANCZOS)
acc_c = np.zeros((N, N, 3)); acc_w = np.zeros((N, N)); fits = {}
py, px = np.nonzero(paint); pp = pos[py, px]; pn = nrm[py, px]
for name, v in T['views'].items():
    x, y, z = axes(v['cam'], v['up']); Z, a0, b0 = zbuffer(x, y, z)
    mx, my = int(v['w'] * .12) + 16, int(v['h'] * .12) + 16                    # (the crop: the view's place on the template, and a margin)
    X0, Y0 = max(v['x'] - mx, 0), max(v['y'] - my, 0); X1, Y1 = min(v['x'] + v['w'] + mx, sheet.width), min(v['y'] + v['h'] + my, sheet.height)
    crop = sheet.crop((X0, Y0, X1, Y1)); to_px, m, info = fitview(crop, Z, a0, b0); fits[name] = info; print(name, info, flush=True)
    if info['iou'] < .6: print('  (fit too poor: this view left out)'); continue
    a, bb, d = pp @ x, pp @ y, pp @ z; u, vv = to_px(a, bb)
    zx = ((a - a0) * K).round().astype(int).clip(0, Z.shape[1] - 1); zy = ((b0 - bb) * K).round().astype(int).clip(0, Z.shape[0] - 1)
    vis = d >= ndimage.maximum_filter(Z, size=3)[zy, zx] - .035; face = (pn @ z).clip(0, 1) ** 2
    me = ndimage.binary_erosion(m, iterations=3); inside = (u >= 0) & (u < m.shape[1] - 1) & (vv >= 0) & (vv < m.shape[0] - 1)
    ui, vi = u.clip(0, m.shape[1] - 1).round().astype(int), vv.clip(0, m.shape[0] - 1).round().astype(int)
    w = face * vis * (inside & me[vi, ui]); A = lin(np.asarray(crop, np.float64) / 255)
    col = np.stack([ndimage.map_coordinates(A[..., ch], [vv, u], order=1, mode='nearest') for ch in range(3)], 1)
    acc_c[py, px] += col * w[:, None]; acc_w[py, px] += w; print('  paint texels it colours', int((w > .05).sum()), flush=True)
json.dump(fits, open(OUT[:-4] + '-fit.json', 'w'), indent=1)
got = paint & (acc_w > .03); colr = np.zeros((N, N, 3)); colr[got] = acc_c[got] / acc_w[got][:, None]
print('paint texels seen', int(got.sum()), 'of', int(paint.sum()))
fill = got.copy()
for it in range(40):
    todo = paint & ~fill
    if not todo.any(): break
    s = ndimage.uniform_filter(colr * fill[..., None], (5, 5, 1)); c = ndimage.uniform_filter(fill.astype(float), 5)
    new = todo & (c > .05); colr[new] = s[new] / c[new][:, None]; fill |= new
rest = paint & ~fill
if rest.any(): colr[rest] = np.median(colr[got], 0)
print('filled from neighbours', int((fill & ~got).sum()), 'given the middle colour', int(rest.sum()))
orig = lin(np.asarray(Image.open(os.path.join(B, 'skin_col.png')).convert('RGB'), np.float64) / 255)
outl = orig.copy(); outl[paint] = colr[paint]
grow = paint.copy(); cl = outl.copy()
for it in range(6):
    s = ndimage.uniform_filter(cl * grow[..., None], (3, 3, 1)); c = ndimage.uniform_filter(grow.astype(float), 3); new = ~cov & ~grow & (c > .1)
    cl[new] = s[new] / c[new][:, None]; grow |= new
outl[grow & ~cov] = cl[grow & ~cov]
Image.fromarray((srgb(outl.clip(0, 1)) * 255 + .5).astype(np.uint8)).save(OUT); print('wrote', OUT)
