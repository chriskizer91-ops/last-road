- **Lantern:** proportions, heights, cage, cap, bail and dial all match the sheet (Front, Back and Top fits are 0.86–0.95). The side views score lower because the hands overlap the lantern in those panels, not because the shape is wrong. The geometry stays as it is.
- **carry_hand Back box is wrong:** [619, 0, 742, 126] stops at the wrist strap. The fist sits over the bail centre (about x 808) and reaches about x 848. The fist was being painted from the cuff and strap pixels. Widened it.
- **carry_hand Left Side box** cuts the knuckles just past the bail rod (about x 1103). Widened it slightly.
- **Missing free_hand view:** the Right Side panel draws the free hand clearly (about x 333–425, y 236–408). It shows fingers down and toward +z, the palm toward +x and the cuff up toward −z, which matches the model's pose. Without this view, the +x face (the palm) was painted by guess, which is the patchy camo in the compare renders. Added it. The Left Side panel hides that hand behind the lantern, so it stays out.
- **Pose differences left alone:** the sheet itself poses the carry arm differently across views. The side views drop it steeply toward −z, while the Top view swings it toward +z. The model keeps a compromise that fits the four elevation views, so no build change.

```json
{
  "objects": [
    {
      "name": "lantern",
      "size_m": [0.121, 0.24, 0.124],
      "views": [
        {"label": "Front", "box": [124, 79, 292, 410], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Right Side", "box": [393, 78, 567, 410], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "Back", "box": [722, 79, 893, 410], "cam": [0, 0, -1], "up": [0, 1, 0]},
        {"label": "Left Side", "box": [1033, 78, 1172, 410], "cam": [-1, 0, 0], "up": [0, 1, 0]},
        {"label": "Top", "box": [1254, 136, 1398, 274], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "carry_hand",
      "size_m": [0.171, 0.10, 0.141],
      "views": [
        {"label": "Front", "box": [158, 0, 386, 142], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Right Side", "box": [433, 0, 606, 207], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "Back", "box": [619, 0, 848, 128], "cam": [0, 0, -1], "up": [0, 1, 0]},
        {"label": "Left Side", "box": [953, 0, 1116, 217], "cam": [-1, 0, 0], "up": [0, 1, 0]},
        {"label": "Top", "box": [1310, 66, 1536, 302], "cam": [0, 1, 0], "up": [0, 0, -1]}
      ]
    },
    {
      "name": "free_hand",
      "size_m": [0.077, 0.182, 0.19],
      "views": [
        {"label": "Front", "box": [14, 184, 102, 416], "cam": [0, 0, 1], "up": [0, 1, 0]},
        {"label": "Right Side", "box": [333, 236, 425, 408], "cam": [1, 0, 0], "up": [0, 1, 0]},
        {"label": "Back", "box": [888, 194, 992, 397], "cam": [0, 0, -1], "up": [0, 1, 0]}
      ]
    }
  ],
  "notes": "Small olive-green camping lantern (10 cm bar = 138 px: about 12 cm across, 20 cm body, 24 cm to the bail top) with a frosted glass globe in a rusty 8-bar cage and a front dial. It comes with a gloved right hand gripping the bail (khaki sleeve, cut off by the panel edges) and an open left glove. Each hand is centred on its own origin; userData.offsetFromLantern puts it back in place (carry about [0.05,0.19,-0.035], free about [-0.114,-0.007,0.03]). The sheet poses the hands slightly differently in each view: the top view swings the carry arm toward +z while the side views drop it toward -z. The free hand shows clearly in the Right Side panel (palm toward +x, fingers down and toward +z, cuff up and back), so that view paints its palm side. In the Left Side panel it is hidden behind the lantern, and the Top view shows it in another pose, so free_hand uses Front, Right Side and Back. The carry hand Back box now spans the whole fist over the bail, not just the cuff and strap."
}
```