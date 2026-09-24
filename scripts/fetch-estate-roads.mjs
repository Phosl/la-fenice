// Read-only OSM acquisition; retains road geometry/tags, never contributor data.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const source = "https://api.openstreetmap.org/api/0.6/map.json?bbox=14.48,40.625,14.503,40.635";
const response = await fetch(source, { signal: AbortSignal.timeout(60000) });
assert(response.ok, `OSM request failed: ${response.status}`);
const data = await response.json();
const nodes = new Map(data.elements.filter((item) => item.type === "node").map((item) => [item.id, item]));
const elements = data.elements.filter((item) => item.type === "way" && item.tags?.ref === "SS163")
  .map((item) => ({
    type: "way", id: item.id,
    tags: Object.fromEntries(Object.entries(item.tags).filter(([key]) => ["highway", "ref", "name", "bridge", "tunnel", "layer", "width", "lanes", "surface"].includes(key))),
    geometry: item.nodes.map((id) => {
      const point = nodes.get(id);
      assert(point && Number.isFinite(point.lat) && Number.isFinite(point.lon), `Missing road node ${id}`);
      return { lat: point.lat, lon: point.lon };
    }),
  }));
assert(elements.length > 5 && elements.every((item) => item.geometry.length >= 2));
assert(elements.some((item) => item.geometry.some((point) => Math.abs(point.lat - 40.6277721) < .001 && Math.abs(point.lon - 14.4937307) < .001)), "No SS163 segment near La Fenice");
const subset = {
  source, retrievedAt: new Date().toISOString(),
  copyright: "© OpenStreetMap contributors",
  license: "https://opendatacommons.org/licenses/odbl/1-0/",
  attribution: "https://www.openstreetmap.org/copyright",
  note: "SS163 centerlines and mapped bridge tags. Road elevations, width where absent, retaining walls and bridge profiles in the visual study are illustrative, not surveyed. No Google geometry is used.",
  elements,
};
const serialized = `${JSON.stringify(subset)}\n`;
for (const relative of ["../artifacts/estate/context/positano-roads-osm.json", "../public/models/positano-roads-osm.json"]) {
  const target = new URL(relative, import.meta.url);
  await mkdir(fileURLToPath(new URL(".", target)), { recursive: true });
  await writeFile(target, serialized);
}
console.log(`Saved ${elements.length} SS163 ways, ${elements.reduce((total, item) => total + item.geometry.length, 0)} points; ${Buffer.byteLength(serialized)} bytes per copy.`);
