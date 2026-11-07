"""His panorama pictures made into horizon layers: the ID label painted out, the sky cut away (made see-through) so a
nearer layer can stand in front of a farther one, and the two ends joined so the band repeats along a side of the
world without a seam. Sky bands (dawn, dusk, night) keep their sky and are only joined end to end.
Writes models/horizon/<ID>.webp (with see-through sky) and a check picture on a plain backdrop in docs/horizon/.
usage: python3 tools/horizon.py <ID> ...  (from last-road's top)"""
import sys, os, glob
import numpy as np
from PIL import Image, ImageFilter
SKY_ONLY = {'I13', 'I14', 'I15'}
FAINT = {'I03', 'I06', 'I12'}
def src(i): return glob.glob(f'/home/claude/imgs/raw/*/{i}-*.png')[0]
for ID in sys.argv[1:]:
    a = np.asarray(Image.open(src(ID)).convert('RGB'), np.float64); h, w, _ = a.shape
    # (the label, bottom-left: a patch from just right of it)
    lw, lh = int(w * .035), int(h * .07); a[h - lh:, :lw] = a[h - lh:, lw + 6:2 * lw + 6]
    al = np.ones((h, w))
    if ID not in SKY_ONLY:
        # (the sky colour row by row: the median of the top rows, carried down by a straight-line fit)
        top = int(h * .12); ys = np.arange(top); med = np.median(a[:top], 1)
        A = np.c_[ys, np.ones(top)]; coef = np.linalg.lstsq(A, med, rcond=None)[0]
        sky = (np.c_[np.arange(h), np.ones(h)] @ coef)[:, None, :]
        d = np.sqrt(((a - sky) ** 2).sum(2)); from scipy.ndimage import gaussian_filter; d = gaussian_filter(d, 1.5)
        noise = np.percentile(d[:top], 99) + 2
        thr = max(noise * 1.6, 5)
        # (per column: the first row from the top where the picture stops looking like sky and stays that way)
        land = d > thr; run = 6; first = np.full(w, h - 1)
        for x in range(w):
            col = land[:, x]; c = np.convolve(col, np.ones(run), 'valid') >= run
            k = np.argmax(c) if c.any() else h - 1; first[x] = k
        if ID in FAINT:
            # (far, hazy layers barely differ from the sky: per column, the row where the colour steps most between the
            #  rows just above and just below; smoothed across neighbouring columns)
            from scipy.ndimage import uniform_filter1d, median_filter
            sm = uniform_filter1d(a, 9, axis=1); cs = np.cumsum(np.r_[np.zeros((1, w, 3)), sm], 0); R = 18
            ks = np.arange(int(h * .3), int(h * .95)); up = (cs[ks] - cs[ks - R]) / R; dn = (cs[ks + R] - cs[ks]) / R
            step = np.sqrt(((up - dn) ** 2).sum(2)); first = ks[step.argmax(0)]; first = median_filter(first, 7).astype(int)
            thr = 1.0; d = np.where(np.arange(h)[:, None] >= first[None, :], 9.0, 0.0)
        # (a soft edge just below where the land begins; the edge pixels have the sky taken back out of their colour,
        #  so no pale outline is left round the land)
        yy = np.arange(h)[:, None]
        soft = ((d - thr * .5) / (thr * 1.2)).clip(0, 1)
        al = np.where(yy >= first[None, :] + 4, 1.0, np.where(yy >= first[None, :], soft * ((yy - first[None, :] + 1) / 5), 0.0))
        # (clouds and dust are see-through at their wispy edges)
        if ID in ('I16', 'I17'): al = np.where(yy >= first[None, :], np.maximum(soft, (yy > first[None, :] + 40)), 0)
        m = (al > 0) & (al < 1); aa = np.maximum(al, .25)[..., None]
        fg = ((a - (1 - aa) * sky) / aa).clip(0, 255); a = np.where(m[..., None], fg, a)
    # (join the ends: the strip past the right end is laid over the left end along the line where they differ least)
    O = w // 6; n = w - O; A2 = a[:, n:]; B2 = a[:, :O]; e = ((A2 - B2) ** 2).sum(2) + 4e4 * (al[:, n:] - al[:, :O]) ** 2; c = e.copy()
    for y in range(1, h):
        l = np.r_[np.inf, c[y - 1, :-1]]; r = np.r_[c[y - 1, 1:], np.inf]; c[y] += np.minimum(np.minimum(l, c[y - 1]), r)
    cut = np.zeros(h, int); cut[-1] = c[-1].argmin()
    for y in range(h - 2, -1, -1):
        x = cut[y + 1]; lo = max(0, x - 1); cut[y] = lo + c[y, lo:min(O, x + 2)].argmin()
    xx = np.arange(O)[None, :]; wt = ((xx - cut[:, None]) / 4 + .5).clip(0, 1)
    out = a[:, :n].copy(); oal = al[:, :n].copy()
    out[:, :O] = A2 * (1 - wt[..., None]) + B2 * wt[..., None]; oal[:, :O] = al[:, n:] * (1 - wt) + al[:, :O] * wt
    rgba = np.dstack([out, oal * 255]).clip(0, 255).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA'); W = 2048; im = im.resize((W, round(W * h / n)), Image.LANCZOS)
    im.save(f'models/horizon/{ID}.webp', 'WEBP', quality=86, method=6)
    # (check picture: two copies side by side on a flat grey-pink backdrop, so a seam or leftover sky shows)
    bg = Image.new('RGBA', (im.width, im.height), (200, 120, 160, 255)); one = Image.alpha_composite(bg, im)
    chk = Image.new('RGB', (im.width * 2, im.height)); chk.paste(one, (0, 0)); chk.paste(one, (im.width, 0))
    chk.resize((1400, round(1400 * im.height / (im.width * 2)))).save(f'docs/horizon/{ID}-check.webp', 'WEBP', quality=78)
    print(ID, im.size, os.path.getsize(f'models/horizon/{ID}.webp') // 1024, 'KB', flush=True)
