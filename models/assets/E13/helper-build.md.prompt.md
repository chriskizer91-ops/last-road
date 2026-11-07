You're building a 3D model for a video game from a reference sheet that Christopher (the game's maker; he can't code)
made in ChatGPT. The game is Ground Truth: a grounded, realistic exploration game in a dry interior country, played on a
phone, drawn by a WebGL renderer. The model you write is the SOURCE model: detailed in its shape, but its surface (rust,
planks, corrugation, cracks, dirt, painted letters) comes from the sheet itself, which is painted onto your model
afterwards by matching your model's outline to each flat view on the sheet. So the outlines must match the sheet.

THE SHEET: E13 · Rope, harness, carabiners (SET). What it's for: Rope drops at the Alcove and down the Sunken City's stair.. The image is 1536 x 1024 pixels.

Write two things, in this order, and nothing else:

1. A JSON block (```json) describing what's on the sheet:
{"objects": [{"name": "<a_short_name>", "size_m": [width_x, height_y, depth_z],
   "views": [{"label": "<the view's name on the sheet>", "box": [x0, y0, x1, y1], "cam": [cx, cy, cz], "up": [ux, uy, uz]}]}],
 "notes": "<one or two lines: what the object is, its size from the scale bar, anything unclear>"}
- One entry in "objects" per separate thing on the sheet you're modelling (a building is one; a set of gear is several).
  For a sheet that shows one thing, use one object.
- "box": the pixel rectangle of that drawing of the object on the sheet (just the drawing, not its label text), as
  tight as you can judge, in this image's pixels (0,0 top left).
- "cam": the direction from the object toward the camera, in the model's own axes (below). "up": the model's direction
  that points up the image in that view. Front view: cam [0,0,1], up [0,1,0]. Back: cam [0,0,-1], up [0,1,0]. The side
  on +x: cam [1,0,0]; the side on -x: cam [-1,0,0] (up [0,1,0]). Top: cam [0,1,0] and up = whichever model direction
  points up the picture (e.g. [0,0,-1] when the front is at the bottom of the top view).
- List ONLY the flat, straight-on views (front, back, sides, top). Leave out three-quarter and perspective drawings and
  photos of the whole scene. But list EVERY flat view the sheet has: when it draws both sides, list both (one on +x,
  one on -x); a face no view shows gets only a guess at its colour.

2. A JavaScript block (```js) with exactly one function: function build(THREE) { ... } that returns a THREE.Group
   (for one object), or a plain object { <name>: THREE.Group, ... } with the same names as the JSON (for several).
   - The model's axes: metres; y up; the object stands on y = 0, centred on x = 0, z = 0; its FRONT faces +z.
   - Use only three.js's own geometries (BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry, TorusGeometry,
     LatheGeometry, ExtrudeGeometry with THREE.Shape, TubeGeometry with a THREE.CatmullRomCurve3 or LineCurve3,
     PlaneGeometry only for flat cloth or signs) and Mesh, Group; transforms with position, rotation and scale.
   - Name every Mesh by its material in lower_case_words (e.g. 'rusty_iron', 'timber', 'concrete', 'stone', 'glass',
     'canvas', 'rubber', 'paint_green') and give it a new THREE.MeshStandardMaterial({color: 0xRRGGBB}) close to that
     material's average colour on the sheet. Reuse one material object per name.
   - Sizes from the scale bar; proportions straight from the flat views, so your outline overlays them.
   - Model in 3D what changes the outline or casts a real shadow (legs, posts, rafters, ladders, railings, eaves, steps,
     doors set in, pipes, handles, wheels). Leave to the picture what's only surface (corrugation ripples, plank lines,
     rivets, rust, cracks, writing).
   - Walls and roofs have thickness (thin boxes), so they can be seen from both sides. Interiors only where the sheet
     shows an open front (an open shed, a doorway you can see into: then a simple inside).
   - Triangle budget for this model: at most 5,000 triangles in all (count cylinder segments wisely: 8 to 16 for
     posts and pipes, 24 to 32 for big round tanks). No loops that make more than 2,000 meshes.
   - No textures, images, randomness that changes between runs (use a fixed seeded sequence if you vary things), no
     imports, no DOM. It runs in Node with three.js passed in.
