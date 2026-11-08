# Ground Truth

*A story and exploration game by Christopher (earlier working title: Beyond the Last Road). You explore a huge wild country, mostly in an off-road truck, partly from a bush plane, and on foot wherever there's something to see up close: temples, ruins, canyons. The plane can fly over everything but can land only on a few dirt strips. The truck reaches what the plane can't, and your own feet reach what the truck can't.*

This file is the plan. It's written so that a fresh Claude session (or this one) can pick the game up and build it with Christopher, step by step. The game's code, builds, pictures and models go in this repo. Before changing anything, read **How to work with Christopher** at the bottom. Keep this file up to date as he decides things.

## What he asked for (Nov 7 2026, in his words)

> "I want to make a story that uses the mud and rock off road SUV and the bush plane… I want it to be able to run on my phone and also visually look as good as the current airplane and SUV in game look. We can have a sandy dune region. We can have a savanna region. We can make more digital assets for the game, whatever we need."

> "I think the game should be mainly SUV exploration, and you get out and walk around a temple or something, and then … a significant portion of exploration is by plane … open world where you can fly, but you can't land … we fill in the end gaps of close-up exploring stuff on foot … a lot of travel between walking around spaces … a central little town hub."

## Where things stand (Nov 7 2026)

- **The look test is made:** `docs/look-test/rock-mud-look-test.html` and its sheet. The Rock & Mud's Studio 2 is shown beside play models of 9,959, 24,898 and 49,654 triangles (see `models/rock-mud/README.md`). From the Chase camera all four look nearly the same. Up close, the 10k and 25k tyres read smooth (their tread is painted on), while the 50k has the Studio 2's own knobby tyres. **His pick, on his phone: the 50k with 1024 pictures.** He judged it good even for close inspection while driving; the 10k and 25k are good enough for a game, but the 50k looks significantly better.
- **Fable's brainstorm:** `design/fable-brainstorm-2026-11-07.md`. **He likes all of it** (Nov 7 2026); he picked its title, *Ground Truth*, and the plane's name from its list, *Heron*. In it:
  - the story: a contract bush pilot surveying the interior for an archaeologist, finding the Old Hands' water channels that lead to a city buried in the dunes;
  - the plane's name as your radio call sign, and the town *Roadhead*;
  - a 48 km map with seven regions and 12 strips;
  - 13 story missions, about 30 pieces of gear, and about 120 pictures.
- **The picture prompts:** `design/picture-prompts.md`, and as a page with Copy buttons: `design/picture-prompts.html` (also published as his private claude.ai page *Ground Truth · picture prompts*; rebuilt by `tools/prompts_page.py` from `design/picture-prompts.json`). Batch 1 doesn't depend on the story; Batch 2 is the story's places and people, now okayed. He's making the pictures (Nov 7 2026).
- **Paint templates:** `pictures/templates/` (the truck's five views and the plane's).
- **The first page of the game: `builds/last-road-0.html`** (`sh build.sh`), from Salt & Sand + the plane + `src/lr_patch.py` and `src/lr-game.js`:
  - its own saves (`lr:`);
  - the Rock & Mud you drive is the 50k play model, its pictures at 1024 on a phone and 2048 on a laptop; the whole frame on the road is about 94,000 to 134,000 triangles (Salt & Sand: about 850,000);
  - the Heron in Wilderness Olive;
  - the plane's HUD without the car's TC, ABS and ESC lights or a gear number;
  - a chase camera that follows the Heron's climbs, dives and banks.

  Tested in the test browser at phone size (`tools/test/lr-run.py`). Still the car in the bay: the Outfitter is next.
- **The newest build: `builds/last-road-20.html`** (Nov 7 2026, 34 MB). Each step has its own file (never overwritten):
  - **last-road-20: the maps show the job you're on** (his call, Nov 7 2026). The corner map: a dotted gold line from you toward the job's next stop (to the map's edge when the stop is off it; ringed when it's on it). The big map (M, or tap the corner map) is now the whole world from above (`tools/world/gamemap.sh` -> `src/lr-wmap.js`, 70 KB): the twelve strips by name, Roadhead in gold, a dot in their colour for each person with work for you, the job's stop ringed with the line to it, and at the top the job, what's next and how far.
  - **last-road-19: Campaign and Free play** (his call, Nov 7 2026: "a free play and campaign start like the other game"). The title has **CAMPAIGN** (the story from First Light: Dell calls you with the first job as you start; the truck always in **Sim** physics) and **FREE PLAY** (go anywhere; the truck starts in Sim and the menu's Driving row switches it to Realistic, remembered); each keeps its own jobs. The menu's Jobs tab lists the people and their work. **The Outfitter's turntable holds the Heron too** (TRUCK | ✈ HERON; DRIVE becomes FLY), in the light cyclorama by default. **Ground the truck can't cross** (his call: places you have to fly): water deeper than 1.1 m (it bogs to a crawl: "TOO DEEP FOR THE TRUCK"), the Black Range's lava flows (a'a ridges up to 2.6 m, and "A LAVA FIELD: NO TRUCK CROSSES THIS"), as well as the escarpment and the canyon walls. **Each region's own rock:** the Black Range in his basalt (H19), the kopjes in his granite (H11), sandstone (H15) elsewhere.
  - **last-road-18: its own front door.** He opened an early build and saw Salt & Sand's bay with its other cars (Nov 7 2026): every build until now still started in Salt & Sand's Dyno Bay. Now the page starts on Ground Truth's title (his painted mountains behind it, the build's name in the corner): **START** drives out at Roadhead on Last Road; **OUTFITTER** is the bay, with the Rock & Mud and the Heron only (no Garage button, GROUND TRUTH on its wall). The menu keeps only this game's tabs (no Challenges, Races, Garage, Cool stuff, career, other cars, traffic). The phone's driving screen without N2O, O/D OFF, REAR and HORN, and the HUD without the N2O and BANG lights.
  - **last-road-3:** the Heron in its own paint, from his picture A06 (olive over cream, yellow wingtips and tail band, LR-OLV), with the cowl's "Wayfarer" lettering repainted as **Heron** (`tools/heron_paint.py`, then salt-mini-plus `redtail/tools/livery.py`; fits 0.86 sides, 0.96 top and underside). The bay's Studio 2 truck in Station Sand's colour (#bca081, weathered).
  - **last-road-4:** the ground painted with his textures (`tools/texpack.py` -> `src/lr-texpack.js`, the engine's texture pack): grass H01, red dirt H04, creek sand H10, sandstone H15, reed mud H18, salt H12, gravel H16, cracked mud H09, timber H06, and a new surface, SAND, for the dunes (H13). The pictures' own colour at 85%.
  - **last-road-6: Ground Truth's own world** (`src/gt-world.js`, inside the engine's world generator). The brainstorm's 48 km map laid over the engine's 40-mile world (1.34 times bigger), seven regions with wandering edges: the Savanna (granite kopjes, creek lines, flat-topped trees), the Salt Pans, the Dune Sea (dunes growing to 150 m deep in, Big Daddy at 250 m), the Highlands (a 600 m escarpment with one pass, the Switchback), the Canyons (a plateau cut into mesas and slots, the gorge river), the Delta and the Lake, the Black Range (cinder cones, lava fields, the caldera and its lake). Last Road from the south edge through Roadhead to the End. The twelve strips flattened, Roadhead's runway paved. The start is on Last Road at Roadhead. `sh tools/world/map.sh <build>` draws it from above (`docs/world/map.png`).
  - **The distant land:** past the engine's far tiles (2 km), 4 km tiles a point every 256 m, 26 km round you on the ground, up to the whole map from high up (55 km from 2,500 m). The fog of each time of day thinned to about a seventh. On the phone it adds about 30,000 to 90,000 triangles.
  - **last-road-7: his town models in the world** (`tools/props_pack.py` -> `src/lr-props.js`, placed by `GT_PROPS` in `src/gt-world.js`, drawn by `src/lr-game.js` in the plane's material, with shadows and colliders): at Roadhead the hangar (B02), fuel (B06), water tower (B10), radio mast (B11), the windsock and the runway's drums and tyres (B07); on Last Road the roadhouse (B08) and two houses (B12, B14); at Kettle Creek Station the homestead (B16), windmill (B17), workshop (B18) and yards (B19). The ground is levelled under them.
  - **last-road-8: the truck and the Heron.** The one you're not in waits. Driving, the Heron stands where you left it (at first in front of the hangar); drive up and stop, and a **HERON** button appears. Flying, the truck is waiting beside the runway at the nearest strip; land, stop on the strip, and **TRUCK** appears. The buttons show only when the swap can happen (E on a keyboard).
  - **last-road-10 to 12: the walk places and landmarks** placed at their brainstorm spots, each on a levelled pad (the Cistern, the Causeway Gate and Map Stone, the Bottle Tree, the Marbles, five bore windmills, the Pan Wreck, Three Wells, fourteen Caravan cairns, the Sunken City half-buried, the Terraces, the Weir, the Observatory ring, the three Arches, forty hoodoos, the Towers at the Switchback, Meridian's drill rig). Steep far land shows as rock. 31 models, 8.4 MB of the 28 MB file.
  - **last-road-11: on foot.** Stop, ON FOOT, walk in first person (stick, drag to look; WASD, F on a keyboard); the models' boxes and the vehicles stop you; GET IN beside the truck or the Heron.
  - **last-road-13: the people and the first jobs**, on the engine's own job system (a column of light in their colour, stop beside it, LISTEN; their faces from his portraits in the dialog). Dell (the apron at Roadhead), Teo (the hangar), Haugen (the roadhouse), Nkem (Kettle Creek), Harker (the delta camp), Ruben (Last Well). Jobs: **First Light** (fly past the runway's end, land, see Dell), **The Mail** (land at Kettle Creek, take it to Nkem), **Ground Truth** (find the Cistern from the air, land, walk into it), **Three Wells** (land at the dune's edge, walk the temple), **The Pan Wreck** (land on the salt, drive to the wreck). New steps: *land* (in the Heron, stopped on a strip) and *foot* (on foot at a place). Tested: First Light plays from start to finish.
  - **last-road-14 and 15:** your gloved hands on foot (E01); Ruben's shack at Last Well (D16); the Causeway, the Old Hands' raised stone road across the savanna; the model pictures at WebP quality 72.
  - **last-road-16: animals at a distance**, one herd or none in each 2.5 km square, chosen by its land, the same every visit: cattle (G01) near Kettle Creek, antelope (G02) on the savanna, a lioness (G04) on a kopje's top, oryx (G06) and camels (G07) in the dunes and canyons, flamingos (G05) and cranes (G08) in the delta. They graze, then run from you (320 m in the truck, 260 flying, 170 on foot); birds lift off and fly away. Vultures (G03) wheel 150 to 200 m up over the savanna. Past 250 m each wears a thinned shape (about 350 triangles).
  - **last-road-17: his plants and rocks everywhere**, drawn the way the engine draws trees (thousands at once, near in full, far in a thinned shape; `GT_TSH` in `src/gt-world.js`, `LRF` in `src/lr-game.js`). The savanna: his flat-topped trees (F01, three ages), bushes (F04), termite mounds (F07), boulders (F06) piled on the kopjes. The delta: big mossy trees (F10) and reeds at the water (F12). The canyons: sandstone blocks and ledges (F09). The Black Range: lava rocks (F14). Venn's wreck and camp (D18) past the far end of the Old Survey Strip. Painting a crown or bush now skips the backdrop showing through its gaps (`HOLES=1 sh tools/models/repaint.sh`); far shapes from `tools/models/lod.py` (`--blob` melts a crown into one skin first). Each is drawn in full only within 60 m (40 m on a phone). On the phone at the Cistern: about 153,000 triangles a frame (build 16: 121,000), 42,000 of them plants.
  - **last-road-9: the painted edge.** His twelve horizon layers round the world in the sky behind the land (`tools/horizon_strip.py`): north the snow peaks behind the escarpment, east the mesas, south the ranges, west the dunes.
- **His pictures, made ready** (Nov 7 2026): all 29 textures seamless at 1024 (`tools/textures.py`, `models/textures/`); the 18 panoramas with the sky cut out and their ends joined (`tools/horizon.py`, `models/horizon/`); the 6 plant-card sheets cut out and each plant boxed (`tools/cards.py`, `models/cards/`); the 7 portraits at 512 and 128 for the radio card (`tools/portraits.py`, `models/portraits/`).
- **The models from his pictures** (`tools/models/`, Opus 5.5 helpers at extra high): the town (11), the walk places and landmarks (23), the gear (19), the plants and rocks (8) and the animals (8), all done. Each is built from its sheet, painted from it, and checked beside it (`models/assets/<ID>/compare.webp`); `docs/models/progress-1.png` shows the first ten.
- **`builds/last-road-2.html`** (Nov 7 2026): the truck in **Station Sand**, weathered (his picture A04, the choice his picture tool made), laid onto the 50k play model by `tools/truck_livery.py` (outline fits: sides 0.82, top 0.99, front and back 0.86), toned a little for the game's light (saturation x 0.82, brightness x 0.9).
- **`builds/last-road-1.html`** (Nov 7 2026): the same, but laptops start on the **Low** graphics level instead of High (his laptop didn't open last-road-0; he remembers Salt & Sand opening on Low there). In the test browser a laptop-style start reached the menu in 95 s instead of 191 s. A phone still starts on Mobile, and a level picked in the menu still holds for the start it makes.

## Decided (his picks, Nov 7 2026)

### The game

- **Its name is Ground Truth** (his pick from Fable's brainstorm, Nov 7 2026). The paved road is Last Road, and the repo is `last-road`. "Redline" and "Redtail" stay with his racing game.
- **He likes everything he's seen in Fable's brainstorm** (`design/fable-brainstorm-2026-11-07.md`). It's the starting design: the survey story, the Old Hands, the voices, the gear, the Outfitter, the side jobs. Change it with him as it's built.
- **It's mainly exploration by truck.** You get out and walk around temples, ruins and other close-up places. A significant part of it is exploring by plane, though less than half. There should be a lot of travel between the places you walk around.
- **Story: a bunch of different jobs** (his words, Nov 7 2026): a whole survey arc, materials deliveries, rescues (the higher-stakes moments), and plenty of mundane back-and-forth tasks. They give a reason to travel and make it exciting.
- **How it plays:** an open map plus a story chain: you roam freely, with the main story as a chain of missions and side jobs in between.
- **A central little town hub.**
- **Two regions to start: sandy dunes and savanna**, plus ruins, temples, canyons and mountains to explore. Making new digital assets is fine.
- **Runs on his phone** (Pixel 7a) and on his laptop (MSI Cyborg 15). It must look as good as the Redtail and the SUV do in Salt & Sand today.
- **One self-contained HTML file**, like all his games.

### Getting around

- **The truck is the SUV Rock & Mud** (the game's build id is `crawler`), with a new paint (a skin).
- **The plane is the Heron** (his pick from Fable's list, Nov 7 2026): the bush plane (redtail-2) in Wilderness Olive, "the green bush plane". **It can land in shallow water as well:** a river sandbar right at the surface, or a flat beach.
- **Both keep the racing game's real physics and its Digital Engine sound.** How the plane and the truck perform stays the racing game's.
- **The truck drives in Sim physics** (his call, Nov 7 2026): always in the campaign, so you can't tear across the savanna at silly speeds; in free play it starts in Sim and can be switched to Realistic, so it can also be a fun driving game.
- **On foot: first person.** You see only your gloved hands and what you're holding, so no person has to be modelled. Gear, supplies and materials are modelled instead.
- **The plane can fly over everything you can explore,** but it can touch down only on certain strips.
- **The truck is already waiting at every strip you can land on.** When you land, a small model of the truck is there beside the runway. When you switch to it, the plane stays parked (or goes away).
- **The strips are dirt** (it's a bush plane), except one paved runway. **One real paved road**; every other road is a dirt track.

### The world

- **One giant seamless world** (his preference, Nov 7 2026): **about 40 by 40 miles, made of four environmental zones of about 20 by 20 miles each.** Crossing from one to the next changes the environment. 60 by 60 miles if it works. No loading screens: the engine makes the land around you as you go.
- **A first draft of the four zones** (Fable's seven regions grouped into four; to settle with him):
  - **south:** the savanna and salt pans, with the town hub and Last Road;
  - **west:** the Dune Sea (Three Wells, the Sunken City);
  - **east:** the canyons, the gorge, the river delta and the lake (sandbars and beaches for the Heron);
  - **north:** the highlands and the black volcanic range.
- Earlier note: it should be significantly bigger than 16 km square: 25 miles square (40 km) or more. The engine already makes Road Not Found's world 40 miles square, in 128 m chunks round the camera at the detail each distance needs, with 512 m far tiles out to the horizon and a floating origin so nothing shakes far from the start.
- **Not everywhere has to be somewhere you can go.** Much of the land is made to look right from the air or from a road, and is empty up close.
- **A few layers of painted mountains** in the distance that you can never reach.
- **Animals at a distance only, which is cheap to draw and true to life:** in real life animals run away before you get close. Add their sounds up close: birdsong, and rustling in the leaves as something runs off unseen.

### Models: three of each (his rule)

Each vehicle and asset is made detailed first and baked down. These figures are his targets.

| Version | Triangles | Where it's used |
| --- | --- | --- |
| **Source** | as detailed as it comes (the Rock & Mud's Studio 2 is 790,531; redtail-1 is 241,278) | **Kept in the repo only**, with a viewer page to look at it. Not in the game. |
| **Outfitter** | **the full source model itself** (his call, Nov 7 2026), painted exactly as it looks in the game: the Studio 2 Rock & Mud in its chosen paint, the plane's full redtail-1 in Wilderness Olive | **In the game's garage bay (the Outfitter)**, where you look at the vehicle and outfit it for a trip. (His first idea was a 150k bake.) |
| **Play** | **about 50,000** for the truck (his pick after the look test, Nov 7 2026; his first target was 10,000), with the source baked onto it | **In the game, driving and flying.** Pictures at 1024 on the phone (24 MB of graphics memory), 2048 on the laptop (96 MB). |

- **The Outfitter is part of the game,** a little technical: some engine modification, rigging, prepping and gearing up for a trip.
- **Pictures:** the vehicles get the sharpest, because they're what you travel in (2048). Landmarks get 1024, small gear 512. Each picture is compressed according to how close you'll see it, and pictures are shared where they can be.
- **File size:** a baked model is stored as its shape plus its pictures, so it takes more room in the file than today's Studio cars, which are stored as the code that builds them. The plane added about 6 MB to the game file.

### Pictures for the models

- Christopher makes the reference pictures in ChatGPT Pro from prompts Claude writes. There's no fixed number: 100 is a comfortable batch, and hundreds is possible.
- Each object gets a reference sheet (side, front, top and three-quarter views), and every prompt shares one style line so the whole set matches.
- Textures and the painted horizons are pictures of their own.

### How it's being built (Nov 7 2026)

- **Christopher is giving an API key for this work.** Fable 5.1 at its highest setting brainstorms the game, the name, the lore and the list of pictures. Opus 5.5 helpers build the 3D models from his pictures.
- API helpers can't open files or run code, so the session runs the loop: a helper writes a model's code from a picture, then the session builds it, bakes it and renders it beside the picture, then sends the render back for fixes.
- He turns the key off when the work is done. **Never write the key into the repo, the notes or any file that's kept.**
- **This repo (`chriskizer91-ops/last-road`) is the game's own.** It's named after the one paved road in the game, Last Road. The parts it's built from (the engine page, the plane, the cars' models, the bake tools) are in `chriskizer91-ops/salt-mini-plus`; until that repo's pull request #1 is merged, they're on its branch `beyond-the-last-road`.

## Still to decide (ask him, one at a time, when it comes up)

- The **outfit's name**, and **who you are**.
- **The truck's paint.**
- **Fuel** for the plane and the truck: yes or no.
- **People:** a radio voice with a portrait card and short lines of text is suggested, rather than 3D people.
- ~~Where the truck can go~~ **Decided (Nov 7 2026): off-road anywhere it physically can, with ground that only the Heron gets you across** (deep water, lava flows, cliffs); more such places to add as the regions fill in.

## What it's built from (in `chriskizer91-ops/salt-mini-plus`)

| What | Where | Notes |
| --- | --- | --- |
| The game engine | `salt-and-sand/salt-and-sand.html` | Under Salt & Sand, the page carries all of Road Not Found: the renderer, the physics, the Digital Engine sound, the open world (40 miles square), the career and money, and **people with jobs** (`PEOPLE`, `JOBS`; steps: talk, goto, deliver, chal, part, medals, speed). Its source was never saved, so **the page is the source**. See `salt-and-sand/README.md`. |
| The plane, flying | `redtail/game/` (`rt-game.js`, `rt-fly.js`, `rt_patch.py`) | Lift, stall, flaps, the prop's blast over the tail, the stick, tilt, the throttle lever, a cockpit camera, lights, the engine and prop sound, the PAINT button. Tested numbers are in `redtail/README.md`. |
| The plane's models | `redtail/versions/` | redtail-1 is the source (241k, in code); redtail-2 is a 60k bake. Moving parts: prop, wheels, tailwheel, rudder, elevators, flaps, ailerons; the cowl comes off. |
| Wilderness Olive | `redtail/versions/redtail-2/paint/` | The story plane's paint, made from his ChatGPT pictures with `redtail/tools/livery.py`. |
| The truck | `models/suv-rockmud/`, `models/src/` | Studio 2 Rock & Mud: 790,531 triangles (body 328,949, underside 147,774, cabin 84,840, engine bay 66,300, one wheel 34,490), built from code (`KIT.setAlt('2')`). |
| The bake | `redtail/tools/` (`bake.py` and friends), `models/tools/bake.py` | How redtail-2 and the baked traffic cars were made. |
| The dunes and the cameras | Salt & Sand, in the page | Dunes with sand grip, dust and ripples. The cameras: Chase, Hood, Cockpit, Wheel cam, Tracking car, Roadside, Cinematic, the drones, Director, Jump cam. |
| A finished build to look at | `redtail/builds/salt-and-sand-redtail-2-flying-paints.html` | What "looks as good as now" means. |

## The phone's budget

- Salt & Sand draws about **850,000 triangles a frame**, 808,000 of them the SUV's Studio 2. Christopher judges that about the most his phone can draw smoothly.
- With the truck's play model at about 50,000 triangles (his pick) and the plane at 60,000, about 740,000 of the 850,000 is left for the world: roughly six times what Salt & Sand gives it today.
- **The look test (done Nov 7 2026):** the Rock & Mud baked at 10,000, 25,000 and 50,000 triangles beside its Studio 2, from the same cameras (Chase, Wheel cam, Tracking car). He picked the 50,000 with 1024 pictures on his phone.
- Why test: in the traffic test the 5,000-triangle baked Coupe was judged plenty good at traffic distance. But in early Nov 2026 he judged the game's own 51,000-triangle mesh wearing the Studio surface to look worse than the Studio models up close. Up close, the outline (round tyres, struts, the plane's wires) is what a low count shows first.
- The world's share:
  - trees, rocks and animals drawn many at once, one draw for each kind;
  - grass mostly as a ground texture, with real blades only near the camera;
  - a simpler copy of each thing far off;
  - only the near world casting shadows.
- The page's F readout gives triangles and draws. The test browser has no graphics card, so only his phone can say how smooth it is.

## The world (a draft to work out with him)

- **The town hub:** the start, the Outfitter (garage bay), the paved runway, and the end of the one paved road.
- **Three kinds of place:**

  | Kind | What it is |
  | --- | --- |
  | Walk | Temples, ruins, the town: full detail, explored on foot in first person. |
  | Drive | Tracks, canyons, river crossings, dunes: built for the truck, with plenty of distance between the walk places. |
  | Fly over | Most of the map: land, textures and trees drawn many at once. It looks right from the air and is empty up close. You can't land there because there's no strip (forest, rock, steep ground, water). |

- **Dirt strips** beside the walk and drive places, each with the truck waiting and a windsock.
- **Fly-throughs:** canyons, gorges, arches, valleys between peaks.
- **Painted mountains in layers** round the edge.
- **Regions:** the Dune Sea and the Savanna to start, and more to brainstorm.
- **Size:** 40 km square or more. At 75 mph the plane crosses 1 km in about 30 s, so 40 km takes about 20 minutes at cruise. Something new should come into view every 30 to 60 seconds of flight.

## The jobs and the story (to brainstorm)

The page's job system already has people, a column of light where someone has work, an arrow to the next step, payment and a career save. New steps the game could add:

| Step | What it asks |
| --- | --- |
| fly to / land at | Land on a strip and stop inside it, with a bonus for a gentle touchdown. |
| carry | Load at A, unload at B. The load weighs the plane down. |
| spot | Fly low and slow over a place until it's found. |
| drop | Airdrop onto a marker. |
| drive to | Take the truck where the plane can't land. |
| explore | Walk a site on foot and find something. |
| against the clock | The existing deliver step. |

Fable's brainstorm has a 13-mission chain and 15 side-job types (`design/fable-brainstorm-2026-11-07.md`, section 6): the starting design, which he likes. An earlier eight-mission draft is in salt-mini-plus's history (`beyond-the-last-road/README.md`).

## Build order

Each step ends with something Christopher can open on his phone, plus screenshots and simple numbers.

0. **The fork:** done (`builds/last-road-0.html`): new save keys, the 50k Rock & Mud, the Heron in Wilderness Olive, its HUD and chase camera fixed. The bay still shows the car: that's the Outfitter, step 3.
   *Done since, out of order (Nov 7 2026): the world's layout (step 5: regions, Last Road, the strips, the painted mountains), the town and the station placed (part of 3), the waiting truck and the swap (part of 4).*
1. **The look test:** done; he picked the 50k.
2. **The brainstorm and the picture list:** done (`design/`). He's making the pictures.
3. **The town hub and the Outfitter:** the full source models, painted as they are in the game (the Heron's redtail-1 in Wilderness Olive; the Studio 2 Rock & Mud in its chosen paint).
4. **Landing and the waiting truck; getting out on foot.**
5. **The world's layout:** regions, the paved road, the tracks, the strips, the painted mountains.
6. **The first walk place** (a temple) and the first fly-through (a canyon).
7. **Assets from his pictures,** built and baked by the helpers.
8. **Jobs and the story.**
9. **Life:** distant herds, birds, sounds, weather, times of day.
10. **Polish.**

## How to work with Christopher

- **Where things go (this repo):** `src/` (this game's code), `build.sh`, `builds/` (the pages), `models/` (each asset's source, Outfitter and play versions), `pictures/` (his reference pictures), `design/` (the brainstorms and the picture prompts), `docs/` (screenshots), and this README. Keep this README's Decided list up to date as he decides things.

- **He can't code.** He builds everything through Claude. Explain in plain words, and **prove every step with screenshots and simple numbers.**
- **Uncluttered phone screens.** On the phone, every button has to earn its place.
- **His devices:** a Pixel 7a phone and an MSI Cyborg 15 laptop (RTX 5060), with Edge on the laptop. Frame rates, tilt and sound can only be judged there.
- **Never overwrite:** a new build gets a new file name, and every version of a model is kept.
- **Change the page with exact text swaps** that must each match once, like `salt-and-sand/ice-and-snow-freeze.py` and `redtail/game/rt_patch.py`, so a changed upstream page fails loudly. This game's own code goes in its own `.js` files that the build script puts into the page.
- **Testing:**
  - Playwright with headless Chrome (`redtail/game/rt-run.py` is a working harness);
  - run one browser at a time;
  - in the test browser, triangle counts, draws, speeds and distances mean something, frame rates don't.
- **Notes:** the Salt Flats Plus project's `claude/salt-flats-notes.md` and `claude/beyond-the-last-road-plan.md`.
