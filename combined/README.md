# Ground Truth Continued (working title): the combined game

*Christopher's three driving games brought together into one: **Ground Truth** (build 28, this repo's `main`),
**Mud Lab** (build 14, repo `mud-lab`) and **Salt & Sand Showroom 3** (repo `salt-mini-plus`, and the hand-off zip on
`mud-lab`'s branch `salt-and-sand-showroom-3-handoff`). Started 11 Nov 2026. This branch (`ground-truth-continued`) is
the combined game; `main` stays Ground Truth 28. "Ground Truth Continued" is a working title only: he wants a new,
short name.*

> **Parked on 13 Nov 2026, by Christopher.** Builds 1 and 2 opened on his laptop on Low; High would not hold there,
> on the RTX 5060 too, and why was never found. He decided that **Mud Lab goes on by itself** (improving the soil, a
> bigger map, a deep pond, a river you have to read), that the fixes and cameras from the other two games go into
> Mud Lab as a packet for its own session, and that **Salt & Sand and its Showroom stay their own project** for a
> while. Joining them is still wanted, "further out". Nothing below has been taken further than build 2.
> The packet: repo `mud-lab`, branch `packet-2026-11-13-handoff`, folder `handoff/`; notes in the project as
> `claude/mud-lab-packet-notes.md` and `claude/mud-lab-map-brief.md`. One finding there matters to this branch too:
> Ground Truth's rollover fix reads the ground's slope under each wheel, so on Mud Lab's soil it takes a rut's wall
> for a truck on its side. Step 3 below (the soil in this world) needs the packet's version of it.

**Read first, in the Salt Flats Plus project:** `claude/combined-game-feature-list.md` (every feature, fix and decision,
each with a number: the checklist this game is built against) and `claude/ground-truth-combined-survey.md` (how the
three pages fit and collide). Then this file. `README.md` and `HANDOFF.md` at the repo's top are Ground Truth's own.

## The order it is being built in (one numbered build a step)

1. **Ground Truth on Salt & Sand Showroom 3.** Done: build 1, and build 2 (the graphics card), below.
2. Mud Lab's pieces that don't need the soil: the Stock SUV as a second vehicle, both SUVs in the world, the sound
   fix, REAR while towing, the keys put right, the Heron's far copy, the map's MENU and guide arrow.
3. Mud Lab's soil in Ground Truth's world: the soil's square travelling with the truck, each region's soil and
   moisture, one ground shader, water, both grips, tyre air and size, winch and strap in place of "call a tow".
4. The mudding area near Roadhead: Mud Lab's ground with its trails, the Bog, the pull test, the Hill Climb.
5. The Outfitter's garage (Road Not Found's, switched back on), the upgrade ladder, the story's start in the Stock SUV.
6. Re-baking both driving models from the fixed Studio 2 models; the detailed Heron in the Outfitter; the name.

## How a build is made

`sh combined/build.sh ground-truth-continued-N` (from anywhere; about 10 seconds; writes `builds/<name>.html`).
Everything it needs is in this repo:

| Step | What | Where |
| --- | --- | --- |
| 1 | The engine page all three games start from (sha256 `9c2bffab…`) | `combined/base/engine-salt-and-sand.html` |
| 2 | Salt & Sand's four steps: the lean Studio 2 car and its shade, Film & Showroom, the loader, the Rock & Mud fixes and clear glass. The result is checked against Showroom 3's fingerprint | `combined/sas/` (`patch.py` … `patch4.py`, `src/`, `src2/`, `src3/`) |
| 3 | The bridge: the car's shade moves from the lit shader's vertex slot 4 to slot 8, so the baked models' texture coordinates keep slot 4 | `combined/src/gtc_bridge.py` |
| 4 | The plane, unchanged from salt-mini-plus | `combined/plane/redtail/` |
| 5 | Ground Truth | `src/lr_patch.py`, `src/lr-game.js`, `src/gt-world.js`, the data files |
| 6 | The combined game's own swaps and code | `combined/src/gtc_patch.py`, `combined/src/gtc-game.js` |

Every step changes the page by exact text swaps that must each match once, so a change upstream fails loudly.
On this branch `src/lr-game.js` has `LR_BUILD` set to the build's name, and `src/lr_patch.py` saves under `gtc:`
(Ground Truth 28 saves under `lr:`, so the two never touch each other's saves).

## How a build is tested

`python3 tools/test/gtc-run.py builds/X.html TAG l|m steps.txt` (the header says what a steps file holds). It needs
salt-mini-plus beside this repo for the plane's test helpers (`SMP=<path>`), Playwright, and Chrome at
`/usr/bin/google-chrome`. Kill old browsers first: `pkill -f "chrome.*swiftshader"`. One browser at a time.

**Same-drive tests, and the trap in them.** Compare two builds only with the *same steps file*, and **wait for the
engine**: in the test browser the truck's engine is not running until about 85 s after FREE PLAY, and a test started
before that gives one of two answers depending on timing (it looked like a difference between builds and wasn't).
The steps that give the same answer every time:

```
js: LRT_T.tap('lrFree')
until: 240 | __dyb.GAME.state==='drive'
until: 120 | __dyb.GAME.car.pt.running
wait: 20
js: LRT_T.dropDrive(0.5, 8)
js: LRT_T.dropDrive(0.5, 8)
js: LRT_T.dropDrive(2, 8)
js: LRT_T.tipTest(0, 8, 5)
js: LRT_T.takeoff('s0', 0)
```

Other things learned: a scripted click (`js: document.getElementById('menuBtn').click()`) works where the browser's
own click times out on a slow frame. `#menuBtn` is the Bay chip while driving. With a test input set, the game's own
loop does not step the physics: step it by hand (`__dyb.step(1/120)`), then wait for frames. The Outfitter with a
Studio 2 car takes about two minutes a picture here. Frame rates mean nothing here; only his laptop can say.

## Build 1 (11 Nov 2026): Ground Truth 28 on Salt & Sand Showroom 3

`builds/ground-truth-continued-1.html`, 35,230,760 bytes, md5 `a22c7823117dd696c7cf63c0da95e226`.

**What it is:** Ground Truth 28, every part of it, rebuilt on top of Showroom 3 in place of the original Salt & Sand
page. Feature-list lines now in: SS-1, SS-2, SS-4 to SS-13, FX-6, FX-7, FX-16, half of FX-1 (the loader that never
stops the page and names what it waits for), X-15, X-16.

- **The Outfitter** shows the lean Studio 2 Rock & Mud (913,491 triangles: the rebuilt mud-terrains with their
  lettering, the mud flaps behind the tyres, the snorkel on the pillar, the covers over the rear springs), in Station
  Sand, with its own shade and clear glass. **SHOWROOM** is first in the Look bar: the white void under Light cyc, the
  black one under Dark bay, 991,673 triangles with the showroom's detail.
- **Driving** has the Film camera (the 16th, after Chase), the softer fly-past, and Salt & Sand's loader.
- **Its own saves** (`gtc:`) and its own name in the title's corner.

**Changed for the combination** (`combined/src/gtc_patch.py`, `gtc-game.js`):
- The Studio 2 car's shade is only baked in the Outfitter and under the title, and its "shading 40%" line no longer
  shows on the driving screen (in Salt & Sand the Studio 2 car is the one you drive; here it never leaves the bay).
  Back in the Outfitter the bake and its line carry on.
- The Showroom switch goes away while the Heron is on the turntable (the Showroom is the SUVs').
- The laptop's ON FOOT and HERON / TRUCK buttons no longer show in the Outfitter after a drive. This one is in Ground
  Truth 28 too.

**Checked** (test browser, laptop-sized window):
- Same-drive against Ground Truth 28, the steps above: 5 of 5 identical to the last digit (0.5 m drop twice, 2 m
  drop, the sideways slide onto its side at 100 degrees, the Heron off the ground in 53 m at 55 mph).
- No page errors or warnings in any run. Opens in about 135 s here (Ground Truth 28: about 90 s).
- All 16 cameras listed; Film picked and driven under at 50 and 139 mph; the look's four switches present (car
  shade, lean car, softer fly-past, clear glass).
- The Outfitter, the Showroom in both voids, the Heron on the turntable (63,291 triangles, FLY in place of DRIVE):
  `docs/combined/ground-truth-continued-1-proof.jpg`.
- A frame on Last Road at Roadhead: about 180,000 to 210,000 triangles (Ground Truth 28 in the same place: the same).

**Not checked, or not right yet:**
- Nothing has run on his laptop or phone. The Showroom pictures were taken two rebuilds before the final file (the
  rebuilds after them changed only the three things listed above); the same-drive test and the button check ran on
  the final file.
- The loading hang on Windows is half fixed: the loader no longer stops the page, but Ground Truth's ground shader
  is still built whole at the start. Mud Lab's half (a plain shader first, the full one in the background) comes
  with the soil in step 3. Laptops still start on the Low graphics level, as in Ground Truth 28 (his call, X-12).
- With the Heron on the turntable the top line can still say the truck's shade is baking.
- The fly-past sound by ear; the Film camera over a long drive; the phone.
- The driving models were baked before the Rock & Mud fixes, so the snorkel and flaps on the road are the old ones
  until step 6.

## Build 2 (11 Nov 2026, evening): the graphics card

`builds/ground-truth-continued-2.html`, 35,235,702 bytes.

**What he reported on build 1** (laptop, Edge): the first load took under two minutes on Low. He switched Gfx to
High (the page starts again on the new level, as it always has), pressed OUTFITTER, and saw "a melted or exploded
version of the SUV", then "everything froze".

**What it was** (seen on his laptop itself, see "Testing on his laptop" below): the page was running on the laptop's
**built-in Intel graphics**, not its RTX 5060. On Low the Outfitter draws correctly there at over 60 frames a second.
On High the 913,491-triangle truck at full sharpness, its shade being baked and the glass shader being built were more
than the Intel card could do inside Windows' two-second limit, so Windows reset the card. The console showed the
proof: hundreds of "object does not belong to this context" and "Studio 2 bake: left out … (0 of 501,264 corners
seen)", then the engine's own handler started the page again (on Low). The test machine draws the same Outfitter on
High correctly, slowly: it has no card to reset. That was the Claude app's own browser pane.

**What he then reported on build 2 in Edge** (11 Nov, 20:52): its title names the NVIDIA RTX 5060, so Edge is on the
right card, and **High still went back to Low there.** So the Intel card explains the pane, not Edge. Why High will
not hold in Edge on the RTX 5060 for this game was not found before the work was parked. Ground Truth has never held
High on his laptop; Mud Lab does.

**What build 2 does** (`combined/src/gtc-game.js`, `gtc_patch.py`; nothing in the physics):
- The title's bottom left corner names the graphics card. On a built-in Intel card it adds how to give Edge the
  NVIDIA one.
- The Studio 2 car's bake paces itself by how long frames are taking (Salt & Sand's own hook `S2B.per`: 4 directions
  a frame down to 1 every fourth frame).
- A level above Low that can't hold about three frames a second for a while goes back to Low by itself and says why
  (not in a test browser, where every frame is that slow).
- When the card is reset anyway, the line says "The graphics card stopped answering and Windows reset it. Starting
  again on the Low graphics level", and the next title says what happened last time.
- The page's name while it loads is Ground Truth Continued (working title).

**Checked:** on the test machine, same-drive against Ground Truth 28: 5 of 5 identical; no page errors; the card's
line on the title. On his laptop (the app's pane, Intel): build 2 opened in 16 s (its shaders were already built
there), on Low, and the title read "Graphics card: Intel(R) Graphics" with the hint under it.
**Not checked:** the paced bake, the step-down and the new reset line on a real card (his window stopped painting
before the High run could be repeated). High on the RTX 5060.

## Testing on his laptop (a real graphics card)

The Claude desktop app's browser pane on his laptop can run a build, and this session can read its console, run
script in it and take pictures (the `mcp__remote-devices__Claude_Browser__` tools). It cannot open `file://`, so push
the build and open `https://raw.githack.com/chriskizer91-ops/last-road/ground-truth-continued/builds/<name>.html`
(he allowed that site; the first time it shows an "Open the page" button). Things to know:
- **It runs on the Intel card** (`ANGLE (Intel, Intel(R) Graphics (0x0000A7AB) Direct3D11 …)`, 16 pictures a shader).
- **The pane has to be showing** (Ctrl+Shift+B in the app) and the app's window uncovered, or the page doesn't draw a
  frame and the game never leaves its loading screen. Ask him; check `requestAnimationFrame` fires before a test.
- A script call is cut off at 45 s: poll in short calls. Set a size with `resize_window` (1280 x 720) and clear it after.
- A level is set as the Gfx button does: `localStorage.setItem('gtc:rt-gfx-next','high'); location.reload()`. After a
  Gfx reload the page comes back where it was (the Outfitter), not on the title.
- First load there, Low: about 80 s of "Warming up the shaders 20 / 21 … (still on: land)", then the title. High:
  about 165 s. Later loads: seconds.
- A test that resets the card freezes his whole laptop for a while: ask first. Close the tab when done.

## Where things are on his laptop

`C:\Users\kizer\Downloads\racing game november combo\`: `last road images\` (Ground Truth's builds and his picture
zips, Mud Lab's builds in `mudlab\`), `salt and sand november 10th and source\` (the Salt & Sand pages and
`dyno-bay-source.zip`: the Dyno Bay's and Salt & Sand's own source, which the older notes say was never saved; a
copy is now in this repo at `combined/sas/dyno-bay-source.zip`), and `ground truth continued\` (this game's builds).
