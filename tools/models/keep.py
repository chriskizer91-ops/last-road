"""What the repo keeps of each finished model (its log ends "done"): the pictures as WebP (the painted colour, the
colour with its crevice shading, the crevice shading; the compare sheet smaller), beside the model's code, views,
unwrapped OBJ, fits and the helpers' replies. The PNG working copies, the plain OBJ (made again from model.js by
build.mjs) and the earlier rounds stay out of git (.gitignore). usage: python3 tools/models/keep.py  (from last-road's top)"""
import os, glob
from PIL import Image
for D in sorted(glob.glob('models/assets/*/')):
    log = open(D + 'log.txt').read() if os.path.exists(D + 'log.txt') else ''
    if 'done' not in log.strip().splitlines()[-1:][0] if log.strip() else True: continue
    n = 0
    for f in glob.glob(D + '*_albedo.png') + glob.glob(D + '*_albedo_ao.png') + glob.glob(D + '*_ao.png'):
        w = f[:-4] + '.webp'
        if not os.path.exists(w) or os.path.getmtime(w) < os.path.getmtime(f): Image.open(f).save(w, 'WEBP', quality=90, method=6); n += 1
    c = D + 'compare.png'
    if os.path.exists(c) and (not os.path.exists(D + 'compare.webp') or os.path.getmtime(D + 'compare.webp') < os.path.getmtime(c)):
        im = Image.open(c).convert('RGB'); im.thumbnail((1440, 4000)); im.save(D + 'compare.webp', 'WEBP', quality=80); n += 1
    print(D, n, 'pictures kept as WebP')
