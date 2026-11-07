"""The compare sheet: the reference picture on top, each object's four renders under it, labelled.
usage: python3 compare.py <model dir> <sheet.png> <out.png>"""
import sys, os, json
from PIL import Image, ImageDraw, ImageFont
D, SH, OUT = sys.argv[1:4]; F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
names = json.load(open(os.path.join(D, 'renders.json')))['objects']; W = 1440
sh = Image.open(SH).convert('RGB'); sh = sh.resize((W, int(sh.height * W / sh.width)))
tw = W // 4; th = int(tw * .75); H = sh.height + len(names) * (th + 24) + 6
g = Image.new('RGB', (W, H), (235, 235, 232)); g.paste(sh, (0, 0)); d = ImageDraw.Draw(g)
for i, n in enumerate(names):
    y = sh.height + 6 + i * (th + 24); d.text((6, y + 2), f'{n}: the model, painted from the picture', fill=(30, 30, 30), font=F)
    for j, v in enumerate(['front', 'right', 'top', 'three-quarter']):
        p = os.path.join(D, f'{n}_view_{v}.png')
        if os.path.exists(p): g.paste(Image.open(p).convert('RGB').resize((tw - 4, th)), (j * tw + 2, y + 22))
g.save(OUT); print(OUT, g.size)
