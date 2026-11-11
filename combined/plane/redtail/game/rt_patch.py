"""Puts the Redtail into a built Salt & Sand (or Ice & Snow): python3 rt_patch.py in.html out.html [rt2-data.js]
Exact text swaps (each must match once, so a changed game fails loudly rather than quietly), plus two scripts:
the plane's data (redtail-2's pieces and baked pictures) before the game's script, the plane's code (rt-game.js)
inside it, just before the boot."""
import sys
src, dst = sys.argv[1], sys.argv[2]
data = sys.argv[3] if len(sys.argv) > 3 else 'redtail/game/rt2-data.js'
s = open(src).read()
def swap(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, f'expected {n} of: {old[:90]!r}, found {c}'
    s = s.replace(old, new)
# 1. the game's vertex shader hands on the texture coordinates (meshes without them read 0)
swap('layout(location=3) in float aMat;\nlayout(location=5) in vec4 iA;', 'layout(location=3) in float aMat;layout(location=4) in vec2 aUV;\nlayout(location=5) in vec4 iA;')
swap('out vec3 vP;out vec3 vN;out vec4 vC;out float vMat;out vec3 vL;out vec4 vCur;out vec4 vPrev;\nvoid main(){\n  vec3 w,pw;',
     'out vec3 vP;out vec3 vN;out vec4 vC;out float vMat;out vec3 vL;out vec4 vCur;out vec4 vPrev;out vec2 vUV;\nvoid main(){\n  vec3 w,pw;vUV=aUV;')
# 2. the fragment shader: the Redtail's three baked pictures, and its material (120)
swap('in vec3 vP;in vec3 vN;in vec4 vC;in float vMat;in vec3 vL;in vec4 vCur;in vec4 vPrev;\nlayout(location=0) out vec4 oCol;',
     'in vec3 vP;in vec3 vN;in vec4 vC;in float vMat;in vec3 vL;in vec4 vCur;in vec4 vPrev;in vec2 vUV;\nuniform sampler2D uRTa;uniform sampler2D uRTn;uniform sampler2D uRTo;\nlayout(location=0) out vec4 oCol;')
swap('  else if(m>=40){\n    vec2 wp=Pw.xz;ground=true;',
     '''  /* the Redtail (redtail-2): its colour (the patina and the crevices' shade baked in), roughness and metal from its
     pictures, its surface detail from the normal map (the frame from the pixel's own derivatives: no tangents needed) */
  else if(m==120){
    alb=pow(texture(uRTa,vUV).rgb,vec3(2.2));vec3 O=texture(uRTo,vUV).rgb;float rg=clamp(O.g,.05,1.);metal=O.b;
    shin=max(2./(rg*rg)-2.,1.);spec=mix(.5,1.,metal);
    vec3 tn=texture(uRTn,vUV).xyz*2.-1.;tn.y=-tn.y;
    vec3 q1=dFdx(vP),q2=dFdy(vP);vec2 t1=dFdx(vUV),t2=dFdy(vUV);vec3 q2p=cross(q2,N),q1p=cross(N,q1);
    vec3 Tt=q2p*t1.x+q1p*t2.x,Bt=q2p*t1.y+q1p*t2.y;float im=inversesqrt(max(max(dot(Tt,Tt),dot(Bt,Bt)),1e-20));
    vec3 Nn=mat3(Tt*im,Bt*im,N)*tn;if(dot(Nn,Nn)>1e-8)N=normalize(Nn);}
  else if(m>=40){
    vec2 wp=Pw.xz;ground=true;''')
# 3. the bay's button: out in the Redtail (Drive ▶ is the car)
swap('<button class="btn go sm" id="sasDrive" type="button">Drive ▶</button>',
     '<button class="btn sm" id="rtFly" type="button">✈ Redtail</button><button class="btn go sm" id="sasDrive" type="button">Drive ▶</button>')
swap("const carLabel=()=>carName({car:APP.car})", "const carLabel=()=>GAME.car&&GAME.car.rt?'Redtail':carName({car:APP.car})")
# 4. the plane's code, inside the game's script, before the boot
code = open('redtail/game/rt-game.js').read().replace('/*@@FLY@@*/', open('redtail/game/rt-fly.js').read())
code += '''{const b=$('rtFly'),d=$('sasDrive');
  if(b)b.addEventListener('click',()=>{b.blur();rtFly(true);showFull(false);closeMenu();});
  if(d)d.addEventListener('click',()=>{if(RT.want)rtFly(false);});}
'''
swap('/* =====================================================================================\n   THE BOOT:', code + '\n/* =====================================================================================\n   THE BOOT:')
# 5. its data, before the game's script
i = s.find('<script>'); assert i > 0
import base64, json
paints = {k: base64.b64encode(open(f'redtail/versions/redtail-2/paint/redtail-2-{k}.webp', 'rb').read()).decode() for k in ('yellow-black', 'wilderness-olive')}
s = s[:i] + '<script>' + open(data).read() + 'RT2_DATA.paints=' + json.dumps(paints) + ';</script>\n' + s[i:]
open(dst, 'w').write(s)
print('ok', dst, round(len(s) / 1e6, 2), 'MB')
