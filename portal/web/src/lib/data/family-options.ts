export const DEFAULT_FAMILY_OPTIONS = [
  "Flockblommiga",
  "Gräs",
  "Gröngödsling",
  "Gurkväxter",
  "Korgblommiga",
  "Korsblommiga",
  "Kålväxter",
  "Lökväxter",
  "Mållväxter",
  "Potatisväxter",
  "Ärtväxter",
  "Örtväxter",
];

export function buildFamilyOptions(families: Iterable<string>) {
  return Array.from(
    Array.from(families).reduce((options, familyValue) => {
      const family = familyValue.trim();
      if (!family) return options;

      const key = family.toLocaleLowerCase("sv-SE");
      if (!options.has(key)) {
        options.set(key, family.charAt(0).toLocaleUpperCase("sv-SE") + family.slice(1));
      }

      return options;
    }, new Map<string, string>()).values(),
  ).sort((left, right) => left.localeCompare(right, "sv", { sensitivity: "base" }));
}
