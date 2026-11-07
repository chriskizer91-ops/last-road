#!/bin/sh
# The world seen from straight above (no game needed): the world generator cut out of a build, sampled on a grid in
# node, drawn shaded by height and coloured by its ground, with the strips and Last Road marked.
# usage: sh tools/world/map.sh builds/last-road-6.html [grid, default 400] -> docs/world/map.png  (from last-road's top)
set -e; cd "$(dirname "$0")/../.."; W=$(mktemp -d /tmp/lr-map.XXXXXX)
python3 -c "
import sys;s=open('$1').read();i=s.index('function WORLDGEN(SEED){');j=s.index('\nconst WSEED=',i)
open('$W/wg.js','w').write(s[i:j]+'\nmodule.exports=WORLDGEN;\n')"
node tools/world/sample.js "$W" ${2:-400}
python3 tools/world/draw.py "$W" ${2:-400} docs/world/map.png
