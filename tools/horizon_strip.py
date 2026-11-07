"""The painted mountains round the edge of the world, as one picture for the sky: his twelve horizon layers
(models/horizon/, made by tools/horizon.py: south I01-I03, east I04-I06, north I07-I09, west I10-I12; near, middle,
far) laid round the compass, each side a quarter turn with a short blend at the corners, the far layer behind the
middle behind the near, each further one hazier (toward a day's haze; the game dims it with the light) and lower.
x: the compass, 0 at north, clockwise (east a quarter of the way); y: from 2.5 degrees below level (bottom) to 9.5
above (top). Writes models/horizon/strip.webp (4096 x 512, see-through sky).  usage: python3 tools/horizon_strip.py"""
import numpy as np
from PIL import Image
W, H, EL0, EL1 = 4096, 512, -2.5, 9.5
SIDES = {0: ['I09', 'I08', 'I07'], 90: ['I06', 'I05', 'I04'], 180: ['I03', 'I02', 'I01'], 270: ['I12', 'I11', 'I10']}  # far, middle, near
COPIES = [4, 3, 3]        # each side's quarter turn holds this many copies of the layer's picture (the nearer, the wider each)
SCALE = [.9, .72, .52]     # each layer's height: the share of its picture's own shape (1 = not squashed)
HAZE = [.55, .32, .12]; HAZEC = np.array([.74, .80, .88])
BASE = [-1.2, -1.8, -2.5]  # where each layer's bottom sits (degrees)
L = {k: np.asarray(Image.open(f'models/horizon/{k}.webp').convert('RGBA'), np.float64) / 255 for s in SIDES.values() for k in s}
az = (np.arange(W) + .5) / W * 360; el = EL1 - (np.arange(H) + .5) / H * (EL1 - EL0)
out = np.zeros((H, W, 4))
for li in range(3):
    acc = np.zeros((H, W, 4)); wsum = np.zeros(W)
    for c, names in SIDES.items():
        im = L[names[li]]; ih, iw = im.shape[:2]
        d = (az - c + 180) % 360 - 180                     # degrees from this side's middle
        w = np.clip((52.5 - np.abs(d)) / 15, 0, 1)        # its share: whole within 37.5, blended to the next by 52.5
        n = COPIES[li]; span = 90 / n; f = (d + 45) / span; k = np.floor(f)
        fr = f - k; fr = np.where(k % 2 == 1, 1 - fr, fr)  # (every other copy mirrored, so the repeat shows less)
        ux = fr * (iw - 1)
        deg_px = iw / span; vtop = BASE[li] + ih / deg_px * SCALE[li]   # its top, in degrees
        vy = (vtop - el) / (vtop - BASE[li]) * ih          # picture row for each elevation
        X = np.clip(ux.astype(int), 0, iw - 1); Y = np.clip(vy.astype(int), 0, ih - 1)
        samp = im[Y[:, None], X[None, :]]; inside = ((vy >= 0) & (vy < ih))[:, None, None]
        samp = samp * inside
        acc += samp * w[None, :, None]; wsum += w
    acc /= np.maximum(wsum, 1e-6)[None, :, None]
    rgb = acc[..., :3] * (1 - HAZE[li]) + HAZEC * HAZE[li]; a = acc[..., 3:4]
    out[..., :3] = rgb * a + out[..., :3] * (1 - a); out[..., 3:4] = a + out[..., 3:4] * (1 - a)
# (what's below a layer's bottom edge: the nearest layer carried down, so there's never sky under the mountains)
for y in range(H):
    if el[y] < BASE[2] + .3: out[y] = out[y - 1] if y else out[y]
Image.fromarray((out * 255).clip(0, 255).astype(np.uint8), 'RGBA').save('models/horizon/strip.webp', 'WEBP', quality=86)
pv = Image.new('RGB', (W // 2, H // 2), (110, 160, 220)); pv.paste(Image.open('models/horizon/strip.webp').resize((W // 2, H // 2)), (0, 0), Image.open('models/horizon/strip.webp').resize((W // 2, H // 2)))
pv.save('docs/horizon/strip-preview.webp', 'WEBP', quality=80); print('ok')
