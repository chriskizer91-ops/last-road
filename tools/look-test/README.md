# The look test

`docs/look-test/rock-mud-look-test.html`: the Rock & Mud's Studio 2 beside the three play models, on the salt flat from
the game's Chase and Far cameras, the Wheel cam and the Tracking car, or on the studio backdrop. `rock-mud-look-test-sheet.png`
is every version from the same four cameras.

Made like this (Nov 7 2026; salt-mini-plus at /home/claude/salt-mini-plus, Blender's Python as PY):

    ALT=2 node --max-old-space-size=5000 models/tools/export_parts.js crawler /tmp/rm            # in salt-mini-plus
    WSTEPS=24 $PY <last-road>/tools/play_lod.py /tmp/rm/bake-in /tmp/rm/p10000 10000            # 25000: WSTEPS=36; 50000: WHIGH=6200
    # a bake-in copy with the cut-down low_*.bin and their counts in its manifest, then:
    $PY models/tools/bake.py <that copy> /tmp/rm/po10000 2048 1024 16
    python3 models/tools/pack_game.py /tmp/rm/po10000 crawler_t10000_s2 <last-road>/models/rock-mud/play/crawler_t10000_s2.js 85
    DATA=models/rock-mud/play sh tools/look-test/build.sh                                         # in last-road
    python3 tools/look-test/shoot.py docs/look-test/rock-mud-look-test.html <out-dir>            # the pictures
