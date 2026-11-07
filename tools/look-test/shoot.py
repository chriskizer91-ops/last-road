"""Pictures of the look test: every version from the same cameras, in a headless Chrome at a phone's landscape size.
usage: python3 tools/look-test/shoot.py <page.html> <out-dir>   (writes <cam>_<version>.png and stats.json)"""
import asyncio, sys, json, base64, os
from playwright.async_api import async_playwright
PAGE, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
VERS = os.environ.get('VERS', 'studio2,t50000_s2,t25000_s2,t10000_s2').split(',')
SHOTS0 = [('chase', {'scene': 'road', 'cam': 'chase'}), ('wheel', {'scene': 'road', 'cam': 'wheel'}), ('track', {'scene': 'road', 'cam': 'track'}),
         ('close', {'scene': 'studio', 'view': 'wheel'})]
SHOTS = [s for s in SHOTS0 if s[0] in os.environ.get('CAMS', 'chase,wheel,track,close').split(',')]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1200, 'height': 540}, device_scale_factor=1)
        pg.on('console', lambda m: print('  page:', m.text) if m.type == 'error' else None)
        await pg.goto('file://' + os.path.abspath(PAGE) + '?shots=1', timeout=180000)
        await pg.wait_for_function('window.VIEWER', timeout=180000)
        st = {}
        for v in VERS:
            for name, o in SHOTS:
                o = dict(o, v=v)
                await pg.evaluate('async o => { await VIEWER.set(o); VIEWER.hold(true); }', o)
                await pg.wait_for_timeout(400)
                url = await pg.evaluate('() => VIEWER.snap()')
                open(f'{OUT}/{name}_{v}.png', 'wb').write(base64.b64decode(url.split(',', 1)[1]))
                st[v] = await pg.evaluate('() => VIEWER.stats()'); print(name, v, st[v]['A'], flush=True)
                await pg.evaluate('() => VIEWER.hold(false)')
        json.dump(st, open(f'{OUT}/stats.json', 'w'), indent=1)
        await b.close()
asyncio.run(main())
