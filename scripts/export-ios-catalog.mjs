import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Script } from "node:vm";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const seedFile = new URL("src/lib/demo-portal/seed.ts", root);
const guideFile = new URL("src/lib/demo-portal/guide-seed.ts", root);
const outputFile = new URL("ios/LaFenice/Resources/catalog.json", root);
const timestamp = "2026-09-23T00:00:00.000Z";
assert(process.argv.slice(2).every((arg) => arg === "--check"), "Only --check is supported.");

function evaluateCatalog(source, filename, exportName) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  const exports = {};
  // Only the two repository seed functions run here: no require, process, network or account seed.
  new Script(outputText, { filename }).runInNewContext({ exports }, { timeout: 1_000 });
  assert.equal(typeof exports[exportName], "function", `Missing ${exportName}`);
  return exports[exportName](timestamp);
}

const seed = await readFile(seedFile, "utf8");
const parsed = ts.createSourceFile(fileURLToPath(seedFile), seed, ts.ScriptTarget.Latest, true);
const catalogDeclarations = parsed.statements.filter((statement) =>
  (ts.isFunctionDeclaration(statement) && statement.name?.text === "createSeedCatalog") ||
  (ts.isVariableStatement(statement) && statement.declarationList.declarations.some(
    (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === "labels",
  )),
);
assert.equal(catalogDeclarations.length, 2, "The web catalog declarations changed; review the exporter.");
const catalog = [
  ...evaluateCatalog(
    catalogDeclarations.map((statement) => statement.getFullText(parsed)).join("\n") + "\nexport { createSeedCatalog };",
    fileURLToPath(seedFile),
    "createSeedCatalog",
  ),
  ...evaluateCatalog(await readFile(guideFile, "utf8"), fileURLToPath(guideFile), "createGuideSeedCatalog"),
];

assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length, "Duplicate catalog IDs.");
assert.deepEqual(catalog.reduce((counts, item) => {
  assert(["en", "it", "de", "ru"].every((locale) => item.labels[locale]?.trim()), `Missing label: ${item.id}`);
  assert(!("password" in item) && !("passwordHash" in item) && !("accounts" in item), "Unexpected account data.");
  counts[item.kind] = (counts[item.kind] ?? 0) + 1;
  return counts;
}, {}), { product: 8, activity: 3, guide: 24 }, "Catalog changed; review the exported scope.");

const json = `${JSON.stringify(catalog, null, 2)}\n`;
if (process.argv.includes("--check")) {
  assert.equal(await readFile(outputFile, "utf8"), json, "iOS catalog is stale. Run node scripts/export-ios-catalog.mjs.");
  console.log(`iOS catalog matches the website: ${catalog.length} items, EN/IT/DE/RU.`);
} else {
  await writeFile(outputFile, json);
  console.log(`Exported ${catalog.length} public catalog items to ${fileURLToPath(outputFile)}.`);
}
