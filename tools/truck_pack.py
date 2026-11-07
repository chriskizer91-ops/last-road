"""The Rock & Mud's play model (a bake-out folder of salt-mini-plus models/tools/bake.py) packed for the game, the way the
Redtail's redtail-2 is (salt-mini-plus redtail/game/glb2js.py): window.LR_TRUCK = {pieces:{body,wheel}, tex:{a,n,o}}.
- body: the skin (material 120, the baked look), the glass (the game's own glass materials, solid: there's no cabin)
  and the dark underside (16), one mesh; wheel: the wheel (120), drawn four times by the game.
- Each piece: positions, normals, picture coordinates (as the game uploads pictures, the top row first), indices.
- One picture set for the whole truck (an atlas 2048 x 3072: the body's 2048 square on top, the wheel's 1024 under it
  on the left), as the plane's three: a colour with the shade in it (sRGB), the surface detail as a tangent-space
  normal map, and roughness (G) and metal (B). Phones load them at half size (1024): his pick, Nov 7 2026.
usage: python3 tools/truck_pack.py <bake-out dir> <out.js> [paint.png (a new colour picture for the skin, 2048)]"""
import sys, os, io, json, base64
import numpy as np
from PIL import Image
D, OUT = sys.argv[1], sys.argv[2]; PAINT = sys.argv[3] if len(sys.argv) > 3 else None
W, H, SK, WH = 2048, 3072, 2048, 1024
b64 = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
def raw(name, uv):
    r = np.fromfile(os.path.join(D, name + '.bin'), dtype=np.float32); k = 10 if uv else 8; n = len(r) // k
    P = r[:n * 3].reshape(-1, 3); N = r[n * 3:n * 6].reshape(-1, 3); o = n * 6
    U = r[o:o + n * 2].reshape(-1, 2) if uv else np.zeros((n, 2), np.float32); o += n * 2 if uv else 0
    G = r[o:o + n].astype(np.int32); GM = r[o + n:o + 2 * n].astype(np.int32)
    return P, N, U, G, GM
def atlas_uv(U, region):
    s, t = U[:, 0].copy(), 1 - U[:, 1]
    return np.c_[s * SK / W, t * SK / H] if region == 'skin' else np.c_[s * WH / W, (SK + t * WH) / H]
def piece(lst):
    P = np.concatenate([a[0] for a in lst]); N = np.concatenate([a[1] for a in lst]); U = np.concatenate([a[2] for a in lst]); M = np.concatenate([a[3] for a in lst])
    N = N / (np.linalg.norm(N, axis=1, keepdims=True) + 1e-9)
    key = np.c_[np.round(P * 2e4), np.round(N * 512), np.round(U * 65535), M].astype(np.int64)
    uq, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.ravel()
    first = np.zeros(len(uq), np.int64); first[inv[::-1]] = np.arange(len(inv))[::-1]
    i32 = len(uq) > 65535
    return {'pos': b64(P[first].astype(np.float32)), 'nrm': b64(N[first].astype(np.float32)), 'uv': b64(U[first].astype(np.float32)),
            'mat': b64(M[first].astype(np.uint8)), 'idx': b64(inv.astype(np.uint32 if i32 else np.uint16)), 'i32': bool(i32), 'n': int(len(inv)), 'v': int(len(uq))}
P, N, U, G, GM = raw('skin', True); body = [(P, N, atlas_uv(U, 'skin'), np.full(len(P), 120))]
P, N, U, G, GM = raw('glass', False); body.append((P, N, np.zeros((len(P), 2), np.float32), GM))
P, N, U, G, GM = raw('under', False); body.append((P, N, np.zeros((len(P), 2), np.float32), np.full(len(P), 16)))
P, N, U, G, GM = raw('wheel', True); wheel = [(P, N, atlas_uv(U, 'wheel'), np.full(len(P), 120))]
pieces = {'body': piece(body), 'wheel': piece(wheel)}
L = lambda n: Image.open(os.path.join(D, n + '.png'))
g = lambda n: np.asarray(L(n).convert('L'), np.float32) / 255
def put(dst, skin, wheel): dst.paste(skin.resize((SK, SK), Image.LANCZOS), (0, 0)); dst.paste(wheel.resize((WH, WH), Image.LANCZOS), (0, SK)); return dst
def albedo(tag, src=None):
    # (the colour with the shade in it, gently, as the plane's: .72 + .28 x the occlusion)
    c = np.asarray((Image.open(src) if src else L(tag + '_col')).convert('RGB').resize((SK, SK) if tag == 'skin' else (WH, WH)), np.float32) / 255
    ao = np.asarray(L(tag + '_ao').convert('L').resize(c.shape[1::-1]), np.float32)[..., None] / 255
    return Image.fromarray((c * (.72 + .28 * ao) * 255 + .5).clip(0, 255).astype(np.uint8), 'RGB')
def orm(tag): return Image.fromarray((np.stack([g(tag + '_ao'), g(tag + '_rough'), g(tag + '_metal')], -1) * 255 + .5).clip(0, 255).astype(np.uint8), 'RGB')
a = put(Image.new('RGB', (W, H), (20, 20, 20)), albedo('skin', PAINT), albedo('wheel'))
n = put(Image.new('RGB', (W, H), (128, 128, 255)), L('skin_tnrm').convert('RGB'), L('wheel_tnrm').convert('RGB'))
o = put(Image.new('RGB', (W, H), (255, 200, 0)), orm('skin'), orm('wheel'))
def webp(im, q): b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6); return base64.b64encode(b.getvalue()).decode()
tex = {'a': webp(a, 86), 'n': webp(n, 90), 'o': webp(o, 84)}
D2 = json.load(open(os.path.join(D, 'bake.json'))); lod = json.load(open(os.path.join(D, 'lod.json'))) if os.path.exists(os.path.join(D, 'lod.json')) else {}
js = ('/* THE ROCK & MUD\'S PLAY MODEL, packed by last-road tools/truck_pack.py from its bake (the Studio 2 baked onto the game\'s\n'
      '   own shape cut down to ' + str(lod.get('total', '?')) + ' triangles). window.LR_TRUCK. */\n'
      'window.LR_TRUCK=' + json.dumps({'pieces': pieces, 'tex': tex, 'tris': int(sum(p['n'] for p in pieces.values()) // 3 - pieces['wheel']['n'] // 3 + 4 * (pieces['wheel']['n'] // 3)), 'D': D2['D']}) + ';\n')
open(OUT, 'w').write(js)
print({k: (v['n'] // 3, v['v']) for k, v in pieces.items()}, 'tex KB', {k: len(v) * 3 // 4 // 1024 for k, v in tex.items()}, 'file MB', round(len(js) / 1e6, 2))
