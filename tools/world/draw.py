import numpy as np, sys, json
from PIL import Image, ImageDraw, ImageFont
W, N, OUT = sys.argv[1], int(sys.argv[2]), sys.argv[3]
H = np.fromfile(W + '/h.bin', np.float32).reshape(N, N); Wt = np.fromfile(W + '/w.bin', np.float32).reshape(N, N, 5); C = np.fromfile(W + '/c.bin', np.uint8).reshape(N, N)
M = json.load(open(W + '/marks.json')); HALF = M['H']
gy, gx = np.gradient(H); cell = 2 * HALF / N; sh = np.clip(.75 + (-gx * .7 - gy * .5) / cell * 4, .35, 1.4)
col = np.zeros((N, N, 3)) + np.array([150, 100, 60])
import os
GM = np.fromfile(W + '/g.bin', np.uint8).reshape(N, N) if os.path.exists(W + '/g.bin') else np.full((N, N), 40, np.uint8)
RK = np.where((GM == 38)[..., None], np.array([62, 58, 58]), np.where((GM == 39)[..., None], np.array([168, 132, 112]), np.array([150, 90, 70])))
for k, c in [(0, [176, 150, 80]), (2, [214, 120, 50]), (3, [235, 232, 225]), (1, RK)]: col = col * (1 - Wt[..., k:k + 1]) + np.array(c) * Wt[..., k:k + 1]
col *= sh[..., None]; col[C == 7] = [60, 110, 170]
GAME = OUT.endswith('.js')  # the game's own big map (src/lr-wmap.js): 512 square, the road and strips drawn in, no words
S = 512 if GAME else 900; im = Image.fromarray(col.clip(0, 255).astype(np.uint8)).resize((S, S), Image.BILINEAR); d = ImageDraw.Draw(im)
F = ImageFont.truetype('/usr/share/fonts/truetype/google-fonts/Poppins-Medium.ttf', 13)
P = lambda x, z: ((x + HALF) / (2 * HALF) * S, (z + HALF) / (2 * HALF) * S)
d.line([P(x, z) for x, z in M['road']], fill=(30, 30, 34), width=2 if GAME else 3)
if GAME:
    import io, base64
    for s in M['strips']:
        a = P(s['x'] - s['dx'] * s['len'] / 2, s['z'] - s['dz'] * s['len'] / 2); b = P(s['x'] + s['dx'] * s['len'] / 2, s['z'] + s['dz'] * s['len'] / 2)
        d.line([a, b], fill=(255, 255, 255), width=2)
    B = io.BytesIO(); im.save(B, 'WEBP', quality=82, method=6)
    open(OUT, 'w').write('/* the world from above, for the big map (tools/world/gamemap.sh): 64 km square, north up */\nwindow.LR_WMAP=' + json.dumps(base64.b64encode(B.getvalue()).decode()) + ';\n')
    print('wrote', OUT, len(B.getvalue()) // 1024, 'KB'); sys.exit(0)
for s in M['strips']:
    a = P(s['x'] - s['dx'] * s['len'] / 2, s['z'] - s['dz'] * s['len'] / 2); b = P(s['x'] + s['dx'] * s['len'] / 2, s['z'] + s['dz'] * s['len'] / 2)
    d.line([a, b], fill=(255, 255, 255), width=4); x, y = P(s['x'], s['z']); d.text((x + 6, y - 8), s['n'], fill=(255, 255, 255), font=F, stroke_width=2, stroke_fill=(0, 0, 0))
d.text((8, S - 22), 'Ground Truth: the world from above (64 km square; north up)', fill=(255, 255, 255), font=F, stroke_width=2, stroke_fill=(0, 0, 0))
im.save(OUT); print('wrote', OUT)
