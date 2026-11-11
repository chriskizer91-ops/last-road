# Ground Truth · handoff after build 28 (Nov 11 2026)

This note is for a fresh session picking up Ground Truth from `builds/last-road-28.html`. **`README.md` is the plan and the full history** (every build, every decision of his). This note covers what README doesn't: how to set up a new machine, what lived outside the repo, the traps already found, and what's left to do.

## Where everything is

- **This repo:** `chriskizer91-ops/last-road`, branch `main`. Build 28 is commit `045b2e2` (the README entry is "last-road-28: the first four rescues"). Every build is kept in `builds/`, never overwritten.
- **The engine:** `chriskizer91-ops/salt-mini-plus`, **branch `beyond-the-last-road`** (its pull request #1 isn't merged). Clone it beside this repo: `build.sh` reads `../salt-mini-plus` (or `SMP=<path>`).
- **A fresh clone builds:** checked Nov 11 2026. Fresh clones of both repos, then `sh build.sh last-road-28`, gave a byte-identical `last-road-28.html` (35 MB) in 3 seconds. Nothing the build needs lives outside the two repos.
- **His laptop** (the Claude desktop app's folder bridge): `C:\Users\kizer\Downloads\last road images`. It holds:
  - every build he's been sent (`device_commit_files` with the file's uuid from SendUserFile);
  - **his 25 picture zips** (`Last-Road-01-A01-B02.zip` … `Last-Road-25-J03-J07.zip`);
  - a `mudlab` folder.
- **The design:**
  - `design/fable-brainstorm-2026-11-07.md`: the game, the story, the gear (he likes all of it);
  - `design/rescues-2026-11-08.md`: Fable's ten rescues, of which four are built;
  - `design/picture-prompts.md` (plus `.json` and `.html`): every picture prompt. Batch 3 (D20, D21, J08) is new, for the rescues.
- **The project (Salt Flats Plus):**
  - `claude/beyond-the-last-road-plan.md` is a copy of README;
  - `claude/ground-truth-handoff.md` is this note;
  - `claude/mud-lab-*-notes.md` are Mud Lab's notes.

## Setting up a new machine

| Needed for | What | How |
| --- | --- | --- |
| Building | python3 | `sh build.sh last-road-N` from this repo's top (needs `../salt-mini-plus` on `beyond-the-last-road`) |
| Testing | Playwright for Python (1.63 here), Google Chrome at `/usr/bin/google-chrome` (hard-coded in `tools/test/lr-run.py`, run with SwiftShader), node 22, Pillow, numpy | see "Testing" below |
| The Blender tools: `tools/world/walkgrid.py`, `finds.py`, `tools/models/*` (`unwrap.py`, `render.py`, `lod.py`, `repaint.sh`, `run_asset.py`) | Blender's Python as a pip package: **bpy 5.0.1 on Python 3.11**, in a venv at `/home/claude/bl` (the path is written into the tools; `run_asset.py` also takes `BL=`) | `python3.11 -m venv /home/claude/bl && /home/claude/bl/bin/pip install bpy==5.0.1 numpy pillow scipy` |
| His original pictures, for `tools/cards.py`, `portraits.py`, `horizon.py`, `heron_paint.py` and a new model's sheet | they read `/home/claude/imgs/raw/<zip name>/<ID>-*.png` | stage the zips from his laptop folder, then unzip each into `/home/claude/imgs/raw/<zip name>/`. The repo has smaller copies in `pictures/ref/` |
| The model views (`models/assets/*/<object>_view_*.png`, about 900 MB, git-ignored), for `tools/shop_pics.py` (Teo's wall) and `tools/book_pics.py` (the field book) | made from each model's `model_uv.obj`, which is committed | `bl/bin/python tools/models/render.py models/assets/<ID> <sheet.png>` |
| The model helper (`tools/models/run_asset.py`: a picture in, a model out) | `tools/ask.py` (moved into the repo Nov 11; it was outside it). It reads an API key from `~/.secrets/anthropic_key` | **His API key is being retired** (see Security). Without a key, have an Opus 5.5 subagent on his subscription write `model.js` from the sheet (prompt: `tools/models/prompt_build.md`); the rest of the pipeline runs the same (`build.mjs`, `unwrap.py`, `project.py`, `render.py`, `compare.py`) |

## How the game is put together (the short version)

- **The page:** `build.sh` takes Salt & Sand's page with the plane patched in (salt-mini-plus `redtail/game/rt_patch.py`), then runs `src/lr_patch.py`.
  - The patch makes **exact text swaps**, each of which must match exactly once, so an engine change fails loudly.
  - It inserts `src/lr-game.js` before THE BOOT and `src/gt-world.js` inside WORLDGEN.
  - It adds the data files: `lr-props.js` (his models, 13.6 MB), `lr-texpack.js` (4.7 MB), `lr-walk.js`, `lr-finds.js`, `lr-book.js`, `lr-shop.js`, `lr-wmap.js`, `gt-propbox.js`.
- **`src/lr-game.js`** is in sections, each headed `/* ---------- NAME`. In order:
  - the Heron's paint, the chase camera, the distant land, his models in the world, plants and rocks;
  - the truck and the Heron, the painted edge, on foot, where you can stand, the finds, the field book;
  - the people and the jobs (`gtJobs`), the rescues' machinery (`LRJ`), the hands, life at a distance;
  - the front door, the Outfitter's turntable, where the truck can't go, the Heron on water (`LRHW`), the maps, the dust, the sounds of life;
  - the gear and upgrades (`LRG`, Teo's wall), the truck's add-ons.
- **`src/gt-world.js`** is the world:
  - the regions, the strips `GT_STRIPS` and their frames;
  - the placed models `GT_PROPS`;
  - the water landings `GT_WATERS`;
  - `gtCore`, which gives every point its height and ground.
- **Coordinates:** places are given in the brainstorm's km grid (`bx` east, `by` north, 0 to 48). In metres that's `GX(bx) = (bx-24)*1280.77` and `GZ(by) = (24-by)*1280.77`.
- **Jobs (`gtJobs`):**
  - **Writing a job:** `Q(id, who, title, needs, intro lines, steps, outro, reward, tip)`, and `X(Q(...), {...})` adds the rescue fields.
  - **The order of the list matters:** a person offers the first job of theirs that isn't done and whose `needs` are done.
  - **Kinds of step:**
    - from the engine: `talk`, `goto`, `deliver`;
    - this game's: `land` (a strip), `landw` (a water landing), `foot`, `drive`, `fly` (with `below:` for a ceiling), `pickup`, `spot`.
  - **Step fields:**
    - `need` (one gear id or a list) and `text`;
    - `stop` (the clock stops when this step is done);
    - `line` (what the rescued say);
    - `drop` (something handed over) and `found`;
    - `late` (how the step changes once the clock's gone).
  - **Job fields:** `clock` (minutes), `late` ({text, money, who}), `hour` (a function giving 'golden' or 'night'), `give`, `lateSay`.
- **The two other files of his** this game borrows from: the engine page (`salt-and-sand/salt-and-sand.html` in salt-mini-plus: the engine's own job system, `jobStep`, `jActive`, `jobDialog`, `TOD`, `applyTod`) and the plane's flight code (salt-mini-plus `redtail/game/rt-fly.js`).

## Testing (the harness, and what it does and doesn't show)

- **The command:** `SHOTS=/tmp/lr-shots/ timeout 900 python3 tools/test/lr-run.py "file://$PWD/builds/X.html" TAG l|m "steps"`.
  - `l` is a laptop window and `m` a phone one.
  - **Steps:** `wait:N`, `shot:a`, `L:helper(args)` (the helpers are in `tools/test/lr-test.js`), `look:…`, `cam:Chase`.
- **Before a run,** kill old runs: `pkill -f lr-run.py; pkill -f "chrome.*swiftshader"`.
- **Helpers:**
  - **Jobs and rescues:** `rescue(id)` (takes a rescue straight away, the jobs before it marked done), `rs()` (where it stands), `jclock(sec)`, `setStep(n)`, `dlg()`, `goWho(who)`, `goRS(place)`, `airRS(place, back, alt, mph, angle, turn)`, `force(1)` (signals always on), `sigdbg()`.
  - **The Heron:** `takeoff(water or 's'+strip, kg)`, `heronAt`, `heronRoll`.
  - **The truck and walking:** `tipTest`, `dropDrive`, `walkAt`, `goFindN`.
- **What it shows:**
  - distances, speeds, masses and triangle counts are real;
  - frame rates aren't (SwiftShader, no graphics card);
  - **only his Pixel 7a and his MSI laptop (Edge) can say how it runs.**
- **The world in node, without a browser:** `sh tools/world/map.sh builds/X.html` draws the map from above. To pick places for a job: cut WORLDGEN out into `<dir>/wg.js` (as `map.sh` does), then `node tools/world/surfaces.js <dir> bx0 bx1 by0 by1` prints the ground's kind on a text grid.

## Traps already found (don't fall in again)

**Coordinates and job fields**
- **The grid is 1280.77 m per brainstorm km, not 1340.** An old tool used 1340 and put the first water landings in the wrong places.
- **A step field named `who` makes the engine treat the step as a talk** (it looks up `PEOPLE[who]` and throws). Passengers use `pax`.

**Testing**
- **`L:` arguments:** underscores become commas. Ids with underscores go through helpers such as `goFindN`.
- **`look:` keeps the camera** until a `cam:Chase` step.
- **The test browser is slow:**
  - a big model's picture can take 10 to 20 s to appear, so wait before deciding a model is missing;
  - the signals' line-of-sight check is cached for 0.3 s, so a teleport can show one frame of an old answer.
- **Mass:** each frame `lrJTick` sets the vehicle's mass from `t.__m0` plus whoever is aboard. A test that changes mass must set `__m0`.

**Game behaviour to know about**
- **`say()` puts the newest line on top:** say the second line first.
- **The hands:** in `lrHandsDraw`, a negative pitch `a` points the fingers up.
- **Models pushed into `WG.GTP` while playing are drawn but don't collide.** Vehicle colliders are baked into the ground chunks when the world is made; walking uses the walk grids. So the rescues' stand-in truck can be driven through.
- **The pale sand of the bars and the beach** is mostly the salt's texture, so its crackle shows.

## Left to do after build 28

**As far as this session knows, he hasn't played builds 27 and 28 yet.** Ask what he found first.

1. **A darker night, and the Heron's landing lights.** The full-moon night looks almost like day (the dunes glow), which undercuts The Cold Box: Ruben's lit window is meant to be the only light. This was my suggested next step.
2. **Rising water** (Going Under, and Flamingo Beach later). The bar doesn't go under yet: a late Going Under only changes the pay and the line.
3. **The other six rescues** in `design/rescues-2026-11-08.md`:
   - **Stuck in the Sea** (after The Count);
   - **Flamingo Beach** (after The Count, a beach landing);
   - **Cinders** (after Harker's Crate);
   - **A Light in the Spring Chamber** (after The Switchback);
   - **The Rim** (side, repeatable);
   - **Spot the Stray** (side, repeatable).

   Their pieces, not built yet:
   - smoke and flare signals;
   - the tow step and the tow strap ($90);
   - text-only voices (Flight Service, the rescued);
   - highland cloud;
   - a blocked strip and a dark strip;
   - The Cold Box made repeatable (with other patients after Ruben).
4. **His pictures, then models from them.**
   - **Batch 3 prompts** (`design/picture-prompts.md`):
     - **D20**, the quad bike on its side (Bore Three);
     - **D21**, Meridian's survey truck, bogged (Going Under, then Stuck in the Sea);
     - **J08**, Bowen's portrait.
   - **Still to write:** the bent plane (The Rim), the hire SUV (Spot the Stray), and portraits of June, Wren and the Lindqvists.
   - **Until those exist:** the rescued are the job's column of light, and the crew's truck is the Pan Wreck's Bedford (D05). Swap these in `lrJProps`, in the rescues' machinery.
5. **Small things noticed in testing:**
   - the phone HUD's text is small;
   - a long job line runs under the middle-of-screen messages;
   - a label at the top of the big map sits under its header.
6. **The older list:**
   - weather;
   - performance and file size (35 MB now; `lr-props.js` is 13.6 MB);
   - the glare on the kopjes;
   - the phone HUD.

## Bringing in the other games

- **His plan (Nov 10 2026):** Ground Truth is where the pieces from his other games come together: Salt & Sand's look, and Mud Lab's driving and soil. For now it's its own game. Some day it might go back into the Redline County driving game as a side quest, but that's a possibility, not a plan.
- **What he said earlier:** on Nov 8 he said to look at Mud Lab's code but keep working on it separately ("Don't add it yet"). **Ask before merging Mud Lab in,** unless the new session's brief says to.
- **Where the other games' notes are:** in the project, `claude/mud-lab-*-notes.md` and the `claude/salt-and-sand-*` notes; `claude/project-map.md` maps the whole project.
- **The truck's physics** here are the engine's `Vehicle` class, with Ground Truth's own changes in `src/lr_patch.py`:
  - rollovers: a wheel lets go of the ground past 70 degrees;
  - fording depth and bogging;
  - Sim physics for the campaign.

  New soil physics would replace or sit beside those changes.
- **Fixes to shared pieces, for the other games** (`claude/project-map.md` asks that these be passed on):
  - **Build 26's rollover fix** is in the engine's wheels (`src/lr_patch.py`, the wheel contact guard). In Sim, before the fix, a slow tip-over threw the truck back into the air spinning. Salt & Sand, Ice & Snow and Mud Lab use the same `Vehicle` class and may have the same flip.
  - **The Heron on water** (`lrHWater` in `src/lr-game.js`) and **the passenger weight on the plane** sit on top of the shared flight code and don't change it.
- **The other games' repos:** Mud Lab is `chriskizer91-ops/mud-lab`; Salt & Sand is `salt-mini-plus`, folder `salt-and-sand/`.

## Security

- **His API key** was only ever in this session's machine, at `/home/claude/.secrets/anthropic_key`. It was never in the repo, the notes or the project, and a new session doesn't get it. He meant to turn it off and delete it when done.
- **Helpers now run as subagents on his subscription:** Fable 5.1 for design, Opus 5.5 for code and models.
- **Never write a key into any file that's kept.**

## How he works (also in README)

- **He can't code.**
  - Explain in plain words.
  - Prove every step with screenshots and simple numbers.
  - Keep phone screens uncluttered.
- **Every build gets a new number, and is copied to his laptop folder.**
- **Commit and push at every step;** he asked for the source to be saved to the repo along the way.
- **Keep README's build list and Decided list up to date,** and copy README to the project's `claude/beyond-the-last-road-plan.md`.
