#!/bin/sh
# Paint finished models again from their sheets (after a change to the painting), with no helper call:
# project.py, render.py, compare.py, then keep.py.  usage: sh tools/models/repaint.sh <ID> ...  (from last-road's top)
cd "$(dirname "$0")/../.."; BL=/home/claude/bl/bin/python
for ID in "$@"; do D=models/assets/$ID; R=$(python3 -c "import re;print(re.search(r'res = (\d+)|RES = int\(.*?(\d+)',open('$D/log.txt').read()) and 1024 or 1024)")
  python3 tools/models/project.py $D $D/sheet.png $D/views.json ${RES:-1024} | tail -1
  $BL tools/models/render.py $D $D/sheet.png 400 >/dev/null 2>&1; python3 tools/models/compare.py $D $D/sheet.png $D/compare.png >/dev/null 2>&1; done
python3 tools/models/keep.py >/dev/null
