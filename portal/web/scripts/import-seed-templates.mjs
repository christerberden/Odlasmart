import { readFile } from "node:fs/promises";
import dns from "node:dns";
import path from "node:path";
import vm from "node:vm";
import pg from "pg";

const { Client } = pg;

dns.setDefaultResultOrder("ipv4first");

const appRoot = path.resolve(import.meta.dirname, "../../..");
const webRoot = path.resolve(import.meta.dirname, "..");
const catalogPath = path.join(appRoot, "seed_catalog_full.js");
const envPath = path.join(webRoot, ".env.local");

function parseEnvFile(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        return [
          line.slice(0, separatorIndex),
          line.slice(separatorIndex + 1).replace(/^["']|["']$/g, ""),
        ];
      }),
  );
}

function toNumber(value) {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function getValue(row, label) {
  return String(row[label] ?? "").trim();
}

function getSchedule(row) {
  return {
    forsaddStart: toNumber(row["Första försådd"]),
    forsaddEnd: toNumber(row["Sista försådd"]),
    directStart: toNumber(row["Första direktsådd"]),
    directEnd: toNumber(row["Sista direktsådd"]),
    transplantStart: toNumber(row["Första utplantering"]),
    transplantEnd: toNumber(row["Sista utplantering"]),
    harvestStart: toNumber(row["Första skörd"]),
    harvestEnd: toNumber(row["Sista skörd"]),
  };
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

const [envText, catalogSource] = await Promise.all([
  readFile(envPath, "utf8"),
  readFile(catalogPath, "utf8"),
]);

const env = parseEnvFile(envText);
const connectionString = process.env.DATABASE_URL || env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from .env.local.");
}

const rows = loadCatalog(catalogSource).map((row, index) => ({
  legacy_id: `seed-${index + 1}`,
  family: getValue(row, "Familj"),
  latin_family: getValue(row, "Latinska familjer"),
  crop: getValue(row, "Gröda"),
  variety: getValue(row, "Sort"),
  method: getValue(row, "Metod"),
  schedule: getSchedule(row),
  culture_time: getValue(row, "kulturtid"),
  spacing: getValue(row, "Plantavstånd"),
  row_spacing: getValue(row, "Radavstånd"),
  seed_per_75: toNumber(row["Frö/7,5m2"]),
  seed_per_m2: toNumber(row["Frö/m2"] ?? row["Frö/m²"]),
  harvest_interval: toNumber(row["Skördeintervall"]),
}));

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

try {
  await client.query("begin");

  for (const row of rows) {
    await client.query(
      `
        insert into public.seed_templates (
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
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
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
          harvest_interval = excluded.harvest_interval
      `,
      [
        row.legacy_id,
        row.family,
        row.latin_family,
        row.crop,
        row.variety,
        row.method,
        row.schedule.forsaddStart,
        row.schedule.forsaddEnd,
        row.schedule.transplantStart,
        row.schedule.transplantEnd,
        row.schedule.directStart,
        row.schedule.directEnd,
        row.schedule.harvestStart,
        row.schedule.harvestEnd,
        row.culture_time,
        row.spacing,
        row.row_spacing,
        row.seed_per_75,
        row.seed_per_m2,
        row.harvest_interval,
      ],
    );
  }

  await client.query("commit");

  const countResult = await client.query("select count(*)::int as count from public.seed_templates");
  const count = countResult.rows[0]?.count ?? rows.length;
  console.log(`Imported ${rows.length} seed templates. Table now contains ${count}.`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
