"""The Rock & Mud's paint template (as the Redtail's in salt-mini-plus redtail/paint-template): the Studio 2 straight on
from five sides (left, right, top, front, back), each at a known scale, on one 1536 x 1024 sheet (ChatGPT's landscape
size), drawn orthographically from the look-test page. ChatGPT repaints the sheet; because each view's scale and place
are known, the paint can be laid back onto the model. Writes pictures/templates/rock-mud-paint-template.png and .json.
usage: python3 tools/paint-template/rock-mud-template.py   (from last-road's top, after tools/look-test/build.sh)"""
import asyncio, json, base64, io, os
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont
PAGE = 'file://' + os.path.abspath('docs/look-test/rock-mud-look-test.html') + '?shots=1&scene=studio&v=studio2'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1400, 'height': 700}, device_scale_factor=1)
        await pg.goto(PAGE, timeout=180000); await pg.wait_for_function('window.VIEWER', timeout=180000)
        await pg.evaluate("async()=>{await VIEWER.set({scene:'studio',v:'studio2',lights:0});VIEWER.hold(true);}")
        box = await pg.evaluate("""async()=>{const T=VIEWER.THREE,c=await VIEWER.build('studio2'),B=new T.Box3().setFromObject(c.root);
          VIEWER.scene.traverse(o=>{if(o.isMesh&&o.material&&o.material.isShadowMaterial)o.visible=false;if(o.isMesh&&o.geometry&&o.geometry.type==='PlaneGeometry'&&o.material&&o.material.transparent)o.visible=false;
            if(o.isDirectionalLight){o.castShadow=false;}});return [B.min.x,B.max.x,B.min.y,B.max.y,B.min.z,B.max.z];}""")
        X0, X1, Y0, Y1, Z0, Z1 = [round(v, 3) for v in box]; m = .08
        X0 -= m; X1 += m; Y0 -= m; Y1 += m; Z0 -= m; Z1 += m
        C = [(X0 + X1) / 2, (Y0 + Y1) / 2, (Z0 + Z1) / 2]
        L, H, W = X1 - X0, Y1 - Y0, Z1 - Z0
        s1 = int(700 / L); s2 = int(min(640 / L, 300 / W)); s3 = int(min(300 / W, 330 / H))
        V = {'LEFT SIDE': dict(cam=[0, 0, -1], up=[0, 1, 0], s=s1, ext=(L, H)), 'RIGHT SIDE': dict(cam=[0, 0, 1], up=[0, 1, 0], s=s1, ext=(L, H)),
             'TOP': dict(cam=[0, 1, 0], up=[0, 0, -1], s=s2, ext=(L, W)), 'FRONT': dict(cam=[1, 0, 0], up=[0, 1, 0], s=s3, ext=(W, H)),
             'BACK': dict(cam=[-1, 0, 0], up=[0, 1, 0], s=s3, ext=(W, H))}
        shots = {}
        for n, v in V.items():
            w, h = round(v['ext'][0] * v['s']), round(v['ext'][1] * v['s'])
            url = await pg.evaluate(f"""()=>{{const T=VIEWER.THREE,r=VIEWER.renderer,e=[{v['ext'][0]},{v['ext'][1]}],d={v['cam']},u={v['up']},C={C};
              const cam=new T.OrthographicCamera(-e[0]/2,e[0]/2,e[1]/2,-e[1]/2,.1,100);cam.position.set(C[0]+30*d[0],C[1]+30*d[1],C[2]+30*d[2]);cam.up.set(...u);cam.lookAt(C[0],C[1],C[2]);
              VIEWER.scene.traverse(o=>{{if(o.isDirectionalLight&&o.castShadow===false&&o.intensity>1){{o.position.set(C[0]+30*d[0]+4*u[0]+3,C[1]+30*d[1]+4*u[1]+6,C[2]+30*d[2]+4*u[2]);o.target.position.set(C[0],C[1],C[2]);o.target.updateMatrixWorld();}}}});
              const bg=VIEWER.scene.background;VIEWER.scene.background=new T.Color('#e4e6ea');r.setSize({w},{h},false);r.render(VIEWER.scene,cam);const out=r.domElement.toDataURL('image/png');VIEWER.scene.background=bg;return out;}}""")
            im = Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGB'); shots[n] = (im, w, h); print(n, w, h, flush=True)
        await b.close()
    sheet = Image.new('RGB', (1536, 1024), (228, 230, 234)); d = ImageDraw.Draw(sheet)
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
    wS, hS = shots['LEFT SIDE'][1:]; wT, hT = shots['TOP'][1:]; wF, hF = shots['FRONT'][1:]
    yb = 40 + hS + 60
    at = {'LEFT SIDE': (40, 40), 'RIGHT SIDE': (1536 - 40 - wS, 40), 'TOP': (40, yb + (hF - hT) // 2),
          'FRONT': (1536 - 40 - 2 * wF - 50, yb), 'BACK': (1536 - 40 - wF, yb)}
    info = {'sheet': [1536, 1024], 'box': [X0, X1, Y0, Y1, Z0, Z1], 'views': {}}
    for n, (im, w, h) in shots.items():
        x, y = at[n]; sheet.paste(im, (x, y)); d.text((x + 4, y + h + 4), n, fill=(110, 116, 126), font=F)
        info['views'][n] = {'x': x, 'y': y, 'w': w, 'h': h, 'scale': V[n]['s'], 'cam': V[n]['cam'], 'up': V[n]['up']}
    sheet.save('pictures/templates/rock-mud-paint-template.png'); json.dump(info, open('pictures/templates/rock-mud-paint-template.json', 'w'), indent=1)
    print('sheet ok', info['box'])
asyncio.run(main())
