#!/bin/sh
# A list of pictures through the model builder, three at a time (the helpers' waits overlap; the building here is brief).
# usage: sh tools/models/run_batch.sh <list: ID budget size per line> [how many at once]   (from last-road's top)
cd "$(dirname "$0")/../.."; mkdir -p /tmp/lr-models
grep -v '^#' "$1" | xargs -P "${2:-3}" -L 1 sh -c 'python3 tools/models/run_asset.py "$0" "$1" "$2" > /tmp/lr-models/$0.log 2>&1; echo "$0 finished"'
