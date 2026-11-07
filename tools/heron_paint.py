"""The Heron's paint from his picture A06 (the plane's markings and wear, drawn on the plane paint template):
1. the plane's lettering "Wayfarer" on each side of the cowl painted out (filled from the olive round it) and
   "Heron" written in its place, in the same cream, slanted;
2. the view names ("TOP", "UNDERSIDE") inside the views painted out with the backdrop grey;
3. the sheet cut into its five views as the template lays them out (pictures/templates/plane-paint-template.json),
   named for salt-mini-plus redtail/tools/livery.py, which lays them onto the plane.
usage (from last-road's top): python3 tools/heron_paint.py, then in salt-mini-plus:
  python3 redtail/tools/livery.py ../last-road/models/heron/paint/pictures heron ../last-road/models/heron/paint/redtail-2-heron"""
import glob, json
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
im = Image.open(glob.glob('/home/claude/imgs/raw/*/A06-*.png')[0]).convert('RGB'); a = np.asarray(im).copy()
T = json.load(open('pictures/templates/plane-paint-template.json'))
FONT = '/usr/share/fonts/truetype/google-fonts/Lora-Italic-Variable.ttf'
for (x0, y0, x1, y1) in [(166, 169, 228, 192), (1306, 169, 1369, 192)]:
    reg = a[y0:y1, x0:x1].astype(np.float64); lum = reg.mean(2); sat = reg.max(2) - reg.min(2)
    m = ((lum > 150) & (sat < 70)).astype(np.uint8); m = cv2.dilate(m, np.ones((3, 3), np.uint8))
    cream = np.median(reg[(lum > 175) & (sat < 60)], 0) if ((lum > 175) & (sat < 60)).any() else np.array([225, 215, 185])
    full = np.zeros(a.shape[:2], np.uint8); full[y0:y1, x0:x1] = m
    a = cv2.inpaint(a, full, 4, cv2.INPAINT_TELEA)
    # (Heron, drawn big and shrunk for clean edges)
    S = 8; W, H = (x1 - x0) * S, (y1 - y0) * S; t = Image.new('L', (W, H), 0); d = ImageDraw.Draw(t)
    f = ImageFont.truetype(FONT, int(H * .82)); f.set_variation_by_axes([700])
    bb = d.textbbox((0, 0), 'Heron', font=f); tw, th = bb[2] - bb[0], bb[3] - bb[1]
    d.text(((W - tw) / 2 - bb[0], (H - th) / 2 - bb[1]), 'Heron', font=f, fill=255)
    al = np.asarray(t.resize((x1 - x0, y1 - y0), Image.LANCZOS), np.float64)[..., None] / 255 * .92
    a[y0:y1, x0:x1] = (a[y0:y1, x0:x1] * (1 - al) + cream * al).astype(np.uint8)
# (the view names inside the views: the backdrop's grey)
bgc = np.median(a[5:25, 700:840].reshape(-1, 3), 0).astype(np.uint8)
for (x0, y0, x1, y1) in [(8, 352, 80, 375), (776, 352, 900, 375)]: a[y0:y1, x0:x1] = bgc
Image.fromarray(a).save('models/heron/paint/A06-heron.png')
names = {'LEFT SIDE': 'left-side', 'RIGHT SIDE': 'right-side', 'TOP': 'top', 'UNDERSIDE': 'underside', 'FRONT': 'front'}
for k, v in T['views'].items():
    Image.fromarray(a[v['y']:v['y'] + v['h'], v['x']:v['x'] + v['w']]).save(f'models/heron/paint/pictures/heron_{names[k]}.png')
print('ok')
