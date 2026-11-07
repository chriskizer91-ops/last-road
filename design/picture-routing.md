# Where each picture goes

Christopher's 164 pictures (Nov 7 2026, made in ChatGPT from `design/picture-prompts.md`), in `pictures/ref/` as WebP (quality 90; his PNG originals are on his laptop in `Downloads\last road images`). `pictures/ref/FULL-INDEX.csv` is his zips' own index.

His picture tool made a few working choices of its own, noted in the zips: the outfit's name **Last Road** (on A05), the plane's lettering **Wayfarer** (A05; the plane is the Heron, so that lettering is to change), and **Station Sand** as the truck's paint (A04, the weathered one).

| Kind | How many | What happens |
| --- | --- | --- |
| model | 70 | an Opus helper writes the model as code from the views; built, baked (the picture projected onto it), checked beside the picture, then cut down for play |
| reference | 29 | what the place looks like, for building it (its layout, light and look); with its sheet where it has one |
| texture | 29 | label removed, made seamless, sized for the phone (512 or 1024), used on the ground, walls or models |
| horizon | 18 | the sky cut away, made to wrap round, set as one layer of the distant mountains or as a sky band |
| portrait | 7 | cropped and sized for the radio card |
| cards | 6 | cut out with see-through edges into leaf or grass cards for the plants drawn many at once |
| paint | 5 | laid onto the existing model from its template views (tools: truck paint fitter; plane `livery.py`) |

| ID | Picture | Layout | Kind | For step |
| --- | --- | --- | --- | --- |
| A01 | Truck paint option 1: Station Sand | PAINT | paint | 0 vehicles |
| A02 | Truck paint option 2: Survey White | PAINT | paint | 0 vehicles |
| A03 | Truck paint option 3: Dust Red | PAINT | paint | 0 vehicles |
| A04 | The picked truck paint, weathered | PAINT | paint | 0 vehicles |
| A05 | Outfit badge and plane lettering | SET | model | 0 vehicles |
| A06 | The plane's markings and wear | PAINT | paint | 0 vehicles |
| A07 | The truck's dashboard | SCENE | reference | 0 vehicles |
| B01 | The town from the air | SCENE | reference | 3 town & Outfitter |
| B02 | The hangar and Outfitter bay, outside | SHEET | model | 3 town & Outfitter |
| B03 | Corrugated iron | TEXTURE | texture | 3 town & Outfitter |
| B04 | The Outfitter bay, inside | SCENE | reference | 3 town & Outfitter |
| B05 | The base office, inside | SCENE | reference | 3 town & Outfitter |
| B06 | Fuel bowser and drum rack | SHEET | model | 3 town & Outfitter |
| B07 | Windsock and strip markers | SET | model | 3 town & Outfitter |
| B08 | The roadhouse | SHEET | model | 3 town & Outfitter |
| B09 | Rendered block | TEXTURE | texture | 3 town & Outfitter |
| B10 | The water tower | SHEET | model | 3 town & Outfitter |
| B11 | The radio shed and mast | SHEET | model | 3 town & Outfitter |
| B12 | Small house: weatherboard cottage | SHEET | model | 3 town & Outfitter |
| B13 | Weatherboard | TEXTURE | texture | 3 town & Outfitter |
| B14 | Small house: iron house | SHEET | model | 3 town & Outfitter |
| B15 | The end of the paved road | SCENE | reference | 3 town & Outfitter |
| B16 | The station homestead | SHEET | model | 3 town & Outfitter |
| B17 | The station windmill and tank | SHEET | model | 3 town & Outfitter |
| B18 | The station workshop shed | SHEET | model | 3 town & Outfitter |
| B19 | The station stock yards | SHEET | model | 3 town & Outfitter |
| E01 | Gloved hands, open | SHEET | model | 4 on foot |
| E02 | Gloved hands holding the lantern | SHEET | model | 4 on foot |
| E03 | Gloved hand pressed on stone | SHEET | model | 4 on foot |
| E04 | Lantern and headlamp | SET | model | 4 on foot |
| E05 | Field book, camera, rubbing kit | SET | model | 3 Outfitter gear |
| E06 | Pry bar and machete | SET | model | 3 Outfitter gear |
| E07 | Plane tie-down kit | SET | model | 3 Outfitter gear |
| E08 | Mail bag, first aid kit, cold box | SET | model | 3 Outfitter gear |
| E09 | Water pump, parts crate, fence wire | SET | model | 3 Outfitter gear |
| E10 | Tow strap, shackles, compressor, tyre repair | SET | model | 3 Outfitter gear |
| E11 | Sand ladders, shovel, farm jack | SET | model | 3 Outfitter gear |
| E12 | Fuel can, water can, drum, oil | SET | model | 3 Outfitter gear |
| E13 | Rope, harness, carabiners | SET | model | 3 Outfitter gear |
| E14 | Binoculars, GPS, long-range radio | SET | model | 3 Outfitter gear |
| E15 | Swag, camp stove, food box | SET | model | 3 Outfitter gear |
| E16 | Drop crate and parachute | SET | model | 3 Outfitter gear |
| E17 | Truck add-ons | SET | model | 3 Outfitter gear |
| E18 | Plane add-ons | SET | model | 3 Outfitter gear |
| F01 | Flat-topped savanna tree, three sizes | SHEET | model | 5 world (plants, rocks) |
| F02 | Savanna tree leaf clusters | SET | cards | 5 world (plants, rocks) |
| F03 | Dry savanna grass tufts | SET | cards | 5 world (plants, rocks) |
| F04 | Scrub bush | SHEET | model | 5 world (plants, rocks) |
| F05 | Scrub bush leaf sprays | SET | cards | 5 world (plants, rocks) |
| F06 | Granite boulders | SET | model | 5 world (plants, rocks) |
| F07 | Termite mounds | SET | model | 5 world (plants, rocks) |
| F08 | Dune grass tufts | SET | cards | 5 world (plants, rocks) |
| F09 | Sandstone blocks and ledges | SET | model | 5 world (plants, rocks) |
| F10 | Cloud-forest tree | SHEET | model | 5 world (plants, rocks) |
| F11 | Cloud-forest leaf, moss and fern cards | SET | cards | 5 world (plants, rocks) |
| F12 | Reed clump | SHEET | model | 5 world (plants, rocks) |
| F13 | Reed and marsh grass cards | SET | cards | 5 world (plants, rocks) |
| F14 | Lava rock | SET | model | 5 world (plants, rocks) |
| G01 | Station cattle | ANIMAL | model | 9 life |
| G02 | Savanna antelope | ANIMAL | model | 9 life |
| G03 | Vulture, wings spread | ANIMAL | model | 9 life |
| G04 | Big cat on a rock at dawn | ANIMAL | model | 9 life |
| G05 | Pink wading birds | ANIMAL | model | 9 life |
| G06 | Long-horned desert antelope | ANIMAL | model | 9 life |
| G07 | Wild camel | ANIMAL | model | 9 life |
| G08 | Crane, standing and in flight | ANIMAL | model | 9 life |
| H01 | Savanna dry grass | TEXTURE | texture | 5 world |
| H02 | Red dirt two-track | TEXTURE | texture | 5 world |
| H03 | Worn tarmac with a faded centre line | TEXTURE | texture | 5 world |
| H04 | Packed dirt airstrip | TEXTURE | texture | 5 world |
| H05 | Rusted corrugated iron | TEXTURE | texture | 5 world |
| H06 | Weathered timber boards | TEXTURE | texture | 5 world |
| H07 | Oil-stained concrete floor | TEXTURE | texture | 5 world |
| H08 | Green grass near water | TEXTURE | texture | 5 world |
| H09 | Cracked mud | TEXTURE | texture | 5 world |
| H10 | Soft creek-bed sand | TEXTURE | texture | 5 world |
| H11 | Granite | TEXTURE | texture | 5 world |
| H12 | Salt crust | TEXTURE | texture | 5 world |
| H13 | Sand ripples | TEXTURE | texture | 5 world |
| H14 | Smooth slip-face sand | TEXTURE | texture | 5 world |
| H15 | Sandstone wall | TEXTURE | texture | 5 world |
| H16 | River gravel bar | TEXTURE | texture | 5 world |
| H17 | Mossy tableland rock | TEXTURE | texture | 5 world |
| H18 | Reed mud | TEXTURE | texture | 5 world |
| H19 | Basalt lava | TEXTURE | texture | 5 world |
| H20 | Cinder | TEXTURE | texture | 5 world |
| I01 | South range, near | PANORAMA | horizon | 5 world |
| I02 | South range, middle | PANORAMA | horizon | 5 world |
| I03 | South range, far | PANORAMA | horizon | 5 world |
| I04 | East mesas, near | PANORAMA | horizon | 5 world |
| I05 | East mesas, middle | PANORAMA | horizon | 5 world |
| I06 | East mesas, far | PANORAMA | horizon | 5 world |
| I07 | North escarpment, near | PANORAMA | horizon | 5 world |
| I08 | North ridges, middle | PANORAMA | horizon | 5 world |
| I09 | North peaks, far | PANORAMA | horizon | 5 world |
| I10 | West dunes, near | PANORAMA | horizon | 5 world |
| I11 | West dunes, middle | PANORAMA | horizon | 5 world |
| I12 | West dunes, far | PANORAMA | horizon | 5 world |
| I13 | Dawn sky band | PANORAMA | horizon | 5 world |
| I14 | Dusk sky band | PANORAMA | horizon | 5 world |
| I15 | Night sky band with the Milky Way | PANORAMA | horizon | 5 world |
| I16 | Cloud bank on a ridge | PANORAMA | horizon | 5 world |
| I17 | Dust-storm wall | PANORAMA | horizon | 5 world |
| C01 | The Old Hands' building style | SCENE | reference | 6 first walk place |
| C02 | The glyph alphabet | SET | model | 6 first walk place |
| C03 | The channel marker stone | SHEET | model | 6 first walk place |
| C04 | The Cistern, outside | SHEET | model | 6 first walk place |
| C05 | The Cistern, inside | SCENE | reference | 6 first walk place |
| C06 | Old Hands wall stone | TEXTURE | texture | 6 first walk place |
| C07 | Three Wells, outside | SHEET | model | 6+ walk places |
| C08 | Three Wells, the front hall | SCENE | reference | 6+ walk places |
| C09 | Three Wells, the well hall | SCENE | reference | 6+ walk places |
| C10 | Three Wells stone | TEXTURE | texture | 6+ walk places |
| C11 | The Causeway, the long view | SCENE | reference | 6+ walk places |
| C12 | The Causeway, cross-section | SHEET | model | 6+ walk places |
| C13 | Causeway paving | TEXTURE | texture | 6+ walk places |
| C14 | The Causeway Gate | SHEET | model | 6+ walk places |
| C15 | The Gate, the Map Stone chamber | SCENE | reference | 6+ walk places |
| C16 | The Map Stone | SHEET | model | 6+ walk places |
| C17 | The Alcove from the gorge | SCENE | reference | 6+ walk places |
| C18 | The Alcove, inside | SCENE | reference | 6+ walk places |
| C19 | Alcove rock-cut wall | TEXTURE | texture | 6+ walk places |
| C20 | The Terraces from the air | SCENE | reference | 6+ walk places |
| C21 | The Terraces temple | SHEET | model | 6+ walk places |
| C22 | The Terraces, the temple hall | SCENE | reference | 6+ walk places |
| C23 | The Spring Chamber | SCENE | reference | 6+ walk places |
| C24 | Terraces stone | TEXTURE | texture | 6+ walk places |
| C25 | The Sunken City from the air | SCENE | reference | 6+ walk places |
| C26 | The City's great hall and tower | SHEET | model | 6+ walk places |
| C27 | The great hall, inside | SCENE | reference | 6+ walk places |
| C28 | A seated stone figure | SHEET | model | 6+ walk places |
| C29 | The cistern stair | SCENE | reference | 6+ walk places |
| C30 | The wet cistern | SCENE | reference | 6+ walk places |
| C31 | Sunken City stone | TEXTURE | texture | 6+ walk places |
| C32 | The Weir | SHEET | model | 6+ walk places |
| C33 | The Weir above the Falls | SCENE | reference | 6+ walk places |
| C34 | The Petroglyph Wall | SCENE | reference | 6+ walk places |
| C35 | The Observatory Cone's stone ring | SHEET | model | 6+ walk places |
| D01 | The Escarpment from the savanna | PANORAMA | horizon | 5 world |
| D02 | The Bottle Tree | SHEET | model | 6+ landmarks |
| D03 | The Marbles, a granite kopje | SHEET | model | 6+ landmarks |
| D04 | An old bore windmill | SHEET | model | 6+ landmarks |
| D05 | The Pan Wreck | SHEET | model | 6+ landmarks |
| D06 | Big Daddy, the tallest dune | SCENE | reference | 5 world |
| D07 | A stone cairn on the Caravan | SHEET | model | 6+ landmarks |
| D08 | The Falls | SCENE | reference | 6+ landmarks |
| D09 | The Arches, the canyon | SCENE | reference | 6+ landmarks |
| D10 | The three Arches, shapes and sizes | SET | model | 6+ landmarks |
| D11 | The Needle slot canyon | SCENE | reference | 6+ landmarks |
| D12 | The Congregation hoodoos | SET | model | 6+ landmarks |
| D13 | The Towers at the pass | SHEET | model | 6+ landmarks |
| D14 | The drill rig and company camp | SHEET | model | 6+ landmarks |
| D15 | The Caldera from above | SCENE | reference | 6+ landmarks |
| D16 | Last Well, Ruben's shack | SHEET | model | 6+ landmarks |
| D17 | Last Well, inside | SCENE | reference | 6+ landmarks |
| D18 | Venn's wreck and camp | SHEET | model | 6+ landmarks |
| D19 | The Vents at dawn | SCENE | reference | 6+ landmarks |
| J01 | Dell Marais | PORTRAIT | portrait | 8 story |
| J02 | Teo | PORTRAIT | portrait | 8 story |
| J03 | Dr Ilse Haugen | PORTRAIT | portrait | 8 story |
| J04 | Lyle Harker | PORTRAIT | portrait | 8 story |
| J05 | Ruben Vos | PORTRAIT | portrait | 8 story |
| J06 | Nkem Adeyemi | PORTRAIT | portrait | 8 story |
| J07 | Mallory Venn, 1930s | PORTRAIT | portrait | 8 story |
