"""His seven people pictures cut to the radio card: head and shoulders (the ID label at the bottom falls outside the
cut), 512 px square, plus a 128 px one for the small card on the phone. Writes models/portraits/<ID>.webp and
<ID>-small.webp.  usage: python3 tools/portraits.py J01 ... (from last-road's top)"""
import sys, glob
from PIL import Image
for ID in sys.argv[1:]:
    im = Image.open(glob.glob(f'/home/claude/imgs/raw/*/{ID}-*.png')[0]).convert('RGB'); w, h = im.size
    s = int(w * .8); x = (w - s) // 2; y = int(h * .02); c = im.crop((x, y, x + s, y + s))
    c.resize((512, 512), Image.LANCZOS).save(f'models/portraits/{ID}.webp', 'WEBP', quality=86)
    c.resize((128, 128), Image.LANCZOS).save(f'models/portraits/{ID}-small.webp', 'WEBP', quality=86); print(ID)
