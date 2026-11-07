#!/bin/sh
# The look test page: last-road docs/look-test/rock-mud-look-test.html, from this folder's lookrm.js and lookrm_head.html,
# salt-mini-plus's viewer (mats.js, three.js, the models' code) and the play models' data (DATA=<folder of crawler_t*_s2.js>).
# usage: SMP=<salt-mini-plus> DATA=<folder> sh tools/look-test/build.sh   (run from last-road's top; npm ci in SMP/viewer once)
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LR=$(cd "$HERE/../.." && pwd); SMP=${SMP:-/home/claude/salt-mini-plus}; DATA=${DATA:-$LR/models/rock-mud/play}
cp $HERE/lookrm.js $SMP/viewer/src/_lookrm.js
B=$(mktemp /tmp/lr-look.XXXXXX.js); C=$(mktemp /tmp/lr-models.XXXXXX.js)
(cd $SMP/viewer && npx esbuild src/_lookrm.js --bundle --minify --format=iife --target=es2020 --outfile=$B --log-level=warning); rm $SMP/viewer/src/_lookrm.js
M=$SMP/models/src
{ for f in $M/game/*.js $M/hd/*.js; do cat "$f"; printf '\n;\n'; done
  for d in $M/cars/*/; do for f in "$d"*.js; do cat "$f"; printf '\n;\n'; done; done; } > $C
mkdir -p $LR/docs/look-test
{ cat $HERE/lookrm_head.html; printf '<script>\n'; cat $C; for f in $DATA/crawler_t*_s2.js; do cat "$f"; printf '\n;\n'; done
  printf '</script>\n<script>\n'; cat $B; printf '\n</script>\n</body></html>\n'; } > $LR/docs/look-test/rock-mud-look-test.html
rm -f $B $C; echo "rock-mud-look-test.html: $(wc -c < $LR/docs/look-test/rock-mud-look-test.html) bytes"
