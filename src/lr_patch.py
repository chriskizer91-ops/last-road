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
    if t in ('SAND', 'BASALT', 'GRANITE'): continue
    m = _re.findall(r'\{id:"[a-z_0-9]+",t:"%s",m:\[[^\]]*\],scale:[0-9.]+,has:false,src:""\}' % t, s)
    assert len(m) == 1, t
    swap(m[0], lay(L))
NEWL = ('SAND', 'BASALT', 'GRANITE')
swap('{id:"clay_track",t:"CLAYTRACK",m:[0.5, 0.5, 0.5],scale:3,has:false,src:""}\n]};', '{id:"clay_track",t:"CLAYTRACK",m:[0.5, 0.5, 0.5],scale:3,has:false,src:""},\n' + ',\n'.join(lay(TP[k]) for k in NEWL) + '\n]};')
swap("'SALT','BRICK','STUCCO','FORECOURT','PAINT','CLAYTRACK'];", "'SALT','BRICK','STUCCO','FORECOURT','PAINT','CLAYTRACK','SAND','BASALT','GRANITE'];")
# each region's own rock (gt-world.js's o.gm, per point of the ground): 38 the Black Range's basalt (H19), 39 the
# kopjes' granite (H11), 40 the rest (sandstone, H15); numbered next to each other, so where two meet the ground's
# material steps from one to the other across a triangle with nothing else between
swap("const Hb=new Float64Array(nb*nb),code=new Uint8Array(n*n),", "const Hb=new Float64Array(nb*nb),GMv=new Uint8Array(n*n).fill(40),code=new Uint8Array(n*n),")
swap("wet[k]=o.wet;wl[k]=o.wl;\n", "wet[k]=o.wet;wl[k]=o.wl;GMv[k]=o.gm||40;\n")
swap("C[v*4]=Wt[k*4];C[v*4+1]=Wt[k*4+1];C[v*4+2]=Wt[k*4+2];C[v*4+3]=Wt[k*4+3];return v++;};\n  for(let j=0;j<n;j++)for(let i=0;i<n;i++)put(i,j,0);\n  /* a track's corner",
     "C[v*4]=Wt[k*4];C[v*4+1]=Wt[k*4+1];C[v*4+2]=Wt[k*4+2];C[v*4+3]=Wt[k*4+3];M[v]=GMv[k];return v++;};\n  for(let j=0;j<n;j++)for(let i=0;i<n;i++)put(i,j,0);\n  /* a track's corner")
swap("Hh=new Float64Array((n+2)*(n+2)),Wt=new Float32Array(n*n*4);\n  const nb=n+2;", "Hh=new Float64Array((n+2)*(n+2)),Wt=new Float32Array(n*n*4),GMf=new Uint8Array(n*n).fill(40);\n  const nb=n+2;")
swap("Wt[k*4+2]=o.salt>.02?-o.salt:o.mud*.5;Wt[k*4+3]=1-wd*.5;}}", "Wt[k*4+2]=o.salt>.02?-o.salt:o.mud*.5;Wt[k*4+3]=1-wd*.5;GMf[k]=o.gm||40;}}")
swap("C[v*4]=Wt[k*4];C[v*4+1]=Wt[k*4+1];C[v*4+2]=Wt[k*4+2];C[v*4+3]=Wt[k*4+3];return v++;};\n  for(let j=0;j<n;j++)for(let i=0;i<n;i++)put(i,j,0);\n  for(let j=0;j<n-1;j++)",
     "C[v*4]=Wt[k*4];C[v*4+1]=Wt[k*4+1];C[v*4+2]=Wt[k*4+2];C[v*4+3]=Wt[k*4+3];M[v]=GMf[k];return v++;};\n  for(let j=0;j<n;j++)for(let i=0;i<n;i++)put(i,j,0);\n  for(let j=0;j<n-1;j++)")
swap("  else if(m>=40){\n    vec2 wp=Pw.xz;ground=true;\n    if(m==40){", "  else if(m>=38){\n    vec2 wp=Pw.xz;ground=true;\n    if(m<=40){")
swap("if(rw>.004){alb=mix(alb,photoTri(rockCol(Pw),T_ROCK,Pw,N),rw);", "if(rw>.004){alb=mix(alb,(m==38?.6:1.)*photoTri(rockCol(Pw),m==38?T_BASALT:m==39?T_GRANITE:T_ROCK,Pw,N),rw);")
swap("float por=m==40||", "float por=m==40||m==38||m==39||")
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
     "      vec3 L=uAmbUp*.9+uSunCol*.16,hc=mix(h.rgb*L,hazeCol(d),.2+.75*uHz.w);c=mix(c,hc,h.a);}}\n#endif")
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
swap("  if(s.t==='goto'||s.t==='deliver')return {x:s.x,z:s.z,name:s.name,r:s.r||10};", "  if(s.t==='goto'||s.t==='deliver'||s.t==='foot'||s.t==='drive'||s.t==='fly')return {x:s.x,z:s.z,name:s.name,r:s.r||10};\n  if(s.t==='land'){const S=WG.GTS[s.strip];return {x:S.x,z:S.z,name:S.name+' strip',r:Math.min(60,S.len/2)};}")
swap("    else if(s.t==='medals')ok=chMedalCount().reduce((p,q)=>p+q,0)>=s.n;", "    else if(s.t==='land')ok=!!car.rt&&!LRW.on&&car.speed<2&&lrStripAt(car.p[0],car.p[2],30)===s.strip;\n    else if(s.t==='foot')ok=LRW.on&&Math.hypot(LRW.p[0]-s.x,LRW.p[2]-s.z)<(s.r||12);\n    else if(s.t==='drive')ok=!car.rt&&!LRW.on&&car.speed<3.5&&Math.hypot(car.p[0]-s.x,car.p[2]-s.z)<(s.r||20);\n    else if(s.t==='fly')ok=!!car.rt&&!LRW.on&&Math.hypot(car.p[0]-s.x,car.p[2]-s.z)<(s.r||200)&&car.p[1]-WG.sample(car.p[0],car.p[2],{}).h>15;\n    else if(s.t==='medals')ok=chMedalCount().reduce((p,q)=>p+q,0)>=s.n;")
swap("  $('jdEyebrow').textContent=(p?p.name+' · ':'')+o.eyebrow;", "  {let f=$('jdFace');if(!f){f=document.createElement('img');f.id='jdFace';f.alt='';f.style.cssText='width:76px;height:76px;border-radius:12px;float:left;margin:2px 14px 8px 0;object-fit:cover;box-shadow:0 2px 10px rgba(0,0,0,.4)';$('jdEyebrow').parentNode.insertBefore(f,$('jdEyebrow'));}f.hidden=!(p&&p.img);if(p&&p.img)f.src=p.img;}\n  $('jdEyebrow').textContent=(p?p.name+' · ':'')+o.eyebrow;")
# (Salt & Sand leaves the town's jobs out each frame; Ground Truth's run: the job you're on, anyone with work beside you)
swap("else if(!DYB.dunes){lapStep(dt,t);runStep(dt,t);parkStep(dt,t);chalStep(dt,t,ev);}}", "else if(!DYB.dunes){lapStep(dt,t);runStep(dt,t);parkStep(dt,t);chalStep(dt,t,ev);}else if(WG.gtPlace){jobStep(dt,t);syncObj();lrWade(dt,t);lrLife(dt,t);}}")
# (on foot the picture's near edge comes in close, for your hands)
swap("function sasNear(){\n  if(APP.orbit)return .3;", "function sasNear(){\n  if(LRW.on)return .1;if(APP.orbit)return .3;")
# the code, just before the boot (after the plane's); the truck's data before the game's script (beside the plane's)
B = "/* =====================================================================================\n   THE BOOT: the dots"
# his plants and rocks (lr-game.js: LRF): each drawn in its own picture, each kind only out to its own reach; the
# plane's material (120) also as 121, its picture tinted by the instance's colour
swap("const m=TREES.shapes[v][far?1:l];instBind(", "const m=TREES.shapes[v][far?1:l];if(m.tx)lrTreeTex(m.tx);instBind(")
swap("const v=T[o+7]|0,l=nearOnly||d2<nn?0:1,cn=L.cnt[v];", "const v=T[o+7]|0;if(d2>LRF.D2[v]*(GFX.level==='mobile'?.45:1))continue;const l=v>=7?(d2<Math.min(nn,GFX.level==='mobile'?1600:3600)?0:1):nearOnly||d2<nn?0:1,cn=L.cnt[v];")
swap("  else if(m==120){\n    alb=pow(texture(uRTa,vUV).rgb,vec3(2.2));", "  else if(m==120||m==121){\n    alb=pow(texture(uRTa,vUV).rgb,vec3(2.2));if(m==121)alb*=vC.rgb;")
# its own front door (lr-game.js: lrTitle) once the page is up, and its own name on the bay's wall
swap("L.hidden=true;openMenu(true);dybStart();sasBoot();", "L.hidden=true;openMenu(true);dybStart();sasBoot();lrTitle();")
swap("const word='REDLINE COUNTY',", "const word='GROUND TRUTH',")
# the driving screen, less crowded (his rule): no nitrous or exhaust-bang lights in the HUD's row
swap("if(e.nosKw)C.push(['N2O',pt.nosOn,PAL.cyan]);", "")
swap("}C.push(['BANG',performance.now()-GAME.voice.popT<140,PAL.red]);", "}")
# each way in (campaign, free play) keeps its own job record (lr-game.js: LRM)
swap("const chSave=()=>{MARKS_V++;CAREER.on?careerSave():store.set('rt-fchal',JSON.stringify(CHAL.free));};",
     "const chSave=()=>{MARKS_V++;CAREER.on?careerSave():store.set(LRM.mode==='campaign'?'gt-campaign':'rt-fchal',JSON.stringify(CHAL.free));};")
# the Outfitter's turntable can hold the Heron (lr-game.js: lrBayHeron)
swap("tris+=drawShowCar(APP.bi,this.Mcar,SHOW.hoodA,true,false,depth?0:GAME.dirt||0,du);}",
     "tris+=LRO.heron?lrBayHeron(this.Mcar,depth):drawShowCar(APP.bi,this.Mcar,SHOW.hoodA,true,false,depth?0:GAME.dirt||0,du);}")
swap("sz=showShed()?1:clamp(T.D.L/4.9,.55,1.8),hz=showShed()?1:clamp(T.D.Hr/1.8,.55,2),", "sz=showShed()?1:LRO.heron?2.2:clamp(T.D.L/4.9,.55,1.8),hz=showShed()?1:LRO.heron?1.25:clamp(T.D.Hr/1.8,.55,2),")
# free play remembers the physics he picks (Sim or Realistic); the campaign is always Sim
swap("id=>{const was=APP.level==='sim';APP.level=id;saveGame();", "id=>{const was=APP.level==='sim';APP.level=id;if(LRM.mode==='free')store.set('gt-free-level',id);saveGame();")
# the Outfitter in its light cyclorama at first (the dark bay's red lights turn the Heron's olive to rust)
swap("const SHOW={full:false,stage:'dark',", "const SHOW={full:false,stage:'light',")
# the maps show the job you're on; the big map is the whole world (lr-game.js: lrMapRoute, lrBigMap)
swap("  mapArrow(x0+size/2,y0+size/2);\n  hFrame(x0-1,y0-1,size+2,size+2,pack(255,255,255,60));", "  lrMapRoute(x0,y0,size,MINI_SPAN);mapArrow(x0+size/2,y0+size/2);\n  hFrame(x0-1,y0-1,size+2,size+2,pack(255,255,255,60));")
swap("function drawBigMap(){\n", "function drawBigMap(){if(WG.gtPlace){lrBigMap();return;}\n")
# a photograph on foot is taken from the picture just drawn (lr-game.js: lrFdSnap)
swap("  gl.bindVertexArray(null);APP.tris=LAND.tris+(APP.carTris||0);rperfAcc();", "  if(LRFD.snap)lrFdSnap();gl.bindVertexArray(null);APP.tris=LAND.tris+(APP.carTris||0);rperfAcc();")
# a tyre stands only on ground that's under it. Past about 70 degrees between the truck and the ground (rolled
# onto its side; the ground's own slope there against the truck's up), the suspension's line runs along the ground
# instead of down into it, and the wheel had still
# been "touching": its spring and its tyre's side force pushed along the axle, which then points straight up, and
# threw a truck that had just rolled onto its side back up into the air, spinning the other way (his "flips
# really hard really fast"). Now the wheel lets go there and the body lands on its side
swap("      if(got){wh.hint=hit.i;comp=s.rest-(hit.t-R);}", "      if(got){const gq=this._gq||(this._gq={y:0,n:F3(),surf:''});this.world.ground(hit.p[0],hit.p[2],gq);const gu=gq.n[0]*U[0]+gq.n[1]*U[1]+gq.n[2]*U[2];if(gu<.34)got=false;wh.fade=gu>=.62?1:sstep(.34,.62,gu);}\n      if(got){wh.hint=hit.i;comp=s.rest-(hit.t-R);}")
# (and between about 50 and 70 degrees it takes the weight gradually: a wheel coming back down onto the ground as the
# truck rolls over is already deep in it, and its spring and bump stop all at once kicked the truck up again)
swap("      wh.Fz=Math.max(0,Fs);wh.cp.set(hit.p);", "      wh.Fz=Math.max(0,Fs)*(wh.fade??1);wh.cp.set(hit.p);")
# (and a wheel that comes down onto the ground already past its bump stop, because the truck rolled it in there
# sideways, doesn't spring that back out: only what it's pushed in further from there hits the bump stop. A
# wheel landing from a jump touches first and compresses, so its bump stop is as it was)
swap("      if(comp<=0){wh.contact=false;wh.Fz=0;wh.comp=0;", "      if(comp<=0){wh.bp0=-1;wh.contact=false;wh.Fz=0;wh.comp=0;")
swap("      if(comp>s.travel)Fs+=(comp-s.travel)*wh.k*14+Math.max(0,rate)*wh.cb*2;", "      {const ex=comp-s.travel;wh.bp0=!(wh.bp0>=0)?Math.max(0,ex):Math.min(wh.bp0,Math.max(0,ex));const eb=ex-wh.bp0;if(eb>0)Fs+=eb*wh.k*14+Math.max(0,rate)*wh.cb*2;}")
# on foot: no instruments, no car chips (the job's line and the finds' marks stay)
swap("  /* shift lights, tach, gear, speed */\n  engShiftLights(", "  /* shift lights, tach, gear, speed */\n  if(LRW.on){drawFeatsHud();drawJobHud(lx,sc);lrFindHud();return;}\n  engShiftLights(")
swap("  /* top left: the car and its build, the place, the driving level, the money */\n", "  if(APP.bigMap&&WG.gtPlace){lrBigMap();return;}\n  /* top left: the car and its build, the place, the driving level, the money */\n")
# the dust storm of the job Dust (lr-game.js: lrDust)
swap("if(DYB.dunes){const A=DYB.air;E.fogDen*=A.fog;E.fogAmb=E.fogAmb.map(v=>v*A.fog);E.ambUp=E.ambUp.map(v=>v*A.amb);E.key*=A.key;}", "if(DYB.dunes){const A=DYB.air;E.fogDen*=A.fog;E.fogAmb=E.fogAmb.map(v=>v*A.fog);E.ambUp=E.ambUp.map(v=>v*A.amb);E.key*=A.key;}if(typeof lrDust!=='undefined')lrDust(E);")
# the campaign's own money (lr-game.js: LRM.money): what the jobs pay, kept apart from free play's score; the HUD
# names the truck and the plane as this game does
swap("const cash=()=>CAREER.on?CAREER.d.money:Feats.S.money;", "const cash=()=>CAREER.on?CAREER.d.money:LRM.mode==='campaign'?lrMoney():Feats.S.money;")
swap("function earn(n){n=Math.round(n);if(!n)return 0;if(CAREER.on){", "function earn(n){n=Math.round(n);if(!n)return 0;if(LRM.mode==='campaign'&&!CAREER.on){lrMoney(n);return n;}if(CAREER.on){")
swap("Feats.fmtMoney(r.money)+(CAREER.on?'':' score'):'')", "Feats.fmtMoney(r.money)+(CAREER.on||LRM.mode==='campaign'?'':' score'):'')")
swap("const carLabel=()=>GAME.car&&GAME.car.rt?'Heron':carName({car:APP.car})+' '+rigName(APP.car,rigOf(APP.car))+plusTag(APP.car);", "const carLabel=()=>GAME.car&&GAME.car.rt?'The Heron':WG.gtPlace?'Rock & Mud':carName({car:APP.car})+' '+rigName(APP.car,rigOf(APP.car))+plusTag(APP.car);")
# a step that needs gear waits for it (lr-game.js: lrHas); the light bar's reach (lrHL)
swap("    if(ok)jAdvance();}\n  JOB.near=null;", "    if(ok&&s.need&&!lrHas(s.need)){ok=false;lrNeedSay(s.need);}\n    if(ok)jAdvance();}\n  JOB.near=null;")
swap("const hk=1.5*LOOK.hl;L.headlights={on:1,high:0,posL:at(xf,y,-zs),posR:at(xf,y,zs),dir,right:Rt,up:U,col:[1050*hk,1090*hk,1140*hk],range:85};",
     "const hk=1.5*LOOK.hl*(typeof lrHL!=='undefined'?Math.sqrt(lrHL()):1);L.headlights={on:1,high:0,posL:at(xf,y,-zs),posR:at(xf,y,zs),dir,right:Rt,up:U,col:[1050*hk,1090*hk,1140*hk],range:85*(typeof lrHL!=='undefined'?lrHL():1)};")
# the truck's add-ons, fitted, drawn on it (lr-game.js: lrPartsDraw): on the road and in the Outfitter
swap("  setM('body',Mb);\n  drawMesh(T.body);if(T.hood)drawMesh(T.hood);", "  setM('body',Mb);\n  drawMesh(T.body);if(LRP)lrPartsDraw(Mb,depth);if(T.hood)drawMesh(T.hood);")
swap("tris+=LRO.heron?lrBayHeron(this.Mcar,depth):drawShowCar(APP.bi,this.Mcar,SHOW.hoodA,true,false,depth?0:GAME.dirt||0,du);}",
     "tris+=LRO.heron?lrBayHeron(this.Mcar,depth):drawShowCar(APP.bi,this.Mcar,SHOW.hoodA,true,false,depth?0:GAME.dirt||0,du)+lrPartsDraw(this.Mcar,depth);}")
swap(B, open(sys.path[0] + '/lr-game.js', encoding='utf-8').read() + '\n' + B)
i = s.index('<script>window.RT2_DATA') if '<script>window.RT2_DATA' in s else None
assert i is not None, 'the plane data script'
import base64, os, json
HERON = os.path.join(sys.path[0], '..', 'models/heron/paint/redtail-2-heron.webp')
heron = 'window.LR_HERON_PAINT=' + repr(base64.b64encode(open(HERON, 'rb').read()).decode()) + ';\n' + open(os.path.join(sys.path[0], 'lr-props.js'), encoding='utf-8').read() + 'window.LR_FACES=' + json.dumps({k: base64.b64encode(open(os.path.join(sys.path[0], '..', f'models/portraits/{k}.webp'), 'rb').read()).decode() for k in ['J01','J02','J03','J04','J05','J06','J07']}) + ';\n' + 'window.LR_HORZ=' + repr(base64.b64encode(open(os.path.join(sys.path[0], '..', 'models/horizon/strip.webp'), 'rb').read()).decode()) + ';\n' + open(os.path.join(sys.path[0], 'lr-wmap.js'), encoding='utf-8').read() + open(os.path.join(sys.path[0], 'lr-shop.js'), encoding='utf-8').read() + open(os.path.join(sys.path[0], 'lr-walk.js'), encoding='utf-8').read() + open(os.path.join(sys.path[0], 'lr-finds.js'), encoding='utf-8').read() + open(os.path.join(sys.path[0], 'lr-book.js'), encoding='utf-8').read()
s = s[:i] + '<script>' + open(data, encoding='utf-8').read() + '\n' + heron + '</script>\n' + s[i:]
open(dst, 'w', encoding='utf-8').write(s)
print('written', dst, len(s))
