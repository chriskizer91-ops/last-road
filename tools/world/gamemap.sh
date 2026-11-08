#!/bin/sh
# The game's own big map: the world from above (as tools/world/map.sh draws it, without words), 512 square, into
# src/lr-wmap.js (window.LR_WMAP), which the build puts in the page.
# usage: sh tools/world/gamemap.sh builds/last-road-19.html  (from last-road's top)
set -e; cd "$(dirname "$0")/../.."; W=$(mktemp -d /tmp/lr-map.XXXXXX)
python3 -c "
import sys;s=open('$1').read();i=s.index('function WORLDGEN(SEED){');j=s.index('\nconst WSEED=',i)
open('$W/wg.js','w').write(s[i:j]+'\nmodule.exports=WORLDGEN;\n')"
node tools/world/sample.js "$W" 512
python3 tools/world/draw.py "$W" 512 src/lr-wmap.js
