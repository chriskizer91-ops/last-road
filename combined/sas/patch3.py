#!/usr/bin/env python3
"""Salt & Sand, Film & Showroom, 2: the loading screen can't freeze on a slow shader build.
usage: python3 -I patch3.py <salt-and-sand-showroom.html> <salt-and-sand-showroom-2.html>   (exact swaps, each once)

What happened on the laptop (Windows, Edge): the loading screen stood at "Warming up the shaders 22 / 24" with the
fan running. Windows browsers turn every shader into the graphics driver's own language and build it the first time
they meet it (then keep the result on disk). The lean page was the first in a long while to change the game's biggest
shader, so its two forms had to be built from cold; the loader waited 60 s, then stopped the whole page to wait for
them, which looks like a hang. Here:
- the loader waits without stopping the page (up to 15 minutes), counts the seconds, and names what is still being
  built, with a line saying the first time can take minutes;
- the three small programs of the car's bake (s2bk...) are no longer waited for at the start; the bake starts once
  they are built, and is left out if they aren't after 30 s (the car is then drawn with every triangle, no shade)."""
import sys
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read(); n0 = len(s)
def swap(old, new, why, count=1):
    global s
    c = s.count(old)
    if c != count: raise SystemExit(f'PATCH FAILED ({why}): expected {count} match(es), found {c}\n  {old[:160]!r}')
    s = s.replace(old, new)

swap("      const par = ext.par, list = G.programs.filter((P) => !P.ready);\n      const t0 = performance.now();",
     "      /* (the Studio 2 bake's own small programs are not waited for here: 63_s2lean s2BakeReady) */\n      const par = ext.par, list = G.programs.filter((P) => !P.ready && !/^s2bk/.test(P.name));\n      const t0 = performance.now();", 'warmup: not the bake\'s programs')
swap("          onProgress && onProgress(done, list.length);\n          if (done === list.length || performance.now() - t0 > 6e4) break;\n          await new Promise((r) => setTimeout(r, 30));",
     "          /* (a driver building a big shader from cold can take minutes: the page keeps running and says what it is\n             waiting for, instead of stopping dead after a minute) */\n          const sec = (performance.now() - t0) / 1e3;\n          onProgress && onProgress(done, list.length, sec > 8 ? list.filter((P) => !gl.getProgramParameter(P.p, par.COMPLETION_STATUS_KHR)).map((P) => P.name) : [], sec);\n          if (done === list.length || sec > 900) break;\n          await new Promise((r) => setTimeout(r, sec > 8 ? 250 : 30));", 'warmup: wait without stopping the page')
swap("      await R.G.warmup((d,n)=>{L.textContent='Warming up the shaders '+d+' / '+n+(built?' · the garage '+built+' / '+park.length:'');});",
     "      await R.G.warmup((d,n,wait,sec)=>{L.textContent='Warming up the shaders '+d+' / '+n+(built?' · the garage '+built+' / '+park.length:'')+\n        (wait&&wait.length?' · '+Math.round(sec)+' s. The first time on this computer its graphics driver has to build them (still on: '+wait.join(', ')+'). That can take a few minutes; after that it opens quickly.':'');});", 'the loading line: what it is waiting for')
swap("function s2BakeStep(){\n  let J=S2B.job;\n  if(!J){let S=null;",
     """/* the bake's three programs, built in the background from the start: ready yet? Not after 30 s: the bake is left out
   (each car is then drawn lean, with every triangle and no shade) rather than the game made to wait */
function s2BakeReady(){
  const P=S2B.P;if(!P)return false;if(S2B.rdy)return true;const par=gl.getExtension('KHR_parallel_shader_compile'),L=[P.d,P.a,P.r];
  if(par&&!L.every(q=>q.ready||gl.getProgramParameter(q.p,par.COMPLETION_STATUS_KHR))){S2B.t0=S2B.t0||performance.now();
    if(performance.now()-S2B.t0>3e4){console.warn('Studio 2 bake: its programs were not built after 30 s; left out');S2B.P=null;S2B.N=0;}
    return false;}
  try{for(const q of L)R.G.finish(q);}catch(e){console.warn('Studio 2 bake: '+(e&&e.message||e));S2B.P=null;S2B.N=0;return false;}
  return S2B.rdy=true;}
function s2BakeStep(){
  let J=S2B.job;
  if(!J&&S2B.q.length&&S2B.P&&!s2BakeReady())return;
  if(!J){let S=null;""", 's2BakeStep: only once its programs are built')
swap("  window.__dyb={showStg,", "  window.__dyb={s2BakeReady,showStg,", 'the tools\' handle')
open(out, 'w', encoding='utf-8').write(s)
print(f'{out}: {len(s):,} chars (was {n0:,})')
