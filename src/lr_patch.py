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
# the code, just before the boot (after the plane's); the truck's data before the game's script (beside the plane's)
B = "/* =====================================================================================\n   THE BOOT: the dots"
swap(B, open(sys.path[0] + '/lr-game.js', encoding='utf-8').read() + '\n' + B)
i = s.index('<script>window.RT2_DATA') if '<script>window.RT2_DATA' in s else None
assert i is not None, 'the plane data script'
s = s[:i] + '<script>' + open(data, encoding='utf-8').read() + '</script>\n' + s[i:]
open(dst, 'w', encoding='utf-8').write(s)
print('written', dst, len(s))
