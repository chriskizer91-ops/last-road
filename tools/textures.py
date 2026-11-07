"""His texture pictures made ready for the game: the ID label in the bottom-left corner painted out (a patch from just
above it, feathered in), cut square, sized (1024; phones halve it on load), and made to tile without a seam (the
picture blended with itself moved half a tile, so its edges match). Writes models/textures/<ID>.webp and a 2 x 2
tiling preview in docs/textures/. usage: python3 tools/textures.py <ID> ...  (from last-road's top; IDs of TEXTURE pictures)"""
import sys, os, json
import numpy as np
from PIL import Image, ImageFilter
os.makedirs('models/textures', exist_ok=True); os.makedirs('docs/textures', exist_ok=True)
def ref(i): return 'pictures/ref/' + next(f for f in os.listdir('pictures/ref') if f.startswith(i + '-'))
for ID in sys.argv[1:]:
    im = Image.open(ref(ID)).convert('RGB'); w, h = im.size; s = min(w, h); im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
    a = np.asarray(im, np.float64)
    # (the label: about 9% wide, 6% tall in the corner; a patch from just above it, feathered)
    lw, lh = int(s * .1), int(s * .07); src = a[s - 2 * lh - 8:s - lh - 8, :lw].copy()
    yy, xx = np.mgrid[0:lh, 0:lw]; f = np.minimum(np.minimum((lw - xx) / (lw * .25), 1), np.minimum(yy / (lh * .25) + 1, 1)).clip(0, 1)[..., None]
    f = np.minimum(1, np.minimum((lw - xx) / (lw * .3), (yy + lh * .3) / (lh * .3))).clip(0, 1)[..., None]
    a[s - lh:, :lw] = a[s - lh:, :lw] * (1 - f) + src * f
    N = 1024; O = N // 8; a = np.asarray(Image.fromarray(a.clip(0, 255).astype(np.uint8)).resize((N + O, N + O), Image.LANCZOS), np.float64)
    # (seamless: the picture is cut a little smaller than it is, and the strip past each edge is laid over the opposite
    #  edge, joined along the line where the two differ least (so bricks and boards don't double up), feathered 3 px)
    def wrap(a):
        n = a.shape[1] - O; A = a[:, n:n + O]; B = a[:, :O]; e = ((A - B) ** 2).sum(2); c = e.copy()
        for y in range(1, len(c)):
            l = np.r_[np.inf, c[y - 1, :-1]]; r = np.r_[c[y - 1, 1:], np.inf]; c[y] += np.minimum(np.minimum(l, c[y - 1]), r)
        cut = np.zeros(len(c), int); cut[-1] = c[-1].argmin()
        for y in range(len(c) - 2, -1, -1):
            x = cut[y + 1]; lo = max(0, x - 1); cut[y] = lo + c[y, lo:min(O, x + 2)].argmin()
        xx = np.arange(O)[None, :]; w = ((xx - cut[:, None]) / 3 + .5).clip(0, 1)[..., None]
        out = a[:, :n].copy(); out[:, :O] = A * (1 - w) + B * w; return out
    out = wrap(a); out = wrap(out.transpose(1, 0, 2)).transpose(1, 0, 2)
    o = Image.fromarray(out.clip(0, 255).astype(np.uint8)); o.save(f'models/textures/{ID}.webp', 'WEBP', quality=88, method=6)
    pv = Image.new('RGB', (N, N)); sm = o.resize((N // 2, N // 2))
    for i in range(2):
        for j in range(2): pv.paste(sm, (i * N // 2, j * N // 2))
    pv.save(f'docs/textures/{ID}-tiled.webp', 'WEBP', quality=80); print(ID, os.path.getsize(f'models/textures/{ID}.webp') // 1024, 'KB', flush=True)
