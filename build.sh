#!/bin/sh
# Beyond the Last Road's page, from salt-mini-plus (SMP: Salt & Sand, the plane and its code) and this repo:
#   1. the plane into Salt & Sand (salt-mini-plus redtail/game: glb2js.py, rt_patch.py)
#   2. this game's own swaps and code (src/lr_patch.py, src/lr-game.js) and the truck's play model
#      (models/rock-mud/play/rock-mud-play-50k.js, from tools/truck_pack.py)
# usage: sh build.sh [out-name]   (from this repo's top; SMP=<path to salt-mini-plus>, default ../salt-mini-plus)
set -e
cd "$(dirname "$0")"; LR=$(pwd); SMP=$(cd "${SMP:-$LR/../salt-mini-plus}" && pwd); OUT=${1:-last-road-0}
B=$(mktemp /tmp/lr-base.XXXXXX.html)
(cd "$SMP" && python3 redtail/game/glb2js.py >/dev/null && python3 redtail/game/rt_patch.py salt-and-sand/salt-and-sand.html "$B" >/dev/null)
mkdir -p builds
python3 src/lr_patch.py "$B" "builds/$OUT.html" "${TRUCK:-models/rock-mud/play/rock-mud-play-50k-station-sand.js}"
rm -f "$B"; ls -la "builds/$OUT.html"
