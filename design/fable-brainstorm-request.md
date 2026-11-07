You're brainstorming a game with Christopher, an indie game maker who can't code and builds his games entirely by working with Claude. Claude (Opus) is running this project in a workspace with the game's code and tools, and is calling you for the big creative and design thinking. Be ambitious and specific, but stay honest about what a single-file WebGL2 game on a mid-range Android phone (Pixel 7a) can do. Below is the plan as it stands (his decisions are binding unless you flag a serious problem with one), then some facts about the engine and the asset pipeline, then what I need from you.

=== THE PLAN SO FAR (the game's README) ===
# Beyond the Last Road (working title)

*A story and exploration game by Christopher. You explore a huge wild country, mostly in an off-road truck, partly from a bush plane, and on foot wherever there's something to see up close: temples, ruins, canyons. The plane can fly over everything but can land only on a few dirt strips. The truck reaches what the plane can't, and your own feet reach what the truck can't.*

This file is the plan. It's written so that a fresh Claude session (or this one) can pick the game up and build it with Christopher, step by step. Before changing anything, read **How to work with Christopher** at the bottom. Keep this file up to date as he decides things.

## What he asked for (Nov 7 2026, in his words)

> "I want to make a story that uses the mud and rock off road SUV and the bush plane… I want it to be able to run on my phone and also visually look as good as the current airplane and SUV in game look. We can have a sandy dune region. We can have a savanna region. We can make more digital assets for the game, whatever we need."

> "I think the game should be mainly SUV exploration, and you get out and walk around a temple or something, and then … a significant portion of exploration is by plane … open world where you can fly, but you can't land … we fill in the end gaps of close-up exploring stuff on foot … a lot of travel between walking around spaces … a central little town hub."

## Decided (his picks, Nov 7 2026)

### The game

- **Its name is not decided.** "Beyond the Last Road" is a working title only; he wants to brainstorm names. "Redline" and "Redtail" stay with his racing game.
- **It's mainly exploration by truck.** You get out and walk around temples, ruins and other close-up places. A significant part of it is exploring by plane, though less than half. There should be a lot of travel between the places you walk around.
- **Story:** bush pilot jobs (supply runs, rescues, counts) were his first pick. The story now has to sit alongside the exploration; brainstorm how.
- **How it plays:** an open map plus a story chain: you roam freely, with the main story as a chain of missions and side jobs in between.
- **A central little town hub.**
- **Two regions to start: sandy dunes and savanna**, plus ruins, temples, canyons and mountains to explore. Making new digital assets is fine.
- **Runs on his phone** (Pixel 7a) and on his laptop (MSI Cyborg 15). It must look as good as the Redtail and the SUV do in Salt & Sand today.
- **One self-contained HTML file**, like all his games.

### Getting around

- **The truck is the SUV Rock & Mud** (the game's build id is `crawler`), with a new paint (a skin).
- **The plane is the bush plane (redtail-2) in Wilderness Olive**: "the green bush plane". Its name in the story isn't picked yet.
- **Both keep the racing game's real physics and its Digital Engine sound.** How the plane and the truck perform stays the racing game's.
- **On foot: first person.** You see only your gloved hands and what you're holding, so no person has to be modelled. Gear, supplies and materials are modelled instead.
- **The plane can fly over everything you can explore,** but it can touch down only on certain strips.
- **The truck is already waiting at every strip you can land on.** When you land, a small model of the truck is there beside the runway. When you switch to it, the plane stays parked (or goes away).
- **The strips are dirt** (it's a bush plane), except one paved runway. **One real paved road**; every other road is a dirt track.

### The world

- **Massive.** It should be significantly bigger than 16 km square: 25 miles square (40 km) or more. The engine already makes Road Not Found's world 40 miles square, in 128 m chunks round the camera at the detail each distance needs, with 512 m far tiles out to the horizon and a floating origin so nothing shakes far from the start.
- **Not everywhere has to be somewhere you can go.** Much of the land is made to look right from the air or from a road, and is empty up close.
- **A few layers of painted mountains** in the distance that you can never reach.
- **Animals at a distance only, which is cheap to draw and true to life:** in real life animals run away before you get close. Add their sounds up close: birdsong, and rustling in the leaves as something runs off unseen.

### Models: three of each (his rule)

Each vehicle and asset is made detailed first and baked down. These figures are his targets.

| Version | Triangles | Where it's used |
| --- | --- | --- |
| **Source** | as detailed as it comes (the Rock & Mud's Studio 2 is 790,531; redtail-1 is 241,278) | **Kept in the repo only**, with a viewer page to look at it. Not in the game. |
| **Outfitter** | about 150,000, with the source baked onto it | **In the game's garage bay (the Outfitter)**, where you look at the vehicle and outfit it for a trip. |
| **Play** | about 10,000, with the source baked onto it | **In the game, driving and flying.** |

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
- **He's making a new repo for this game.** Until it exists, this plan lives here.

## Still to decide (ask him, one at a time, when it comes up)

- **The game's name** (brainstorm), the **plane's name** (ideas so far: Bateleur, Kestrel, Hornbill), the **outfit's name**, and **who you are**.
- **The truck's paint.**
- **The story,** and how the bush pilot jobs sit alongside the exploration.
- **Fuel** for the plane and the truck: yes or no.
- **People:** a radio voice with a portrait card and short lines of text is suggested, rather than 3D people.
- **Where the truck can go:** everywhere off-road inside driving areas, kept out of fly-over-only lands by cliffs, deep rivers or thick bush? Or roads and tracks only?
- **Whether 10,000 triangles looks good enough in play.** See the look test below.

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
- With the play models at about 10,000 triangles each, almost all of the budget goes to the world.
- **The look test comes first.** Bake the Rock & Mud at 10,000 triangles (and at 25,000 and 50,000, to compare) and show them beside its Studio 2, from the same cameras, on his phone: Chase, Wheel cam, Tracking car. Then he picks.
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

An eight-mission draft for the bush pilot jobs was written earlier. It's kept in this file's history in git (`git log -p beyond-the-last-road/README.md`). The brainstorm will redo it with exploration in mind.

## Build order (to adjust after the brainstorm)

Each step ends with something Christopher can open on his phone, plus screenshots and simple numbers.

0. **The fork.** A new page made from Salt & Sand + the plane + this game's own patches:
   - new save keys;
   - the Rock & Mud and the plane in Wilderness Olive;
   - fix the plane's known faults: the car lights and gear on the HUD, the bay showing the car, the chase camera staying level.
1. **The look test:** the Rock & Mud at 10k, 25k and 50k beside its Studio 2. He picks the play model.
2. **The brainstorm and the picture list** (with the API key); he makes the pictures.
3. **The town hub and the Outfitter** (the 150k models).
4. **Landing and the waiting truck; getting out on foot.**
5. **The world's layout:** regions, the paved road, the tracks, the strips, the painted mountains.
6. **The first walk place** (a temple) and the first fly-through (a canyon).
7. **Assets from his pictures,** built and baked by the helpers.
8. **Jobs and the story.**
9. **Life:** distant herds, birds, sounds, weather, times of day.
10. **Polish.**

## How to work with Christopher

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

=== MORE FACTS ===
- "Last Road" is the name of the one paved road in the game (and of the game's repo). "Beyond the Last Road" is a working title only.
- The engine (all already working, inside one HTML file): an HDR WebGL2 renderer with cascaded sun shadows, reflections, times of day and graphics tiers from Mobile to Ultra; real driving physics with off-road ground contact on any surface type (each surface has its own grip and rolling drag); the Digital Engine (a live engine-sound synth fed by the engine sim); the bush plane's flight model (lift, stall, flaps, prop wash, tilt-to-steer and an on-screen stick on the phone); an open-world generator that makes terrain, roads, creeks, hills, woods and grass from formulas in 128 m chunks around the camera in a background worker, with 512 m far tiles out to the horizon and a floating origin (the existing world is 40 miles square); trees drawn many at once; dust, mud and spray; a career with money and a save; feats and combos; robot drivers; a people-and-jobs system (a column of light marks someone with work, an arrow points to the next step; steps: talk, goto, deliver against a clock, challenge, part, medals, speed); a garage with parts and a dyno; many cameras (chase, hood, cockpit, wheel cam, tracking car, roadside, cinematic, drones, an auto Director, jump cam).
- Nothing exists yet for walking on foot, first-person hands, buildings to walk through, or interiors. Those are new code.
- Asset pipeline: Christopher makes reference pictures in ChatGPT (reference sheets with side/front/top/three-quarter views; tileable textures; wide painted panoramas; portraits). Claude's helpers write each model as code (vertices built in JavaScript, the way the cars and the plane were built), then it's baked in Blender: the detailed source model's look goes into pictures (colour, normal map, roughness/metal, ambient shade) on a much lighter copy. Each vehicle comes three ways: source (repo only), Outfitter about 150k triangles, play about 10k (being tested now at 10k, 25k and 50k). Static things (ruins, temples, statues, gear, rocks) bake very well. Animated living things are the hardest; people are avoided (first person on foot, people as radio voices with portraits).
- Phone budget: about 850,000 triangles a frame is about the most his phone draws smoothly today, and graphics memory is limited: one 2048 picture costs about 22 MB of it, so 2048 for vehicles, 1024 for landmarks, 512 for small gear, and pictures shared where possible. Each baked model also adds to the single HTML file's size (the plane added about 6 MB).
- His taste: realistic, grounded, a little technical (he loves the dyno and the tune sheet); driving feel matters most to him (he grew up in 4x4s, learned car control on ice, has driven on closed courses); he wants exploring to feel genuinely interesting, with a lot of travel between places to walk around; uncluttered phone screens.

=== WHAT I NEED FROM YOU ===
Write a design brainstorm in plain markdown, in these sections. Use plain words (Christopher will read it too). Be concrete: names, places, numbers.

1. NAMES. 25 ideas for the game's title (it can use "Last Road" or not), each with a one-line reason, then your top 5. Also 8 ideas each for: the plane's name (it's the green bush plane), the outfit's name, the town hub's name.
2. THE PREMISE AND LORE. Three different premises that fit bush flying + off-road truck + on-foot ruins and temples + a story told through jobs, each in a short paragraph (who you are, why you're here, what the old ruins are and why they matter, what the story builds to, the tone). Then pick the strongest and develop it: the history of the land, the lost civilisation or whatever built the temples, the mystery, the main characters (radio voices only: 5 or 6, each with a role and a voice in one line).
3. THE WORLD MAP. A map at least 40 km square: the town hub on Last Road; the regions (the dune sea and the savanna, plus 3 to 5 more that would make flying and driving between them feel like a journey, e.g. canyons, a highland plateau, a river delta, salt pans, a volcanic range, a forest); how they connect; where Last Road runs; 8 to 12 dirt strips (and the one paved runway) and what makes each landing different; the walk sites; the drive routes; the fly-throughs; the fly-over-only lands and the natural reason you can't land or drive there; the painted mountain layers at the edge. Then a numbered list of about 50 landmarks and places, each with: kind (walk / drive / fly-through / seen from afar), region, one line on what's there and why it's worth going. Spread them so something new is in view every 30 to 60 seconds of flight.
4. ON FOOT. What you do at a walk site in first person, kept simple to code but satisfying: e.g. a lantern for dark halls, a camera for photographing finds, a notebook or map that fills in, rope for a drop, a machete for vines, reading carvings, finding the way through. How long a typical site should take. How the sites tie into the story and the jobs.
5. THE OUTFITTER. The garage bay where you prepare the truck or plane for a trip, "a little technical": the gear you can carry (about 30 items, each with a weight and what it does or unlocks; the plane cares about weight), the vehicle preparation (tyre pressures, lift, snorkel, winch, sand ladders, lighting, fuel range, cargo pod, bigger tyres for rough strips, engine tuning on the dyno), and a short pre-trip checklist that feels real without being a chore.
6. JOBS AND STORY. The main story chain (10 to 14 missions) using the truck, the plane and walking, each in one or two lines, with the job steps it uses (existing or new). Then 15 side-job types. How money, upgrades and the map opening up pace the game.
7. LIFE AND ATMOSPHERE. Distant animals (which, where, how they're drawn cheaply: herds, flocks, a lone big animal on a ridge), sounds (birdsong by region, rustling as something unseen runs off, wind, the radio), weather (dust storms, rain on the savanna, heat haze, low cloud in the highlands), times of day, night flying.
8. CODE OR PICTURE. For each kind of asset, say whether it's best made purely in code (procedural), from a reference picture (and the model built to match it, then baked), from a texture picture alone, or as a painted backdrop. Give a triangle budget (Outfitter and play where both apply) and a picture size for each.
9. THE PICTURE LIST. A first-pass list of about 100 reference pictures Christopher should make, grouped by category (vehicles' paints, the town hub, temples and ruins, landmarks, gear, plants and rocks, distant animals, textures, painted horizons and skies, portraits), each with a one-line description of what's in it and which view layout it needs. Order them by what the game needs first. (Claude will write the actual image prompts from your list.)
10. RISKS AND CUTS. What's most likely to go wrong or not look good on the phone, and what to cut first if time or budget runs short.
