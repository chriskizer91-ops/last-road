#!/usr/bin/env python3
"""Salt & Sand, Film & Showroom, 3: the Rock & Mud put right, and clear glass in the bay.
usage: python3 -I patch4.py <salt-and-sand-showroom-2.html> <salt-and-sand-showroom-3.html>   (exact swaps)
The pieces: src3/kit_fix.js, added to the kit's end (the mud flaps, the snorkel, the towers over the rear coilovers);
            src3/glass.js, the bay's blended glass (a third build of the lit shader, drawn in the renderer's glass pass)."""
import sys, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read(); n0 = len(s)
def rd(p): return open(os.path.join(HERE, p), encoding='utf-8').read()
def swap(old, new, why, count=1):
    global s
    c = s.count(old)
    if c != count: raise SystemExit(f'PATCH FAILED ({why}): expected {count} match(es), found {c}\n  {old[:160]!r}')
    s = s.replace(old, new)
def js_str(t): return json.dumps(t).replace('<', '\\u003c')
def line_of(prefix):
    a = s.index('\n' + prefix) + 1; b = s.index('\n', a); return a, b
def text_line(prefix, edit):
    global s
    a, b = line_of(prefix); old = s[a:b]; t = json.loads(old[len(prefix):].rstrip(';'))
    if prefix + js_str(t) + ';' != old: raise SystemExit(prefix + ' does not round-trip')
    t2 = edit(t); s = s[:a] + prefix + js_str(t2) + ';' + s[b:]; return t2
def tswap(t, old, new, why, count=1):
    if t.count(old) != count: raise SystemExit(f'KIT PATCH FAILED ({why}): expected {count}, found {t.count(old)}')
    return t.replace(old, new)

# ---- the kit: the Rock & Mud's flaps, snorkel and rear wheel houses (a shared piece: the vehicle models) ----
def kit_edit(t):
    t = tswap(t, "cwSnorkel(t,out);", "cwSnorkel2(t,out);", 'the snorkel, on the pillar', 2)
    t = tswap(t, "cwFlaps(t,out);", "cwFlaps2(t,out);cwHouses(t,out);", 'the flaps, behind their tyres; the towers over the rear coilovers', 2)
    # (the air cleaner's duct ran out through the fender's side to the old snorkel's foot: now to the new one's, inside the cowl's corner)
    t = tswap(t, "Pt(1.27,yS+.01,.66),Pt(1.35,yS,.93)],5,2)", "Pt(1.33,yS+.03,.62),Pt(1.43,yS+.045,.8)],5,2)", 'the duct, to the snorkel\'s new foot')
    return t + rd('src3/kit_fix.js')
kit4 = text_line('const S2KIT_SRC=', kit_edit)
open(os.path.join(HERE, 'kit4_built.js'), 'w', encoding='utf-8').write(kit4)

# ---- the bay's glass, blended (the lit shader gets a third build; the renderer's own glass pass draws it) ----
swap("#ifndef PROBE\nlayout(location=1) out vec4 oNrm;layout(location=2) out vec2 oVel;\n#endif\nvoid main(){\n  /* (a degenerate normal",
     "#ifndef PROBE\n#ifdef GLASS\n/* (the blended glass build, sas_glass: its 2nd and 3rd outputs are written as nothing, so the blend leaves what is\n   behind the glass as it was) */\nlayout(location=1) out vec4 oNrm;layout(location=2) out vec4 oVelG;vec2 oVel;uniform vec4 uGSplit;\n#else\nlayout(location=1) out vec4 oNrm;layout(location=2) out vec2 oVel;\n#endif\n#endif\nfloat gA=1.;\nvoid main(){\n  /* (a degenerate normal", 'FS: the glass build\'s outputs')
swap("  if(em<0.){if(ign(gl_FragCoord.xy,uFrame)>-em*(1.-uSeeX))discard;em=0.;}",
     "#ifdef GLASS\n  if(dot(vec4(vL,1.),uGSplit)<0.)discard;\n  if(em<0.){gA=-em*(1.-uSeeX);em=0.;}\n#else\n  if(em<0.){if(ign(gl_FragCoord.xy,uFrame)>-em*(1.-uSeeX))discard;em=0.;}\n#endif", 'FS: the glass build keeps every pixel')
swap("  oNrm=vec4(octEnc(s.N),s.rough,ssr*(1.-fogA));\n  oVel=(vCur.xy/vCur.w-vPrev.xy/vPrev.w)*.5;\n#endif\n}`;",
     "  oNrm=vec4(octEnc(s.N),s.rough,ssr*(1.-fogA));\n  oVel=(vCur.xy/vCur.w-vPrev.xy/vPrev.w)*.5;\n#ifdef GLASS\n  oCol=vec4(col*gA,gA);oNrm=vec4(0.);oVelG=vec4(0.);\n#endif\n#endif\n}`;", 'FS: the glass build\'s blend')
swap("let P_LAND=null,P_LANDP=null,P_DEPTH=null;", "let P_LAND=null,P_LANDP=null,P_DEPTH=null,P_LANDG=null;", 'the third lit program')
swap("landDrop(old);R.resetTAA=true;}", "landDrop(old);if(P_LANDG){landDrop([P_LANDG]);P_LANDG=null;}R.resetTAA=true;}", 'landRebuild: the glass build goes with the old ones, to be made again')
swap("list = G.programs.filter((P) => !P.ready && !/^s2bk/.test(P.name));", "list = G.programs.filter((P) => !P.ready && !/^(s2bk|landGlass)/.test(P.name));", 'warmup: the glass build is not waited for')
anchor = "/* =====================================================================================\n   SALT & SAND: the Dyno Bay's garage and dyno as the menu"
swap(anchor, rd('src3/glass.js') + anchor, 'the glass module')
swap("      if(SHOW.void){if(!probe)tris+=showVoidFloor(u,this.Mc);}\n", "      if(S2G.pass)return drawShowCar(APP.bi,this.Mcar,SHOW.hoodA,true,false,0,null);\n      if(SHOW.void){if(!probe)tris+=showVoidFloor(u,this.Mc);}\n", 'the studio: the glass pass draws the car\'s glass only')
swap("gl.uniform1f(u.uBk,s2BkK(S));}\n  const Mb=s2BodyM(S,Mc);",
     """gl.uniform1f(u.uBk,s2BkK(S));}
  const Mb=s2BodyM(S,Mc);
  /* (the blended glass pass, sas_glass: only what you see through, on the body and on the hood) */
  if(S2G.pass){const cm=S2G.cam||[0,0,0],ex=cm[0]-Mb[12],ey=cm[1]-Mb[13],ez=cm[2]-Mb[14];
    let dx=ex*Mb[0]+ey*Mb[1]+ez*Mb[2]+.4,dz=ex*Mb[8]+ey*Mb[9]+ez*Mb[10];const dl=Math.hypot(dx,dz)||1;dx/=dl;dz/=dl;
    let Mh=Mb;if(S.hoodG){const ha=sstep(0,1,hoodA);if(ha>0){const [hx,hy]=S.hinge;Mh=M4.mul(Mb,M4.mul(M4T(hx,hy,0),M4.mul(M4RZ(ha*S.hoodOpen),M4T(-hx,-hy,0))));}}
    for(const sg of [-1,1]){gl.uniform4f(S2G.loc,sg*dx,0,sg*dz,sg*.4*dx);
      if(S.bodyG){gl.uniformMatrix4fv(u.uM,false,Mb);drawMesh(S.bodyG);}
      if(S.hoodG){gl.uniformMatrix4fv(u.uM,false,Mh);drawMesh(S.hoodG);}}
    gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uMudLocal,0);gl.uniform1f(u.uBk,0);return 0;}
  const gb=!du&&S2G.main&&s2GlassOn();if(gb)S2G.left=1;""", 'drawS2Car: the glass pass')
swap("drawMesh(S.body);if(!du&&S.bodyG)drawMesh(S.bodyG);", "drawMesh(S.body);if(!du&&S.bodyG&&!gb)drawMesh(S.bodyG);", 'drawS2Car: the body\'s glass left to the glass pass')
swap("if(!du&&S.hoodG)drawMesh(S.hoodG);if(S.liner)drawMesh(S.liner);\n  /* a bang in the pipes throws a flame out of each of Studio 2's own tips */", "if(!du&&S.hoodG&&!gb)drawMesh(S.hoodG);if(S.liner)drawMesh(S.liner);\n  /* a bang in the pipes throws a flame out of each of Studio 2's own tips */", 'drawS2Car: the hood\'s glass left to the glass pass')
swap("const LOOK_DEF={sat:1,con:1,key:1,haze:1,detail:1,shadows:1,occ:1,carShade:1,carLean:1,softFly:1,", "const LOOK_DEF={sat:1,con:1,key:1,haze:1,detail:1,shadows:1,occ:1,carShade:1,carLean:1,softFly:1,glass:1,", 'the look: the glass switch')
swap("a little under what a real microphone hears. Off, as before.']];",
     "a little under what a real microphone hears. Off, as before.'],\n  ['glass','Clear glass in the bay','In the bay and the Showroom, a Studio 2 car\\'s windows and lamp lenses blended properly over what is behind them. Off, the dotted see-through, as before (and as on the road).']];", 'the Dev panel: its switch')
swap("  opaque(R,U,texs){const G=R.G,P=G.use(P_LAND);gl.disable(gl.CULL_FACE);G.set(P,U);G.tex(P,texs);this.tris=this.draw(P,false,false);},", "  opaque(R,U,texs){const G=R.G,P=G.use(P_LAND);gl.disable(gl.CULL_FACE);G.set(P,U);G.tex(P,texs);S2G.main=1;try{this.tris=this.draw(P,false,false);}finally{S2G.main=0;}},", 'the studio: its solid pass says so')
swap("  window.__dyb={s2BakeReady,", "  window.__dyb={s2GlassOn,S2G,s2BakeReady,", 'the tools\' handle')

open(out, 'w', encoding='utf-8').write(s)
print(f'{out}: {len(s):,} chars (was {n0:,})')
