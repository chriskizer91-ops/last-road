# The Rock & Mud (the truck)

Its source is the Studio 2 Rock & Mud in `chriskizer91-ops/salt-mini-plus` (`models/src`, built from code, game build id
`crawler`): 790,531 triangles. Kept there; not in this game.

## Play models (the look test, Nov 7 2026)

The game's own Rock & Mud shape cut down (`tools/play_lod.py`), the Studio 2 baked onto it (salt-mini-plus
`models/tools/bake.py`: colour, normals, shade, roughness, metal, clear coat; 2048 for the body, 1024 for the wheel),
packed in the game's mesh form (salt-mini-plus `models/tools/pack_game.py`) as `play/crawler_t<count>_s2.js`.

| Version | Triangles | Body | Lamps | Glass | Underside | Each wheel | Wheels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Play 10k | 9,959 | 7,502 | 685 | 298 | 130 | 336 (24 sides, tread painted on) | 1,344 |
| Play 25k | 24,898 | 19,935 | 685 | 644 | 178 | 864 (36 sides, tread painted on) | 3,456 |
| Play 50k | 49,654 | 23,471 (the game's whole shape) | 685 | 644 | 178 | 6,169 (the Studio 2's knobby tyre, cut down) | 24,676 |

- 12 draws each; pictures 96 MB of graphics memory at 2048, 24 MB at 1024, 6 MB at 512 (the page's Pictures buttons).
- The glass is solid (no cabin behind it), as for traffic.
- Known: inside the wheel arches there's a jagged pattern. It's in the game's own Rock & Mud shape too (`docs/look-test/wheel-arch-game-own.png`), not a bake fault; the Studio 2's arches are clean. To fix: darken those inner faces.
- Rebuild: Blender's Python with `tools/play_lod.py` on salt-mini-plus `export_parts.js` (ALT=2) output, then `bake.py` and `pack_game.py`
  (the exact commands are in `tools/look-test/README.md`).
