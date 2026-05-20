import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const appRoot = path.resolve(import.meta.dirname, "../../..");
const catalogPath = path.join(appRoot, "seed_catalog_full.js");
const outputDir = path.join(import.meta.dirname, "..", "supabase", "seed");
const outputPath = path.join(outputDir, "seed_templates.sql");

function sqlString(value) {
  if (value == null) {
    return "null";
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlNumber(value) {
  if (value == null || value === "") {
    return "null";
  }

  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? String(parsed) : "null";
}

function getValue(row, label) {
  return String(row[label] ?? "").trim();
}

function getSchedule(row) {
  return {
    forsaddStart: numberOrNull(row["Första försådd"]),
    forsaddEnd: numberOrNull(row["Sista försådd"]),
    directStart: numberOrNull(row["Första direktsådd"]),
    directEnd: numberOrNull(row["Sista direktsådd"]),
    transplantStart: numberOrNull(row["Första utplantering"]),
    transplantEnd: numberOrNull(row["Sista utplantering"]),
    harvestStart: numberOrNull(row["Första skörd"]),
    harvestEnd: numberOrNull(row["Sista skörd"]),
  };
}

function numberOrNull(value) {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function loadCatalog(source) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: catalogPath });

  if (!Array.isArray(sandbox.window.SEED_CATALOG_FULL)) {
    throw new Error("seed_catalog_full.js did not expose window.SEED_CATALOG_FULL.");
  }

  return sandbox.window.SEED_CATALOG_FULL;
}

const catalogSource = await readFile(catalogPath, "utf8");
const rows = loadCatalog(catalogSource);

const values = rows.map((row, index) => {
  const schedule = getSchedule(row);

  return `(
  ${sqlString(`seed-${index + 1}`)},
  ${sqlString(getValue(row, "Familj"))},
  ${sqlString(getValue(row, "Latinska familjer"))},
  ${sqlString(getValue(row, "Gröda"))},
  ${sqlString(getValue(row, "Sort"))},
  ${sqlString(getValue(row, "Metod"))},
  ${sqlNumber(schedule.forsaddStart)},
  ${sqlNumber(schedule.forsaddEnd)},
  ${sqlNumber(schedule.transplantStart)},
  ${sqlNumber(schedule.transplantEnd)},
  ${sqlNumber(schedule.directStart)},
  ${sqlNumber(schedule.directEnd)},
  ${sqlNumber(schedule.harvestStart)},
  ${sqlNumber(schedule.harvestEnd)},
  ${sqlString(getValue(row, "kulturtid"))},
  ${sqlString(getValue(row, "Plantavstånd"))},
  ${sqlString(getValue(row, "Radavstånd"))},
  ${sqlNumber(row["Frö/7,5m2"])},
  ${sqlNumber(row["Frö/m2"] ?? row["Frö/m²"])},
  ${sqlNumber(row["Skördeintervall"])}
)`;
});

const sql = `insert into public.seed_templates (
  legacy_id,
  family,
  latin_family,
  crop,
  variety,
  method,
  "forsaddStart",
  "forsaddEnd",
  "transplantStart",
  "transplantEnd",
  "directStart",
  "directEnd",
  "harvestStart",
  "harvestEnd",
  culture_time,
  spacing,
  row_spacing,
  seed_per_75,
  seed_per_m2,
  harvest_interval
)
values
${values.join(",\n")}
on conflict (legacy_id)
do update set
  family = excluded.family,
  latin_family = excluded.latin_family,
  crop = excluded.crop,
  variety = excluded.variety,
  method = excluded.method,
  "forsaddStart" = excluded."forsaddStart",
  "forsaddEnd" = excluded."forsaddEnd",
  "transplantStart" = excluded."transplantStart",
  "transplantEnd" = excluded."transplantEnd",
  "directStart" = excluded."directStart",
  "directEnd" = excluded."directEnd",
  "harvestStart" = excluded."harvestStart",
  "harvestEnd" = excluded."harvestEnd",
  culture_time = excluded.culture_time,
  spacing = excluded.spacing,
  row_spacing = excluded.row_spacing,
  seed_per_75 = excluded.seed_per_75,
  seed_per_m2 = excluded.seed_per_m2,
  harvest_interval = excluded.harvest_interval;
`;

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, sql, "utf8");

console.log(`Wrote ${rows.length} seed template rows to ${outputPath}`);
