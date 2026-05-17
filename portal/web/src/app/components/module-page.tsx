import { getPortalModule } from "@/app/lib/portal-data";
import { PortalShell } from "@/app/components/portal-shell";

type ModulePageProps = {
  href: string;
  focus?: string[];
  firstBuild?: string[];
  children?: React.ReactNode;
  hideHeader?: boolean;
};

export function ModulePage({ href, children, hideHeader = false }: ModulePageProps) {
  const portalModule = getPortalModule(href);

  if (!portalModule) {
    return null;
  }

  return (
    <PortalShell
      activeHref={href}
      eyebrow={hideHeader ? undefined : portalModule.eyebrow}
      title={hideHeader ? undefined : portalModule.label}
      description={hideHeader ? undefined : portalModule.description}
    >
      {children}
    </PortalShell>
  );
}
