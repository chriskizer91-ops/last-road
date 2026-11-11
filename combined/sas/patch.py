#!/usr/bin/env python3
"""Salt & Sand, lean: builds the new page from the page it was sent as, by exact text swaps (each must match once),
as Ice & Snow and the Redtail builds are made. usage: python3 -I patch.py <salt-and-sand.html> <out.html> [--kit src/kit.js]
The pieces: src/s2make.js (the worker's side: the car made, then stored lean), src/kit.js (the Studio kit, as it is in
the page unless changed here), src/s2lean.js (the page's side: the lean meshes, the bake, what a view needs)."""
import sys, json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
n0 = len(s)
def rd(p): return open(os.path.join(HERE, p), encoding='utf-8').read()
def swap(old, new, why, count=1):
    global s
    c = s.count(old)
    if c != count: raise SystemExit(f'PATCH FAILED ({why}): expected {count} match(es), found {c}\n  {old[:160]!r}')
    s = s.replace(old, new)
def js_str(t):  # a script as a JS string literal, the page's way (no "<" in it, so no tag can end the page's script early)
    return json.dumps(t).replace('<', '\\u003c')
def line_of(prefix):
    a = s.index('\n' + prefix) + 1; b = s.index('\n', a); return a, b

# ---- the worker's side: the kit and the maker, as text in the page ----
a, b = line_of('const S2KIT_SRC='); kit_old = s[a:b]
kit_page = json.loads(kit_old[len('const S2KIT_SRC='):].rstrip(';'))
if 'const S2KIT_SRC=' + js_str(kit_page) + ';' != kit_old: raise SystemExit('the kit line does not round-trip: check js_str')
kit_new = rd('src/kit.js')
if kit_new != kit_page: raise SystemExit('src/kit.js is not the kit this page carries: start from the page\'s own')
def kswap(old, new, why, count=1):
    global kit_new
    c = kit_new.count(old)
    if c != count: raise SystemExit(f'KIT PATCH FAILED ({why}): expected {count}, found {c}')
    kit_new = kit_new.replace(old, new)
# the finer tyres (src/kit_tyres.js): the Rock & Mud's mud-terrain built again, lettering on both SUVs' sidewalls
kswap("  const spin=new MB(),fixed=new MB();cwMudTyre(spin,w);", "  const spin=new MB(),fixed=new MB(),T3=HD_TYRES>=3?cwMudTyre3(spin,w):(cwMudTyre(spin,w),null);", 'cwWheel: the finer mud-terrain')
kswap("hdCap(mb,rings[2],SMC('#b9bcc2',SM.BOLT),true);},20,null,M);}\n  hdBrake(spin,fixed,w,{ro:.155,ri:.095,zc:-.03,pistons:1});\n  return {spin,fixed,tris:(spin.p.length+fixed.p.length)/9};", "hdCap(mb,rings[2],SMC('#b9bcc2',SM.BOLT),true);},20,null,M);}\n  hdBrake(spin,fixed,w,{ro:.155,ri:.095,zc:-.03,pistons:1});\n  return {spin,fixed,tris:(spin.p.length+fixed.p.length)/9,half:T3&&T3.half};", 'cwWheel: its sidewall\'s outline handed on')
kswap("    const W=cwWheel(lk.tyre);out.wheel=out.wheelR=W.spin;out.brake=out.brakeR=W.fixed;", "    const W=cwWheel(lk.tyre);out.wheel=out.wheelR=W.spin;out.brake=out.brakeR=W.fixed;if(W.half)out.wheelL=cwTyreText(W.spin,W.half);", 'the Rock & Mud: lettering, and the left-hand copy', 2)
kswap("    {const fx=new MB();out.wheel=hdWheel(lk.tyre,b,fx);out.wheelR=out.wheel;out.brake=out.brakeR=fx;}", "    {const fx=new MB();out.wheel=hdWheel(lk.tyre,b,fx);out.wheelR=out.wheel;out.brake=out.brakeR=fx;if(HD_TYRES>=3)out.wheelL=hdStockTyreText(out.wheel,lk.tyre);}", 'the Stock: lettering, and the left-hand copy')
kit_new += rd('src/kit_tyres.js')
s = s[:a] + 'const S2KIT_SRC=' + js_str(kit_new) + ';' + s[b:]
a, b = line_of('const S2MAKE_SRC=')
opt = rd('src/meshopt_simplifier.js')
if opt.count('\nexport { MeshoptSimplifier };') != 1: raise SystemExit('the simplifier: its export line has changed')
opt = '/* meshoptimizer\'s simplifier (github.com/zeux/meshoptimizer, v1.3), as its npm package ships it, for 63_s2make s2Lod.\n' + rd('src/meshopt_LICENSE.md').strip() + ' */\n' + opt.replace('\nexport { MeshoptSimplifier };', '\n')
s = s[:a] + 'const S2MAKE_SRC=' + js_str(rd('src/s2make.js')) + ';\nconst S2OPT_SRC=' + js_str(opt) + ';' + s[b:]

# ---- the page's side ----
swap("meshUpload(m,m.src);return !m.oom;}", "(m.src.vtx?meshUploadI:meshUpload)(m,m.src);return !m.oom;}", 'meshRetry: a lean piece tried again')
swap("for(const [nm,d] of Object.entries(P)){S[nm]=makeMesh(d);}", "for(const [nm,d] of Object.entries(P)){S[nm]=d.vtx?meshUploadI({},d):makeMesh(d);}", 's2Done: lean pieces')
swap("  DYB.S2.set(k,S);DYB.order=DYB.order.filter(q=>q!==k);DYB.order.push(k);",
     "  DYB.S2.set(k,S);DYB.order=DYB.order.filter(q=>q!==k);DYB.order.push(k);\n  /* (its shade and what can be seen of it, baked over the next frames, then its lighter copies: 63_s2lean) */\n  if(P.body&&P.body.vtx){S.bk=P;if(S2B.N>0)s2BakeQueue(S);else{s2LodAsk(S);S.bk=null;}}", 's2Done: queue the bake')
swap("  try{const src='self.window=self;\\n'+S2KIT_SRC+'\\n;\\n'+S2MAKE_SRC+\n      '\\nonmessage=e=>{const k=e.data.key;try{const r=s2Make(window.KIT,k);postMessage(r.msg,r.tr);}catch(err){postMessage({ok:false,key:k,err:String(err&&err.stack||err)});}};';",
     "  try{const src='self.window=self;\\n'+S2KIT_SRC+'\\n;\\n'+S2MAKE_SRC+'\\n;\\n'+S2OPT_SRC+\n      '\\nonmessage=e=>{const k=e.data.key;if(e.data.lod){s2Lod(e.data).then(r=>postMessage(r.msg,r.tr)).catch(err=>postMessage({lod:true,ok:false,key:k,err:String(err&&err.stack||err)}));return;}try{const r=s2Make(window.KIT,k,e.data.opt);postMessage(r.msg,r.tr);}catch(err){postMessage({ok:false,key:k,err:String(err&&err.stack||err)});}};';", 'the worker: the simplifier in, and its messages')
swap("    w.onmessage=e=>s2Done(e.data);", "    w.onmessage=e=>e.data.lod?s2LodDone(e.data):s2Done(e.data);", 'the worker: the copies back')
swap("  if(w)w.postMessage({key:k});", "  if(w)w.postMessage({key:k,opt:S2B.opt});", 's2Pump: what to build with')
swap("      m=DYB.inline.make(DYB.inline.K,k).msg;}catch(e){m={ok:false,key:k,err:String(e&&e.stack||e)};}s2Done(m);},60);", "      m=DYB.inline.make(DYB.inline.K,k,S2B.opt).msg;}catch(e){m={ok:false,key:k,err:String(e&&e.stack||e)};}s2Done(m);},60);", 's2Pump: the same, made on the page')
swap("function freeMesh(m){if(!m)return;gl.deleteVertexArray(m.vao);", "function freeMesh(m){if(!m)return;if(m.lod)for(const l of m.lod)gl.deleteVertexArray(l.vao);gl.deleteVertexArray(m.vao);", 'freeMesh: a piece\'s lighter copies')
anchor = "/* =====================================================================================\n   SALT & SAND: the Dyno Bay's garage and dyno as the menu"
swap(anchor, rd('src/s2lean.js') + anchor, 'the lean module, before Salt & Sand')
swap("  landPrograms();FXP.init();displayPrograms();", "  landPrograms();FXP.init();displayPrograms();s2BakePrograms();", 'the bake\'s programs at the boot')
swap("function render(dt){\n", "function render(dt){\n  /* (a Studio 2 car's bake, a few directions a frame until it's done: 63_s2lean) */\n  s2BakeStep();\n", 'the bake, stepped before each frame')

# the shaders: each corner's baked shade (two bytes at attribute 4: how much of the sky is hidden on the normal's side, on the back)
swap("layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNrm;layout(location=2) in vec4 aCol;layout(location=3) in float aMat;\nlayout(location=5) in vec4 iA;layout(location=6) in vec4 iB;layout(location=7) in vec4 iC;\nuniform mat4 uM;uniform mat4 uPrevM;",
     "layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNrm;layout(location=2) in vec4 aCol;layout(location=3) in float aMat;\n/* (a Studio 2 car's baked shade, 63_s2lean: uBk is 0 for everything else) */\nlayout(location=4) in vec2 aBk;uniform float uBk;out vec2 vBk;\nlayout(location=5) in vec4 iA;layout(location=6) in vec4 iB;layout(location=7) in vec4 iC;\nuniform mat4 uM;uniform mat4 uPrevM;", 'VS: the baked shade in')
swap("  vP=w;vMat=aMat;gl_Position=uVP*vec4(w,1.);vCur=uVPnj*vec4(w,1.);vPrev=uPrevVP*vec4(pw,1.);}`;",
     "  vP=w;vMat=aMat;vBk=aBk*uBk;gl_Position=uVP*vec4(w,1.);vCur=uVPnj*vec4(w,1.);vPrev=uPrevVP*vec4(pw,1.);}`;", 'VS: the baked shade out')
swap("in vec3 vP;in vec3 vN;in vec4 vC;in float vMat;in vec3 vL;in vec4 vCur;in vec4 vPrev;\nlayout(location=0) out vec4 oCol;\n#ifndef PROBE\nlayout(location=1) out vec4 oNrm;layout(location=2) out vec2 oVel;\n#endif\nvoid main(){\n  /* (a degenerate normal",
     "in vec3 vP;in vec3 vN;in vec4 vC;in float vMat;in vec3 vL;in vec4 vCur;in vec4 vPrev;in vec2 vBk;\nlayout(location=0) out vec4 oCol;\n#ifndef PROBE\nlayout(location=1) out vec4 oNrm;layout(location=2) out vec2 oVel;\n#endif\nvoid main(){\n  /* (a degenerate normal", 'FS: the baked shade in')
swap("vec3 V=normalize(uCam-vP);if(dot(N,V)<0.)N=-N;vec3 Ng=N;\n  vec3 alb=vC.rgb;float em=vC.a;",
     "vec3 V=normalize(uCam-vP);bool bkF=dot(N,V)<0.;if(bkF)N=-N;vec3 Ng=N;\n  vec3 alb=vC.rgb;float em=vC.a;", 'FS: which side of the sheet')
swap("  Surf s;s.P=vP;s.V=V;s.N=N;s.Nc=Ng;s.ao=ao;s.spec=1.;s.trans=trans;s.clear=clear;s.clearR=clearR;\n  s.rough=sqrt(2./(shin+2.));",
     "  /* a Studio 2 car's own shade (63_s2lean's bake): how much of the sky this point sees past the rest of the car, on\n     the side being looked at. It dims the sky's light and the reflections (s.ao), the lamps that cast no shadows of\n     their own, and the clear coat's reflection; the sun keeps its shadow maps. 1 for everything else */\n  float aoB=1.-(bkF?vBk.y:vBk.x);\n  /* (not the lamps: a reflector behind its lens is lit through the lens, and shines as it did) */\n  if(m>=7&&m<=10||m==70||m==71||m==81||m==82||m==83||m==96||m==97||m==108)aoB=1.;\n  ao*=aoB;\n  Surf s;s.P=vP;s.V=V;s.N=N;s.Nc=Ng;s.ao=ao;s.spec=1.;s.trans=trans;s.clear=clear;s.clearR=clearR;\n  s.rough=sqrt(2./(shin+2.));", 'FS: the shade into the surface')
swap("  col+=directAll(s,gl_FragCoord.xy,dist)*mix(1.,occ,.45)+ambient(s);",
     "  /* (11_sl3's directAll, with the shadowless lamps dimmed by the baked shade) */\n  {vec3 dl=vec3(0.);if(dot(uSunCol,uSunCol)>1e-6){float sh=sunShadow(s.P,s.N,dist,gl_FragCoord.xy);if(sh>0.0)dl+=brdfL(s,uSunDir,uSunCol*sh,.003);}\n    dl+=(clusterLights(s)+dynLights(s))*mix(1.,aoB,.7)+headlights(s);col+=dl*mix(1.,occ,.45)+ambient(s);}", 'FS: the lamps dimmed')
swap("    col=col*(1.-Fc)+refl*(1.-Fc)+cc*Fc;}", "    col=col*(1.-Fc)+refl*(1.-Fc)+cc*Fc*(.15+.85*aoB);}", 'FS: the clear coat dimmed')

# the bay's car: the shade on
swap("  const u=du||CUR.u;if(!du){showCarUniforms(i,dirt);gl.uniform1f(u.uMudLocal,1);gl.uniform1f(u.uMudOff,0);}\n  const Mb=s2BodyM(S,Mc);",
     "  const u=du||CUR.u;if(!du){showCarUniforms(i,dirt);gl.uniform1f(u.uMudLocal,1);gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uBk,s2BkK(S));}\n  const Mb=s2BodyM(S,Mc);", 'drawS2Car: the shade on')
swap("  if(!du){gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uMudLocal,0);}\n  return S.tris;\n}",
     "  if(!du){gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uMudLocal,0);gl.uniform1f(u.uBk,0);}\n  return S.tris;\n}", 'drawS2Car: the shade off')

# the road's car: the shade on, and only what this view can see of the sorted pieces
swap("  if(!depth){carUniformsW(t,v,dirt);gl.uniform1f(u.uMudLocal,1);gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uPrevOn,1);}\n  if(S.pitch)Mb=M4.mul(Mb,M4.mul(M4T(S.fx,S.R,0),M4.mul(M4RZ(S.pitch),M4T(-S.fx,-S.R,0))));",
     """  if(!depth){carUniformsW(t,v,dirt);gl.uniform1f(u.uMudLocal,1);gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uPrevOn,1);gl.uniform1f(u.uBk,s2BkK(S));}
  if(S.pitch)Mb=M4.mul(Mb,M4.mul(M4T(S.fx,S.R,0),M4.mul(M4RZ(S.pitch),M4T(-S.fx,-S.R,0))));
  /* what this view needs of the body and the engine (63_s2lean: their triangles are in the bake's order). A camera
     clear of the car: what can be seen from outside, as far down as the camera is on the car. The sun, for the
     shadow: what it can see from where it is. The cockpit, the hood camera, anything inside the car's box: all of it */
  let all=true,ey=0,tris=0,lk=0;
  if(S.baked&&s2CullOn()){
    if(depth){const L=R.U.uSunDir;all=false;ey=M0[4]*L[0]+M0[5]*L[1]+M0[6]*L[2]>.02?99:-1;lk=s2LodOn()&&S.lods?Math.max(1,S.lodK||0):0;}
    else{let out=false;if(CAM.last&&!cockOn()){const e=s2Local(M0,CAM.last.eyeR);if(s2Outside(S,e)){out=true;all=false;ey=e[1];lk=s2LodFor(S,CAM.last,e);}}if(!out)S.lodK=0;}}""", 'drawS2World: what the view needs')
swap("  setM('body',Mb);drawMesh(S.body);if(!depth&&S.bodyG){if(see)gl.uniform1f(u.uSeeX,.8);drawMesh(S.bodyG);if(see)gl.uniform1f(u.uSeeX,0);}\n  if(S.hood)drawMesh(S.hood);if(!depth&&S.hoodG)drawMesh(S.hoodG);if(S.liner)drawMesh(S.liner);",
     "  setM('body',Mb);tris+=drawMeshS(S.body,ey,all,lk);if(!depth&&S.bodyG){if(see)gl.uniform1f(u.uSeeX,.8);tris+=drawMeshL(S.bodyG,lk);if(see)gl.uniform1f(u.uSeeX,0);}\n  if(S.hood)tris+=drawMeshL(S.hood,lk);if(!depth&&S.hoodG)tris+=drawMeshL(S.hoodG,lk);if(S.liner)tris+=drawMeshN(S.liner,s2DrawN(S.liner,ey,all));", 'drawS2World: the body')
swap("    setM('eng',Me);drawMesh(S.engine);}", "    setM('eng',Me);tris+=drawMeshN(S.engine,s2DrawN(S.engine,ey,all));}", 'drawS2World: the engine')
swap("    drawMesh(w.front?S.wheel:S.wheelR);\n    /* what only steers */", "    tris+=drawMeshL(s<0&&S.wheelL?S.wheelL:w.front?S.wheel:S.wheelR,lk);\n    /* what only steers */", 'drawS2World: the wheels, as the copy the view takes')
swap("gl.uniformMatrix4fv(u.uM,false,wheelMat(M0,x,y,z,st,s,0));if(pm)gl.uniformMatrix4fv(u.uPrevM,false,p?SAS_PREV:WHM);drawMesh(br);}",
     "gl.uniformMatrix4fv(u.uM,false,wheelMat(M0,x,y,z,st,s,0));if(pm)gl.uniformMatrix4fv(u.uPrevM,false,p?SAS_PREV:WHM);tris+=drawMeshL(br,lk);}", 'drawS2World: the brakes, as the copy the view takes')
swap("  if(!depth){gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uMudLocal,0);gl.uniform1f(u.uPrevOn,0);gl.uniform1f(u.uDirt,0);gl.uniform1f(u.uLiv,0);gl.uniform1f(u.uLamps,0);gl.uniform1f(u.uBrake,0);gl.uniform3f(u.uGlow,0,0,0);}\n  return S.tris;\n}",
     "  if(!depth){gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uMudLocal,0);gl.uniform1f(u.uPrevOn,0);gl.uniform1f(u.uDirt,0);gl.uniform1f(u.uLiv,0);gl.uniform1f(u.uLamps,0);gl.uniform1f(u.uBrake,0);gl.uniform3f(u.uGlow,0,0,0);gl.uniform1f(u.uBk,0);S.drawn=tris;}else S.drawnSh=tris;\n  return tris;\n}", 'drawS2World: the shade off, the count')
swap("  for(const [nm,n] of Object.entries(I.tris)){const x=/^(wheel|brake)$/.test(nm)?(P[nm+'R']?2:4):/^(wheel|brake)R$/.test(nm)?2:1;S.tris+=n*x;S.draws+=x;}",
     "  /* (a wheel is drawn four times, or twice where the back ones are their own; where the left ones are their own copy, each twice) */\n  for(const [nm,n] of Object.entries(I.tris)){const x=nm==='wheelL'?2:nm==='wheel'&&P.wheelL?2:/^(wheel|brake)$/.test(nm)?(P[nm+'R']?2:4):/^(wheel|brake)R$/.test(nm)?2:1;S.tris+=n*x;S.draws+=x;}", 's2Done: the left wheels counted')
swap("    for(const nm of ['body','bodyG','hood','hoodG','liner','engine','wheel','wheelR','brake','brakeR'])if(Q[nm]&&!seen.has(Q[nm])){seen.add(Q[nm]);freeMesh(Q[nm]);}}}",
     "    for(const nm of ['body','bodyG','hood','hoodG','liner','engine','wheel','wheelR','wheelL','brake','brakeR'])if(Q[nm]&&!seen.has(Q[nm])){seen.add(Q[nm]);freeMesh(Q[nm]);}}}", 's2Done: the left wheels let go')
swap("    gl.uniformMatrix4fv(u.uM,false,M4.mul(Mw,M4RZ(wa*eR/Rw)));drawMesh(front?S.wheel:S.wheelR);",
     "    gl.uniformMatrix4fv(u.uM,false,M4.mul(Mw,M4RZ(wa*eR/Rw)));drawMesh(s<0&&S.wheelL?S.wheelL:front?S.wheel:S.wheelR);", 'drawS2Car: the left wheels')
swap("  else if(k&&DYB.S2.has(k)&&DYB.shown===k&&performance.now()-DYB.shownT<4000){const S=DYB.S2.get(k);t=`Studio 2 ${nm} · ${NF.format(Math.round(S.tris))} triangles`;}",
     "  /* (while its shade is baked, 63_s2lean: how far along) */\n  else if(k&&DYB.S2.has(k)&&DYB.S2.get(k).bk&&S2B.N>0){const S=DYB.S2.get(k),J=S2B.job;t=`Studio 2 ${nm} · ${NF.format(Math.round(S.tris))} triangles · shading ${J&&J.S===S?Math.round(100*J.d/J.N):0}%`;}\n  else if(k&&DYB.S2.has(k)&&DYB.shown===k&&performance.now()-DYB.shownT<4000){const S=DYB.S2.get(k);t=`Studio 2 ${nm} · ${NF.format(Math.round(S.tris))} triangles`;}", 's2Badge: the bake\'s progress')
swap("const LOOK_DEF={sat:1,con:1,key:1,haze:1,detail:1,shadows:1,occ:1,", "const LOOK_DEF={sat:1,con:1,key:1,haze:1,detail:1,shadows:1,occ:1,carShade:1,carLean:1,", 'the look: two switches for the lean Studio 2')
swap("['occ','Shade under the cars','The soft occlusion on the ground under each car.']];",
     "['occ','Shade under the cars','The soft occlusion on the ground under each car.'],\n  ['carShade','The car\\'s own shade','A Studio 2 car\\'s baked shade: its arches, cabin, engine bay and underside sit in the car\\'s own shadow. Off, the sky lights every part alike, as before.'],\n  ['carLean','Only what can be seen','On the road, leave out the triangles no camera outside the car can see, and draw a lighter copy of the car from far off. Off, every triangle every frame, as before.']];", 'the Dev panel: their switches')
swap("  window.__dyb={CAMS,", "  window.__dyb={S2B,s2BakeStep,LOOK,get R(){return R;},get PS(){return PS;},get PERF(){return PERF;},CAMS,", 'the tools\' handle')

open(out, 'w', encoding='utf-8').write(s)
print(f'{out}: {len(s):,} bytes (was {n0:,})')
