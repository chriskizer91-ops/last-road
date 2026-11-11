#!/bin/sh
# The combined game (working title: Ground Truth Continued), built from this repo alone:
#   1. the engine page (combined/base) through Salt & Sand's four steps (combined/sas: lean car, Film & Showroom, the
#      loader, the Rock & Mud fixes and clear glass), checked against Showroom 3's fingerprint
#   2. the bridge (combined/src/gtc_bridge.py: the car's shade off vertex slot 4)
#   3. the plane (combined/plane: salt-mini-plus redtail/game, unchanged)
#   4. Ground Truth (src/lr_patch.py, src/lr-game.js, src/gt-world.js and the data files)
#   5. the combined game's own swaps (combined/src/gtc_patch.py)
# usage: sh combined/build.sh <out-name>      (from anywhere; writes builds/<out-name>.html)
set -e
OUT=${1:?give the build a name, e.g. ground-truth-continued-1}
TOP=$(cd "$(dirname "$0")/.." && pwd); C=$TOP/combined; W=$(mktemp -d /tmp/gtc-build.XXXXXX)
python3 -I "$C/sas/patch.py"  "$C/base/engine-salt-and-sand.html" "$W/1.html" >/dev/null
python3 -I "$C/sas/patch2.py" "$W/1.html" "$W/2.html" >/dev/null
python3 -I "$C/sas/patch3.py" "$W/2.html" "$W/3.html" >/dev/null
python3 -I "$C/sas/patch4.py" "$W/3.html" "$W/4.html" >/dev/null
[ "$(sha256sum "$W/4.html" | cut -d' ' -f1)" = "$(cat "$C/sas/showroom-3.sha256")" ] || { echo "Salt & Sand's steps no longer make Showroom 3"; exit 1; }
python3 -I "$C/src/gtc_bridge.py" "$W/4.html" "$W/5.html"
(cd "$C/plane" && python3 -I redtail/game/glb2js.py redtail/versions/redtail-2/redtail-2.glb "$W/rt2-data.js" >/dev/null && python3 -I redtail/game/rt_patch.py "$W/5.html" "$W/6.html" "$W/rt2-data.js" >/dev/null)
mkdir -p "$TOP/builds"
(cd "$TOP" && python3 src/lr_patch.py "$W/6.html" "builds/$OUT.html" "${TRUCK:-models/rock-mud/play/rock-mud-play-50k-station-sand.js}" >/dev/null)
python3 -I "$C/src/gtc_patch.py" "$TOP/builds/$OUT.html"
rm -rf "$W"; ls -la "$TOP/builds/$OUT.html"
