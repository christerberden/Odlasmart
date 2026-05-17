export type PortalIcon =
  | "today"
  | "harvest"
  | "planner"
  | "beds"
  | "seeds"
  | "inventory"
  | "settings";

export type PortalGroup = "Arbeta" | "Planera" | "Portal";

export type PortalModule = {
  href: string;
  label: string;
  eyebrow: string;
  description: string;
  accent: "primary" | "secondary" | "warning" | "harvest";
  status: string;
  icon: PortalIcon;
  group: PortalGroup;
};

export const portalModules: PortalModule[] = [
  {
    href: "/tasks",
    label: "Idag",
    eyebrow: "Arbete",
    description: "Dagens arbetslista med sådder, utplanteringar, skörd och uppföljning.",
    accent: "secondary",
    status: "V1",
    icon: "today",
    group: "Arbeta",
  },
  {
    href: "/harvest",
    label: "Skörd",
    eyebrow: "Uppföljning",
    description: "Registrera kilo, summera resultat och jämför över säsonger.",
    accent: "harvest",
    status: "V1",
    icon: "harvest",
    group: "Arbeta",
  },
  {
    href: "/crops",
    label: "Odlingsplan",
    eyebrow: "Säsong",
    description: "Odlingsomgångar med sort, yta, år, anteckningar och status.",
    accent: "warning",
    status: "V1",
    icon: "planner",
    group: "Planera",
  },
  {
    href: "/fields",
    label: "Odlingsytor",
    eyebrow: "Struktur",
    description: "Skiften, bäddar, växthus och andra ytor som grödor kopplas till.",
    accent: "primary",
    status: "V1",
    icon: "beds",
    group: "Planera",
  },
  {
    href: "/seeds",
    label: "Frödatabas",
    eyebrow: "Bibliotek",
    description: "Systemkatalog och egna sorter som blir basen för resten av portalen.",
    accent: "primary",
    status: "V1",
    icon: "seeds",
    group: "Planera",
  },
  {
    href: "/inventory",
    label: "Mina fröer",
    eyebrow: "Inventering",
    description: "Fröpåsar, mängder, inköpsår, leverantörer och utgångsår.",
    accent: "secondary",
    status: "V1",
    icon: "inventory",
    group: "Planera",
  },
  {
    href: "/settings",
    label: "Inställningar",
    eyebrow: "Portal",
    description: "Workspace, import, användare och preferenser.",
    accent: "primary",
    status: "Grund",
    icon: "settings",
    group: "Portal",
  },
];

export const dashboardStats = [
  { label: "Aktiva moduler", value: "7", detail: "Grundstruktur skapad" },
  { label: "V1-fokus", value: "6", detail: "Kärnflöden utan veckoplanering" },
  { label: "Datakälla", value: "JSON", detail: "Import från nuvarande app" },
];

export function getPortalModule(href: string) {
  return portalModules.find((module) => module.href === href);
}
