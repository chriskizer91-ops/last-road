"""Beyond the Last Road's test run (salt-mini-plus redtail/game/rt-run.py with this game's helpers): python3 tools/test/lr-run.py file.html TAG m|l test,...
extra tests: L:<LRT_T call>, e.g. L:truck()
tests: fly, ready, rest, accel, brake, turn, pose:x_z_yaw_mph, cam:Name, look:ex_ey_ez_ax_ay_az_fov (body frame),
shot:name, wait:s, bench:n, car, plane"""
import asyncio, sys, time, json
from playwright.async_api import async_playwright
URL, TAG, MOBILE = sys.argv[1], sys.argv[2], sys.argv[3] == 'm'
TESTS = sys.argv[4].split(',') if len(sys.argv) > 4 else []
import os
SMP = os.environ.get('SMP', '/home/claude/salt-mini-plus'); SH = os.environ.get('SHOTS', '/tmp/lr-shots/')
JS = open(SMP + '/redtail/game/rt-test.js').read() + '\n' + open(SMP + '/redtail/game/rt-fly-test.js').read() + '\n' + open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lr-test.js')).read()
BENCH = """(n)=>{const D=__dyb,g=__game.gl,ts=[];D.setTestInput({steer:0,thr:0,brk:1,hb:0,nos:false});
  for(let i=0;i<n;i++){const a=performance.now();D.render(1/60);g.readPixels(0,0,1,1,g.RGBA,g.UNSIGNED_BYTE,new Uint8Array(4));ts.push(performance.now()-a);}
  ts.sort((a,b)=>a-b);return {median:+ts[Math.floor(n/2)].toFixed(0),min:+ts[0].toFixed(0),n,tris:__dyb.GLC?undefined:0};}"""
async def main():
    import os; os.makedirs(SH, exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 915, 'height': 412} if MOBILE else {'width': 1280, 'height': 720}, device_scale_factor=1, has_touch=MOBILE)
        pg = await ctx.new_page(); logs = []
        pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:400])); pg.on('pageerror', lambda e: logs.append('PAGEERR: ' + str(e)[:600]))
        t0 = time.time(); await pg.goto(URL)
        for i in range(150):
            await asyncio.sleep(1)
            st = await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}")
            if st == 'menu' and i > 8: break
        print('loaded', round(time.time() - t0), st, flush=True)
        errs = [l for l in logs if 'PAGEERR' in l or l.startswith('error')]
        if errs: print('\n'.join(errs[:8]), flush=True)
        await pg.evaluate(JS)
        for t in TESTS:
            try:
                if t.startswith('wait:'): await asyncio.sleep(float(t[5:])); continue
                if t.startswith('shot:'):
                    await pg.screenshot(path=SH + f'{TAG}_{t[5:]}.png'); print('shot', t[5:], json.dumps(await pg.evaluate("()=>RTT.info()")), flush=True); continue
                if t.startswith('bench'): print('bench', await pg.evaluate(BENCH, int(t[5:] or 6)), flush=True); continue
                if t == 'fly': r = await pg.evaluate("()=>RTT.fly()")
                elif t.startswith('click:'):
                    await pg.click('#' + t[6:]); await asyncio.sleep(1); r = await pg.evaluate('()=>({paint:__rt2.RT.paint,texP:!!__rt2.RT.texP})')
                elif t == 'live': r = await pg.evaluate('()=>{__dyb.setTestInput(null);return 1;}')
                elif t.startswith('drag:'):
                    dx, dy = [float(q) for q in t[5:].split('_')]; c = await pg.evaluate('()=>RTF_T.stickTest()')
                    await pg.mouse.move(c['x'], c['y']); await pg.mouse.down(); await pg.mouse.move(c['x'] + dx, c['y'] + dy, steps=4); await asyncio.sleep(2.5)
                    r = await pg.evaluate('()=>({stick:__rt2.RTI.stick,ctl:__rt2.RTF.ctl,ui:RTF_T.stickTest()})'); await pg.screenshot(path=SH + f'{TAG}_drag.png'); await pg.mouse.up(); await asyncio.sleep(1)
                    r['afterRelease'] = await pg.evaluate('()=>__rt2.RTI.stick')
                elif t.startswith('gas:'):
                    b = await pg.evaluate("()=>{const r=document.getElementById('tGas').getBoundingClientRect();return {x:r.left+r.width/2,top:r.top,h:r.height};}")
                    y = b['top'] + b['h'] * (1 - float(t[4:]) * .82); await pg.mouse.move(b['x'], y); await pg.mouse.down(); await asyncio.sleep(3); await pg.mouse.up(); await asyncio.sleep(1.5)
                    r = await pg.evaluate("()=>({lever:+__rt2.RTI.lev.toFixed(2),fill:document.querySelector('#tGas i').style.height,rpm:Math.round(__rt2.RT.eng.rpm)})")
                elif t.startswith('clip:'):
                    r = await pg.evaluate('async()=>await RTF_T.clip("' + t[5:] + '")'); import base64 as B
                    open(SH + f'{TAG}_clip_{t[5:]}.webm', 'wb').write(B.b64decode(r.pop('b64')))
                elif t.startswith('F:'): r = await pg.evaluate('()=>RTF_T.' + t[2:].replace('_', ','))
                elif t.startswith('L:'): r = await pg.evaluate('()=>LRT_T.' + t[2:].replace('_', ','))
                elif t.startswith('click:#'): await pg.click(t[6:]); await asyncio.sleep(1.5); r = await pg.evaluate('()=>LRT_T.truck()')
                elif t == 'ready':
                    for i in range(60):
                        await asyncio.sleep(1); r = await pg.evaluate("()=>RTT.ready()")
                        if r.get('tex') == 3: break
                else: r = await pg.evaluate("(n)=>RTT.run(n)", t)
                print(t, json.dumps(r), round(time.time() - t0), flush=True)
            except Exception as e: print('FAIL', t, str(e)[:500], flush=True)
        errs = [l for l in logs if 'PAGEERR' in l or l.startswith('error') or 'warn' in l[:5]]
        print('--- errors/warnings:'); print('\n'.join(errs[-12:]))
        await br.close()
asyncio.run(main())
