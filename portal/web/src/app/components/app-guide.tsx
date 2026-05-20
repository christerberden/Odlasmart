"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const APP_GUIDE_OPEN_EVENT = "portal-app-guide-open";

type GuideStep = {
  title: string;
  page: string;
  target: string;
  fallbackTarget?: string;
  targetLabel: string;
  intro: string;
};

const GUIDE_STEPS: GuideStep[] = [
  {
    title: "1. Menyn till vänster",
    page: "/fields",
    target: ".nav-list",
    targetLabel: "vänstermenyn",
    intro: "Du rör dig mellan sidorna med menyn till vänster. Just nu är du på Odlingsytor, där du bygger upp odlingens grund med skiften, bäddar och andra ytor.",
  },
  {
    title: "2. Lägg till skifte",
    page: "/fields",
    target: "#open-section-dialog",
    targetLabel: "knappen Lägg till skifte",
    intro: "Här på Odlingsytor börjar strukturen. Tryck på Lägg till skifte för att skapa första delen av odlingen och få ordning på växtföljden.",
  },
  {
    title: "3. Lägg till bädd",
    page: "/fields",
    target: "#open-field-dialog",
    targetLabel: "knappen Lägg till yta",
    intro: "När skiftet finns kan du lägga in en bädd eller annan yta. Det är de här bäddarna du sedan planerar grödor i på tidslinjen.",
  },
  {
    title: "4. Bäddlistan",
    page: "/fields",
    target: "#field-list",
    targetLabel: "bäddlistan till höger",
    intro: "Till höger ser du bäddlistan. Där kontrollerar du snabbt namn, skifte och innehåll utan att behöva leta runt i kartan.",
  },
  {
    title: "5. Byt sida i vänstermenyn",
    page: "/fields",
    target: '.nav-item[data-guide-page="/crops"]',
    targetLabel: "menyvalet Odlingsplan",
    intro: "Nu byter du sida med vänstermenyn. Gå till Odlingsplan, där du lägger in grödor i bäddar och följer säsongen vecka för vecka.",
  },
  {
    title: "6. Knapparna högst upp",
    page: "/crops",
    target: "#crop-planning-actions",
    targetLabel: "knappraden högst upp",
    intro: "Här finns snabbknapparna för planeringen. Härifrån lägger du till grödor och hanterar import, export eller tömning av planeringen.",
  },
  {
    title: "7. Filter",
    page: "/crops",
    target: "#timeline-field-filters",
    targetLabel: "filtren för odlingsplanen",
    intro: "Filtren låter dig fokusera på rätt bädd, skifte eller grupp. Använd dem när planeringen blir tät och du vill jobba mer avgränsat.",
  },
  {
    title: "8. Byt sida i vänstermenyn",
    page: "/crops",
    target: '.nav-item[data-guide-page="/tasks"]',
    targetLabel: "menyvalet Idag",
    intro: "Nu byter du sida med vänstermenyn igen. Gå till Idag, som visar vad som behöver göras just nu och den här veckan.",
  },
  {
    title: "9. Filter",
    page: "/tasks",
    target: ".today-toolbar",
    targetLabel: "filtren och valen ovanför uppgifterna",
    intro: "Här väljer du vilka uppgifter du vill se och kan filtrera fram rätt bädd. Det gör det lättare att arbeta lugnt, område för område.",
  },
  {
    title: "10. Snabböversikt",
    page: "/tasks",
    target: "#stats-grid",
    targetLabel: "snabböversikten till höger",
    intro: "Snabböversikten sammanfattar läget i odlingen. Här ser du direkt om något halkar efter eller om veckan ser lugn ut.",
  },
  {
    title: "11. Bocka av en uppgift",
    page: "/tasks",
    target: "#task-list .task-checkbox",
    fallbackTarget: "#task-list",
    targetLabel: "uppgiftslistan",
    intro: "När du gjort något kan du bocka av uppgiften här. Då uppdateras både listan och översikten direkt.",
  },
  {
    title: "12. Byt sida i vänstermenyn",
    page: "/tasks",
    target: '.nav-item[data-guide-page="/harvest"]',
    targetLabel: "menyvalet Skörd",
    intro: "Nu byter du sida med vänstermenyn till Skörd. Där följer du upp vad odlingen faktiskt gav och vad den är värd.",
  },
  {
    title: "13. Knapparna",
    page: "/harvest",
    target: "#harvest-actions",
    targetLabel: "knapparna för skörd och prognos",
    intro: "Härifrån registrerar du skörd eller öppnar prognosen. Det är de två viktigaste startpunkterna på skördsidan.",
  },
  {
    title: "14. Prognos",
    page: "/harvest",
    target: "#open-harvest-forecast-dialog",
    targetLabel: "knappen Prognos",
    intro: "Prognosen uppskattar utfall och värde utifrån det som redan finns i planeringen och tidigare data. Den hjälper dig jämföra plan mot resultat.",
  },
  {
    title: "15. Byt sida i vänstermenyn",
    page: "/harvest",
    target: '.nav-item[data-guide-page="/inventory"]',
    targetLabel: "menyvalet Mina fröer",
    intro: "Nu byter du sida med vänstermenyn till Mina fröer. Där samlar du dina egna sorter och ser vad du har hemma.",
  },
  {
    title: "16. Knappar och sök",
    page: "/inventory",
    target: ".inventory-toolbar",
    targetLabel: "knapparna och sökfältet för Mina fröer",
    intro: "Här lägger du till, importerar, exporterar och söker i Mina fröer. Det är den här listan som sedan driver resten av planeringen.",
  },
];

function resolveTarget(step: GuideStep) {
  const selectors = [step.target, step.fallbackTarget].filter(Boolean) as string[];
  for (const selector of selectors) {
    const node = document.querySelector(selector);
    if (node instanceof HTMLElement) {
      return node;
    }
  }
  return null;
}

export function AppGuide() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<{ left: number; top: number } | null>(null);

  const step = GUIDE_STEPS[stepIndex] ?? null;

  useEffect(() => {
    function openGuide() {
      setStepIndex(0);
      setIsOpen(true);
    }

    window.addEventListener(APP_GUIDE_OPEN_EVENT, openGuide);
    return () => window.removeEventListener(APP_GUIDE_OPEN_EVENT, openGuide);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("has-guide-open", isOpen);
    return () => document.body.classList.remove("has-guide-open");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !step) {
      return;
    }
    if (pathname !== step.page) {
      router.push(step.page);
      return;
    }

    let frame = 0;
    const updatePosition = () => {
      const target = resolveTarget(step);
      if (!target) {
        setHighlightRect(null);
        setPopoverStyle({ left: 24, top: 24 });
        return;
      }
      target.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
      const rect = target.getBoundingClientRect();
      setHighlightRect(rect);

      const width = Math.min(360, window.innerWidth - 32);
      const height = 260;
      const preferRight = rect.right + 24 + width < window.innerWidth - 16;
      const left = preferRight
        ? rect.right + 24
        : Math.max(rect.left - width - 24, 16);
      const top = Math.min(
        Math.max(rect.top + rect.height / 2 - height / 2, 16),
        window.innerHeight - height - 16,
      );
      setPopoverStyle({ left, top });
    };

    frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, pathname, router, step]);

  const highlightStyle = useMemo(() => {
    if (!highlightRect) return undefined;
    const padding = 8;
    return {
      left: Math.max(highlightRect.left - padding, 8),
      top: Math.max(highlightRect.top - padding, 8),
      width: Math.max(highlightRect.width + padding * 2, 24),
      height: Math.max(highlightRect.height + padding * 2, 24),
    };
  }, [highlightRect]);

  if (!isOpen || !step) {
    return null;
  }

  return (
    <div className="app-guide-overlay" role="dialog" aria-modal="true" aria-label="Guide genom appen">
      <div className="app-guide-backdrop" />
      <div className="app-guide-highlight" style={highlightStyle} />
      <article className="app-guide-popover" style={popoverStyle ?? undefined}>
        <div className="portal-dialog__head">
          <div>
            <p className="section-kicker">Guide</p>
            <h3>{step.title}</h3>
            <p className="section-caption">{`Steg ${stepIndex + 1} av ${GUIDE_STEPS.length}`}</p>
          </div>
          <button className="icon-button" type="button" onClick={() => setIsOpen(false)} aria-label="Stäng guide">
            ×
          </button>
        </div>
        <div className="app-guide-points">
          <div className="app-guide-point">
            <p>{step.intro}</p>
          </div>
          <div className="app-guide-point">
            <p>{`Markerat nu: ${step.targetLabel}.`}</p>
          </div>
        </div>
        <div className="form-actions">
          <button
            className="button-secondary"
            disabled={stepIndex === 0}
            type="button"
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
          >
            Föregående
          </button>
          <button
            className="button-primary"
            type="button"
            onClick={() => {
              if (stepIndex === GUIDE_STEPS.length - 1) {
                setIsOpen(false);
                return;
              }
              setStepIndex((current) => current + 1);
            }}
          >
            {stepIndex === GUIDE_STEPS.length - 1 ? "Stäng guide" : "Nästa"}
          </button>
        </div>
      </article>
    </div>
  );
}

export function openAppGuide() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(APP_GUIDE_OPEN_EVENT));
  }
}
