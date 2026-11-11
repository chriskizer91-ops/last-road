"""The combined game's test run: open a build in the test browser (software graphics), wait for its title, load the
helpers (the plane's rt-test.js and rt-fly-test.js, Ground Truth's lr-test.js), then do the steps in a file, one a line:

    js: <an expression, run in the page; its answer is printed (cut to CUT characters)>
    shot: <name>            a picture, saved as <SHOTS>/<TAG>_<name>.png
    wait: <seconds>
    click: <css selector>
    key: <a key, e.g. KeyC>
    until: <seconds> | <an expression that turns true>     waits, printing how long it took

usage: python3 tools/test/gtc-run.py <page.html> <TAG> l|m <steps file>
env: SMP (salt-mini-plus, for the plane's test helpers; default combined/plane has none, so ../salt-mini-plus),
     SHOTS (default /tmp/gtc-shots/), CUT (default 400).
Frame rates mean nothing here (no graphics card); distances, speeds, triangle counts and page errors do."""
import asyncio, sys, time, json, os
from playwright.async_api import async_playwright
URL, TAG, MOBILE, STEPS = sys.argv[1], sys.argv[2], sys.argv[3] == 'm', sys.argv[4]
if '://' not in URL: URL = 'file://' + os.path.abspath(URL)
HERE = os.path.dirname(os.path.abspath(__file__))
SMP = os.environ.get('SMP', os.path.join(HERE, '..', '..', '..', 'salt-mini-plus')); SH = os.environ.get('SHOTS', '/tmp/gtc-shots/')
CUT = int(os.environ.get('CUT', '400'))
JS = ''
for f in (SMP + '/redtail/game/rt-test.js', SMP + '/redtail/game/rt-fly-test.js', os.path.join(HERE, 'lr-test.js')):
    if os.path.exists(f): JS += open(f, encoding='utf-8').read() + '\n'
async def main():
    os.makedirs(SH, exist_ok=True)
    steps = [l.strip() for l in open(STEPS, encoding='utf-8').read().split('\n') if l.strip() and not l.strip().startswith('#')]
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 915, 'height': 412} if MOBILE else {'width': 1280, 'height': 720}, device_scale_factor=1, has_touch=MOBILE)
        pg = await ctx.new_page(); logs = []
        pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300]) if m.type in ('error', 'warning') and 'ReadPixels' not in m.text else None)
        pg.on('pageerror', lambda e: logs.append('PAGEERR: ' + str(e)[:500]))
        t0 = time.time(); await pg.goto(URL); st = 'x'
        for i in range(400):
            await asyncio.sleep(1)
            st = await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}")
            if st == 'menu' and i > 8: break
        print('opened in', round(time.time() - t0), 's, state', st, flush=True)
        if JS: await pg.evaluate(JS)
        for s in steps:
            k, _, v = s.partition(':'); v = v.strip(); t1 = time.time()
            try:
                if k == 'wait': await asyncio.sleep(float(v)); continue
                if k == 'shot': await pg.screenshot(path=SH + TAG + '_' + v + '.png', timeout=300000); print('shot', v, round(time.time() - t0), flush=True); continue
                if k == 'click': await pg.click(v, timeout=20000); await asyncio.sleep(1); print('click', v, flush=True); continue
                if k == 'key': await pg.keyboard.press(v); await asyncio.sleep(.5); print('key', v, flush=True); continue
                if k == 'until':
                    secs, _, ex = v.partition('|'); ok = False
                    for i in range(int(float(secs))):
                        if await pg.evaluate('()=>{try{return !!(' + ex.strip() + ')}catch(e){return false}}'): ok = True; break
                        await asyncio.sleep(1)
                    print('until', ex.strip()[:60], 'yes' if ok else 'NO', round(time.time() - t1), 's', flush=True); continue
                r = await pg.evaluate('async()=>{const r=await (' + v + ');return r===undefined?null:r}')
                print('js', v[:70], '->', json.dumps(r)[:CUT], round(time.time() - t0), flush=True)
            except Exception as e: print('FAIL', s[:80], '::', str(e)[:300].replace('\n', ' '), flush=True)
        print('page errors and warnings:', len(logs)); print('\n'.join(logs[:8]))
        await br.close()
asyncio.run(main())
