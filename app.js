const DB_NAMES = {
  seedLegacy: "frodatabas-db",
  seedGlobal: "frodatabas-global-db",
  seedPersonal: "frodatabas-personlig-db",
  cultivation: "egen-odling-db",
};

const STORAGE_KEYS = {
  cultivationSeeded: "odlingskalender:cultivation-seeded",
  weatherLocation: "odlingskalender:weather-location",
  weatherLocationRequested: "odlingskalender:weather-location-requested",
  activeYear: "odlingskalender:active-year",
  frostWindow: "odlingskalender:frost-window",
  harvestPrices: "odlingskalender:harvest-prices",
  seedGlobalVersion: "odlingskalender:seed-global-version",
  seedPersonalReset: "odlingskalender:seed-personal-reset",
  theme: "odlingskalender:theme",
};

const PLANNING_STOCK_NONE = "__none__";

const USER_DATA_FILE_NAME = "odlingskalender-data.json";
const SEED_CATALOG_VERSION = "2026-04-29-frodatabas-generell-1";
const supportsElectronDesktop = Boolean(window.electronDesktop?.isDesktop);
const supportsDirectoryPicker = typeof window.showDirectoryPicker === "function" || supportsElectronDesktop;

const FIELD_CANVAS_WIDTH = 3200;
const FIELD_CANVAS_HEIGHT = 2400;
const FIELD_SCALE = 34;
const FIELD_GRID_PX = FIELD_SCALE * 0.2;
const FIELD_CANVAS_PADDING_PX = 720;

const ACTIVITY_META = {
  forsadd: { label: "Försådd", color: "#87a97d", icon: "presow" },
  direktsadd: { label: "Direktsådd", color: "#c59a4e", icon: "directSow" },
  utplantering: { label: "Utplantering", color: "#5b91a2", icon: "transplantOut" },
  skord: { label: "Skörd", color: "#d16d58", icon: "harvestCrop" },
};

const SETTINGS_GUIDE_STEPS = [
  {
    title: "1. Menyn till vänster",
    page: "skiften",
    target: ".nav-list",
    targetLabel: "vänstermenyn",
    intro: "Du rör dig mellan sidorna med menyn till vänster. Just nu är du på Odlingsytor, där du bygger upp odlingens grund med skiften, bäddar och andra ytor.",
  },
  {
    title: "2. Lägg till skifte",
    page: "skiften",
    target: "#open-section-dialog",
    targetLabel: "knappen Lägg till skifte",
    intro: "Här på Odlingsytor börjar strukturen. Tryck på Lägg till skifte för att skapa första delen av odlingen och få ordning på växtföljden.",
  },
  {
    title: "3. Lägg till bädd",
    page: "skiften",
    target: "#open-field-dialog",
    targetLabel: "knappen Lägg till yta",
    intro: "När skiftet finns kan du lägga in en bädd eller annan yta. Det är de här bäddarna du sedan planerar grödor i på tidslinjen.",
  },
  {
    title: "4. Bäddlistan",
    page: "skiften",
    target: "#field-list",
    targetLabel: "bäddlistan till höger",
    intro: "Till höger ser du bäddlistan. Där kontrollerar du snabbt namn, skifte och innehåll utan att behöva leta runt i kartan.",
  },
  {
    title: "5. Byt sida i vänstermenyn",
    page: "skiften",
    target: '.nav-item[data-page="tidslinje"]',
    targetLabel: "menyvalet Odlingsplan",
    intro: "Nu byter du sida med vänstermenyn. Gå till Odlingsplan, där du lägger in grödor i bäddar och följer säsongen vecka för vecka.",
  },
  {
    title: "6. Knapparna högst upp",
    page: "tidslinje",
    target: '.page[data-page="tidslinje"] .section-head .toolbar-row',
    targetLabel: "knappraden högst upp",
    intro: "Här finns snabbknapparna för planeringen. Härifrån lägger du till grödor och hanterar import, export eller tömning av planeringen.",
  },
  {
    title: "7. Filter",
    page: "tidslinje",
    target: "#timeline-field-filters",
    targetLabel: "filtren för odlingsplanen",
    intro: "Filtren låter dig fokusera på rätt bädd, skifte eller grupp. Använd dem när planeringen blir tät och du vill jobba mer avgränsat.",
  },
  {
    title: "8. Byt sida i vänstermenyn",
    page: "tidslinje",
    target: '.nav-item[data-page="idag"]',
    targetLabel: "menyvalet Idag",
    intro: "Nu byter du sida med vänstermenyn igen. Gå till Idag, som visar vad som behöver göras just nu och den här veckan.",
  },
  {
    title: "9. Filter",
    page: "idag",
    target: ".today-toolbar",
    targetLabel: "filtren och valen ovanför uppgifterna",
    intro: "Här väljer du vilka uppgifter du vill se och kan filtrera fram rätt bädd. Det gör det lättare att arbeta lugnt, område för område.",
  },
  {
    title: "10. Snabböversikt",
    page: "idag",
    target: "#stats-grid",
    targetLabel: "snabböversikten till höger",
    intro: "Snabböversikten sammanfattar läget i odlingen. Här ser du direkt om något halkar efter eller om veckan ser lugn ut.",
  },
  {
    title: "11. Bocka av en uppgift",
    page: "idag",
    target: "#task-list .task-check",
    fallbackTarget: "#task-list",
    targetLabel: "uppgiftslistan",
    intro: "När du gjort något kan du bocka av uppgiften här. Då uppdateras både listan och översikten direkt.",
  },
  {
    title: "12. Byt sida i vänstermenyn",
    page: "idag",
    target: '.nav-item[data-page="skord"]',
    targetLabel: "menyvalet Skörd",
    intro: "Nu byter du sida med vänstermenyn till Skörd. Där följer du upp vad odlingen faktiskt gav och vad den är värd.",
  },
  {
    title: "13. Knapparna",
    page: "skord",
    target: '.page[data-page="skord"] .section-head .toolbar-row',
    targetLabel: "knapparna för skörd och prognos",
    intro: "Härifrån registrerar du skörd eller öppnar prognosen. Det är de två viktigaste startpunkterna på skördsidan.",
  },
  {
    title: "14. Prognos",
    page: "skord",
    target: "#open-harvest-forecast-dialog",
    targetLabel: "knappen Prognos",
    intro: "Prognosen uppskattar utfall och värde utifrån det som redan finns i planeringen och tidigare data. Den hjälper dig jämföra plan mot resultat.",
  },
  {
    title: "15. Byt sida i vänstermenyn",
    page: "skord",
    target: '.nav-item[data-page="egnafroer"]',
    targetLabel: "menyvalet Mina fröer",
    intro: "Nu byter du sida med vänstermenyn till Mina fröer. Där samlar du dina egna sorter och ser vad du har hemma.",
  },
  {
    title: "16. Knappar och sök",
    page: "egnafroer",
    target: '.page[data-page="egnafroer"] .toolbar-row',
    targetLabel: "knapparna och sökfältet för Mina fröer",
    intro: "Här lägger du till, importerar, exporterar och söker i Mina fröer. Det är den här listan som sedan driver resten av planeringen.",
  },
];

const FAMILY_VISUALS = {
  korgblommiga: { path: "./assets/familjer/korgblommiga.png", fallback: "blad" },
  flockblommiga: { path: "./assets/familjer/flockblommiga.png", fallback: "rot" },
  kalvaxter: { path: "./assets/familjer/kalvaxter.png", fallback: "kål" },
  mallvaxter: { path: "./assets/familjer/mallvaxter.png", fallback: "blad" },
  lokvaxter: { path: "./assets/familjer/lokvaxter.png", fallback: "lök" },
  artvaxter: { path: "./assets/familjer/artvaxter.png", fallback: "balj" },
  gurkvaxter: { path: "./assets/familjer/gurkvaxter.png", fallback: "gurka" },
  potatisvaxter: { path: "./assets/familjer/potatisvaxter.png", fallback: "nattskugga" },
  ortvaxter: { path: "./assets/familjer/ortvaxter.png", fallback: "blad" },
  grongodsling: { path: "./assets/familjer/grongodsling.png", fallback: "balj" },
};

const ALL_SEED_COLUMNS = [
  { key: "family", label: "Familj" },
  { key: "latinFamily", label: "Latinska familjer" },
  { key: "crop", label: "Gröda" },
  { key: "method", label: "Metod" },
  { key: "forsaddStart", label: "Första försådd" },
  { key: "forsaddEnd", label: "Sista försådd" },
  { key: "transplantStart", label: "Första utplantering" },
  { key: "transplantEnd", label: "Sista utplantering" },
  { key: "directStart", label: "Första direktsådd" },
  { key: "directEnd", label: "Sista direktsådd" },
  { key: "harvestStart", label: "Första skörd" },
  { key: "harvestEnd", label: "Sista skörd" },
  { key: "cultureTime", label: "kulturtid" },
  { key: "seedPerM2", label: "Frö/m2" },
  { key: "spacing", label: "Plantavstånd" },
  { key: "rowSpacing", label: "Radavstånd" },
];

const SEED_COLUMNS = ALL_SEED_COLUMNS;
const currentWeek = getISOWeek(new Date());
const currentYear = new Date().getFullYear();
const supportsDialogElement = typeof HTMLDialogElement !== "undefined" && typeof HTMLDialogElement.prototype.showModal === "function";

  const state = {
  page: "idag",
  activeYear: currentYear,
  taskStatus: "open",
  timelineView: "crops",
  timelineGroupBy: "field",
  timelineSectionFilter: "alla",
  timelineFamilyFilter: "alla",
  timelineCompletionFilter: "alla",
  taskTypes: new Set(),
  timelineTypes: new Set(Object.keys(ACTIVITY_META)),
  taskFields: new Set(),
  timelineFields: new Set(),
  planningFields: new Set(),
  planningSowingAdjustments: null,
  planningSowingControlMode: "spacing",
  seedStockSearch: "",
  seedStockView: "all",
  dialogFields: new Set(),
  globalSeedItems: [],
  personalSeedItems: [],
  allCrops: [],
  crops: [],
  allEvents: [],
  events: [],
  harvestEntries: [],
  seedInventoryEntries: [],
  seedStockEntries: [],
  sections: [],
  fields: [],
  activeCropId: null,
  activeSectionId: null,
  activeSeedId: null,
  activeSeedStockId: null,
  pendingSeedPurchaseKey: null,
  activeSeedSource: "personal",
  seedDialogMode: "list",
  dataDirectoryHandle: null,
  dataSyncQueued: false,
  dataSyncInProgress: false,
  dataSyncSuspended: false,
  theme: "light",
  settingsGuideStep: 0,
  settingsGuideOpen: false,
  dragFieldId: null,
  panMap: null,
  seedWorkbook: null,
  seedWorkbookName: "",
  cultivationWorkbookName: "",
  frostWindow: null,
  fieldZoom: 1,
  fieldWeek: currentWeek,
  fieldCanvasMetrics: null,
  fieldMapViewportInitialized: false,
  confirmAction: null,
  confirmCancelAction: null,
  noticeTimer: null,
  pendingHarvestEventId: null,
  pendingHarvestSourceCropId: null,
  pendingHarvestEntryId: null,
  pendingHarvestReturnTitle: null,
  pendingManualHarvestEntryId: null,
  pendingManualHarvestReturnTitle: null,
  pendingManualHarvestTitle: null,
  pendingFieldSectionId: null,
  activeFieldId: null,
  suppressFieldOpenId: null,
  sectionFamilyMenuSuppressedUntil: 0,
  resizeFieldId: null,
  planningSowMode: "auto",
  harvestView: "all",
  harvestPrices: {},
  harvestForecastDraft: {},
  weatherLocationSuggestions: [],
  weatherLocationSuggestTimer: null,
  weatherLocationSuggestRequestId: 0,
  sectionCollapse: {},
  dragTimeline: null,
  planningScheduleLinked: true,
  planningScheduleLock: null,
  planningPresowTransplantGap: null,
  planningTransplantHarvestGap: null,
  seedSort: { key: "crop", direction: "asc" },
  harvestSort: { key: "title", direction: "asc" },
  seedSearch: "",
};

const seedDefaults = (window.SEED_CATALOG_FULL ?? []).map((row, index) => ({
  id: `seed-${index + 1}`,
  family: getSeedRowValue(row, "Familj"),
  latinFamily: getSeedRowValue(row, "Latinska familjer"),
  crop: getSeedRowValue(row, "Gröda"),
  method: getSeedRowValue(row, "Metod"),
  variety: getSeedRowValue(row, "Sort"),
  cropSort: getSeedRowValue(row, "Gröda + sort"),
  expirationYear: getSeedRowValue(row, "Utgångsdatum"),
  notes: getSeedRowValue(row, "Anteckning"),
  cultureTime: getSeedRowValue(row, "kulturtid"),
  field: getSeedRowValue(row, "Skifte"),
  seedPer75: getSeedRowValue(row, "Frö/7,5m2"),
  seedPerM2: getFirstSeedRowValue(row, ["Frö/m2", "Frö/m²"]),
  m2odlat: getSeedRowValue(row, "m2 odlat"),
  spacing: getSeedRowValue(row, "Plantavstånd"),
  rowSpacing: getSeedRowValue(row, "Radavstånd"),
  seedInStock: getSeedRowValue(row, "Frö i lager"),
  rows: getSeedRowValue(row, "Rader"),
  schedule: {
    forsaddStart: toNumber(getSeedRowValue(row, "Första försådd")),
    forsaddEnd: toNumber(getSeedRowValue(row, "Sista försådd")),
    transplantStart: toNumber(getSeedRowValue(row, "Första utplantering")),
    transplantEnd: toNumber(getSeedRowValue(row, "Sista utplantering")),
    transplant: toNumber(getSeedRowValue(row, "Utplantering")),
    directStart: toNumber(getSeedRowValue(row, "Första direktsådd")),
    directEnd: toNumber(getSeedRowValue(row, "Sista direktsådd")),
    harvestStart: toNumber(getSeedRowValue(row, "Första skörd")),
    harvestEnd: toNumber(getSeedRowValue(row, "Sista skörd")),
  },
}));

function getAllSeedItems() {
  return [...state.globalSeedItems, ...state.personalSeedItems].map(normalizeSeedItem);
}

function getSeedItemsForView(view = "global") {
  const source = view === "personal" ? state.personalSeedItems : state.globalSeedItems;
  return source.map(normalizeSeedItem);
}

function getSeedStoreName(source = "personal") {
  return source === "global" ? DB_NAMES.seedGlobal : DB_NAMES.seedPersonal;
}

function isPersonalSeedId(seedId = "") {
  return String(seedId).startsWith("personal-seed-");
}

function getStockEntryForSeedItem(seedItem) {
  if (!seedItem) {
    return null;
  }
  return state.seedStockEntries.find((entry) => entry.id === seedItem.stockId)
    ?? state.seedStockEntries.find((entry) => entry.seedId === seedItem.id)
    ?? null;
}

function findPersonalSeedByGlobalReference(globalSeedId, variety = "", crop = "") {
  const normalizedVariety = String(variety ?? "").trim().toLocaleLowerCase("sv");
  const normalizedCrop = String(crop ?? "").trim().toLocaleLowerCase("sv");
  return state.personalSeedItems.find((item) => {
    const itemVariety = String(item.variety ?? "").trim().toLocaleLowerCase("sv");
    const itemCrop = String(item.crop ?? "").trim().toLocaleLowerCase("sv");
    return String(item.globalSeedId ?? "").trim() === String(globalSeedId ?? "").trim()
      && itemVariety === normalizedVariety
      && itemCrop === normalizedCrop;
  }) ?? null;
}

async function ensurePersonalSeedForStockEntry(stockEntry) {
  if (!stockEntry) {
    return null;
  }
  let linkedSeed = state.personalSeedItems.find((item) => item.stockId === stockEntry.id)
    ?? (isPersonalSeedId(stockEntry.seedId) ? state.personalSeedItems.find((item) => item.id === stockEntry.seedId) : null);
  const sourceSeed = getSeedItemById(stockEntry.seedId);
  const baseCrop = stockEntry.crop || sourceSeed?.crop || "";
  const baseVariety = stockEntry.variety || sourceSeed?.variety || "";
  if (!linkedSeed && stockEntry.seedId && !isPersonalSeedId(stockEntry.seedId)) {
    linkedSeed = findPersonalSeedByGlobalReference(stockEntry.seedId, baseVariety, baseCrop);
  }
  if (!linkedSeed) {
    linkedSeed = normalizeSeedItem({
      id: `personal-seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      stockId: stockEntry.id,
      globalSeedId: !isPersonalSeedId(stockEntry.seedId) ? stockEntry.seedId : "",
      family: sourceSeed?.family ?? "",
      latinFamily: sourceSeed?.latinFamily ?? "",
      crop: baseCrop,
      variety: baseVariety,
      method: sourceSeed?.method ?? "",
      spacing: sourceSeed?.spacing ?? "",
      rowSpacing: sourceSeed?.rowSpacing ?? "",
      cultureTime: sourceSeed?.cultureTime ?? "",
      seedPerM2: sourceSeed?.seedPerM2 ?? "",
      expirationYear: stockEntry.expirationYear ?? sourceSeed?.expirationYear ?? "",
      notes: stockEntry.notes ?? sourceSeed?.notes ?? "",
      schedule: cloneValue(sourceSeed?.schedule ?? {}),
    });
  } else {
    linkedSeed = normalizeSeedItem({
      ...linkedSeed,
      stockId: stockEntry.id,
      globalSeedId: linkedSeed.globalSeedId || (!isPersonalSeedId(stockEntry.seedId) ? stockEntry.seedId : ""),
      crop: linkedSeed.crop || baseCrop,
      variety: linkedSeed.variety || baseVariety,
      expirationYear: linkedSeed.expirationYear || stockEntry.expirationYear || "",
      notes: linkedSeed.notes || stockEntry.notes || "",
    });
  }
  await putRecord(DB_NAMES.seedPersonal, "items", linkedSeed);
  stockEntry.seedId = linkedSeed.id;
  await putRecord(DB_NAMES.cultivation, "seedStock", normalizeSeedStockEntry(stockEntry));
  const existingIndex = state.personalSeedItems.findIndex((item) => item.id === linkedSeed.id);
  if (existingIndex >= 0) {
    state.personalSeedItems.splice(existingIndex, 1, linkedSeed);
  } else {
    state.personalSeedItems.push(linkedSeed);
  }
  const stockIndex = state.seedStockEntries.findIndex((entry) => entry.id === stockEntry.id);
  if (stockIndex >= 0) {
    state.seedStockEntries.splice(stockIndex, 1, normalizeSeedStockEntry(stockEntry));
  }
  return linkedSeed;
}

function buildStockEntryFromSeedItem(seedItem, existingStockEntry = null, overrides = {}) {
  const quantity = Math.max(0, Math.floor(toNumber(overrides.quantity ?? existingStockEntry?.quantity) ?? 0));
  return normalizeSeedStockEntry({
    ...(existingStockEntry ?? {}),
    id: existingStockEntry?.id ?? seedItem.stockId ?? `seed-stock-${Date.now()}`,
    seedId: seedItem.id,
    name: [seedItem.crop, overrides.variety ?? seedItem.variety].filter(Boolean).join(" - ") || seedItem.crop || "Frö",
    crop: seedItem.crop ?? "",
    variety: overrides.variety ?? seedItem.variety ?? "",
    quantity,
    year: toNumber(overrides.year ?? existingStockEntry?.year),
    expirationYear: toNumber(overrides.expirationYear ?? existingStockEntry?.expirationYear ?? seedItem.expirationYear),
    supplier: String(overrides.supplier ?? existingStockEntry?.supplier ?? "").trim(),
    notes: String(overrides.notes ?? existingStockEntry?.notes ?? seedItem.notes ?? "").trim(),
  });
}

function getMySeedRows() {
  return state.personalSeedItems
    .map((item) => {
      const normalized = normalizeSeedItem(item);
      const stockEntry = getStockEntryForSeedItem(normalized);
      return {
        seed: normalized,
        stockEntry,
        crop: normalized.crop,
        variety: normalized.variety || stockEntry?.variety || "",
        family: normalized.family,
        method: normalized.method,
        quantity: Math.max(0, Math.floor(toNumber(stockEntry?.quantity) ?? 0)),
        year: stockEntry?.year ?? "",
        expirationYear: stockEntry?.expirationYear ?? normalized.expirationYear ?? "",
        supplier: stockEntry?.supplier ?? "",
        notes: stockEntry?.notes || normalized.notes || "",
      };
    })
    .filter((row) => matchesSeedSearch({
      ...row.seed,
      variety: row.variety,
      notes: row.notes,
    }, state.seedStockSearch))
    .filter((row) => state.seedStockView === "stocked" ? row.quantity > 0 : true)
    .sort(compareMySeedRows);
}

function compareMySeedRows(left, right) {
  const direction = state.seedSort.direction === "desc" ? -1 : 1;
  const key = state.seedSort.key || "crop";
  const numericKeys = new Set(["quantity", "year", "expirationYear"]);
  if (numericKeys.has(key)) {
    const leftValue = Number(left[key] ?? 0);
    const rightValue = Number(right[key] ?? 0);
    if (leftValue !== rightValue) {
      return (leftValue - rightValue) * direction;
    }
  } else {
    const leftValue = String(left[key] ?? "").toLowerCase();
    const rightValue = String(right[key] ?? "").toLowerCase();
    const comparison = leftValue.localeCompare(rightValue, "sv", { sensitivity: "base" });
    if (comparison !== 0) {
      return comparison * direction;
    }
  }
  const cropCompare = String(left.crop ?? "").localeCompare(String(right.crop ?? ""), "sv", { sensitivity: "base" });
  if (cropCompare !== 0) {
    return cropCompare;
  }
  return String(left.variety ?? "").localeCompare(String(right.variety ?? ""), "sv", { sensitivity: "base" });
}

function ensurePersonalSeedId(id) {
  const value = String(id ?? "").trim();
  if (!value) {
    return `personal-seed-${Date.now()}`;
  }
  return value.startsWith("personal-") ? value : `personal-${value}`;
}

function normalizeSeedComparable(item) {
  const normalized = normalizeSeedItem(item);
  return {
    family: normalized.family ?? "",
    latinFamily: normalized.latinFamily ?? "",
    crop: normalized.crop ?? "",
    method: normalized.method ?? "",
    variety: normalized.variety ?? "",
    cropSort: normalized.cropSort ?? "",
    expirationYear: normalized.expirationYear ?? "",
    notes: normalized.notes ?? "",
    cultureTime: normalized.cultureTime ?? "",
    field: normalized.field ?? "",
    seedPer75: normalized.seedPer75 ?? "",
    seedPerM2: normalized.seedPerM2 ?? "",
    harvestInterval: normalized.harvestInterval ?? null,
    m2odlat: normalized.m2odlat ?? "",
    rows: normalized.rows ?? "",
    spacing: normalized.spacing ?? "",
    rowSpacing: normalized.rowSpacing ?? "",
    seedInStock: normalized.seedInStock ?? "",
    stockId: normalized.stockId ?? "",
    schedule: {
      forsaddStart: normalized.schedule?.forsaddStart ?? null,
      forsaddEnd: normalized.schedule?.forsaddEnd ?? null,
      transplantStart: normalized.schedule?.transplantStart ?? null,
      transplantEnd: normalized.schedule?.transplantEnd ?? null,
      transplant: normalized.schedule?.transplant ?? null,
      directStart: normalized.schedule?.directStart ?? null,
      directEnd: normalized.schedule?.directEnd ?? null,
      harvestStart: normalized.schedule?.harvestStart ?? null,
      harvestEnd: normalized.schedule?.harvestEnd ?? null,
    },
  };
}

function seedItemsEquivalent(left, right) {
  return JSON.stringify(normalizeSeedComparable(left)) === JSON.stringify(normalizeSeedComparable(right));
}

const fieldDefaults = [
  { id: "badd-1", name: "Bädd 1", type: "bed", description: "Sallat och snabb vårföljd", width: 0.75, length: 12, rows: 2, x: 8, y: 12, plotWidth: 22, plotHeight: 34, sectionId: "skifte-1" },
  { id: "badd-2", name: "Bädd 2", type: "bed", description: "Kålväxter", width: 0.75, length: 12, rows: 2, x: 34, y: 12, plotWidth: 22, plotHeight: 34, sectionId: "skifte-1" },
  { id: "badd-3", name: "Bädd 3", type: "bed", description: "Rotfrukter", width: 0.75, length: 15, rows: 3, x: 60, y: 10, plotWidth: 24, plotHeight: 42, sectionId: "skifte-2" },
  { id: "badd-4", name: "Växthusbädd", type: "greenhouse", description: "Tomat och gurka", width: 0.9, length: 9, rows: 2, x: 24, y: 58, plotWidth: 28, plotHeight: 24, sectionId: "skifte-2" },
];

const sectionDefaults = [
  { id: "skifte-1", name: "Skifte 1", description: "Norra odlingen", family: "Korgblommiga", rotationEnabled: true, rotationOrder: 1 },
  { id: "skifte-2", name: "Skifte 2", description: "Södra odlingen", family: "Korsblommiga", rotationEnabled: true, rotationOrder: 2 },
];

const cropDefaults = [
  {
    id: "crop-1",
    seedId: "seed-15",
    title: "Huvudsallat",
    batchName: "Omgång 1",
    fieldIds: ["badd-1"],
    area: 4.5,
    note: "Första vårsallaten.",
    schedule: { forsaddStart: 11, forsaddEnd: 12, directStart: null, directEnd: null, transplant: 14, harvestStart: 20, harvestEnd: 23 },
  },
  {
    id: "crop-2",
    seedId: "seed-15",
    title: "Huvudsallat",
    batchName: "Omgång 2",
    fieldIds: ["badd-1", "badd-2"],
    area: 6,
    note: "Delas mellan två skiften.",
    schedule: { forsaddStart: 15, forsaddEnd: 16, directStart: null, directEnd: null, transplant: 18, harvestStart: 24, harvestEnd: 27 },
  },
  {
    id: "crop-3",
    seedId: "seed-39",
    title: "Tomat",
    batchName: "Växthus 1",
    fieldIds: ["badd-4"],
    area: 5.4,
    note: "Tomat längs sydsidan.",
    schedule: { forsaddStart: 10, forsaddEnd: 12, directStart: null, directEnd: null, transplant: 20, harvestStart: 28, harvestEnd: 40 },
  },
  {
    id: "crop-4",
    seedId: "seed-2",
    title: "Morot",
    batchName: "Sommarmorot",
    fieldIds: ["badd-3"],
    area: 3.5,
    note: "Direktsådd för skörd sensommar.",
    schedule: { forsaddStart: null, forsaddEnd: null, directStart: 16, directEnd: 17, transplant: null, harvestStart: 28, harvestEnd: 34 },
  },
];

const elements = {
  navItems: [...document.querySelectorAll(".nav-item")],
  pages: [...document.querySelectorAll(".page")],
  currentWeek: document.getElementById("current-week"),
  activeYearSelect: document.getElementById("active-year-select"),
  openTaskCount: document.getElementById("open-task-count"),
  cropCount: document.getElementById("crop-count"),
  topbarPresowCount: document.getElementById("topbar-presow-count"),
  topbarHarvestedCount: document.getElementById("topbar-harvested-count"),
  pageTitle: document.getElementById("page-title"),
  seedDbStatus: document.getElementById("seed-db-status"),
  cultivationDbStatus: document.getElementById("cultivation-db-status"),
  weatherTemp: document.getElementById("weather-temp"),
  weatherCurrentIcon: document.getElementById("weather-current-icon"),
  weatherLabel: document.getElementById("weather-label"),
  weatherLocation: document.getElementById("weather-location"),
  weatherRange: document.getElementById("weather-range"),
  weatherSoilTemp: document.getElementById("weather-soil-temp"),
  weatherWeek: document.getElementById("weather-week"),
  weatherAdvice: document.getElementById("weather-advice"),
  weatherRefreshLocation: document.getElementById("weather-refresh-location"),
  weatherLocationForm: document.getElementById("weather-location-form"),
  weatherLocationQuery: document.getElementById("weather-location-query"),
  weatherLocationSuggestions: document.getElementById("weather-location-suggestions"),
  weatherLocationStatus: document.getElementById("weather-location-status"),
  dataSetupDialog: document.getElementById("data-setup-dialog"),
  dataSetupChooseFolder: document.getElementById("data-setup-choose-folder"),
  dataSetupImportButton: document.getElementById("data-setup-import-button"),
  dataSetupSkipButton: document.getElementById("data-setup-skip-button"),
  dataSetupFolderName: document.getElementById("data-setup-folder-name"),
  dataSetupStatus: document.getElementById("data-setup-status"),
  dataImportFile: document.getElementById("data-import-file"),
  settingsExportBedsCsv: document.getElementById("settings-export-beds-csv"),
  settingsExportBedsXlsx: document.getElementById("settings-export-beds-xlsx"),
  settingsExportPlanningCsv: document.getElementById("settings-export-planning-csv"),
  settingsExportPlanningXlsx: document.getElementById("settings-export-planning-xlsx"),
  settingsChooseDataFolder: document.getElementById("settings-choose-data-folder"),
  settingsImportData: document.getElementById("settings-import-data"),
  settingsDataFolder: document.getElementById("settings-data-folder"),
  settingsWeatherCurrent: document.getElementById("settings-weather-current"),
  settingsOpenGuide: document.getElementById("settings-open-guide"),
  appGuideOverlay: document.getElementById("app-guide-overlay"),
  appGuideHighlight: document.getElementById("app-guide-highlight"),
  appGuidePopover: document.getElementById("app-guide-popover"),
  settingsGuideTitle: document.getElementById("settings-guide-title"),
  settingsGuideStep: document.getElementById("settings-guide-step"),
  settingsGuideIntro: document.getElementById("settings-guide-intro"),
  settingsGuideHint: document.getElementById("settings-guide-hint"),
  settingsGuidePoints: document.getElementById("settings-guide-points"),
  settingsGuideClose: document.getElementById("settings-guide-close"),
  settingsGuidePrev: document.getElementById("settings-guide-prev"),
  settingsGuideNext: document.getElementById("settings-guide-next"),
  themeButtons: [...document.querySelectorAll("#theme-switcher .segment")],
  taskFieldFilters: document.getElementById("task-field-filters"),
  timelineFieldFilters: document.getElementById("timeline-field-filters"),
  taskStatusFilter: document.getElementById("task-status-filter"),
  taskList: document.getElementById("task-list"),
  statsGrid: document.getElementById("stats-grid"),
  timelineRange: document.getElementById("timeline-range"),
  timelineWeeks: document.getElementById("timeline-weeks"),
  timelineRows: document.getElementById("timeline-rows"),
  timelineHelpButton: document.getElementById("timeline-help-button"),
  timelineHelpDialog: document.getElementById("timeline-help-dialog"),
  todayHelpButton: document.getElementById("today-help-button"),
  todayHelpDialog: document.getElementById("today-help-dialog"),
  seedHelpButton: document.getElementById("seed-help-button"),
  seedHelpDialog: document.getElementById("seed-help-dialog"),
  harvestHelpButton: document.getElementById("harvest-help-button"),
  harvestHelpDialog: document.getElementById("harvest-help-dialog"),
  fieldsHelpButton: document.getElementById("fields-help-button"),
  fieldsHelpDialog: document.getElementById("fields-help-dialog"),
  timelineViewButtons: [...document.querySelectorAll("#timeline-view-switcher .segment")],
  todayLegend: document.getElementById("today-legend"),
  timelineLegend: document.getElementById("timeline-legend"),
  topbarPlanNextButton: document.getElementById("topbar-plan-next-button"),
  topbarLogHarvestButton: document.getElementById("topbar-log-harvest-button"),
  openPlanningDialogButton: document.getElementById("open-planning-dialog"),
  openSeedShoppingListButton: document.getElementById("open-seed-shopping-list"),
  clearCultivationButton: document.getElementById("clear-cultivation-button"),
  cultivationImportFile: document.getElementById("cultivation-import-file"),
  cultivationExportButton: document.getElementById("cultivation-export-button"),
  openSeedDialogButton: document.getElementById("open-personal-seed-dialog"),
  openSeedStockDialogButton: document.getElementById("open-seed-stock-dialog"),
  seedStockSearchInput: document.getElementById("seed-stock-search-input"),
  seedStockBody: document.getElementById("seed-stock-body"),
  seedStockViewButtons: [...document.querySelectorAll("#seed-stock-view-switcher .segment")],
  planningDialog: document.getElementById("planning-dialog"),
  planningForm: document.getElementById("planning-form"),
  planningSeedId: document.getElementById("planning-seed-id"),
  planningCrop: document.getElementById("planning-crop"),
  planningVariety: document.getElementById("planning-variety"),
  planningSeedStockWrap: document.getElementById("planning-seed-stock-wrap"),
  planningSeedStock: document.getElementById("planning-seed-stock"),
    planningSowMethodWrap: document.getElementById("planning-sow-method-wrap"),
    planningSowMethod: document.getElementById("planning-sow-method"),
  planningScheduleGrid: document.getElementById("planning-schedule-grid"),
  planningPresow: document.getElementById("planning-presow"),
  planningPresowWrap: document.getElementById("planning-presow-wrap"),
  planningPresowLabel: document.getElementById("planning-presow-label"),
  planningPresowRecommendation: document.getElementById("planning-presow-recommendation"),
  planningDirect: document.getElementById("planning-direct"),
  planningDirectWrap: document.getElementById("planning-direct-wrap"),
  planningDirectRecommendation: document.getElementById("planning-direct-recommendation"),
  planningTransplant: document.getElementById("planning-transplant"),
  planningTransplantWrap: document.getElementById("planning-transplant-wrap"),
  planningTransplantLabel: document.getElementById("planning-transplant-label"),
  planningTransplantRecommendation: document.getElementById("planning-transplant-recommendation"),
  planningHarvest: document.getElementById("planning-harvest"),
  planningHarvestWrap: document.getElementById("planning-harvest-wrap"),
  planningHarvestLabel: document.getElementById("planning-harvest-label"),
  planningHarvestRecommendation: document.getElementById("planning-harvest-recommendation"),
  planningArea: document.getElementById("planning-area"),
    planningFieldFilters: document.getElementById("planning-field-filters"),
  planningCapacity: document.getElementById("planning-capacity"),
  planningRotationHint: document.getElementById("planning-rotation-hint"),
  planningScheduleWarning: document.getElementById("planning-schedule-warning"),
  planningSeedCountCard: document.getElementById("planning-seed-count-card"),
  planningSeedCount: document.getElementById("planning-seed-count"),
  planningSeedCountNote: document.getElementById("planning-seed-count-note"),
  planningSowingAdjustButton: document.getElementById("planning-sowing-adjust-button"),
  planningMiniTimeline: document.getElementById("planning-mini-timeline"),
  planningPreviewTitle: document.getElementById("planning-preview-title"),
  planningPreviewArea: document.getElementById("planning-preview-area"),
  planningPreviewFields: document.getElementById("planning-preview-fields"),
  planningPreviewStart: document.getElementById("planning-preview-start"),
  planningSowingDialog: document.getElementById("planning-sowing-dialog"),
  planningSowingForm: document.getElementById("planning-sowing-form"),
  planningSowingPreview: document.getElementById("planning-sowing-preview"),
  planningSowingStats: document.getElementById("planning-sowing-stats"),
  planningSowingRowSpacingLabel: document.getElementById("planning-sowing-row-spacing-label"),
  planningSowingManualRowsLabel: document.getElementById("planning-sowing-manual-rows-label"),
  planningSowingRowSpacing: document.getElementById("planning-sowing-row-spacing"),
  planningSowingPlantSpacing: document.getElementById("planning-sowing-plant-spacing"),
  planningSowingArea: document.getElementById("planning-sowing-area"),
  planningSowingManualRows: document.getElementById("planning-sowing-manual-rows"),
  planningSowingWarning: document.getElementById("planning-sowing-warning"),
  seedShoppingDialog: document.getElementById("seed-shopping-dialog"),
  seedShoppingMeta: document.getElementById("seed-shopping-meta"),
  seedShoppingBody: document.getElementById("seed-shopping-body"),
  seedPurchaseDialog: document.getElementById("seed-purchase-dialog"),
  seedPurchaseForm: document.getElementById("seed-purchase-form"),
  seedPurchaseTitle: document.getElementById("seed-purchase-title"),
  seedPurchaseMessage: document.getElementById("seed-purchase-message"),
  seedPurchaseQuantity: document.getElementById("seed-purchase-quantity"),
  seedShoppingHelpButton: document.getElementById("seed-shopping-help-button"),
  seedShoppingHelpDialog: document.getElementById("seed-shopping-help-dialog"),
  seedStockDialog: document.getElementById("seed-stock-dialog"),
  seedStockForm: document.getElementById("seed-stock-form"),
  seedStockDialogTitle: document.getElementById("seed-stock-dialog-title"),
  seedStockSeedId: document.getElementById("seed-stock-seed-id"),
  seedStockVariety: document.getElementById("seed-stock-variety"),
  seedStockQuantity: document.getElementById("seed-stock-quantity"),
  seedStockYear: document.getElementById("seed-stock-year"),
  seedStockExpiration: document.getElementById("seed-stock-expiration"),
  seedStockSupplier: document.getElementById("seed-stock-supplier"),
  seedStockNotes: document.getElementById("seed-stock-notes"),
  seedStockDelete: document.getElementById("seed-stock-delete"),
  seedImportFile: document.getElementById("personal-seed-import-file"),
  seedExportButton: document.getElementById("personal-seed-export-button"),
  seedSearchInput: document.getElementById("seed-search-input"),
  seedSearchInputSecondary: document.getElementById("seed-search-input-secondary"),
  seedTableBody: document.getElementById("seed-table-body"),
  seedTableBodySecondary: document.getElementById("seed-table-body-secondary"),
  seedHelpButtonSecondary: document.getElementById("seed-help-button-secondary"),
  harvestSummaryCards: document.getElementById("harvest-summary-cards"),
  harvestSummaryBody: document.getElementById("harvest-summary-body"),
  harvestSummaryTable: document.getElementById("harvest-summary-table"),
  harvestViewButtons: [...document.querySelectorAll("#harvest-view-switcher .segment")],
  openHarvestForecastDialogButton: document.getElementById("open-harvest-forecast-dialog"),
  openManualHarvestDialogButton: document.getElementById("open-manual-harvest-dialog"),
  openSectionDialogButton: document.getElementById("open-section-dialog"),
  openFieldDialogButton: document.getElementById("open-field-dialog"),
  sectionDialog: document.getElementById("section-dialog"),
  sectionDialogForm: document.getElementById("section-dialog-form"),
  sectionName: document.getElementById("section-name"),
  sectionDescription: document.getElementById("section-description"),
  sectionFamily: document.getElementById("section-family"),
  sectionFamilyOptions: document.getElementById("section-family-options"),
  sectionRotationEnabled: document.getElementById("section-rotation-enabled"),
  sectionRotationOrder: document.getElementById("section-rotation-order"),
  sectionDialogCancel: document.getElementById("section-dialog-cancel"),
  fieldDialog: document.getElementById("field-dialog"),
  fieldDialogForm: document.getElementById("field-dialog-form"),
  fieldDialogCancel: document.getElementById("field-dialog-cancel"),
  fieldName: document.getElementById("field-name"),
  fieldType: document.getElementById("field-type"),
  fieldWidth: document.getElementById("field-width"),
  fieldLength: document.getElementById("field-length"),
  fieldCountWrap: document.getElementById("field-count-wrap"),
  fieldCount: document.getElementById("field-count"),
  fieldSectionChips: document.getElementById("field-section-chips"),
  fieldMap: document.getElementById("field-map"),
  fieldMapCanvas: document.getElementById("field-map-canvas"),
  fieldMapWorkspace: document.getElementById("field-map-workspace"),
  fieldList: document.getElementById("field-list"),
  fieldInfoDialog: document.getElementById("field-info-dialog"),
  fieldInfoForm: document.getElementById("field-info-form"),
  fieldInfoTitle: document.getElementById("field-info-title"),
  fieldInfoName: document.getElementById("field-info-name"),
  fieldInfoType: document.getElementById("field-info-type"),
  fieldInfoWidth: document.getElementById("field-info-width"),
  fieldInfoLength: document.getElementById("field-info-length"),
  fieldInfoSection: document.getElementById("field-info-section"),
  fieldInfoStatus: document.getElementById("field-info-status"),
  fieldInfoRotateLeft: document.getElementById("field-info-rotate-left"),
  fieldInfoRotateRight: document.getElementById("field-info-rotate-right"),
  fieldInfoDelete: document.getElementById("field-info-delete"),
  fieldTimeSlider: document.getElementById("field-time-slider"),
  fieldTimeLabel: document.getElementById("field-time-label"),
  fieldZoomIn: document.getElementById("field-zoom-in"),
  fieldZoomOut: document.getElementById("field-zoom-out"),
  fieldZoomReset: document.getElementById("field-zoom-reset"),
  fieldZoomFit: document.getElementById("field-zoom-fit"),
  fieldZoomLabel: document.getElementById("field-zoom-label"),
  fieldFullscreenToggle: document.getElementById("field-fullscreen-toggle"),
  dialog: document.getElementById("crop-dialog"),
  dialogForm: document.getElementById("crop-dialog-form"),
  dialogTitle: document.getElementById("dialog-title"),
  dialogDelete: document.getElementById("dialog-delete"),
  dialogPreviewArea: document.getElementById("dialog-preview-area"),
  dialogPreviewFields: document.getElementById("dialog-preview-fields"),
  dialogPreviewStart: document.getElementById("dialog-preview-start"),
  dialogPresowStart: document.getElementById("dialog-presow-start"),
  dialogPresowEnd: document.getElementById("dialog-presow-end"),
  dialogDirectStart: document.getElementById("dialog-direct-start"),
  dialogDirectEnd: document.getElementById("dialog-direct-end"),
  dialogTransplant: document.getElementById("dialog-transplant"),
  dialogHarvestStart: document.getElementById("dialog-harvest-start"),
  dialogHarvestEnd: document.getElementById("dialog-harvest-end"),
  dialogArea: document.getElementById("dialog-area"),
  dialogFields: document.getElementById("dialog-fields"),
  dialogCapacity: document.getElementById("dialog-capacity"),
  dialogTaskList: document.getElementById("dialog-task-list"),
  dialogNote: document.getElementById("dialog-note"),
  seedDialog: document.getElementById("seed-dialog"),
  seedDialogForm: document.getElementById("seed-dialog-form"),
  seedDialogHeading: document.getElementById("seed-dialog-heading"),
  seedDialogTitle: document.getElementById("seed-dialog-title"),
  seedDialogFamily: document.getElementById("seed-dialog-family"),
  seedDialogField: document.getElementById("seed-dialog-field"),
  seedDialogPresow: document.getElementById("seed-dialog-presow"),
  seedDialogFamilyInput: document.getElementById("seed-dialog-family-input"),
  seedDialogLatinFamily: document.getElementById("seed-dialog-latin-family"),
  seedDialogCrop: document.getElementById("seed-dialog-crop"),
  seedDialogVariety: document.getElementById("seed-dialog-variety"),
  seedDialogMethod: document.getElementById("seed-dialog-method"),
  seedDialogSpacing: document.getElementById("seed-dialog-spacing"),
  seedDialogRowSpacing: document.getElementById("seed-dialog-row-spacing"),
  seedDialogForsaddStart: document.getElementById("seed-dialog-forsadd-start"),
  seedDialogForsaddEnd: document.getElementById("seed-dialog-forsadd-end"),
  seedDialogTransplantStart: document.getElementById("seed-dialog-transplant-start"),
  seedDialogTransplantEnd: document.getElementById("seed-dialog-transplant-end"),
  seedDialogDirectStart: document.getElementById("seed-dialog-direct-start"),
  seedDialogDirectEnd: document.getElementById("seed-dialog-direct-end"),
  seedDialogCultureTime: document.getElementById("seed-dialog-culture-time"),
  seedDialogHarvestStart: document.getElementById("seed-dialog-harvest-start"),
  seedDialogHarvestEnd: document.getElementById("seed-dialog-harvest-end"),
  seedDialogSeedPerM2: document.getElementById("seed-dialog-seed-per-m2"),
  seedDialogQuantity: document.getElementById("seed-dialog-quantity"),
  seedDialogYear: document.getElementById("seed-dialog-year"),
  seedDialogExpiration: document.getElementById("seed-dialog-expiration"),
  seedDialogSupplier: document.getElementById("seed-dialog-supplier"),
  seedDialogNotes: document.getElementById("seed-dialog-notes"),
  seedDialogReadonlyNote: document.getElementById("seed-dialog-readonly-note"),
  seedDialogModeWrap: document.getElementById("seed-dialog-mode-wrap"),
  seedDialogModeButtons: [...document.querySelectorAll("[data-seed-dialog-mode]")],
  seedDialogTemplateWrap: document.getElementById("seed-dialog-template-wrap"),
  seedDialogTemplateId: document.getElementById("seed-dialog-template-id"),
  seedDialogDelete: document.getElementById("seed-dialog-delete"),
  seedDialogSave: document.getElementById("seed-dialog-save"),
  seedDialogStockId: document.getElementById("seed-dialog-stock-id"),
  confirmDialog: document.getElementById("confirm-dialog"),
  confirmDialogForm: document.getElementById("confirm-dialog-form"),
  confirmDialogTitle: document.getElementById("confirm-dialog-title"),
  confirmDialogMessage: document.getElementById("confirm-dialog-message"),
  confirmDialogCancel: document.getElementById("confirm-dialog-cancel"),
  confirmDialogConfirm: document.getElementById("confirm-dialog-confirm"),
  clearCultivationDialog: document.getElementById("clear-cultivation-dialog"),
  clearCultivationCancel: document.getElementById("clear-cultivation-cancel"),
  clearCultivationDiscard: document.getElementById("clear-cultivation-discard"),
  clearCultivationRestore: document.getElementById("clear-cultivation-restore"),
  appNotice: document.getElementById("app-notice"),
  harvestDialog: document.getElementById("harvest-dialog"),
  harvestDialogForm: document.getElementById("harvest-dialog-form"),
  harvestDialogTitle: document.getElementById("harvest-dialog-title"),
  harvestDialogMessage: document.getElementById("harvest-dialog-message"),
  harvestDialogKilograms: document.getElementById("harvest-dialog-kilograms"),
  harvestDialogMore: document.getElementById("harvest-dialog-more"),
  harvestDialogCancel: document.getElementById("harvest-dialog-cancel"),
  harvestDialogDelete: document.getElementById("harvest-dialog-delete"),
  harvestDetailDialog: document.getElementById("harvest-detail-dialog"),
  harvestDetailTitle: document.getElementById("harvest-detail-title"),
  harvestDetailMeta: document.getElementById("harvest-detail-meta"),
  harvestDetailChart: document.getElementById("harvest-detail-chart"),
  harvestDetailEmpty: document.getElementById("harvest-detail-empty"),
  harvestDetailList: document.getElementById("harvest-detail-list"),
  harvestDetailAdd: document.getElementById("harvest-detail-add"),
  harvestDetailDelete: document.getElementById("harvest-detail-delete"),
  harvestForecastDialog: document.getElementById("harvest-forecast-dialog"),
  harvestForecastBody: document.getElementById("harvest-forecast-body"),
  harvestForecastTotal: document.getElementById("harvest-forecast-total"),
  manualHarvestDialog: document.getElementById("manual-harvest-dialog"),
  manualHarvestForm: document.getElementById("manual-harvest-form"),
  manualHarvestTitle: document.getElementById("manual-harvest-title"),
  manualHarvestMessage: document.getElementById("manual-harvest-message"),
  manualHarvestSeed: document.getElementById("manual-harvest-seed"),
  manualHarvestKilograms: document.getElementById("manual-harvest-kilograms"),
  manualHarvestWeek: document.getElementById("manual-harvest-week"),
  manualHarvestDelete: document.getElementById("manual-harvest-delete"),
  manualHarvestCancel: document.getElementById("manual-harvest-cancel"),
};

bootstrap().catch((error) => {
  console.error(error);
  if (elements.seedDbStatus) {
    elements.seedDbStatus.textContent = "Fel";
  }
  if (elements.cultivationDbStatus) {
    elements.cultivationDbStatus.textContent = "Fel";
  }
});

async function bootstrap() {
  bindUi();
  restoreActiveYear();
  restoreHarvestPreferences();
  restoreThemePreference();
  applyTheme();
  restoreCachedFrostWindow();
  if (elements.currentWeek) {
    elements.currentWeek.textContent = String(currentWeek);
  }
  await seedDatabasesIfNeeded();
  state.dataDirectoryHandle = await getStoredDataDirectoryHandle();
  await loadState();
  renderAll();
  hydrateWeatherWidget();
  await ensureUserDataSetup();
}

function cloneValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function syncDialogBodyState() {
  document.body.classList.toggle("has-dialog-open", Boolean(document.querySelector(".dialog[open]")));
}

function showDialog(dialog) {
  if (!dialog) {
    return;
  }
  if (supportsDialogElement) {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
    syncDialogBodyState();
  }
}

function closeDialog(dialog) {
  if (!dialog) {
    return;
  }
  if (supportsDialogElement && typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
    syncDialogBodyState();
  }
}

function hideSectionFamilyOptions() {
  elements.sectionFamilyOptions?.setAttribute("hidden", "");
}

function suppressSectionFamilyMenu(duration = 250) {
  state.sectionFamilyMenuSuppressedUntil = Date.now() + duration;
}

function applySectionFamilyOption(option) {
  if (!option || !elements.sectionFamily) {
    return;
  }
  elements.sectionFamily.value = option.dataset.familyOption ?? "";
  suppressSectionFamilyMenu();
  hideSectionFamilyOptions();
  elements.sectionFamily.dispatchEvent(new Event("change", { bubbles: true }));
  window.setTimeout(() => {
    elements.sectionFamily?.blur();
  }, 0);
}

function bindUi() {
  ensureDialogCloseButtons();
  elements.navItems.forEach((button) => {
    button.addEventListener("click", () => {
      state.page = button.dataset.page;
      if (state.page === "frodatabas") {
        state.seedSearch = "";
      }
      if (state.page === "egnafroer") {
        state.seedSearch = "";
      }
      renderNavigation();
      renderSeedTable();
      renderSeedStockPage();
    });
  });

  [...elements.taskStatusFilter.querySelectorAll(".segment")].forEach((button) => {
    button.addEventListener("click", () => {
      state.taskStatus = button.dataset.status;
      renderTaskStatus();
      renderToday();
    });
  });

  elements.openPlanningDialogButton?.addEventListener("click", () => {
    resetPlanningSowingAdjustments();
    renderPlanningForm();
    showDialog(elements.planningDialog);
  });
  elements.openSeedShoppingListButton?.addEventListener("click", openSeedShoppingDialog);
  elements.topbarPlanNextButton?.addEventListener("click", () => {
    state.page = "tidslinje";
    renderNavigation();
    resetPlanningSowingAdjustments();
    renderPlanningForm();
    showDialog(elements.planningDialog);
  });
  elements.topbarLogHarvestButton?.addEventListener("click", () => {
    state.page = "skord";
    renderNavigation();
    openManualHarvestDialog();
  });
  elements.openSeedDialogButton?.addEventListener("click", () => openSeedDialog(null, "personal"));
  elements.openSeedStockDialogButton?.addEventListener("click", () => openSeedStockDialog());
  elements.seedDialogModeButtons?.forEach((button) => {
    button.addEventListener("click", () => setSeedDialogMode(button.dataset.seedDialogMode || "list"));
  });
  elements.seedDialogTemplateId?.addEventListener("change", () => applySeedTemplateToSeedDialog(elements.seedDialogTemplateId.value));
  elements.seedStockSearchInput?.addEventListener("input", () => {
    state.seedStockSearch = elements.seedStockSearchInput.value.trim().toLowerCase();
    renderSeedStockPage();
  });
  elements.seedStockViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.seedStockView = button.dataset.view === "stocked" ? "stocked" : "all";
      renderSeedStockViewButtons();
      renderSeedStockPage();
    });
  });
  elements.seedStockBody?.addEventListener("click", (event) => {
    const row = event.target.closest("[data-seed-id]");
    if (row) {
      openSeedDialog(row.dataset.seedId, "personal");
    }
  });
  const seedStockTable = elements.seedStockBody?.closest("table");
  [...seedStockTable?.querySelectorAll(".table-sort-button") ?? []].forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.key;
      if (!key) {
        return;
      }
      if (state.seedSort.key === key) {
        state.seedSort.direction = state.seedSort.direction === "asc" ? "desc" : "asc";
      } else {
        state.seedSort.key = key;
        state.seedSort.direction = key === "crop" || key === "variety" ? "asc" : "desc";
      }
      renderSeedStockPage();
    });
  });
  elements.seedStockForm?.addEventListener("submit", handleSeedStockSubmit);
  elements.seedStockDelete?.addEventListener("click", handleSeedStockDelete);
  elements.seedStockSeedId?.addEventListener("change", () => fillSeedStockDialogFromSeed(elements.seedStockSeedId.value));
  elements.openSectionDialogButton?.addEventListener("click", () => {
    state.activeSectionId = null;
    elements.sectionDialogForm?.reset();
    if (elements.sectionRotationEnabled) {
      elements.sectionRotationEnabled.checked = true;
    }
    updateSectionRotationFieldState();
    showDialog(elements.sectionDialog);
  });
  elements.openFieldDialogButton?.addEventListener("click", () => {
    openFieldCreationDialog();
  });
  elements.clearCultivationButton?.addEventListener("click", handleClearCultivationRequest);
  elements.cultivationImportFile?.addEventListener("change", handleCultivationImport);
  elements.cultivationExportButton?.addEventListener("click", handleCultivationExport);
  elements.seedShoppingBody?.addEventListener("change", handleSeedShoppingTableChange);
  elements.seedShoppingBody?.addEventListener("click", handleSeedShoppingTableClick);
  elements.seedPurchaseForm?.addEventListener("submit", handleSeedPurchaseSubmit);
  elements.seedShoppingHelpButton?.addEventListener("click", () => showDialog(elements.seedShoppingHelpDialog));
  elements.clearCultivationCancel?.addEventListener("click", () => closeDialog(elements.clearCultivationDialog));
  elements.clearCultivationDiscard?.addEventListener("click", async () => {
    closeDialog(elements.clearCultivationDialog);
    await clearCultivation({ restoreSeeds: false });
  });
  elements.clearCultivationRestore?.addEventListener("click", async () => {
    closeDialog(elements.clearCultivationDialog);
    await clearCultivation({ restoreSeeds: true });
  });

  elements.timelineViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.timelineView = button.dataset.view;
      renderTimeline();
      renderTimelineViewButtons();
    });
  });
  elements.harvestViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.harvestView = button.dataset.view;
      renderHarvestViewButtons();
      renderHarvestPage();
    });
  });
  elements.openHarvestForecastDialogButton?.addEventListener("click", openHarvestForecastDialog);
  elements.timelineHelpButton?.addEventListener("click", () => showDialog(elements.timelineHelpDialog));
  elements.todayHelpButton?.addEventListener("click", () => showDialog(elements.todayHelpDialog));
  elements.seedHelpButton?.addEventListener("click", () => showDialog(elements.seedHelpDialog));
  elements.seedHelpButtonSecondary?.addEventListener("click", () => showDialog(elements.seedHelpDialog));
  elements.harvestHelpButton?.addEventListener("click", () => showDialog(elements.harvestHelpDialog));
  elements.fieldsHelpButton?.addEventListener("click", () => showDialog(elements.fieldsHelpDialog));
  elements.weatherRefreshLocation?.addEventListener("click", refreshWeatherLocation);
  elements.weatherLocationForm?.addEventListener("submit", handleWeatherLocationSearch);
  elements.weatherLocationQuery?.addEventListener("input", handleWeatherLocationQueryInput);
  elements.dataSetupChooseFolder?.addEventListener("click", handleChooseDataFolder);
  elements.dataSetupImportButton?.addEventListener("click", () => elements.dataImportFile?.click());
  elements.dataImportFile?.addEventListener("change", handleUserDataImportFile);
  elements.dataSetupSkipButton?.addEventListener("click", () => closeDialog(elements.dataSetupDialog));
  elements.settingsChooseDataFolder?.addEventListener("click", handleChooseDataFolder);
  elements.settingsImportData?.addEventListener("click", () => elements.dataImportFile?.click());
  elements.settingsExportBedsCsv?.addEventListener("click", () => exportBedsData("csv"));
  elements.settingsExportBedsXlsx?.addEventListener("click", () => exportBedsData("xlsx"));
  elements.settingsExportPlanningCsv?.addEventListener("click", () => exportPlanningData("csv"));
  elements.settingsExportPlanningXlsx?.addEventListener("click", () => exportPlanningData("xlsx"));
  elements.settingsOpenGuide?.addEventListener("click", openSettingsGuide);
  elements.settingsGuideClose?.addEventListener("click", closeSettingsGuide);
  elements.settingsGuidePrev?.addEventListener("click", () => changeSettingsGuideStep(-1));
  elements.settingsGuideNext?.addEventListener("click", () => changeSettingsGuideStep(1));
  elements.themeButtons.forEach((button) => {
    button.addEventListener("click", () => setTheme(button.dataset.theme));
  });
  elements.activeYearSelect?.addEventListener("change", () => {
    setActiveYear(toNumber(elements.activeYearSelect.value) ?? currentYear);
  });

  elements.planningCrop?.addEventListener("change", () => {
    syncPlanningSeedSelection({ resetVarietyOnCropChange: true });
  });
  elements.planningVariety?.addEventListener("input", () => {
    syncPlanningSeedSelection();
  });
  elements.planningSeedStock?.addEventListener("change", () => {
    applyPlanningSeedStockSelection(elements.planningSeedStock.value);
    renderPlanningSeedCount();
  });
  elements.planningPresow?.addEventListener("input", () => {
    handlePlanningLinkedWeekChange("presow");
    autoSelectPlanningField(resolvePlanningSeed({ allowSingleVariety: true }));
    syncPlanningAreaToSelectedField();
    renderPlanningCapacity();
  });
  elements.planningDirect?.addEventListener("input", () => {
    renderPlanningDerivedUi();
    autoSelectPlanningField(resolvePlanningSeed({ allowSingleVariety: true }));
    syncPlanningAreaToSelectedField();
    renderPlanningCapacity();
  });
  elements.planningTransplant?.addEventListener("input", () => {
    handlePlanningLinkedWeekChange("transplant");
    autoSelectPlanningField(resolvePlanningSeed({ allowSingleVariety: true }));
    syncPlanningAreaToSelectedField();
    renderPlanningCapacity();
  });
  elements.planningHarvest?.addEventListener("input", () => {
    handlePlanningLinkedWeekChange("harvest");
    autoSelectPlanningField(resolvePlanningSeed({ allowSingleVariety: true }));
    syncPlanningAreaToSelectedField();
    renderPlanningCapacity();
  });
  elements.planningDialog?.addEventListener("click", (event) => {
    const lockButton = event.target.closest("[data-planning-lock-toggle]");
    if (!lockButton) {
      return;
    }
    event.preventDefault();
    handlePlanningScheduleLockToggle();
  });
  elements.planningSowingAdjustButton?.addEventListener("click", openPlanningSowingDialog);
  elements.planningSowingForm?.addEventListener("submit", handlePlanningSowingSubmit);
  elements.planningSowingDialog?.addEventListener("click", (event) => {
    const lockButton = event.target.closest("[data-sowing-lock-toggle]");
    if (!lockButton) {
      return;
    }
    event.preventDefault();
    applyPlanningSowingControlMode(lockButton.dataset.sowingLockToggle);
    renderPlanningSowingDialogPreview();
  });
  [
    elements.planningSowingRowSpacing,
    elements.planningSowingPlantSpacing,
    elements.planningSowingArea,
    elements.planningSowingManualRows,
  ].forEach((input) => {
    input?.addEventListener("input", () => {
      if (input === elements.planningSowingRowSpacing) {
        applyPlanningSowingControlMode("spacing");
      }
      if (input === elements.planningSowingManualRows) {
        applyPlanningSowingControlMode("rows");
      }
      renderPlanningSowingDialogPreview();
    });
  });

  [elements.planningArea, elements.dialogArea].forEach((input) => {
    input?.addEventListener("input", () => {
      renderPlanningCapacity();
      renderDialogCapacity();
    });
  });
  [
    elements.dialogPresowStart,
    elements.dialogPresowEnd,
    elements.dialogDirectStart,
    elements.dialogDirectEnd,
    elements.dialogTransplant,
    elements.dialogHarvestStart,
    elements.dialogHarvestEnd,
  ].forEach((input) => input?.addEventListener("input", renderDialogCapacity));
  elements.dialogFields?.addEventListener("change", renderDialogCapacity);

  elements.planningForm.addEventListener("submit", handlePlanningSubmit);
  elements.dialogForm.addEventListener("submit", handleDialogSubmit);
  elements.dialogDelete?.addEventListener("click", handleCropDelete);
  elements.seedDialogForm?.addEventListener("submit", handleSeedDialogSubmit);
  elements.seedDialogDelete?.addEventListener("click", handleSeedDelete);
  [
    elements.seedDialogCrop,
    elements.seedDialogFamilyInput,
    elements.seedDialogLatinFamily,
    elements.seedDialogMethod,
    elements.seedDialogSpacing,
    elements.seedDialogRowSpacing,
    elements.seedDialogForsaddStart,
    elements.seedDialogForsaddEnd,
    elements.seedDialogTransplantStart,
    elements.seedDialogTransplantEnd,
    elements.seedDialogDirectStart,
    elements.seedDialogDirectEnd,
    elements.seedDialogHarvestStart,
    elements.seedDialogHarvestEnd,
  ].forEach((input) => input?.addEventListener("input", updateSeedDialogSummary));
  elements.seedDialogFamilyInput?.addEventListener("change", updateSeedDialogSummary);
  elements.seedDialogMethod?.addEventListener("change", updateSeedDialogSummary);
  elements.seedDialogStockId?.addEventListener("change", () => applySeedStockToSeedDialog(elements.seedDialogStockId.value));
  elements.seedExportButton?.addEventListener("click", handleSeedExport);
  elements.seedImportFile?.addEventListener("change", handleSeedImport);
  elements.seedSearchInput?.addEventListener("input", () => {
    state.seedSearch = elements.seedSearchInput.value.trim().toLowerCase();
    renderSeedTable();
  });
  elements.seedSearchInputSecondary?.addEventListener("input", () => {
    state.seedSearch = elements.seedSearchInputSecondary.value.trim().toLowerCase();
    renderSeedTable();
  });
  elements.openManualHarvestDialogButton?.addEventListener("click", () => openManualHarvestDialog());
  elements.fieldTimeSlider?.addEventListener("input", () => {
    state.fieldWeek = Number(elements.fieldTimeSlider.value) || currentWeek;
    renderFieldTimeLabel();
    renderFields();
  });
  elements.fieldZoomIn?.addEventListener("click", () => updateFieldZoom(0.1));
  elements.fieldZoomOut?.addEventListener("click", () => updateFieldZoom(-0.1));
  elements.fieldZoomReset?.addEventListener("click", () => setFieldZoom(1));
  elements.fieldZoomFit?.addEventListener("click", () => focusFieldMapOnGarden());
  elements.fieldFullscreenToggle?.addEventListener("click", toggleFieldMapFullscreen);
  document.addEventListener("fullscreenchange", handleFieldMapFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFieldMapFullscreenChange);
  elements.sectionDialogForm?.addEventListener("submit", handleSectionSubmit);
  elements.sectionRotationEnabled?.addEventListener("change", updateSectionRotationFieldState);
  elements.sectionFamily?.addEventListener("focus", () => renderSectionFamilyOptions(elements.sectionFamily.value));
  elements.sectionFamily?.addEventListener("input", () => renderSectionFamilyOptions(elements.sectionFamily.value));
  elements.sectionFamily?.addEventListener("blur", () => {
    window.setTimeout(() => {
      hideSectionFamilyOptions();
    }, 120);
  });
  elements.sectionFamilyOptions?.addEventListener("click", (event) => {
    const option = event.target.closest("[data-family-option]");
    if (!option) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    applySectionFamilyOption(option);
  });
  document.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      hideSectionFamilyOptions();
      return;
    }
    if (target.closest(".combo-field")) {
      return;
    }
    hideSectionFamilyOptions();
  });
  elements.fieldInfoForm?.addEventListener("submit", handleFieldInfoSubmit);
  elements.fieldInfoType?.addEventListener("change", () => {
    const currentValue = elements.fieldInfoName.value.trim();
    if (!currentValue) {
      elements.fieldInfoName.value = generateFieldNameSuggestion(elements.fieldInfoType.value, state.pendingFieldSectionId);
    }
  });
  elements.fieldInfoRotateLeft?.addEventListener("click", () => rotateActiveField(-90));
  elements.fieldInfoRotateRight?.addEventListener("click", () => rotateActiveField(90));
  elements.fieldInfoDelete?.addEventListener("click", handleFieldInfoDelete);
  elements.fieldDialogForm?.addEventListener("submit", handleFieldSubmit);
  elements.sectionDialogCancel?.addEventListener("click", () => {
    state.activeSectionId = null;
    closeDialog(elements.sectionDialog);
  });
  elements.fieldDialogCancel?.addEventListener("click", () => closeDialog(elements.fieldDialog));
  elements.fieldType?.addEventListener("change", () => {
    updateFieldDialogTypeState();
    if (!elements.fieldName?.value.trim()) {
      elements.fieldName.value = generateFieldNameSuggestion(elements.fieldType.value, state.pendingFieldSectionId);
    }
  });
  elements.confirmDialogForm?.addEventListener("submit", handleConfirmDialogSubmit);
  elements.confirmDialogCancel?.addEventListener("click", () => {
    state.confirmCancelAction?.();
    state.confirmAction = null;
    state.confirmCancelAction = null;
    closeDialog(elements.confirmDialog);
  });
  elements.confirmDialog?.addEventListener("close", () => {
    if (state.confirmCancelAction) {
      const cancelAction = state.confirmCancelAction;
      state.confirmAction = null;
      state.confirmCancelAction = null;
      cancelAction();
    }
  });
  elements.harvestDialogForm?.addEventListener("submit", handleHarvestDialogSubmit);
  elements.harvestDialogCancel?.addEventListener("click", handleHarvestDialogCancel);
  elements.harvestDialogDelete?.addEventListener("click", handleHarvestDialogDelete);
  elements.manualHarvestForm?.addEventListener("submit", handleManualHarvestSubmit);
  elements.manualHarvestCancel?.addEventListener("click", handleManualHarvestCancel);
  elements.manualHarvestDelete?.addEventListener("click", handleManualHarvestDelete);
  elements.harvestDetailAdd?.addEventListener("click", () => {
    if (state.pendingManualHarvestTitle) {
      closeDialog(elements.harvestDetailDialog);
      openManualHarvestDialog(null, state.pendingManualHarvestTitle);
    }
  });
  elements.harvestDetailDelete?.addEventListener("click", async () => {
    if (state.pendingManualHarvestTitle) {
      await deleteHarvestRowsForTitle(state.pendingManualHarvestTitle);
      closeDialog(elements.harvestDetailDialog);
    }
  });
  elements.harvestSummaryBody?.addEventListener("click", async (event) => {
    const row = event.target.closest(".harvest-row");
    if (row?.dataset.title) {
      openHarvestDetailDialog(decodeURIComponent(row.dataset.title));
    }
  });
  document.querySelectorAll("[data-dialog-close]").forEach((button) => {
    button.addEventListener("click", () => closeDialog(button.closest(".dialog")));
  });
  renderFieldSectionChips();
  renderFieldTimeLabel();
  enableFieldMapPan();
  window.addEventListener("resize", positionSettingsGuide);
  window.addEventListener("scroll", positionSettingsGuide, true);
}

function ensureDialogCloseButtons() {
  document.querySelectorAll(".dialog .dialog-card").forEach((card) => {
    if (card.querySelector(".planning-close, .dialog-close-button")) {
      return;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-button dialog-close-button";
    button.setAttribute("data-dialog-close", "");
    button.setAttribute("aria-label", "Stäng");
    button.textContent = "×";
    card.appendChild(button);
  });
}

async function seedDatabasesIfNeeded() {
  const globalSeedItems = await getAll(DB_NAMES.seedGlobal, "items");
  const storedGlobalSeedVersion = window.localStorage?.getItem(STORAGE_KEYS.seedGlobalVersion);
  const shouldReseedGlobalSeeds = globalSeedItems.length === 0
    || (seedDefaults.length > 20 && globalSeedItems.length < seedDefaults.length)
    || storedGlobalSeedVersion !== SEED_CATALOG_VERSION;
  if (shouldReseedGlobalSeeds) {
    for (const item of globalSeedItems) {
      await deleteRecord(DB_NAMES.seedGlobal, "items", item.id);
    }
    for (const item of seedDefaults) {
      await putRecord(DB_NAMES.seedGlobal, "items", item);
    }
    window.localStorage?.setItem(STORAGE_KEYS.seedGlobalVersion, SEED_CATALOG_VERSION);
  }

  const personalSeedItems = await getAll(DB_NAMES.seedPersonal, "items");
  const personalResetDone = window.localStorage?.getItem(STORAGE_KEYS.seedPersonalReset) === "true";
  if (!personalResetDone) {
    for (const item of personalSeedItems) {
      await deleteRecord(DB_NAMES.seedPersonal, "items", item.id);
    }
    window.localStorage?.setItem(STORAGE_KEYS.seedPersonalReset, "true");
  }

  const sections = await getAll(DB_NAMES.cultivation, "sections");
  if (sections.length === 0) {
    for (const section of sectionDefaults) {
      await putRecord(DB_NAMES.cultivation, "sections", section);
    }
  }

  const fields = await getAll(DB_NAMES.cultivation, "fields");
  if (fields.length === 0) {
    for (const field of fieldDefaults) {
      await putRecord(DB_NAMES.cultivation, "fields", field);
    }
  }

  const crops = await getAll(DB_NAMES.cultivation, "crops");
  const hasSeededCultivation = window.localStorage?.getItem(STORAGE_KEYS.cultivationSeeded) === "true";
  if (crops.length === 0 && !hasSeededCultivation) {
    for (const crop of cropDefaults) {
      await putRecord(DB_NAMES.cultivation, "crops", crop);
      await replaceEventsForCrop(crop);
    }
    window.localStorage?.setItem(STORAGE_KEYS.cultivationSeeded, "true");
  }
}

async function loadState() {
  state.globalSeedItems = (await getAll(DB_NAMES.seedGlobal, "items")).map(normalizeSeedItem);
  state.personalSeedItems = (await getAll(DB_NAMES.seedPersonal, "items")).map(normalizeSeedItem);
  state.sections = await getAll(DB_NAMES.cultivation, "sections");
  state.sections = state.sections.map(normalizeSection);
  for (const section of state.sections) {
    await putRecord(DB_NAMES.cultivation, "sections", section);
  }
  state.fields = (await getAll(DB_NAMES.cultivation, "fields")).map(normalizeField);
  const rawCrops = await getAll(DB_NAMES.cultivation, "crops");
  state.allCrops = rawCrops.map(normalizeCrop);
  for (let index = 0; index < rawCrops.length; index += 1) {
    const rawCrop = rawCrops[index];
    const normalizedCrop = state.allCrops[index];
    if (rawCrop.startYear !== normalizedCrop.startYear || rawCrop.endYear !== normalizedCrop.endYear) {
      await putRecord(DB_NAMES.cultivation, "crops", normalizedCrop);
    }
  }
  const cropMap = new Map(state.allCrops.map((crop) => [crop.id, crop]));
  const rawEvents = await getAll(DB_NAMES.cultivation, "events");
  const validRawEvents = [];
  state.allEvents = rawEvents
    .filter((event) => cropMap.has(event.cropId))
    .map((event) => {
      validRawEvents.push(event);
      return normalizeEvent(event, cropMap.get(event.cropId));
    });
  for (const orphanEvent of rawEvents.filter((event) => !cropMap.has(event.cropId))) {
    await deleteRecord(DB_NAMES.cultivation, "events", orphanEvent.id);
  }
  for (let index = 0; index < validRawEvents.length; index += 1) {
    const rawEvent = validRawEvents[index];
    const normalizedEvent = state.allEvents[index];
    if (rawEvent.year !== normalizedEvent.year) {
      await putRecord(DB_NAMES.cultivation, "events", normalizedEvent);
    }
  }
  const eventIdSet = new Set(state.allEvents.map((event) => event.id));
  const rawHarvestEntries = await getAll(DB_NAMES.cultivation, "harvests");
  state.harvestEntries = rawHarvestEntries
    .filter((entry) => {
      if (entry.manual) {
        return Boolean(entry.seedId);
      }
      return cropMap.has(entry.cropId) && (!entry.eventId || eventIdSet.has(entry.eventId));
    })
    .map(normalizeHarvestEntry);
  for (const orphanHarvest of rawHarvestEntries.filter((entry) => {
    if (entry.manual) {
      return !entry.seedId;
    }
    return !cropMap.has(entry.cropId) || (entry.eventId && !eventIdSet.has(entry.eventId));
  })) {
    await deleteRecord(DB_NAMES.cultivation, "harvests", orphanHarvest.id);
  }
  const rawSeedInventoryEntries = await getAll(DB_NAMES.cultivation, "seedInventory");
  state.seedInventoryEntries = rawSeedInventoryEntries.map(normalizeSeedInventoryEntry);
  for (let index = 0; index < rawSeedInventoryEntries.length; index += 1) {
    const rawEntry = rawSeedInventoryEntries[index];
    const normalizedEntry = state.seedInventoryEntries[index];
    if (JSON.stringify(rawEntry) !== JSON.stringify(normalizedEntry)) {
      await putRecord(DB_NAMES.cultivation, "seedInventory", normalizedEntry);
    }
  }
  const rawSeedStockEntries = await getAll(DB_NAMES.cultivation, "seedStock");
  state.seedStockEntries = rawSeedStockEntries.map(normalizeSeedStockEntry);
  for (let index = 0; index < rawSeedStockEntries.length; index += 1) {
    const rawEntry = rawSeedStockEntries[index];
    const normalizedEntry = state.seedStockEntries[index];
    if (JSON.stringify(rawEntry) !== JSON.stringify(normalizedEntry)) {
      await putRecord(DB_NAMES.cultivation, "seedStock", normalizedEntry);
    }
  }
  for (const entry of [...state.seedStockEntries]) {
    await ensurePersonalSeedForStockEntry(entry);
  }
  state.personalSeedItems = (await getAll(DB_NAMES.seedPersonal, "items")).map(normalizeSeedItem);
  state.seedStockEntries = (await getAll(DB_NAMES.cultivation, "seedStock")).map(normalizeSeedStockEntry);
  if (!state.sections.length) {
    state.sections = cloneValue(sectionDefaults);
    for (const section of state.sections) {
      await putRecord(DB_NAMES.cultivation, "sections", section);
    }
  }
  const fallbackSectionId = state.sections[0]?.id ?? "skifte-1";
  for (const field of state.fields.filter((item) => item.type === "bed" && !item.sectionId)) {
    field.sectionId = fallbackSectionId;
    await putRecord(DB_NAMES.cultivation, "fields", field);
  }
  const hasVisibleInActiveYear = state.allCrops.some((crop) => isCropVisibleInYear(crop, state.activeYear));
  const hasVisibleInCurrentYear = state.allCrops.some((crop) => isCropVisibleInYear(crop, currentYear));
  if (!hasVisibleInActiveYear && hasVisibleInCurrentYear) {
    state.activeYear = currentYear;
    window.localStorage?.setItem(STORAGE_KEYS.activeYear, String(currentYear));
  }
  if (elements.seedDbStatus) {
    elements.seedDbStatus.textContent = `${getAllSeedItems().length} poster`;
  }
  syncActiveYearState();
  if (elements.cultivationDbStatus) {
    elements.cultivationDbStatus.textContent = `${state.allCrops.length} grödor`;
  }
}

function renderAll() {
  renderYearPicker();
  renderNavigation();
  renderLegends();
  renderTimelineViewButtons();
  renderHarvestViewButtons();
  renderFieldSectionChips();
  renderFieldFilterGroups();
  renderPlanningForm();
  renderTaskStatus();
  renderToday();
  renderTimeline();
  renderSeedTable();
  renderSeedStockPage();
  renderHarvestPage();
  renderFields();
  renderSettingsPage();
  renderFieldTimeLabel();
  renderFieldZoom();
  updateFieldFullscreenButton();
  renderTopbarMeta();
  ensureFieldMapViewport();
}

function renderSettingsPage() {
  elements.themeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.theme === state.theme);
  });
  renderSettingsWeatherLocation();
  renderSettingsGuide();
  updateDataSetupUiState();
}

function renderSettingsWeatherLocation() {
  const location = getCachedWeatherLocation();
  if (elements.settingsWeatherCurrent) {
    elements.settingsWeatherCurrent.textContent = location?.name
      ? `Väderplats: ${location.name}`
      : "Ingen väderplats vald än.";
    elements.settingsWeatherCurrent.dataset.state = location ? "ready" : "idle";
  }
  if (elements.weatherLocationQuery && location?.name && document.activeElement !== elements.weatherLocationQuery) {
    elements.weatherLocationQuery.value = location.name;
  }
  renderWeatherLocationSuggestions();
}

function openSettingsGuide() {
  state.settingsGuideStep = 0;
  state.settingsGuideOpen = true;
  renderSettingsGuide();
  if (elements.appGuideOverlay) {
    elements.appGuideOverlay.hidden = false;
  }
  document.body.classList.add("has-guide-open");
}

function changeSettingsGuideStep(delta) {
  closeOpenDialogsForGuide();
  const nextStep = Math.min(Math.max(state.settingsGuideStep + delta, 0), SETTINGS_GUIDE_STEPS.length - 1);
  if (delta > 0 && state.settingsGuideStep === SETTINGS_GUIDE_STEPS.length - 1) {
    closeSettingsGuide();
    return;
  }
  state.settingsGuideStep = nextStep;
  renderSettingsGuide();
}

function closeSettingsGuide() {
  state.settingsGuideOpen = false;
  closeOpenDialogsForGuide();
  if (elements.appGuideOverlay) {
    elements.appGuideOverlay.hidden = true;
  }
  if (elements.appGuideHighlight) {
    elements.appGuideHighlight.removeAttribute("style");
  }
  if (elements.appGuidePopover) {
    elements.appGuidePopover.removeAttribute("style");
  }
  document.body.classList.remove("has-guide-open");
}

function renderSettingsGuide() {
  const step = SETTINGS_GUIDE_STEPS[state.settingsGuideStep];
  if (!step || !elements.settingsGuideTitle || !elements.settingsGuidePoints) {
    return;
  }
  if (state.settingsGuideOpen && state.page !== step.page) {
    state.page = step.page;
    renderAll();
    return;
  }
  elements.settingsGuideTitle.textContent = step.title;
  if (elements.settingsGuideStep) {
    elements.settingsGuideStep.textContent = `Steg ${state.settingsGuideStep + 1} av ${SETTINGS_GUIDE_STEPS.length}`;
  }
  if (elements.settingsGuideIntro) {
    elements.settingsGuideIntro.textContent = step.intro;
  }
  if (elements.settingsGuideHint) {
    elements.settingsGuideHint.hidden = !step.targetLabel;
    elements.settingsGuideHint.textContent = step.targetLabel ? `Markerat nu: ${step.targetLabel}.` : "";
  }
  elements.settingsGuidePoints.innerHTML = "";
  if (elements.settingsGuidePrev) {
    elements.settingsGuidePrev.disabled = state.settingsGuideStep === 0;
  }
  if (elements.settingsGuideNext) {
    elements.settingsGuideNext.textContent =
      state.settingsGuideStep === SETTINGS_GUIDE_STEPS.length - 1 ? "Stäng guide" : "Nästa";
  }
  if (state.settingsGuideOpen) {
    window.requestAnimationFrame(() => {
      positionSettingsGuide();
    });
  }
}

function positionSettingsGuide() {
  if (!state.settingsGuideOpen || !elements.appGuideHighlight || !elements.appGuidePopover) {
    return;
  }
  const step = SETTINGS_GUIDE_STEPS[state.settingsGuideStep];
  const target = resolveGuideTarget(step);
  if (!target) {
    return;
  }
  target.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
  const rect = target.getBoundingClientRect();
  const padding = 8;
  elements.appGuideHighlight.style.left = `${Math.max(rect.left - padding, 8)}px`;
  elements.appGuideHighlight.style.top = `${Math.max(rect.top - padding, 8)}px`;
  elements.appGuideHighlight.style.width = `${Math.max(rect.width + padding * 2, 24)}px`;
  elements.appGuideHighlight.style.height = `${Math.max(rect.height + padding * 2, 24)}px`;

  const popoverRect = elements.appGuidePopover.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const preferRight = rect.right + 24 + popoverRect.width < viewportWidth - 16;
  const left = preferRight
    ? rect.right + 24
    : Math.max(rect.left - popoverRect.width - 24, 16);
  const top = Math.min(
    Math.max(rect.top + rect.height / 2 - popoverRect.height / 2, 16),
    viewportHeight - popoverRect.height - 16,
  );
  elements.appGuidePopover.style.left = `${left}px`;
  elements.appGuidePopover.style.top = `${top}px`;
}

function resolveGuideTarget(step) {
  if (!step) {
    return null;
  }
  const selectors = [step.target, step.fallbackTarget].filter(Boolean);
  for (const selector of selectors) {
    const target = document.querySelector(selector);
    if (target) {
      return target;
    }
  }
  return null;
}

function closeOpenDialogsForGuide() {
  document.querySelectorAll("dialog[open]").forEach((dialog) => {
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  });
  syncDialogBodyState();
}

function renderNavigation() {
  if (state.page === "egnafroer") {
    state.page = "frolager";
  }
  hydrateNavIcons();
  const titles = {
    idag: "Idag",
    tidslinje: "Odlingsplan",
      frodatabas: "Frödatabas",
      egnafroer: "Mina fröer",
    frolager: "Mina fröer",
    skord: "Skörd",
      skiften: "Odlingsytor",
    installningar: "Inställningar",
  };

  elements.pageTitle.textContent = titles[state.page];
  elements.navItems.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.page === state.page);
  });
  elements.pages.forEach((page) => {
    page.classList.toggle("is-visible", page.dataset.page === state.page);
  });
  document.body.dataset.page = state.page;
  if (state.page === "skiften") {
    ensureFieldMapViewport();
  }
}

function showAppNotice(message, variant = "info") {
  if (!elements.appNotice) {
    return;
  }
  if (state.noticeTimer) {
    window.clearTimeout(state.noticeTimer);
    state.noticeTimer = null;
  }
  elements.appNotice.textContent = message;
  elements.appNotice.dataset.variant = variant;
  elements.appNotice.hidden = false;
  state.noticeTimer = window.setTimeout(() => {
    if (elements.appNotice) {
      elements.appNotice.hidden = true;
      elements.appNotice.textContent = "";
      delete elements.appNotice.dataset.variant;
    }
    state.noticeTimer = null;
  }, 3600);
}

function restoreActiveYear() {
  const storedYear = window.localStorage?.getItem(STORAGE_KEYS.activeYear);
  const parsedYear = toNumber(storedYear);
  if (parsedYear) {
    state.activeYear = parsedYear;
  }
}

function restoreHarvestPreferences() {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEYS.harvestPrices);
    state.harvestPrices = raw ? JSON.parse(raw) : {};
  } catch {
    state.harvestPrices = {};
  }
}

function restoreCachedFrostWindow() {
  const cachedLocation = getCachedWeatherLocation();
  state.frostWindow = cachedLocation ? getCachedFrostWindow(cachedLocation) : null;
}

function restoreThemePreference() {
  const storedTheme = window.localStorage?.getItem(STORAGE_KEYS.theme);
  state.theme = storedTheme === "dark" ? "dark" : "light";
}

function applyTheme() {
  document.body.dataset.theme = state.theme;
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.style.colorScheme = state.theme;
}

function setTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  if (state.theme === nextTheme) {
    return;
  }
  state.theme = nextTheme;
  try {
    window.localStorage?.setItem(STORAGE_KEYS.theme, nextTheme);
  } catch {
    // Ignore storage failures and keep theme for this session.
  }
  applyTheme();
  renderSettingsPage();
  queuePersistUserDataSnapshot();
}

function persistHarvestPrices() {
  try {
    window.localStorage?.setItem(STORAGE_KEYS.harvestPrices, JSON.stringify(state.harvestPrices));
  } catch {
    // Ignore storage failures and keep values in memory for this session.
  }
  queuePersistUserDataSnapshot();
}

function parseLocaleNumber(value) {
  const raw = String(value ?? "").trim().replace(/\s+/g, "").replace(",", ".");
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function syncActiveYearState() {
  const visibleCropIds = new Set(
    state.allCrops
      .filter((crop) => isCropVisibleInYear(crop, state.activeYear))
      .map((crop) => crop.id),
  );
  state.crops = state.allCrops.filter((crop) => visibleCropIds.has(crop.id));
  state.events = state.allEvents.filter((event) => event.year === state.activeYear && visibleCropIds.has(event.cropId));
  if (state.activeCropId && !visibleCropIds.has(state.activeCropId)) {
    state.activeCropId = null;
    closeDialog(elements.dialog);
  }
}

function setActiveYear(year) {
  state.activeYear = year;
  window.localStorage?.setItem(STORAGE_KEYS.activeYear, String(year));
  syncActiveYearState();
  renderAll();
  queuePersistUserDataSnapshot();
}

function renderYearPicker() {
  if (!elements.activeYearSelect) {
    return;
  }
  const years = getCultivationYears();
  elements.activeYearSelect.innerHTML = years
    .map((year) => `<option value="${year}" ${year === state.activeYear ? "selected" : ""}>${year}</option>`)
    .join("");
}

function getCultivationYears() {
  const years = new Set([currentYear - 1, currentYear, currentYear + 1, currentYear + 2]);
  state.allCrops.forEach((crop) => {
    years.add(crop.startYear ?? currentYear);
    years.add(crop.endYear ?? crop.startYear ?? currentYear);
  });
  state.allEvents.forEach((event) => years.add(event.year ?? currentYear));
  return [...years].sort((a, b) => a - b);
}

function isCropVisibleInYear(crop, year) {
  return (crop.startYear ?? currentYear) <= year && (crop.endYear ?? crop.startYear ?? currentYear) >= year;
}

function renderTopbarMeta() {
  const overdueCount = state.events.filter((event) => isEventOverdue(event)).length;
  const plantedCount = state.crops.filter((crop) => isCropActuallyPlanted(crop)).length;
  const presowCount = state.crops.filter((crop) => isCropInPresowNow(crop)).length;
  const harvestedCount = state.crops.filter((crop) => isCropHarvested(crop)).length;

  if (elements.currentWeek) {
    elements.currentWeek.textContent = String(currentWeek);
  }
  if (elements.openTaskCount) {
    elements.openTaskCount.textContent = String(overdueCount);
  }
  elements.cropCount.textContent = String(plantedCount);
  if (elements.topbarPresowCount) {
    elements.topbarPresowCount.textContent = String(presowCount);
  }
  if (elements.topbarHarvestedCount) {
    elements.topbarHarvestedCount.textContent = String(harvestedCount);
  }
}

function renderLegends() {
  if (elements.todayLegend) {
    elements.todayLegend.innerHTML = "";
    Object.entries(ACTIVITY_META).forEach(([type, meta]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chip chip--legend";
      button.style.setProperty("--accent", meta.color);
      button.classList.toggle("is-active", state.taskTypes.size === 0 || state.taskTypes.has(type));
      button.innerHTML = `
        <span class="legend-icon">${getIconMarkup(meta.icon)}</span>
        <span>${meta.label}</span>
      `;
      button.addEventListener("click", () => {
        if (state.taskTypes.has(type)) {
          state.taskTypes.delete(type);
        } else {
          state.taskTypes.add(type);
        }
        renderLegends();
        renderToday();
      });
      elements.todayLegend.appendChild(button);
    });
  }

  if (elements.timelineLegend) {
    elements.timelineLegend.innerHTML = "";
    Object.entries(ACTIVITY_META).forEach(([type, meta]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chip chip--legend";
      button.style.setProperty("--accent", meta.color);
      button.classList.toggle("is-active", state.timelineTypes.has(type));
      button.innerHTML = `
        <span class="legend-icon">${getIconMarkup(meta.icon)}</span>
        <span>${meta.label}</span>
      `;
      button.addEventListener("click", () => {
        if (state.timelineTypes.has(type) && state.timelineTypes.size > 1) {
          state.timelineTypes.delete(type);
        } else {
          state.timelineTypes.add(type);
        }
        renderLegends();
        renderTimeline();
      });
      elements.timelineLegend.appendChild(button);
    });
  }
}

function renderTaskStatus() {
  [...elements.taskStatusFilter.querySelectorAll(".segment")].forEach((button) => {
    button.classList.toggle("is-active", button.dataset.status === state.taskStatus);
  });
}

function renderTimelineViewButtons() {
  elements.timelineViewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.timelineView);
  });
}

function renderHarvestViewButtons() {
  elements.harvestViewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.harvestView);
  });
}

function getHistoricalHarvestYieldPerM2(title) {
  const candidateYears = [...new Set([
    ...state.harvestEntries.map((entry) => entry.year),
    ...state.allCrops.flatMap((crop) => [crop.startYear, crop.endYear]),
  ])]
    .filter((year) => Number.isFinite(year) && year < state.activeYear)
    .sort((a, b) => a - b);

  const yearlyYields = candidateYears
    .map((year) => {
      const area = state.allCrops
        .filter((crop) => crop.title === title && isCropVisibleInYear(crop, year))
        .reduce((sum, crop) => sum + (Number(crop.area) || 0), 0);
      const kg = state.harvestEntries
        .filter((entry) => entry.title === title && entry.year === year)
        .reduce((sum, entry) => sum + (Number(entry.kg) || 0), 0);
      return area > 0 && kg > 0 ? kg / area : null;
    })
    .filter((value) => value != null);

  if (!yearlyYields.length) {
    return 0;
  }
  return yearlyYields.reduce((sum, value) => sum + value, 0) / yearlyYields.length;
}

function buildHarvestForecastRows() {
  const grouped = new Map();
  state.crops.forEach((crop) => {
    const title = crop.title || "Okänd gröda";
    const existing = grouped.get(title) ?? { title, area: 0 };
    existing.area += Number(crop.area) || 0;
    grouped.set(title, existing);
  });

  return [...grouped.values()]
    .map((row) => {
      const previousYieldPerM2 = getHistoricalHarvestYieldPerM2(row.title);
      const pricePerKg = Number(state.harvestPrices[row.title]) || 0;
      return {
        ...row,
        previousYieldPerM2,
        pricePerKg,
      };
    })
    .sort((left, right) => left.title.localeCompare(right.title, "sv"));
}

function renderHarvestForecastDialog() {
  if (!elements.harvestForecastBody || !elements.harvestForecastTotal) {
    return;
  }
  const rows = buildHarvestForecastRows().map((row) => {
    const draft = state.harvestForecastDraft[row.title] ?? {};
    const previousYieldPerM2 = draft.previousYieldPerM2 ?? row.previousYieldPerM2;
    const pricePerKg = draft.pricePerKg ?? row.pricePerKg;
    return {
      ...row,
      previousYieldPerM2,
      pricePerKg,
      expectedIncome: row.area * previousYieldPerM2 * pricePerKg,
    };
  });

  if (!rows.length) {
    elements.harvestForecastBody.innerHTML = `
      <tr>
        <td colspan="5" class="harvest-empty">Inga grödor finns i tidslinjen för ${state.activeYear} ännu.</td>
      </tr>
    `;
    elements.harvestForecastTotal.innerHTML = `
      <span>Förväntad inkomst</span>
      <strong>0,00 kr</strong>
    `;
    return;
  }

  elements.harvestForecastBody.innerHTML = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.title)}</td>
      <td>${formatDecimalSv(row.area, 1)} m²</td>
      <td><input class="harvest-price-input" type="text" inputmode="decimal" value="${row.previousYieldPerM2 ? formatDecimalSv(row.previousYieldPerM2, 2) : ""}" data-kind="yield" data-title="${encodeURIComponent(row.title)}" /></td>
      <td><input class="harvest-price-input" type="text" inputmode="decimal" value="${row.pricePerKg ? formatDecimalSv(row.pricePerKg, 2) : ""}" data-kind="price" data-title="${encodeURIComponent(row.title)}" /></td>
      <td>${formatDecimalSv(row.expectedIncome, 2)} kr</td>
    </tr>
  `).join("");

  const totalIncome = rows.reduce((sum, row) => sum + row.expectedIncome, 0);
  elements.harvestForecastTotal.innerHTML = `
    <span>Förväntad inkomst</span>
    <strong>${formatDecimalSv(totalIncome, 2)} kr</strong>
  `;

  [...elements.harvestForecastBody.querySelectorAll(".harvest-price-input")].forEach((input) => {
    input.addEventListener("input", (event) => {
      event.stopPropagation();
    });
    const commitForecastValue = (event) => {
      const title = decodeURIComponent(event.target.dataset.title ?? "");
      const kind = event.target.dataset.kind;
      state.harvestForecastDraft[title] ??= {};
      state.harvestForecastDraft[title][kind === "yield" ? "previousYieldPerM2" : "pricePerKg"] = parseLocaleNumber(event.target.value);
      renderHarvestForecastDialog();
    };
    input.addEventListener("change", commitForecastValue);
    input.addEventListener("blur", commitForecastValue);
  });
}

function openHarvestForecastDialog() {
  state.harvestForecastDraft = {};
  renderHarvestForecastDialog();
  showDialog(elements.harvestForecastDialog);
}

function renderFieldFilterGroups() {
  const selectableFields = state.fields
    .filter(isSchedulingField)
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
  const selectableSections = [...state.sections].sort((a, b) => a.name.localeCompare(b.name, "sv"));
  const selectableFamilies = [...new Set(getAllSeedItems().map((item) => item.family).filter(Boolean))].sort((a, b) => a.localeCompare(b, "sv"));
  const validFieldIds = new Set(selectableFields.map((field) => field.id));
  const validSectionIds = new Set(selectableSections.map((section) => section.id));

  if ([...state.timelineFields].some((fieldId) => !validFieldIds.has(fieldId))) {
    state.timelineFields.clear();
  }
  if (state.timelineSectionFilter !== "alla" && !validSectionIds.has(state.timelineSectionFilter)) {
    state.timelineSectionFilter = "alla";
  }
  if (state.timelineFamilyFilter !== "alla" && !selectableFamilies.includes(state.timelineFamilyFilter)) {
    state.timelineFamilyFilter = "alla";
  }
  if ([...state.planningFields].some((fieldId) => !validFieldIds.has(fieldId))) {
    state.planningFields.clear();
  }

  renderTaskFieldDropdown(selectableFields);

  if (elements.timelineFieldFilters) {
    const selectedId = state.timelineFields.size === 1 ? [...state.timelineFields][0] : "alla";
    elements.timelineFieldFilters.innerHTML = `
      <label class="filter-select filter-select--compact">
        <span class="section-caption">Bädd</span>
        <select id="timeline-field-select">
          <option value="alla">Alla bäddar</option>
          ${selectableFields.map((field) => `<option value="${escapeHtml(field.id)}" ${field.id === selectedId ? "selected" : ""}>${escapeHtml(field.name)}</option>`).join("")}
        </select>
      </label>
      <label class="filter-select filter-select--compact">
        <span class="section-caption">Skifte</span>
        <select id="timeline-section-select">
          <option value="alla">Alla skiften</option>
          ${selectableSections.map((section) => `<option value="${escapeHtml(section.id)}" ${section.id === state.timelineSectionFilter ? "selected" : ""}>${escapeHtml(getSectionDisplayName(section))}</option>`).join("")}
        </select>
      </label>
      <label class="filter-select filter-select--compact">
        <span class="section-caption">Familj</span>
        <select id="timeline-family-select">
          <option value="alla">Alla familjer</option>
          ${selectableFamilies.map((family) => `<option value="${escapeHtml(family)}" ${family === state.timelineFamilyFilter ? "selected" : ""}>${escapeHtml(family)}</option>`).join("")}
        </select>
      </label>
      <label class="filter-select filter-select--compact">
        <span class="section-caption">Status</span>
        <select id="timeline-completion-select">
          <option value="alla" ${state.timelineCompletionFilter === "alla" ? "selected" : ""}>Allt</option>
          <option value="pending" ${state.timelineCompletionFilter === "pending" ? "selected" : ""}>Ej avklarade</option>
          <option value="completed" ${state.timelineCompletionFilter === "completed" ? "selected" : ""}>Avklarade</option>
        </select>
      </label>
      <label class="filter-select filter-select--compact">
        <span class="section-caption">Sortera efter</span>
        <select id="timeline-group-select" ${state.timelineView === "crops" ? "" : "disabled"}>
          <option value="name" ${state.timelineGroupBy === "name" ? "selected" : ""}>Namn</option>
          <option value="field" ${state.timelineGroupBy === "field" ? "selected" : ""}>Bädd</option>
          <option value="section" ${state.timelineGroupBy === "section" ? "selected" : ""}>Skifte</option>
          <option value="family" ${state.timelineGroupBy === "family" ? "selected" : ""}>Familj</option>
        </select>
      </label>
    `;
    elements.timelineFieldFilters.querySelector("#timeline-field-select")?.addEventListener("change", (event) => {
      const value = event.target.value;
      state.timelineFields.clear();
      if (value !== "alla") {
        state.timelineFields.add(value);
      }
      renderTimeline();
    });
    elements.timelineFieldFilters.querySelector("#timeline-section-select")?.addEventListener("change", (event) => {
      state.timelineSectionFilter = event.target.value;
      renderTimeline();
    });
    elements.timelineFieldFilters.querySelector("#timeline-family-select")?.addEventListener("change", (event) => {
      state.timelineFamilyFilter = event.target.value;
      renderTimeline();
    });
    elements.timelineFieldFilters.querySelector("#timeline-completion-select")?.addEventListener("change", (event) => {
      state.timelineCompletionFilter = event.target.value;
      renderTimeline();
    });
    elements.timelineFieldFilters.querySelector("#timeline-group-select")?.addEventListener("change", (event) => {
      state.timelineGroupBy = event.target.value;
      renderTimeline();
    });
  }

  elements.planningFieldFilters.innerHTML = "";
  selectableSections.forEach((section) => {
    const fields = selectableFields.filter((field) => field.sectionId === section.id);
    if (!fields.length) {
      return;
    }
    const family = getSectionDisplayFamily(section);
    const column = document.createElement("div");
    column.className = "planning-field-column";
    column.innerHTML = `
      <div class="planning-field-column__head">
        <strong class="planning-field-column__title">${escapeHtml(getSectionDisplayName(section))}</strong>
        ${family ? `<span class="planning-field-column__family">${escapeHtml(family)}</span>` : ""}
      </div>
    `;
    fields.forEach((field, index) => {
      if (index === 0 && state.planningFields.size === 0) {
        state.planningFields.add(field.id);
      }
      column.appendChild(createFilterChip(field.id, field.name, true, state.planningFields, true));
    });
    elements.planningFieldFilters.appendChild(column);
  });

  updatePlanningDialogLayout();
  renderPlanningCapacity();
}

function renderTaskFieldDropdown(fields) {
  if (!elements.taskFieldFilters) {
    return;
  }
  const selectedId = state.taskFields.size === 1 ? [...state.taskFields][0] : "alla";
  elements.taskFieldFilters.innerHTML = `
    <label class="filter-select">
      <span class="section-caption">Bädd</span>
      <select id="task-field-select">
        <option value="alla">Alla bäddar</option>
        ${fields.map((field) => `<option value="${escapeHtml(field.id)}" ${field.id === selectedId ? "selected" : ""}>${escapeHtml(field.name)}</option>`).join("")}
      </select>
    </label>
  `;
  elements.taskFieldFilters.querySelector("#task-field-select")?.addEventListener("change", (event) => {
    const value = event.target.value;
    state.taskFields.clear();
    if (value !== "alla") {
      state.taskFields.add(value);
    }
    renderToday();
  });
}

function createFilterChip(fieldId, label, planningMode, selectedSet, singleSelect = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chip";
  button.textContent = label;
  button.dataset.fieldId = fieldId;

  const isActive = planningMode
    ? selectedSet.has(fieldId)
    : fieldId === "alla"
      ? selectedSet.size === 0
      : selectedSet.has(fieldId);
  button.classList.toggle("is-active", isActive);

  button.addEventListener("click", () => {
    if (planningMode) {
      if (!selectedSet.has(fieldId) || singleSelect) {
        selectedSet.clear();
        selectedSet.add(fieldId);
      }
      resetPlanningSowingAdjustments();
      [...elements.planningFieldFilters.querySelectorAll(".chip")].forEach((chip) => {
        chip.classList.toggle("is-active", selectedSet.has(chip.dataset.fieldId));
      });
      syncPlanningAreaToSelectedField();
      renderPlanningCapacity();
      return;
    }

    if (fieldId === "alla") {
      selectedSet.clear();
    } else if (selectedSet.has(fieldId)) {
      selectedSet.delete(fieldId);
    } else {
      selectedSet.add(fieldId);
    }

    renderFieldFilterGroups();
    renderToday();
    renderTimeline();
  });

  return button;
}

function getPlanningScheduleRange() {
  const directWeek = toNumber(elements.planningDirect?.value);
  const transplantWeek = toNumber(elements.planningTransplant?.value);
  const harvestWeek = toNumber(elements.planningHarvest?.value);
  const startWeek = directWeek ?? transplantWeek;
  const endWeek = harvestWeek ?? startWeek;
  if (!startWeek || !endWeek) {
    return null;
  }
  return {
    startWeek: Math.min(startWeek, endWeek),
    endWeek: Math.max(startWeek, endWeek),
  };
}

function getPlanningRemainingAreaForFieldIds(fieldIds, scheduleRange = getPlanningScheduleRange()) {
  const selectedIds = fieldIds.filter(Boolean);
  if (!selectedIds.length) {
    return null;
  }

  if (!scheduleRange) {
    const totalArea = selectedIds.reduce((sum, fieldId) => sum + getFieldArea(fieldId), 0);
    const usedArea = state.crops
      .filter((crop) => crop.fieldIds?.some((fieldId) => selectedIds.includes(fieldId)))
      .reduce((sum, crop) => sum + (crop.area ?? 0), 0);
    return Math.max(totalArea - usedArea, 0);
  }

  let minRemainingArea = Number.POSITIVE_INFINITY;
  for (let week = scheduleRange.startWeek; week <= scheduleRange.endWeek; week += 1) {
    const totalArea = selectedIds.reduce((sum, fieldId) => sum + getFieldArea(fieldId), 0);
    const usedArea = selectedIds.reduce((sum, fieldId) => sum + getFieldStatus(fieldId, week).used, 0);
    minRemainingArea = Math.min(minRemainingArea, Math.max(totalArea - usedArea, 0));
  }

  return Number.isFinite(minRemainingArea) ? minRemainingArea : 0;
}

function updatePlanningFieldChipState() {
  if (!elements.planningFieldFilters) {
    return;
  }
  [...elements.planningFieldFilters.querySelectorAll(".chip")].forEach((chip) => {
    chip.classList.toggle("is-active", state.planningFields.has(chip.dataset.fieldId));
  });
}

function setSelectedPlanningField(fieldId) {
  state.planningFields.clear();
  if (fieldId) {
    state.planningFields.add(fieldId);
  }
  updatePlanningFieldChipState();
}

function getPlanningRemainingArea() {
  return getPlanningRemainingAreaForFieldIds([...state.planningFields]);
}

function syncPlanningAreaToSelectedField() {
  if (!elements.planningArea) {
    return;
  }
  const remainingArea = getPlanningRemainingArea();
  if (remainingArea == null) {
    return;
  }
  const exactRemainingArea = Number(Math.max(remainingArea, 0).toFixed(2));
  elements.planningArea.value = exactRemainingArea > 0
    ? String(exactRemainingArea)
    : "0";
}

function findAutomaticPlanningField(seedItem = null) {
  const sortedSections = [...state.sections].sort((a, b) => a.name.localeCompare(b.name, "sv"));
  const selectableFields = sortedSections.flatMap((section) => state.fields
    .filter((field) => isSchedulingField(field) && field.sectionId === section.id)
    .sort((a, b) => a.name.localeCompare(b.name, "sv")));
  if (!selectableFields.length) {
    return null;
  }

  const hasCapacity = (field) => (getPlanningRemainingAreaForFieldIds([field.id]) ?? 0) > 0.0001;
  const familyKey = normalizeFamilyKey(seedItem?.family);
  const matchingSectionIds = familyKey
    ? new Set(
        state.sections
          .filter((section) => normalizeFamilyKey(getSectionDisplayFamily(section)) === familyKey)
          .map((section) => section.id),
      )
    : new Set();

  const familyMatch = selectableFields.find((field) => matchingSectionIds.has(field.sectionId) && hasCapacity(field));
  return familyMatch ?? selectableFields.find(hasCapacity) ?? selectableFields[0] ?? null;
}

function autoSelectPlanningField(seedItem = null) {
  const recommendedField = findAutomaticPlanningField(seedItem);
  if (!recommendedField) {
    return null;
  }
  if ([...state.planningFields][0] !== recommendedField.id) {
    setSelectedPlanningField(recommendedField.id);
  } else {
    updatePlanningFieldChipState();
  }
  return recommendedField;
}

function resetPlanningSowingAdjustments() {
  state.planningSowingAdjustments = null;
  state.planningSowingControlMode = "spacing";
}

function getPlanningSowingAdjustments() {
  return state.planningSowingAdjustments ?? {};
}

function getPlanningSeedNumberValue(value) {
  const parsed = toNumber(value);
  return parsed != null && parsed > 0 ? parsed : null;
}

function getSelectedPlanningFieldMetrics() {
  const field = getSelectedPlanningField();
  if (!field) {
    return null;
  }
  const widthCm = Math.min(field.width, field.length) * 100;
  const lengthCm = Math.max(field.width, field.length) * 100;
  return {
    field,
    bedWidthCm: Math.round(widthCm),
    bedLengthCm: Math.round(lengthCm),
    bedAreaM2: Number((field.width * field.length).toFixed(2)),
  };
}

function getSeedSpacingCm(seedItem, key) {
  return getPlanningSeedNumberValue(seedItem?.[key]);
}

function getPlanningSowingInput(seedItem = null, overrides = {}) {
  const activeSeed = seedItem ?? resolvePlanningSeed({ allowSingleVariety: true });
  const fieldMetrics = getSelectedPlanningFieldMetrics();
  const adjustments = getPlanningSowingAdjustments();
  const sowingAreaM2 = getPlanningSeedNumberValue(overrides.sowingAreaM2 ?? elements.planningArea?.value) ?? 0;
  return {
    seedItem: activeSeed,
    fieldMetrics,
    bedWidthCm: getPlanningSeedNumberValue(overrides.bedWidthCm ?? adjustments.bedWidthCm) ?? fieldMetrics?.bedWidthCm ?? null,
    rowSpacingCm: getPlanningSeedNumberValue(overrides.rowSpacingCm ?? adjustments.rowSpacingCm) ?? getSeedSpacingCm(activeSeed, "rowSpacing"),
    plantSpacingCm: getPlanningSeedNumberValue(overrides.plantSpacingCm ?? adjustments.plantSpacingCm) ?? getSeedSpacingCm(activeSeed, "spacing"),
    sowingAreaM2,
    manualRowCount: getPlanningSeedNumberValue(overrides.manualRowCount ?? adjustments.manualRowCount),
    controlMode: overrides.controlMode ?? state.planningSowingControlMode ?? "spacing",
  };
}

function calculateSowingLayout({
  bedWidthCm,
  rowSpacingCm,
  plantSpacingCm,
  sowingAreaM2,
  manualRowCount,
  controlMode = "spacing",
} = {}) {
  const safeBedWidth = Math.max(getPlanningSeedNumberValue(bedWidthCm) ?? 0, 0);
  const safeRowSpacing = Math.max(getPlanningSeedNumberValue(rowSpacingCm) ?? 0, 0);
  const safePlantSpacing = Math.max(getPlanningSeedNumberValue(plantSpacingCm) ?? 0, 0);
  const safeArea = Math.max(getPlanningSeedNumberValue(sowingAreaM2) ?? 0, 0);
  const autoRowCount = safeBedWidth > 0 && safeRowSpacing > 0
    ? Math.max(1, Math.floor(safeBedWidth / safeRowSpacing))
    : 0;
  const rowCount = controlMode === "rows" && manualRowCount != null
    ? Math.max(1, Math.floor(manualRowCount))
    : autoRowCount;
  const effectiveRowSpacingCm = controlMode === "rows" && rowCount > 0
    ? safeBedWidth / rowCount
    : safeRowSpacing;
  const sowingLengthCm = safeBedWidth > 0
    ? (safeArea * 10000) / safeBedWidth
    : 0;
  const plantsPerRow = safePlantSpacing > 0
    ? Math.max(0, Math.floor(sowingLengthCm / safePlantSpacing))
    : 0;
  const totalSeedPositions = rowCount * plantsPerRow;

  return {
    bedWidthCm: safeBedWidth,
    rowSpacingCm: safeRowSpacing,
    effectiveRowSpacingCm,
    plantSpacingCm: safePlantSpacing,
    sowingAreaM2: safeArea,
    sowingLengthCm,
    autoRowCount,
    rowCount,
    plantsPerRow,
    totalSeedPositions,
    controlMode,
  };
}

function getPlanningSowingLayout(seedItem = null, overrides = {}) {
  const input = getPlanningSowingInput(seedItem, overrides);
  const layout = calculateSowingLayout(input);
  const fieldMetrics = input.fieldMetrics;
  const remainingArea = getPlanningRemainingArea();
  const comparisonTolerance = 0.0001;
  const usedRowSpacingCm = layout.controlMode === "rows" ? layout.effectiveRowSpacingCm : layout.rowSpacingCm;
  const warnings = [];

  if (!input.seedItem) {
    warnings.push("Välj en gröda från frödatabasen för att räkna fram rad- och plantavstånd.");
  }
  if (!fieldMetrics) {
    warnings.push("Välj en bädd för att räkna fram såöversikten.");
  }
  if (!layout.bedWidthCm || !usedRowSpacingCm || !layout.plantSpacingCm) {
    warnings.push("Fyll i bäddbredd, radavstånd och plantavstånd för att se layouten.");
  }
  if (layout.controlMode !== "rows" && layout.rowCount > 0 && usedRowSpacingCm > 0 && layout.rowCount * usedRowSpacingCm > layout.bedWidthCm + comparisonTolerance) {
    warnings.push(`Antal rader får inte plats inom bäddbredden ${formatDecimalSv(layout.bedWidthCm, 0)} cm.`);
  }
  if (fieldMetrics?.bedLengthCm && layout.sowingLengthCm > fieldMetrics.bedLengthCm + comparisonTolerance) {
    warnings.push(`Såytan kräver ungefär ${formatDecimalSv(layout.sowingLengthCm / 100, 2)} m bäddlängd men vald bädd är ${formatDecimalSv(fieldMetrics.bedLengthCm / 100, 2)} m lång.`);
  }
  if (fieldMetrics?.bedAreaM2 && layout.sowingAreaM2 > fieldMetrics.bedAreaM2 + comparisonTolerance) {
    warnings.push(`Såytan ${formatDecimalSv(layout.sowingAreaM2, 2)} m² är större än bäddens totala yta ${formatDecimalSv(fieldMetrics.bedAreaM2, 2)} m².`);
  }
  if (remainingArea != null && layout.sowingAreaM2 > remainingArea + comparisonTolerance) {
    warnings.push(`Såytan överskrider ledig yta i perioden. Ledigt just nu: ${formatDecimalSv(remainingArea, 2)} m².`);
  }

  return {
    ...layout,
    fieldMetrics,
    seedItem: input.seedItem,
    warnings,
    isValid: warnings.length === 0,
  };
}

function renderPlanningSeedCount(seedItem = null) {
  if (!elements.planningSeedCount || !elements.planningSeedCountNote || !elements.planningSeedCountCard) {
    return;
  }
  const layout = getPlanningSowingLayout(seedItem);
  const hasData = layout.seedItem && layout.fieldMetrics && layout.rowSpacingCm && layout.plantSpacingCm && layout.sowingAreaM2 > 0;

  elements.planningSeedCountCard.dataset.state = layout.warnings.length ? "warn" : "ok";
  elements.planningSeedCount.textContent = hasData ? String(layout.totalSeedPositions) : "0";

  if (!layout.seedItem) {
    elements.planningSeedCountNote.textContent = "Välj gröda för att räkna fram fröåtgång.";
    return;
  }
  if (!layout.fieldMetrics) {
    elements.planningSeedCountNote.textContent = "Välj bädd för att se layout och fröåtgång.";
    return;
  }
  if (!layout.rowSpacingCm || !layout.plantSpacingCm) {
    elements.planningSeedCountNote.textContent = "Frödatabasen saknar rad- eller plantavstånd för den här grödan.";
    return;
  }
  if (layout.sowingAreaM2 <= 0) {
    elements.planningSeedCountNote.textContent = "Ange en yta större än 0 för att räkna antal frö.";
    return;
  }
  elements.planningSeedCountNote.textContent = `${layout.rowCount} rader x ${layout.plantsPerRow} platser per rad`;
}

function getPlanningSeedStockOptions(seedItem = null) {
  if (!seedItem) {
    return [];
  }
  const cropKey = String(seedItem.crop ?? "").trim().toLocaleLowerCase("sv");
  return state.seedStockEntries
    .filter((entry) => {
      const entryCropKey = String(entry.crop ?? "").trim().toLocaleLowerCase("sv");
      return entry.seedId === seedItem.id || (cropKey && entryCropKey === cropKey);
    })
    .sort((left, right) => {
      const leftExact = left.seedId === seedItem.id ? 0 : 1;
      const rightExact = right.seedId === seedItem.id ? 0 : 1;
      const leftExpiry = left.expirationYear ?? Number.MAX_SAFE_INTEGER;
      const rightExpiry = right.expirationYear ?? Number.MAX_SAFE_INTEGER;
      return leftExact - rightExact
        || leftExpiry - rightExpiry
        || left.name.localeCompare(right.name, "sv");
    });
}

function formatPlanningSeedStockOption(entry) {
  const details = [
    entry.variety,
    `${entry.quantity} st`,
    entry.expirationYear ? `bäst före ${entry.expirationYear}` : "",
    entry.supplier,
  ].filter(Boolean);
  return `${entry.name}${details.length ? ` (${details.join(", ")})` : ""}`;
}

function renderPlanningSeedStockOptions(seedItem = null) {
  if (!elements.planningSeedStock || !elements.planningSeedStockWrap) {
    return;
  }
  const previousValue = elements.planningSeedStock.value;
  const options = getPlanningSeedStockOptions(seedItem);
  elements.planningSeedStockWrap.hidden = !seedItem;
  if (!seedItem) {
    elements.planningSeedStock.innerHTML = "";
    return;
  }
  if (!options.length) {
    elements.planningSeedStock.innerHTML = '<option value="">Inga fröer i lager för vald gröda</option>';
    elements.planningSeedStock.disabled = true;
    return;
  }
  elements.planningSeedStock.disabled = false;
  const selectedValue = options.some((entry) => entry.id === previousValue)
    ? previousValue
    : (options.length === 1 ? options[0].id : PLANNING_STOCK_NONE);
  elements.planningSeedStock.innerHTML = [
    `<option value="${PLANNING_STOCK_NONE}" ${selectedValue === PLANNING_STOCK_NONE ? "selected" : ""}>Använd inget frö från lagret</option>`,
    ...options.map((entry) => `<option value="${escapeHtml(entry.id)}" ${entry.id === selectedValue ? "selected" : ""}>${escapeHtml(formatPlanningSeedStockOption(entry))}</option>`),
  ].join("");
}

function applyPlanningSeedStockSelection(stockId) {
  const entry = state.seedStockEntries.find((item) => item.id === stockId);
  if (!entry) {
    return;
  }
  const seed = getSeedItemById(entry.seedId);
  if (seed) {
    elements.planningCrop.value = seed.crop ?? entry.crop ?? "";
    elements.planningSeedId.value = seed.id;
  }
  if (elements.planningVariety && !elements.planningVariety.value.trim()) {
    elements.planningVariety.value = entry.variety || entry.name || "";
  }
  renderPlanningDerivedUi(seed);
  renderPlanningCapacity();
}

function getInventorySeedKey(seedId) {
  return `seed:${seedId}`;
}

function getInventoryStockKey(stockId) {
  return `stock:${stockId}`;
}

function getInventoryManualKey(manualKey) {
  return `manual:${manualKey}`;
}

function getSeedStockTotalForSeed(seedId) {
  if (!seedId) {
    return 0;
  }
  const linkedIds = new Set(getLinkedSeedIdsForStock(seedId));
  return state.seedStockEntries
    .filter((entry) => linkedIds.has(entry.seedId))
    .reduce((sum, entry) => sum + (Number(entry.quantity) || 0), 0);
}

function getSeedStockTotalForStockId(stockId) {
  if (!stockId) {
    return 0;
  }
  const entry = state.seedStockEntries.find((item) => item.id === stockId);
  return Math.max(0, Math.floor(toNumber(entry?.quantity) ?? 0));
}

function hasSeedStockForSeed(seedId) {
  return Boolean(seedId && state.seedStockEntries.some((entry) => entry.seedId === seedId));
}

async function setSeedStockTotalForSeed(seedId, total) {
  const seed = getSeedItemById(seedId);
  if (!seed) {
    return;
  }
  const safeTotal = Math.max(0, Math.floor(toNumber(total) ?? 0));
  const entries = (await getAll(DB_NAMES.cultivation, "seedStock"))
    .map(normalizeSeedStockEntry)
    .filter((entry) => entry.seedId === seedId)
    .sort((left, right) => (left.expirationYear ?? Number.MAX_SAFE_INTEGER) - (right.expirationYear ?? Number.MAX_SAFE_INTEGER) || left.name.localeCompare(right.name, "sv"));
  if (!entries.length) {
    await putRecord(DB_NAMES.cultivation, "seedStock", normalizeSeedStockEntry({
      id: `seed-stock-${Date.now()}`,
      seedId,
      name: [seed.crop, seed.variety].filter(Boolean).join(" - ") || seed.crop || "Frö",
      crop: seed.crop ?? "",
      variety: seed.variety ?? "",
      quantity: safeTotal,
      year: state.activeYear,
      expirationYear: toNumber(seed.expirationYear),
      supplier: "",
      notes: "",
    }));
    return;
  }
  entries.forEach((entry, index) => {
    entry.quantity = index === 0 ? safeTotal : 0;
  });
  for (const entry of entries) {
    await putRecord(DB_NAMES.cultivation, "seedStock", entry);
  }
}

async function restoreCropSeedStockUsage(crop) {
  const usage = crop?.seedStockUsage;
  if (!usage?.allocations?.length) {
    return;
  }
  const stockEntries = (await getAll(DB_NAMES.cultivation, "seedStock")).map(normalizeSeedStockEntry);
  for (const allocation of usage.allocations) {
    const entry = stockEntries.find((item) => item.id === allocation.stockId);
    const quantity = Math.max(0, Math.floor(toNumber(allocation.quantity) ?? 0));
    if (!entry || quantity <= 0) {
      continue;
    }
    entry.quantity += quantity;
    await putRecord(DB_NAMES.cultivation, "seedStock", entry);
  }
  crop.seedStockUsage = null;
}

async function applySeedStockUsageToCrop(crop) {
  const seedNeed = Math.max(0, Math.floor(getCropSeedNeed(crop)));
  if (!crop?.seedId || seedNeed <= 0) {
    crop.seedStockUsage = null;
    return;
  }
  if (crop.seedStockId === PLANNING_STOCK_NONE) {
    crop.seedStockUsage = null;
    return;
  }
  const selectedStockId = String(crop.seedStockId ?? "").trim();
  const linkedSeedIds = new Set(getLinkedSeedIdsForStock(crop.seedId));
  const stockEntries = (await getAll(DB_NAMES.cultivation, "seedStock"))
    .map(normalizeSeedStockEntry)
    .filter((entry) => {
      if (selectedStockId) {
        return entry.id === selectedStockId && entry.quantity > 0;
      }
      return linkedSeedIds.has(entry.seedId) && entry.quantity > 0;
    })
    .sort((left, right) => {
      const leftExpiry = left.expirationYear ?? Number.MAX_SAFE_INTEGER;
      const rightExpiry = right.expirationYear ?? Number.MAX_SAFE_INTEGER;
      return leftExpiry - rightExpiry || (left.year ?? Number.MAX_SAFE_INTEGER) - (right.year ?? Number.MAX_SAFE_INTEGER) || left.name.localeCompare(right.name, "sv");
    });
  let remaining = seedNeed;
  const allocations = [];
  for (const entry of stockEntries) {
    if (remaining <= 0) {
      break;
    }
    const quantity = Math.min(entry.quantity, remaining);
    entry.quantity -= quantity;
    remaining -= quantity;
    allocations.push({ stockId: entry.id, quantity });
    await putRecord(DB_NAMES.cultivation, "seedStock", entry);
  }
  crop.seedStockUsage = {
    seedId: crop.seedId,
    seedStockId: selectedStockId,
    total: seedNeed,
    deducted: seedNeed - remaining,
    missing: remaining,
    allocations,
  };
}

function getSeedInventoryEntryId(year, key) {
  return `seed-inventory-${year}-${key.replace(/[^a-z0-9_-]/gi, "-")}`;
}

function getSeedInventoryEntryByKey(year, key) {
  return state.seedInventoryEntries.find((entry) => entry.year === year && entry.key === key) ?? null;
}

function getLinkedSeedIdsForStock(seedId) {
  const normalizedId = String(seedId ?? "").trim();
  if (!normalizedId) {
    return [];
  }
  const linkedIds = new Set([normalizedId]);
  if (!isPersonalSeedId(normalizedId)) {
    state.personalSeedItems
      .filter((item) => item.globalSeedId === normalizedId)
      .forEach((item) => linkedIds.add(item.id));
  }
  return [...linkedIds];
}

function getSeedInitialStock(seedId) {
  const value = toNumber(getSeedItemById(seedId)?.seedInStock);
  return Math.max(0, Math.floor(value ?? 0));
}

function getCropSeedNeed(crop) {
  const seed = getSeedItemById(crop.seedId);
  const field = (crop.fieldIds ?? [])
    .map((fieldId) => state.fields.find((item) => item.id === fieldId))
    .find(Boolean);
  const area = Math.max(Number(crop.area) || 0, 0);
  const seedPerM2 = toNumber(seed?.seedPerM2);
  if (!seed || area <= 0) {
    return 0;
  }
  if (field) {
    const bedWidthCm = Math.round(Math.min(field.width, field.length) * 100);
    const adjustments = crop.sowing ?? {};
    const rowSpacingCm = getPlanningSeedNumberValue(adjustments.rowSpacingCm) ?? getSeedSpacingCm(seed, "rowSpacing");
    const plantSpacingCm = getPlanningSeedNumberValue(adjustments.plantSpacingCm) ?? getSeedSpacingCm(seed, "spacing");
    const manualRowCount = getPlanningSeedNumberValue(adjustments.manualRowCount);
    const controlMode = adjustments.controlMode ?? (manualRowCount ? "rows" : "spacing");
    const layout = calculateSowingLayout({
      bedWidthCm,
      rowSpacingCm,
      plantSpacingCm,
      sowingAreaM2: area,
      manualRowCount,
      controlMode,
    });
    if (layout.totalSeedPositions > 0) {
      return layout.totalSeedPositions;
    }
  }
  return seedPerM2 != null && seedPerM2 > 0
    ? Math.ceil(seedPerM2 * area)
    : 0;
}

function hasCropConsumedSeedStock(crop) {
  return Boolean(crop?.seedStockUsage?.allocations?.length || crop?.seedStockUsage?.missing != null);
}

function getPlannedSeedNeedsByKey(year) {
  const rows = new Map();
  state.allCrops
    .filter((crop) => (crop.startYear ?? currentYear) === year)
    .filter((crop) => Boolean(crop.seedId))
    .forEach((crop) => {
      const seed = getSeedItemById(crop.seedId);
      const stockEntry = crop.seedStockId && crop.seedStockId !== PLANNING_STOCK_NONE
        ? state.seedStockEntries.find((entry) => entry.id === crop.seedStockId)
        : null;
      const key = stockEntry ? getInventoryStockKey(stockEntry.id) : getInventorySeedKey(crop.seedId);
      const current = rows.get(key) ?? {
        key,
        seedId: crop.seedId,
        stockId: stockEntry?.id ?? "",
        manualKey: "",
        title: seed?.crop || crop.title || "Okänd gröda",
        variety: stockEntry?.variety || seed?.variety || "",
        need: 0,
        manual: false,
      };
      current.need += hasCropConsumedSeedStock(crop) ? 0 : getCropSeedNeed(crop);
      rows.set(key, current);
    });
  return rows;
}

function getManualNeedByKey(year, key) {
  const entry = getSeedInventoryEntryByKey(year, key);
  return Math.max(0, Math.floor(toNumber(entry?.needOverride) ?? 0));
}

function getSeedNeedForInventoryKey(year, key) {
  const plannedRows = getPlannedSeedNeedsByKey(year);
  if (plannedRows.has(key)) {
    return plannedRows.get(key).need;
  }
  return getManualNeedByKey(year, key);
}

function getSeedStockForInventoryKey(year, row, memo = new Map()) {
  const memoKey = `${year}:${row.key}`;
  if (memo.has(memoKey)) {
    return memo.get(memoKey);
  }
  if (year <= currentYear && row.stockId) {
    const value = getSeedStockTotalForStockId(row.stockId);
    memo.set(memoKey, value);
    return value;
  }
  if (year <= currentYear && row.seedId) {
    const value = getSeedStockTotalForSeed(row.seedId);
    memo.set(memoKey, value);
    return value;
  }
  const entry = getSeedInventoryEntryByKey(year, row.key);
  const stockOverride = toNumber(entry?.stockOverride);
  if (stockOverride != null) {
    const value = Math.max(0, Math.floor(stockOverride));
    memo.set(memoKey, value);
    return value;
  }
  if (year <= currentYear) {
    const stockTotal = row.seedId ? getSeedStockTotalForSeed(row.seedId) : 0;
    const value = stockTotal || (row.seedId ? getSeedInitialStock(row.seedId) : 0);
    memo.set(memoKey, value);
    return value;
  }
  const previousStock = getSeedStockForInventoryKey(year - 1, row, memo);
  const previousNeed = getSeedNeedForInventoryKey(year - 1, row.key);
  const value = Math.max(0, previousStock - previousNeed);
  memo.set(memoKey, value);
  return value;
}

function getSeedShoppingRows(year = state.activeYear) {
  const rows = getPlannedSeedNeedsByKey(year);
  state.seedInventoryEntries.forEach((entry) => {
    if (entry.seedId) {
      const seed = getSeedItemById(entry.seedId);
      if (!rows.has(entry.key)) {
        rows.set(entry.key, {
          key: entry.key,
          seedId: entry.seedId,
          stockId: "",
          manualKey: "",
          title: seed?.crop || entry.title || "Okänd gröda",
          variety: seed?.variety || "",
          need: getSeedNeedForInventoryKey(year, entry.key),
          manual: false,
        });
      }
      return;
    }
    if (entry.manualKey && !rows.has(entry.key)) {
        rows.set(entry.key, {
          key: entry.key,
          seedId: "",
          stockId: "",
          manualKey: entry.manualKey,
          title: entry.title || "Ny fröpost",
          variety: "",
          need: getSeedNeedForInventoryKey(year, entry.key),
          manual: true,
        });
    }
  });

  return [...rows.values()]
    .map((row) => {
      const currentEntry = getSeedInventoryEntryByKey(year, row.key);
      const title = currentEntry?.title || row.title;
      const variety = row.variety || "";
      const need = row.manual ? getManualNeedByKey(year, row.key) : row.need;
      const stock = getSeedStockForInventoryKey(year, row);
      return {
        ...row,
        title,
        variety,
        need,
        stock,
        purchase: Math.max(0, need - stock),
        entry: currentEntry,
      };
    })
    .sort((left, right) => left.title.localeCompare(right.title, "sv"));
}

function renderSeedStockSeedOptions(selectElement, selectedId = "", { includeEmpty = true } = {}) {
  if (!selectElement) {
    return;
  }
  const options = getAllSeedItems()
    .sort((left, right) => String(left.crop ?? "").localeCompare(String(right.crop ?? ""), "sv"))
    .map((seed) => {
      const label = [seed.crop, seed.variety].filter(Boolean).join(" - ") || seed.id;
      return `<option value="${escapeHtml(seed.id)}" ${seed.id === selectedId ? "selected" : ""}>${escapeHtml(label)}</option>`;
    });
  selectElement.innerHTML = [
    includeEmpty ? '<option value="">Välj fröpost</option>' : "",
    ...options,
  ].join("");
  selectElement.value = selectedId ?? "";
}

function renderSeedDialogTemplateOptions(selectedId = "") {
  renderSeedStockSeedOptions(elements.seedDialogTemplateId, selectedId, { includeEmpty: true });
}

function setSeedDialogMode(mode = "list") {
  state.seedDialogMode = mode === "manual" ? "manual" : "list";
  elements.seedDialogModeButtons?.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.seedDialogMode === state.seedDialogMode);
  });
  if (elements.seedDialogTemplateWrap) {
    elements.seedDialogTemplateWrap.hidden = state.seedDialogMode !== "list" || elements.seedDialogModeWrap?.hidden;
  }
  if (elements.seedDialogTemplateId) {
    elements.seedDialogTemplateId.required = state.seedDialogMode === "list" && !elements.seedDialogModeWrap?.hidden;
  }
}

function applySeedTemplateToSeedDialog(seedId) {
  const seed = getSeedItemById(seedId);
  if (!seed) {
    return;
  }
  const stockEntry = isPersonalSeedId(seed.id) ? getStockEntryForSeedItem(seed) : null;
  elements.seedDialogFamilyInput.value = seed.family ?? "";
  elements.seedDialogLatinFamily.value = seed.latinFamily ?? "";
  elements.seedDialogCrop.value = seed.crop ?? "";
  elements.seedDialogVariety.value = seed.variety ?? "";
  elements.seedDialogMethod.value = seed.method ?? "";
  elements.seedDialogSpacing.value = seed.spacing ?? "";
  elements.seedDialogRowSpacing.value = seed.rowSpacing ?? "";
  elements.seedDialogForsaddStart.value = seed.schedule?.forsaddStart ?? "";
  elements.seedDialogForsaddEnd.value = seed.schedule?.forsaddEnd ?? "";
  elements.seedDialogTransplantStart.value = seed.schedule?.transplantStart ?? "";
  elements.seedDialogTransplantEnd.value = seed.schedule?.transplantEnd ?? "";
  elements.seedDialogDirectStart.value = seed.schedule?.directStart ?? "";
  elements.seedDialogDirectEnd.value = seed.schedule?.directEnd ?? "";
  elements.seedDialogCultureTime.value = seed.cultureTime ?? "";
  elements.seedDialogHarvestStart.value = seed.schedule?.harvestStart ?? "";
  elements.seedDialogHarvestEnd.value = seed.schedule?.harvestEnd ?? "";
  elements.seedDialogSeedPerM2.value = seed.seedPerM2 ?? "";
  elements.seedDialogExpiration.value = stockEntry?.expirationYear ?? seed.expirationYear ?? "";
  if (stockEntry) {
    elements.seedDialogQuantity.value = stockEntry.quantity ?? 0;
    elements.seedDialogYear.value = stockEntry.year ?? "";
    elements.seedDialogSupplier.value = stockEntry.supplier ?? "";
    elements.seedDialogNotes.value = stockEntry.notes ?? "";
  } else {
    elements.seedDialogQuantity.value = "";
    elements.seedDialogYear.value = currentYear;
    elements.seedDialogSupplier.value = "";
    elements.seedDialogNotes.value = seed.notes ?? "";
  }
  updateSeedDialogSummary();
}

function fillSeedStockDialogFromSeed(seedId) {
  const seed = getSeedItemById(seedId);
  if (!seed) {
    return;
  }
  elements.seedStockVariety.value = elements.seedStockVariety.value.trim() || seed.variety || "";
  elements.seedStockExpiration.value = elements.seedStockExpiration.value || seed.expirationYear || "";
}

function applySeedStockToSeedDialog(stockId) {
  const entry = state.seedStockEntries.find((item) => item.id === stockId);
  if (!entry) {
    return;
  }
  const seed = getSeedItemById(entry.seedId);
  if (seed) {
    elements.seedDialogFamilyInput.value = elements.seedDialogFamilyInput.value || seed.family || "";
    elements.seedDialogLatinFamily.value = elements.seedDialogLatinFamily.value || seed.latinFamily || "";
    elements.seedDialogMethod.value = elements.seedDialogMethod.value || seed.method || "";
    elements.seedDialogSpacing.value = elements.seedDialogSpacing.value || seed.spacing || "";
    elements.seedDialogRowSpacing.value = elements.seedDialogRowSpacing.value || seed.rowSpacing || "";
    elements.seedDialogSeedPerM2.value = elements.seedDialogSeedPerM2.value || seed.seedPerM2 || "";
  }
  elements.seedDialogCrop.value = entry.crop || seed?.crop || elements.seedDialogCrop.value;
  elements.seedDialogVariety.value = entry.variety || seed?.variety || elements.seedDialogVariety.value;
  elements.seedDialogQuantity.value = entry.quantity ?? elements.seedDialogQuantity.value;
  elements.seedDialogYear.value = entry.year ?? elements.seedDialogYear.value;
  elements.seedDialogExpiration.value = entry.expirationYear ?? elements.seedDialogExpiration.value;
  elements.seedDialogSupplier.value = entry.supplier || elements.seedDialogSupplier.value;
  elements.seedDialogNotes.value = entry.notes || elements.seedDialogNotes.value;
  updateSeedDialogSummary();
}

function renderSeedStockPage() {
  if (!elements.seedStockBody) {
    return;
  }
  renderSeedStockViewButtons();
  renderSeedStockSortButtons();
  if (elements.seedStockSearchInput && elements.seedStockSearchInput.value !== state.seedStockSearch) {
    elements.seedStockSearchInput.value = state.seedStockSearch;
  }
  const rows = getMySeedRows();
  if (!rows.length) {
    elements.seedStockBody.innerHTML = `
      <tr>
        <td colspan="9" class="harvest-empty">${state.seedStockView === "stocked" ? "Du har inga fröer i lager ännu." : "Du har inga fröer i Mina fröer ännu."}</td>
      </tr>
    `;
    return;
  }
  elements.seedStockBody.innerHTML = rows.map((row) => `
    <tr class="seed-stock-row" data-seed-id="${escapeHtml(row.seed.id)}">
      <td><strong>${escapeHtml(row.crop || "-")}</strong></td>
      <td>${escapeHtml(row.variety || "-")}</td>
      <td>${escapeHtml(row.family || "-")}</td>
      <td>${escapeHtml(row.method || "-")}</td>
      <td>${row.quantity}</td>
      <td>${row.year || "-"}</td>
      <td class="${isSeedExpired(row) ? "seed-stock-cell--expired" : ""}">${row.expirationYear || "-"}</td>
      <td>${escapeHtml(row.supplier || "-")}</td>
      <td class="seed-cell--notes">${escapeHtml(row.notes || "")}</td>
    </tr>
  `).join("");
}

function renderSeedStockViewButtons() {
  elements.seedStockViewButtons.forEach((button) => {
    button.classList.toggle("is-active", (button.dataset.view ?? "all") === state.seedStockView);
  });
}

function renderSeedStockSortButtons() {
  const table = elements.seedStockBody?.closest("table");
  const buttons = [...table?.querySelectorAll(".table-sort-button") ?? []];
  buttons.forEach((button) => {
    const key = button.dataset.key ?? "";
    const label = button.textContent?.replace(/[↑↓]\s*$/, "").trim() || "";
    button.innerHTML = `${escapeHtml(label)}${state.seedSort.key === key ? ` <span>${state.seedSort.direction === "asc" ? "↑" : "↓"}</span>` : ""}`;
  });
}

function isSeedExpired(row) {
  const year = Number(row?.expirationYear ?? 0);
  return Number.isFinite(year) && year > 0 && year < state.activeYear;
}

function openSeedStockDialog(stockId = null) {
  const entry = stockId ? state.seedStockEntries.find((item) => item.id === stockId) : null;
  state.activeSeedStockId = entry?.id ?? null;
  elements.seedStockForm?.reset();
  renderSeedStockSeedOptions(elements.seedStockSeedId, entry?.seedId ?? "");
  if (elements.seedStockDialogTitle) {
    elements.seedStockDialogTitle.textContent = entry ? "Redigera frö" : "Lägg till frö";
  }
  if (elements.seedStockDelete) {
    elements.seedStockDelete.hidden = !entry;
  }
  if (entry) {
    elements.seedStockVariety.value = entry.variety;
    elements.seedStockQuantity.value = entry.quantity;
    elements.seedStockYear.value = entry.year ?? "";
    elements.seedStockExpiration.value = entry.expirationYear ?? "";
    elements.seedStockSupplier.value = entry.supplier;
    elements.seedStockNotes.value = entry.notes;
  } else {
    elements.seedStockYear.value = currentYear;
  }
  showDialog(elements.seedStockDialog);
}

async function handleSeedStockSubmit(event) {
  event.preventDefault();
  const selectedSeedId = elements.seedStockSeedId?.value ?? "";
  const seed = getSeedItemById(selectedSeedId);
  if (!seed) {
    showAppNotice("Välj en gröda från frödatabasen innan du sparar.", "error");
    return;
  }
  const existing = state.seedStockEntries.find((entry) => entry.id === state.activeSeedStockId);
  const variety = elements.seedStockVariety?.value.trim() ?? "";
  let personalSeed = isPersonalSeedId(selectedSeedId)
    ? state.personalSeedItems.find((item) => item.id === selectedSeedId) ?? null
    : findPersonalSeedByGlobalReference(selectedSeedId, variety || seed.variety || "", seed.crop ?? "");
  if (!personalSeed) {
    personalSeed = normalizeSeedItem({
      id: `personal-seed-${Date.now()}`,
      stockId: existing?.id ?? "",
      globalSeedId: !isPersonalSeedId(selectedSeedId) ? selectedSeedId : "",
      family: seed.family ?? "",
      latinFamily: seed.latinFamily ?? "",
      crop: seed.crop ?? "",
      variety: variety || seed.variety || "",
      method: seed.method ?? "",
      spacing: seed.spacing ?? "",
      rowSpacing: seed.rowSpacing ?? "",
      cultureTime: seed.cultureTime ?? "",
      seedPerM2: seed.seedPerM2 ?? "",
      expirationYear: elements.seedStockExpiration?.value.trim() || seed.expirationYear || "",
      notes: elements.seedStockNotes?.value.trim() ?? "",
      schedule: cloneValue(seed.schedule ?? {}),
    });
  }
  const name = [personalSeed.crop, variety || personalSeed.variety].filter(Boolean).join(" - ") || personalSeed.crop || "Frö";
  const entry = normalizeSeedStockEntry({
    ...(existing ?? {}),
    id: existing?.id ?? `seed-stock-${Date.now()}`,
    seedId: personalSeed.id,
    name,
    crop: personalSeed.crop ?? "",
    variety: variety || personalSeed.variety || "",
    quantity: toNumber(elements.seedStockQuantity?.value) ?? 0,
    year: toNumber(elements.seedStockYear?.value),
    expirationYear: toNumber(elements.seedStockExpiration?.value),
    supplier: elements.seedStockSupplier?.value.trim() ?? "",
    notes: elements.seedStockNotes?.value.trim() ?? "",
  });
  personalSeed = normalizeSeedItem({
    ...personalSeed,
    stockId: entry.id,
    expirationYear: entry.expirationYear ?? personalSeed.expirationYear ?? "",
    notes: entry.notes || personalSeed.notes || "",
    variety: entry.variety || personalSeed.variety || "",
  });
  await putRecord(DB_NAMES.seedPersonal, "items", personalSeed);
  await putRecord(DB_NAMES.cultivation, "seedStock", entry);
  state.activeSeedStockId = null;
  await loadState();
  renderAll();
  closeDialog(elements.seedStockDialog);
  queuePersistUserDataSnapshot();
}

async function handleSeedStockDelete() {
  const entry = state.seedStockEntries.find((item) => item.id === state.activeSeedStockId);
  if (!entry) {
    return;
  }
  const confirmed = await requestConfirmation({
    title: "Ta bort frö",
    message: `Ta bort ${entry.name} från Mina fröer?`,
    confirmText: "Ta bort",
    danger: true,
  });
  if (!confirmed) {
    return;
  }
  await deleteRecord(DB_NAMES.cultivation, "seedStock", entry.id);
  const stockInventoryKey = getInventoryStockKey(entry.id);
  for (const inventoryEntry of state.seedInventoryEntries.filter((item) => item.key === stockInventoryKey)) {
    await deleteRecord(DB_NAMES.cultivation, "seedInventory", inventoryEntry.id);
  }
  const remainingStock = state.seedStockEntries.filter((item) => item.id !== entry.id && item.seedId === entry.seedId);
  if (!remainingStock.length && entry.seedId) {
    const inventoryKey = getInventorySeedKey(entry.seedId);
    for (const inventoryEntry of state.seedInventoryEntries.filter((item) => item.key === inventoryKey)) {
      inventoryEntry.stockOverride = null;
      await putRecord(DB_NAMES.cultivation, "seedInventory", normalizeSeedInventoryEntry(inventoryEntry));
    }
  }
  for (const seed of state.personalSeedItems.filter((item) => item.stockId === entry.id)) {
    seed.stockId = "";
    await putRecord(DB_NAMES.seedPersonal, "items", normalizeSeedItem(seed));
  }
  state.activeSeedStockId = null;
  await loadState();
  renderAll();
  closeDialog(elements.seedStockDialog);
  queuePersistUserDataSnapshot();
}

async function upsertSeedInventoryEntry(row, updates = {}) {
  const existing = getSeedInventoryEntryByKey(state.activeYear, row.key);
  const entry = normalizeSeedInventoryEntry({
    id: existing?.id ?? getSeedInventoryEntryId(state.activeYear, row.key),
    key: row.key,
    year: state.activeYear,
    seedId: row.seedId ?? existing?.seedId ?? "",
    manualKey: row.manualKey ?? existing?.manualKey ?? "",
    title: updates.title ?? existing?.title ?? row.title ?? "",
    stockOverride: updates.stockOverride ?? existing?.stockOverride ?? null,
    needOverride: updates.needOverride ?? existing?.needOverride ?? null,
    manual: row.manual || existing?.manual || false,
  });
  await putRecord(DB_NAMES.cultivation, "seedInventory", entry);
  await loadState();
  renderSeedShoppingDialog();
  queuePersistUserDataSnapshot();
}

function renderSeedShoppingDialog() {
  if (!elements.seedShoppingBody) {
    return;
  }
  const rows = getSeedShoppingRows().filter((row) => row.need > 0 || row.stock > 0 || row.purchase > 0);
  if (elements.seedShoppingMeta) {
    const totalNeed = rows.reduce((sum, row) => sum + row.need, 0);
    const totalPurchase = rows.reduce((sum, row) => sum + row.purchase, 0);
    elements.seedShoppingMeta.textContent = `Fröbehov för ${state.activeYear}. Totalt behövs ${totalNeed} frön, varav ${totalPurchase} behöver köpas.`;
  }
  if (!rows.length) {
    elements.seedShoppingBody.innerHTML = `
      <tr>
        <td colspan="6" class="harvest-empty">Inga planerade grödor eller manuella frörader finns för ${state.activeYear} ännu.</td>
      </tr>
    `;
    return;
  }

  const purchaseRows = rows.filter((row) => row.purchase > 0);
  const stockedRows = rows.filter((row) => row.need > 0 && row.stock > 0 && row.purchase <= 0);
  const renderRow = (row) => {
    const titleCell = `<strong>${escapeHtml(row.title)}</strong>`;
    const varietyCell = escapeHtml(row.variety || "-");
    const needCell = `<strong>${row.need}</strong>`;
    const buyDisabled = row.purchase <= 0 ? "disabled" : "";
    return `
      <tr data-seed-shopping-key="${escapeHtml(row.key)}">
        <td>${titleCell}</td>
        <td>${varietyCell}</td>
        <td><input type="number" min="0" step="1" data-seed-shopping-field="stock" value="${row.stock}" aria-label="Frö i lager" /></td>
        <td>${needCell}</td>
        <td><strong>${row.purchase}</strong></td>
        <td>
          <button class="icon-button seed-shopping-buy" type="button" data-seed-shopping-buy ${buyDisabled} aria-label="Registrera köp av ${escapeHtml(row.title)}">
            ${getIconMarkup("shoppingCart")}
          </button>
        </td>
      </tr>
    `;
  };
  const sections = [];
  sections.push(`
    <tr class="seed-shopping-section-row">
      <td colspan="6">Fröer att köpa</td>
    </tr>
  `);
  sections.push(purchaseRows.length
    ? purchaseRows.map(renderRow).join("")
    : '<tr><td colspan="6" class="harvest-empty">Inga fröer behöver köpas just nu.</td></tr>');
  sections.push(`
    <tr class="seed-shopping-section-row">
      <td colspan="6">Fröer i lager som används i år</td>
    </tr>
  `);
  sections.push(stockedRows.length
    ? stockedRows.map(renderRow).join("")
    : '<tr><td colspan="6" class="harvest-empty">Inga lagerförda fröer används i årets plan ännu.</td></tr>');
  elements.seedShoppingBody.innerHTML = sections.join("");
}

function openSeedShoppingDialog() {
  renderSeedShoppingDialog();
  showDialog(elements.seedShoppingDialog);
}

async function handleSeedShoppingTableChange(event) {
  const input = event.target.closest("[data-seed-shopping-field]");
  const rowElement = event.target.closest("[data-seed-shopping-key]");
  if (!input || !rowElement) {
    return;
  }
  const row = getSeedShoppingRows().find((item) => item.key === rowElement.dataset.seedShoppingKey);
  if (!row) {
    return;
  }
  const field = input.dataset.seedShoppingField;
  const updates = {};
  if (field === "title") {
    updates.title = input.value.trim() || "Ny fröpost";
  }
  if (field === "stock") {
    if (row.stockId) {
      const entry = state.seedStockEntries.find((item) => item.id === row.stockId);
      if (entry) {
        entry.quantity = Math.max(0, Math.floor(toNumber(input.value) ?? 0));
        await putRecord(DB_NAMES.cultivation, "seedStock", normalizeSeedStockEntry(entry));
        await loadState();
        renderSeedShoppingDialog();
        renderSeedStockPage();
        queuePersistUserDataSnapshot();
        return;
      }
    }
    if (row.seedId) {
      await setSeedStockTotalForSeed(row.seedId, input.value);
      await loadState();
      renderSeedShoppingDialog();
      renderSeedStockPage();
      queuePersistUserDataSnapshot();
      return;
    }
    updates.stockOverride = Math.max(0, Math.floor(toNumber(input.value) ?? 0));
  }
  if (field === "need") {
    updates.needOverride = Math.max(0, Math.floor(toNumber(input.value) ?? 0));
  }
  await upsertSeedInventoryEntry(row, updates);
}

async function handleSeedShoppingTableClick(event) {
  const button = event.target.closest("[data-seed-shopping-buy]");
  const rowElement = event.target.closest("[data-seed-shopping-key]");
  if (!button || !rowElement) {
    return;
  }
  const row = getSeedShoppingRows().find((item) => item.key === rowElement.dataset.seedShoppingKey);
  if (!row || row.purchase <= 0) {
    return;
  }
  state.pendingSeedPurchaseKey = row.key;
  if (elements.seedPurchaseTitle) {
    elements.seedPurchaseTitle.textContent = `Köp ${row.title}`;
  }
  if (elements.seedPurchaseMessage) {
    elements.seedPurchaseMessage.textContent = `Har du köpt frön för ${row.title}? Ange hur många frön som ska fyllas på i lagret.`;
  }
  if (elements.seedPurchaseQuantity) {
    elements.seedPurchaseQuantity.value = row.purchase || "";
  }
  showDialog(elements.seedPurchaseDialog);
}

async function handleSeedPurchaseSubmit(event) {
  event.preventDefault();
  const row = getSeedShoppingRows().find((item) => item.key === state.pendingSeedPurchaseKey);
  const quantity = Math.max(0, Math.floor(toNumber(elements.seedPurchaseQuantity?.value) ?? 0));
  if (!row || quantity <= 0) {
    showAppNotice("Ange ett antal frön större än 0.", "error");
    return;
  }
  await addPurchasedSeedsToStock(row, quantity);
  if (!row.seedId && !row.stockId) {
    await upsertSeedInventoryEntry(row, { stockOverride: row.stock + quantity });
  }
  state.pendingSeedPurchaseKey = null;
  closeDialog(elements.seedPurchaseDialog);
  renderAll();
  renderSeedShoppingDialog();
  showAppNotice(`${quantity} frön lades till i Mina fröer för ${row.title}.`, "success");
}

async function addPurchasedSeedsToStock(row, quantity) {
  const seed = getSeedItemById(row.seedId);
  let linkedSeed = isPersonalSeedId(row.seedId)
    ? state.personalSeedItems.find((item) => item.id === row.seedId) ?? null
    : findPersonalSeedByGlobalReference(row.seedId, row.variety || seed?.variety || "", row.title || seed?.crop || "");
  if (!linkedSeed) {
    linkedSeed = normalizeSeedItem({
      id: `personal-seed-${Date.now()}`,
      stockId: row.stockId ?? "",
      globalSeedId: !isPersonalSeedId(row.seedId) ? row.seedId : "",
      family: seed?.family ?? "",
      latinFamily: seed?.latinFamily ?? "",
      crop: seed?.crop || row.title,
      variety: row.variety || seed?.variety || "",
      method: seed?.method ?? "",
      spacing: seed?.spacing ?? "",
      rowSpacing: seed?.rowSpacing ?? "",
      cultureTime: seed?.cultureTime ?? "",
      seedPerM2: seed?.seedPerM2 ?? "",
      expirationYear: seed?.expirationYear ?? "",
      notes: "",
      schedule: cloneValue(seed?.schedule ?? {}),
    });
    await putRecord(DB_NAMES.seedPersonal, "items", linkedSeed);
  }
  const existing = row.stockId
    ? state.seedStockEntries.find((entry) => entry.id === row.stockId)
    : state.seedStockEntries.find((entry) => entry.id === linkedSeed.stockId || entry.seedId === linkedSeed.id);
  const entry = normalizeSeedStockEntry({
    ...(existing ?? {}),
    id: existing?.id ?? `seed-stock-${Date.now()}`,
    seedId: linkedSeed.id,
    name: existing?.name || [linkedSeed.crop, linkedSeed.variety].filter(Boolean).join(" - ") || row.title,
    crop: existing?.crop || linkedSeed.crop || seed?.crop || row.title,
    variety: existing?.variety || linkedSeed.variety || row.variety || seed?.variety || "",
    quantity: (existing?.quantity ?? 0) + quantity,
    year: existing?.year ?? state.activeYear,
    expirationYear: existing?.expirationYear ?? toNumber(seed?.expirationYear),
    supplier: existing?.supplier ?? "",
    notes: existing?.notes ?? "",
  });
  await putRecord(DB_NAMES.cultivation, "seedStock", entry);
  linkedSeed.stockId = entry.id;
  await putRecord(DB_NAMES.seedPersonal, "items", normalizeSeedItem(linkedSeed));
  await loadState();
  queuePersistUserDataSnapshot();
}

function openPlanningSowingDialog() {
  const seed = resolvePlanningSeed({ allowSingleVariety: true });
  const layout = getPlanningSowingLayout(seed);

  applyPlanningSowingControlMode(state.planningSowingControlMode);
  if (elements.planningSowingRowSpacing) {
    elements.planningSowingRowSpacing.value = layout.effectiveRowSpacingCm ? String(Number(layout.effectiveRowSpacingCm.toFixed(1))) : "";
  }
  if (elements.planningSowingPlantSpacing) {
    elements.planningSowingPlantSpacing.value = layout.plantSpacingCm ? String(Math.round(layout.plantSpacingCm)) : "";
  }
  if (elements.planningSowingArea) {
    elements.planningSowingArea.value = layout.sowingAreaM2 ? String(layout.sowingAreaM2) : "";
  }
  if (elements.planningSowingManualRows) {
    elements.planningSowingManualRows.value = state.planningSowingAdjustments?.manualRowCount ? String(state.planningSowingAdjustments.manualRowCount) : "";
    elements.planningSowingManualRows.placeholder = layout.autoRowCount ? String(layout.autoRowCount) : "";
  }

  renderPlanningSowingDialogPreview();
  showDialog(elements.planningSowingDialog);
}

function getPlanningSowingDialogOverrides() {
  return {
    rowSpacingCm: elements.planningSowingRowSpacing?.value,
    plantSpacingCm: elements.planningSowingPlantSpacing?.value,
    sowingAreaM2: elements.planningSowingArea?.value,
    manualRowCount: elements.planningSowingManualRows?.value,
    controlMode: state.planningSowingControlMode,
  };
}

function applyPlanningSowingControlMode(mode = "spacing") {
  state.planningSowingControlMode = mode === "rows" ? "rows" : "spacing";
  renderPlanningSowingControlLabel(elements.planningSowingRowSpacingLabel, "Radavstånd (cm)", "spacing");
  renderPlanningSowingControlLabel(elements.planningSowingManualRowsLabel, "Antal rader", "rows");
}

function renderPlanningSowingControlLabel(element, label, mode) {
  if (!element) {
    return;
  }
  const isLocked = state.planningSowingControlMode === mode;
  element.innerHTML = `
    <span class="field-label-text">
      <span>${escapeHtml(label)}</span>
      ${isLocked ? `<button type="button" class="field-lock-button" data-sowing-lock-toggle="${escapeHtml(mode)}" aria-label="Aktiv styrning: ${escapeHtml(label)}" title="Aktiv styrning">🔒</button>` : ""}
    </span>
  `;
}

function ensurePlanningSowingPreviewScene() {
  if (!elements.planningSowingPreview) {
    return null;
  }
  let scene = elements.planningSowingPreview.querySelector(".sowing-layout-scene");
  if (scene) {
    return scene;
  }

  elements.planningSowingPreview.innerHTML = `
    <div class="sowing-layout-scene">
      <div class="sowing-layout-scene__shell">
        <div class="sowing-layout-scene__bed">
          <div class="sowing-layout-scene__rows"></div>
        </div>
        <div class="sowing-layout-scene__length-marker">
          <span class="sowing-layout-scene__measure-line"></span>
          <span class="sowing-layout-scene__measure-cap sowing-layout-scene__measure-cap--start"></span>
          <span class="sowing-layout-scene__measure-cap sowing-layout-scene__measure-cap--end"></span>
          <span class="sowing-layout-scene__measure-label">
            <strong>1 m</strong>
            <span>Visad bäddlängd</span>
          </span>
        </div>
        <div class="sowing-layout-scene__row-marker">
          <span class="sowing-layout-scene__measure-line"></span>
          <span class="sowing-layout-scene__measure-cap sowing-layout-scene__measure-cap--start"></span>
          <span class="sowing-layout-scene__measure-cap sowing-layout-scene__measure-cap--end"></span>
          <span class="sowing-layout-scene__measure-label">
            <strong class="sowing-layout-scene__measure-value"></strong>
            <span>Radavstånd</span>
          </span>
        </div>
        <div class="sowing-layout-scene__plant-marker">
          <span class="sowing-layout-scene__measure-line"></span>
          <span class="sowing-layout-scene__measure-cap sowing-layout-scene__measure-cap--start"></span>
          <span class="sowing-layout-scene__measure-cap sowing-layout-scene__measure-cap--end"></span>
          <span class="sowing-layout-scene__measure-label">
            <strong class="sowing-layout-scene__measure-value"></strong>
            <span>Plantavstånd</span>
          </span>
        </div>
      </div>
      <div class="sowing-layout-scene__footer">
        <span class="sowing-layout-scene__width"></span>
        <span class="sowing-layout-scene__seed-total" aria-live="polite"></span>
      </div>
    </div>
  `;

  scene = elements.planningSowingPreview.querySelector(".sowing-layout-scene");
  const rowsContainer = scene?.querySelector(".sowing-layout-scene__rows");
  if (!scene || !rowsContainer) {
    return scene;
  }

  for (let rowIndex = 0; rowIndex < 12; rowIndex += 1) {
    const row = document.createElement("div");
    row.className = "sowing-layout-row";
    row.innerHTML = `
      <span class="sowing-layout-row__guide"></span>
      <div class="sowing-layout-row__plants">
        ${Array.from({ length: 120 }, (_, plantIndex) => `
          <span class="sowing-layout-plant"></span>
        `).join("")}
      </div>
    `;
    rowsContainer.appendChild(row);
  }
  return scene;
}

function renderPlanningSowingDialogPreview() {
  if (!elements.planningSowingPreview || !elements.planningSowingWarning) {
    return;
  }
  const seed = resolvePlanningSeed({ allowSingleVariety: true });
  const layout = getPlanningSowingLayout(seed, getPlanningSowingDialogOverrides());
  const scene = ensurePlanningSowingPreviewScene();
  const rows = [...(scene?.querySelectorAll(".sowing-layout-row") ?? [])];
  const visibleRows = Math.max(Math.min(layout.rowCount || 1, rows.length || 1), 1);
  const visiblePlants = Math.max(Math.min(layout.plantsPerRow || Math.floor(100 / Math.max(layout.plantSpacingCm || 1, 1)), 120), 2);
  const bedLeftPx = 202;
  const bedTopPx = 72;
  const bedWidthPx = 232;
  const bedLengthPx = 208;
  const measureGapPx = 30;
  const renderRowSpacingCm = layout.controlMode === "rows" ? layout.effectiveRowSpacingCm : layout.rowSpacingCm;
  const scaledRowGap = layout.bedWidthCm ? renderRowSpacingCm * (bedWidthPx / layout.bedWidthCm) : 0;
  const contentWidth = Math.min(Math.max(visibleRows * scaledRowGap, 0), bedWidthPx - 12);
  const effectiveRowGap = visibleRows > 0 ? contentWidth / visibleRows : 0;
  const rowOffset = (bedWidthPx - contentWidth) / 2;
  const plantTop = 40;
  const plantGap = layout.plantSpacingCm ? layout.plantSpacingCm * (bedLengthPx / 100) : 0;
  const plantSizePx = Math.max(Math.min(plantGap * 0.82, 12), 2);
  const firstRowX = rowOffset + (effectiveRowGap / 2);
  const secondRowX = firstRowX + effectiveRowGap;
  const firstPlantY = plantTop;
  const secondPlantY = plantTop + plantGap;

  if (elements.planningSowingRowSpacing && state.planningSowingControlMode === "rows" && document.activeElement !== elements.planningSowingRowSpacing) {
    elements.planningSowingRowSpacing.value = renderRowSpacingCm ? String(Number(renderRowSpacingCm.toFixed(1))) : "";
  }
  if (elements.planningSowingManualRows && state.planningSowingControlMode === "spacing" && document.activeElement !== elements.planningSowingManualRows) {
    elements.planningSowingManualRows.value = layout.rowCount ? String(layout.rowCount) : "";
  }

  rows.forEach((row, rowIndex) => {
    const isVisible = rowIndex < visibleRows;
    row.classList.toggle("is-visible", isVisible);
    row.style.left = `${firstRowX + (effectiveRowGap * rowIndex) - 8}px`;
    row.style.setProperty("--plant-size", `${plantSizePx}px`);
    const plants = [...row.querySelectorAll(".sowing-layout-plant")];
    plants.forEach((plant, plantIndex) => {
      const showPlant = isVisible && plantIndex < visiblePlants;
      plant.classList.toggle("is-visible", showPlant);
      plant.style.top = `${plantTop + (plantGap * plantIndex)}px`;
    });
  });

  const rowMarker = scene?.querySelector(".sowing-layout-scene__row-marker");
  const rowMarkerValue = rowMarker?.querySelector(".sowing-layout-scene__measure-value");
  if (rowMarker && rowMarkerValue) {
    rowMarker.style.left = `${bedLeftPx + firstRowX}px`;
    rowMarker.style.top = `${bedTopPx - measureGapPx}px`;
    rowMarker.style.width = `${Math.max(secondRowX - firstRowX, 2)}px`;
    rowMarkerValue.textContent = renderRowSpacingCm ? `${formatDecimalSv(renderRowSpacingCm, 0)} cm` : "-";
  }

  const plantMarker = scene?.querySelector(".sowing-layout-scene__plant-marker");
  const plantMarkerValue = plantMarker?.querySelector(".sowing-layout-scene__measure-value");
  if (plantMarker && plantMarkerValue) {
    plantMarker.style.left = `${bedLeftPx + bedWidthPx + measureGapPx}px`;
    plantMarker.style.top = `${bedTopPx + firstPlantY + (plantSizePx / 2)}px`;
    plantMarker.style.height = `${Math.max(secondPlantY - firstPlantY, 2)}px`;
    plantMarkerValue.textContent = layout.plantSpacingCm ? `${formatDecimalSv(layout.plantSpacingCm, 0)} cm` : "-";
  }

  const widthLabel = scene?.querySelector(".sowing-layout-scene__width");
  if (widthLabel) {
    widthLabel.innerHTML = layout.fieldMetrics
      ? `
        <span>Bäddbredd ${escapeHtml(formatDecimalSv(layout.fieldMetrics.bedWidthCm, 0))} cm</span>
        <span>Bäddlängd ${escapeHtml(formatDecimalSv(layout.fieldMetrics.bedLengthCm / 100, 2))} m</span>
      `
      : "<span>Ingen bädd vald</span>";
  }

  const seedTotal = scene?.querySelector(".sowing-layout-scene__seed-total");
  if (seedTotal) {
    seedTotal.innerHTML = `
      <span>Antal frö</span>
      <strong>${escapeHtml(String(layout.totalSeedPositions || 0))}</strong>
      <small>${layout.totalSeedPositions ? `${escapeHtml(String(layout.rowCount))} rader x ${escapeHtml(String(layout.plantsPerRow))} platser per rad` : "Behöver giltiga mått"}</small>
    `;
  }

  elements.planningSowingWarning.hidden = layout.warnings.length === 0;
  elements.planningSowingWarning.textContent = layout.warnings.join(" ");
}

function handlePlanningSowingSubmit(event) {
  event.preventDefault();
  const layout = getPlanningSowingLayout(resolvePlanningSeed({ allowSingleVariety: true }), getPlanningSowingDialogOverrides());
  state.planningSowingAdjustments = {
    rowSpacingCm: layout.rowSpacingCm || null,
    plantSpacingCm: layout.plantSpacingCm || null,
    manualRowCount: elements.planningSowingManualRows?.value ? layout.rowCount : null,
  };
  if (elements.planningArea) {
    elements.planningArea.value = layout.sowingAreaM2 ? String(layout.sowingAreaM2) : "";
  }
  closeDialog(elements.planningSowingDialog);
  renderPlanningCapacity();
}

function renderPlanningForm() {
  const allSeedItems = getAllSeedItems();
  const hasTypedValues = Boolean(elements.planningCrop?.value.trim() || elements.planningVariety?.value.trim());
  renderPlanningCropOptions(elements.planningCrop?.value ?? "");
  const activeSeed = resolvePlanningSeed({ allowSingleVariety: true }) ?? (!hasTypedValues ? allSeedItems[0] : null);
  if (activeSeed) {
    renderPlanningCropOptions(activeSeed.crop ?? "");
    elements.planningCrop.value = activeSeed.crop ?? "";
    elements.planningSeedId.value = activeSeed.id;
  }

  if (activeSeed) {
    fillPlanningFormFromSeed(activeSeed);
    renderCropFamilyVisual(elements.planningDialog, activeSeed.id);
  } else {
    renderCropFamilyVisualByFamily(elements.planningDialog, "");
  }

  updatePlanningFieldChipState();

  syncPlanningAreaToSelectedField();
  renderPlanningSeedStockOptions(activeSeed);
  renderPlanningDerivedUi(activeSeed);
  updatePlanningVisibleFields(activeSeed);
  updatePlanningDialogLayout();
  renderPlanningCapacity();
}

function updatePlanningPreviewTitle(seedItem = null) {
  if (!elements.planningPreviewTitle) {
    return;
  }
  const cropValue = seedItem?.crop ?? elements.planningCrop?.value.trim() ?? "";
  const varietyValue = elements.planningVariety?.value.trim() ?? "";
  const title = [cropValue, varietyValue].filter(Boolean).join(", ");
  elements.planningPreviewTitle.textContent = title || "Ny gröda";
}

function fillPlanningFormFromSeed(seedItem) {
  elements.planningSeedId.value = seedItem.id;
  elements.planningCrop.value = seedItem.crop ?? "";
  elements.planningPresow.value = getRecommendedWeek(seedItem.schedule.forsaddStart, seedItem.schedule.forsaddEnd) ?? "";
  elements.planningDirect.value = getRecommendedWeek(seedItem.schedule.directStart, seedItem.schedule.directEnd) ?? "";
  elements.planningTransplant.value = getRecommendedWeek(seedItem.schedule.transplantStart, seedItem.schedule.transplantEnd) ?? "";
  elements.planningHarvest.value = getRecommendedWeek(seedItem.schedule.harvestStart, seedItem.schedule.harvestEnd) ?? "";
  syncPlanningScheduleState();
  autoSelectPlanningField(seedItem);
  syncPlanningAreaToSelectedField();
  renderPlanningSowMethod(seedItem);
}

function renderPlanningSowMethod(seedItem) {
  const options = getSeedSowMethodOptions(seedItem);
  if (!elements.planningSowMethodWrap || !elements.planningSowMethod) {
    return;
  }
  elements.planningSowMethodWrap.hidden = options.length <= 1;
  if (options.length <= 1) {
    state.planningSowMode = options[0] ?? "auto";
    elements.planningSowMethod.innerHTML = "";
    applyPlanningSowMode(seedItem);
    updatePlanningVisibleFields(seedItem);
    return;
  }
  if (!options.includes(state.planningSowMode)) {
    state.planningSowMode = options[0];
  }
  elements.planningSowMethod.innerHTML = options.map((option) => `
    <button class="segment ${state.planningSowMode === option ? "is-active" : ""}" type="button" data-mode="${option}">
      ${option === "forsadd" ? "Försådd" : "Direktsådd"}
    </button>
  `).join("");
  [...elements.planningSowMethod.querySelectorAll(".segment")].forEach((button) => {
    button.addEventListener("click", () => {
      state.planningSowMode = button.dataset.mode;
      applyPlanningSowMode(seedItem);
      renderPlanningSowMethod(seedItem);
      renderPlanningDerivedUi(seedItem);
      updatePlanningVisibleFields(seedItem);
    });
  });
  applyPlanningSowMode(seedItem);
  updatePlanningVisibleFields(seedItem);
}

function getSeedSowMethodOptions(seedItem) {
  const options = [];
  if (seedItem.schedule.forsaddStart || seedItem.schedule.forsaddEnd) options.push("forsadd");
  if (seedItem.schedule.directStart || seedItem.schedule.directEnd) options.push("direktsadd");
  return options;
}

function applyPlanningSowMode(seedItem) {
  const options = getSeedSowMethodOptions(seedItem);
  const mode = options.includes(state.planningSowMode) ? state.planningSowMode : options[0];
  if (mode === "forsadd" && !seedItem.schedule.directStart && !seedItem.schedule.directEnd) {
    state.planningSowMode = "forsadd";
    return;
  }
  if (mode === "direktsadd" && !seedItem.schedule.forsaddStart && !seedItem.schedule.forsaddEnd) {
    state.planningSowMode = "direktsadd";
    return;
  }
  if (mode === "forsadd") {
    elements.planningPresow.value = getRecommendedWeek(seedItem.schedule.forsaddStart, seedItem.schedule.forsaddEnd) ?? "";
    elements.planningTransplant.value = getRecommendedWeek(seedItem.schedule.transplantStart, seedItem.schedule.transplantEnd) ?? "";
    elements.planningDirect.value = "";
  } else if (mode === "direktsadd") {
    elements.planningDirect.value = getRecommendedWeek(seedItem.schedule.directStart, seedItem.schedule.directEnd) ?? "";
    elements.planningPresow.value = "";
    elements.planningTransplant.value = "";
  }
    syncPlanningScheduleState();
    updatePlanningVisibleFields(seedItem);
  }

function updatePlanningVisibleFields(seedItem) {
  const options = seedItem ? getSeedSowMethodOptions(seedItem) : [];
  const mode = options.includes(state.planningSowMode) ? state.planningSowMode : options[0] ?? null;
  const showPresow = mode !== "direktsadd" && Boolean(seedItem?.schedule?.forsaddStart || seedItem?.schedule?.forsaddEnd || elements.planningPresow?.value);
  const showDirect = mode !== "forsadd" && Boolean(seedItem?.schedule?.directStart || seedItem?.schedule?.directEnd || elements.planningDirect?.value);
  const showTransplant = mode !== "direktsadd" && Boolean(seedItem?.schedule?.transplantStart || seedItem?.schedule?.transplantEnd || seedItem?.schedule?.transplant || elements.planningTransplant?.value);
  const showHarvest = Boolean(seedItem?.schedule?.harvestStart || seedItem?.schedule?.harvestEnd || elements.planningHarvest?.value);

  const activeCount = [showPresow, showDirect, showTransplant, showHarvest].filter(Boolean).length || 1;
  if (elements.planningScheduleGrid) {
    elements.planningScheduleGrid.style.setProperty("--planning-schedule-columns", String(activeCount));
  }

  setPlanningFieldActive(elements.planningPresowWrap, showPresow);
  setPlanningFieldActive(elements.planningDirectWrap, showDirect);
  setPlanningFieldActive(elements.planningTransplantWrap, showTransplant);
  setPlanningFieldActive(elements.planningHarvestWrap, showHarvest);
}

function setPlanningFieldActive(element, isActive) {
  if (!element) {
    return;
  }
  element.hidden = !isActive;
  element.setAttribute("aria-hidden", isActive ? "false" : "true");
}

function getRecommendedWeek(startWeek, endWeek = startWeek) {
  if (!startWeek && !endWeek) {
    return null;
  }
  if (!startWeek || !endWeek) {
    return startWeek ?? endWeek ?? null;
  }
  return Math.round((startWeek + endWeek) / 2);
}

function formatRecommendedRange(startWeek, endWeek = startWeek) {
  if (!startWeek && !endWeek) {
    return "";
  }
  if (!startWeek || !endWeek || startWeek === endWeek) {
    return `rek. v.${startWeek ?? endWeek}`;
  }
  return `rek. v.${startWeek}-${endWeek}`;
}

  function renderPlanningDerivedUi(seedItem = null) {
    const activeSeed = seedItem ?? resolvePlanningSeed({ allowSingleVariety: true });
    updatePlanningPreviewTitle(activeSeed);
    updatePlanningScheduleLockLabels();
    renderPlanningRecommendationLabels(activeSeed);
    renderPlanningScheduleWarning(activeSeed);
    renderPlanningMiniTimeline(activeSeed);
  }

  function syncPlanningScheduleState() {
    const presowWeek = toNumber(elements.planningPresow?.value);
    const transplantWeek = toNumber(elements.planningTransplant?.value);
    const harvestWeek = toNumber(elements.planningHarvest?.value);
    state.planningPresowTransplantGap =
      presowWeek != null && transplantWeek != null
        ? transplantWeek - presowWeek
        : null;
    state.planningTransplantHarvestGap =
      transplantWeek != null && harvestWeek != null
        ? harvestWeek - transplantWeek
        : null;
    state.planningScheduleLinked = true;
    state.planningScheduleLock = null;
    updatePlanningScheduleLockLabels();
  }

  function handlePlanningLinkedWeekChange(changedField) {
    if (state.planningScheduleLinked) {
      const presowGap = state.planningPresowTransplantGap;
      const harvestGap = state.planningTransplantHarvestGap;
      let presowWeek = toNumber(elements.planningPresow?.value);
      let transplantWeek = toNumber(elements.planningTransplant?.value);
      let harvestWeek = toNumber(elements.planningHarvest?.value);

      if (changedField === "presow" && presowWeek != null && presowGap != null && elements.planningTransplant) {
        transplantWeek = clampWeek(presowWeek + presowGap);
        elements.planningTransplant.value = String(transplantWeek);
      }
      if (changedField === "transplant" && transplantWeek != null && presowGap != null && elements.planningPresow) {
        presowWeek = clampWeek(transplantWeek - presowGap);
        elements.planningPresow.value = String(presowWeek);
      }
      if ((changedField === "presow" || changedField === "transplant") && transplantWeek != null && harvestGap != null && elements.planningHarvest) {
        harvestWeek = clampWeek(transplantWeek + harvestGap);
        elements.planningHarvest.value = String(harvestWeek);
      }
      if (changedField === "harvest" && harvestWeek != null && harvestGap != null && elements.planningTransplant) {
        transplantWeek = clampWeek(harvestWeek - harvestGap);
        elements.planningTransplant.value = String(transplantWeek);
      }
      if (changedField === "harvest" && transplantWeek != null && presowGap != null && elements.planningPresow) {
        presowWeek = clampWeek(transplantWeek - presowGap);
        elements.planningPresow.value = String(presowWeek);
      }

      state.planningPresowTransplantGap =
        presowWeek != null && transplantWeek != null
          ? transplantWeek - presowWeek
          : state.planningPresowTransplantGap;
      state.planningTransplantHarvestGap =
        transplantWeek != null && harvestWeek != null
          ? harvestWeek - transplantWeek
          : state.planningTransplantHarvestGap;
    }
    state.planningScheduleLock = changedField;
    renderPlanningDerivedUi();
  }

  async function handlePlanningScheduleLockToggle() {
    if (!state.planningScheduleLinked || !state.planningScheduleLock) {
      return;
    }
    const confirmed = await requestConfirmation({
      title: "Frikoppla veckorna",
      message: "Vill du anpassa skörden själv? Då kan du ändra veckorna fritt utan att de andra följer med.",
      confirmText: "Anpassa själv",
    });
    if (!confirmed) {
      return;
    }
    state.planningScheduleLinked = false;
    state.planningScheduleLock = null;
    renderPlanningDerivedUi();
  }

  function updatePlanningScheduleLockLabels() {
    renderPlanningScheduleLabel(elements.planningPresowLabel, "Försådd", "presow");
    renderPlanningScheduleLabel(elements.planningTransplantLabel, "Utplantering", "transplant");
    renderPlanningScheduleLabel(elements.planningHarvestLabel, "Skörd", "harvest");
  }

  function renderPlanningScheduleLabel(element, label, fieldKey) {
    if (!element) {
      return;
    }
    const isLocked = state.planningScheduleLinked && state.planningScheduleLock === fieldKey;
    element.innerHTML = `
      <span class="field-label-text">
        <span>${escapeHtml(label)}</span>
        ${isLocked ? `<button type="button" class="field-lock-button" data-planning-lock-toggle="true" aria-label="Stang av automatisk koppling for ${escapeHtml(label)}" title="Anpassa veckorna själv">🔒</button>` : ""}
      </span>
    `;
  }

function renderPlanningRecommendationLabels(seedItem) {
  const labels = [
    [elements.planningPresowRecommendation, seedItem?.schedule?.forsaddStart, seedItem?.schedule?.forsaddEnd],
    [elements.planningDirectRecommendation, seedItem?.schedule?.directStart, seedItem?.schedule?.directEnd],
    [elements.planningTransplantRecommendation, seedItem?.schedule?.transplantStart, seedItem?.schedule?.transplantEnd],
    [elements.planningHarvestRecommendation, seedItem?.schedule?.harvestStart, seedItem?.schedule?.harvestEnd],
  ];
  labels.forEach(([element, startWeek, endWeek]) => {
    if (element) {
      element.textContent = formatRecommendedRange(startWeek, endWeek);
    }
  });
}

function renderPlanningScheduleWarning(seedItem) {
  if (!elements.planningScheduleWarning) {
    return;
  }
  if (!seedItem) {
    elements.planningScheduleWarning.hidden = true;
    elements.planningScheduleWarning.textContent = "";
    return;
  }

  const warnings = [];
  const presowWeek = toNumber(elements.planningPresow?.value);
  const directWeek = toNumber(elements.planningDirect?.value);
  const transplantWeek = toNumber(elements.planningTransplant?.value);
  const harvestWeek = toNumber(elements.planningHarvest?.value);

  if (presowWeek && !isWeekWithinRange(presowWeek, seedItem.schedule.forsaddStart, seedItem.schedule.forsaddEnd)) {
    warnings.push(`Försådden ligger utanför rekommenderat intervall ${formatRecommendedRange(seedItem.schedule.forsaddStart, seedItem.schedule.forsaddEnd)}.`);
  }
  if (directWeek && !isWeekWithinRange(directWeek, seedItem.schedule.directStart, seedItem.schedule.directEnd)) {
    warnings.push(`Direktsådden ligger utanför rekommenderat intervall ${formatRecommendedRange(seedItem.schedule.directStart, seedItem.schedule.directEnd)}.`);
  }
  if (transplantWeek && !isWeekWithinRange(transplantWeek, seedItem.schedule.transplantStart, seedItem.schedule.transplantEnd)) {
    warnings.push(`Utplanteringen ligger utanför rekommenderat intervall ${formatRecommendedRange(seedItem.schedule.transplantStart, seedItem.schedule.transplantEnd)}.`);
  }
  if (harvestWeek && !isWeekWithinRange(harvestWeek, seedItem.schedule.harvestStart, seedItem.schedule.harvestEnd)) {
    warnings.push(`Skörden ligger utanför rekommenderat intervall ${formatRecommendedRange(seedItem.schedule.harvestStart, seedItem.schedule.harvestEnd)}.`);
  }

  elements.planningScheduleWarning.hidden = warnings.length === 0;
  elements.planningScheduleWarning.textContent = warnings.join(" ");
}

function isWeekWithinRange(week, startWeek, endWeek = startWeek) {
  if (!week || (!startWeek && !endWeek)) {
    return true;
  }
  const start = startWeek ?? endWeek;
  const end = endWeek ?? startWeek;
  return week >= Math.min(start, end) && week <= Math.max(start, end);
}

function renderPlanningMiniTimeline(seedItem) {
  if (!elements.planningMiniTimeline) {
    return;
  }
  if (!seedItem) {
    elements.planningMiniTimeline.innerHTML = "";
    return;
  }

  const rows = [
    {
      label: "Försådd",
      accent: ACTIVITY_META.forsadd.color,
      recommendedStart: seedItem.schedule.forsaddStart,
      recommendedEnd: seedItem.schedule.forsaddEnd,
      selectedWeek: toNumber(elements.planningPresow?.value),
    },
    {
      label: "Direktsådd",
      accent: ACTIVITY_META.direktsadd.color,
      recommendedStart: seedItem.schedule.directStart,
      recommendedEnd: seedItem.schedule.directEnd,
      selectedWeek: toNumber(elements.planningDirect?.value),
    },
    {
      label: "Utplantering",
      accent: ACTIVITY_META.utplantering.color,
      recommendedStart: seedItem.schedule.transplantStart,
      recommendedEnd: seedItem.schedule.transplantEnd,
      selectedWeek: toNumber(elements.planningTransplant?.value),
    },
    {
      label: "Skörd",
      accent: ACTIVITY_META.skord.color,
      recommendedStart: seedItem.schedule.harvestStart,
      recommendedEnd: seedItem.schedule.harvestEnd,
      selectedWeek: toNumber(elements.planningHarvest?.value),
    },
  ].filter((row) => row.recommendedStart || row.recommendedEnd || row.selectedWeek);

  elements.planningMiniTimeline.innerHTML = `
    <div class="planning-mini-timeline__weeks">
      <span class="planning-mini-timeline__weeks-spacer" aria-hidden="true"></span>
      ${Array.from({ length: 52 }, (_, index) => `<span class="planning-mini-timeline__week">${index + 1}</span>`).join("")}
    </div>
    <div class="planning-mini-timeline__rows">
      ${rows.map((row) => `
        <div class="planning-mini-timeline__row">
          <span class="planning-mini-timeline__label">${row.label}</span>
          <div class="planning-mini-timeline__track">
            ${row.recommendedStart || row.recommendedEnd ? `<div class="planning-mini-timeline__recommended" style="${getPlanningRangeStyle(row.recommendedStart, row.recommendedEnd)}; --accent:${row.accent}"></div>` : ""}
            ${row.selectedWeek ? `<div class="planning-mini-timeline__selected" style="${getPlanningWeekStyle(row.selectedWeek)}; --accent:${row.accent}"></div>` : ""}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function updatePlanningDialogLayout() {
  if (!elements.planningForm) {
    return;
  }
  const sectionsWithFields = [...state.sections]
    .sort((a, b) => getSectionDisplayName(a).localeCompare(getSectionDisplayName(b), "sv"))
    .map((section) => ({
      section,
      fields: state.fields.filter((field) => field.type === "bed" && field.sectionId === section.id),
    }))
    .filter((entry) => entry.fields.length);

  const columnsWidth = sectionsWithFields.reduce((sum, entry) => {
    const titleLength = getSectionDisplayName(entry.section).length;
    const familyLength = getSectionDisplayFamily(entry.section).length;
    const longestField = entry.fields.reduce((max, field) => Math.max(max, field.name.length), 0);
    const estimatedWidth = Math.max(titleLength + familyLength + 3, longestField) * 7.2 + 78;
    return sum + Math.max(170, Math.min(estimatedWidth, 280));
  }, 0);
  const gapsWidth = Math.max(sectionsWithFields.length - 1, 0) * 12;
  const targetWidth = Math.max(1280, Math.min(1560, Math.round(280 + 110 + columnsWidth + gapsWidth)));
  elements.planningForm.style.setProperty("--planning-dialog-width", `${targetWidth}px`);
}

function getPlanningRangeStyle(startWeek, endWeek = startWeek) {
  const start = (startWeek ?? endWeek ?? 1) - 1;
  const span = Math.max((endWeek ?? startWeek ?? 1) - (startWeek ?? endWeek ?? 1) + 1, 1);
  return `left: calc(${start} * (100% / 52)); width: calc(${span} * (100% / 52));`;
}

function getPlanningWeekStyle(week) {
  return `left: calc(${Math.max(week - 1, 0)} * (100% / 52));`;
}

function renderPlanningCapacity() {
  if (!elements.planningCapacity) {
    return;
  }
  const selectedIds = [...state.planningFields];
  if (selectedIds.length === 0) {
    elements.planningCapacity.textContent = "Vald bädd: välj en bädd.";
    renderPlanningSeedCount();
    renderPlanningRotationHint();
    return;
  }
  const selectedFields = selectedIds
    .map((fieldId) => state.fields.find((field) => field.id === fieldId))
    .filter(Boolean);
  const selectedLabel = selectedFields
    .map((field) => `${field.name} (${getSectionName(field.sectionId)})`)
    .join(", ");

  const totalArea = selectedIds.reduce((sum, fieldId) => sum + getFieldArea(fieldId), 0);
  const requestedArea = toNumber(elements.planningArea?.value) ?? 0;
  const remainingArea = getPlanningRemainingArea() ?? 0;
  const status = requestedArea > remainingArea + 0.0001 ? "Får inte plats ännu." : "Får plats.";
  elements.planningCapacity.textContent = `Vald bädd: ${selectedLabel}. Minst ${formatDecimalSv(remainingArea, 2)} m² ledigt under perioden av ${formatDecimalSv(totalArea, 2)} m². ${status}`;
  renderPlanningSeedCount();
  renderPlanningRotationHint();
}

function renderPlanningRotationHint() {
  if (!elements.planningRotationHint) {
    return;
  }
  const recommendation = getPlanningRotationRecommendation();
  if (!recommendation) {
    elements.planningRotationHint.textContent = "Växtföljd: välj en gröda för att få förslag.";
    elements.planningRotationHint.dataset.state = "idle";
    return;
  }
  elements.planningRotationHint.textContent = recommendation.message;
  elements.planningRotationHint.dataset.state = recommendation.state;
}

function getPlanningRotationRecommendation() {
  const seed = resolvePlanningSeed({ allowSingleVariety: true });
  if (!seed?.family) {
    return null;
  }
  const selectedField = getSelectedPlanningField();
  const selectedSection = selectedField ? state.sections.find((section) => section.id === selectedField.sectionId) : null;
  const familyKey = normalizeFamilyKey(seed.family);
  const previousYear = state.activeYear - 1;
  const previousPlacements = state.allCrops
    .filter((crop) => crop.endYear >= previousYear && crop.startYear <= previousYear)
    .filter((crop) => normalizeFamilyKey(getCropFamily(crop)) === familyKey)
    .flatMap((crop) => crop.fieldIds.map((fieldId) => state.fields.find((field) => field.id === fieldId)?.sectionId))
    .filter(Boolean);

  const uniquePreviousSections = [...new Set(previousPlacements)];
  const rotationSections = [...state.sections]
    .filter((section) => section.rotationEnabled)
    .sort((a, b) => (a.rotationOrder ?? Number.MAX_SAFE_INTEGER) - (b.rotationOrder ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, "sv"));

  if (!rotationSections.length) {
    return {
      state: "idle",
      message: "Växtföljd: inga skiften är markerade att ingå ännu.",
    };
  }

  if (!uniquePreviousSections.length) {
    return {
      state: selectedSection?.rotationEnabled === false ? "warn" : "ok",
      message: selectedSection?.rotationEnabled === false
        ? `Växtföljd: ${getSectionDisplayName(selectedSection)} ingår inte i växtföljden. Välj gärna ett roterande skifte för ${seed.family}.`
        : `Växtföljd: ingen tidigare placering hittades för ${seed.family}. Du kan starta i valfritt skifte som ingår.`,
    };
  }

  const previousSectionId = uniquePreviousSections[0];
  const previousSection = state.sections.find((section) => section.id === previousSectionId);
  const previousDisplayName = previousSection ? getSectionDisplayName(previousSection, previousYear) : "";
  const recommendedSection = findSectionByDisplayName(previousDisplayName, state.activeYear);
  if (!recommendedSection) {
    return {
      state: "idle",
      message: "Växtföljd: kunde inte matcha förra årets skifte mot årets namn.",
    };
  }

  if (!selectedSection) {
    return {
      state: "ok",
      message: `${seed.family} låg senast i ${previousDisplayName || "okänt skifte"} ${previousYear}. Välj ${getSectionDisplayName(recommendedSection)} ${state.activeYear}.`,
    };
  }

  if (selectedSection.rotationEnabled === false) {
    return {
      state: "warn",
      message: `Vald bädd ligger i ${getSectionDisplayName(selectedSection)}, som inte ingår i växtföljden. Välj ${getSectionDisplayName(recommendedSection)}.`,
    };
  }

  if (selectedSection.id !== recommendedSection.id) {
    return {
      state: "warn",
      message: `${seed.family} låg senast i ${previousDisplayName || "okänt skifte"} ${previousYear}. För växtföljd: välj ${getSectionDisplayName(recommendedSection)}. Vald bädd ligger i ${getSectionDisplayName(selectedSection)}.`,
    };
  }

  return {
    state: "ok",
    message: `Bra val. ${seed.family} fortsätter i ${getSectionDisplayName(selectedSection)} ${state.activeYear}.`,
  };
}

function getSelectedPlanningField() {
  const selectedFieldId = [...state.planningFields][0];
  return state.fields.find((field) => field.id === selectedFieldId) ?? null;
}

function getNextRotationSection(sectionId, rotationSections) {
  const sections = rotationSections?.length ? rotationSections : [...state.sections].filter((section) => section.rotationEnabled);
  const index = sections.findIndex((section) => section.id === sectionId);
  if (index === -1 || sections.length === 0) {
    return null;
  }
  return sections[(index + 1) % sections.length] ?? null;
}

function normalizeFamilyKey(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getCropFamily(crop) {
  return getSeedItemById(crop.seedId)?.family ?? "";
}

function renderToday() {
  const visibleEvents = getVisibleEvents();
  elements.taskList.innerHTML = "";

  visibleEvents.forEach((event) => {
    const card = document.createElement("article");
    card.className = "task-card";
    card.style.setProperty("--accent", ACTIVITY_META[event.type].color);
    card.classList.toggle("is-done", event.completed);
    const timingState = getEventTimingState(event);
    if (timingState) {
      card.classList.add(`is-${timingState}`);
    }

    const icon = document.createElement("div");
    icon.className = "task-icon";
    icon.innerHTML = getIconMarkup(ACTIVITY_META[event.type].icon);

    const body = document.createElement("div");
    body.className = "task-body";
    body.innerHTML = `
      <p class="task-title">${ACTIVITY_META[event.type].label}: ${event.title}</p>
      <p class="task-meta">Vecka ${event.week} · ${event.fieldIds.map(getFieldName).join(", ")}</p>
    `;
    const timingPill = document.createElement("span");
    timingPill.className = `task-timing-pill ${timingState ? `task-timing-pill--${timingState}` : ""}`;
    timingPill.textContent = getEventTimingLabel(event);
    body.appendChild(timingPill);

    const checkbox = document.createElement("input");
    checkbox.className = "task-check";
    checkbox.type = "checkbox";
    checkbox.checked = event.completed;
    checkbox.addEventListener("change", async () => {
      await handleEventCheckboxChange(event, checkbox.checked);
    });

    card.append(icon, body, checkbox);
    elements.taskList.appendChild(card);
  });

  if (visibleEvents.length === 0) {
    elements.taskList.innerHTML = `
      <article class="task-card">
        <div class="task-icon">${getIconMarkup("presow")}</div>
        <div class="task-body">
          <p class="task-title">Inga uppgifter i valt filter</p>
          <p class="task-meta">Välj fler bäddar eller visa alla uppgifter.</p>
        </div>
      </article>
    `;
  }

  const relevantEvents = state.events
    .filter((event) => isEventDueByCurrentWeek(event))
    .filter((event) => matchesFieldFilter(event, state.taskFields))
    .filter((event) => state.taskTypes.size === 0 || state.taskTypes.has(event.type));
  const relevantCompleted = relevantEvents.filter((event) => event.completed).length;
  const weeklyPercent = relevantEvents.length ? Math.round((relevantCompleted / relevantEvents.length) * 100) : 0;
  const overdueCount = relevantEvents
    .filter((event) => isEventOverdue(event))
    .filter((event) => matchesFieldFilter(event, state.taskFields))
    .filter((event) => state.taskTypes.size === 0 || state.taskTypes.has(event.type)).length;
  const focusItems = getTodayFocusItems();
  const overfilledBeds = state.fields
    .filter(isSchedulingField)
    .map((field) => ({ field, status: getFieldStatus(field.id, state.fieldWeek) }))
    .filter(({ status }) => status.overfilled)
    .sort((a, b) => b.status.used - a.status.used);
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (weeklyPercent / 100) * circumference;

  elements.statsGrid.innerHTML = `
    <article class="stats-card stats-card--progress">
      <div class="progress-ring" style="--progress-offset:${dashOffset.toFixed(2)}; --progress-color:${weeklyPercent >= 100 ? "#27885d" : "#33a26f"}">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle class="progress-ring__track" cx="60" cy="60" r="52"></circle>
          <circle class="progress-ring__value" cx="60" cy="60" r="52"></circle>
        </svg>
        <div class="progress-ring__label">
          <strong>${weeklyPercent}%</strong>
          <span>klart</span>
        </div>
      </div>
      <div class="stats-card__copy">
        <strong>${relevantCompleted} / ${relevantEvents.length || 0}</strong>
        <span>Veckans och försenade uppgifter slutförda</span>
      </div>
    </article>
    <article class="stats-card stats-card--warning">
      <strong>${overdueCount}</strong>
      <span>Försenade uppgifter</span>
    </article>
    <article class="stats-card">
      <strong>${relevantEvents.filter((event) => event.week === currentWeek).length}</strong>
      <span>Uppgifter denna vecka</span>
    </article>
    <article class="stats-card stats-card--focus">
      <strong>Veckans fokus</strong>
      <div class="stats-card__list">
        ${focusItems.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
    </article>
    <article class="stats-card stats-card--beds">
      <strong>${overfilledBeds.length ? "Överbelagda bäddar" : "Bäddläge"}</strong>
      <div class="stats-card__list">
        ${
          overfilledBeds.length
            ? overfilledBeds.slice(0, 3).map(({ field, status }) => `<span>${escapeHtml(field.name)} · ${Math.round((status.used / Math.max(getFieldArea(field.id), 0.1)) * 100)}%</span>`).join("")
            : `<span>Ingen bädd är överbelagd vecka ${state.fieldWeek}</span>`
        }
      </div>
    </article>
  `;
}

function getTodayFocusItems() {
  const overdue = getOutstandingEvents()
    .sort((a, b) => a.week - b.week)
    .slice(0, 2)
    .map((event) => `${ACTIVITY_META[event.type].label}: ${event.title}`);
  const current = state.events
    .filter((event) => !event.completed && event.week === currentWeek)
    .sort((a, b) => a.title.localeCompare(b.title, "sv"))
    .slice(0, 2)
    .map((event) => `Denna vecka: ${event.title}`);
  const overfilled = state.fields
    .filter(isSchedulingField)
    .map((field) => ({ field, status: getFieldStatus(field.id, state.fieldWeek) }))
    .filter(({ status }) => status.overfilled)
    .slice(0, 1)
    .map(({ field }) => `Se över ${field.name}, den är överbelagd`);
  const items = [...overdue, ...current, ...overfilled];
  return items.length ? items.slice(0, 4) : ["Allt ser lugnt ut just nu."];
}

function getTimelineWeeksForCrop(crop, view = state.timelineView) {
  if (view === "utilization") {
    const range = getCropOccupancyRangeForYear(crop);
    return range ? [range.startWeek, range.endWeek] : [];
  }
  const ranges = [];
  if (view === "presow") {
    const presowRange = getCropRangeForYear(crop, "forsaddStart", "forsaddEnd");
    const transplantRange = getCropRangeForYear(crop, "transplant", "transplant");
    if (presowRange) ranges.push(presowRange.startWeek, presowRange.endWeek);
    if (transplantRange) ranges.push(transplantRange.startWeek, transplantRange.endWeek);
    return ranges;
  }
  [["forsaddStart", "forsaddEnd"], ["directStart", "directEnd"], ["transplant", "transplant"], ["harvestStart", "harvestEnd"]]
    .forEach(([startKey, endKey]) => {
      const range = getCropRangeForYear(crop, startKey, endKey);
      if (range) {
        ranges.push(range.startWeek, range.endWeek);
      }
    });
  return ranges;
}

function getCropRangeForYear(crop, startKey, endKey) {
  const startWeek = crop.schedule?.[startKey];
  const endWeek = crop.schedule?.[endKey] ?? startWeek;
  if (!startWeek || !endWeek) {
    return null;
  }
  const rangeYear = inferCropEventYear(crop, startKey, startWeek);
  if (rangeYear !== state.activeYear) {
    return null;
  }
  return { startWeek, endWeek };
}

function getCropOccupancyRangeForYear(crop) {
  const range = getCropOccupancyRange(crop);
  if (!range.startWeek || !range.endWeek) {
    return null;
  }
  if (range.startYear === state.activeYear && range.endYear === state.activeYear) {
    return { startWeek: range.startWeek, endWeek: range.endWeek };
  }
  if (range.startYear < state.activeYear && range.endYear >= state.activeYear) {
    return { startWeek: 1, endWeek: range.endYear > state.activeYear ? 52 : range.endWeek };
  }
  if (range.startYear === state.activeYear && range.endYear > state.activeYear) {
    return { startWeek: range.startWeek, endWeek: 52 };
  }
  return null;
}

function renderTimeline() {
  const visibleCrops = getTimelineCrops();
  const bounds = getTimelineBounds(visibleCrops, state.timelineView);
  const weeks = [];
  for (let week = bounds.start; week <= bounds.end; week += 1) {
    weeks.push(week);
  }

  const viewLabels = {
    crops: "Kronologiskt per bädd och gröda",
    utilization: "Bäddar över säsongen",
    presow: "Det som finns i försådd eller väntar på försådd",
  };
  elements.timelineRange.textContent = "";
  elements.timelineWeeks.style.setProperty("--week-count", String(weeks.length));
  elements.timelineWeeks.innerHTML = weeks.map((week) => `<div class="timeline-week">${week}</div>`).join("");
  elements.timelineRows.innerHTML = "";

  if (state.timelineView === "utilization") {
    renderTimelineUtilization(visibleCrops, bounds);
    return;
  }

  if (state.timelineView === "presow") {
    renderPresowTimeline(visibleCrops, bounds);
    return;
  }

  renderCropTimeline(visibleCrops, bounds);
}

function renderCropTimeline(visibleCrops, bounds) {
  const groups = getTimelineGroups(visibleCrops);
  groups.forEach((group) => {
    elements.timelineRows.appendChild(createTimelineGroupHeading(group, `${group.crops.length} grödor planerade`, bounds));
    group.crops.forEach((crop) => {
      const displayField = group.kind === "field"
        ? group.field
        : state.fields.find((field) => crop.fieldIds?.includes(field.id)) ?? null;
      const row = document.createElement("article");
      row.className = "timeline-row";

      const meta = document.createElement("div");
      meta.className = "timeline-meta";
      const pendingCount = getOutstandingEventCountForCrop(crop.id);
      meta.innerHTML = `
        <div class="timeline-meta__top">
          <div class="timeline-meta__title">
            <strong>${escapeHtml(crop.title)}</strong>
          ${pendingCount ? `<span class="timeline-warning-badge" title="${pendingCount} försenade uppgift(er)">!</span>` : ""}
          </div>
        </div>
        <span>${formatArea(crop.area ?? 0)} m² · ${escapeHtml(getCropFamily(crop) || "Ingen familj")}</span>
      `;

        const track = document.createElement("div");
        track.className = "timeline-track";
        track.addEventListener("click", () => openDialog(crop.id));
        appendFrostOverlay(track, bounds.start, bounds.end);
        appendTodayLine(track, bounds.start);
        const presowRange = getCropRangeForYear(crop, "forsaddStart", "forsaddEnd");
        const directRange = getCropRangeForYear(crop, "directStart", "directEnd");
        const transplantRange = getCropRangeForYear(crop, "transplant", "transplant");
        const harvestRange = getCropRangeForYear(crop, "harvestStart", "harvestEnd");
        if (presowRange && state.timelineTypes.has("forsadd")) appendRange(track, presowRange.startWeek, presowRange.endWeek, bounds.start, ACTIVITY_META.forsadd.color, ACTIVITY_META.forsadd.label, {
          cropId: crop.id,
          startKey: "forsaddStart",
          endKey: "forsaddEnd",
          eventType: "forsadd",
        });
        if (directRange && state.timelineTypes.has("direktsadd")) appendRange(track, directRange.startWeek, directRange.endWeek, bounds.start, ACTIVITY_META.direktsadd.color, ACTIVITY_META.direktsadd.label, {
          cropId: crop.id,
          startKey: "directStart",
          endKey: "directEnd",
          eventType: "direktsadd",
        });
        if (transplantRange && state.timelineTypes.has("utplantering")) appendRange(track, transplantRange.startWeek, transplantRange.endWeek, bounds.start, ACTIVITY_META.utplantering.color, ACTIVITY_META.utplantering.label, {
          cropId: crop.id,
          startKey: "transplant",
          endKey: "transplant",
          eventType: "utplantering",
        });
        if (harvestRange && state.timelineTypes.has("skord")) appendRange(track, harvestRange.startWeek, harvestRange.endWeek, bounds.start, ACTIVITY_META.skord.color, ACTIVITY_META.skord.label, {
          cropId: crop.id,
          startKey: "harvestStart",
          endKey: "harvestEnd",
          eventType: "skord",
        });

      row.append(meta, track);
      elements.timelineRows.appendChild(row);
    });
  });

  if (elements.timelineRows.childElementCount === 0) {
    elements.timelineRows.innerHTML = `<div class="timeline-empty">Inga grödor i valt filter.</div>`;
  }
}

function renderTimelineUtilization(visibleCrops, bounds) {
  const groups = getTimelineGroups(visibleCrops).filter((group) => group.kind === "field");
  groups.forEach(({ field, crops }) => {
    const status = getFieldStatus(field.id);
    elements.timelineRows.appendChild(
      createTimelineGroupHeading(field, `${formatArea(status.used)} av ${formatArea(getFieldArea(field.id))} m² planerat`, bounds),
    );

    const row = document.createElement("article");
    row.className = "timeline-row timeline-row--utilization";

    const meta = document.createElement("div");
    meta.className = "timeline-meta";
    meta.innerHTML = `
      <strong>${escapeHtml(field.name)}</strong>
      <span>${getFieldTypeLabel(field.type)} · ${formatArea(getFieldArea(field.id))} m²</span>
      <span>${escapeHtml(status.statusText)}</span>
    `;

    const track = document.createElement("div");
    track.className = "timeline-track timeline-track--utilization";
    appendFrostOverlay(track, bounds.start, bounds.end);
    appendTodayLine(track, bounds.start);

    const lanes = [];
    crops
      .map((crop) => ({ crop, ...(getCropOccupancyRangeForYear(crop) ?? {}) }))
      .filter((item) => item.startWeek && item.endWeek)
      .sort((a, b) => a.startWeek - b.startWeek)
      .forEach((item) => {
        let laneIndex = lanes.findIndex((endWeek) => item.startWeek > endWeek);
        if (laneIndex === -1) {
          laneIndex = lanes.length;
          lanes.push(item.endWeek);
        } else {
          lanes[laneIndex] = item.endWeek;
        }
        appendUtilizationBlock(track, item.crop, item.startWeek, item.endWeek, bounds.start, laneIndex);
      });

    if (!crops.length) {
      const empty = document.createElement("div");
      empty.className = "timeline-empty-inline";
      empty.textContent = "Ingen planerad användning ännu.";
      track.appendChild(empty);
    }

    row.append(meta, track);
    elements.timelineRows.appendChild(row);
  });

  if (elements.timelineRows.childElementCount === 0) {
    elements.timelineRows.innerHTML = `<div class="timeline-empty">Inga bäddar i valt filter.</div>`;
  }
}

function renderPresowTimeline(visibleCrops, bounds) {
  const presowCrops = visibleCrops
    .filter((crop) => crop.schedule.forsaddStart)
    .sort((a, b) => a.title.localeCompare(b.title, "sv"));

  const groups = [
    {
      title: "I försådd nu",
      crops: presowCrops.filter((crop) => isCropInPresowNow(crop)),
    },
    {
      title: "Kommande försådd",
      crops: presowCrops.filter((crop) => !isCropInPresowNow(crop) && (crop.schedule.forsaddStart ?? 99) > currentWeek),
    },
    {
      title: "Redan passerad försådd",
      crops: presowCrops.filter((crop) => !isCropInPresowNow(crop) && (crop.schedule.forsaddEnd ?? 0) < currentWeek),
    },
  ].filter((group) => group.crops.length);

  groups.forEach((group) => {
    const heading = document.createElement("div");
    heading.className = "timeline-section-heading";
    heading.innerHTML = `<strong>${group.title}</strong><span>${group.crops.length} grödor</span>`;
    elements.timelineRows.appendChild(heading);

    group.crops.forEach((crop) => {
      const row = document.createElement("article");
      row.className = "timeline-row";

      const meta = document.createElement("div");
      meta.className = "timeline-meta";
      const pendingCount = getOutstandingEventCountForCrop(crop.id);
      meta.innerHTML = `
        <div class="timeline-meta__top">
          <div class="timeline-meta__title">
            <strong>${escapeHtml(crop.title)}</strong>
          ${pendingCount ? `<span class="timeline-warning-badge" title="${pendingCount} försenade uppgift(er)">!</span>` : ""}
          </div>
        </div>
        <span>Försådd vecka ${formatRange(crop.schedule.forsaddStart, crop.schedule.forsaddEnd)}</span>
      `;

      const track = document.createElement("div");
      track.className = "timeline-track";
      track.addEventListener("click", () => openDialog(crop.id));
      appendFrostOverlay(track, bounds.start, bounds.end);
      appendTodayLine(track, bounds.start);
      const presowRange = getCropRangeForYear(crop, "forsaddStart", "forsaddEnd");
      const transplantRange = getCropRangeForYear(crop, "transplant", "transplant");
      if (presowRange) appendRange(track, presowRange.startWeek, presowRange.endWeek, bounds.start, ACTIVITY_META.forsadd.color, ACTIVITY_META.forsadd.label, {
        cropId: crop.id,
        startKey: "forsaddStart",
        endKey: "forsaddEnd",
        eventType: "forsadd",
      });
      if (transplantRange) appendRange(track, transplantRange.startWeek, transplantRange.endWeek, bounds.start, "rgba(91, 145, 162, 0.45)", "Utplantering", {
        cropId: crop.id,
        startKey: "transplant",
        endKey: "transplant",
        eventType: "utplantering",
      });

      row.append(meta, track);
      elements.timelineRows.appendChild(row);
    });
  });

  if (elements.timelineRows.childElementCount === 0) {
    elements.timelineRows.innerHTML = `<div class="timeline-empty">Inga grödor med försådd i valt filter.</div>`;
  }
}

function getTimelineCrops() {
  return state.crops
    .filter((crop) => matchesFieldFilter(crop, state.timelineFields))
    .filter((crop) => state.timelineSectionFilter === "alla" || crop.fieldIds?.some((fieldId) => state.fields.find((field) => field.id === fieldId)?.sectionId === state.timelineSectionFilter))
    .filter((crop) => state.timelineFamilyFilter === "alla" || normalizeFamilyKey(getCropFamily(crop)) === normalizeFamilyKey(state.timelineFamilyFilter))
    .filter(matchesTimelineCompletionFilter)
    .sort((a, b) => {
      return a.title.localeCompare(b.title, "sv");
    });
}

function matchesTimelineCompletionFilter(crop) {
  if (state.timelineCompletionFilter === "alla") {
    return true;
  }
  const cropEvents = state.events.filter((event) => event.cropId === crop.id);
  if (state.timelineCompletionFilter === "completed") {
    return cropEvents.some((event) => event.completed);
  }
  if (state.timelineCompletionFilter === "pending") {
    return cropEvents.some((event) => !event.completed);
  }
  return true;
}

function getTimelineGroups(crops) {
  if (state.timelineGroupBy === "name") {
    return [{
      key: "name",
      label: "Namn",
      kind: "name",
      crops: [...crops].sort((a, b) => a.title.localeCompare(b.title, "sv")),
    }];
  }
  if (state.timelineGroupBy === "section") {
    return [...state.sections]
      .filter((section) => state.timelineSectionFilter === "alla" || section.id === state.timelineSectionFilter)
      .map((section) => ({
        key: section.id,
        label: section.name,
        kind: "section",
        section,
        crops: crops.filter((crop) => crop.fieldIds?.some((fieldId) => state.fields.find((field) => field.id === fieldId)?.sectionId === section.id)),
      }))
      .filter((group) => group.crops.length);
  }
  if (state.timelineGroupBy === "family") {
    return [...new Set(crops.map((crop) => getCropFamily(crop)).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "sv"))
      .map((family) => ({
        key: family,
        label: family,
        kind: "family",
        crops: crops.filter((crop) => normalizeFamilyKey(getCropFamily(crop)) === normalizeFamilyKey(family)),
      }))
      .filter((group) => group.crops.length);
  }
  return state.fields
    .filter(isSchedulingField)
    .filter((field) => state.timelineFields.size === 0 || state.timelineFields.has(field.id))
    .filter((field) => state.timelineSectionFilter === "alla" || field.sectionId === state.timelineSectionFilter)
    .map((field) => ({
      key: field.id,
      label: field.name,
      kind: "field",
      field,
      crops: crops.filter((crop) => crop.fieldIds?.includes(field.id)),
    }))
    .filter((group) => group.crops.length || state.timelineView === "utilization");
}

function createTimelineGroupHeading(field, summary, bounds) {
  if (field.kind && field.kind !== "field") {
    const heading = document.createElement("div");
    heading.className = "timeline-group-heading timeline-group-heading--generic";
    heading.innerHTML = `
      <div class="timeline-group-heading__top">
        <div class="timeline-group-heading__sticky">
          <div class="timeline-group-heading__info">
            <strong>${escapeHtml(field.label)}</strong>
          </div>
          <span class="timeline-group-heading__summary">${escapeHtml(summary)}</span>
        </div>
      </div>
    `;
    heading.appendChild(createTimelineWeekGuide(bounds));
    return heading;
  }
  const fieldItem = field.kind === "field" ? field.field : field;
  if (!fieldItem) {
    const heading = document.createElement("div");
    heading.className = "timeline-group-heading timeline-group-heading--generic";
    heading.innerHTML = `
      <div class="timeline-group-heading__top">
        <div class="timeline-group-heading__sticky">
          <div class="timeline-group-heading__info">
            <strong>${escapeHtml(field.label ?? "Bädd")}</strong>
          </div>
          <span class="timeline-group-heading__summary">${escapeHtml(summary)}</span>
        </div>
      </div>
    `;
    heading.appendChild(createTimelineWeekGuide(bounds));
    return heading;
  }
  const heading = document.createElement("div");
  heading.className = "timeline-group-heading";
  const sectionName = getSectionName(fieldItem.sectionId);
  heading.innerHTML = `
    <div class="timeline-group-heading__top">
      <div class="timeline-group-heading__sticky">
        <div class="timeline-group-heading__info">
          <strong>${escapeHtml(fieldItem.name)}</strong>
          ${getOutstandingEventCountForField(fieldItem.id) ? `<span class="timeline-warning-badge" title="${getOutstandingEventCountForField(fieldItem.id)} försenade uppgift(er) i ${escapeHtml(fieldItem.name)}">!</span>` : ""}
        </div>
        <span class="timeline-group-heading__summary">${escapeHtml(sectionName)} · ${escapeHtml(summary)}</span>
      </div>
    </div>
  `;
  if (state.timelineGroupBy === "field") {
    heading.appendChild(createTimelineOccupancyMini(fieldItem.id, bounds));
  }
  heading.appendChild(createTimelineWeekGuide(bounds));
  return heading;
}

function appendTodayLine(track, minWeek) {
  if (state.activeYear !== currentYear) {
    return;
  }
  const todayLine = document.createElement("div");
  todayLine.className = "timeline-today-line";
  todayLine.style.left = `${getTimelineTodayX(minWeek)}px`;
  track.appendChild(todayLine);
}

function appendFrostOverlay(track, minWeek, maxWeek = 52) {
  const frostWindow = getRenderableFrostWindow();
  if (!track || !frostWindow) {
    return;
  }
  const springEnd = Math.min(frostWindow.lastSpringWeek ?? 0, maxWeek);
  const autumnStart = Math.max(frostWindow.firstAutumnWeek ?? 99, minWeek);
  const springRiskStart = Math.max(frostWindow.springRiskStartWeek ?? springEnd + 1, minWeek);
  const springSolidEnd = Math.min(springEnd, springRiskStart - 1);
  if (springSolidEnd >= minWeek) {
    const spring = document.createElement("div");
    spring.className = "timeline-frost-zone timeline-frost-zone--spring";
    spring.style.left = "0";
    spring.style.width = `${Math.max(getTimelineWeekEndX(springSolidEnd, minWeek), 12)}px`;
    spring.title = `Historisk frostrisk fram till ungefär vecka ${frostWindow.lastSpringWeek}`;
    track.appendChild(spring);
  }
  appendFrostRiskBand(
    track,
    springRiskStart,
    Math.min(frostWindow.springRiskEndWeek ?? springEnd, maxWeek),
    minWeek,
    "spring",
    `Övergångszon för sista vårfrost, centrala 50 % av de senaste 10 åren (${frostWindow.sourceLabel})`,
  );
  const autumnRiskEnd = Math.min(frostWindow.autumnRiskEndWeek ?? autumnStart - 1, maxWeek);
  const autumnSolidStart = Math.max(autumnStart, autumnRiskEnd + 1);
  if (autumnSolidStart <= maxWeek) {
    const autumn = document.createElement("div");
    autumn.className = "timeline-frost-zone timeline-frost-zone--autumn";
    const autumnLeft = getTimelineWeekStartX(autumnSolidStart, minWeek);
    autumn.style.left = `${autumnLeft}px`;
    autumn.style.width = `calc(100% - ${autumnLeft}px)`;
    autumn.title = `Historisk frostrisk från ungefär vecka ${frostWindow.firstAutumnWeek}`;
    track.appendChild(autumn);
  }
  appendFrostRiskBand(
    track,
    Math.max(frostWindow.autumnRiskStartWeek ?? autumnStart, minWeek),
    autumnRiskEnd,
    minWeek,
    "autumn",
    `Övergångszon för första höstfrost, centrala 50 % av de senaste 10 åren (${frostWindow.sourceLabel})`,
  );
}

function appendFrostRiskBand(track, startWeek, endWeek, minWeek, season, title) {
  if (!track || !startWeek || !endWeek || endWeek < startWeek) {
    return;
  }
  const band = document.createElement("div");
  band.className = `timeline-frost-band timeline-frost-band--${season}`;
  band.style.left = `${getTimelineWeekStartX(startWeek, minWeek)}px`;
  band.style.width = `${Math.max(getTimelineWeekEndX(endWeek, minWeek) - getTimelineWeekStartX(startWeek, minWeek), 12)}px`;
  band.title = title;
  track.appendChild(band);
}

function renderSeedTable() {
  const isPersonalPage = state.page === "egnafroer";
  const tableBody = isPersonalPage ? elements.seedTableBodySecondary : elements.seedTableBody;
  const activeSearchInput = isPersonalPage ? elements.seedSearchInputSecondary : elements.seedSearchInput;
  const inactiveSearchInput = isPersonalPage ? elements.seedSearchInput : elements.seedSearchInputSecondary;
  const source = isPersonalPage ? "personal" : "global";
  const table = tableBody?.closest("table");
  const headRow = table?.querySelector("thead tr");
  if (headRow) {
    headRow.innerHTML = SEED_COLUMNS.map((column) => `
      <th data-key="${column.key}">
        <button class="table-sort-button" type="button" data-key="${column.key}">
          ${column.label}
          ${state.seedSort.key === column.key ? `<span>${state.seedSort.direction === "asc" ? "↑" : "↓"}</span>` : ""}
        </button>
      </th>
    `).join("");
    [...headRow.querySelectorAll(".table-sort-button")].forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.key;
        if (state.seedSort.key === key) {
          state.seedSort.direction = state.seedSort.direction === "asc" ? "desc" : "asc";
        } else {
          state.seedSort.key = key;
          state.seedSort.direction = "asc";
        }
        renderSeedTable();
      });
    });
  }

  if (elements.seedTableBody) {
    elements.seedTableBody.innerHTML = "";
  }
  if (elements.seedTableBodySecondary) {
    elements.seedTableBodySecondary.innerHTML = "";
  }
  if (activeSearchInput && activeSearchInput.value !== state.seedSearch) {
    activeSearchInput.value = state.seedSearch;
  }
  if (inactiveSearchInput && inactiveSearchInput.value !== "") {
    inactiveSearchInput.value = "";
  }

  getSeedItemsForView(source)
    .filter((item) => matchesSeedSearch(normalizeSeedItem(item), state.seedSearch))
    .sort((left, right) => compareSeedItems(normalizeSeedItem(left), normalizeSeedItem(right), state.seedSort.key, state.seedSort.direction))
    .forEach((item) => {
    const row = document.createElement("tr");
    row.className = "seed-row";
    row.innerHTML = SEED_COLUMNS.map((column) => {
      const value = escapeHtml(String(getSeedValue(item, column.key) ?? ""));
      const keyAttr = `data-key="${column.key}"`;
      if (column.key === "notes") {
        return `<td class="seed-cell seed-cell--notes" ${keyAttr} title="${value}">${value || "–"}</td>`;
      }
      if (column.key.endsWith("Start") || column.key.endsWith("End") || column.key === "transplant") {
        return `<td class="seed-cell seed-cell--week" ${keyAttr}>${value ? `v ${value}` : "–"}</td>`;
      }
      if (column.key === "harvestInterval") {
        return `<td class="seed-cell" ${keyAttr}>${value ? `${value} v` : "–"}</td>`;
      }
      return `<td class="seed-cell" ${keyAttr} title="${value}">${value || "–"}</td>`;
    }).join("");
    row.addEventListener("click", () => openSeedDialog(item.id, source));

    tableBody?.appendChild(row);
  });
}

function matchesSeedSearch(item, query) {
  if (!query) {
    return true;
  }
  const haystack = [
    item.family,
    item.latinFamily,
    item.crop,
    item.method,
    item.variety,
    item.cropSort,
    item.notes,
    item.field,
    item.spacing,
    item.rowSpacing,
    item.cultureTime,
  ]
    .map((value) => String(value ?? "").toLowerCase())
    .join(" ");
  return haystack.includes(query);
}

function compareSeedItems(left, right, key, direction) {
  const multiplier = direction === "desc" ? -1 : 1;
  const leftValue = getSeedValue(left, key);
  const rightValue = getSeedValue(right, key);
  const leftNumber = toNumber(leftValue);
  const rightNumber = toNumber(rightValue);
  if (leftNumber != null || rightNumber != null) {
    return ((leftNumber ?? Number.NEGATIVE_INFINITY) - (rightNumber ?? Number.NEGATIVE_INFINITY)) * multiplier;
  }
  return String(leftValue ?? "").localeCompare(String(rightValue ?? ""), "sv", { numeric: true, sensitivity: "base" }) * multiplier;
}

function renderFields() {
  const zoom = state.fieldZoom;
  const canvasMetrics = getFieldCanvasMetrics();
  state.fieldCanvasMetrics = canvasMetrics;
  elements.fieldMapCanvas.style.width = `${Math.round(canvasMetrics.width * zoom)}px`;
  elements.fieldMapCanvas.style.height = `${Math.round(canvasMetrics.height * zoom)}px`;
  elements.fieldMapCanvas.style.setProperty("--field-zoom", String(zoom));
  elements.fieldMapCanvas.innerHTML = "";
  elements.fieldList.innerHTML = "";
  const sectionColors = getSectionColorMap();

  state.fields.forEach((field) => {
    const fieldStatus = getFieldStatus(field.id, state.fieldWeek);
    const footprint = getFieldFootprint(field);
    const plotWidth = footprint.width * zoom;
    const plotHeight = footprint.height * zoom;
    const plot = document.createElement("article");
    plot.className = `field-plot field-plot--${field.type}`;
    if (fieldStatus.overfilled) {
      plot.classList.add("is-overfilled");
    }
    if (fieldStatus.activeCrops.length) {
      plot.classList.add("is-active");
    }
    plot.dataset.fieldId = field.id;
    plot.dataset.label = field.name;
    plot.title = `${field.name} · ${field.type === "bed" ? getSectionName(field.sectionId) : "Kartobjekt"} · ${fieldStatus.statusText}`;
    plot.style.left = `${Math.round((field.x + canvasMetrics.originX) * zoom)}px`;
    plot.style.top = `${Math.round((field.y + canvasMetrics.originY) * zoom)}px`;
    plot.style.width = `${Math.round(plotWidth)}px`;
    plot.style.height = `${Math.round(plotHeight)}px`;
    plot.style.zIndex = String(getFieldLayer(field.type));
    plot.style.setProperty("--occupancy", `${fieldStatus.percent.toFixed(2)}%`);
    plot.style.setProperty("--field-fill", getFieldFillColor(field, fieldStatus));
    plot.style.setProperty("--section-color", sectionColors.get(field.sectionId) ?? "#9bb07d");
    plot.classList.toggle("is-horizontal", plotWidth >= plotHeight);
    plot.classList.toggle("is-vertical", plotHeight > plotWidth);
    const labelStyle = field.type === "bed"
      ? getFieldLabelStyle(field.name, plotWidth, plotHeight, plotHeight > plotWidth)
      : "";
    const treeMarkup = field.type === "tree"
      ? `
        <div class="field-tree-art" aria-hidden="true">
          <span class="field-tree-art__canopy field-tree-art__canopy--outer"></span>
          <span class="field-tree-art__canopy field-tree-art__canopy--left"></span>
          <span class="field-tree-art__canopy field-tree-art__canopy--right"></span>
          <span class="field-tree-art__canopy field-tree-art__canopy--top"></span>
          <span class="field-tree-art__canopy field-tree-art__canopy--bottom"></span>
          <span class="field-tree-art__core"></span>
          <span class="field-tree-art__trunk"></span>
        </div>
      `
      : "";
    plot.innerHTML = `
      <div class="field-plot__frame">
        <div class="field-plot__fill"></div>
      </div>
      ${treeMarkup}
      ${field.type === "bed" ? `<span class="field-plot__section-dot" aria-hidden="true"></span>` : ""}
      ${field.type === "bed" ? `<span class="field-plot__label ${plotHeight > plotWidth ? "field-plot__label--vertical" : ""}" style="${labelStyle}">${escapeHtml(field.name)}</span>` : ""}
      ${field.type !== "bed" ? `<span class="field-plot__resize-handle" aria-hidden="true"></span>` : ""}
    `;
    enableFieldDrag(plot, field);
    if (field.type !== "bed") {
      enableFieldResize(plot, field);
    }
    plot.addEventListener("click", () => {
      if (state.suppressFieldOpenId === field.id) {
        state.suppressFieldOpenId = null;
        return;
      }
      openFieldInfoDialog(field.id);
    });
    elements.fieldMapCanvas.appendChild(plot);

  });

  [...state.sections]
    .sort((a, b) => getSectionDisplayName(a).localeCompare(getSectionDisplayName(b), "sv"))
    .forEach((section) => {
    const sectionFields = state.fields
      .filter((field) => field.sectionId === section.id && isSchedulingField(field))
      .sort((a, b) => a.name.localeCompare(b.name, "sv"));
    if (typeof state.sectionCollapse[section.id] !== "boolean") {
      state.sectionCollapse[section.id] = true;
    }
    const isCollapsed = state.sectionCollapse[section.id];
    const sectionFamily = getSectionDisplayFamily(section);
    const sectionCard = document.createElement("section");
    sectionCard.className = "field-section-card";
    sectionCard.classList.toggle("is-collapsed", isCollapsed);
    sectionCard.innerHTML = `
      <div class="field-section-card__header">
        <button class="section-toggle" type="button" aria-expanded="${isCollapsed ? "false" : "true"}">
          <span class="field-list-item__top">
            <span class="section-dot" style="background:${sectionColors.get(section.id) ?? "#9bb07d"}"></span>
            <strong>${escapeHtml(getSectionDisplayName(section))}${sectionFamily ? ` · ${escapeHtml(sectionFamily)}` : ""}</strong>
            <span class="section-toggle__chevron" aria-hidden="true">${isCollapsed ? "▸" : "▾"}</span>
          </span>
          <span class="section-toggle__meta">${sectionFields.length} bäddar · ${getSectionRotationSummary(section)}</span>
        </button>
        <button class="button-secondary section-edit" type="button">Redigera</button>
        <button class="button-secondary section-delete" type="button">Ta bort</button>
      </div>
      <div class="field-section-card__list" ${isCollapsed ? "hidden" : ""}></div>
    `;
    sectionCard.querySelector(".section-toggle")?.addEventListener("click", () => {
      state.sectionCollapse[section.id] = !state.sectionCollapse[section.id];
      renderFields();
    });
    sectionCard.querySelector(".section-edit")?.addEventListener("click", () => openSectionDialog(section.id));
    sectionCard.querySelector(".section-delete")?.addEventListener("click", () => {
      openConfirmDialog({
        title: `Ta bort ${getSectionDisplayName(section)}`,
        message: `Skiftet ${getSectionDisplayName(section)} och alla bäddar i skiftet tas bort. Vill du fortsätta?`,
        confirmText: "Ta bort skifte",
        onConfirm: () => removeSection(section.id),
      });
    });
    const sectionList = sectionCard.querySelector(".field-section-card__list");

    if (!sectionFields.length) {
      const empty = document.createElement("p");
      empty.className = "section-caption";
      empty.textContent = "Inga bäddar i skiftet ännu.";
      sectionList?.appendChild(empty);
    }

    sectionFields.forEach((field) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "field-list-item";
      item.innerHTML = `
        <div class="field-list-item__top">
          <span class="section-dot" style="background:${sectionColors.get(section.id) ?? "#9bb07d"}"></span>
          <strong>${escapeHtml(field.name)}</strong>
        </div>
      `;
      item.addEventListener("click", () => openFieldInfoDialog(field.id));
      sectionList?.appendChild(item);
    });
      elements.fieldList.appendChild(sectionCard);
    });
}

function renderFieldZoom() {
  if (!elements.fieldMapCanvas || !elements.fieldZoomLabel) {
    return;
  }
  elements.fieldZoomLabel.textContent = `${Math.round(state.fieldZoom * 100)}%`;
}

function getFieldLabelStyle(name, plotWidth, plotHeight, isVertical = false) {
  const label = String(name ?? "").trim() || "Bädd";
  const majorAxis = Math.max((isVertical ? plotHeight : plotWidth) - 4, 12);
  const minorAxis = Math.max((isVertical ? plotWidth : plotHeight) - 4, 12);
  const preferredFontSize = Math.max(8, Math.min(14, minorAxis * 0.72));
  const minPaddingX = 0;
  const maxPaddingX = Math.min(6, Math.max(0, (majorAxis - (label.length * preferredFontSize * 0.52)) / 2));
  const paddingX = Math.max(minPaddingX, maxPaddingX);
  const paddingY = preferredFontSize > 10 ? 1 : 0;
  const availableTextWidth = Math.max(majorAxis - (paddingX * 2), 10);
  const fittedFontSize = Math.max(8, Math.min(preferredFontSize, availableTextWidth / Math.max(label.length * 0.52, 1.6)));
  const fontSize = fittedFontSize;
  return `--field-label-size:${fontSize.toFixed(2)}px;--field-label-max:${majorAxis.toFixed(2)}px;--field-label-pad-y:${paddingY.toFixed(2)}px;--field-label-pad-x:${paddingX.toFixed(2)}px;`;
}

function renderFieldTimeLabel() {
  if (elements.fieldTimeSlider) {
    elements.fieldTimeSlider.value = String(state.fieldWeek);
  }
  if (elements.fieldTimeLabel) {
    elements.fieldTimeLabel.textContent = `Beläggning vecka ${state.fieldWeek}`;
  }
}

function enableFieldMapPan() {
  const map = elements.fieldMap;
  if (!map) {
    return;
  }
  map.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".field-plot")) {
      return;
    }
    state.panMap = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: map.scrollLeft,
      scrollTop: map.scrollTop,
    };
    map.classList.add("is-panning");
    map.setPointerCapture(event.pointerId);
  });

  map.addEventListener("pointermove", (event) => {
    if (!state.panMap || state.panMap.pointerId !== event.pointerId) {
      return;
    }
    map.scrollLeft = state.panMap.scrollLeft - (event.clientX - state.panMap.startX);
    map.scrollTop = state.panMap.scrollTop - (event.clientY - state.panMap.startY);
  });

  const stopPan = (event) => {
    if (!state.panMap || state.panMap.pointerId !== event.pointerId) {
      return;
    }
    map.classList.remove("is-panning");
    map.releasePointerCapture(event.pointerId);
    state.panMap = null;
  };

  map.addEventListener("pointerup", stopPan);
  map.addEventListener("pointercancel", stopPan);
  map.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaX) > 0) {
      map.scrollLeft += event.deltaX;
      event.preventDefault();
      return;
    }
    if (event.shiftKey && Math.abs(event.deltaY) > 0) {
      map.scrollLeft += event.deltaY;
      event.preventDefault();
    }
  }, { passive: false });
}

function renderFieldNameOptions(select, type, currentValue = "") {
  if (!select || select.tagName !== "SELECT") {
    return;
  }
  const generated = [];
  const max = type === "greenhouse" ? 8 : type === "path" ? 12 : type === "tree" ? 20 : type === "house" ? 12 : type === "fence" ? 12 : type === "wall" ? 12 : type === "hedge" ? 12 : 24;
  const prefix = type === "greenhouse" ? "Växthus" : type === "path" ? "Gång" : type === "tree" ? "Träd" : type === "house" ? "Hus" : type === "fence" ? "Staket" : type === "wall" ? "Mur" : type === "hedge" ? "Häck" : "Bädd";
  for (let index = 1; index <= max; index += 1) {
    generated.push(`${prefix} ${index}`);
  }

  const existing = state.fields
    .filter((field) => field.type === type)
    .map((field) => field.name);

  const options = [...new Set([currentValue, ...existing, ...generated].filter(Boolean))];
  select.innerHTML = options
    .map((name) => `<option value="${escapeHtml(name)}" ${name === currentValue ? "selected" : ""}>${escapeHtml(name)}</option>`)
    .join("");

  if (!options.includes(currentValue) && options[0]) {
    select.value = options[0];
  }
}

function generateFieldNameSuggestion(type, sectionId = null) {
  const max = type === "greenhouse" ? 8 : type === "path" ? 12 : type === "tree" ? 20 : type === "house" ? 12 : type === "fence" ? 12 : type === "wall" ? 12 : type === "hedge" ? 12 : 24;
  const prefix = type === "greenhouse" ? "Växthus" : type === "path" ? "Gång" : type === "tree" ? "Träd" : type === "house" ? "Hus" : type === "fence" ? "Staket" : type === "wall" ? "Mur" : type === "hedge" ? "Häck" : "Bädd";
  const names = state.fields
    .filter((field) => field.type === type)
    .filter((field) => type !== "bed" || !sectionId || field.sectionId === sectionId)
    .map((field) => field.name.toLowerCase());
  for (let index = 1; index <= max; index += 1) {
    const suggestion = `${prefix} ${index}`;
    if (!names.includes(suggestion.toLowerCase())) {
      return suggestion;
    }
  }
  return `${prefix} ${max + 1}`;
}

function renderFieldSectionChips() {
  if (!elements.fieldSectionChips) {
    return;
  }
  if (!state.pendingFieldSectionId) {
    state.pendingFieldSectionId = state.sections[0]?.id ?? null;
  }
  elements.fieldSectionChips.innerHTML = "";
  [...state.sections]
    .sort((a, b) => getSectionDisplayName(a).localeCompare(getSectionDisplayName(b), "sv"))
    .forEach((section) => {
    const family = getSectionDisplayFamily(section);
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip field-section-chip";
    chip.innerHTML = `
      <span>${escapeHtml(getSectionDisplayName(section))}</span>
      <small>${family ? escapeHtml(family) : "Ingen växtfamilj"}</small>
    `;
    chip.classList.toggle("is-active", state.pendingFieldSectionId === section.id);
    chip.addEventListener("click", () => {
      state.pendingFieldSectionId = section.id;
      if (elements.fieldType?.value === "bed" && elements.fieldName) {
        elements.fieldName.value = generateFieldNameSuggestion("bed", section.id);
      }
      renderFieldSectionChips();
    });
      elements.fieldSectionChips.appendChild(chip);
    });
}

function openSectionDialog(sectionId = null) {
  state.activeSectionId = sectionId;
  state.sectionFamilyMenuSuppressedUntil = 0;
  const section = state.sections.find((item) => item.id === sectionId);
  elements.sectionDialogForm?.reset();
  if (elements.sectionFamilyOptions) {
    elements.sectionFamilyOptions.innerHTML = "";
    hideSectionFamilyOptions();
  }
  if (elements.sectionName) {
    elements.sectionName.value = section?.name ?? "";
  }
  if (elements.sectionDescription) {
    elements.sectionDescription.value = section?.description ?? "";
  }
  if (elements.sectionFamily) {
    elements.sectionFamily.value = section?.family ?? "";
  }
  if (elements.sectionRotationEnabled) {
    elements.sectionRotationEnabled.checked = section?.rotationEnabled !== false;
  }
  if (elements.sectionRotationOrder) {
    elements.sectionRotationOrder.value = section?.rotationOrder ?? "1";
  }
  updateSectionRotationFieldState();
  const title = elements.sectionDialog?.querySelector("h3");
  if (title) {
    title.textContent = section ? `Redigera ${getSectionDisplayName(section)}` : "Nytt skifte";
  }
  showDialog(elements.sectionDialog);
}

function updateSectionRotationFieldState() {
  if (!elements.sectionRotationOrder) {
    return;
  }
  const enabled = elements.sectionRotationEnabled?.checked ?? false;
  elements.sectionRotationOrder.disabled = !enabled;
  if (enabled && !String(elements.sectionRotationOrder.value ?? "").trim()) {
    elements.sectionRotationOrder.value = "1";
  }
}

function openFieldCreationDialog(sectionId = state.pendingFieldSectionId ?? null) {
  renderFieldSectionChips();
  elements.fieldDialogForm?.reset();
  if (sectionId) {
    state.pendingFieldSectionId = sectionId;
    renderFieldSectionChips();
  }
  if (elements.fieldType) {
    elements.fieldType.value = "bed";
  }
  if (elements.fieldCount) {
    elements.fieldCount.value = "1";
  }
  if (elements.fieldName) {
    elements.fieldName.value = generateFieldNameSuggestion("bed", state.pendingFieldSectionId);
  }
  updateFieldDialogTypeState();
  showDialog(elements.fieldDialog);
}

function updateFieldDialogTypeState() {
  const type = elements.fieldType?.value ?? "bed";
  const isBed = type === "bed";
  if (elements.fieldCountWrap) {
    elements.fieldCountWrap.hidden = !isBed;
  }
  if (elements.fieldCount && !isBed) {
    elements.fieldCount.value = "1";
  }
}

function updateFieldZoom(delta) {
  setFieldZoom(state.fieldZoom + delta);
}

function setFieldZoom(value) {
  state.fieldZoom = Math.min(Math.max(Number(value.toFixed(2)), 0.05), 2.2);
  renderFields();
  renderFieldZoom();
}

function getFieldCanvasMetrics(extraFields = []) {
  const map = elements.fieldMap;
  const viewportWidth = map ? Math.ceil(map.clientWidth / Math.max(state.fieldZoom, 0.01)) : FIELD_CANVAS_WIDTH;
  const viewportHeight = map ? Math.ceil(map.clientHeight / Math.max(state.fieldZoom, 0.01)) : FIELD_CANVAS_HEIGHT;
  const bounds = getFieldBounds([...state.fields, ...extraFields]) ?? {
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
  };
  const minX = Math.min(-FIELD_CANVAS_PADDING_PX, bounds.minX - 160);
  const minY = Math.min(-FIELD_CANVAS_PADDING_PX, bounds.minY - 160);
  const maxX = Math.max(FIELD_CANVAS_WIDTH, bounds.maxX + FIELD_CANVAS_PADDING_PX, viewportWidth - minX + 120);
  const maxY = Math.max(FIELD_CANVAS_HEIGHT, bounds.maxY + FIELD_CANVAS_PADDING_PX, viewportHeight - minY + 120);
  return {
    minX,
    minY,
    maxX,
    maxY,
    originX: -minX,
    originY: -minY,
    width: ceilToGridPx(maxX - minX),
    height: ceilToGridPx(maxY - minY),
  };
}

function getFieldBounds(fields = state.fields) {
  if (!fields.length) {
    return null;
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  fields.forEach((field) => {
    const footprint = getFieldFootprint(field);
    minX = Math.min(minX, field.x ?? 0);
    minY = Math.min(minY, field.y ?? 0);
    maxX = Math.max(maxX, (field.x ?? 0) + footprint.width);
    maxY = Math.max(maxY, (field.y ?? 0) + footprint.height);
  });

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function focusFieldMapOnGarden() {
  const map = elements.fieldMap;
  if (!map || !state.fields.length) {
    return;
  }

  const bounds = getFieldBounds();
  if (!bounds) {
    return;
  }

  const padding = 72;
  const targetZoom = Math.min(
    2.2,
    Math.max(
      0.05,
      Math.min(
        map.clientWidth / Math.max(bounds.width + padding * 2, 1),
        map.clientHeight / Math.max(bounds.height + padding * 2, 1),
      ),
    ),
  );

  state.fieldZoom = Number(targetZoom.toFixed(2));
  renderFields();
  renderFieldZoom();
  const metrics = state.fieldCanvasMetrics ?? getFieldCanvasMetrics();

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  map.scrollLeft = Math.max((centerX + metrics.originX) * state.fieldZoom - map.clientWidth / 2, 0);
  map.scrollTop = Math.max((centerY + metrics.originY) * state.fieldZoom - map.clientHeight / 2, 0);
  map.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function handleFieldSubmit(event) {
  event.preventDefault();
  const width = toNumber(elements.fieldWidth?.value);
  const length = toNumber(elements.fieldLength?.value);
  const type = elements.fieldType?.value ?? "bed";
  const count = Math.max(1, Math.round(toNumber(elements.fieldCount?.value) ?? 1));
  if (!elements.fieldName?.value.trim() || !width || !length || (type === "bed" && !state.pendingFieldSectionId)) {
    return;
  }

  const baseName = elements.fieldName.value.trim();
  const names = type === "bed" && count > 1
    ? buildSequentialFieldNames(baseName, count, type, state.pendingFieldSectionId)
    : [baseName];
  const placements = type === "bed" && count > 1
    ? getSequentialBedPlacements({ width, length, count })
    : [findAvailableFieldPlacement({ width, length, rotation: 0 })];

  for (let index = 0; index < placements.length; index += 1) {
    const placement = placements[index];
    const field = {
      id: `field-${Date.now()}-${index}`,
      name: names[index] ?? `${baseName} ${index + 1}`,
      type,
      description: "",
      width,
      length,
      sectionId: type === "bed" ? state.pendingFieldSectionId : null,
      x: placement.x,
      y: placement.y,
      rotation: 0,
    };
    await putRecord(DB_NAMES.cultivation, "fields", field);
  }
  elements.fieldDialogForm?.reset();
  closeDialog(elements.fieldDialog);
  await loadState();
  renderAll();
}

function openFieldInfoDialog(fieldId) {
  const field = state.fields.find((item) => item.id === fieldId);
  if (!field || !elements.fieldInfoDialog) {
    return;
  }
  state.activeFieldId = fieldId;
  elements.fieldInfoTitle.textContent = field.name;
  elements.fieldInfoName.value = field.name;
  elements.fieldInfoType.value = field.type;
  renderFieldInfoDimensionInputs(field);
  elements.fieldInfoSection.textContent = `${field.type === "bed" ? getSectionName(field.sectionId) : "Kartobjekt"} · ${formatArea(getFieldArea(field.id))} m²`;
  elements.fieldInfoStatus.textContent = getFieldStatus(field.id, state.fieldWeek).statusText;
  showDialog(elements.fieldInfoDialog);
}

function getFieldAxisDimensions(field) {
  if ((field.rotation ?? 0) % 180 === 0) {
    return {
      axisX: field.width ?? "",
      axisY: field.length ?? "",
    };
  }
  return {
    axisX: field.length ?? "",
    axisY: field.width ?? "",
  };
}

function renderFieldInfoDimensionInputs(field) {
  if (!elements.fieldInfoWidth || !elements.fieldInfoLength) {
    return;
  }
  const { axisX, axisY } = getFieldAxisDimensions(field);
  elements.fieldInfoWidth.value = axisX ?? "";
  elements.fieldInfoLength.value = axisY ?? "";
}

function getCenteredFieldPlacement(fieldLike) {
  const map = elements.fieldMap;
  const footprint = getFieldFootprint(fieldLike);
  if (!map) {
    return { x: snapToGridPx(80), y: snapToGridPx(80) };
  }
  const currentMetrics = state.fieldCanvasMetrics ?? getFieldCanvasMetrics();
  const centerX = ((map.scrollLeft + map.clientWidth / 2) / state.fieldZoom) - currentMetrics.originX;
  const centerY = ((map.scrollTop + map.clientHeight / 2) / state.fieldZoom) - currentMetrics.originY;
  const canvasMetrics = getFieldCanvasMetrics([{
    ...fieldLike,
    x: centerX - footprint.width / 2,
    y: centerY - footprint.height / 2,
  }]);
  return {
    x: snapToGridPx(Math.min(Math.max(centerX - footprint.width / 2, canvasMetrics.minX + 8), canvasMetrics.maxX - footprint.width - 8)),
    y: snapToGridPx(Math.min(Math.max(centerY - footprint.height / 2, canvasMetrics.minY + 8), canvasMetrics.maxY - footprint.height - 8)),
  };
}

function ensureFieldCanvasSize(extraFields = []) {
  if (!elements.fieldMapCanvas) {
    return;
  }
  const canvasMetrics = getFieldCanvasMetrics(extraFields);
  state.fieldCanvasMetrics = canvasMetrics;
  elements.fieldMapCanvas.style.width = `${Math.round(canvasMetrics.width * state.fieldZoom)}px`;
  elements.fieldMapCanvas.style.height = `${Math.round(canvasMetrics.height * state.fieldZoom)}px`;
}

function rectanglesOverlap(left, right, padding = 18) {
  return !(
    left.x + left.width + padding <= right.x ||
    right.x + right.width + padding <= left.x ||
    left.y + left.height + padding <= right.y ||
    right.y + right.height + padding <= left.y
  );
}

function canPlaceFieldAt(fieldLike, x, y) {
  const footprint = getFieldFootprint(fieldLike);
  const candidate = { x, y, width: footprint.width, height: footprint.height };
  return state.fields.every((field) => {
    const other = getFieldFootprint(field);
    return !rectanglesOverlap(candidate, {
      x: field.x ?? 0,
      y: field.y ?? 0,
      width: other.width,
      height: other.height,
    });
  });
}

function findAvailableFieldPlacement(fieldLike) {
  const preferred = getCenteredFieldPlacement(fieldLike);
  const footprint = getFieldFootprint(fieldLike);
  const canvasMetrics = getFieldCanvasMetrics([{
    ...fieldLike,
    x: preferred.x,
    y: preferred.y,
  }]);
  const step = FIELD_GRID_PX;
  const maxRadius = 240;

  for (let radius = 0; radius <= maxRadius; radius += 1) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
      for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
        if (Math.max(Math.abs(offsetX), Math.abs(offsetY)) !== radius) {
          continue;
        }
        const x = snapToGridPx(Math.max(preferred.x + offsetX * step, canvasMetrics.minX + 8));
        const y = snapToGridPx(Math.max(preferred.y + offsetY * step, canvasMetrics.minY + 8));
        if (x + footprint.width > canvasMetrics.maxX - 8 || y + footprint.height > canvasMetrics.maxY - 8) {
          continue;
        }
        if (canPlaceFieldAt(fieldLike, x, y)) {
          return { x, y };
        }
      }
    }
  }

  const bounds = getFieldBounds();
  if (!bounds) {
    return preferred;
  }
  return {
    x: snapToGridPx(bounds.maxX + 36),
    y: snapToGridPx(bounds.minY),
  };
}

function buildSequentialFieldNames(baseName, count, type, sectionId = null) {
  const trimmedBase = String(baseName ?? "").trim() || generateFieldNameSuggestion(type, sectionId);
  const normalizedBase = trimmedBase.replace(/\s+\d+$/, "").trim();
  const escapedBase = normalizedBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedBase}\\s+(\\d+)$`, "i");
  let nextNumber = 1;

  state.fields
    .filter((field) => field.type === type)
    .filter((field) => type !== "bed" || !sectionId || field.sectionId === sectionId)
    .forEach((field) => {
      const match = String(field.name ?? "").trim().match(pattern);
      if (match) {
        nextNumber = Math.max(nextNumber, Number(match[1]) + 1);
      } else if (String(field.name ?? "").trim().toLowerCase() === normalizedBase.toLowerCase()) {
        nextNumber = Math.max(nextNumber, 2);
      }
    });

  return Array.from({ length: count }, (_, index) => `${normalizedBase} ${nextNumber + index}`);
}

function getSequentialBedPlacements({ width, length, count }) {
  const gapMeters = 0.5;
  const placeVertically = width > length;
  const groupLike = {
    width: placeVertically ? width : (width * count) + (gapMeters * Math.max(count - 1, 0)),
    length: placeVertically ? (length * count) + (gapMeters * Math.max(count - 1, 0)) : length,
    rotation: 0,
  };
  const firstPlacement = findAvailableFieldPlacement(groupLike);
  const gapPx = Math.ceil((gapMeters * FIELD_SCALE) / FIELD_GRID_PX) * FIELD_GRID_PX;
  const footprint = getFieldFootprint({ width, length, rotation: 0 });

  return Array.from({ length: count }, (_, index) => ({
    x: placeVertically ? firstPlacement.x : snapToGridPx(firstPlacement.x + (index * (footprint.width + gapPx))),
    y: placeVertically ? snapToGridPx(firstPlacement.y + (index * (footprint.height + gapPx))) : firstPlacement.y,
  }));
}

async function handleFieldInfoSubmit(event) {
  event.preventDefault();
  const field = state.fields.find((item) => item.id === state.activeFieldId);
  if (!field) {
    return;
  }
  field.name = elements.fieldInfoName?.value.trim() || field.name;
  field.type = elements.fieldInfoType?.value || field.type;
  field.sectionId = field.type === "bed" ? (field.sectionId ?? state.pendingFieldSectionId ?? state.sections[0]?.id ?? null) : null;
  const axisX = toNumber(elements.fieldInfoWidth?.value);
  const axisY = toNumber(elements.fieldInfoLength?.value);
  if ((field.rotation ?? 0) % 180 === 0) {
    field.width = axisX ?? field.width;
    field.length = axisY ?? field.length;
  } else {
    field.width = axisY ?? field.width;
    field.length = axisX ?? field.length;
  }
  field.rotation = normalizeRotation(field.rotation ?? 0);
  await putRecord(DB_NAMES.cultivation, "fields", field);
  await loadState();
  renderAll();
  closeDialog(elements.fieldInfoDialog);
}

function rotateActiveField(delta) {
  const field = state.fields.find((item) => item.id === state.activeFieldId);
  if (!field) {
    return;
  }
  field.rotation = normalizeRotation((field.rotation ?? 0) + delta);
  renderFieldInfoDimensionInputs(field);
  elements.fieldInfoStatus.textContent = getFieldStatus(field.id, state.fieldWeek).statusText;
  renderFields();
}

function handleFieldInfoDelete() {
  const field = state.fields.find((item) => item.id === state.activeFieldId);
  if (!field) {
    return;
  }
  openConfirmDialog({
    title: `Ta bort ${field.name}`,
    message: `${field.name} tas bort från ${getSectionName(field.sectionId)}. Vill du fortsätta?`,
    confirmText: "Ta bort bädd",
    onConfirm: async () => {
      closeDialog(elements.fieldInfoDialog);
      await removeField(field.id);
    },
  });
}

function getPrimaryBedId() {
  return state.fields
    .filter(isSchedulingField)
    .sort((a, b) => a.name.localeCompare(b.name, "sv"))[0]?.id ?? null;
}

async function handleSectionSubmit(event) {
  event.preventDefault();
  const name = elements.sectionName?.value.trim();
  if (!name) {
    return;
  }
  const existing = state.sections.find((section) => section.id === state.activeSectionId);
  const isNewSection = !existing;
  const section = normalizeSection({
    id: existing?.id ?? `section-${Date.now()}`,
    name,
    description: elements.sectionDescription?.value.trim() || "",
    family: elements.sectionFamily?.value.trim() || "",
    rotationEnabled: elements.sectionRotationEnabled?.checked ?? true,
    rotationOrder: toNumber(elements.sectionRotationOrder?.value),
  });
  await putRecord(DB_NAMES.cultivation, "sections", section);
  state.pendingFieldSectionId = section.id;
  state.activeSectionId = null;
  closeDialog(elements.sectionDialog);
  await loadState();
  renderAll();
  if (isNewSection) {
    openFieldCreationDialog(section.id);
  }
}

function setSeedDialogReadOnly(readOnly) {
  if (!elements.seedDialogForm) {
    return;
  }
  elements.seedDialogForm.querySelectorAll("input, select, textarea").forEach((field) => {
    if (field.id === "seed-dialog-save") {
      return;
    }
    field.disabled = readOnly;
  });
  if (elements.seedDialogDelete) {
    elements.seedDialogDelete.hidden = readOnly || !state.activeSeedId;
  }
  if (elements.seedDialogSave) {
    elements.seedDialogSave.hidden = readOnly;
  }
  if (elements.seedDialogReadonlyNote) {
    elements.seedDialogReadonlyNote.hidden = !readOnly;
  }
}

function openSeedDialog(seedId, source = "personal") {
  if (!elements.seedDialog) {
    return;
  }
  const items = source === "global" ? state.globalSeedItems : state.personalSeedItems;
  const item = seedId ? items.find((seed) => seed.id === seedId) : null;
  if (seedId && !item) {
    return;
  }
  const normalized = normalizeSeedItem(item ?? {
    id: null,
    stockId: "",
    globalSeedId: "",
    family: "",
    latinFamily: "",
    crop: "",
    variety: "",
    method: "",
    spacing: "",
    rowSpacing: "",
    cultureTime: "",
    seedPerM2: "",
    schedule: {},
  });
  const stockEntry = getStockEntryForSeedItem(normalized);
  const isNewPersonalEntry = source !== "global" && !item;
  state.activeSeedId = item?.id ?? null;
  state.activeSeedSource = source;
  renderSeedDialogTemplateOptions("");
  setSeedDialogMode(isNewPersonalEntry ? "list" : "manual");
  if (elements.seedDialogModeWrap) {
    elements.seedDialogModeWrap.hidden = !isNewPersonalEntry;
  }
  if (elements.seedDialogTemplateWrap) {
    elements.seedDialogTemplateWrap.hidden = !isNewPersonalEntry || state.seedDialogMode !== "list";
  }
  if (elements.seedDialogTemplateId) {
    elements.seedDialogTemplateId.value = "";
  }
  elements.seedDialogHeading.textContent = source === "global"
    ? "Visa fröpost"
    : item ? "Redigera fröpost" : "Lägg till frö";
  elements.seedDialogFamilyInput.value = normalized.family ?? "";
  elements.seedDialogLatinFamily.value = normalized.latinFamily ?? "";
  elements.seedDialogCrop.value = normalized.crop ?? "";
  elements.seedDialogVariety.value = normalized.variety ?? "";
  elements.seedDialogMethod.value = normalized.method ?? "";
  elements.seedDialogSpacing.value = normalized.spacing ?? "";
  elements.seedDialogRowSpacing.value = normalized.rowSpacing ?? "";
  elements.seedDialogForsaddStart.value = normalized.schedule.forsaddStart ?? "";
  elements.seedDialogForsaddEnd.value = normalized.schedule.forsaddEnd ?? "";
  elements.seedDialogTransplantStart.value = normalized.schedule.transplantStart ?? "";
  elements.seedDialogTransplantEnd.value = normalized.schedule.transplantEnd ?? "";
  elements.seedDialogDirectStart.value = normalized.schedule.directStart ?? "";
  elements.seedDialogDirectEnd.value = normalized.schedule.directEnd ?? "";
  elements.seedDialogCultureTime.value = normalized.cultureTime ?? "";
  elements.seedDialogHarvestStart.value = normalized.schedule.harvestStart ?? "";
  elements.seedDialogHarvestEnd.value = normalized.schedule.harvestEnd ?? "";
  elements.seedDialogSeedPerM2.value = normalized.seedPerM2 ?? "";
  elements.seedDialogQuantity.value = stockEntry?.quantity ?? "";
  elements.seedDialogYear.value = stockEntry?.year ?? (isNewPersonalEntry ? state.activeYear : "");
  elements.seedDialogExpiration.value = stockEntry?.expirationYear ?? normalized.expirationYear ?? "";
  elements.seedDialogSupplier.value = stockEntry?.supplier ?? "";
  elements.seedDialogNotes.value = stockEntry?.notes || normalized.notes || "";
  updateSeedDialogSummary();
  setSeedDialogReadOnly(source === "global");
  showDialog(elements.seedDialog);
}

async function handleSeedDialogSubmit(event) {
  event.preventDefault();
  if (state.activeSeedSource === "global") {
    return;
  }
  const templateSeedId = state.activeSeedId ? "" : (elements.seedDialogTemplateId?.value ?? "");
  const templateSeed = templateSeedId ? getSeedItemById(templateSeedId) : null;
  let existing = state.personalSeedItems.find((seed) => seed.id === state.activeSeedId);
  if (!existing && state.seedDialogMode === "list") {
    if (!templateSeed) {
      showAppNotice("Välj ett frö från listan eller byt till Nytt frö innan du sparar.", "error");
      return;
    }
    existing = isPersonalSeedId(templateSeed.id)
      ? state.personalSeedItems.find((seed) => seed.id === templateSeed.id) ?? null
      : findPersonalSeedByGlobalReference(
        templateSeed.id,
        elements.seedDialogVariety.value.trim() || templateSeed.variety || "",
        elements.seedDialogCrop.value.trim() || templateSeed.crop || "",
      );
  }
  const cropName = elements.seedDialogCrop.value.trim();
  if (!cropName) {
    showAppNotice("Ange minst ett grödnamn innan du sparar.", "error");
    return;
  }
  const item = normalizeSeedItem({
    ...(existing ?? {}),
    id: existing?.id ?? `personal-seed-${Date.now()}`,
    stockId: existing?.stockId ?? "",
    globalSeedId: existing?.globalSeedId ?? (templateSeed && !isPersonalSeedId(templateSeed.id) ? templateSeed.id : ""),
    family: elements.seedDialogFamilyInput.value.trim(),
    latinFamily: elements.seedDialogLatinFamily.value.trim(),
    crop: cropName,
    method: elements.seedDialogMethod.value.trim(),
    variety: elements.seedDialogVariety.value.trim(),
    spacing: elements.seedDialogSpacing.value.trim(),
    rowSpacing: elements.seedDialogRowSpacing.value.trim(),
    cultureTime: elements.seedDialogCultureTime.value.trim(),
    field: existing?.field ?? "",
    seedPer75: existing?.seedPer75 ?? "",
    seedPerM2: elements.seedDialogSeedPerM2.value.trim(),
    harvestInterval: existing?.harvestInterval ?? null,
    expirationYear: elements.seedDialogExpiration.value.trim(),
    notes: elements.seedDialogNotes.value.trim(),
    schedule: {
      ...(existing?.schedule ?? {}),
      forsaddStart: toNumber(elements.seedDialogForsaddStart.value),
      forsaddEnd: toNumber(elements.seedDialogForsaddEnd.value),
      transplantStart: toNumber(elements.seedDialogTransplantStart.value),
      transplantEnd: toNumber(elements.seedDialogTransplantEnd.value),
      directStart: toNumber(elements.seedDialogDirectStart.value),
      directEnd: toNumber(elements.seedDialogDirectEnd.value),
      harvestStart: toNumber(elements.seedDialogHarvestStart.value),
      harvestEnd: toNumber(elements.seedDialogHarvestEnd.value),
    },
  });
  item.cropSort = [item.crop, item.variety].filter(Boolean).join(", ");
  await putRecord(DB_NAMES.seedPersonal, "items", normalizeSeedItem(item));
  const stockEntry = buildStockEntryFromSeedItem(item, getStockEntryForSeedItem(item), {
    quantity: elements.seedDialogQuantity.value,
    year: elements.seedDialogYear.value,
    expirationYear: elements.seedDialogExpiration.value,
    supplier: elements.seedDialogSupplier.value,
    notes: elements.seedDialogNotes.value,
    variety: item.variety,
  });
  item.stockId = stockEntry.id;
  await putRecord(DB_NAMES.seedPersonal, "items", normalizeSeedItem(item));
  await putRecord(DB_NAMES.cultivation, "seedStock", stockEntry);
  state.activeSeedId = item.id;
  await loadState();
  for (const crop of state.allCrops.filter((entry) => entry.seedId === item.id)) {
    await replaceEventsForCrop(crop);
  }
  await loadState();
  renderAll();
  closeDialog(elements.seedDialog);
}

function updateSeedDialogSummary() {
  if (!elements.seedDialog) {
    return;
  }
  const crop = elements.seedDialogCrop.value.trim();
  const variety = elements.seedDialogVariety.value.trim();
  elements.seedDialogTitle.textContent = [crop, variety].filter(Boolean).join(", ") || "Ny sort";
  elements.seedDialogFamily.textContent = elements.seedDialogFamilyInput.value.trim() || "-";
  elements.seedDialogField.textContent = elements.seedDialogMethod.value.trim() || "-";
  elements.seedDialogPresow.textContent = formatRange(
    toNumber(elements.seedDialogForsaddStart.value),
    toNumber(elements.seedDialogForsaddEnd.value),
  ) || "-";
  renderCropFamilyVisualByFamily(elements.seedDialog, elements.seedDialogFamilyInput.value.trim());
}

function renderSeedDialogFieldSuggestions() {
  const datalist = document.getElementById("seed-dialog-field-options");
  if (!datalist) {
    return;
  }
  const fieldNames = [...new Set(
    getAllSeedItems()
      .map((item) => String(item.field ?? "").trim())
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right, "sv")),
  )];
  datalist.innerHTML = fieldNames
    .map((name) => `<option value="${escapeHtml(name)}"></option>`)
    .join("");
}

function handleSeedDelete() {
  if (state.activeSeedSource === "global") {
    return;
  }
  const item = state.personalSeedItems.find((seed) => seed.id === state.activeSeedId);
  if (!item) {
    return;
  }
  openConfirmDialog({
    title: "Ta bort gröda",
      message: `Det här tar bort ${item.crop || "vald gröda"} ur Mina fröer.`,
    confirmText: "Ta bort",
    onConfirm: async () => {
      const stockEntry = getStockEntryForSeedItem(item);
      if (stockEntry) {
        await deleteRecord(DB_NAMES.cultivation, "seedStock", stockEntry.id);
      }
      await deleteRecord(DB_NAMES.seedPersonal, "items", item.id);
      state.activeSeedId = null;
      closeDialog(elements.seedDialog);
      await loadState();
      renderAll();
    },
  });
}

function enableFieldDrag(plot, field) {
  let pointerStart = null;
  let moved = false;
  plot.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button") || event.target.closest(".field-plot__resize-handle")) {
      return;
    }
    pointerStart = { x: event.clientX, y: event.clientY };
    moved = false;
    state.dragFieldId = field.id;
    plot.setPointerCapture(event.pointerId);
  });

  plot.addEventListener("pointermove", (event) => {
    if (state.dragFieldId !== field.id) {
      return;
    }
    if (pointerStart && (Math.abs(event.clientX - pointerStart.x) > 4 || Math.abs(event.clientY - pointerStart.y) > 4)) {
      moved = true;
    }
    const rect = elements.fieldMap.getBoundingClientRect();
    const footprint = getFieldFootprint(field);
    const currentMetrics = state.fieldCanvasMetrics ?? getFieldCanvasMetrics();
    const worldX = ((elements.fieldMap.scrollLeft + event.clientX - rect.left) / state.fieldZoom) - currentMetrics.originX;
    const worldY = ((elements.fieldMap.scrollTop + event.clientY - rect.top) / state.fieldZoom) - currentMetrics.originY;
    const canvasMetrics = getFieldCanvasMetrics([{
      ...field,
      x: worldX - footprint.width / 2,
      y: worldY - footprint.height / 2,
    }]);
    const nextX = Math.min(
      Math.max(worldX - footprint.width / 2, canvasMetrics.minX + 8),
      canvasMetrics.maxX - footprint.width - 8,
    );
    const nextY = Math.min(
      Math.max(worldY - footprint.height / 2, canvasMetrics.minY + 8),
      canvasMetrics.maxY - footprint.height - 8,
    );
    field.x = snapToGridPx(nextX);
    field.y = snapToGridPx(nextY);
    ensureFieldCanvasSize([field]);
    const nextMetrics = state.fieldCanvasMetrics ?? canvasMetrics;
    plot.style.left = `${Math.round((field.x + nextMetrics.originX) * state.fieldZoom)}px`;
    plot.style.top = `${Math.round((field.y + nextMetrics.originY) * state.fieldZoom)}px`;
  });

  plot.addEventListener("pointerup", async (event) => {
    if (state.dragFieldId !== field.id) {
      return;
    }
    state.dragFieldId = null;
    if (moved) {
      state.suppressFieldOpenId = field.id;
    }
    pointerStart = null;
    plot.releasePointerCapture(event.pointerId);
    await putRecord(DB_NAMES.cultivation, "fields", field);
  });
}

function enableFieldResize(plot, field) {
  const handle = plot.querySelector(".field-plot__resize-handle");
  if (!handle) {
    return;
  }

  let resizeStart = null;
  let moved = false;
  let activePointerId = null;

  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const footprint = getFieldFootprint(field);
    resizeStart = {
      x: event.clientX,
      y: event.clientY,
      width: footprint.width,
      height: footprint.height,
    };
    state.resizeFieldId = field.id;
    activePointerId = event.pointerId;
    moved = false;
  });

  const handleResizeMove = (event) => {
    if (state.resizeFieldId !== field.id || !resizeStart || event.pointerId !== activePointerId) {
      return;
    }
    moved = true;
    const deltaX = (event.clientX - resizeStart.x) / state.fieldZoom;
    const deltaY = (event.clientY - resizeStart.y) / state.fieldZoom;
    const nextFootprintWidth = snapToGridPx(Math.max(resizeStart.width + deltaX, 18));
    const nextFootprintHeight = snapToGridPx(Math.max(resizeStart.height + deltaY, 18));

    if ((field.rotation ?? 0) % 180 === 0) {
      field.width = Math.max(nextFootprintWidth / FIELD_SCALE, 0.3);
      field.length = Math.max(nextFootprintHeight / FIELD_SCALE, 0.3);
    } else {
      field.width = Math.max(nextFootprintHeight / FIELD_SCALE, 0.3);
      field.length = Math.max(nextFootprintWidth / FIELD_SCALE, 0.3);
    }

    const footprint = getFieldFootprint(field);
    plot.style.width = `${Math.round(footprint.width * state.fieldZoom)}px`;
    plot.style.height = `${Math.round(footprint.height * state.fieldZoom)}px`;
  };

  const stopResize = async (event) => {
    if (state.resizeFieldId !== field.id || event.pointerId !== activePointerId) {
      return;
    }
    state.resizeFieldId = null;
    if (moved) {
      state.suppressFieldOpenId = field.id;
    }
    resizeStart = null;
    activePointerId = null;
    await putRecord(DB_NAMES.cultivation, "fields", field);
    await loadState();
    renderAll();
  };

  window.addEventListener("pointermove", handleResizeMove);
  window.addEventListener("pointerup", stopResize);
  window.addEventListener("pointercancel", stopResize);
}

async function removeField(fieldId) {
  for (const crop of state.crops.filter((item) => item.fieldIds?.includes(fieldId))) {
    crop.fieldIds = crop.fieldIds.filter((id) => id !== fieldId);
    await putRecord(DB_NAMES.cultivation, "crops", crop);
    await replaceEventsForCrop(crop);
  }
  await deleteRecord(DB_NAMES.cultivation, "fields", fieldId);
  state.taskFields.delete(fieldId);
  state.timelineFields.delete(fieldId);
  state.planningFields.delete(fieldId);
  await loadState();
  renderAll();
}

async function removeSection(sectionId) {
  const sectionFields = state.fields.filter((field) => field.sectionId === sectionId);
  for (const field of sectionFields) {
    await removeField(field.id);
  }
  await deleteRecord(DB_NAMES.cultivation, "sections", sectionId);
  if (state.pendingFieldSectionId === sectionId) {
    state.pendingFieldSectionId = state.sections.find((section) => section.id !== sectionId)?.id ?? null;
  }
  await loadState();
  renderAll();
}

async function removeCrop(cropId) {
  const crop = state.allCrops.find((item) => item.id === cropId) ?? state.crops.find((item) => item.id === cropId);
  await restoreCropSeedStockUsage(crop);
  const relatedEvents = state.allEvents.filter((event) => event.cropId === cropId);
  for (const event of relatedEvents) {
    await deleteRecord(DB_NAMES.cultivation, "events", event.id);
  }
  const relatedHarvests = state.harvestEntries.filter((entry) => entry.cropId === cropId);
  for (const harvestEntry of relatedHarvests) {
    await deleteRecord(DB_NAMES.cultivation, "harvests", harvestEntry.id);
  }
  await deleteRecord(DB_NAMES.cultivation, "crops", cropId);
  window.localStorage?.setItem(STORAGE_KEYS.cultivationSeeded, "true");
  state.activeCropId = null;
  await loadState();
  renderAll();
}

function handleClearCultivationRequest() {
  showDialog(elements.clearCultivationDialog);
}

async function clearCultivation({ restoreSeeds = true } = {}) {
  for (const crop of await getAll(DB_NAMES.cultivation, "crops")) {
    if (restoreSeeds) {
      await restoreCropSeedStockUsage(crop);
    }
    await deleteRecord(DB_NAMES.cultivation, "crops", crop.id);
  }
  for (const event of await getAll(DB_NAMES.cultivation, "events")) {
    await deleteRecord(DB_NAMES.cultivation, "events", event.id);
  }
  for (const harvestEntry of await getAll(DB_NAMES.cultivation, "harvests")) {
    await deleteRecord(DB_NAMES.cultivation, "harvests", harvestEntry.id);
  }
  window.localStorage?.setItem(STORAGE_KEYS.cultivationSeeded, "true");
  state.activeCropId = null;
  await loadState();
  renderAll();
}

async function handlePlanningSubmit(event) {
  event.preventDefault();
  const seed = resolvePlanningSeed({ allowSingleVariety: true });
  if (!seed) {
    showAppNotice("Välj en gröda från databasen innan du sparar.", "error");
    return;
  }
  const varietyNote = elements.planningVariety?.value.trim() ?? "";
  const selectedSeedStockId = elements.planningSeedStock?.disabled
    ? PLANNING_STOCK_NONE
    : (elements.planningSeedStock?.value || PLANNING_STOCK_NONE);

  const schedule = {
    forsaddStart: toNumber(elements.planningPresow.value),
    forsaddEnd: toNumber(elements.planningPresow.value),
    directStart: toNumber(elements.planningDirect.value),
    directEnd: toNumber(elements.planningDirect.value),
    transplantStart: toNumber(elements.planningTransplant.value),
    transplantEnd: toNumber(elements.planningTransplant.value),
    transplant: toNumber(elements.planningTransplant.value),
    harvestStart: toNumber(elements.planningHarvest.value),
    harvestEnd: toNumber(elements.planningHarvest.value),
  };

  const crop = {
    id: `crop-${Date.now()}`,
    seedId: seed.id,
    title: [seed.crop, varietyNote].filter(Boolean).join(", "),
    batchName: varietyNote || seed.crop,
    startYear: state.activeYear,
    endYear: inferCropEndYear({ startYear: state.activeYear, schedule }),
    fieldIds: state.planningFields.size ? [state.planningFields.values().next().value] : [getPrimaryBedId()].filter(Boolean),
    area: toNumber(elements.planningArea?.value) ?? 0,
    note: "",
    seedStockId: selectedSeedStockId,
    schedule,
    sowing: state.planningSowingAdjustments
      ? { ...state.planningSowingAdjustments, controlMode: state.planningSowingControlMode }
      : null,
  };

  await putRecord(DB_NAMES.cultivation, "crops", crop);
  await replaceEventsForCrop(crop);
  await loadState();
  closeDialog(elements.planningDialog);
  state.page = "tidslinje";
  renderAll();
}

function openDialog(cropId) {
  const crop = state.crops.find((item) => item.id === cropId);
  if (!crop) {
    return;
  }

  state.activeCropId = cropId;
  elements.dialogTitle.textContent = crop.title;
  elements.dialogPresowStart.value = crop.schedule.forsaddStart ?? "";
  elements.dialogPresowEnd.value = crop.schedule.forsaddEnd ?? "";
  elements.dialogDirectStart.value = crop.schedule.directStart ?? "";
  elements.dialogDirectEnd.value = crop.schedule.directEnd ?? "";
  elements.dialogTransplant.value = crop.schedule.transplant ?? "";
  elements.dialogHarvestStart.value = crop.schedule.harvestStart ?? "";
  elements.dialogHarvestEnd.value = crop.schedule.harvestEnd ?? "";
  if (elements.dialogArea) {
    elements.dialogArea.value = crop.area ?? "";
  }
  state.dialogFields = new Set(crop.fieldIds);
  renderDialogFieldChips();
  elements.dialogNote.value = crop.note ?? "";
  renderDialogCapacity();
  renderDialogPreview(crop);
  renderDialogTasks(crop.id);
  renderCropFamilyVisual(elements.dialog, crop.seedId);
  showDialog(elements.dialog);
}

async function handleDialogSubmit(event) {
  event.preventDefault();
  const crop = state.crops.find((item) => item.id === state.activeCropId);
  if (!crop) {
    return;
  }

  const shouldKeepSeedUsage = hasCropConsumedSeedStock(crop);
  if (shouldKeepSeedUsage) {
    await restoreCropSeedStockUsage(crop);
  }
  crop.schedule = {
    forsaddStart: toNumber(elements.dialogPresowStart.value),
    forsaddEnd: toNumber(elements.dialogPresowEnd.value),
    directStart: toNumber(elements.dialogDirectStart.value),
    directEnd: toNumber(elements.dialogDirectEnd.value),
    transplantStart: toNumber(elements.dialogTransplant.value),
    transplantEnd: toNumber(elements.dialogTransplant.value),
    transplant: toNumber(elements.dialogTransplant.value),
    harvestStart: toNumber(elements.dialogHarvestStart.value),
    harvestEnd: toNumber(elements.dialogHarvestEnd.value),
  };
  crop.endYear = inferCropEndYear(crop);
  crop.area = toNumber(elements.dialogArea?.value) ?? 0;
  crop.fieldIds = [...state.dialogFields];
  crop.note = elements.dialogNote.value.trim();

  await putRecord(DB_NAMES.cultivation, "crops", crop);
  await replaceEventsForCrop(crop);
  if (shouldKeepSeedUsage) {
    await loadState();
    const updatedCrop = state.allCrops.find((item) => item.id === crop.id) ?? crop;
    await applySeedStockUsageToCrop(updatedCrop);
    await putRecord(DB_NAMES.cultivation, "crops", updatedCrop);
  }
  await loadState();
  closeDialog(elements.dialog);
  renderAll();
}

async function handleCropDelete() {
  if (!state.activeCropId) {
    return;
  }
  await removeCrop(state.activeCropId);
  closeDialog(elements.dialog);
}

function renderDialogCapacity() {
  if (!elements.dialogCapacity) {
    return;
  }
  const requestedArea = toNumber(elements.dialogArea?.value) ?? 0;
  const selectedIds = [...state.dialogFields];

  if (selectedIds.length === 0) {
    elements.dialogCapacity.textContent = "Ange minst en bädd för att se kapacitet.";
    if (elements.dialogPreviewFields) {
      elements.dialogPreviewFields.textContent = "Välj bädd";
    }
    return;
  }

  const totalArea = selectedIds.reduce((sum, fieldId) => sum + getFieldArea(fieldId), 0);
  elements.dialogCapacity.textContent = `${formatArea(totalArea)} m² tillgängligt i valda bäddar. Den här omgången använder ${formatArea(requestedArea)} m².`;
  if (elements.dialogPreviewArea) {
    elements.dialogPreviewArea.textContent = `${formatArea(requestedArea)} m²`;
  }
  if (elements.dialogPreviewFields) {
    elements.dialogPreviewFields.textContent = selectedIds.map(getFieldPlacementName).join(", ");
  }
  if (elements.dialogPreviewStart) {
    const startWeek =
      toNumber(elements.dialogPresowStart.value) ??
      toNumber(elements.dialogDirectStart.value) ??
      toNumber(elements.dialogTransplant.value);
    elements.dialogPreviewStart.textContent = startWeek ? `Vecka ${startWeek}` : "-";
  }
}

function renderDialogFieldChips() {
  if (!elements.dialogFields) {
    return;
  }
  elements.dialogFields.innerHTML = "";
  elements.dialogFields.classList.add("dialog-field-grid");

  [...state.sections]
    .sort((a, b) => getSectionDisplayName(a).localeCompare(getSectionDisplayName(b), "sv"))
    .forEach((section) => {
      const fields = state.fields
        .filter((field) => isSchedulingField(field) && field.sectionId === section.id)
        .sort((a, b) => a.name.localeCompare(b.name, "sv"));
      if (!fields.length) {
        return;
      }

      const family = getSectionDisplayFamily(section);
      const column = document.createElement("div");
      column.className = "planning-field-column";
      column.innerHTML = `
        <div class="planning-field-column__head">
          <strong class="planning-field-column__title">${escapeHtml(getSectionDisplayName(section))}</strong>
          ${family ? `<span class="planning-field-column__family">${escapeHtml(family)}</span>` : ""}
        </div>
      `;

      fields.forEach((field) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.textContent = field.name;
        chip.classList.toggle("is-active", state.dialogFields.has(field.id));
        chip.addEventListener("click", () => {
          state.dialogFields.clear();
          state.dialogFields.add(field.id);
          renderDialogFieldChips();
          renderDialogCapacity();
        });
        column.appendChild(chip);
      });

      elements.dialogFields.appendChild(column);
    });
}

function renderDialogPreview(crop) {
  if (elements.dialogPreviewArea) {
    elements.dialogPreviewArea.textContent = `${formatArea(crop.area ?? 0)} m²`;
  }
  if (elements.dialogPreviewFields) {
    elements.dialogPreviewFields.textContent = crop.fieldIds.map(getFieldPlacementName).join(", ") || "Välj bädd";
  }
  if (elements.dialogPreviewStart) {
    elements.dialogPreviewStart.textContent = getCropFirstWeek(crop) ? `Vecka ${getCropFirstWeek(crop)}` : "-";
  }
}

function renderDialogTasks(cropId) {
  if (!elements.dialogTaskList) {
    return;
  }
  const cropEvents = state.events
    .filter((event) => event.cropId === cropId)
    .sort((a, b) => a.week - b.week);
  if (!cropEvents.length) {
    elements.dialogTaskList.innerHTML = `<p class="section-caption">Inga uppgifter kopplade ännu.</p>`;
    return;
  }
  elements.dialogTaskList.innerHTML = "";
  cropEvents.forEach((event) => {
    const label = document.createElement("label");
    label.className = "dialog-task-item";
    label.innerHTML = `
      <span><strong>${ACTIVITY_META[event.type].label}</strong> vecka ${event.week}</span>
      <input type="checkbox" ${event.completed ? "checked" : ""} />
    `;
    label.querySelector("input")?.addEventListener("change", async (inputEvent) => {
      await handleEventCheckboxChange(event, inputEvent.target.checked, cropId);
    });
    elements.dialogTaskList.appendChild(label);
  });
}

async function replaceEventsForCrop(crop) {
  const existingEvents = await getAll(DB_NAMES.cultivation, "events");
  const related = existingEvents.filter((event) => event.cropId === crop.id);
  const nextEvents = createEventsForCrop(crop);
  const nextIds = new Set(nextEvents.map((event) => event.id));
  const harvestEntries = await getAll(DB_NAMES.cultivation, "harvests");

  nextEvents.forEach((event) => {
    const existing = related.find((candidate) => candidate.id === event.id);
    if (existing) {
      event.completed = Boolean(existing.completed);
      event.moreToHarvest = existing.moreToHarvest ?? null;
    }
  });

  for (const event of related) {
    if (!nextIds.has(event.id)) {
      await deleteRecord(DB_NAMES.cultivation, "events", event.id);
      for (const entry of harvestEntries.filter((harvestEntry) => harvestEntry.eventId === event.id)) {
        await deleteRecord(DB_NAMES.cultivation, "harvests", entry.id);
      }
    }
  }
  for (const event of nextEvents) {
    await putRecord(DB_NAMES.cultivation, "events", event);
  }
}

function createEventsForCrop(crop) {
  const events = [];
  if (crop.schedule.forsaddStart) events.push(makeEvent(crop, "forsadd", crop.schedule.forsaddStart));
  if (crop.schedule.directStart) events.push(makeEvent(crop, "direktsadd", crop.schedule.directStart));
  if (crop.schedule.transplant) events.push(makeEvent(crop, "utplantering", crop.schedule.transplant));
  getHarvestWeeksForCrop(crop).forEach((week) => {
    events.push(makeEvent(crop, "skord", week));
  });
  return events;
}

function makeEvent(crop, type, week) {
  return {
    id: type === "skord" ? `${crop.id}-${type}-${week}` : `${crop.id}-${type}`,
    cropId: crop.id,
    batchName: crop.batchName,
    title: crop.title,
    type,
    week,
    year: inferCropEventYear(crop, type, week),
    fieldIds: crop.fieldIds,
    completed: false,
    moreToHarvest: null,
  };
}

function getHarvestWeeksForCrop(crop) {
  const startWeek = crop.schedule?.harvestStart;
  const endWeek = crop.schedule?.harvestEnd ?? startWeek;
  if (!startWeek || !endWeek) {
    return [];
  }
  const seed = getSeedItemById(crop.seedId);
  const interval = Math.max(toNumber(seed?.harvestInterval) ?? 0, 0);
  if (!interval) {
    return [startWeek];
  }
  const weeks = [];
  for (let week = startWeek; week <= endWeek; week += interval) {
    weeks.push(week);
  }
  if (weeks[weeks.length - 1] !== endWeek) {
    weeks.push(endWeek);
  }
  return [...new Set(weeks)];
}

function getVisibleEvents() {
  return state.events
    .filter((event) => isWithinRelevantTaskRange(event.week, currentWeek))
    .filter((event) => (state.taskStatus === "open" ? !event.completed : true))
    .filter((event) => matchesFieldFilter(event, state.taskFields))
    .filter((event) => state.taskTypes.size === 0 || state.taskTypes.has(event.type))
    .sort((a, b) => a.week - b.week);
}

function isWithinRelevantTaskRange(eventWeek, referenceWeek) {
  if (eventWeek <= referenceWeek) {
    return true;
  }
  return isWithinNextMonth(eventWeek, referenceWeek);
}

function getEventTimingState(event) {
  if (event.completed) {
    return "";
  }
  if (isEventOverdue(event)) {
    return "late";
  }
  if (isEventInCurrentWeek(event)) {
    return "current";
  }
  return "";
}

function getEventTimingLabel(event) {
  if (event.completed) {
    return "Utförd";
  }
  if (isEventOverdue(event)) {
    return "Försenad";
  }
  if (isEventInCurrentWeek(event)) {
    return "Denna vecka";
  }
  return `Kommer vecka ${event.week}`;
}

function getOutstandingEvents() {
  return state.events.filter((event) => isEventOverdue(event));
}

function getOutstandingEventCountForCrop(cropId) {
  return getOutstandingEvents().filter((event) => event.cropId === cropId).length;
}

function getOutstandingEventCountForField(fieldId) {
  return getOutstandingEvents().filter((event) => event.fieldIds?.includes(fieldId)).length;
}

async function handleEventCheckboxChange(event, checked, sourceCropId = null) {
  if (event.type === "skord") {
    if (checked && !event.completed) {
      openHarvestDialog(event, sourceCropId);
      return;
    }
    if (!checked && event.completed) {
      showAppNotice("Skörd registreras via skörd-popupen och kan inte bockas ur direkt här.", "error");
      if (sourceCropId) {
        openDialog(sourceCropId);
      } else {
        renderAll();
      }
      return;
    }
  }

  const isSeedConsumingEvent = event.type === "direktsadd" || event.type === "forsadd";
  let stockWarning = "";
  if (isSeedConsumingEvent) {
    const crop = state.allCrops.find((item) => item.id === event.cropId) ?? state.crops.find((item) => item.id === event.cropId);
    if (crop) {
      if (checked && !event.completed && !hasCropConsumedSeedStock(crop)) {
        await applySeedStockUsageToCrop(crop);
        await putRecord(DB_NAMES.cultivation, "crops", crop);
        if (crop.seedStockUsage?.missing > 0) {
          stockWarning = `Mina fröer saknade ${crop.seedStockUsage.missing} frön för ${crop.title}.`;
        }
      }
      if (!checked && event.completed && hasCropConsumedSeedStock(crop)) {
        await restoreCropSeedStockUsage(crop);
        await putRecord(DB_NAMES.cultivation, "crops", crop);
      }
    }
  }

  event.completed = checked;
  await putRecord(DB_NAMES.cultivation, "events", event);
  await loadState();
  renderAll();
  if (stockWarning) {
    showAppNotice(stockWarning, "warning");
  }
  if (sourceCropId) {
    openDialog(sourceCropId);
  }
}

function matchesFieldFilter(entry, selectedFields) {
  if (selectedFields.size === 0) {
    return true;
  }
  return (entry.fieldIds || []).some((fieldId) => selectedFields.has(fieldId));
}

function appendRange(track, startWeek, endWeek, minWeek, color, label = "", dragConfig = null) {
  if (!startWeek || !endWeek) {
    return;
  }
  const block = document.createElement("div");
  block.className = "timeline-block";
  block.style.setProperty("--accent", color);
  block.style.left = `${getTimelineX(startWeek, minWeek)}px`;
  block.style.width = `${Math.max((endWeek - startWeek + 1) * 36 - 6, 16)}px`;
  if (label) {
    block.title = `${label}: vecka ${formatRange(startWeek, endWeek)}`;
  }
  if (dragConfig?.cropId && dragConfig?.eventType) {
    const isCompleted = isCropEventCompleted(dragConfig.cropId, dragConfig.eventType);
    block.classList.toggle("is-complete", isCompleted);
    block.classList.toggle("is-pending", !isCompleted);
    block.innerHTML = `<span class="timeline-block__status" aria-hidden="true">${isCompleted ? "✓" : "○"}</span>`;
    block.title = `${label}: vecka ${formatRange(startWeek, endWeek)} · ${isCompleted ? "gjord" : "inte gjord"}`;
  }
  block.addEventListener("click", (event) => event.stopPropagation());
  if (dragConfig?.cropId && dragConfig?.startKey && dragConfig?.endKey) {
    block.classList.add("is-draggable");
    enableTimelineRangeDrag(block, minWeek, dragConfig);
  }
  track.appendChild(block);
}

function isCropEventCompleted(cropId, type) {
  return state.events.some((event) => event.cropId === cropId && event.type === type && event.completed);
}

function getTimelineBounds(crops, view = state.timelineView) {
  return { start: 1, end: 52 };
}

function getTimelineX(week, minWeek) {
  return (week - minWeek) * 36 + 3;
}

function getTimelineWeekStartX(week, minWeek) {
  return (week - minWeek) * 36;
}

function getTimelineWeekEndX(week, minWeek) {
  return getTimelineWeekStartX(week, minWeek) + 36;
}

function getTimelineTodayX(minWeek) {
  return getTimelineWeekStartX(currentWeek, minWeek) + (36 * getCurrentWeekProgress());
}

function getCurrentWeekProgress(now = new Date()) {
  const dayIndex = (now.getDay() + 6) % 7;
  const dayProgress =
    (now.getHours() * 3600000 +
      now.getMinutes() * 60000 +
      now.getSeconds() * 1000 +
      now.getMilliseconds()) / 86400000;
  return Math.min(Math.max((dayIndex + dayProgress) / 7, 0), 1);
}

function getEventAbsoluteWeek(event) {
  return toAbsoluteWeek(event.year ?? state.activeYear, event.week);
}

function getCurrentAbsoluteWeek() {
  return toAbsoluteWeek(currentYear, currentWeek);
}

function isEventInCurrentWeek(event) {
  return getEventAbsoluteWeek(event) === getCurrentAbsoluteWeek();
}

function isEventDueByCurrentWeek(event) {
  return getEventAbsoluteWeek(event) <= getCurrentAbsoluteWeek();
}

function isEventOverdue(event) {
  return !event.completed && getEventAbsoluteWeek(event) < getCurrentAbsoluteWeek();
}

function createTimelineOccupancyMini(fieldId, bounds) {
  const mini = document.createElement("div");
  mini.className = "timeline-occupancy-mini";
  if (!bounds) {
    return mini;
  }
  for (let week = bounds.start; week <= bounds.end; week += 1) {
    const status = getFieldStatus(fieldId, week);
    const cell = document.createElement("div");
    cell.className = "timeline-occupancy-mini__cell";
    cell.classList.toggle("is-overfilled", status.overfilled);
    cell.style.setProperty("--fill", String(Math.min(status.percent / 100, 1)));
    cell.title = `Vecka ${week}: ${formatArea(status.used)} av ${formatArea(getFieldArea(fieldId))} m² (${Math.round(status.percent)}%)`;
    mini.appendChild(cell);
  }
  return mini;
}

function createTimelineWeekGuide(bounds) {
  const guide = document.createElement("div");
  guide.className = "timeline-week-guide";
  if (!bounds) {
    return guide;
  }
  for (let week = bounds.start; week <= bounds.end; week += 1) {
    const marker = document.createElement("div");
    marker.className = "timeline-week-guide__cell";
    if (week === currentWeek) {
      marker.classList.add("is-current");
    }
    marker.textContent = String(week);
    guide.appendChild(marker);
  }
  return guide;
}

function enableTimelineRangeDrag(block, minWeek, dragConfig) {
  block.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const crop = state.crops.find((item) => item.id === dragConfig.cropId);
    if (!crop) {
      return;
    }
    const startWeek = crop.schedule[dragConfig.startKey];
    const endWeek = crop.schedule[dragConfig.endKey] ?? startWeek;
    state.dragTimeline = {
      cropId: crop.id,
      startKey: dragConfig.startKey,
      endKey: dragConfig.endKey,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startWeek,
      endWeek,
      minWeek,
      block,
      delta: 0,
    };
    block.setPointerCapture(event.pointerId);
  });

  block.addEventListener("pointermove", (event) => {
    if (!state.dragTimeline || state.dragTimeline.pointerId !== event.pointerId || state.dragTimeline.block !== block) {
      return;
    }
    const delta = Math.round((event.clientX - state.dragTimeline.startClientX) / 36);
    if (delta === state.dragTimeline.delta) {
      return;
    }
    state.dragTimeline.delta = delta;
    const visualStart = clampWeek(state.dragTimeline.startWeek + delta);
    const visualEnd = clampWeek(state.dragTimeline.endWeek + delta);
    block.style.left = `${getTimelineX(visualStart, state.dragTimeline.minWeek)}px`;
    block.style.width = `${Math.max((visualEnd - visualStart + 1) * 36 - 6, 16)}px`;
  });

  const finishDrag = async (event) => {
    if (!state.dragTimeline || state.dragTimeline.pointerId !== event.pointerId || state.dragTimeline.block !== block) {
      return;
    }
    block.releasePointerCapture(event.pointerId);
    const delta = state.dragTimeline.delta;
    const crop = state.crops.find((item) => item.id === state.dragTimeline.cropId);
    if (crop && delta !== 0) {
      crop.schedule[state.dragTimeline.startKey] = clampWeek(state.dragTimeline.startWeek + delta);
      crop.schedule[state.dragTimeline.endKey] = clampWeek(state.dragTimeline.endWeek + delta);
      await putRecord(DB_NAMES.cultivation, "crops", crop);
      await replaceEventsForCrop(crop);
      await loadState();
      renderAll();
    } else {
      renderTimeline();
    }
    state.dragTimeline = null;
  };

  block.addEventListener("pointerup", finishDrag);
  block.addEventListener("pointercancel", finishDrag);
}

function clampWeek(week) {
  return Math.min(Math.max(week, 1), 52);
}

function updateRange(schedule, startKey, endKey, value) {
  const [start, end] = value.split("-").map((item) => toNumber(item.trim()));
  schedule[startKey] = start;
  schedule[endKey] = end ?? start;
}

function formatRange(start, end) {
  if (!start && !end) {
    return "";
  }
  if (start && end && start !== end) {
    return `${start}-${end}`;
  }
  return String(start ?? end ?? "");
}

function getCropFirstWeek(crop) {
  const relevantEventWeeks = state.events.filter((event) => event.cropId === crop.id).map((event) => event.week);
  if (relevantEventWeeks.length) {
    return Math.min(...relevantEventWeeks);
  }
  const weeks = Object.values(crop.schedule ?? {}).filter((value) => typeof value === "number");
  return weeks.length ? Math.min(...weeks) : null;
}

function getCropOccupancyRange(crop) {
  const startWeek = crop.schedule.directStart ?? crop.schedule.transplant;
  const endWeek = crop.schedule.harvestEnd ?? crop.schedule.harvestStart ?? crop.schedule.directEnd ?? crop.schedule.transplant ?? crop.schedule.directStart ?? startWeek;
  return {
    startWeek,
    endWeek,
    startYear: inferCropEventYear(crop, "occupancy-start", startWeek),
    endYear: inferCropEventYear(crop, "occupancy-end", endWeek),
  };
}

function isCropInPresowNow(crop) {
  const start = crop.schedule.forsaddStart;
  const end = crop.schedule.forsaddEnd ?? start;
  if (!start || !end) {
    return false;
  }
  const transplantDone = state.events.some((event) => event.cropId === crop.id && event.type === "utplantering" && event.completed);
  return !transplantDone && state.activeYear === inferCropEventYear(crop, "forsadd", start) && currentWeek >= start && currentWeek <= end;
}

function isCropPlantedNow(crop) {
  if (isCropHarvested(crop)) {
    return false;
  }
  const transplantWeek = crop.schedule.transplant;
  const directWeek = crop.schedule.directStart;
  const startWeek = directWeek ?? transplantWeek;
  if (!startWeek) {
    return false;
  }
  const plantingStarted = state.events
    .filter((event) => event.cropId === crop.id && ["direktsadd", "utplantering"].includes(event.type))
    .some((event) => event.completed || currentWeek >= event.week);
  const harvestEnd = crop.schedule.harvestEnd ?? crop.schedule.harvestStart ?? 52;
  return plantingStarted && currentWeek >= startWeek && currentWeek <= harvestEnd;
}

function isCropActuallyPlanted(crop) {
  if (isCropHarvested(crop)) {
    return false;
  }
  const plantingEvent = state.events
    .filter((event) => event.cropId === crop.id && ["direktsadd", "utplantering"].includes(event.type))
    .find((event) => event.completed);
  if (!plantingEvent) {
    return false;
  }
  const harvestEnd = crop.schedule.harvestEnd ?? crop.schedule.harvestStart ?? 52;
  const harvestYear = inferCropEventYear(crop, "skord", harvestEnd);
  return toAbsoluteWeek(state.activeYear, currentWeek) <= toAbsoluteWeek(harvestYear, harvestEnd);
}

function isCropHarvested(crop) {
  return Boolean(getCropHarvestCompletionEvent(crop.id));
}

function getCropHarvestCompletionEvent(cropId) {
  const completedHarvestEvents = state.events
    .filter((event) => event.cropId === cropId && event.type === "skord" && event.completed)
    .sort((left, right) => toAbsoluteWeek(left.year ?? state.activeYear, left.week) - toAbsoluteWeek(right.year ?? state.activeYear, right.week));
  const closedEvent = completedHarvestEvents.find((event) => event.moreToHarvest === false);
  if (closedEvent) {
    return closedEvent;
  }
  const allHarvestEvents = state.events
    .filter((event) => event.cropId === cropId && event.type === "skord")
    .sort((left, right) => toAbsoluteWeek(left.year ?? state.activeYear, left.week) - toAbsoluteWeek(right.year ?? state.activeYear, right.week));
  if (allHarvestEvents.length && allHarvestEvents.every((event) => event.completed && event.moreToHarvest !== true)) {
    return allHarvestEvents[allHarvestEvents.length - 1];
  }
  return null;
}

async function hydrateWeatherWidget() {
  if (!elements.weatherTemp || !elements.weatherLabel) {
    return;
  }

  const fallback = { latitude: 55.605, longitude: 13.0038, name: "Standardläge" };
  const cachedLocation = getCachedWeatherLocation();
  const shouldRefreshLegacyFallback = isLegacyFallbackWeatherLocation(cachedLocation, fallback);
  let location = shouldRefreshLegacyFallback ? null : cachedLocation;
  let usedFallback = false;

  try {
    if (navigator.geolocation && (!cachedLocation || shouldRefreshLegacyFallback) && (!hasRequestedWeatherLocation() || shouldRefreshLegacyFallback)) {
      const liveLocation = await tryGetCurrentWeatherLocation({ forceFresh: false });
      markWeatherLocationRequested();
      if (liveLocation) {
        location = liveLocation;
        cacheWeatherLocation(location);
      }
    }

    if (!location) {
      location = fallback;
      usedFallback = true;
    }

    if (!usedFallback && !hasSpecificLocationName(location.name)) {
      try {
        const resolvedName = await resolveLocationName(location);
        if (resolvedName) {
          location = { ...location, name: resolvedName };
          cacheWeatherLocation(location);
        }
      } catch {
        // Keep weather fetch alive even if location naming fails.
      }
    }

    let forecast;
    try {
      const weatherResult = await resolveForecastForLocation(location);
      forecast = weatherResult.forecast;
      location = weatherResult.location;
      if (!usedFallback) {
        cacheWeatherLocation(location);
      }
    } catch {
      forecast = await fetchSmhiForecast(fallback);
      location = usedFallback ? fallback : (hasSpecificLocationName(location.name) ? location : { ...fallback, name: "Standardläge" });
      usedFallback = true;
    }
    const currentEntry = getCurrentForecastEntry(forecast.timeSeries);
      const daily = buildSmhiDailyForecast(forecast.timeSeries).slice(0, 7);
      const currentTemp = Math.round(currentEntry?.data?.air_temperature ?? daily[0]?.max ?? 0);
      const maxTemp = Math.round(daily[0]?.max ?? currentTemp);
      const minTemp = Math.round(daily[0]?.min ?? currentTemp);
      const estimatedSoilTemp = estimateSoilTemperatureAtFiveCm(daily, location);
      elements.weatherTemp.textContent = `${currentTemp}°C`;
      if (elements.weatherCurrentIcon) {
        elements.weatherCurrentIcon.innerHTML = getWeatherIconMarkup(currentEntry?.data?.symbol_code);
      }
      elements.weatherLabel.textContent = describeWeatherCode(currentEntry?.data);
      elements.weatherLocation.textContent = usedFallback ? "Plats kunde inte hämtas" : (location.name || "Nuvarande plats");
      elements.weatherRange.textContent = `${minTemp}° / ${maxTemp}°`;
      if (elements.weatherSoilTemp) {
        elements.weatherSoilTemp.textContent = Number.isFinite(estimatedSoilTemp)
          ? `${Math.round(estimatedSoilTemp)}°C`
          : "--°C";
      }
      renderWeatherWeek(daily);
      renderWeatherAdvice(daily);
      hydrateFrostWindow(location);
  } catch (error) {
    elements.weatherTemp.textContent = "--°";
    if (elements.weatherCurrentIcon) {
      elements.weatherCurrentIcon.innerHTML = "";
      }
      elements.weatherLabel.textContent = "Kunde inte hämta väder";
      elements.weatherLocation.textContent = "Kontrollera uppkoppling";
      elements.weatherRange.textContent = "-- / --";
      if (elements.weatherSoilTemp) {
        elements.weatherSoilTemp.textContent = "--°C";
      }
      if (elements.weatherWeek) {
        elements.weatherWeek.innerHTML = "";
      }
    if (elements.weatherAdvice) {
      elements.weatherAdvice.textContent = "Inga väderråd just nu.";
    }
  }
}

async function refreshWeatherLocation() {
  if (!elements.weatherRefreshLocation) {
    return;
  }
  const button = elements.weatherRefreshLocation;
  const previousLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Uppdaterar...";

  try {
    try {
      window.localStorage?.removeItem(STORAGE_KEYS.weatherLocation);
      window.localStorage?.removeItem(STORAGE_KEYS.weatherLocationRequested);
    } catch {
      // Ignore storage failures and continue with a live request.
    }
    const liveLocation = await tryGetCurrentWeatherLocation({ forceFresh: true });
    markWeatherLocationRequested();
    if (liveLocation) {
      let resolvedLocation = liveLocation;
      try {
        const resolvedName = await resolveLocationName(liveLocation);
        if (resolvedName) {
          resolvedLocation = { ...liveLocation, name: resolvedName };
        }
      } catch {
        // Keep coordinates even if name lookup fails.
      }
      try {
        const weatherResult = await resolveForecastForLocation(resolvedLocation);
        cacheWeatherLocation(weatherResult.location);
        setWeatherLocationStatus(weatherResult.location.name ? `Plats sparad: ${weatherResult.location.name}` : "Plats sparad.");
        renderSettingsWeatherLocation();
      } catch {
        setWeatherLocationStatus("Platsen hittades, men SMHI kunde inte ge prognos för området.");
      }
    } else {
      setWeatherLocationStatus("Webbläsaren kunde inte hämta platsen. Sök ort manuellt istället.");
    }
    await hydrateWeatherWidget();
  } finally {
    button.disabled = false;
    button.textContent = previousLabel;
  }
}

async function handleWeatherLocationSearch(event) {
  event.preventDefault();
  const query = elements.weatherLocationQuery?.value.trim() ?? "";
  if (!query) {
    setWeatherLocationStatus("Skriv en ort först.");
    return;
  }

  const submitButton = elements.weatherLocationForm?.querySelector("button[type='submit']");
  const previousLabel = submitButton?.textContent;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Söker...";
  }
  setWeatherLocationStatus("Söker plats...");

  try {
    const location = getSelectedWeatherLocationSuggestion(query) ?? await geocodeWeatherLocationQuery(query);
    if (!location) {
      setWeatherLocationStatus("Hittade ingen plats. Prova ort och land, t.ex. Lund, Sverige.");
      return;
    }

    const weatherResult = await resolveForecastForLocation(location);
    cacheWeatherLocation(weatherResult.location);
    markWeatherLocationRequested();
    setWeatherLocationStatus(`Plats sparad: ${weatherResult.location.name}`);
    state.weatherLocationSuggestions = [];
    renderSettingsWeatherLocation();
    await hydrateWeatherWidget();
  } catch {
    setWeatherLocationStatus("Platsen hittades, men SMHI kunde inte ge prognos där.");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = previousLabel;
    }
  }
}

function setWeatherLocationStatus(message) {
  if (elements.weatherLocationStatus) {
    elements.weatherLocationStatus.textContent = message;
  }
}

function handleWeatherLocationQueryInput(event) {
  const query = event.target.value.trim();
  if (state.weatherLocationSuggestTimer) {
    window.clearTimeout(state.weatherLocationSuggestTimer);
    state.weatherLocationSuggestTimer = null;
  }
  if (query.length < 2) {
    state.weatherLocationSuggestions = [];
    renderWeatherLocationSuggestions();
    return;
  }
  const requestId = ++state.weatherLocationSuggestRequestId;
  state.weatherLocationSuggestTimer = window.setTimeout(async () => {
    const suggestions = await fetchWeatherLocationSuggestions(query);
    if (requestId !== state.weatherLocationSuggestRequestId) {
      return;
    }
    state.weatherLocationSuggestions = suggestions;
    renderWeatherLocationSuggestions();
  }, 220);
}

function renderWeatherLocationSuggestions() {
  if (!elements.weatherLocationSuggestions) {
    return;
  }
  elements.weatherLocationSuggestions.innerHTML = state.weatherLocationSuggestions
    .map((suggestion) => `<option value="${escapeHtml(suggestion.label)}"></option>`)
    .join("");
}

async function tryGetCurrentWeatherLocation({ forceFresh = false } = {}) {
  try {
    return await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            name: "",
          });
        },
        () => resolve(null),
        {
          enableHighAccuracy: forceFresh,
          timeout: forceFresh ? 10000 : 5000,
          maximumAge: forceFresh ? 0 : 10 * 60 * 1000,
        },
      );
    });
  } catch {
    return null;
  }
}

async function geocodeWeatherLocationQuery(query) {
  const suggestions = await fetchWeatherLocationSuggestions(query, { limit: 1 });
  return suggestions[0] ?? null;
}

async function fetchWeatherLocationSuggestions(query, { limit = 6 } = {}) {
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=${limit}&countrycodes=se&accept-language=sv&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      return null;
    }
    const matches = await response.json();
    return (matches ?? [])
      .map((match) => normalizeWeatherLocationSuggestion(match, query))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function normalizeWeatherLocationSuggestion(match, fallbackName) {
  const latitude = Number(match?.lat);
  const longitude = Number(match?.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  const name = formatGeocodedLocationName(match, fallbackName);
  return {
    latitude,
    longitude,
    name,
    label: formatWeatherLocationSuggestionLabel(match, name),
    source: "manual",
  };
}

function formatGeocodedLocationName(match, fallbackName) {
  const address = match?.address ?? {};
  const candidate =
    address.city
    || address.town
    || address.village
    || address.hamlet
    || address.municipality
    || String(match?.name ?? "").trim()
    || String(fallbackName ?? "").trim();
  return candidate || "Vald plats";
}

function formatWeatherLocationSuggestionLabel(match, name) {
  const address = match?.address ?? {};
  const area =
    address.municipality
    || address.county
    || address.state
    || address.country
    || "";
  return area && area !== name ? `${name}, ${area}` : name;
}

function getSelectedWeatherLocationSuggestion(query) {
  const normalizedQuery = String(query ?? "").trim().toLowerCase();
  return state.weatherLocationSuggestions.find((suggestion) =>
    suggestion.label.trim().toLowerCase() === normalizedQuery
    || suggestion.name.trim().toLowerCase() === normalizedQuery) ?? null;
}

async function resolveForecastForLocation(location) {
  const candidates = buildNearbyForecastCandidates(location);
  for (const candidate of candidates) {
    try {
      const forecast = await fetchSmhiForecast(candidate);
      return { forecast, location: candidate };
    } catch {
      // Try the next nearby point. Coastal coordinates can land just outside SMHI's forecast grid.
    }
  }
  throw new Error("No supported forecast point found");
}

function buildNearbyForecastCandidates(location) {
  const offsets = [
    [0, 0],
    [0.01, 0],
    [-0.01, 0],
    [0, 0.01],
    [0, -0.01],
    [0.02, 0],
    [-0.02, 0],
    [0, 0.02],
    [0, -0.02],
    [0.01, 0.01],
    [0.01, -0.01],
    [-0.01, 0.01],
    [-0.01, -0.01],
  ];
  return offsets.map(([latOffset, lonOffset]) => ({
    ...location,
    latitude: Number((location.latitude + latOffset).toFixed(5)),
    longitude: Number((location.longitude + lonOffset).toFixed(5)),
  }));
}

async function hydrateFrostWindow(location) {
  const cached = getCachedFrostWindow(location);
  if (cached) {
    state.frostWindow = cached;
    if (state.page === "tidslinje") {
      renderTimeline();
    }
  }
  try {
    const next = await fetchHistoricalFrostWindow(location);
    if (!next) {
      return;
    }
    state.frostWindow = next;
    cacheFrostWindow(location, next);
    if (state.page === "tidslinje") {
      renderTimeline();
    }
  } catch {
    // Keep existing/cached frost window if historical fetch fails.
  }
}

function renderWeatherWeek(days) {
  if (!elements.weatherWeek) {
    return;
  }
  elements.weatherWeek.innerHTML = days.map((day, index) => `
      <div class="weather-day ${index === 0 ? "is-today" : ""}">
        <strong>${formatWeekday(day.date)}</strong>
        <span class="weather-day__icon" aria-hidden="true">${getWeatherIconMarkup(day.code)}</span>
        <div class="weather-day__temps" aria-label="Max ${day.max} grader, min ${day.min} grader">
          <span class="weather-day__temp weather-day__temp--max">${day.max}°</span>
          <span class="weather-day__temp weather-day__temp--min">${day.min}°</span>
        </div>
      </div>
    `).join("");
}

function renderWeatherAdvice(days) {
  if (!elements.weatherAdvice) {
    return;
  }
  const advice = getWeatherAdvice(days);
  elements.weatherAdvice.innerHTML = advice.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
}

function getWeatherAdvice(nextDays) {
  const advice = [];
  if (nextDays.some((day) => day.min <= 1)) {
    advice.push("Kalla nätter väntar, var försiktig med utplantering.");
  }
  if (nextDays.some((day) => day.precipitation >= 70 || day.rainAmount >= 8)) {
    advice.push("Mycket nederbörd väntas, planera bevattning och direktsådd därefter.");
  }
  if (nextDays.slice(0, 3).every((day) => day.max >= 12 && day.precipitation < 45)) {
    advice.push("Bra fönster för sådd och utplantering de närmaste dagarna.");
  }
  if (nextDays.some((day) => [95].includes(day.code))) {
    advice.push("Risk för åska, undvik känsliga arbetsmoment på de dagarna.");
  }
  return advice.length ? advice.slice(0, 3) : ["Stabil vecka i prognosen, jobba vidare enligt plan."];
}

function formatWeekday(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("sv-SE", { weekday: "short" });
}

async function fetchSmhiForecast(location) {
  const url =
    `https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/${location.longitude}/lat/${location.latitude}/data.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("SMHI forecast fetch failed");
  }
  return response.json();
}

function getCurrentForecastEntry(timeSeries) {
  if (!Array.isArray(timeSeries) || !timeSeries.length) {
    return null;
  }
  const now = Date.now();
  return timeSeries.find((entry) => Date.parse(entry.time) >= now) ?? timeSeries[0];
}

function buildSmhiDailyForecast(timeSeries) {
  const dayMap = new Map();
  (timeSeries ?? []).forEach((entry) => {
    if (!entry?.time || !entry?.data) {
      return;
    }
    const date = new Date(entry.time);
    const key = date.toLocaleDateString("sv-SE", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Stockholm",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const localHour = Number(date.toLocaleTimeString("sv-SE", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Stockholm",
      hour: "2-digit",
      hour12: false,
    }).slice(0, 2));
    const current = dayMap.get(key) ?? {
      date: key,
      min: Number.POSITIVE_INFINITY,
      max: Number.NEGATIVE_INFINITY,
      precipitation: 0,
      rainAmount: 0,
      code: entry.data.symbol_code ?? 0,
      symbolHourDistance: Number.POSITIVE_INFINITY,
    };
    current.min = Math.min(current.min, Number(entry.data.air_temperature ?? current.min));
    current.max = Math.max(current.max, Number(entry.data.air_temperature ?? current.max));
    current.precipitation = Math.max(current.precipitation, Number(entry.data.probability_of_precipitation ?? 0));
    current.rainAmount += Number(entry.data.precipitation_amount_mean ?? 0);
    const hourDistance = Math.abs(localHour - 12);
    if (hourDistance < current.symbolHourDistance) {
      current.code = Number(entry.data.symbol_code ?? current.code);
      current.symbolHourDistance = hourDistance;
    }
    dayMap.set(key, current);
  });
  return [...dayMap.values()]
    .map((day) => ({
      date: day.date,
      min: Math.round(Number.isFinite(day.min) ? day.min : 0),
      max: Math.round(Number.isFinite(day.max) ? day.max : 0),
      precipitation: Math.round(day.precipitation),
      rainAmount: Number(day.rainAmount.toFixed(1)),
      code: day.code,
    }))
      .slice(0, 7);
}

function estimateSoilTemperatureAtFiveCm(days, location) {
  if (!Array.isArray(days) || !days.length) {
    return null;
  }

  const latitude = clamp(Number(location?.latitude) || 55.605, -66, 66);
  const means = days.map((day) => (Number(day.min) + Number(day.max)) / 2).filter(Number.isFinite);
  if (!means.length) {
    return null;
  }

  const baseInitial =
    means.slice(0, Math.min(means.length, 3)).reduce((sum, value, index) => sum + value * (index === 0 ? 0.5 : 0.25), 0)
    / (means.length === 1 ? 0.5 : means.length === 2 ? 0.75 : 1);

  let seasonalBase = baseInitial;
  let surfaceTemp = baseInitial;
  let soilTemp = baseInitial;
  let moisture = 0.18;
  let previousMean = means[0];

  days.slice(0, 7).forEach((day, index) => {
    const mean = (Number(day.min) + Number(day.max)) / 2;
    const range = Math.max(0, Number(day.max) - Number(day.min));
    const cloudFactor = getWeatherCloudFactor(day.code);
    const daylightFraction = estimateDaylightFraction(day.date, latitude);
    const rainAmount = Math.max(0, Number(day.rainAmount) || 0);

    moisture = Math.min(1, moisture * 0.55 + rainAmount / 12);
    seasonalBase = index === 0 ? mean : (seasonalBase * 0.9 + mean * 0.1);

    const solarGain = 2.6 * daylightFraction * cloudFactor * Math.sqrt(range);
    const nightCooling = 1.15 * (1 - cloudFactor) * Math.max(0, mean - Number(day.min));
    const rainCooling = 0.9 * Math.log1p(rainAmount) + 1.6 * moisture;
    const trend = index === 0 ? 0 : 0.35 * (mean - previousMean);

    const equilibrium =
      seasonalBase
      + 0.55 * (mean - seasonalBase)
      + solarGain
      - nightCooling
      - rainCooling
      + trend;

    const surfaceResponse = clamp(0.28 + 0.08 * cloudFactor * daylightFraction - 0.08 * moisture, 0.16, 0.4);
    surfaceTemp += surfaceResponse * (equilibrium - surfaceTemp);

    const soilResponse = clamp(0.1 + 0.05 * cloudFactor * daylightFraction - 0.04 * moisture, 0.06, 0.18);
    soilTemp += soilResponse * (surfaceTemp - soilTemp);
    previousMean = mean;
  });

  return clamp(soilTemp, -5, 30);
}

function getWeatherCloudFactor(code) {
  if ([1].includes(code)) return 1;
  if ([2, 3, 4].includes(code)) return 0.78;
  if ([5].includes(code)) return 0.52;
  if ([6, 7].includes(code)) return 0.3;
  if ([8, 9, 10, 11, 15, 16, 17, 24, 25].includes(code)) return 0.18;
  if ([12, 13, 14, 18, 19, 20, 21, 22, 23, 26, 27].includes(code)) return 0.12;
  return 0.45;
}

function estimateDaylightFraction(dateString, latitude) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return 0.5;
  }

  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date - startOfYear;
  const dayOfYear = Math.floor(diff / 86400000);
  const declination = 23.44 * Math.sin(((360 / 365) * (dayOfYear - 81)) * (Math.PI / 180));
  const latRad = latitude * (Math.PI / 180);
  const declRad = declination * (Math.PI / 180);
  const hourAngleInput = clamp(-Math.tan(latRad) * Math.tan(declRad), -1, 1);
  const hourAngle = Math.acos(hourAngleInput);
  const daylightHours = (24 / Math.PI) * hourAngle;

  return clamp(daylightHours / 24, 0.2, 0.8);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getCachedWeatherLocation() {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEYS.weatherLocation);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!Number.isFinite(parsed.latitude) || !Number.isFinite(parsed.longitude)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function cacheWeatherLocation(location) {
  try {
    window.localStorage?.setItem(STORAGE_KEYS.weatherLocation, JSON.stringify(location));
  } catch {
    // Ignore localStorage failures and fall back to asking again later.
  }
  queuePersistUserDataSnapshot();
}

function isLegacyFallbackWeatherLocation(location, fallback) {
  if (!location) {
    return false;
  }
  const sameCoordinates =
    Math.abs(Number(location.latitude) - Number(fallback.latitude)) < 0.0001
    && Math.abs(Number(location.longitude) - Number(fallback.longitude)) < 0.0001;
  return sameCoordinates && String(location.name ?? "").trim().toLowerCase() === "malmö";
}

function hasSpecificLocationName(name) {
  const normalized = String(name ?? "").trim().toLowerCase();
  return Boolean(normalized) && !["nuvarande plats", "sverige"].includes(normalized);
}

async function resolveNearestSmhiLocationName(location) {
  try {
    const response = await fetch("https://opendata-download-metobs.smhi.se/api/version/latest/parameter/19.json");
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const nearest = (data.station ?? [])
      .filter((station) => station.active)
      .map((station) => ({
        name: sanitizeSmhiStationName(station.name),
        distanceKm: getDistanceKm(location.latitude, location.longitude, station.latitude, station.longitude),
      }))
      .sort((left, right) => left.distanceKm - right.distanceKm)[0];
    return nearest?.name ?? null;
  } catch {
    return null;
  }
}

async function resolveLocationName(location) {
  const communityName = await reverseGeocodeCommunity(location);
  if (communityName) {
    return communityName;
  }
  return resolveNearestSmhiLocationName(location);
}

async function reverseGeocodeCommunity(location) {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.latitude}` +
      `&lon=${location.longitude}&zoom=14&accept-language=sv`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const address = data.address ?? {};
    const candidates = [
      address.city,
      address.town,
      address.village,
      address.hamlet,
      address.suburb,
      address.municipality,
      address.county,
    ];
    return candidates.find((value) => String(value ?? "").trim()) ?? null;
  } catch {
    return null;
  }
}

function sanitizeSmhiStationName(name) {
  return String(name ?? "")
    .replace(/\s+Flygplats$/i, "")
    .replace(/\s+Frösön\s+Flygplats$/i, "")
    .replace(/\s+Aut$/i, "")
    .replace(/\s+A$/i, "")
    .trim();
}

function hasRequestedWeatherLocation() {
  try {
    return window.localStorage?.getItem(STORAGE_KEYS.weatherLocationRequested) === "true";
  } catch {
    return false;
  }
}

function markWeatherLocationRequested() {
  try {
    window.localStorage?.setItem(STORAGE_KEYS.weatherLocationRequested, "true");
  } catch {
    // Ignore storage failures and allow another prompt next time.
  }
  queuePersistUserDataSnapshot();
}

function getCachedFrostWindow(location) {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEYS.frostWindow);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    const cacheKey = getFrostCacheKey(location);
    if (parsed.cacheKey !== cacheKey) {
      return null;
    }
    if (parsed.provider !== "smhi") {
      return null;
    }
    if (!Number.isFinite(parsed.lastSpringWeek) || !Number.isFinite(parsed.firstAutumnWeek)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function cacheFrostWindow(location, frostWindow) {
  try {
    window.localStorage?.setItem(STORAGE_KEYS.frostWindow, JSON.stringify({
      ...frostWindow,
      provider: "smhi",
      cacheKey: getFrostCacheKey(location),
      cachedAt: new Date().toISOString(),
    }));
  } catch {
    // Ignore storage failures.
  }
  queuePersistUserDataSnapshot();
}

function getFrostCacheKey(location) {
  return `${Number(location.latitude).toFixed(2)}:${Number(location.longitude).toFixed(2)}`;
}

async function fetchHistoricalFrostWindow(location) {
  const endYear = currentYear - 1;
  const startYear = endYear - 9;
  const station = await findNearestSmhiFrostStation(location, startYear, endYear);
  if (!station?.dataUrl) {
    return null;
  }
  const response = await fetch(station.dataUrl);
  if (!response.ok) {
    throw new Error("historical frost fetch failed");
  }
  const csv = await response.text();
  const rows = parseSmhiDailyMinimumRows(csv, startYear, endYear);
  const perYear = new Map();
  rows.forEach(({ date, minTemp }) => {
    if (!Number.isFinite(minTemp) || minTemp > 0) {
      return;
    }
    const year = date.getUTCFullYear();
    if (!perYear.has(year)) {
      perYear.set(year, { spring: null, autumn: null });
    }
    const dayOfYear = getDayOfYear(date);
    const entry = perYear.get(year);
    if (dayOfYear <= 212) {
      entry.spring = date;
    } else if (!entry.autumn) {
      entry.autumn = date;
    }
  });
  const springWeeks = [];
  const autumnWeeks = [];
  [...perYear.values()].forEach((entry) => {
    if (entry.spring) {
      springWeeks.push(getISOWeek(entry.spring));
    }
    if (entry.autumn) {
      autumnWeeks.push(getISOWeek(entry.autumn));
    }
  });
  if (!springWeeks.length && !autumnWeeks.length) {
    return null;
  }
  return {
    sourceLabel: `${startYear}-${endYear}, SMHI ${station.name}`,
    stationName: station.name,
    lastSpringWeek: springWeeks.length ? Math.round(getMedian(springWeeks)) : 20,
    firstAutumnWeek: autumnWeeks.length ? Math.round(getMedian(autumnWeeks)) : 40,
    springRiskStartWeek: springWeeks.length ? Math.round(getPercentile(springWeeks, 0.25)) : 19,
    springRiskEndWeek: springWeeks.length ? Math.round(getPercentile(springWeeks, 0.75)) : 21,
    autumnRiskStartWeek: autumnWeeks.length ? Math.round(getPercentile(autumnWeeks, 0.25)) : 39,
    autumnRiskEndWeek: autumnWeeks.length ? Math.round(getPercentile(autumnWeeks, 0.75)) : 41,
  };
}

async function findNearestSmhiFrostStation(location, startYear, endYear) {
  const response = await fetch("https://opendata-download-metobs.smhi.se/api/version/latest/parameter/19.json");
  if (!response.ok) {
    throw new Error("SMHI station list fetch failed");
  }
  const data = await response.json();
  const startMillis = Date.UTC(startYear, 0, 1);
  const endMillis = Date.UTC(endYear, 11, 31, 23, 59, 59);
  const candidates = (data.station ?? [])
    .filter((station) => station.active && station.from <= startMillis && station.to >= endMillis)
    .map((station) => ({
      ...station,
      distanceKm: getDistanceKm(location.latitude, location.longitude, station.latitude, station.longitude),
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .slice(0, 10);

  for (const candidate of candidates) {
    const stationResponse = await fetch(candidate.link?.find((link) => link.type === "application/json")?.href ?? "");
    if (!stationResponse.ok) {
      continue;
    }
    const stationData = await stationResponse.json();
    const correctedArchive = stationData.period?.find((period) => period.key === "corrected-archive");
    const dataUrl = correctedArchive?.link?.find((link) => link.type === "application/json")?.href
      ?.replace(/\.json$/, "/data.csv");
    if (dataUrl) {
      return {
        id: candidate.id,
        name: candidate.name,
        distanceKm: candidate.distanceKm,
        dataUrl,
      };
    }
  }

  return null;
}

function parseSmhiDailyMinimumRows(csv, startYear, endYear) {
  const lines = csv.split(/\r?\n/);
  const dataHeaderIndex = lines.findIndex((line) => line.startsWith("Från Datum Tid (UTC);"));
  if (dataHeaderIndex === -1) {
    return [];
  }
  return lines
    .slice(dataHeaderIndex + 1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(";"))
    .filter((columns) => /^\d{4}-\d{2}-\d{2}$/.test(columns[2] ?? ""))
    .map((columns) => ({
      date: new Date(`${columns[2]}T00:00:00Z`),
      minTemp: Number((columns[3] ?? "").replace(",", ".")),
      quality: columns[4] ?? "",
    }))
    .filter((row) => row.date.getUTCFullYear() >= startYear && row.date.getUTCFullYear() <= endYear && row.quality !== "R");
}

function getMedian(values) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) {
    return 0;
  }
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function getPercentile(values, percentile) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) {
    return 0;
  }
  const index = (sorted.length - 1) * percentile;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  if (lowerIndex === upperIndex) {
    return sorted[lowerIndex];
  }
  const weight = index - lowerIndex;
  return sorted[lowerIndex] * (1 - weight) + sorted[upperIndex] * weight;
}

function getDayOfYear(date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date - start;
  return Math.floor(diff / 86400000);
}

function isFrostWeek(week) {
  const frostWindow = getRenderableFrostWindow();
  if (!frostWindow) {
    return false;
  }
  return week <= frostWindow.lastSpringWeek || week >= frostWindow.firstAutumnWeek;
}

function isFrostRiskWeek(week) {
  const frostWindow = getRenderableFrostWindow();
  if (!frostWindow) {
    return false;
  }
  const inSpringBand =
    week >= (frostWindow.springRiskStartWeek ?? frostWindow.lastSpringWeek)
    && week <= (frostWindow.springRiskEndWeek ?? frostWindow.lastSpringWeek);
  const inAutumnBand =
    week >= (frostWindow.autumnRiskStartWeek ?? frostWindow.firstAutumnWeek)
    && week <= (frostWindow.autumnRiskEndWeek ?? frostWindow.firstAutumnWeek);
  return inSpringBand || inAutumnBand;
}

function getFrostWeekTitle(week) {
  const frostWindow = getRenderableFrostWindow();
  if (!frostWindow) {
    return `Vecka ${week}`;
  }
  if (isFrostRiskWeek(week)) {
    return `Vecka ${week} · övergångszon för frost, centrala 50 % av de senaste 10 åren (${frostWindow.sourceLabel})`;
  }
  const inSpring = week <= frostWindow.lastSpringWeek;
  const inAutumn = week >= frostWindow.firstAutumnWeek;
  if (inSpring || inAutumn) {
    return `Vecka ${week} · historisk frostrisk (${frostWindow.sourceLabel})`;
  }
  return `Vecka ${week}`;
}

function getRenderableFrostWindow() {
  if (state.frostWindow?.lastSpringWeek && state.frostWindow?.firstAutumnWeek) {
    return state.frostWindow;
  }
  return null;
}

function describeWeatherCode(weatherData) {
  const symbolCode = typeof weatherData === "number" ? weatherData : Number(weatherData?.symbol_code ?? 0);
  const labels = {
    1: "Klart",
    2: "Nästan klart",
    3: "Växlande molnighet",
    4: "Halvklart",
    5: "Molnigt",
    6: "Mulet",
    7: "Dimma",
    8: "Lätta regnskurar",
    9: "Regnskurar",
    10: "Kraftiga regnskurar",
    11: "Åskskurar",
    12: "Lätta snöbyar",
    13: "Snöbyar",
    14: "Kraftiga snöbyar",
    15: "Lätt regn",
    16: "Regn",
    17: "Kraftigt regn",
    18: "Lätt snöblandat regn",
    19: "Snöblandat regn",
    20: "Kraftigt snöblandat regn",
    21: "Lätt snöfall",
    22: "Snöfall",
    23: "Kraftigt snöfall",
    24: "Lätt regn med åska",
    25: "Regn med åska",
    26: "Snöblandat regn med åska",
    27: "Snöfall med åska",
  };
  return labels[symbolCode] ?? "Väderprognos";
}

function getWeatherIconMarkup(code) {
  const icon = getWeatherIconName(code);
  const color = icon === "sun" || icon === "partly" ? "#d6a64a" : "#6e8f96";

  const common = `class="weather-icon-svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`;

  if (icon === "sun") {
    return `<svg ${common} aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3L5.5 5.5"></path></svg>`;
  }

  if (icon === "partly") {
    return `<svg ${common} aria-hidden="true"><circle cx="8" cy="8.5" r="3.2"></circle><path d="M8 3.2v1.5M8 12.3v1.5M13.3 8.5h1.5M1.2 8.5h1.5M11.5 5l1 1M3.5 12l1-1"></path><path d="M8.5 18.5h8a3.5 3.5 0 0 0 0-7 5.2 5.2 0 0 0-9.7 1.7A2.8 2.8 0 0 0 8.5 18.5Z"></path></svg>`;
  }

  if (icon === "cloud") {
    return `<svg ${common} aria-hidden="true"><path d="M7.8 18.5h8.9a3.8 3.8 0 0 0 .2-7.6 5.6 5.6 0 0 0-10.6 1.7 3.2 3.2 0 0 0 1.5 5.9Z"></path></svg>`;
  }

  if (icon === "fog") {
    return `<svg ${common} aria-hidden="true"><path d="M6.8 10.8h10.4a3.1 3.1 0 0 0 .1-6.2 4.7 4.7 0 0 0-8.9 1.5 2.7 2.7 0 0 0-1.6 4.7Z"></path><path d="M4 15.2h16M6 18.5h12"></path></svg>`;
  }

  if (icon === "rain") {
    return `<svg ${common} aria-hidden="true"><path d="M7.8 13.4h8.9a3.8 3.8 0 0 0 .2-7.6 5.6 5.6 0 0 0-10.6 1.7 3.2 3.2 0 0 0 1.5 5.9Z"></path><path d="M9 16.8l-1 2.1M13 16.8l-1 2.1M17 16.8l-1 2.1"></path></svg>`;
  }

  if (icon === "storm") {
    return `<svg ${common} aria-hidden="true"><path d="M7.8 13.1h8.9a3.8 3.8 0 0 0 .2-7.6 5.6 5.6 0 0 0-10.6 1.7 3.2 3.2 0 0 0 1.5 5.9Z"></path><path d="m12 14.8-2 3.8h2.3l-1 3.4 3.7-5.1h-2.4l1.4-2.1"></path></svg>`;
  }

  if (icon === "snow") {
    return `<svg ${common} aria-hidden="true"><path d="M7.8 13.3h8.9a3.8 3.8 0 0 0 .2-7.6 5.6 5.6 0 0 0-10.6 1.7 3.2 3.2 0 0 0 1.5 5.9Z"></path><path d="M9.2 17.2h0M14 17.2h0M11.6 20h0"></path><path d="M9.2 16v2.4M8 16.6l2.4 1.2M10.4 16.6 8 17.8M14 16v2.4M12.8 16.6l2.4 1.2M15.2 16.6l-2.4 1.2M11.6 18.8v2.4M10.4 19.4l2.4 1.2M12.8 19.4l-2.4 1.2"></path></svg>`;
  }

  return `<svg ${common} aria-hidden="true"><path d="M8.5 18.5h8a3.5 3.5 0 0 0 0-7 5.2 5.2 0 0 0-9.7 1.7A2.8 2.8 0 0 0 8.5 18.5Z"></path></svg>`;
}

function getWeatherIconName(code) {
  if ([1].includes(code)) return "sun";
  if ([2, 3, 4].includes(code)) return "partly";
  if ([5, 6].includes(code)) return "cloud";
  if ([7].includes(code)) return "fog";
  if ([8, 9, 10, 15, 16, 17, 18, 19, 20].includes(code)) return "rain";
  if ([11, 24, 25, 26, 27].includes(code)) return "storm";
  if ([12, 13, 14, 21, 22, 23].includes(code)) return "snow";
  return "cloud";
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const toRadians = (value) => value * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function appendUtilizationBlock(track, crop, startWeek, endWeek, minWeek, laneIndex) {
  const block = document.createElement("button");
  block.type = "button";
  block.className = "timeline-utilization-block";
  block.style.left = `${getTimelineX(startWeek, minWeek)}px`;
  block.style.width = `${Math.max((endWeek - startWeek + 1) * 36 - 6, 30)}px`;
  block.style.top = `${10 + laneIndex * 24}px`;
  block.innerHTML = `
    <span>${escapeHtml(crop.title)}</span>
    <small>${formatArea(crop.area ?? 0)} m²</small>
  `;
  if (isCropActiveNow(crop)) {
    block.classList.add("is-active");
  }
  block.addEventListener("click", () => openDialog(crop.id));
  track.appendChild(block);
}

function getFieldName(fieldId) {
  return state.fields.find((field) => field.id === fieldId)?.name ?? fieldId;
}

function getFieldPlacementName(fieldId) {
  const field = state.fields.find((item) => item.id === fieldId);
  if (!field) {
    return fieldId;
  }
  const sectionName = getSectionDisplayName(field.sectionId);
  return sectionName ? `${field.name} (${sectionName})` : field.name;
}

function isSchedulingField(field) {
  return field?.type === "bed";
}

function getSectionName(sectionId) {
  return getSectionDisplayName(sectionId, state.activeYear);
}

function getSectionDisplayName(sectionOrId, year = state.activeYear) {
  const section = typeof sectionOrId === "string"
    ? state.sections.find((item) => item.id === sectionOrId)
    : sectionOrId;
  return section?.name ?? "Skifte";
}

function findSectionByDisplayName(displayName, year = state.activeYear) {
  const normalizedName = String(displayName ?? "").trim().toLowerCase();
  if (!normalizedName) {
    return null;
  }
  return state.sections.find((section) => getSectionDisplayName(section, year).trim().toLowerCase() === normalizedName) ?? null;
}

function getSectionDisplayFamily(sectionOrId, year = state.activeYear) {
  const section = typeof sectionOrId === "string"
    ? state.sections.find((item) => item.id === sectionOrId)
    : sectionOrId;
  if (!section) {
    return "";
  }

  const rotationSections = [...state.sections]
    .filter((item) => item.rotationEnabled !== false && item.rotationOrder != null)
    .sort((left, right) => (left.rotationOrder ?? Number.MAX_SAFE_INTEGER) - (right.rotationOrder ?? Number.MAX_SAFE_INTEGER) || left.name.localeCompare(right.name, "sv"));

  if (rotationSections.length < 2 || !rotationSections.some((item) => item.id === section.id)) {
    return section.family ?? "";
  }

  const currentIndex = rotationSections.findIndex((item) => item.id === section.id);
  if (currentIndex < 0) {
    return section.family ?? "";
  }

  const offset = ((((year ?? state.activeYear) - currentYear) % rotationSections.length) + rotationSections.length) % rotationSections.length;
  const rotatedSource = rotationSections[(currentIndex + offset) % rotationSections.length];
  return String(rotatedSource?.family ?? "").trim();
}

function getSectionFamilyOptions() {
  const options = new Map();
  getAllSeedItems().forEach((item) => {
    const family = String(item.family ?? "").trim();
    if (!family) {
      return;
    }
    const key = family.toLocaleLowerCase("sv");
    if (!options.has(key)) {
      options.set(key, family);
    }
  });
  return [...options.values()].sort((left, right) => left.localeCompare(right, "sv"));
}

function renderSectionFamilyOptions(filterValue = "") {
  if (!elements.sectionFamilyOptions) {
    return;
  }
  if (Date.now() < (state.sectionFamilyMenuSuppressedUntil ?? 0)) {
    hideSectionFamilyOptions();
    return;
  }
  const normalizedFilter = String(filterValue ?? "").trim().toLocaleLowerCase("sv");
  const options = getSectionFamilyOptions()
    .filter((family) => !normalizedFilter || family.toLocaleLowerCase("sv").includes(normalizedFilter));

  if (!options.length) {
    elements.sectionFamilyOptions.innerHTML = `<div class="combo-field__empty">Inga familjer att välja.</div>`;
    elements.sectionFamilyOptions.removeAttribute("hidden");
    return;
  }

  elements.sectionFamilyOptions.innerHTML = options
    .map((family) => `<button class="combo-field__option" type="button" data-family-option="${escapeHtml(family)}">${escapeHtml(family)}</button>`)
    .join("");
  elements.sectionFamilyOptions.removeAttribute("hidden");
}

function getSectionRotationSummary(section) {
  if (!section?.rotationEnabled) {
    return "ingår inte";
  }
  return section.rotationOrder ? `följd ${section.rotationOrder}` : "ingår";
}

function findSectionIdByNameInList(name, sections) {
  const normalized = String(name ?? "").trim().toLowerCase();
  return sections.find((section) => section.name.toLowerCase() === normalized)?.id ?? null;
}

function normalizeSection(section) {
  const normalized = cloneValue(section);
  normalized.family = String(normalized.family ?? "").trim();
  normalized.rotationEnabled = normalized.rotationEnabled !== false;
  normalized.rotationOrder = toNumber(normalized.rotationOrder);
  return normalized;
}

function findFieldIdByName(name) {
  const normalized = name.trim().toLowerCase();
  return state.fields.find((field) => field.name.toLowerCase() === normalized)?.id ?? null;
}

function getUniqueSeedCrops(prefix = "") {
  const normalizedPrefix = prefix.trim().toLowerCase();
  return [...new Set(getAllSeedItems().map((item) => item.crop).filter(Boolean))]
    .filter((crop) => !normalizedPrefix || crop.toLowerCase().startsWith(normalizedPrefix))
    .sort((a, b) => a.localeCompare(b, "sv"));
}

function renderPlanningCropOptions(prefix = "") {
  if (!elements.planningCrop) {
    return;
  }
  const cropNames = getUniqueSeedCrops();
  const selectedCrop = elements.planningCrop.value || prefix || cropNames[0] || "";
  if (!cropNames.length) {
    elements.planningCrop.innerHTML = `<option value="">Inga grödor i databasen än</option>`;
    elements.planningCrop.disabled = true;
    return;
  }
  elements.planningCrop.disabled = false;
  elements.planningCrop.innerHTML = cropNames
    .map((crop) => `<option value="${escapeHtml(crop)}" ${crop === selectedCrop ? "selected" : ""}>${escapeHtml(crop)}</option>`)
    .join("");
  if (!elements.planningCrop.value) {
    elements.planningCrop.value = selectedCrop;
  }
}

function resolvePlanningSeed({ allowSingleVariety = false } = {}) {
  const cropValue = elements.planningCrop?.value.trim() ?? "";
  const varietyValue = elements.planningVariety?.value.trim().toLocaleLowerCase("sv") ?? "";
  const selectedStockId = elements.planningSeedStock?.value ?? "";
  if (selectedStockId && selectedStockId !== PLANNING_STOCK_NONE) {
    const stockEntry = state.seedStockEntries.find((entry) => entry.id === selectedStockId);
    const stockSeed = stockEntry ? getSeedItemById(stockEntry.seedId) : null;
    if (stockSeed && (!cropValue || stockSeed.crop === cropValue)) {
      elements.planningSeedId.value = stockSeed.id;
      return stockSeed;
    }
  }
  if (!cropValue) {
    elements.planningSeedId.value = "";
    return null;
  }
  const exactMatches = getAllSeedItems().filter((item) => item.crop === cropValue);
  const prioritizedMatches = exactMatches.sort((left, right) => {
    const leftScore = left.id.startsWith("personal-") ? 1 : 0;
    const rightScore = right.id.startsWith("personal-") ? 1 : 0;
    return rightScore - leftScore;
  });
  const exact = varietyValue
    ? prioritizedMatches.find((item) => String(item.variety ?? "").trim().toLocaleLowerCase("sv") === varietyValue)
      ?? prioritizedMatches.find((item) => String(item.cropSort ?? "").trim().toLocaleLowerCase("sv").includes(varietyValue))
      ?? null
    : (allowSingleVariety ? prioritizedMatches[0] : prioritizedMatches[0]) ?? null;
  elements.planningSeedId.value = exact?.id ?? "";
  return exact;
}

function syncPlanningSeedSelection({ resetVarietyOnCropChange = false } = {}) {
  const cropValue = elements.planningCrop?.value.trim() ?? "";
  const previousSeedId = elements.planningSeedId?.value ?? "";
  renderPlanningCropOptions(cropValue);
  if (resetVarietyOnCropChange && !getAllSeedItems().some((item) => item.crop === cropValue)) {
    elements.planningVariety.value = "";
  }
  const seed = resolvePlanningSeed({ allowSingleVariety: true });
  if ((seed?.id ?? "") !== previousSeedId) {
    resetPlanningSowingAdjustments();
  }
  if (seed) {
    fillPlanningFormFromSeed(seed);
    renderCropFamilyVisual(elements.planningDialog, seed.id);
  } else {
    renderCropFamilyVisualByFamily(elements.planningDialog, "");
  }
  updatePlanningFieldChipState();
  renderPlanningSeedStockOptions(seed);
  renderPlanningDerivedUi(seed);
  renderPlanningCapacity();
}

function renderCropFamilyVisual(container, seedId) {
  const family = getSeedItemById(seedId)?.family ?? "";
  renderCropFamilyVisualByFamily(container, family);
}

function renderCropFamilyVisualByFamily(container, familyValue) {
  const visual = container?.querySelector(".planning-visual");
  const cropElement = container?.querySelector(".planning-visual__crop");
  if (!visual || !cropElement) {
    return;
  }
  const isSeedDialog = container?.id === "seed-dialog";
  const normalizedFamily = String(familyValue ?? "").trim();
  if (isSeedDialog && !normalizedFamily) {
    visual.dataset.family = "empty";
    visual.classList.remove("planning-visual--image");
    cropElement.dataset.family = "empty";
    cropElement.classList.remove("planning-visual__crop--image");
    cropElement.style.background = "";
    return;
  }
  const familyMeta = getCropFamilyVisualMeta(familyValue);
  visual.dataset.family = familyMeta.fallback;
  visual.classList.toggle("planning-visual--image", Boolean(familyMeta.path));
  cropElement.dataset.family = familyMeta.fallback;
  cropElement.classList.toggle("planning-visual__crop--image", Boolean(familyMeta.path));
  cropElement.style.background = familyMeta.path ? `center center / cover no-repeat url("${familyMeta.path}")` : "";
}

function getCropFamilyVisualMeta(familyValue) {
  const normalized = normalizeFamilyVisualKey(familyValue);
  if (normalized.includes("korg")) {
    return FAMILY_VISUALS.korgblommiga;
  }
  if (normalized.includes("flock")) {
    return FAMILY_VISUALS.flockblommiga;
  }
  if (normalized.includes("kal") || normalized.includes("kors") || normalized.includes("brassic")) {
    return FAMILY_VISUALS.kalvaxter;
  }
  if (normalized.includes("mall")) {
    return FAMILY_VISUALS.mallvaxter;
  }
  if (normalized.includes("lok")) {
    return FAMILY_VISUALS.lokvaxter;
  }
  if (normalized.includes("art") || normalized.includes("balj") || normalized.includes("bona")) {
    return FAMILY_VISUALS.artvaxter;
  }
  if (normalized.includes("gurk")) {
    return FAMILY_VISUALS.gurkvaxter;
  }
  if (normalized.includes("potatis") || normalized.includes("tomat") || normalized.includes("paprika") || normalized.includes("nattskugg")) {
    return FAMILY_VISUALS.potatisvaxter;
  }
  if (normalized.includes("ort")) {
    return FAMILY_VISUALS.ortvaxter;
  }
  if (normalized.includes("grongod") || normalized.includes("gronsod") || normalized.includes("grongods")) {
    return FAMILY_VISUALS.grongodsling;
  }
  if (normalized.includes("sallat") || normalized.includes("blad")) {
    return { path: "", fallback: "blad" };
  }
  return { path: "", fallback: "default" };
}

function normalizeFamilyVisualKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function tryRepairMojibake(value) {
  const raw = String(value ?? "");
  if (!/[ÃÂ]/.test(raw) || typeof TextDecoder === "undefined") {
    return raw;
  }
  try {
    const bytes = Uint8Array.from(Array.from(raw, (char) => char.charCodeAt(0) & 0xff));
    const repaired = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return repaired.includes("\ufffd") ? raw : repaired;
  } catch {
    return raw;
  }
}

function normalizeSeedColumnLabel(label) {
  return tryRepairMojibake(label)
    .trim()
    .toLowerCase()
    .replace(/[²]/g, "2")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function getSeedRowValue(row, label) {
  if (!row || typeof row !== "object") {
    return "";
  }
  if (label in row) {
    return row[label];
  }
  const normalizedLabel = normalizeSeedColumnLabel(label);
  for (const [key, value] of Object.entries(row)) {
    if (normalizeSeedColumnLabel(key) === normalizedLabel) {
      return typeof value === "string" ? tryRepairMojibake(value) : value;
    }
  }
  return "";
}

function getFirstSeedRowValue(row, labels) {
  for (const label of labels) {
    const value = getSeedRowValue(row, label);
    if (value !== "" && value != null) {
      return value;
    }
  }
  return "";
}

function normalizeSeedItem(item) {
  const normalized = cloneValue(item);
  normalized.schedule ??= {};
  normalized.family ??= "";
  normalized.latinFamily ??= "";
  normalized.crop ??= "";
  normalized.method ??= inferSeedMethod(normalized);
  normalized.cropSort = normalized.cropSort || [normalized.crop, normalized.variety].filter(Boolean).join(", ");
  normalized.expirationYear ??= "";
  normalized.cultureTime ??= "";
  normalized.field ??= "";
  normalized.seedPer75 ??= "";
  normalized.seedPerM2 ??= "";
  normalized.harvestInterval = toNumber(normalized.harvestInterval);
  normalized.m2odlat ??= "";
  normalized.rows ??= "";
  normalized.spacing ??= "";
  normalized.rowSpacing ??= "";
  normalized.seedInStock ??= "";
  normalized.stockId ??= "";
  normalized.globalSeedId ??= "";
  normalizeSeedSchedule(normalized.schedule);
  normalized.method = normalized.method || inferSeedMethod(normalized);
  normalized.seedPerM2 = computeSeedPerM2(normalized);
  normalized.seedToPlant = computeSeedToPlant(normalized);
  normalized.purchase = computePurchase(normalized);
  return normalized;
}

function normalizeSeedSchedule(schedule) {
  schedule.forsaddStart = toNumber(schedule.forsaddStart);
  schedule.forsaddEnd = toNumber(schedule.forsaddEnd);
  schedule.directStart = toNumber(schedule.directStart);
  schedule.directEnd = toNumber(schedule.directEnd);
  schedule.harvestStart = toNumber(schedule.harvestStart);
  schedule.harvestEnd = toNumber(schedule.harvestEnd);
  const legacyTransplant = toNumber(schedule.transplant);
  schedule.transplantStart = toNumber(schedule.transplantStart) ?? legacyTransplant;
  schedule.transplantEnd = toNumber(schedule.transplantEnd) ?? legacyTransplant;
  schedule.transplant = getRecommendedWeek(schedule.transplantStart, schedule.transplantEnd);
}

function inferSeedMethod(seedItem) {
  const schedule = seedItem?.schedule ?? {};
  const hasPresow = Boolean(schedule.forsaddStart || schedule.forsaddEnd || schedule.transplant || schedule.transplantStart || schedule.transplantEnd);
  const hasDirect = Boolean(schedule.directStart || schedule.directEnd);
  if (hasPresow && hasDirect) {
    return "Försådd+Direktsådd";
  }
  if (hasPresow) {
    return "Försådd";
  }
  if (hasDirect) {
    return "Direktsådd";
  }
  return "";
}

function normalizeField(field) {
  const normalized = cloneValue(field);
  const useLegacyPercentCoordinates = typeof normalized.plotWidth === "number" || typeof normalized.plotHeight === "number";
  normalized.type ??= normalized.name?.toLowerCase().includes("växthus") ? "greenhouse" : "bed";
  if (normalized.beds?.length) {
    normalized.rows ??= normalized.beds.length;
    if (!normalized.width && normalized.beds[0]?.width) {
      normalized.width = normalized.beds[0].width * normalized.rows;
    }
    if (!normalized.length && normalized.beds[0]?.length) {
      normalized.length = normalized.beds[0].length;
    }
  }
  normalized.rows ??= 1;
  normalized.description ??= "Bädd";
  normalized.width ??= normalized.type === "tree" ? 1.1 : normalized.type === "house" ? 6 : normalized.type === "hedge" ? 0.5 : normalized.type === "fence" || normalized.type === "wall" ? 0.5 : 0.75;
  normalized.length ??= normalized.type === "tree" ? 1.1 : normalized.type === "house" ? 8 : normalized.type === "greenhouse" ? 9 : normalized.type === "hedge" ? 10 : 12;
  if (normalized.type === "bed") {
    normalized.sectionId ??= "skifte-1";
  } else {
    normalized.sectionId = null;
  }
  normalized.rotation = normalizeRotation(normalized.rotation ?? 0);
  normalized.x = normalizeFieldCoordinate(normalized.x, FIELD_CANVAS_WIDTH, 80, useLegacyPercentCoordinates);
  normalized.y = normalizeFieldCoordinate(normalized.y, FIELD_CANVAS_HEIGHT, 80, useLegacyPercentCoordinates);
  return normalized;
}

function normalizeCrop(crop) {
  const normalized = cloneValue(crop);
  const fieldMap = {
    "skifte-1": "badd-1",
    "skifte-2": "badd-2",
    vaxthus: "badd-4",
  };
  normalized.fieldIds = (normalized.fieldIds ?? []).map((fieldId) => fieldMap[fieldId] ?? fieldId);
  normalized.area ??= estimateCropArea(normalized);
  normalized.schedule ??= {};
  normalizeSeedSchedule(normalized.schedule);
  normalized.startYear = toNumber(normalized.startYear) ?? currentYear;
  normalized.endYear = toNumber(normalized.endYear) ?? inferCropEndYear(normalized);
  return normalized;
}

function normalizeSeedInventoryEntry(entry = {}) {
  const normalized = cloneValue(entry);
  normalized.year = toNumber(normalized.year) ?? currentYear;
  normalized.seedId = String(normalized.seedId ?? "").trim();
  normalized.manualKey = String(normalized.manualKey ?? "").trim();
  normalized.manual = Boolean(normalized.manual || normalized.manualKey);
  normalized.key = normalized.key
    || (normalized.seedId ? getInventorySeedKey(normalized.seedId) : getInventoryManualKey(normalized.manualKey || normalized.id || `manual-${Date.now()}`));
  normalized.title = String(normalized.title ?? "").trim();
  const stockOverride = toNumber(normalized.stockOverride);
  const needOverride = toNumber(normalized.needOverride);
  normalized.stockOverride = stockOverride == null ? null : Math.max(0, Math.floor(stockOverride));
  normalized.needOverride = needOverride == null ? null : Math.max(0, Math.floor(needOverride));
  normalized.id = normalized.id || getSeedInventoryEntryId(normalized.year, normalized.key);
  return normalized;
}

function normalizeSeedStockEntry(entry = {}) {
  const normalized = cloneValue(entry);
  normalized.id = String(normalized.id ?? "").trim() || `seed-stock-${Date.now()}`;
  normalized.seedId = String(normalized.seedId ?? "").trim();
  normalized.name = String(normalized.name ?? "").trim();
  normalized.crop = String(normalized.crop ?? "").trim();
  normalized.variety = String(normalized.variety ?? "").trim();
  normalized.quantity = Math.max(0, Math.floor(toNumber(normalized.quantity) ?? 0));
  normalized.year = toNumber(normalized.year);
  normalized.expirationYear = toNumber(normalized.expirationYear);
  normalized.supplier = String(normalized.supplier ?? "").trim();
  normalized.notes = String(normalized.notes ?? "").trim();
  return normalized;
}

function normalizeEvent(event, crop = null) {
  const normalized = cloneValue(event);
  normalized.week = toNumber(normalized.week) ?? currentWeek;
  normalized.year = toNumber(normalized.year) ?? inferCropEventYear(crop, normalized.type, normalized.week);
  normalized.completed = Boolean(normalized.completed);
  normalized.moreToHarvest = typeof normalized.moreToHarvest === "boolean" ? normalized.moreToHarvest : null;
  return normalized;
}

function normalizeHarvestEntry(entry) {
  const normalized = cloneValue(entry);
  normalized.year = toNumber(normalized.year) ?? state.activeYear;
  normalized.month = toNumber(normalized.month);
  normalized.week = toNumber(normalized.week) ?? currentWeek;
  normalized.kg = Number(normalized.kg) || 0;
  normalized.area = Number(normalized.area) || 0;
  normalized.manual = Boolean(normalized.manual);
  normalized.moreToHarvest = Boolean(normalized.moreToHarvest);
  return normalized;
}

function inferCropEndYear(crop) {
  const startYear = toNumber(crop?.startYear) ?? currentYear;
  const anchorWeek = getCropAnchorWeek(crop);
  if (!anchorWeek) {
    return startYear;
  }
  const scheduleWeeks = Object.values(crop?.schedule ?? {}).filter((value) => typeof value === "number");
  return scheduleWeeks.some((week) => week < anchorWeek) ? startYear + 1 : startYear;
}

function getCropAnchorWeek(crop) {
  if (!crop?.schedule) {
    return null;
  }
  return crop.schedule.forsaddStart
    ?? crop.schedule.directStart
    ?? crop.schedule.transplantStart
    ?? crop.schedule.transplant
    ?? crop.schedule.harvestStart
    ?? crop.schedule.harvestEnd
    ?? crop.schedule.transplantEnd
    ?? crop.schedule.directEnd
    ?? crop.schedule.forsaddEnd
    ?? null;
}

function inferCropEventYear(crop, type, week) {
  if (!crop) {
    return currentYear;
  }
  const startYear = toNumber(crop.startYear) ?? currentYear;
  const endYear = toNumber(crop.endYear) ?? inferCropEndYear(crop);
  const anchorWeek = getCropAnchorWeek(crop);
  if (!week || !anchorWeek) {
    return startYear;
  }
  if (week < anchorWeek && endYear > startYear) {
    return endYear;
  }
  return startYear;
}

function getSeedValue(item, key) {
  const normalized = normalizeSeedItem(item);
  const map = {
    family: normalized.family,
    latinFamily: normalized.latinFamily,
    crop: normalized.crop,
    method: normalized.method,
    variety: normalized.variety,
    cropSort: normalized.cropSort,
    expirationYear: normalized.expirationYear,
    notes: normalized.notes,
    forsaddStart: normalized.schedule.forsaddStart,
    forsaddEnd: normalized.schedule.forsaddEnd,
    transplantStart: normalized.schedule.transplantStart,
    transplantEnd: normalized.schedule.transplantEnd,
    transplant: normalized.schedule.transplant,
    directStart: normalized.schedule.directStart,
    directEnd: normalized.schedule.directEnd,
    cultureTime: normalized.cultureTime,
    harvestStart: normalized.schedule.harvestStart,
    harvestEnd: normalized.schedule.harvestEnd,
    harvestInterval: normalized.harvestInterval,
    field: normalized.field,
    seedPer75: normalized.seedPer75,
    seedPerM2: normalized.seedPerM2,
    m2odlat: normalized.m2odlat,
    seedToPlant: normalized.seedToPlant,
    rows: normalized.rows,
    spacing: normalized.spacing,
    rowSpacing: normalized.rowSpacing,
    seedInStock: normalized.seedInStock,
    stockId: normalized.stockId,
    purchase: normalized.purchase,
  };
  return map[key] ?? "";
}

function setSeedValue(item, key, value) {
  item.schedule ??= {};
  if (key === "family" || key === "latinFamily" || key === "crop" || key === "method" || key === "variety" || key === "notes" || key === "spacing" || key === "rowSpacing" || key === "cultureTime" || key === "field" || key === "stockId") {
    item[key] = value;
  }
  if (key === "expirationYear" || key === "seedPer75" || key === "seedPerM2" || key === "m2odlat" || key === "rows" || key === "seedInStock") {
    item[key] = value;
  }
  if (key === "harvestInterval") {
    item.harvestInterval = toNumber(value);
  }
  if (key === "forsaddStart" || key === "forsaddEnd" || key === "transplantStart" || key === "transplantEnd" || key === "transplant" || key === "directStart" || key === "directEnd" || key === "harvestStart" || key === "harvestEnd") {
    item.schedule[key] = toNumber(value);
    normalizeSeedSchedule(item.schedule);
  }
  item.cropSort = [item.crop, item.variety].filter(Boolean).join(", ");
  item.seedPerM2 = computeSeedPerM2(item);
  item.seedToPlant = computeSeedToPlant(item);
  item.purchase = computePurchase(item);
}

function computeSeedPerM2(item) {
  const explicit = toNumber(item.seedPerM2);
  if (explicit != null) {
    return formatFlexibleNumber(explicit);
  }
  const seedPer75 = toNumber(item.seedPer75);
  if (!Number.isFinite(seedPer75)) {
    return "";
  }
  return formatFlexibleNumber(seedPer75 / 7.5);
}

function computeSeedToPlant(item) {
  const m2 = Number(item.m2odlat);
  const seedPerM2 = Number(computeSeedPerM2(item));
  if (!Number.isFinite(m2) || !Number.isFinite(seedPerM2)) {
    return "";
  }
  return (m2 * seedPerM2).toFixed(2);
}

function computePurchase(item) {
  const seedToPlant = Number(computeSeedToPlant(item));
  const inStock = Number(item.seedInStock);
  if (!Number.isFinite(seedToPlant) || !Number.isFinite(inStock)) {
    return "";
  }
  return (seedToPlant - inStock).toFixed(2);
}

function formatFlexibleNumber(value) {
  if (!Number.isFinite(value)) {
    return "";
  }
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function getFieldArea(fieldId) {
  const field = state.fields.find((item) => item.id === fieldId);
  if (!field) {
    return 0;
  }
  return field.width * field.length;
}

function getFieldOccupancy(fieldId) {
  const area = getFieldArea(fieldId);
  const used = state.crops
    .filter((crop) => crop.fieldIds?.includes(fieldId))
    .reduce((sum, crop) => sum + (crop.area ?? 0), 0);
  const percent = area > 0 ? Math.min((used / area) * 100, 100) : 0;
  return `${formatArea(used)} av ${formatArea(area)} m² (${percent.toFixed(0)}%)`;
}

function getFieldStatus(fieldId, week = currentWeek) {
  const area = getFieldArea(fieldId);
  const fieldCrops = state.crops.filter((crop) => crop.fieldIds?.includes(fieldId));
  const activeCrops = fieldCrops.filter((crop) => isCropActiveAtWeek(crop, week));
  const used = activeCrops.reduce((sum, crop) => sum + (crop.area ?? 0), 0);
  const percent = area > 0 ? (used / area) * 100 : 0;
  const overfilled = used > area;
  return {
    used,
    percent,
    overfilled,
    activeCrops,
    statusText: activeCrops.length
      ? `${activeCrops.length} aktiv(a) plantering(ar) vecka ${week} · ${formatArea(used)} av ${formatArea(area)} m²`
      : `Ingen aktiv plantering vecka ${week} · ${formatArea(used)} av ${formatArea(area)} m²`,
  };
}

function isCropActiveNow(crop) {
  return isCropActiveAtWeek(crop, currentWeek);
}

function isCropActiveAtWeek(crop, week) {
  const { startWeek, endWeek, startYear, endYear } = getCropOccupancyRange(crop);
  if (!startWeek || !endWeek) {
    return false;
  }
  const harvestEvent = getCropHarvestCompletionEvent(crop.id);
  if (harvestEvent && toAbsoluteWeek(harvestEvent.year ?? state.activeYear, harvestEvent.week ?? 0) <= toAbsoluteWeek(state.activeYear, week)) {
    return false;
  }
  const startEventTypes = ["direktsadd", "utplantering"];
  const hasStarted = state.events
    .filter((event) => event.cropId === crop.id && startEventTypes.includes(event.type))
    .some((event) => event.completed || toAbsoluteWeek(state.activeYear, week) >= toAbsoluteWeek(event.year ?? startYear, event.week));
  const currentIndex = toAbsoluteWeek(state.activeYear, week);
  const startIndex = toAbsoluteWeek(startYear ?? state.activeYear, startWeek);
  const endIndex = toAbsoluteWeek(endYear ?? startYear ?? state.activeYear, endWeek);
  return hasStarted && currentIndex >= startIndex && currentIndex <= endIndex;
}

function toAbsoluteWeek(year, week) {
  return (year * 53) + (week ?? 0);
}

function getFieldTypeLabel(type) {
  const labels = {
    bed: "Bädd",
    greenhouse: "Växthus",
    path: "Gång",
    tree: "Träd",
    house: "Hus",
    fence: "Staket",
    wall: "Mur",
    hedge: "Häck",
  };
  return labels[type] ?? "Yta";
}

function getFieldLayer(type) {
  const layers = {
    path: 0,
    greenhouse: 1,
    house: 2,
    wall: 2,
    fence: 2,
    hedge: 2,
    bed: 3,
    tree: 4,
  };
  return layers[type] ?? 3;
}

function getFieldFillColor(field, fieldStatus) {
  if (fieldStatus.overfilled) {
    return "#e85d49";
  }
  const colors = {
    greenhouse: "#79b59f",
    path: "#b78d63",
    tree: "#3f8b4f",
    house: "#b99b7b",
    fence: "#8b6f4d",
    wall: "#8b8176",
    hedge: "#5a8a4a",
    bed: "#8f6848",
  };
  return colors[field.type] ?? "#8f6848";
}

function getSectionColorMap() {
  const palette = ["#6fa858", "#d3a24f", "#c66759", "#5b9fba", "#8d72b8", "#c97d4e", "#6ba7a0"];
  return new Map(
    [...state.sections]
      .sort((a, b) => a.name.localeCompare(b.name, "sv"))
      .map((section, index) => [section.id, palette[index % palette.length]]),
  );
}

function getFieldFootprint(field) {
  const widthPx = Math.max(Math.round(field.width * FIELD_SCALE), 14);
  const heightPx = Math.max(Math.round(field.length * FIELD_SCALE), 14);
  if ((field.rotation ?? 0) % 180 !== 0) {
    return { width: heightPx, height: widthPx };
  }
  return { width: widthPx, height: heightPx };
}

function snapToGridPx(value) {
  return Math.round(value / FIELD_GRID_PX) * FIELD_GRID_PX;
}

function ceilToGridPx(value) {
  return Math.ceil(value / FIELD_GRID_PX) * FIELD_GRID_PX;
}

function ensureFieldMapViewport() {
  if (
    state.fieldMapViewportInitialized
    || !elements.fieldMap
    || state.page !== "skiften"
    || elements.fieldMap.clientWidth <= 0
    || elements.fieldMap.clientHeight <= 0
  ) {
    return;
  }
  state.fieldMapViewportInitialized = true;
  window.requestAnimationFrame(() => {
    if (state.fields.length) {
      focusFieldMapOnGarden();
    } else {
      setFieldZoom(1);
    }
  });
}

function isFieldMapFullscreen() {
  return getFieldMapFullscreenElement() === elements.fieldMapWorkspace;
}

function getFieldMapFullscreenElement() {
  return document.fullscreenElement ?? document.webkitFullscreenElement ?? null;
}

function updateFieldFullscreenButton() {
  elements.fieldMapWorkspace?.classList.toggle("is-fullscreen", isFieldMapFullscreen());
  if (!elements.fieldFullscreenToggle) {
    return;
  }
  const active = isFieldMapFullscreen();
  elements.fieldFullscreenToggle.textContent = active ? "Avsluta helskärm" : "Helskärm";
  elements.fieldFullscreenToggle.setAttribute("aria-pressed", active ? "true" : "false");
}

async function toggleFieldMapFullscreen() {
  if (!elements.fieldMapWorkspace) {
    return;
  }
  const enterFullscreen = elements.fieldMapWorkspace.requestFullscreen?.bind(elements.fieldMapWorkspace)
    ?? elements.fieldMapWorkspace.webkitRequestFullscreen?.bind(elements.fieldMapWorkspace);
  const exitFullscreen = document.exitFullscreen?.bind(document)
    ?? document.webkitExitFullscreen?.bind(document);
  if (typeof enterFullscreen !== "function") {
    return;
  }
  if (isFieldMapFullscreen()) {
    if (typeof exitFullscreen === "function") {
      await exitFullscreen();
    }
    return;
  }
  await enterFullscreen();
}

function handleFieldMapFullscreenChange() {
  elements.fieldMapWorkspace?.classList.toggle("is-fullscreen", isFieldMapFullscreen());
  updateFieldFullscreenButton();
  window.requestAnimationFrame(() => {
    focusFieldMapOnGarden();
  });
}

function normalizeFieldCoordinate(value, canvasSize, fallback, allowPercent = false) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  if (allowPercent && value >= 0 && value <= 100) {
    return snapToGridPx((value / 100) * canvasSize);
  }
  return snapToGridPx(value);
}

function normalizeRotation(value) {
  const normalized = ((Number(value) || 0) % 360 + 360) % 360;
  const steps = [0, 90, 180, 270];
  return steps.reduce((closest, step) => (Math.abs(step - normalized) < Math.abs(closest - normalized) ? step : closest), 0);
}

function estimateCropArea(crop) {
  const fields = (crop.fieldIds ?? []).length || 1;
  return Number((2.5 * fields).toFixed(1));
}

function guessAreaForSeed(seedItem) {
  const numericSpacing = Number.parseFloat(String(seedItem.spacing ?? "").replace(",", "."));
  if (!Number.isFinite(numericSpacing)) {
    return "2.0";
  }
  return Math.max(1, numericSpacing / 10).toFixed(1);
}

function formatArea(value) {
  return Number(value ?? 0).toFixed(1);
}

function formatDecimalSv(value, decimals = 1) {
  return new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value ?? 0));
}

function toNumber(value) {
  if (value === "" || value == null) {
    return null;
  }
  const parsed = Number(String(value).trim().replace(/\s+/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function isWithinNextMonth(eventWeek, referenceWeek) {
  const diff = eventWeek - referenceWeek;
  if (diff >= 0 && diff <= 4) {
    return true;
  }
  return referenceWeek >= 49 && eventWeek <= 4;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    };
    return replacements[character] || character;
  });
}

function getISOWeek(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
}

function getIconMarkup(name) {
  const icons = {
    presow:
      '<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 11V7.5L12 3l7.5 4.5V11" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6.5 10.5V19h11v-8.5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 7v7" stroke-width="1.8" stroke-linecap="round"></path><path d="m9.5 11.5 2.5 2.8 2.5-2.8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    directSow:
      '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4v8" stroke-width="1.8" stroke-linecap="round"></path><path d="m9.5 9.5 2.5 2.8 2.5-2.8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4 17.5h16" stroke-width="1.8" stroke-linecap="round"></path><path d="M7 20c1-.8 2-.8 3 0 .9-.8 2-.8 3 0 .9-.8 2-.8 4 0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    transplantOut:
      '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.2" stroke-width="1.8"></circle><path d="M12 2.8v3" stroke-width="1.8" stroke-linecap="round"></path><path d="M12 18.2v3" stroke-width="1.8" stroke-linecap="round"></path><path d="m5.5 5.5 2.1 2.1" stroke-width="1.8" stroke-linecap="round"></path><path d="m16.4 16.4 2.1 2.1" stroke-width="1.8" stroke-linecap="round"></path><path d="M2.8 12h3" stroke-width="1.8" stroke-linecap="round"></path><path d="M18.2 12h3" stroke-width="1.8" stroke-linecap="round"></path><path d="m5.5 18.5 2.1-2.1" stroke-width="1.8" stroke-linecap="round"></path><path d="m16.4 7.6 2.1-2.1" stroke-width="1.8" stroke-linecap="round"></path></svg>',
    harvestCrop:
      '<svg viewBox="0 0 24 24" fill="none"><path d="M12 6c2.1-2.2 5.6-2 7.4.1" stroke-width="1.8" stroke-linecap="round"></path><path d="M11.5 8.5c3.9 0 6.8 2.8 6.8 6.2 0 3.2-2.6 5.8-6.2 5.8-3.7 0-6.4-2.5-6.4-5.9 0-3.8 2.8-6.1 5.8-6.1Z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.8 4.2c-.2 1.8.2 3.1 1.3 4.4" stroke-width="1.8" stroke-linecap="round"></path><path d="M8.7 10.2c.8.5 1.6.7 2.5.7" stroke-width="1.8" stroke-linecap="round"></path></svg>',
    today:
      '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="5.5" width="16" height="14.5" rx="3" stroke-width="1.8"></rect><path d="M8 3.8v3.2" stroke-width="1.8" stroke-linecap="round"></path><path d="M16 3.8v3.2" stroke-width="1.8" stroke-linecap="round"></path><path d="M4 9.5h16" stroke-width="1.8" stroke-linecap="round"></path><path d="m9.1 14.1 1.8 1.8 4-4.2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    plannerGrid:
      '<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 6.5h4.5" stroke-width="1.8" stroke-linecap="round"></path><path d="M4.5 12h7.5" stroke-width="1.8" stroke-linecap="round"></path><path d="M4.5 17.5h10.5" stroke-width="1.8" stroke-linecap="round"></path><rect x="10.5" y="4.5" width="9" height="4" rx="2" stroke-width="1.8"></rect><rect x="13.5" y="10" width="6" height="4" rx="2" stroke-width="1.8"></rect><rect x="16.5" y="15.5" width="3" height="4" rx="1.5" stroke-width="1.8"></rect></svg>',
    gardenBeds:
      '<svg viewBox="0 0 24 24" fill="none"><path d="M5 7.5h14" stroke-width="1.8" stroke-linecap="round"></path><path d="M5 12h14" stroke-width="1.8" stroke-linecap="round"></path><path d="M5 16.5h14" stroke-width="1.8" stroke-linecap="round"></path><path d="M7.5 5v14" stroke-width="1.8" stroke-linecap="round"></path><path d="M12 5v14" stroke-width="1.8" stroke-linecap="round"></path><path d="M16.5 5v14" stroke-width="1.8" stroke-linecap="round"></path></svg>',
    seedling:
      '<svg viewBox="0 0 24 24" fill="none"><path d="M12 19.5V11" stroke-width="1.8" stroke-linecap="round"></path><path d="M12 12c0-3.4 2.6-5.9 6-5.9 0 3.5-2.5 6.1-6 6.1Z" stroke-width="1.8" stroke-linejoin="round"></path><path d="M12 14c0-2.7-2-4.8-4.8-4.8 0 2.9 1.9 5 4.8 5Z" stroke-width="1.8" stroke-linejoin="round"></path><path d="M8 19.5h8" stroke-width="1.8" stroke-linecap="round"></path></svg>',
    seedBox:
      '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="13" rx="2.5" stroke-width="1.8"></rect><path d="M7 9.5h10" stroke-width="1.8" stroke-linecap="round"></path><path d="M9 16c0-2 1.4-3.4 3-3.4s3 1.4 3 3.4" stroke-width="1.8" stroke-linecap="round"></path><path d="M12 16v-3.4" stroke-width="1.8" stroke-linecap="round"></path></svg>',
    shoppingCart:
      '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5h2l2.1 9.5h8.8L19 8H7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><circle cx="10" cy="19" r="1.4" stroke-width="1.8"></circle><circle cx="17" cy="19" r="1.4" stroke-width="1.8"></circle></svg>',
    settingsGear:
      '<svg viewBox="0 0 24 24" fill="none"><path d="M10.8 3.9h2.4l.5 1.9a6.6 6.6 0 0 1 1.65.68l1.67-1.05 1.7 1.7-1.05 1.67c.3.52.53 1.08.68 1.65l1.9.5v2.4l-1.9.5a6.6 6.6 0 0 1-.68 1.65l1.05 1.67-1.7 1.7-1.67-1.05a6.6 6.6 0 0 1-1.65.68l-.5 1.9h-2.4l-.5-1.9a6.6 6.6 0 0 1-1.65-.68l-1.67 1.05-1.7-1.7 1.05-1.67a6.6 6.6 0 0 1-.68-1.65l-1.9-.5v-2.4l1.9-.5a6.6 6.6 0 0 1 .68-1.65L5.52 7.22l1.7-1.7 1.67 1.05a6.6 6.6 0 0 1 1.65-.68l.5-1.9Z" stroke-width="1.8" stroke-linejoin="round"></path><circle cx="12" cy="12" r="2.7" stroke-width="1.8"></circle></svg>',
  };
  return icons[name] ?? icons.presow;
}

function hydrateNavIcons() {
  elements.navItems.forEach((button) => {
    const label = button.textContent.trim();
    const iconName = button.dataset.icon;
    if (!button.querySelector(".nav-item__label")) {
      button.innerHTML = `
        <span class="nav-item__icon" aria-hidden="true">${iconName ? getIconMarkup(iconName) : ""}</span>
        <span class="nav-item__label">${escapeHtml(label)}</span>
      `;
      return;
    }
    const icon = button.querySelector(".nav-item__icon");
    if (icon && iconName) {
      icon.innerHTML = getIconMarkup(iconName);
    }
  });
}

function openConfirmDialog({ title, message, confirmText, onConfirm }) {
  if (!elements.confirmDialog) {
    return;
  }
  state.confirmAction = onConfirm ?? null;
  state.confirmCancelAction = null;
  elements.confirmDialogTitle.textContent = title;
  elements.confirmDialogMessage.textContent = message;
  elements.confirmDialogConfirm.textContent = confirmText;
  showDialog(elements.confirmDialog);
}

function requestConfirmation({ title, message, confirmText }) {
  return new Promise((resolve) => {
    if (!elements.confirmDialog) {
      resolve(false);
      return;
    }
    openConfirmDialog({
      title,
      message,
      confirmText,
      onConfirm: () => resolve(true),
    });
    state.confirmCancelAction = () => resolve(false);
  });
}

async function handleConfirmDialogSubmit(event) {
  event.preventDefault();
  const action = state.confirmAction;
  state.confirmAction = null;
  state.confirmCancelAction = null;
  closeDialog(elements.confirmDialog);
  await action?.();
}

function handleSeedExport() {
  if (state.page !== "egnafroer") {
    return;
  }
  if (!window.XLSX) {
    showAppNotice("Excel-biblioteket kunde inte laddas.", "error");
    return;
  }
  const worksheet = buildSeedWorksheet();
  const extension = state.seedWorkbookName.toLowerCase().endsWith(".xlsm") ? "xlsm" : "xlsx";

  if (state.seedWorkbook?.SheetNames?.length) {
    const sheetName = state.seedWorkbook.Sheets["Frödatabas"] ? "Frödatabas" : state.seedWorkbook.SheetNames[0];
    state.seedWorkbook.Sheets[sheetName] = worksheet;
    XLSX.writeFile(state.seedWorkbook, state.seedWorkbookName || `frodatabas-export.${extension}`, { bookType: extension, bookVBA: extension === "xlsm" });
    return;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Frödatabas");
  XLSX.writeFile(workbook, `frodatabas-export.${extension}`, { bookType: extension });
}

async function handleSeedImport(event) {
  if (state.page !== "egnafroer") {
    event.target.value = "";
    return;
  }
  const [file] = event.target.files ?? [];
  if (!file) {
    return;
  }

  if (!window.XLSX) {
    showAppNotice("Excel-biblioteket kunde inte laddas.", "error");
    event.target.value = "";
    return;
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false, raw: false, bookVBA: true });
  state.seedWorkbook = workbook;
  state.seedWorkbookName = file.name;
  const worksheet = workbook.Sheets["Frödatabas"] ?? workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  for (const existing of await getAll(DB_NAMES.seedPersonal, "items")) {
    await deleteRecord(DB_NAMES.seedPersonal, "items", existing.id);
  }

  for (const [index, row] of rows.entries()) {
    if (!String(getSeedRowValue(row, "Gröda") ?? "").trim()) {
      continue;
    }
    const item = normalizeSeedItem({
      id: `personal-seed-import-${Date.now()}-${index}`,
      family: getSeedRowValue(row, "Familj"),
      latinFamily: getSeedRowValue(row, "Latinska familjer"),
      crop: getSeedRowValue(row, "Gröda"),
      method: getSeedRowValue(row, "Metod"),
      variety: getSeedRowValue(row, "Sort"),
      cropSort: getSeedRowValue(row, "Gröda + sort"),
      expirationYear: getSeedRowValue(row, "Utgångsdatum"),
      notes: getSeedRowValue(row, "Anteckning"),
      cultureTime: getSeedRowValue(row, "kulturtid"),
      field: getSeedRowValue(row, "Skifte"),
      seedPer75: getSeedRowValue(row, "Frö/7,5m2"),
      seedPerM2: getFirstSeedRowValue(row, ["Frö/m2", "Frö/m²"]),
      harvestInterval: toNumber(getSeedRowValue(row, "Skördeintervall")),
      m2odlat: getSeedRowValue(row, "m2 odlat"),
      rows: getSeedRowValue(row, "Rader"),
      spacing: getSeedRowValue(row, "Plantavstånd"),
      rowSpacing: getSeedRowValue(row, "Radavstånd"),
      seedInStock: getSeedRowValue(row, "Frö i lager"),
      schedule: {
        forsaddStart: toNumber(getSeedRowValue(row, "Första försådd")),
        forsaddEnd: toNumber(getSeedRowValue(row, "Sista försådd")),
        transplantStart: toNumber(getSeedRowValue(row, "Första utplantering")),
        transplantEnd: toNumber(getSeedRowValue(row, "Sista utplantering")),
        transplant: toNumber(getSeedRowValue(row, "Utplantering")),
        directStart: toNumber(getSeedRowValue(row, "Första direktsådd")),
        directEnd: toNumber(getSeedRowValue(row, "Sista direktsådd")),
        harvestStart: toNumber(getSeedRowValue(row, "Första skörd")),
        harvestEnd: toNumber(getSeedRowValue(row, "Sista skörd")),
      },
    });
    await putRecord(DB_NAMES.seedPersonal, "items", item);
  }

  event.target.value = "";
  await loadState();
  renderAll();
}

function buildSeedWorksheet() {
  const rows = state.personalSeedItems.map((item) => {
    const normalized = normalizeSeedItem(item);
    return ALL_SEED_COLUMNS.reduce((result, column) => {
      result[column.label] = getSeedValue(normalized, column.key);
      return result;
    }, {});
  });
  return XLSX.utils.json_to_sheet(rows, { header: ALL_SEED_COLUMNS.map((column) => column.label) });
}

function handleCultivationExport() {
  if (!window.XLSX) {
    showAppNotice("Excel-biblioteket kunde inte laddas.", "error");
    return;
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, buildCultivationCropsWorksheet(), "Grödor");
  XLSX.utils.book_append_sheet(workbook, buildCultivationEventsWorksheet(), "Händelser");
  const filename = state.cultivationWorkbookName || "grödor-export.xlsx";
  const extension = filename.toLowerCase().endsWith(".xlsm") ? "xlsm" : "xlsx";
  XLSX.writeFile(workbook, filename, { bookType: extension, bookVBA: extension === "xlsm" });
}

async function handleCultivationImport(event) {
  const [file] = event.target.files ?? [];
  if (!file) {
    return;
  }

  if (!window.XLSX) {
    showAppNotice("Excel-biblioteket kunde inte laddas.", "error");
    event.target.value = "";
    return;
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false, raw: false, bookVBA: true });
  const cropRows = workbook.Sheets["Grödor"] ? XLSX.utils.sheet_to_json(workbook.Sheets["Grödor"], { defval: "" }) : [];
  const eventRows = workbook.Sheets["Händelser"] ? XLSX.utils.sheet_to_json(workbook.Sheets["Händelser"], { defval: "" }) : [];
  if (!cropRows.length && !eventRows.length) {
    showAppNotice("Filen innehåller inga blad för Grödor eller Händelser.", "error");
    event.target.value = "";
    return;
  }

  for (const existing of await getAll(DB_NAMES.cultivation, "crops")) {
    await deleteRecord(DB_NAMES.cultivation, "crops", existing.id);
  }
  for (const existing of await getAll(DB_NAMES.cultivation, "events")) {
    await deleteRecord(DB_NAMES.cultivation, "events", existing.id);
  }
  for (const existing of await getAll(DB_NAMES.cultivation, "harvests")) {
    await deleteRecord(DB_NAMES.cultivation, "harvests", existing.id);
  }

  const importedCrops = [];
  for (const [index, row] of cropRows.entries()) {
    if (!row["Namn"]) {
      continue;
    }
    const crop = normalizeCrop({
      id: row["Id"] || `crop-import-${Date.now()}-${index}`,
      seedId: row["Fröpost"] || "",
      title: row["Namn"] || "",
      batchName: row["Omgång"] || "",
      startYear: toNumber(row["Startår"]),
      endYear: toNumber(row["Slutår"]),
      fieldIds: splitListValue(row["Bäddar"]),
      area: toNumber(row["Yta (m2)"]) ?? 0,
      note: row["Notering"] || "",
      schedule: {
        forsaddStart: toNumber(row["Försådd start"]),
        forsaddEnd: toNumber(row["Försådd slut"]),
        directStart: toNumber(row["Direktsådd start"]),
        directEnd: toNumber(row["Direktsådd slut"]),
        transplantStart: toNumber(row["Utplantering start"]) ?? toNumber(row["Utplantering"]),
        transplantEnd: toNumber(row["Utplantering slut"]) ?? toNumber(row["Utplantering"]),
        transplant: toNumber(row["Utplantering"]),
        harvestStart: toNumber(row["Första skörd"]),
        harvestEnd: toNumber(row["Sista skörd"]),
      },
    });
    importedCrops.push(crop);
    await putRecord(DB_NAMES.cultivation, "crops", crop);
  }

  if (eventRows.length) {
    for (const [index, row] of eventRows.entries()) {
      if (!row["Typ"] || !row["Gröda"]) {
        continue;
      }
      await putRecord(DB_NAMES.cultivation, "events", {
        id: row["Id"] || `event-import-${Date.now()}-${index}`,
        cropId: row["Gröda"],
        batchName: row["Omgång"] || "",
        title: row["Titel"] || "",
        type: row["Typ"] || "",
        week: toNumber(row["Vecka"]) ?? currentWeek,
        year: toNumber(row["År"]),
        fieldIds: splitListValue(row["Bäddar"]),
        completed: String(row["Klar"]).toLowerCase() === "true" || row["Klar"] === "1" || row["Klar"] === 1,
      });
    }
  } else {
    for (const crop of importedCrops) {
      await replaceEventsForCrop(crop);
    }
  }

  window.localStorage?.setItem(STORAGE_KEYS.cultivationSeeded, "true");
  state.cultivationWorkbookName = file.name;
  event.target.value = "";
  await loadState();
  renderAll();
}

function buildCultivationCropsWorksheet() {
  return XLSX.utils.json_to_sheet(state.allCrops.map((crop) => ({
    Id: crop.id,
    Fröpost: crop.seedId ?? "",
    Namn: crop.title,
    Omgång: crop.batchName,
    Startår: crop.startYear ?? "",
    Slutår: crop.endYear ?? "",
    Bäddar: (crop.fieldIds ?? []).join(" | "),
    "Yta (m2)": crop.area ?? 0,
    Notering: crop.note ?? "",
    "Försådd start": crop.schedule.forsaddStart ?? "",
    "Försådd slut": crop.schedule.forsaddEnd ?? "",
    "Direktsådd start": crop.schedule.directStart ?? "",
    "Direktsådd slut": crop.schedule.directEnd ?? "",
    "Utplantering start": crop.schedule.transplantStart ?? crop.schedule.transplant ?? "",
    "Utplantering slut": crop.schedule.transplantEnd ?? crop.schedule.transplant ?? "",
    Utplantering: crop.schedule.transplant ?? "",
    "Första skörd": crop.schedule.harvestStart ?? "",
    "Sista skörd": crop.schedule.harvestEnd ?? "",
  })));
}

function buildCultivationEventsWorksheet() {
  return XLSX.utils.json_to_sheet(state.allEvents.map((event) => ({
    Id: event.id,
    Gröda: event.cropId,
    Titel: event.title,
    Omgång: event.batchName,
    Typ: event.type,
    År: event.year ?? "",
    Vecka: event.week,
    Bäddar: (event.fieldIds ?? []).join(" | "),
    Klar: event.completed ? "true" : "false",
    "Mer kvar": event.type === "skord" && typeof event.moreToHarvest === "boolean" ? (event.moreToHarvest ? "true" : "false") : "",
  })));
}

function splitListValue(value) {
  return String(value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function getStoredDataDirectoryHandle() {
  try {
    const entry = await getRecord(DB_NAMES.cultivation, "settings", "data-directory-handle");
    return entry?.value ?? null;
  } catch {
    return null;
  }
}

async function setStoredDataDirectoryHandle(handle) {
  await putRecord(DB_NAMES.cultivation, "settings", {
    key: "data-directory-handle",
    value: handle,
  });
  state.dataDirectoryHandle = handle;
}

function hasConfiguredDataDirectory() {
  return Boolean(state.dataDirectoryHandle);
}

function isElectronDataDirectoryHandle(handle) {
  return Boolean(handle?.electronPath);
}

async function ensureUserDataSetup() {
  if (hasConfiguredDataDirectory()) {
    updateDataSetupUiState();
    return;
  }
  updateDataSetupUiState();
  showDialog(elements.dataSetupDialog);
}

function updateDataSetupUiState(message = "") {
  const folderName = state.dataDirectoryHandle?.name ? `Vald mapp: ${state.dataDirectoryHandle.name}` : "Ingen datamapp vald än.";
  if (elements.dataSetupFolderName) {
    elements.dataSetupFolderName.textContent = folderName;
  }
  if (elements.dataSetupStatus) {
    elements.dataSetupStatus.textContent = message || "";
  }
  if (elements.settingsDataFolder) {
    elements.settingsDataFolder.textContent = folderName;
  }
}

async function handleChooseDataFolder() {
  if (!supportsDirectoryPicker) {
    updateDataSetupUiState("Din webbläsare stödjer inte mappval här. Import fungerar fortfarande via fil.");
    return;
  }

  try {
    let handle = null;
    if (supportsElectronDesktop) {
      const selected = await window.electronDesktop.chooseDataDirectory();
      if (selected?.canceled || !selected?.path) {
        return;
      }
      handle = {
        name: selected.name || selected.path,
        electronPath: selected.path,
      };
    } else {
      handle = await window.showDirectoryPicker({ mode: "readwrite" });
    }
    if (!handle) {
      return;
    }
    await setStoredDataDirectoryHandle(handle);
    updateDataSetupUiState(`Vald mapp: ${handle.name}`);
    const imported = await tryImportSnapshotFromDirectory(handle);
    if (!imported) {
      await persistUserDataSnapshot();
    }
    closeDialog(elements.dataSetupDialog);
  } catch (error) {
    updateDataSetupUiState("Kunde inte välja mapp. Försök igen.");
  }
}

async function tryImportSnapshotFromDirectory(handle) {
  try {
    let text = "";
    if (isElectronDataDirectoryHandle(handle)) {
      text = await window.electronDesktop.readDataFile(handle.electronPath, USER_DATA_FILE_NAME);
    } else {
      const fileHandle = await handle.getFileHandle(USER_DATA_FILE_NAME, { create: false });
      if (!fileHandle) {
        return false;
      }
      const file = await fileHandle.getFile();
      text = await file.text();
    }
    if (!text.trim()) {
      return false;
    }
    const confirmed = await requestConfirmation({
      title: "Importera tidigare data",
      message: "En tidigare datafil hittades i den valda mappen. Vill du importera den nu?",
      confirmText: "Importera data",
    });
    if (!confirmed) {
      return false;
    }
    await importUserDataSnapshot(JSON.parse(text));
    updateDataSetupUiState(`Importerade data från ${handle.name}.`);
    return true;
  } catch {
    return false;
  }
}

async function handleUserDataImportFile(event) {
  const [file] = event.target.files ?? [];
  event.target.value = "";
  if (!file) {
    return;
  }
  try {
    const payload = JSON.parse(await file.text());
    await importUserDataSnapshot(payload);
    updateDataSetupUiState(`Importerade data från ${file.name}.`);
    closeDialog(elements.dataSetupDialog);
  } catch {
    updateDataSetupUiState("Importen misslyckades. Kontrollera att filen är en giltig dataexport.");
  }
}

function buildUserDataSnapshot() {
  let rawFrostWindow = null;
  try {
    rawFrostWindow = window.localStorage?.getItem(STORAGE_KEYS.frostWindow);
  } catch {
    rawFrostWindow = null;
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    personalSeeds: state.personalSeedItems.map(cloneValue),
    cultivation: {
      sections: state.sections.map(cloneValue),
      fields: state.fields.map(cloneValue),
      crops: state.allCrops.map(cloneValue),
      events: state.allEvents.map(cloneValue),
      harvests: state.harvestEntries.map(cloneValue),
      seedInventory: state.seedInventoryEntries.map(cloneValue),
      seedStock: state.seedStockEntries.map(cloneValue),
    },
    preferences: {
      activeYear: state.activeYear,
      harvestPrices: cloneValue(state.harvestPrices),
      theme: state.theme,
      weatherLocation: getCachedWeatherLocation(),
      weatherLocationRequested: hasRequestedWeatherLocation(),
      frostWindow: rawFrostWindow ? JSON.parse(rawFrostWindow) : null,
    },
  };
}

async function importUserDataSnapshot(snapshot) {
  state.dataSyncSuspended = true;
  try {
  const personalSeeds = Array.isArray(snapshot?.personalSeeds) ? snapshot.personalSeeds.map(normalizeSeedItem) : [];
  const sections = Array.isArray(snapshot?.cultivation?.sections) ? snapshot.cultivation.sections.map(normalizeSection) : [];
  const fields = Array.isArray(snapshot?.cultivation?.fields) ? snapshot.cultivation.fields.map(normalizeField) : [];
  const crops = Array.isArray(snapshot?.cultivation?.crops) ? snapshot.cultivation.crops.map(normalizeCrop) : [];
  const events = Array.isArray(snapshot?.cultivation?.events) ? snapshot.cultivation.events.map((entry) => normalizeEvent(entry, crops.find((crop) => crop.id === entry.cropId) ?? null)) : [];
  const harvests = Array.isArray(snapshot?.cultivation?.harvests) ? snapshot.cultivation.harvests.map(normalizeHarvestEntry) : [];
  const seedInventory = Array.isArray(snapshot?.cultivation?.seedInventory) ? snapshot.cultivation.seedInventory.map(normalizeSeedInventoryEntry) : [];
  const seedStock = Array.isArray(snapshot?.cultivation?.seedStock) ? snapshot.cultivation.seedStock.map(normalizeSeedStockEntry) : [];

  await replaceStoreRecords(DB_NAMES.seedPersonal, "items", personalSeeds);
  await replaceStoreRecords(DB_NAMES.cultivation, "sections", sections);
  await replaceStoreRecords(DB_NAMES.cultivation, "fields", fields);
  await replaceStoreRecords(DB_NAMES.cultivation, "crops", crops);
  await replaceStoreRecords(DB_NAMES.cultivation, "events", events);
  await replaceStoreRecords(DB_NAMES.cultivation, "harvests", harvests);
  await replaceStoreRecords(DB_NAMES.cultivation, "seedInventory", seedInventory);
  await replaceStoreRecords(DB_NAMES.cultivation, "seedStock", seedStock);

  try {
    if (snapshot?.preferences?.activeYear) {
      window.localStorage?.setItem(STORAGE_KEYS.activeYear, String(snapshot.preferences.activeYear));
    } else {
      window.localStorage?.removeItem(STORAGE_KEYS.activeYear);
    }
      window.localStorage?.setItem(STORAGE_KEYS.harvestPrices, JSON.stringify(snapshot?.preferences?.harvestPrices ?? {}));
      window.localStorage?.setItem(STORAGE_KEYS.theme, snapshot?.preferences?.theme === "dark" ? "dark" : "light");
      if (snapshot?.preferences?.weatherLocation) {
        window.localStorage?.setItem(STORAGE_KEYS.weatherLocation, JSON.stringify(snapshot.preferences.weatherLocation));
    } else {
      window.localStorage?.removeItem(STORAGE_KEYS.weatherLocation);
    }
    if (typeof snapshot?.preferences?.weatherLocationRequested === "boolean") {
      window.localStorage?.setItem(STORAGE_KEYS.weatherLocationRequested, snapshot.preferences.weatherLocationRequested ? "true" : "false");
    } else {
      window.localStorage?.removeItem(STORAGE_KEYS.weatherLocationRequested);
    }
    if (snapshot?.preferences?.frostWindow) {
      window.localStorage?.setItem(STORAGE_KEYS.frostWindow, JSON.stringify(snapshot.preferences.frostWindow));
    } else {
      window.localStorage?.removeItem(STORAGE_KEYS.frostWindow);
    }
    window.localStorage?.setItem(STORAGE_KEYS.cultivationSeeded, "true");
  } catch {
    // Ignore storage failures during import.
  }

    restoreActiveYear();
    restoreHarvestPreferences();
    restoreThemePreference();
    applyTheme();
    await loadState();
  renderAll();
  hydrateWeatherWidget();
  } finally {
    state.dataSyncSuspended = false;
  }
  queuePersistUserDataSnapshot();
}

async function replaceStoreRecords(dbName, storeName, records) {
  const existing = await getAll(dbName, storeName);
  for (const item of existing) {
    const key = item?.id ?? item?.key;
    if (key != null) {
      await deleteRecord(dbName, storeName, key);
    }
  }
  for (const record of records) {
    await putRecord(dbName, storeName, record);
  }
}

function queuePersistUserDataSnapshot() {
  if (state.dataSyncQueued || state.dataSyncSuspended) {
    return;
  }
  state.dataSyncQueued = true;
  window.setTimeout(() => {
    state.dataSyncQueued = false;
    void persistUserDataSnapshot();
  }, 200);
}

async function persistUserDataSnapshot() {
  if (!state.dataDirectoryHandle || state.dataSyncInProgress || state.dataSyncSuspended) {
    return;
  }
  state.dataSyncInProgress = true;
  try {
    const permission = await ensureDataDirectoryPermission(state.dataDirectoryHandle);
    if (permission !== "granted") {
      return;
    }
    const snapshotContents = JSON.stringify(buildUserDataSnapshot(), null, 2);
    if (isElectronDataDirectoryHandle(state.dataDirectoryHandle)) {
      await window.electronDesktop.writeDataFile(state.dataDirectoryHandle.electronPath, USER_DATA_FILE_NAME, snapshotContents);
    } else {
      const fileHandle = await state.dataDirectoryHandle.getFileHandle(USER_DATA_FILE_NAME, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(snapshotContents);
      await writable.close();
    }
  } catch {
    // Ignore sync failures and keep local data in IndexedDB.
  } finally {
    state.dataSyncInProgress = false;
  }
}

async function ensureDataDirectoryPermission(handle) {
  if (!handle) {
    return "denied";
  }
  if (isElectronDataDirectoryHandle(handle)) {
    return "granted";
  }
  if (typeof handle.queryPermission !== "function" || typeof handle.requestPermission !== "function") {
    return "granted";
  }
  const current = await handle.queryPermission({ mode: "readwrite" });
  if (current === "granted") {
    return current;
  }
  return handle.requestPermission({ mode: "readwrite" });
}

function openDb(name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 6);
    request.onupgradeneeded = () => {
      const db = request.result;
      if ((name === DB_NAMES.seedLegacy || name === DB_NAMES.seedGlobal || name === DB_NAMES.seedPersonal) && !db.objectStoreNames.contains("items")) {
        db.createObjectStore("items", { keyPath: "id" });
      }
      if (name === DB_NAMES.cultivation) {
        if (!db.objectStoreNames.contains("sections")) db.createObjectStore("sections", { keyPath: "id" });
        if (!db.objectStoreNames.contains("fields")) db.createObjectStore("fields", { keyPath: "id" });
        if (!db.objectStoreNames.contains("crops")) db.createObjectStore("crops", { keyPath: "id" });
        if (!db.objectStoreNames.contains("events")) db.createObjectStore("events", { keyPath: "id" });
        if (!db.objectStoreNames.contains("harvests")) db.createObjectStore("harvests", { keyPath: "id" });
        if (!db.objectStoreNames.contains("seedInventory")) db.createObjectStore("seedInventory", { keyPath: "id" });
        if (!db.objectStoreNames.contains("seedStock")) db.createObjectStore("seedStock", { keyPath: "id" });
        if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings", { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAll(dbName, storeName) {
  const db = await openDb(dbName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getRecord(dbName, storeName, key) {
  const db = await openDb(dbName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function putRecord(dbName, storeName, value) {
  const db = await openDb(dbName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => {
      if (dbName !== DB_NAMES.seedGlobal && dbName !== DB_NAMES.seedLegacy && storeName !== "settings") {
        queuePersistUserDataSnapshot();
      }
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteRecord(dbName, storeName, key) {
  const db = await openDb(dbName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => {
      if (dbName !== DB_NAMES.seedGlobal && dbName !== DB_NAMES.seedLegacy && storeName !== "settings") {
        queuePersistUserDataSnapshot();
      }
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

function openHarvestDialog(event, sourceCropId = null, entryId = null) {
  state.pendingHarvestEventId = event.id;
  state.pendingHarvestSourceCropId = sourceCropId;
  const existingEntry = entryId
    ? state.harvestEntries.find((entry) => entry.id === entryId) ?? null
    : null;
  state.pendingHarvestEntryId = existingEntry?.id ?? null;
  state.pendingHarvestReturnTitle = sourceCropId ? null : event.title;
  elements.harvestDialogTitle.textContent = `${existingEntry ? "Redigera" : "Registrera"} skörd för ${event.title}`;
  elements.harvestDialogMessage.textContent = `Vecka ${event.week} · ${event.fieldIds.map(getFieldName).join(", ")}`;
  elements.harvestDialogKilograms.value = existingEntry ? String(existingEntry.kg ?? "") : "";
  elements.harvestDialogMore.checked = existingEntry ? existingEntry.moreToHarvest !== false : true;
  elements.harvestDialogDelete.hidden = !existingEntry;
  showDialog(elements.harvestDialog);
}

function handleHarvestDialogCancel() {
  const sourceCropId = state.pendingHarvestSourceCropId;
  const returnTitle = state.pendingHarvestReturnTitle;
  state.pendingHarvestEventId = null;
  state.pendingHarvestSourceCropId = null;
  state.pendingHarvestEntryId = null;
  state.pendingHarvestReturnTitle = null;
  closeDialog(elements.harvestDialog);
  renderAll();
  if (sourceCropId) {
    openDialog(sourceCropId);
  } else if (returnTitle) {
    openHarvestDetailDialog(returnTitle);
  }
}

async function handleHarvestDialogSubmit(submitEvent) {
  submitEvent.preventDefault();
  const event = state.allEvents.find((entry) => entry.id === state.pendingHarvestEventId);
  if (!event) {
    handleHarvestDialogCancel();
    return;
  }
  const crop = state.allCrops.find((entry) => entry.id === event.cropId);
  const kilograms = Number(elements.harvestDialogKilograms.value);
  if (!Number.isFinite(kilograms) || kilograms < 0) {
    showAppNotice("Ange skördad vikt i kilo.", "error");
    return;
  }

  const moreToHarvest = elements.harvestDialogMore.checked;
  const harvestEntry = normalizeHarvestEntry({
    id: state.pendingHarvestEntryId ?? `harvest-${event.id}-${Date.now()}`,
    eventId: event.id,
    cropId: event.cropId,
    seedId: crop?.seedId ?? "",
    title: event.title,
    year: event.year,
    week: event.week,
    kg: kilograms,
    area: crop?.area ?? 0,
    moreToHarvest,
  });

  await putRecord(DB_NAMES.cultivation, "harvests", harvestEntry);
  await syncHarvestStateForCrop(event.cropId);

  closeDialog(elements.harvestDialog);
  state.pendingHarvestEventId = null;
  const sourceCropId = state.pendingHarvestSourceCropId;
  const returnTitle = state.pendingHarvestReturnTitle;
  state.pendingHarvestSourceCropId = null;
  state.pendingHarvestEntryId = null;
  state.pendingHarvestReturnTitle = null;
  await loadState();
  renderAll();
  if (sourceCropId) {
    openDialog(sourceCropId);
  } else if (returnTitle) {
    openHarvestDetailDialog(returnTitle);
  }
}

async function handleHarvestDialogDelete() {
  if (!state.pendingHarvestEntryId) {
    return;
  }
  const harvestEntry = state.harvestEntries.find((entry) => entry.id === state.pendingHarvestEntryId);
  if (!harvestEntry) {
    handleHarvestDialogCancel();
    return;
  }
  const confirmed = await requestConfirmation({
    title: "Radera skörd",
    message: `Radera skörden för ${harvestEntry.title} vecka ${harvestEntry.week}?`,
    confirmText: "Radera",
  });
  if (!confirmed) {
    return;
  }
  await deleteRecord(DB_NAMES.cultivation, "harvests", harvestEntry.id);
  await syncHarvestStateForCrop(harvestEntry.cropId);

  closeDialog(elements.harvestDialog);
  const sourceCropId = state.pendingHarvestSourceCropId;
  const returnTitle = state.pendingHarvestReturnTitle;
  state.pendingHarvestEventId = null;
  state.pendingHarvestSourceCropId = null;
  state.pendingHarvestEntryId = null;
  state.pendingHarvestReturnTitle = null;
  await loadState();
  renderAll();
  if (sourceCropId) {
    openDialog(sourceCropId);
  } else if (returnTitle) {
    openHarvestDetailDialog(returnTitle);
  }
}

function getSeedItemById(seedId) {
  return getAllSeedItems().find((item) => item.id === seedId) ?? null;
}

function getManualHarvestCropOptions() {
  const options = new Map();
  state.crops.forEach((crop) => {
    const title = String(crop.title ?? "").trim();
    if (!title || options.has(title)) {
      return;
    }
    options.set(title, {
      title,
      cropId: crop.id,
      seedId: crop.seedId ?? "",
    });
  });
  return [...options.values()].sort((left, right) => left.title.localeCompare(right.title, "sv"));
}

function getManualHarvestCropByTitle(title) {
  return getManualHarvestCropOptions().find((crop) => crop.title === title) ?? null;
}

function getMonthName(month) {
  return [
    "Januari",
    "Februari",
    "Mars",
    "April",
    "Maj",
    "Juni",
    "Juli",
    "Augusti",
    "September",
    "Oktober",
    "November",
    "December",
  ][month - 1] ?? `Månad ${month}`;
}

function getHarvestWeekForMonth(year, month) {
  return getISOWeek(new Date(year, month - 1, 15));
}

function getHarvestAreaForSeed(seedId) {
  return state.crops
    .filter((crop) => crop.seedId === seedId)
    .reduce((sum, crop) => sum + (Number(crop.area) || 0), 0);
}

function formatHarvestEntryPeriod(entry) {
  if (entry?.week) {
    return `Vecka ${entry.week}`;
  }
  if (entry?.month) {
    return getMonthName(entry.month);
  }
  return `Vecka ${entry?.week ?? "-"}`;
}

function populateManualHarvestForm() {
  if (!elements.manualHarvestWeek || !elements.manualHarvestSeed) {
    return;
  }
  const cropOptions = getManualHarvestCropOptions();
  const selectedTitle = state.pendingManualHarvestTitle ?? cropOptions[0]?.title ?? "";
  elements.manualHarvestSeed.innerHTML = cropOptions.length
    ? cropOptions
      .map((crop) => `<option value="${escapeHtml(crop.title)}" ${crop.title === selectedTitle ? "selected" : ""}>${escapeHtml(crop.title)}</option>`)
      .join("")
    : `<option value="">Inga planterade grödor att välja</option>`;
  elements.manualHarvestSeed.disabled = !cropOptions.length;
  elements.manualHarvestWeek.innerHTML = Array.from({ length: 52 }, (_, index) => index + 1)
    .map((week) => `<option value="${week}" ${week === currentWeek ? "selected" : ""}>${escapeHtml(`Vecka ${week}`)}</option>`)
    .join("");
}

function openManualHarvestDialog(entryId = null, returnTitle = null) {
  const entry = entryId ? state.harvestEntries.find((item) => item.id === entryId) ?? null : null;
  const title = returnTitle ?? entry?.title ?? null;
  state.pendingManualHarvestEntryId = entry?.id ?? null;
  state.pendingManualHarvestReturnTitle = title;
  state.pendingManualHarvestTitle = title;
  populateManualHarvestForm();
  if (elements.manualHarvestTitle) {
    elements.manualHarvestTitle.textContent = entry ? "Redigera skörd" : "Lägg till skörd";
  }
  if (elements.manualHarvestMessage) {
    elements.manualHarvestMessage.textContent = entry
      ? `Uppdatera skörden för ${entry.title}.`
      : title
        ? `Registrera skörd för ${title}.`
        : "Registrera skörd för en planterad gröda.";
  }
  if (elements.manualHarvestSeed) {
    elements.manualHarvestSeed.value = title ?? elements.manualHarvestSeed.value;
    elements.manualHarvestSeed.disabled = Boolean(title || entry);
  }
  if (elements.manualHarvestKilograms) {
    elements.manualHarvestKilograms.value = entry ? String(entry.kg ?? "") : "";
  }
  if (elements.manualHarvestWeek) {
    elements.manualHarvestWeek.value = String(entry?.week ?? currentWeek);
  }
  if (elements.manualHarvestDelete) {
    elements.manualHarvestDelete.hidden = !entry;
  }
  showDialog(elements.manualHarvestDialog);
}

function handleManualHarvestCancel() {
  const returnTitle = state.pendingManualHarvestReturnTitle;
  state.pendingManualHarvestEntryId = null;
  state.pendingManualHarvestReturnTitle = null;
  state.pendingManualHarvestTitle = null;
  closeDialog(elements.manualHarvestDialog);
  if (returnTitle) {
    openHarvestDetailDialog(returnTitle);
  }
}

async function handleManualHarvestSubmit(event) {
  event.preventDefault();
  const kilograms = Number(elements.manualHarvestKilograms?.value);
  const week = Number(elements.manualHarvestWeek?.value);
  const title = state.pendingManualHarvestTitle ?? elements.manualHarvestSeed?.value ?? "";
  const crop = title ? getManualHarvestCropByTitle(title) : null;
  if (!crop) {
    showAppNotice("Kunde inte hitta en sådd gröda att koppla skörden till.", "error");
    return;
  }
  if (!Number.isFinite(kilograms) || kilograms < 0) {
    showAppNotice("Ange skördad vikt i kilo.", "error");
    return;
  }
  if (!Number.isInteger(week) || week < 1 || week > 52) {
    showAppNotice("Välj vilken vecka skörden ska registreras i.", "error");
    return;
  }
  const existingEntry = state.pendingManualHarvestEntryId
    ? state.harvestEntries.find((item) => item.id === state.pendingManualHarvestEntryId) ?? null
    : null;
  const harvestEntry = normalizeHarvestEntry({
    id: existingEntry?.id ?? `manual-harvest-${Date.now()}`,
    eventId: existingEntry?.eventId ?? "",
    cropId: existingEntry?.cropId ?? crop.cropId ?? "",
    seedId: crop.seedId ?? existingEntry?.seedId ?? "",
    title: crop.title,
    year: state.activeYear,
    month: null,
    week,
    kg: kilograms,
    area: getHarvestAreaForSeed(crop.seedId),
    manual: true,
    moreToHarvest: false,
  });
  await putRecord(DB_NAMES.cultivation, "harvests", harvestEntry);
  state.pendingManualHarvestEntryId = null;
  const returnTitle = state.pendingManualHarvestReturnTitle ?? crop.title;
  state.pendingManualHarvestReturnTitle = null;
  state.pendingManualHarvestTitle = null;
  closeDialog(elements.manualHarvestDialog);
  await loadState();
  renderAll();
  if (returnTitle) {
    openHarvestDetailDialog(returnTitle);
  }
}

async function handleManualHarvestDelete() {
  if (!state.pendingManualHarvestEntryId) {
    return;
  }
  const harvestEntry = state.harvestEntries.find((item) => item.id === state.pendingManualHarvestEntryId);
  if (!harvestEntry) {
    handleManualHarvestCancel();
    return;
  }
  const confirmed = await requestConfirmation({
    title: "Radera skörd",
    message: `Radera skörden för ${harvestEntry.title} vecka ${harvestEntry.week ?? "-"}?`,
    confirmText: "Radera",
  });
  if (!confirmed) {
    return;
  }
  await deleteRecord(DB_NAMES.cultivation, "harvests", harvestEntry.id);
  const returnTitle = state.pendingManualHarvestReturnTitle ?? harvestEntry.title;
  state.pendingManualHarvestEntryId = null;
  state.pendingManualHarvestReturnTitle = null;
  state.pendingManualHarvestTitle = null;
  closeDialog(elements.manualHarvestDialog);
  await loadState();
  renderAll();
  if (returnTitle) {
    openHarvestDetailDialog(returnTitle);
  }
}

function renderHarvestPage() {
  if (!elements.harvestSummaryBody || !elements.harvestSummaryCards) {
    return;
  }
  const harvestEntries = state.harvestEntries.filter((entry) => entry.year === state.activeYear);
  const rowsByTitle = new Map();

  if (state.harvestView === "all") {
    state.crops.forEach((crop) => {
      const key = crop.title || "Okänd gröda";
      const existing = rowsByTitle.get(key) ?? { title: key, area: 0, kg: 0 };
      existing.area = Math.max(existing.area, Number(crop.area) || 0, getHarvestAreaForSeed(crop.seedId));
      rowsByTitle.set(key, existing);
    });
  }

  harvestEntries.forEach((entry) => {
    const key = entry.title || "Okänd gröda";
    const existing = rowsByTitle.get(key) ?? { title: key, area: 0, kg: 0 };
    existing.kg += Number(entry.kg) || 0;
    existing.area = Math.max(existing.area, Number(entry.area) || 0, getHarvestAreaForSeed(entry.seedId));
    rowsByTitle.set(key, existing);
  });

  const rows = [...rowsByTitle.values()]
    .map((row) => ({
      ...row,
      yieldPerM2: row.area > 0 ? row.kg / row.area : 0,
      pricePerKg: Number(state.harvestPrices[row.title]) || 0,
      expectedIncome: (Number(state.harvestPrices[row.title]) || 0) * row.kg,
    }))
    .filter((row) => state.harvestView === "all" || row.kg > 0)
    .sort(compareHarvestRows);

  const totalKg = harvestEntries.reduce((sum, entry) => sum + (Number(entry.kg) || 0), 0);
  const totalArea = state.crops.reduce((sum, crop) => sum + (Number(crop.area) || 0), 0);
  const totalIncome = rows.reduce((sum, row) => sum + row.expectedIncome, 0);

  elements.harvestSummaryCards.innerHTML = `
    <article class="harvest-stat-card">
      <span class="section-caption">Årets skörd</span>
      <strong>${formatDecimalSv(totalKg, 1)} kg</strong>
    </article>
    <article class="harvest-stat-card">
      <span class="section-caption">Sådd yta</span>
      <strong>${formatArea(totalArea)} m²</strong>
    </article>
    <article class="harvest-stat-card">
      <span class="section-caption">Årets inkomst</span>
      <strong>${formatDecimalSv(totalIncome, 2)} kr</strong>
    </article>
  `;

  renderHarvestSortButtons();

  if (!rows.length) {
    elements.harvestSummaryBody.innerHTML = `
      <tr>
        <td colspan="6" class="harvest-empty">Ingen skörd registrerad för ${state.activeYear} ännu.</td>
      </tr>
    `;
    return;
  }

  elements.harvestSummaryBody.innerHTML = rows.map((row) => `
    <tr class="harvest-row" data-title="${encodeURIComponent(row.title)}">
      <td>${escapeHtml(row.title)}</td>
      <td>${formatDecimalSv(row.kg, 1)} kg</td>
      <td>${formatArea(row.area)} m²</td>
      <td>${formatDecimalSv(row.yieldPerM2, 1)} kg/m²</td>
      <td><input class="harvest-price-input" type="text" inputmode="decimal" value="${row.pricePerKg ? formatDecimalSv(row.pricePerKg, 2) : ""}" data-title="${encodeURIComponent(row.title)}" /></td>
      <td>${formatDecimalSv(row.expectedIncome, 2)} kr</td>
    </tr>
  `).join("");

  [...elements.harvestSummaryBody.querySelectorAll(".harvest-price-input")].forEach((input) => {
    input.addEventListener("click", (event) => event.stopPropagation());
    input.addEventListener("input", (event) => {
      event.stopPropagation();
    });
    input.addEventListener("change", (event) => {
      const title = decodeURIComponent(event.target.dataset.title ?? "");
      const rawValue = String(event.target.value ?? "").trim().replace(",", ".");
      const value = Number(rawValue);
      state.harvestPrices[title] = Number.isFinite(value) && value > 0 ? value : 0;
      persistHarvestPrices();
      renderHarvestPage();
    });
    input.addEventListener("blur", (event) => {
      const title = decodeURIComponent(event.target.dataset.title ?? "");
      const rawValue = String(event.target.value ?? "").trim().replace(",", ".");
      const value = Number(rawValue);
      state.harvestPrices[title] = Number.isFinite(value) && value > 0 ? value : 0;
      persistHarvestPrices();
      renderHarvestPage();
    });
  });

}

function renderHarvestSortButtons() {
  const buttons = [...elements.harvestSummaryTable?.querySelectorAll(".table-sort-button") ?? []];
  const labels = {
    title: "Gröda",
    kg: "Skördat",
    area: "Sådd yta",
    yieldPerM2: "Skörd/m²",
    pricePerKg: "Pris/kg",
    expectedIncome: "Inkomst",
  };
  buttons.forEach((button) => {
    const key = button.dataset.key;
    button.innerHTML = `${labels[key] ?? button.textContent.trim()}${state.harvestSort.key === key ? ` <span>${state.harvestSort.direction === "asc" ? "↑" : "↓"}</span>` : ""}`;
    button.onclick = () => {
      if (state.harvestSort.key === key) {
        state.harvestSort.direction = state.harvestSort.direction === "asc" ? "desc" : "asc";
      } else {
        state.harvestSort.key = key;
        state.harvestSort.direction = key === "title" ? "asc" : "desc";
      }
      renderHarvestPage();
    };
  });
}

function compareHarvestRows(left, right) {
  const multiplier = state.harvestSort.direction === "asc" ? 1 : -1;
  if (state.harvestSort.key === "title") {
    return left.title.localeCompare(right.title, "sv") * multiplier;
  }
  return ((Number(left[state.harvestSort.key]) || 0) - (Number(right[state.harvestSort.key]) || 0)) * multiplier;
}

function openHarvestDetailDialog(title) {
  state.pendingManualHarvestTitle = title;
  const rows = state.harvestEntries
    .filter((entry) => entry.year === state.activeYear && entry.title === title)
    .sort((left, right) => left.week - right.week);
  const grouped = new Map();
  rows.forEach((entry) => {
    grouped.set(entry.week, (grouped.get(entry.week) ?? 0) + (Number(entry.kg) || 0));
  });
  const sortedWeeks = [...grouped.keys()].sort((left, right) => left - right);
  const series = sortedWeeks.length
    ? Array.from(
      { length: sortedWeeks[sortedWeeks.length - 1] - sortedWeeks[0] + 1 },
      (_, index) => {
        const week = sortedWeeks[0] + index;
        return { week, kg: grouped.get(week) ?? 0 };
      },
    )
    : [];
  const chartColumnWidth = 38;
  const chartGap = 7.2;
  const defaultDialogWidth = 520;
  const chartWidth = series.length
    ? Math.ceil((series.length * chartColumnWidth) + ((series.length - 1) * chartGap) + 48)
    : defaultDialogWidth;
  const preferredDialogWidth = Math.max(defaultDialogWidth, Math.min(1400, chartWidth + 64));
  const harvestDetailCard = elements.harvestDetailDialog?.querySelector(".harvest-detail-card");

  elements.harvestDetailTitle.textContent = title || "Okänd gröda";
  elements.harvestDetailMeta.textContent = `Skörd per vecka under ${state.activeYear}`;
  elements.harvestDetailDialog?.style.setProperty("--harvest-detail-width", `${preferredDialogWidth}px`);
  if (harvestDetailCard instanceof HTMLElement) {
    harvestDetailCard.style.width = `min(${preferredDialogWidth}px, calc(100vw - 2rem))`;
  }
  elements.harvestDetailChart?.style.setProperty("--harvest-chart-columns", String(Math.max(series.length, 1)));
  elements.harvestDetailChart?.style.setProperty("--harvest-chart-min-column", `${chartColumnWidth}px`);
  elements.harvestDetailChart.innerHTML = "";
  elements.harvestDetailEmpty.hidden = series.length > 0;
  if (elements.harvestDetailList) {
    elements.harvestDetailList.innerHTML = "";
  }

  if (!series.length) {
    if (elements.harvestDetailList) {
      elements.harvestDetailList.innerHTML = `<p class="section-caption harvest-empty">Inga skördeposter att redigera.</p>`;
    }
    showDialog(elements.harvestDetailDialog);
    return;
  }

  const maxKg = Math.max(...series.map((item) => item.kg), 1);
  elements.harvestDetailChart.innerHTML = series.map((item) => `
    <div class="harvest-chart__bar">
      <span class="harvest-chart__value">${item.kg > 0 ? `${formatDecimalSv(item.kg, 1)} kg` : ""}</span>
      <div class="harvest-chart__column" style="height:${item.kg > 0 ? Math.max((item.kg / maxKg) * 160, 12) : 12}px"></div>
      <span class="harvest-chart__label">v ${item.week}</span>
    </div>
  `).join("");

  if (elements.harvestDetailList) {
    elements.harvestDetailList.innerHTML = rows.map((entry) => `
      <article class="harvest-entry-card" data-entry-id="${escapeHtml(entry.id)}">
        <div>
          <strong>${escapeHtml(formatHarvestEntryPeriod(entry))}</strong>
          <p>${formatDecimalSv(entry.kg, 1)} kg</p>
        </div>
        <div class="harvest-entry-card__actions">
          <button class="button-secondary" type="button" data-action="edit">Redigera</button>
          <button class="button-secondary button-secondary--danger" type="button" data-action="delete">Radera</button>
        </div>
      </article>
    `).join("");

    [...elements.harvestDetailList.querySelectorAll(".harvest-entry-card")].forEach((card) => {
      const entryId = card.dataset.entryId;
      card.querySelector('[data-action="edit"]')?.addEventListener("click", () => openHarvestEntryEditor(entryId));
      card.querySelector('[data-action="delete"]')?.addEventListener("click", () => deleteHarvestEntryFromDetail(entryId, title));
    });
  }
  showDialog(elements.harvestDetailDialog);
}

function openHarvestEntryEditor(entryId) {
  const harvestEntry = state.harvestEntries.find((entry) => entry.id === entryId);
  if (!harvestEntry) {
    return;
  }
  const event = state.allEvents.find((entry) => entry.id === harvestEntry.eventId);
  if (!event) {
    closeDialog(elements.harvestDetailDialog);
    openManualHarvestDialog(entryId, harvestEntry.title);
    return;
  }
  closeDialog(elements.harvestDetailDialog);
  openHarvestDialog(event, null, entryId);
}

async function deleteHarvestEntryFromDetail(entryId, title) {
  const harvestEntry = state.harvestEntries.find((entry) => entry.id === entryId);
  if (!harvestEntry) {
    return;
  }
  const confirmed = await requestConfirmation({
    title: "Radera skörd",
    message: `Radera skörden för ${harvestEntry.title} vecka ${harvestEntry.week}?`,
    confirmText: "Radera",
  });
  if (!confirmed) {
    return;
  }
  await deleteRecord(DB_NAMES.cultivation, "harvests", harvestEntry.id);
  if (harvestEntry.cropId) {
    await syncHarvestStateForCrop(harvestEntry.cropId);
  }
  await loadState();
  renderAll();
  openHarvestDetailDialog(title);
}

async function deleteHarvestRowsForTitle(title) {
  const rows = state.harvestEntries.filter((entry) => entry.year === state.activeYear && entry.title === title);
  if (!rows.length) {
    return;
  }
  const confirmed = await requestConfirmation({
    title: "Radera alla skördar",
    message: `Radera alla skördeposter för ${title} under ${state.activeYear}?`,
    confirmText: "Radera alla",
  });
  if (!confirmed) {
    return;
  }
  for (const row of rows) {
    await deleteRecord(DB_NAMES.cultivation, "harvests", row.id);
  }
  const affectedCropIds = [...new Set(rows.map((row) => row.cropId).filter(Boolean))];
  for (const cropId of affectedCropIds) {
    await syncHarvestStateForCrop(cropId);
  }
  await loadState();
  renderAll();
}

async function syncHarvestStateForCrop(cropId) {
  const crop = state.allCrops.find((entry) => entry.id === cropId) ?? state.crops.find((entry) => entry.id === cropId) ?? null;
  const harvestEntries = (await getAll(DB_NAMES.cultivation, "harvests"))
    .map(normalizeHarvestEntry)
    .filter((entry) => entry.cropId === cropId);
  const harvestEntriesByEventId = new Map();
  harvestEntries.forEach((entry) => {
    if (!harvestEntriesByEventId.has(entry.eventId)) {
      harvestEntriesByEventId.set(entry.eventId, []);
    }
    harvestEntriesByEventId.get(entry.eventId).push(entry);
  });
  const harvestEvents = (await getAll(DB_NAMES.cultivation, "events"))
    .map((entry) => normalizeEvent(entry, crop))
    .filter((entry) => entry.cropId === cropId && entry.type === "skord")
    .sort((left, right) => toAbsoluteWeek(left.year ?? state.activeYear, left.week) - toAbsoluteWeek(right.year ?? state.activeYear, right.week));

  let closedAt = null;
  for (const harvestEvent of harvestEvents) {
    const entries = (harvestEntriesByEventId.get(harvestEvent.id) ?? [])
      .sort((left, right) => String(left.id).localeCompare(String(right.id), "sv"));
    const eventAbsoluteWeek = toAbsoluteWeek(harvestEvent.year ?? state.activeYear, harvestEvent.week);

    if (entries.length) {
      const latestEntry = entries[entries.length - 1];
      const hasClosedEntry = entries.some((entry) => entry.moreToHarvest === false);
      harvestEvent.moreToHarvest = hasClosedEntry ? false : latestEntry.moreToHarvest;
      harvestEvent.completed = hasClosedEntry;
      if (hasClosedEntry && closedAt === null) {
        closedAt = eventAbsoluteWeek;
      }
    } else if (closedAt !== null && eventAbsoluteWeek > closedAt) {
      harvestEvent.completed = true;
      harvestEvent.moreToHarvest = false;
    } else {
      harvestEvent.completed = false;
      harvestEvent.moreToHarvest = null;
    }

    await putRecord(DB_NAMES.cultivation, "events", harvestEvent);
  }
}






