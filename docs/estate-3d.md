# La Fenice: illustrative 3D study

This is an editable visual study combining original property modeling with open
geographic data, **not** photogrammetry, a measured survey, an accessibility
assessment or a navigation map. Exact property buildings, stairs, turnings,
heights and distances require owner review and the forthcoming walking/drone footage.
Do not market this version as a surveyed reconstruction.

## Evidence reviewed

- https://www.lafenicepositano.com/ — hillside villas/cottages, terraced gardens,
  stairs down to the sea, sea-water pool against the rock, private beach.
- Existing original site photos in `public/images/legacy/`: `piscina-positano.jpg`,
  `spiaggia-privata-positano.jpg`, `private-beach-positano.jpg` — curved pool,
  bougainvillea pergola, limestone cliffs, small pebble cove, not a sandy beach.
- https://visitsitaly.com/tours/campania/rentals/la_fenice.htm — qualitative layout
  only; older descriptions do not establish current facilities or room counts.
- Instagram could not be fetched and image search returned other hotels. Those
  results were excluded. No Booking/Instagram/traveller images are redistributed.

## Deliberately approximate

La Fenice's building count/massing, stair count/alignment, local cove, planting,
heights and internal distances remain illustrative. The regional coastline and
city footprints now derive from OSM; regional relief derives from an elevation
dataset. Their simplification and the transition into the property are not a
survey. City heights, facades and openings are interpreted unless a source tag
supplies a height, and even tagged heights are bounded for this visual study.
The amber line communicates repeated changes of level, not an exact walking
itinerary. No measured stair counts, travel times or elevation figures appear in
the public interface.

## Geographic context, 22 September 2026

The scene opens with a perspective landscape composition spanning La Fenice,
Positano and the surrounding coast, rather than an isolated cut-out diorama.
There are six localized stages: the five property stages plus **Positano and the
coast** (`Positano e la costa` in Italian). The initial view balances the property
and town; the sixth stage frames the wider coastline and hills with a visible skyline.

### OpenStreetMap buildings and coastline

- Source: [official OSM API extract](https://api.openstreetmap.org/api/0.6/map?bbox=14.47,40.623,14.504,40.644),
  downloaded 22 September 2026. Bbox: west 14.47, south 40.623, east 14.504,
  north 40.644. Complete intersecting ways can extend outside these limits.
- `artifacts/estate/context/positano-osm.json` retains 1,488 building footprints
  and three coastline ways, with 13,352 geometry points. Only geometry and
  relevant building/coast/name tags are retained, not contributor metadata.
- The source subset is also offered for download at `/models/positano-osm.json`
  from the credits beneath the explorer. Its metadata retains the source URL,
  copyright and [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
  Preserve these when redistributing or adapting the data; the OSM-derived data
  remains ODbL, not CC0 or a proprietary dataset.
- Keep visible **© OpenStreetMap contributors · ODbL**, linked to
  [OSM copyright and license](https://www.openstreetmap.org/copyright), together
  with the open-data download. The rendering does not remove data attribution
  or share-alike obligations. Source geometry is not traced from Google imagery.
- The business pin is latitude 40.6277721, longitude 14.4937307; see
  `artifacts/estate/context/coordinate-reference.md` for corroboration and the
  conflicting old website marker. Santa Maria Assunta's mapped footprint is
  approximately 565 m west and 64 m north of that pin. The context generator
  projects the source coordinates into local meters; it does not compress the
  town toward the property. Only a filtered subset of the downloaded footprints
  is rendered, excluding the illustrative near-property area.

### Reference correction, 24 September 2026

The user's Maps listing and two oblique screenshots show cliff headlands,
incised gullies, clustered buildings, planted ledges and the winding SS163.
They are qualitative visual references only: no Google imagery or 3D geometry
is redistributed. Pool position, ownership boundaries and the internal stair
itinerary cannot be established from these views.

The previous model put the hotel pin at the center of its gardens, causing the
mapped road to intersect the illustrative pool. The local model origin is now
60 m south of the business pin; both DEM sampling and all OSM geometry use this
same frame. The property descends seaward of the mapped road. This alignment
is approximate, not a measured 60 m property dimension.

- SS163 plan: [official OSM extract](https://api.openstreetmap.org/api/0.6/map.json?bbox=14.48,40.625,14.503,40.635),
  31 ways / 618 points, six with `bridge=yes`. The 6 m rendered width, elevations,
  bridge profiles and supports are interpretations of the coarse terrain, not
  engineering or accessibility data. Reacquire with `node scripts/fetch-estate-roads.mjs`.
- Source copies: `artifacts/estate/context/positano-roads-osm.json` and public
  `/models/positano-roads-osm.json`, with the same ODbL attribution and download
  link as the buildings. The originals contain no contributor/account metadata.
- Neighbor buildings are excluded only where they overlap the modeled property,
  replacing the arbitrary 250 m empty circle. They are not labeled as La Fenice.
- Steep building foundations use rock, separately from the limited inhabited
  facade height; a coarse elevation sample must not turn a cottage into a tower.
- The shore mesh is selectively refined; interpreted flanking gullies preserve
  the central stair corridor. Woodland masks follow slope and planted patches,
  avoiding mapped buildings and the SS163 instead of forming a rectangle.
- The near and regional terrain use one textured material with a continuous
  world-space vegetation tint, interpolated per vertex. Binary per-face rock/soil
  switching caused visible triangular patches and is removed. Two hundred sparse
  distant canopy groups reuse the existing licensed atlas with fewer cards each.
- The opening camera is closer to the property while retaining Positano and the
  surrounding coast. The existing bounded water shader is retained.

### Regional elevation: Mapzen Terrarium / Copernicus EU-DEM

[Mapzen Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) was accessed
22 September 2026. The two local inputs are
`artifacts/estate/context/terrain-12-2212-1541.png` and
`terrain-12-2213-1541.png`, downloaded from:

- https://s3.amazonaws.com/elevation-tiles-prod/terrarium/12/2212/1541.png
- https://s3.amazonaws.com/elevation-tiles-prod/terrarium/12/2213/1541.png

These are elevation-encoded PNGs, not satellite photographs. Decode their RGB
channels using the [Terrarium format](https://github.com/tilezen/joerd/blob/master/docs/formats.md)
before interpolation; the resulting elevations are in meters. The coarse
regional mesh, shore adjustment and blend into the modeled property modify the
source relief. It cannot resolve individual steps, walls or exact cliff faces.

Both tiles' HTTP source headers identify `eudem/eudem_dem_5deg_n40e010.tif`.
The relevant [provider attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md) is:

> Produced using Copernicus data and information funded by the European Union - EU-DEM layers.

Credit Mapzen as the tile provider and preserve that EU-DEM notice alongside
the source link. USGS supplies SRTM/GMTED and other inputs to the broader Mapzen
collection, but the headers do **not** identify a USGS input for these two tiles;
do not describe this local relief as USGS-derived. Terrain-source licenses are
separate from the OSM ODbL and from the CC0 surface textures below.

## Visual direction, September 2026

The realism pass is informed by the original photos, not by an inferred floor plan:

- `amazing-view-positano.jpg`: planted coastal context and white low-rise volumes
  partly concealed by mature, irregular canopy. Not proof that every visible villa
  belongs to La Fenice.
- `giardino-vista-mare-positano.jpg`: narrow paths, thin blue metal rails, low white
  parapets, terracotta planters, mature trees and reed-covered timber pergolas.
- `our-garden-positano.jpg`: an arbored walkway with flowering climbing plants.
- `romms-with-seaview-positano.jpg`: white plaster, dark shutters and tiled terraces.
- Pool and beach photographs: curved pool against rock, masonry retaining walls,
  gray fractured coastal rock, and a small shingle cove.

Near-property slope geometry, plant species placement, villa arrangement and
stair connections remain an artistic interpretation pending the owner's
walking/LiDAR and drone material. Regional geography now uses the sources above.
Surface realism does not make the layout surveyed or reliable for navigation.
The sea is a decorative optical shader, not a fluid or tide model.

### Licensed surface maps

The four `public/models/textures/cliff-*.jpg` maps are the 1K **Marble Cliff 05**
asset by **Amal Kumar**, from https://polyhaven.com/a/marble_cliff_05, downloaded
21 September 2026. License: **CC0**, https://polyhaven.com/license.

Original download root:
`https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/marble_cliff_05/`

| Local map | Original file |
| --- | --- |
| `cliff-color.jpg` | `marble_cliff_05_diff_1k.jpg` |
| `cliff-normal.jpg` | `marble_cliff_05_nor_gl_1k.jpg` |
| `cliff-height.jpg` | `marble_cliff_05_disp_1k.jpg` |
| `cliff-roughness.jpg` | `marble_cliff_05_rough_1k.jpg` |

These generic licensed surface samples are not scans of La Fenice. No reference
photographs or Poly Haven preview renders are embedded as textures.

Additional 1K CC0 maps downloaded 22 September 2026:

| Local maps | Source and author | Original files |
| --- | --- | --- |
| `earth-color.jpg`, `earth-normal.jpg` | [Forest Ground 03](https://polyhaven.com/a/forrest_ground_03), Rob Tuytel | `forrest_ground_03_diff_1k.jpg`, `forrest_ground_03_nor_gl_1k.jpg` |
| `pine-color.jpg`, `pine-alpha.jpg` | [Pine Tree 01](https://polyhaven.com/a/pine_tree_01), Rico Cilliers, photos by Rob Tuytel | `pine_tree_01_twig_diff_1k.jpg`, `pine_tree_01_twig_alpha_1k.jpg` |
| `leaves-color.jpg`, `leaves-alpha.jpg` | [Tree Small 02](https://polyhaven.com/a/tree_small_02), Rico Cilliers | `tree_small_02_leaves_diff_1k.jpg`, `tree_small_02_leaves_alpha_1k.jpg` |

Ground and cliff color/normal JPEGs are recompressed at quality 92 for transfer.
Branch atlases use alpha-tested, double-sided cards, not opaque canopy spheres.
The generic leaf samples suggest coastal planting; they do not establish the
property's species. Original download roots are
`https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/forrest_ground_03/`,
`https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/pine_tree_01/` and
`https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/tree_small_02/`.

The four illustrative buildings now have distinct massing: a setback upper floor,
a loggia, a patio and an L-shaped cottage. Window/door recesses, shutters, parapets,
coping, drainpipes, furniture and continuous arbor rails are modeled geometry.
These details are an interpretation of the photographs, not verified floor plans.
All four buildings have access paths. Continuous masonry supports the flights;
local terrain cuts keep the treads clear, and planting excludes the connecting
paths as well as the main descent. Arrival treads meet the terrace paving.

### Local mesh decoder

`public/models/draco/` contains the unmodified glTF Draco decoder bundled with
the installed `three@0.186.0`, copied from `examples/jsm/libs/draco/gltf`.
Google Draco is Apache-2.0 licensed; its full license and README are included.
Source: https://github.com/google/draco. No external decoder CDN is used.
The decoder is requested only when the visitor opens 3D; its single worker is
disposed after parsing. A failed model or decoder keeps the static image available.

## Rebuild

Blender 3.6:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/build-estate.py
```

Outputs: editable `artifacts/estate/la-fenice-study.blend`, web
`public/models/la-fenice-study.glb`, and `artifacts/estate/estate-poster.png`.
The build executes `scripts/build-estate-context.py` inside the same Blender
scene; keep the OSM subset and both elevation tiles in `artifacts/estate/context/`.
Convert the render to the public WebP poster with the installed Sharp library:

```sh
node -e 'require("sharp")("artifacts/estate/estate-poster.png").webp({quality:86}).toFile("public/models/estate-context-poster.webp")'
```

Read-only geometry regression check on the saved editable source:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background artifacts/estate/la-fenice-study.blend --python-exit-code 1 --python scripts/check-estate-access.py
```

This checks actual tread/landing samples against terrain and rock meshes,
the fourth cottage connection, mapped road placement, preservation of terrain
UV/color topology, and continuous shared-vertex colors without material switches.

Geometry is generated locally. Licensed color/normal/roughness maps are embedded
in the GLB; the height map is baked into limestone vertices before export.
Do not apply the height displacement a second time in the browser. The editable
Blender source packs its texture images. Draco reduces transfer size without
adding a JavaScript package. Asset tests cap the GLB at 10 MB, geometry at 450,000
triangles, material primitives below 48, and the first-load poster at 500 KB.
The poster is statically imported so its content hash changes with every render;
an older optimized image cannot mask a newly built model preview.

Three.js is loaded only after the
visitor explicitly opens the interactive view. The poster and descriptions work
without WebGL. The future footage updates the model, not the public data API.

## Verified context asset budget — 22 September 2026

8,287,212-byte compressed GLB, 434,006 triangles, 42 material primitives,
nine embedded images; 108,356-byte WebP poster. The city contributes 1,379
filtered mapped footprints, batched by material slots rather than separate draw calls.
Regional terrain has 14,636 triangles and stitches all 678 near-perimeter edges.
The outer property terrain reaches the same DEM before its boundary; color and
UV fields are shared. The inner property remains unchanged. This avoids a
rectangular plateau while keeping planting grounded during generation.

Generator assertions cover seams, color ranges, roof winding and sampled
foundations. OSM winding is normalized and zero-area roof triangles are omitted.
The UV handle is reacquired after color-attribute allocation in Blender 3.6.
The browser water uses a fixed 120-by-120 grid, capped pixel ratio 1.5 and at most
30 draws/second; offscreen, hidden-tab and reduced-motion states suspend animation.
The large sea boundary is hidden by distance haze, not a per-frame reflection pass.

## Local verification — geographic context, 22 September 2026

- `npm run check`: typecheck, lint, 112 unit tests and production build pass.
- Estate Playwright suite: 27 checks pass across 360, 768 and 1440 px in local
  Chrome, including four locales, on-demand decoder/model requests, cancellation
  and reopening, keyboard/drag, offscreen pause, reduced motion, failed model and
  decoder, missing WebGL/context loss, and JavaScript disabled. All six stages
  are captured, and the return button is checked for occlusion by fixed UI.
- Blender geometry check: 292 treads/landings sampled without terrain or rock
  intersections; minimum terrain clearance 0.506 m, fourth cottage connected
  and terrain UV/color topology intact.
- Blender poster and browser renders inspected at all three viewport widths.
- The in-app browser was also checked at 360, 768 and 1440 px: panorama, city
  stage and close stairs view; no console warnings/errors observed. Automated
  captures are in `test-results/`; this is not physical iPhone profiling.
- Next.js architecture audit: zero errors; 22 existing warnings outside the 3D code.
- No production deployment, commit, or changes to availability/concierge flows.

Remaining limitations: illustrative architecture and planting, not photogrammetry;
no owner-validated levels or path alignment; mobile hardware profiling still pending.

## Verified reference update — 24 September 2026

- Current GLB: **7,614,024 bytes, 420,490 triangles, 42 material primitives,
  eight embedded images**. The near and regional terrain share one primitive.
  Poster: 218,254-byte WebP. No geometry or transfer budget was relaxed.
- Regional terrain: 20,870 triangles, 678 preserved near-boundary edges;
  1,416 mapped building footprints and 31 SS163 ways. Local road elevations and
  retaining supports remain illustrative: the coarse DEM cannot resolve the
  actual road seat or bridge structure.
- Blender regression passes: 292 tread/landing objects checked, minimum terrain
  clearance 0.506 m; fourth cottage connected; road near the upper entry; terrain
  UVs and shared-vertex colors intact. Render and final browser model inspected:
  the former hard green/gray triangle patches are gone.
- `npm run check`: typecheck, lint, **120 unit tests** and production build pass.
  `playwright test tests/e2e/estate.spec.ts tests/e2e/dining.spec.ts`: **48/48** pass
  (27 estate, 21 dining) at 360, 768 and 1440 px. These test on-demand loading,
  all six views, localized content, keyboard/drag, pause/reopen, reduced motion,
  failed model/decoder, unavailable WebGL and JavaScript-disabled fallback.
- In-app browser: final 3D overview inspected at 1440 px and close stairs at all
  three widths; no horizontal overflow at 360/768. Final dining card inspected at 768 px;
  the automated dining suite covers all three widths and four languages.
- The shared order-state path now refuses a failed browser-storage write before
  publishing success. Two integration tests cover quota and access-denied errors,
  retained cart/notes, unchanged saved data and a retry creating exactly one order.
- Next.js audit of `src`: **0 errors, 20 heuristic warnings**; no new dependencies.
- No commit, push, production deployment, TestFlight update or real order/email.
  This is local browser/simulator evidence, not a physical-device performance test.

## Isolated 3D push verification — 24 September 2026

Final polish gives distant crowns 18 branch cards per lobe, keeping the same
200 canopy groups and existing atlas. The browser sea now combines four wave
directions with a slow bounded phase bend; its gradient includes the chain rule
so normals follow the displaced height field. This is still an optical shader,
not a fluid simulation. No dependency or render pass was added for this polish.

- Final asset: **7,757,992 bytes, 438,526 triangles, 42 material primitives,
  eight embedded images**; WebP poster **218,178 bytes**. All original budgets hold.
- Blender access/color regression passes again; poster and browser render inspected.
- An export of the Git index was installed from its own lockfile and built without
  unstaged files or local environment secrets: typecheck, lint, **78 unit tests**
  and production build pass. The full Playwright suite on that copy passes
  **94 checks**, with 20 deliberate viewport-specific skips. All 27 estate checks
  pass. The homepage regression now counts the added seventh section.
- This commit contains only the 3D feature, its translations, Three dependencies,
  source inputs, licensed assets, documentation and related tests. Availability,
  dining, iPad, Android, concierge and Supabase work is not part of this snapshot.
  Generated Blender source/render remain local; the scripts and required inputs
  are included to rebuild them. This push is not proof of a production release
  or a new TestFlight build.

### Existing dependency security follow-up

The isolated install's audit reports six existing advisories; all affected locked
versions were already in the previous commit, none comes from Three. Runtime
alerts include Next 16.2.12, Sharp 0.35.3 and transitive Nano ID 3.3.16. No vulnerable
input path was demonstrated here: remote image origins/uploads are not configured,
the public assets contain no AVIF/HEIF, and PostCSS calls `nanoid(6)`, not a custom
zero-length generator. This does not establish permanent safety.

Before a new public deployment, review and patch at least
[Next's image-optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4)
and [Sharp's libheif advisory](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c),
including the explicit Sharp override, then repeat audit/build/browser verification.
The dependency changes are intentionally not bundled into this 3D-only push.
