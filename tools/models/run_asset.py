"""One picture through the model builder: the helper (Opus, through Christopher's key) reads the sheet and writes the
model; it's built (build.mjs), unwrapped and shaded (unwrap.py, Blender), painted from the sheet (project.py), photographed
(render.py, compare.py); the helper looks at the result and fixes it (up to ROUNDS times).
usage: python3 tools/models/run_asset.py <ID> [budget] [picture size]   (from last-road's top; writes models/assets/<ID>/)"""
import sys, os, re, json, subprocess, csv, time
ID = sys.argv[1]; BUDGET = int(sys.argv[2]) if len(sys.argv) > 2 else 30000; RES = int(sys.argv[3]) if len(sys.argv) > 3 else 1024
ROUNDS = int(os.environ.get('ROUNDS', 1)); EFF = os.environ.get('EFFORT', 'xhigh'); MODEL = os.environ.get('MODEL', 'claude-opus-5-5')
H = os.path.dirname(os.path.abspath(__file__)); BL = '/home/claude/bl/bin/python'; ASK = '/home/claude/scripts/ask.py'
P = {x['id']: x for b in json.load(open('design/picture-prompts.json')).values() for x in b}[ID]
REF = f'pictures/ref/{next(f for f in os.listdir("pictures/ref") if f.startswith(ID + "-"))}'
from PIL import Image
W, Hh = Image.open(REF).size; D = f'models/assets/{ID}'; os.makedirs(D, exist_ok=True)
SHEET = os.path.join(D, 'sheet.png'); Image.open(REF).convert('RGB').save(SHEET)
log = open(os.path.join(D, 'log.txt'), 'a')
def say(*a): s = ' '.join(str(x) for x in a); print(f'[{ID}] {s}', flush=True); log.write(s + '\n'); log.flush()
def ask(prompt, out, imgs):
    pf = out + '.prompt.md'; open(pf, 'w').write(prompt)
    r = subprocess.run(['python3', ASK, MODEL, EFF, pf, out, '-'] + imgs, capture_output=True, text=True, env=dict(os.environ, MAXTOK=os.environ.get('MAXTOK', '96000')))
    say('helper:', (r.stdout.strip() or r.stderr.strip()[-300:])); return open(out).read() if os.path.exists(out) else ''
def blocks(txt, lang): return re.findall(r'```' + lang + r'\s*\n(.*?)```', txt, re.S)
def make():
    t0 = time.time()
    r = subprocess.run(['node', os.path.join(H, 'build.mjs'), os.path.join(D, 'model.js'), D], capture_output=True, text=True)
    if r.returncode: say('build failed:', r.stderr[-600:]); return None
    st = json.loads(r.stdout.strip().split('\n')[-1]); say('built', st)
    subprocess.run([BL, os.path.join(H, 'unwrap.py'), D, str(RES), '16'], capture_output=True, text=True)
    r = subprocess.run(['python3', os.path.join(H, 'project.py'), D, SHEET, os.path.join(D, 'views.json'), str(RES)], capture_output=True, text=True)
    if r.returncode: say('paint failed:', r.stderr[-600:]); return None
    subprocess.run([BL, os.path.join(H, 'render.py'), D, SHEET, '400'], capture_output=True, text=True)
    subprocess.run(['python3', os.path.join(H, 'compare.py'), D, SHEET, os.path.join(D, 'compare.png')], capture_output=True, text=True)
    fit = json.load(open(os.path.join(D, 'fit.json'))); say('painted', {o: {k: v.get('iou') for k, v in f.items() if k != 'texels'} for o, f in fit.items()}, f'{time.time()-t0:.0f}s')
    return st, fit
fill = lambda s: s.replace('{ID}', ID).replace('{TITLE}', P['title']).replace('{LAYOUT}', P['lay']).replace('{WHY}', P['why']).replace('{W}', str(W)).replace('{H}', str(Hh)).replace('{BUDGET}', f'{BUDGET:,}')
if not os.path.exists(os.path.join(D, 'model.js')):
    txt = ask(fill(open(os.path.join(H, 'prompt_build.md')).read()), os.path.join(D, 'helper-build.md'), [REF])
    j, js = blocks(txt, 'json'), blocks(txt, 'js')
    if not j or not js: say('no model in the answer'); sys.exit(1)
    open(os.path.join(D, 'views.json'), 'w').write(j[0]); open(os.path.join(D, 'model.js'), 'w').write(js[0])
res = make()
for rnd in range(ROUNDS):
    if not res: break
    st, fit = res
    pr = fill(open(os.path.join(H, 'prompt_review.md')).read()).replace('{FITS}', json.dumps({o: {k: v for k, v in f.items() if k != 'texels'} for o, f in fit.items()})).replace('{STATS}', json.dumps(st)) \
        .replace('{VIEWS}', open(os.path.join(D, 'views.json')).read()).replace('{CODE}', open(os.path.join(D, 'model.js')).read())
    txt = ask(pr, os.path.join(D, f'helper-review{rnd + 1}.md'), [REF, os.path.join(D, 'compare.png')])
    if 'NO CHANGES' in txt and not blocks(txt, 'js'): say('review: no changes'); break
    os.makedirs(os.path.join(D, f'round{rnd}'), exist_ok=True)
    for f in ('model.js', 'views.json', 'compare.png', 'fit.json'): os.replace(os.path.join(D, f), os.path.join(D, f'round{rnd}', f)) if os.path.exists(os.path.join(D, f)) else None
    j, js = blocks(txt, 'json'), blocks(txt, 'js')
    open(os.path.join(D, 'views.json'), 'w').write(j[0] if j else open(os.path.join(D, f'round{rnd}', 'views.json')).read())
    open(os.path.join(D, 'model.js'), 'w').write(js[0] if js else open(os.path.join(D, f'round{rnd}', 'model.js')).read())
    res = make()
say('done')
