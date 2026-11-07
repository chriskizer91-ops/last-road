import numpy as np, sys, json
from PIL import Image, ImageDraw, ImageFont
W, N, OUT = sys.argv[1], int(sys.argv[2]), sys.argv[3]
H = np.fromfile(W + '/h.bin', np.float32).reshape(N, N); Wt = np.fromfile(W + '/w.bin', np.float32).reshape(N, N, 5); C = np.fromfile(W + '/c.bin', np.uint8).reshape(N, N)
M = json.load(open(W + '/marks.json')); HALF = M['H']
gy, gx = np.gradient(H); cell = 2 * HALF / N; sh = np.clip(.75 + (-gx * .7 - gy * .5) / cell * 4, .35, 1.4)
col = np.zeros((N, N, 3)) + np.array([150, 100, 60])
for k, c in [(0, [176, 150, 80]), (2, [214, 120, 50]), (3, [235, 232, 225]), (1, [150, 90, 70])]: col = col * (1 - Wt[..., k:k + 1]) + np.array(c) * Wt[..., k:k + 1]
col *= sh[..., None]; col[C == 7] = [60, 110, 170]
S = 900; im = Image.fromarray(col.clip(0, 255).astype(np.uint8)).resize((S, S), Image.BILINEAR); d = ImageDraw.Draw(im)
F = ImageFont.truetype('/usr/share/fonts/truetype/google-fonts/Poppins-Medium.ttf', 13)
P = lambda x, z: ((x + HALF) / (2 * HALF) * S, (z + HALF) / (2 * HALF) * S)
d.line([P(x, z) for x, z in M['road']], fill=(30, 30, 34), width=3)
for s in M['strips']:
    a = P(s['x'] - s['dx'] * s['len'] / 2, s['z'] - s['dz'] * s['len'] / 2); b = P(s['x'] + s['dx'] * s['len'] / 2, s['z'] + s['dz'] * s['len'] / 2)
    d.line([a, b], fill=(255, 255, 255), width=4); x, y = P(s['x'], s['z']); d.text((x + 6, y - 8), s['n'], fill=(255, 255, 255), font=F, stroke_width=2, stroke_fill=(0, 0, 0))
d.text((8, S - 22), 'Ground Truth: the world from above (64 km square; north up)', fill=(255, 255, 255), font=F, stroke_width=2, stroke_fill=(0, 0, 0))
im.save(OUT); print('wrote', OUT)
