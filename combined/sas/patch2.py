#!/usr/bin/env python3
"""Salt & Sand, Film & Showroom: builds the page from the lean page (patch.py's), by exact text swaps (each must match
once). usage: python3 -I patch2.py <salt-and-sand-lean.html> <out.html>
The pieces (src2/): film.js (the Film camera, the Helicopter, the softer fly-past pitch), show.js (the Showroom: the
black or white void, its floor shadow), kit_show.js (the two SUVs' showroom detail, added to the kit)."""
import sys, json, os
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
def js_str(t): return json.dumps(t).replace('<', '\\u003c')
def line_of(prefix):
    a = s.index('\n' + prefix) + 1; b = s.index('\n', a); return a, b

# ======== the Film camera ========
swap("const CAMS=['Chase','Far','Hood','Cinematic','Drone lead','Drone tail','Drone left','Drone right','Drone orbit','Low drone','Drone follow','Cockpit','Wheel cam','Tracking car','Roadside'];",
     "const CAMS=['Chase','Far','Hood','Cinematic','Drone lead','Drone tail','Drone left','Drone right','Drone orbit','Low drone','Drone follow','Cockpit','Wheel cam','Tracking car','Roadside','Film'];", 'the cameras: Film')
swap("if(s.cam>=0&&s.cam<15)APP.cam=s.cam|0;", "if(s.cam>=0&&s.cam<16)APP.cam=s.cam|0;", 'the save: sixteen cameras')
swap("const CAM_ORDER=[0,1,2,11,12,13,14,3,9,10,8,4,5,6,7];", "const CAM_ORDER=[0,15,1,2,11,12,13,14,3,9,10,8,4,5,6,7];", 'the list: Film after Chase')
swap("const CAM_DEF={on:[0,2,11,12,13,14,3,9,10,8],t:{0:10,1:10,2:8,11:12,12:8,13:13,14:8,3:14,9:20,10:10,8:16,4:8,5:8,6:8,7:8},dir:false,jump:true};",
     "const CAM_DEF={on:[0,15,2,11,12,13,14,3,9,10,8],t:{0:10,15:30,1:10,2:8,11:12,12:8,13:13,14:8,3:14,9:20,10:10,8:16,4:8,5:8,6:8,7:8},dir:false,jump:true,film:1};", 'the list: Film on')
swap("    if(s.t)for(const k in s.t)if(CAM_TIMES.includes(+s.t[k]))o.t[k]=+s.t[k];o.dir=!!s.dir;o.jump=s.jump!==false;}",
     "    if(s.t)for(const k in s.t)if(CAM_TIMES.includes(+s.t[k]))o.t[k]=+s.t[k];o.dir=!!s.dir;o.jump=s.jump!==false;\n    /* (a list saved before the Film camera was there: it joins the cameras that are on, once) */\n    if(!s.film&&!o.on.includes(15))o.on.push(15);}", 'the list: Film joins a saved list')
swap("function camUpdate(dt){\n  const t=GAME.car,M=t.M,F=mcol(M,0),U=mcol(M,1),sp=t.speed,mode=CAMS[APP.cam],cut=CAM.cut,",
     "function camUpdate(dt){\n  /* (the Film camera picks its shot first: sas_film) */\n  filmStep(GAME.car,dt);\n  const t=GAME.car,M=t.M,F=mcol(M,0),U=mcol(M,1),sp=t.speed,mode=camMode(),cut=CAM.cut,", 'camUpdate: the Film camera first')
swap("  {const J=camAuto(t,dt);if(J)return J;}\n",
     "  {const J=camAuto(t,dt);if(J)return J;}\n  if(mode==='Heli'){CAM.yaw=null;CAM.off=null;CAM.fq=null;return heliStep(t,dt,cut);}\n  if(mode==='Park orbit'){CAM.yaw=null;CAM.off=null;CAM.fq=null;return filmParkStep(t,dt,cut);}\n", 'camUpdate: the Film camera\'s own shots')
swap("const t=GAME.car,M=t.M,F=mcol(M,0),mode=CAMS[APP.cam],D=carD(t);", "const t=GAME.car,M=t.M,F=mcol(M,0),mode=camMode(),D=carD(t);", 'soundUpdate: heard as the shot is heard')
swap("  if(APP.orbit)return .3;if(JUMP.on)return .2;const m=CAMS[APP.cam];", "  if(APP.orbit)return .3;if(JUMP.on)return .2;const m=camMode();if(m==='Heli')return FHEL.near;", 'sasNear: the long lens')
anchor = "/* how close the picture's near edge can come, per camera (the cockpit's cabin is right round you) */"
swap(anchor, rd('src2/film.js') + anchor, 'the Film module')
# the fly-past pitch, softer
swap("  return {geo:{dist:clamp(d*.6,2,60),pan:clamp(-dot2(u,right)*.9,-1,1),rear:clamp(.5-.5*dot2(u,F),0,1)*.6+.4},dop:clamp(343/(343-vr),.65,1.45)};}",
     "  return {geo:{dist:clamp(d*.6,2,60),pan:clamp(-dot2(u,right)*.9,-1,1),rear:clamp(.5-.5*dot2(u,F),0,1)*.6+.4},dop:flyPitch(vr,d)};}", 'cineSound: the softer fly-past pitch')
swap("const LOOK_DEF={sat:1,con:1,key:1,haze:1,detail:1,shadows:1,occ:1,carShade:1,carLean:1,", "const LOOK_DEF={sat:1,con:1,key:1,haze:1,detail:1,shadows:1,occ:1,carShade:1,carLean:1,softFly:1,", 'the look: the fly-past switch')
swap("draw a lighter copy of the car from far off. Off, every triangle every frame, as before.']];",
     "draw a lighter copy of the car from far off. Off, every triangle every frame, as before.'],\n  ['softFly','Softer fly-past sound','The drop in the engine\\'s note as the car passes a camera standing by (Cinematic, Roadside, Low drone, the jump cam): about half what it was, a little under what a real microphone hears. Off, as before.']];", 'the Dev panel: its switch')
swap("  window.__dyb={S2B,", "  window.__dyb={FILM,FHEL,camMode,flyPitch,camUpdate,S2B,", 'the tools\' handle')

# ======== the Showroom: the void ========
anchor = "/* =====================================================================================\n   SALT & SAND: the Dyno Bay's garage and dyno as the menu"
swap(anchor, rd('src2/show.js') + anchor, 'the Showroom module, before Salt & Sand')
swap('    <div class="seg" id="shStage" role="group" aria-label="Studio"></div>\n',
     '    <button class="btn sm" id="shVoid" type="button" hidden>Showroom</button>\n    <div class="seg" id="shStage" role="group" aria-label="Studio"></div>\n', 'the bar: the Showroom switch, first in it')
swap("#shSpin[aria-pressed=true],#shHood[aria-pressed=true],#shLights[aria-pressed=true]{", "#shVoid[aria-pressed=true],#shSpin[aria-pressed=true],#shHood[aria-pressed=true],#shLights[aria-pressed=true]{", 'the bar: its lit look')
swap("  $('shWash').addEventListener('click',()=>{GAME.dirt=0;});",
     "  $('shWash').addEventListener('click',()=>{GAME.dirt=0;});\n  $('shVoid').addEventListener('click',()=>{SHOW.void=!SHOW.void&&showCanVoid();SHOW.dockTop=undefined;syncShow();DYB.shownT=performance.now();s2Badge();});", 'the bar: the switch works')
swap("  for(const [id,k] of [['shSpin','spin'],['shHood','hood'],['shLights','lights']])$(id).setAttribute('aria-pressed',String(!!SHOW[k]));",
     "  for(const [id,k] of [['shSpin','spin'],['shHood','hood'],['shLights','lights']])$(id).setAttribute('aria-pressed',String(!!SHOW[k]));\n  {const b=$('shVoid');if(b){b.hidden=!showCanVoid();b.setAttribute('aria-pressed',String(!!SHOW.void));}}", 'syncShow: the switch')
swap("const dynoH=()=>DYNO_H*sstep(0,1,SHOW.lift);", "const dynoH=()=>SHOW.void?0:DYNO_H*sstep(0,1,SHOW.lift);", 'the void: no dyno')
swap("  const S=STAGES[SHOW.stage],K=full||S.id===2?showKey(S):{d:S.sun,c:S.sunCol},E=STUDIO.env;", "  const S=showStg(),K=full||S.id>=2?showKey(S):{d:S.sun,c:S.sunCol},E=STUDIO.env;", 'showEnv: the void\'s studio')
swap("cloud:0,stars:0,fogCol:S.fog.map(v=>v*SLK),", "cloud:0,stars:0,fogCol:(S.bg||S.fog).map(v=>v*SLK),", 'showEnv: the void\'s flat colour')
swap("    key:(S.id===1?.072:.15)*LOOK.key,expoRange:S.id===1?[.4,6]:[.08,1.2],bloom:.05*LOOK.bloom,",
     "    key:(S.key||(S.id===1?.072:.15))*LOOK.key,expoRange:S.expo||(S.id===1?[.4,6]:[.08,1.2]),bloom:(S.bloom===undefined?.05:S.bloom)*LOOK.bloom,vig:S.vig,", 'showEnv: the void\'s exposure')
swap("  showBody(dt);\n  const cam=showCam(PIC.w/PIC.h,dt),", "  showBody(dt);showVoidFrame();\n  const cam=showCam(PIC.w/PIC.h,dt),", 'the bay\'s frame: the void\'s upkeep')
swap("  const key=SHOW.stage+(shed?'S':'')+(full?'F':'');", "  const key=SHOW.stage+(SHOW.void?'V':'')+(shed?'S':'')+(full?'F':'');", 'the bay\'s frame: into the void is a cut')
swap("  R.U.uStudio=STAGES[SHOW.stage].id;", "  R.U.uStudio=showStg().id;", 'the bay\'s frame: which studio')
swap("      if(!DYB.under){gl.uniformMatrix4fv(u.uM,false,M4_ID);drawMesh(st.stage);gl.uniformMatrix4fv(u.uM,false,this.Mc);drawMesh(st.table);tris+=st.tris;}}",
     "      if(SHOW.void){if(!probe)tris+=showVoidFloor(u,this.Mc);}\n      else if(!DYB.under){gl.uniformMatrix4fv(u.uM,false,M4_ID);drawMesh(st.stage);gl.uniformMatrix4fv(u.uM,false,this.Mc);drawMesh(st.table);tris+=st.tris;}}", 'the studio: nothing but the car')
# the shaders: the void's flat colour for the camera, a photographer's rig for the reflections; the white void's floor
swap("vec3 studioEnv(vec3 d){\n  float t=d.y;\n  if(uStudio<1.5){",
     """vec3 studioEnv(vec3 d){
  float t=d.y;
  /* the Showroom's voids (sas_show): 3 black, 4 white. The camera sees one flat colour (the frame's fog colour); the
     reflection probe sees the rig that lights the car */
  if(uStudio>2.5){
#ifndef PROBE
    return uFogCol;
#else
    float sd=abs(d.z)/max(length(d.xz),1e-4);
    if(uStudio<3.5){
      vec3 c=vec3(.004,.004,.005);
      if(t>.12){vec2 q=d.xz/t;c+=vec3(1.,.98,.95)*3.*(1.-smoothstep(1.2,1.9,abs(q.x)))*(1.-smoothstep(.4,.75,abs(q.y)));}
      c+=vec3(.9,.94,1.)*1.5*smoothstep(.5,.8,sd)*(1.-smoothstep(.03,.075,abs(t-.17)));
      c+=vec3(1.,.97,.93)*.5*(1.-smoothstep(.2,.5,sd))*(1.-smoothstep(.05,.14,abs(t-.3)));
      return c*STUDIO_K;}
    vec3 c=mix(vec3(.52,.52,.53),vec3(.9,.9,.91),smoothstep(-.3,.02,t));
    c=mix(c,vec3(.6,.6,.61),(1.-smoothstep(.0,.07,abs(t-.035)))*.6);
    c=mix(c,vec3(1.25,1.24,1.22),smoothstep(.12,.55,t));
    if(t>.2){vec2 q=d.xz/t;c+=vec3(1.,.98,.95)*1.4*(1.-smoothstep(1.,1.6,abs(q.x)))*(1.-smoothstep(.4,.7,abs(q.y)));}
    return c*STUDIO_K;
#endif
  }
  if(uStudio<1.5){""", 'the sky: the void')
swap("  col=mix(col,fogFar(dir,dist),fogA);\n  /* (checked on the bits",
     "  col=mix(col,fogFar(dir,dist),fogA);\n  /* (the white void's floor, sas_show: the void's own white, darkened where the car hides the room) */\n  if(uStudio>3.5&&m==21){col=uFogCol*vC.rgb;ssr=0.;}\n  /* (checked on the bits", 'FS: the void\'s floor')
swap("  window.__dyb={FILM,", "  window.__dyb={showStg,VFLOOR,showCanVoid,STAGES,FILM,", 'the tools\' handle: the showroom')

# ======== the Showroom: its detail (the kit and the maker, as text in the page; then the page's side) ========
def text_line(prefix, edit):
    global s
    a, b = line_of(prefix); old = s[a:b]; t = json.loads(old[len(prefix):].rstrip(';'))
    if prefix + js_str(t) + ';' != old: raise SystemExit(prefix + ' does not round-trip')
    t2 = edit(t); s = s[:a] + prefix + js_str(t2) + ';' + s[b:]; return t2
def tswap(t, old, new, why):
    if t.count(old) != 1: raise SystemExit(f'TEXT PATCH FAILED ({why}): found {t.count(old)}')
    return t.replace(old, new)
kit2 = text_line('const S2KIT_SRC=', lambda t: t + rd('src2/kit_show.js'))
mk2 = text_line('const S2MAKE_SRC=', lambda t: tswap(t,
    "  if(T.brake)pack('brake',[T.brake]);if(T.brakeR&&T.brakeR!==T.brake)pack('brakeR',[T.brakeR]);\n",
    "  if(T.brake)pack('brake',[T.brake]);if(T.brakeR&&T.brakeR!==T.brake)pack('brakeR',[T.brakeR]);\n"
    "  /* the showroom's detail (kit_show): pieces of their own, for Salt & Sand's Showroom only; their triangles are\n     counted apart (trisX), as nothing else draws them */\n"
    "  const trisX={};if(K.showDetail&&!(opt&&opt.show===0)){let X=null;try{X=K.showDetail(key,T);}catch(e){X=null;trisX.err=String(e&&e.message||e);}\n"
    "    if(X)for(const [nm,src] of [['bodyX',X.body],['wheelX',X.wheel],['wheelXL',X.wheelL]])if(has(src)){pack(nm,[src]);trisX[nm]=tris[nm];delete tris[nm];}}\n", 's2Make: the showroom pieces'))
mk2b = text_line('const S2MAKE_SRC=', lambda t: tswap(t, "  info.verts=verts;\n", "  info.verts=verts;info.trisX=trisX;\n", 's2Make: their count'))
open(os.path.join(HERE,'kit2_built.js'),'w',encoding='utf-8').write(kit2); open(os.path.join(HERE,'make2_built.js'),'w',encoding='utf-8').write(mk2b)
swap("FIX:['body','hood','liner','engine'],SORT:['body','engine','liner'],last:null};", "FIX:['body','hood','liner','engine','bodyX'],SORT:['body','engine','liner'],last:null};", 'the bake: the showroom\'s body pieces shaded too')
swap("    for(const nm of bt?[wn,bn]:[wn]){const m=S[nm];if(!m||m.oom||!B[nm])continue;G.uni(P.a,'uBase',J.base[nm]);",
     "    for(const nm of (bt?[wn,bn]:[wn]).concat(wn==='wheel'?['wheelX']:wn==='wheelL'?['wheelXL']:[])){const m=S[nm];if(!m||m.oom||!B[nm])continue;G.uni(P.a,'uBase',J.base[nm]);", 'the bake: the showroom\'s wheel pieces shaded too')
swap("    for(const nm of ['body','bodyG','hood','hoodG','liner','engine','wheel','wheelR','wheelL','brake','brakeR'])if(Q[nm]&&!seen.has(Q[nm])){seen.add(Q[nm]);freeMesh(Q[nm]);}}}",
     "    for(const nm of ['body','bodyG','hood','hoodG','liner','engine','wheel','wheelR','wheelL','brake','brakeR','bodyX','wheelX','wheelXL'])if(Q[nm]&&!seen.has(Q[nm])){seen.add(Q[nm]);freeMesh(Q[nm]);}\n    if(Q.floor&&Q.floor.mesh)freeMesh(Q.floor.mesh);}}", 's2Done: the showroom\'s pieces let go')
swap("  Object.assign(S,{pivot:I.pivot,trans:I.trans,tips:I.tips,", "  {const X=I.trisX||{};S.trisX=(X.bodyX||0)+2*(X.wheelX||0)+2*(X.wheelXL||0);if(X.err)console.warn('Showroom detail: '+X.err);}\n  Object.assign(S,{pivot:I.pivot,trans:I.trans,tips:I.tips,", 's2Done: their count')
swap("  gl.uniformMatrix4fv(u.uM,false,Mb);drawMesh(S.body);if(!du&&S.bodyG)drawMesh(S.bodyG);\n  if(S.engine){gl.uniformMatrix4fv(u.uM,false,S.pivot?s2EngM(S,Mb):Mb);drawMesh(S.engine);}",
     "  gl.uniformMatrix4fv(u.uM,false,Mb);drawMesh(S.body);if(!du&&S.bodyG)drawMesh(S.bodyG);\n  /* (the Showroom's detail, sas_show: only there) */\n  const vd=!!SHOW.void;if(vd&&S.bodyX)drawMesh(S.bodyX);\n  if(S.engine){gl.uniformMatrix4fv(u.uM,false,S.pivot?s2EngM(S,Mb):Mb);drawMesh(S.engine);}", 'drawS2Car: the showroom\'s body detail')
swap("drawMesh(s<0&&S.wheelL?S.wheelL:front?S.wheel:S.wheelR);\n    const br=front?S.brake:S.brakeR;",
     "drawMesh(s<0&&S.wheelL?S.wheelL:front?S.wheel:S.wheelR);\n    if(vd){const x=s<0?S.wheelXL:S.wheelX;if(x)drawMesh(x);}\n    const br=front?S.brake:S.brakeR;", 'drawS2Car: the showroom\'s wheel detail')
swap("  if(!du){gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uMudLocal,0);gl.uniform1f(u.uBk,0);}\n  return S.tris;\n}", "  if(!du){gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uMudLocal,0);gl.uniform1f(u.uBk,0);}\n  return S.tris+(vd?S.trisX||0:0);\n}", 'drawS2Car: the count')
swap("const S=DYB.S2.get(k);t=`Studio 2 ${nm} · ${NF.format(Math.round(S.tris))} triangles`;}\n  el.textContent=t;",
     "const S=DYB.S2.get(k);t=`${SHOW.void?'Showroom':'Studio 2'} ${nm} · ${NF.format(Math.round(S.tris+(SHOW.void?S.trisX||0:0)))} triangles`;}\n  el.textContent=t;", 's2Badge: the showroom\'s count')

swap("      fu.uExpoBias = E.expoBias || 1;\n", "      fu.uExpoBias = E.expoBias || 1;\n      /* (a frame may ask for its own darkening toward the corners: the Showroom's voids are flat) */\n      if (E.vig !== undefined) { if (window.__vig0 === undefined) window.__vig0 = fu.uVig; fu.uVig = E.vig; } else if (window.__vig0 !== undefined) fu.uVig = window.__vig0;\n", 'the last pass: a frame\'s own vignette')

open(out, 'w', encoding='utf-8').write(s)
print(f'{out}: {len(s):,} chars (was {n0:,})')
