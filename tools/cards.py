"""His plant-card sheets (leaf clusters, grass tufts, reeds...) cut out: the plain grey backdrop made see-through, the
backdrop's grey taken back out of the edge colours (so no grey fringe), the ID label and the scale bars removed, and
each separate plant piece found and boxed, so the game can draw many of them at once as flat cards.
Writes models/cards/<ID>.webp (see-through) and <ID>.json (the boxes: x, y, w, h in pixels, and the sheet's size),
and a check picture on dark ground in docs/cards/.  usage: python3 tools/cards.py <ID> ...  (from last-road's top)"""
import sys, os, glob, json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
def src(i): return glob.glob(f'/home/claude/imgs/raw/*/{i}-*.png')[0]
for ID in sys.argv[1:]:
    a = np.asarray(Image.open(src(ID)).convert('RGB'), np.float64); h, w, _ = a.shape
    mx, mn = a.max(2), a.min(2); sat = (mx - mn) / (mx + 1); lum = a.mean(2)
    # (the backdrop: a smooth grey fitted to the pixels that look like it)
    cand = (sat < .08) & (np.abs(lum - np.median(lum)) < 22); ys, xs = np.nonzero(cand); k = np.random.default_rng(0).choice(len(ys), min(40000, len(ys)), replace=False)
    def basis(y, x): y = y / h - .5; x = x / w - .5; return np.c_[np.ones_like(x), x, y, x * x, y * y, x * y]
    coef = np.linalg.lstsq(basis(ys[k], xs[k]), a[ys[k], xs[k]], rcond=None)[0]
    Y, X = np.mgrid[0:h, 0:w]; bg = (basis(Y.ravel(), X.ravel()) @ coef).reshape(h, w, 3)
    d = np.sqrt(((a - bg) ** 2).sum(2)) + 120 * np.maximum(sat - .06, 0)
    al = ((d - 9) / 30).clip(0, 1)
    # (the label in the corner, and grey marks along the bottom: scale bars and their numbers)
    al[int(h * .9):, :int(w * .06)] = 0
    lab, n = nd.label(nd.binary_dilation(al > .3, iterations=3))
    for i, sl in enumerate(nd.find_objects(lab), 1):
        m = lab[sl] == i; s = sat[sl][m].mean(); y0 = sl[0].start
        if (y0 > h * .82 and s < .14) or m.sum() < 60: al[sl][m] = 0
    # (the colour of the edge pixels with the backdrop taken out)
    aa = np.maximum(al, .2)[..., None]; fg = ((a - (1 - aa) * bg) / aa).clip(0, 255)
    rgba = np.dstack([np.where((al > 0)[..., None], fg, 0), al * 255]).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA'); im.save(f'models/cards/{ID}.webp', 'WEBP', quality=90, method=6)
    # (the separate pieces: joined if within 8 px, small crumbs dropped)
    lab, n = nd.label(nd.binary_dilation(al > .25, iterations=4)); boxes = []
    # (pieces that touch only by a few wisps are split where the see-through gap across them is nearly clear)
    def split(x, y, bw, bh, depth=0):
        A = al[y:y + bh, x:x + bw]
        for axis in (0, 1):
            prof = A.sum(axis); L = len(prof); thr = prof.max() * .06; best = None
            for i in range(50, L - 50):
                if prof[i] <= thr and (best is None or prof[i] < prof[best]): best = i
            if best is not None and depth < 6:
                # (only if both halves are whole plants: each spans most of the other way, not a scrap of a leaning stem)
                P = (A[:, :best], A[:, best:]) if axis == 0 else (A[:best], A[best:])
                ext = [np.nonzero((q > .1).any(1 - axis))[0] for q in P]
                if any(len(e) == 0 or (e.max() - e.min()) < .6 * A.shape[axis] for e in ext): continue
                if axis == 0: return split(x, y, best, bh, depth + 1) + split(x + best, y, bw - best, bh, depth + 1)
                return split(x, y, bw, best, depth + 1) + split(x, y + best, bw, bh - best, depth + 1)
        ys, xs = np.nonzero(A > .1)
        if len(ys) < 1500: return []
        return [[int(x + xs.min()), int(y + ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)]]
    for i, sl in enumerate(nd.find_objects(lab), 1):
        if (lab[sl] == i).sum() < 3000: continue
        boxes += split(sl[1].start, sl[0].start, sl[1].stop - sl[1].start, sl[0].stop - sl[0].start)
    boxes.sort(key=lambda b: (b[1] // 120, b[0]))
    json.dump({'id': ID, 'size': [w, h], 'cards': boxes}, open(f'models/cards/{ID}.json', 'w'))
    chk = Image.new('RGBA', (w, h), (34, 52, 30, 255)); chk = Image.alpha_composite(chk, im).convert('RGB'); dr = ImageDraw.Draw(chk)
    for x, y, bw, bh in boxes: dr.rectangle([x, y, x + bw, y + bh], outline=(255, 80, 200), width=2)
    chk.resize((w // 2, h // 2)).save(f'docs/cards/{ID}-check.webp', 'WEBP', quality=80)
    print(ID, len(boxes), 'cards', os.path.getsize(f'models/cards/{ID}.webp') // 1024, 'KB', flush=True)
