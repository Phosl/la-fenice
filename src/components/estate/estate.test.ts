// @vitest-environment node
import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getContent } from "@/lib/content";
import { supportedLocales } from "@/lib/content/routes";

describe("illustrative estate assets", () => {
  it("ships a bounded, self-contained GLB with visible stairs, pool and beach", () => {
    const file = readFileSync("public/models/la-fenice-study.glb");
    expect(file.toString("utf8", 0, 4)).toBe("glTF");
    expect(file.readUInt32LE(4)).toBe(2);
    expect(file.readUInt32LE(8)).toBe(file.length);
    // Textured terrain + architectural/plant detail, still loaded only on request.
    expect(file.length).toBeLessThan(10_000_000);
    const asset = JSON.parse(file.toString("utf8", 20, 20 + file.readUInt32LE(12)));
    const materials = asset.materials.map((material: { name: string }) => material.name);
    expect(materials).toEqual(expect.arrayContaining([
      "Stair treads", "Illustrative route", "Pebble beach", "Pool water",
      "Positano flat roofs", "Positano shaded openings", "Santa Maria Assunta majolica",
      "SS163 weathered asphalt",
    ]));
    expect(asset.buffers.every((buffer: { uri?: string }) => !buffer.uri)).toBe(true);
    expect(asset.images.length).toBeGreaterThanOrEqual(3);
    expect(asset.images.every((image: { uri?: string; bufferView?: number }) => !image.uri && Number.isInteger(image.bufferView))).toBe(true);
    expect(asset.extensionsRequired).toContain("KHR_draco_mesh_compression");
    const cliff = asset.materials.find((material: { name: string }) => material.name === "Limestone cliff");
    expect(cliff.pbrMetallicRoughness.baseColorTexture.index).toBeGreaterThanOrEqual(0);
    expect(cliff.pbrMetallicRoughness.metallicRoughnessTexture.index).toBeGreaterThanOrEqual(0);
    expect(cliff.normalTexture.index).toBeGreaterThanOrEqual(0);
    const terrainIndex = materials.indexOf("Limestone headland");
    expect(terrainIndex).toBeGreaterThanOrEqual(0);
    const terrain = asset.materials[terrainIndex];
    expect(terrain.pbrMetallicRoughness.baseColorTexture.index).toBeGreaterThanOrEqual(0);
    expect(terrain.normalTexture.index).toBeGreaterThanOrEqual(0);
    const terrainPrimitives = asset.meshes.flatMap((mesh: { primitives: { material: number; attributes: Record<string, number> }[] }) =>
      mesh.primitives.filter((primitive) => primitive.material === terrainIndex));
    expect(terrainPrimitives).toHaveLength(1);
    expect(terrainPrimitives[0].attributes.COLOR_0).toBeGreaterThanOrEqual(0);
    for (const name of ["Broadleaf branch cutout", "Pine needle cutout"]) {
      const foliage = asset.materials.find((material: { name: string }) => material.name === name);
      expect(foliage.alphaMode).toBe("MASK");
      expect(foliage.doubleSided).toBe(true);
      expect(foliage.alphaCutoff).toBeGreaterThan(0);
      const texture = asset.textures[foliage.pbrMetallicRoughness.baseColorTexture.index];
      expect(asset.images[texture.source].mimeType).toBe("image/png");
    }
    const primitives = asset.meshes.flatMap((mesh: { primitives: { indices: number }[] }) => mesh.primitives);
    expect(primitives.length).toBeLessThan(48); // City footprints must remain batched, not thousands of draw calls.
    const triangleCount = primitives
      .reduce((total: number, primitive: { indices: number }) => total + asset.accessors[primitive.indices].count / 3, 0);
    expect(triangleCount).toBeLessThan(450_000); // Near property + regional terrain and town, loaded on demand.
    expect(statSync("public/models/estate-context-poster.webp").size).toBeLessThan(500_000);
  });

  it("keeps the mapped city source and its attribution downloadable", () => {
    const source = JSON.parse(readFileSync("public/models/positano-osm.json", "utf8"));
    expect(source.elements.filter((item: { tags: Record<string, string> }) => item.tags.building)).toHaveLength(1488);
    expect(JSON.stringify(source)).toContain("OpenStreetMap");
    expect(JSON.stringify(source)).toContain("odbl");
    const roads = JSON.parse(readFileSync("public/models/positano-roads-osm.json", "utf8"));
    expect(roads.elements.length).toBeGreaterThan(20);
    expect(roads.elements.every((item: { tags: Record<string, string>; geometry: unknown[] }) =>
      item.tags.ref === "SS163" && item.geometry.length > 1)).toBe(true);
    expect(roads.elements.some((item: { tags: Record<string, string> }) => item.tags.bridge === "yes")).toBe(true);
    expect(JSON.stringify(roads)).toContain("odbl");
    expect(JSON.stringify(roads)).toContain("OpenStreetMap");
  });

  it("provides six stages and an explicit study disclaimer in every language", () => {
    for (const locale of supportedLocales) {
      const copy = getContent(locale).pages.home.estate;
      expect(copy.stops).toHaveLength(6);
      for (const value of Object.values(copy)) {
        if (typeof value === "string") expect(value.trim().length).toBeGreaterThan(4);
      }
      expect(copy.disclaimer.length).toBeGreaterThan(65);
      expect(copy.stops.every((stop) => stop.title.length > 3 && stop.text.length > 50)).toBe(true);
    }
  });
});
