"""Beyond the Last Road's first page: Salt & Sand with the plane (salt-mini-plus redtail/game/rt_patch.py's output) made
this game's own. Exact text swaps (each must match exactly as many times as said, so a changed page fails loudly), the
truck's data before the game's script, src/lr-game.js just before the boot.
usage: python3 src/lr_patch.py <salt-and-sand + plane.html> <out.html> <truck data .js>"""
import sys
src, dst, data = sys.argv[1:4]
s = open(src, encoding='utf-8').read()
def swap(old, new, n=1):
    global s
    c = s.count(old); assert c == n, f'expected {n} of: {old[:100]!r}, found {c}'; s = s.replace(old, new)
# its own name, and its own saves (Salt & Sand's are left alone)
swap('<title>Redline County: Salt &amp; Sand (Studio 2)</title>', '<title>Beyond the Last Road (working title)</title>')
swap("localStorage.getItem('sas:'+k)", "localStorage.getItem('lr:'+k)"); swap("localStorage.setItem('sas:'+k,", "localStorage.setItem('lr:'+k,"); swap("localStorage.removeItem('sas:'+k)", "localStorage.removeItem('lr:'+k)")
# the truck is the Rock & Mud
swap("const CAR_STOCK={suv:'stock',", "const CAR_STOCK={suv:'crawler',")
# your Rock & Mud drawn as its play model (the Studio 2 path skipped for it), its pictures bound with the car's uniforms
swap("if(t===GAME.car&&!far){const S2=s2For(t.bi),k=s2Key(t.bi);", "if(t===GAME.car&&!far&&!LR_PLAY(t)){const S2=s2For(t.bi),k=s2Key(t.bi);")
swap("const i=t.bi,b=t.build,u=CUR.u,M0=carMatrix(t);let Mb=M0,T=far?truckFar(i):truck(i);", "const i=t.bi,b=t.build,u=CUR.u,M0=carMatrix(t);let Mb=M0,T=far?truckFar(i):truck(i);const LRP=!far&&LR_PLAY(t);if(LRP)T=lrT(T);")
swap("  if(!depth){carUniformsW(t,v,dirt);gl.uniform1f(u.uMudLocal,1);gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uPrevOn,1);}\n  const fx=D.X(D.uFa)",
     "  if(!depth){carUniformsW(t,v,dirt);gl.uniform1f(u.uMudLocal,1);gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uPrevOn,1);if(LRP)lrBind();}\n  const fx=D.X(D.uFa)")
# the plane's HUD: no car lights (TC, ABS, ESC) and no gear
swap("for(const [s,v,col] of C){txt3(s,x,yc,v?col:pack(70,64,86));x+=tw3(s)+5;}", "for(const [s,v,col] of (t.rt?[]:C)){txt3(s,x,yc,v?col:pack(70,64,86));x+=tw3(s)+5;}")
swap("const g=t.rev?'R':pt.shiftT>0?'-':String(pt.gear);otxt5(g,", "const g=t.rt?'':t.rev?'R':pt.shiftT>0?'-':String(pt.gear);otxt5(g,")
# the plane is the Heron in this game (his pick, Nov 7 2026): its button, its name on the HUD, its call on arrival
swap('id="rtFly" type="button">\u2708 Redtail</button>', 'id="rtFly" type="button">\u2708 Heron</button>')
swap("const carLabel=()=>GAME.car&&GAME.car.rt?'Redtail':", "const carLabel=()=>GAME.car&&GAME.car.rt?'Heron':")
swap("if(RT.want)say('THE REDTAIL',2);", "if(RT.want)say('THE HERON',2);")
swap("{id:'redtail',name:'Redtail',gov:0,", "{id:'redtail',name:'Heron',gov:0,")
# laptops start on Low (his rule for the laptop, and what he expects from Salt & Sand); a phone still starts on Mobile.
# A tier picked in the menu still holds for the start it makes, and ?quality= still picks one
swap("const GFX_START=matchMedia('(pointer: coarse)').matches?'mobile':'high';", "const GFX_START=matchMedia('(pointer: coarse)').matches?'mobile':'low';")
# THE GROUND IN HIS PICTURES: his textures (tools/texpack.py -> src/lr-texpack.js) in the engine's texture pack, one
# per ground surface (each line of TEXPACK swapped whole); a new surface, SAND, for the Dune Sea's orange sand (Salt &
# Sand's white gypsum keeps its shape and ripples, now in his sand's colour and picture); and the pictures' own colour
# at 85% (the engine's default is half its own ground colours)
import json as _j, re as _re
TP = _j.loads(open(sys.path[0] + '/lr-texpack.js', encoding='utf-8').read().split('window.LR_TEXPACK=', 1)[1].rstrip().rstrip(';'))
lay = lambda L: '{id:"%s",t:"%s",m:[%s],scale:%s,has:true,src:"%s"}' % (L['id'], L['t'], ', '.join('%.4f' % v for v in L['m']), L['scale'], L['src'])
for t, L in TP.items():
    if t == 'SAND': continue
    m = _re.findall(r'\{id:"[a-z_0-9]+",t:"%s",m:\[[^\]]*\],scale:[0-9.]+,has:false,src:""\}' % t, s)
    assert len(m) == 1, t
    swap(m[0], lay(L))
swap('{id:"clay_track",t:"CLAYTRACK",m:[0.5, 0.5, 0.5],scale:3,has:false,src:""}\n]};', '{id:"clay_track",t:"CLAYTRACK",m:[0.5, 0.5, 0.5],scale:3,has:false,src:""},\n' + lay(TP['SAND']) + '\n]};')
swap("'SALT','BRICK','STUCCO','FORECOURT','PAINT','CLAYTRACK'];", "'SALT','BRICK','STUCCO','FORECOURT','PAINT','CLAYTRACK','SAND'];")
sm = TP['SAND']['m']
swap("if(dw>.004){vec3 sd=vec3(.80,.77,.70)*(.9+.12*vn(wp*.012)+.05*vn(wp*.37));", "if(dw>.004){vec3 sd=vec3(%.3f,%.3f,%.3f)*(.9+.12*vn(wp*.012)+.05*vn(wp*.37));" % tuple(sm))
swap("alb=mix(alb,sd,dw);gw*=1.-dw;rw*=1.-dw;}", "sd=photoG(sd,T_SAND,wp);alb=mix(alb,sd,dw);gw*=1.-dw;rw*=1.-dw;}")
swap("tex:1,texcol:.5,", "tex:1,texcol:.85,")
# THE WORLD: Ground Truth's own land (src/gt-world.js) inside the engine's world generator, asked first, as Salt &
# Sand's dunes were: core (the land at a point), baseAt (under a ribbon), the chunks' own things (Last Road, the
# runway, trees), the place names, and the start (on Last Road at Roadhead, heading east). No Highway 40.
swap("const DUNES=true;", "const DUNES=true,GT=true;")
swap("if(DUNES)return j===0&&Math.abs(x)<HALF-800?3:0;", "if(GT)return 0;if(DUNES)return j===0&&Math.abs(x)<HALF-800?3:0;")
swap("function core(x,z,ctx,o){\n  if(DUNES)return duneCore(x,z,o);", open(sys.path[0] + '/gt-propbox.js', encoding='utf-8').read() + open(sys.path[0] + '/gt-world.js', encoding='utf-8').read() + "\nfunction core(x,z,ctx,o){\n  if(GT)return gtCore(x,z,o);if(DUNES)return duneCore(x,z,o);")
swap("function baseAt(x,z){\n  if(DUNES)return rimAt(x,z);", "function baseAt(x,z){\n  if(GT)return gtBase(x,z);if(DUNES)return rimAt(x,z);")
swap("if(DUNES){let bb=[0,1e9,0,CH,-1e9,CH];", "if(GT)gtStatic(x0,z0,x1,z1,RB,inC,cols,trees,R);if(DUNES){let bb=[0,1e9,0,CH,-1e9,CH];")
swap("props:null,trees:new Float32Array(0),cols", "props:null,trees:new Float32Array(trees),cols")
swap("return {L,HALF,CH,FT,ROAD_END,", "return {gtPlace,GTT:GT_TSH,GTV0:GT_TV0,GTS:GT_STRIPS,GTR:GT_ROAD,GTP:GT_PROPS,GTB:GT_PROPBOX,GX,GZ,gtRegions,L,HALF,CH,FT,ROAD_END,")
swap("if(DYB.dunes)return Math.abs(z)<6?'Highway 40':z<0?'The salt flats':'The white sands';", "if(WG.gtPlace)return WG.gtPlace(x,z);if(DYB.dunes)return Math.abs(z)<6?'Highway 40':z<0?'The salt flats':'The white sands';")
swap("const HOME=[0,1.9,0];", "const HOME=(()=>{const R=WG.GTR,s=R.len-2300;let i=0;while(i<R.S.length-2&&R.S[i+1]<s)i++;const a=R.P[i],b=R.P[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]),dx=(b[0]-a[0])/l,dz=(b[1]-a[1])/l;\n  return [a[0]-dz*1.9,a[1]+dx*1.9,Math.atan2(-dz,dx)];})();")
# THE DISTANT LAND (src/lr-game.js lrDist*): drawn after the far tiles; the camera sees as far as it reaches (its far
# plane, and the land's fade into the fog); the fog of each time of day thinned to about a seventh
swap("if(t.marks){drawMesh(t.marks);tris+=t.marks.tris;}}\n    if(u.uFarDrop)gl.uniform4f(u.uFarDrop,0,0,0,0);}", "if(t.marks){drawMesh(t.marks);tris+=t.marks.tris;}}\n    tris+=lrDistDraw(u,e,F);\n    if(u.uFarDrop)gl.uniform4f(u.uFarDrop,0,0,0,0);}")
swap("far=Math.max(1500,WORLD.farR+600),", "far=Math.max(1500,WORLD.farR+600,LRD_FAR()+3000),")
swap("const worldFar=()=>SKY.night&&SKY.draw?Math.min(SKY.draw,Math.max(WORLD.near,WORLD.farR)):Math.max(WORLD.near,WORLD.farR);", "const worldFar=()=>SKY.night&&SKY.draw?Math.min(SKY.draw,Math.max(WORLD.near,WORLD.farR,LRD_FAR()*.4)):Math.max(WORLD.near,WORLD.farR,LRD_FAR());")
swap("fogCol:[.6,.7,.88],fogDen:.0011,fogFall:.02,", "fogCol:[.6,.7,.88],fogDen:.00016,fogFall:.004,")
swap("fogCol:[.46,.39,.34],fogDen:.0008,fogFall:.025,", "fogCol:[.46,.39,.34],fogDen:.00013,fogFall:.004,")
swap("fogCol:[.03,.04,.07],fogDen:.0017,fogFall:.03,", "fogCol:[.03,.04,.07],fogDen:.0005,fogFall:.006,")
# HIS MODELS IN THE WORLD (src/lr-game.js lrProps*): drawn after the chunks' own buildings, and into the sun's shadow
swap("let tp=0;for(const c of vis)if(c.st&&c.st.props&&c.vd<propD+40){atM(u,c.x0,0,c.z0);drawMesh(c.st.props);tp+=c.st.props.tris;}", "let tp=0;for(const c of vis)if(c.st&&c.st.props&&c.vd<propD+40){atM(u,c.x0,0,c.z0);drawMesh(c.st.props);tp+=c.st.props.tris;}\n  tp+=lrPropsDraw(u,e,F,probe);tp+=lraDraw(u,e,F,probe);")
swap("gl.uniformMatrix4fv(u.uM,false,W_ID);\n  return tris+(DEVW.off.trees?0:drawTreeList(", "tris+=lrPropsShadow(u,F,e,maxD);\n  gl.uniformMatrix4fv(u.uM,false,W_ID);\n  return tris+(DEVW.off.trees?0:drawTreeList(")
# THE TRUCK AND THE HERON (src/lr-game.js lrPark*, lrSwap): the one you're not in, drawn where it waits, and into the shadows
swap("let tris=drawWorldCar(GAME.car,GAME.voice,GAME.dirt,false,false);", "let tris=drawWorldCar(GAME.car,GAME.voice,GAME.dirt,false,false);lrSwapUI();tris+=lrParkedDraw(c.eye);tris+=lrHandsDraw();")
swap("if(kind!=='hl')one(GAME.car,k>=1);", "if(kind!=='hl')one(GAME.car,k>=1);if(kind!=='hl'&&lrParked())one(lrParked(),true);")
# THE PAINTED EDGE (src/lr-game.js lrSkyBind): the sky shader looks his mountain strip up by compass and height
swap("const SKY_FS=G.FRAME+G.NOISE+G.PACK+SKYFN+`\nin vec2 vT;layout(location=0) out vec4 oCol;", "const SKY_FS=G.FRAME+G.NOISE+G.PACK+SKYFN+`\nin vec2 vT;layout(location=0) out vec4 oCol;uniform sampler2D uHorz;uniform vec4 uHz;")
swap("vec3 c=rutSky(d,true);\n  /* the haze toward the horizon: the fog, as far as the eye sees it */\n  if(uStudio<.5){float fogT=exp(-uFogDen*900.*saturate(1.0-d.y*2.));c=c*mix(1.0,fogT,.85)+hazeCol(d)*(1.0-fogT)*.85;}",
     "vec3 c=rutSky(d,true);\n  /* the haze toward the horizon: the fog, as far as the eye sees it */\n  if(uStudio<.5){float fogT=exp(-uFogDen*900.*saturate(1.0-d.y*2.));c=c*mix(1.0,fogT,.85)+hazeCol(d)*(1.0-fogT)*.85;}\n"
     "#ifndef PROBE\n  /* (Ground Truth) the painted mountains round the world's edge */\n  if(uHz.z>.5&&uStudio<.5){float el=asin(clamp(d.y,-1.,1.)),v=(el-uHz.x)/(uHz.y-uHz.x);\n"
     "    if(v>0.&&v<1.){float az=atan(d.x,-d.z);vec4 h=textureLod(uHorz,vec2(az*.15915494,1.-v),0.);\n"
     "      vec3 L=uAmbUp*.9+uSunCol*.16,hc=mix(h.rgb*L,hazeCol(d),.2);c=mix(c,hc,h.a);}}\n#endif")
swap("const Ps = G.use(this.P.sky);\n      G.set(Ps, U);\n      G.fullscreen();", "const Ps = G.use(this.P.sky);\n      G.set(Ps, U);\n      if (typeof lrSkyBind !== 'undefined') lrSkyBind(G, Ps);\n      G.fullscreen();")
# THE FAR TILES' CLIFFS: rock where the land is steep (as the near ground has it), so cliffs and canyon walls show
# as rock from far off too (not the ground's colour)
swap("  let v=0;const I=[];\n  const put=(i,j,dy)=>{const b=(j+1)*nb+i+1,k=j*n+i,hx=Hh[b-1]-Hh[b+1],hz=Hh[b-nb]-Hh[b+nb],l=Math.hypot(hx,2*st,hz);",
     "  if(GT)for(let j=0;j<n;j++)for(let i=0;i<n;i++){const b=(j+1)*nb+i+1,k=j*n+i,hx=Hh[b-1]-Hh[b+1],hz=Hh[b-nb]-Hh[b+nb],ny=2*st/Math.hypot(hx,2*st,hz),sl=Math.sqrt(Math.max(0,1-ny*ny))/Math.max(ny,.05),rs=sst(.55,1.,sl)*(Wt[k*4]<0||Wt[k*4+2]<0?.6:1);\n"
     "    if(rs>Wt[k*4+1]){Wt[k*4+1]=rs;if(Wt[k*4]>0)Wt[k*4]*=1-rs*.8;}}\n"
     "  let v=0;const I=[];\n  const put=(i,j,dy)=>{const b=(j+1)*nb+i+1,k=j*n+i,hx=Hh[b-1]-Hh[b+1],hz=Hh[b-nb]-Hh[b+nb],l=Math.hypot(hx,2*st,hz);")
# THE PEOPLE AND THE JOBS (src/lr-game.js gtPeople, gtJobs): Ground Truth's in place of City Limits'; the steps land
# and foot; on foot, it's where you stand that counts; their faces in the dialog
swap("const JOB_NAMES={};", "if(typeof WG!=='undefined'&&WG.gtPlace){for(const k of Object.keys(PEOPLE))delete PEOPLE[k];Object.assign(PEOPLE,gtPeople());}\nconst JOB_NAMES={};")
swap("const JOBS=buildJobs();", "const JOBS=(typeof WG!=='undefined'&&WG.gtPlace)?gtJobs():buildJobs();")
swap("function jobStep(dt,car){\n  const x=car.p[0],z=car.p[2],slow=car.speed<3.5,A=jActive();", "function jobStep(dt,car){\n  const x=LRW.on?LRW.p[0]:car.p[0],z=LRW.on?LRW.p[2]:car.p[2],slow=LRW.on||car.speed<3.5,A=jActive();")
swap("  if(s.t==='goto'||s.t==='deliver')return {x:s.x,z:s.z,name:s.name,r:s.r||10};", "  if(s.t==='goto'||s.t==='deliver'||s.t==='foot')return {x:s.x,z:s.z,name:s.name,r:s.r||10};\n  if(s.t==='land'){const S=WG.GTS[s.strip];return {x:S.x,z:S.z,name:S.name+' strip',r:Math.min(60,S.len/2)};}")
swap("    else if(s.t==='medals')ok=chMedalCount().reduce((p,q)=>p+q,0)>=s.n;", "    else if(s.t==='land')ok=!!car.rt&&!LRW.on&&car.speed<2&&lrStripAt(car.p[0],car.p[2],30)===s.strip;\n    else if(s.t==='foot')ok=LRW.on&&Math.hypot(LRW.p[0]-s.x,LRW.p[2]-s.z)<(s.r||12);\n    else if(s.t==='medals')ok=chMedalCount().reduce((p,q)=>p+q,0)>=s.n;")
swap("  $('jdEyebrow').textContent=(p?p.name+' · ':'')+o.eyebrow;", "  {let f=$('jdFace');if(!f){f=document.createElement('img');f.id='jdFace';f.alt='';f.style.cssText='width:76px;height:76px;border-radius:12px;float:left;margin:2px 14px 8px 0;object-fit:cover;box-shadow:0 2px 10px rgba(0,0,0,.4)';$('jdEyebrow').parentNode.insertBefore(f,$('jdEyebrow'));}f.hidden=!(p&&p.img);if(p&&p.img)f.src=p.img;}\n  $('jdEyebrow').textContent=(p?p.name+' · ':'')+o.eyebrow;")
# (Salt & Sand leaves the town's jobs out each frame; Ground Truth's run: the job you're on, anyone with work beside you)
swap("else if(!DYB.dunes){lapStep(dt,t);runStep(dt,t);parkStep(dt,t);chalStep(dt,t,ev);}}", "else if(!DYB.dunes){lapStep(dt,t);runStep(dt,t);parkStep(dt,t);chalStep(dt,t,ev);}else if(WG.gtPlace){jobStep(dt,t);syncObj();}}")
# (on foot the picture's near edge comes in close, for your hands)
swap("function sasNear(){\n  if(APP.orbit)return .3;", "function sasNear(){\n  if(LRW.on)return .1;if(APP.orbit)return .3;")
# the code, just before the boot (after the plane's); the truck's data before the game's script (beside the plane's)
B = "/* =====================================================================================\n   THE BOOT: the dots"
# his plants and rocks (lr-game.js: LRF): each drawn in its own picture, each kind only out to its own reach; the
# plane's material (120) also as 121, its picture tinted by the instance's colour
swap("const m=TREES.shapes[v][far?1:l];instBind(", "const m=TREES.shapes[v][far?1:l];if(m.tx)lrTreeTex(m.tx);instBind(")
swap("const v=T[o+7]|0,l=nearOnly||d2<nn?0:1,cn=L.cnt[v];", "const v=T[o+7]|0;if(d2>LRF.D2[v]*(GFX.level==='mobile'?.45:1))continue;const l=v>=7?(d2<Math.min(nn,GFX.level==='mobile'?1600:3600)?0:1):nearOnly||d2<nn?0:1,cn=L.cnt[v];")
swap("  else if(m==120){\n    alb=pow(texture(uRTa,vUV).rgb,vec3(2.2));", "  else if(m==120||m==121){\n    alb=pow(texture(uRTa,vUV).rgb,vec3(2.2));if(m==121)alb*=vC.rgb;")
swap(B, open(sys.path[0] + '/lr-game.js', encoding='utf-8').read() + '\n' + B)
i = s.index('<script>window.RT2_DATA') if '<script>window.RT2_DATA' in s else None
assert i is not None, 'the plane data script'
import base64, os, json
HERON = os.path.join(sys.path[0], '..', 'models/heron/paint/redtail-2-heron.webp')
heron = 'window.LR_HERON_PAINT=' + repr(base64.b64encode(open(HERON, 'rb').read()).decode()) + ';\n' + open(os.path.join(sys.path[0], 'lr-props.js'), encoding='utf-8').read() + 'window.LR_FACES=' + json.dumps({k: base64.b64encode(open(os.path.join(sys.path[0], '..', f'models/portraits/{k}.webp'), 'rb').read()).decode() for k in ['J01','J02','J03','J04','J05','J06','J07']}) + ';\n' + 'window.LR_HORZ=' + repr(base64.b64encode(open(os.path.join(sys.path[0], '..', 'models/horizon/strip.webp'), 'rb').read()).decode()) + ';\n'
s = s[:i] + '<script>' + open(data, encoding='utf-8').read() + '\n' + heron + '</script>\n' + s[i:]
open(dst, 'w', encoding='utf-8').write(s)
print('written', dst, len(s))
