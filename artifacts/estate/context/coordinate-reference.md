# La Fenice geographic reference

Checked 2026-09-22; no property-boundary survey is implied.

- Business pin: latitude 40.6277721, longitude 14.4937307.
- The public Google Hotels entity for La Fenice links to this exact Google Maps
  center and carries a hotel pin at 40.6278095, 14.4937257 (about 4 m away):
  https://www.google.com/travel/hotels/entity/ChcI84_ftv_K5-BtGgsvZy8xdGR0eHIyeBAB
- The legacy official page has a different marker at 40.6281394, 14.4899299,
  approximately 324 m west of the current listing. Raw source is preserved in
  `la-fenice-location-source.html`:
  https://www.lafenicepositano.com/where-we-are.php
- The legacy marker is near the Eden Roc hotel pin (40.628189, 14.489949) in
  Google's public hotel data, so it is not used to relocate the 3D property.
- Nominatim returned no exact La Fenice Positano match. The existing project
  origin is corroborated by the current public hotel listing, not by OSM.
- OSM building way 477202270 is named Eden Roc and is approximately 308 m west
  and 52 m north of the retained origin, independently corroborating the
  mismatch of the old official marker.
- OSM way 1268998290 (Santa Maria Assunta) is approximately 565 m west and 64 m
  north of the retained origin. This locates central Positano relative to the
  property without compressing its distance for the scene.

`positano-osm.json` contains 1,488 building ways and 3 coastline ways with 13,352
geometry points. Downloaded from the official OSM API on 2026-09-22:
https://api.openstreetmap.org/api/0.6/map?bbox=14.47,40.623,14.504,40.644
Only geometry and essential building/coast/name tags are retained. OSM ways
intersecting the bounding box can include vertices outside it.

OSM geometry must retain attribution to OpenStreetMap contributors and its ODbL
license. Geometry is sourced from OSM, not traced from Google imagery.
https://www.openstreetmap.org/copyright
https://opendatacommons.org/licenses/odbl/1-0/

## Model alignment correction, 24 September 2026

The user supplied the Maps listing and two oblique views. Together with OSM way
191002271, these expose the old placement error: the listing pin is on the road
frontage, not the center of the descending gardens. The model now uses a local
origin 60 m south of that pin (`40.6277721 - 60 / 111320`, `14.4937307`).
All OSM coordinates and DEM samples use that same origin; the road and town are
not moved independently. The business pin therefore appears at local `(0, 60)`.
The church reference above is relative to the business pin; in model coordinates
its northing increases by 60 m. This is a qualitative alignment correction, not
an owner-validated footprint, elevation or boundary measurement. Internal paths,
pool and beach remain illustrative pending walking/drone footage.

`positano-roads-osm.json` retains SS163 geometry and relevant road/bridge tags
from the same official OSM bounding-box API, retrieved 24 September 2026. The
downloadable copy preserves its source, ODbL license and attribution. Google
imagery is not embedded, scraped for geometry, or redistributed.
