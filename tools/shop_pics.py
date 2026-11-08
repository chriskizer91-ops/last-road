"""The Outfitter's little pictures: each item's model as rendered beside its sheet (models/assets/<ID>/<object>_view_three-quarter.png),
cut to the thing itself, square, 96 px, as WebP, into src/lr-shop.js (window.LR_SHOPPICS, keyed 'ID/object').
usage: python3 tools/shop_pics.py ID/object ..."""
import sys, io, base64, json
import numpy as np
from PIL import Image
out = {}
for key in sys.argv[1:]:
    ID, ob = key.split('/'); im = Image.open(f'models/assets/{ID}/{ob}_view_three-quarter.png').convert('RGB'); a = np.asarray(im).astype(int)
    bg = a[2, 2]; m = np.abs(a - bg).sum(2) > 24; ys, xs = np.where(m)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max(); cx, cy, s = (x0 + x1) / 2, (y0 + y1) / 2, max(x1 - x0, y1 - y0) * 1.12 / 2
    c = im.crop((int(cx - s), int(cy - s), int(cx + s), int(cy + s))).resize((96, 96), Image.LANCZOS)
    b = io.BytesIO(); c.save(b, 'WEBP', quality=80, method=6); out[key] = base64.b64encode(b.getvalue()).decode()
open('src/lr-shop.js', 'w').write('/* the Outfitter\'s pictures of its gear (tools/shop_pics.py) */\nwindow.LR_SHOPPICS=' + json.dumps(out) + ';\n')
print(len(out), 'pictures,', sum(len(v) for v in out.values()) * 3 // 4 // 1024, 'KB')
