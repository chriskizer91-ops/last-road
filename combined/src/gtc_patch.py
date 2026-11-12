"""THE COMBINED GAME'S OWN SWAPS (working title: Ground Truth Continued), run last, on the page Ground Truth's
src/lr_patch.py wrote. Each swap must match exactly once, so a change upstream fails loudly.
usage: python3 -I gtc_patch.py <page.html>      (changed in place)"""
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
def swap(old, new, n=1):
    global s
    c = s.count(old); assert c == n, 'expected %d, found %d: %r' % (n, c, old[:90]); s = s.replace(old, new)

# ---------- BUILD 1. THE STUDIO 2 CAR IS THE OUTFITTER'S. In Salt & Sand the Studio 2 car is the one you drive, so its
# shade is baked a few directions a frame wherever you are, and a line at the top of the screen says how far along it is.
# Here you drive the 50k play model: out on the road the bake waits (it goes on when you're back in the Outfitter, or
# under the title) and the line stays off the driving screen. ----------
swap("  s2BakeStep();\n  /* the opening screen and the garage: the showroom (63_showroom) */",
     "  if(showActive()&&gtcBakeOk()){s2BakeStep();if(S2B.job&&GFX.frame%30===0&&$('s2b')&&$('s2b').hidden)s2Badge();}   /* (back in the Outfitter the line comes back with the bake) */\n  /* the opening screen and the garage: the showroom (63_showroom) */")
swap("else if(k&&DYB.S2.has(k)&&DYB.S2.get(k).bk&&S2B.N>0){const S=DYB.S2.get(k),J=S2B.job;",
     "else if(showActive()&&k&&DYB.S2.has(k)&&DYB.S2.get(k).bk&&S2B.N>0){const S=DYB.S2.get(k),J=S2B.job;")

# ---------- BUILD 1. THE SHOWROOM IS THE SUVS'. Salt & Sand offers the Showroom for the SUV Stock and the Rock & Mud; here
# the turntable can hold the Heron too: with the Heron on it the switch goes (and the void with it). ----------
swap("const showCanVoid=()=>{const k=s2Key(APP.bi);return k==='stock'||k==='crawler';};",
     "const showCanVoid=()=>{const k=s2Key(APP.bi);return (k==='stock'||k==='crawler')&&!(typeof LRO!=='undefined'&&LRO.heron);};")

# ---------- BUILD 2. THE GRAPHICS CARD (gtc-game.js has the why). The engine's own line when the card is reset under
# the page said "the phone"; it now comes from gtcLost(), which also leaves a note for the next title. The bake of the
# Studio 2 car's shade asks gtcBakeOk() first (the swap above). The page's name while it loads. ----------
swap("L.textContent='The phone restarted its graphics. Starting again\u2026';", "L.textContent=gtcLost();")
swap("<title>Beyond the Last Road (working title)</title>", "<title>Ground Truth Continued (working title)</title>")

# ---------- THE COMBINED GAME'S OWN CODE (combined/src/gtc-game.js), after Ground Truth's, before the boot ----------
import os
B = "/* =====================================================================================\n   THE BOOT:"
swap(B, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gtc-game.js'), encoding='utf-8').read() + '\n' + B)

open(p, 'w', encoding='utf-8').write(s)
print('combined game: ok')
