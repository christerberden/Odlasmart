"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { CSSProperties, FormEvent, PointerEvent } from "react";
import type { FieldRow, SectionRow } from "@/lib/data/fields";

const fieldTypes = [
  ["bed", "Bädd"],
  ["greenhouse", "Växthus"],
  ["path", "Gång"],
  ["tree", "Träd"],
  ["house", "Hus"],
  ["fence", "Staket"],
  ["wall", "Mur"],
  ["hedge", "Häck"],
  ["other", "Annat"],
] as const;

const fieldTypeLabels = new Map(fieldTypes);
const sectionPalette = ["#6eb45d", "#dfb14f", "#d77264", "#67aec1", "#9a7ac7", "#d48756"] as const;

type CropSummary = {
  id: string;
  title: string;
  fields: {
    fieldId: string;
  }[];
};

type Placement = {
  rotationDeg: number;
  x: number;
  y: number;
};

type FieldsWorkspaceProps = {
  sections: SectionRow[];
  fields: FieldRow[];
  crops: CropSummary[];
  familyOptions: string[];
  error?: string;
  initialFieldId?: string;
  initialSectionId?: string;
  openNewFieldOnLoad?: boolean;
  createFieldAction: (formData: FormData) => void | Promise<void>;
  createSectionAction: (formData: FormData) => void | Promise<void>;
  updateFieldAction: (formData: FormData) => void | Promise<void>;
  updateSectionAction: (formData: FormData) => void | Promise<void>;
  deleteFieldAction: (formData: FormData) => void | Promise<void>;
  deleteSectionAction: (formData: FormData) => void | Promise<void>;
  updateFieldPlacementAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
};

function getFieldTypeLabel(type: string) {
  return fieldTypeLabels.get(type as (typeof fieldTypes)[number][0]) ?? type;
}

function getPlotClasses(type: string) {
  if (type === "bed") return "portal-field-plot portal-field-plot--bed";
  if (type === "greenhouse") return "portal-field-plot portal-field-plot--greenhouse";
  if (type === "path") return "portal-field-plot portal-field-plot--path";
  if (type === "tree" || type === "hedge") return "portal-field-plot portal-field-plot--round";
  return "portal-field-plot portal-field-plot--other";
}

function getFieldSize(field: FieldRow) {
  const widthM = Math.max(field.widthM ?? 1, 0.2);
  const lengthM = Math.max(field.lengthM ?? 1, 0.2);

  return {
    width: Math.min(Math.max(widthM * 96, 54), 720),
    height: Math.min(Math.max(lengthM * 62, 54), 760),
  };
}

function getFieldStyle(field: FieldRow, placement: Placement, zoom: number): CSSProperties {
  const size = getFieldSize(field);

  return {
    ["--content-rotation" as string]: `${-placement.rotationDeg}deg`,
    height: `${size.height * zoom}px`,
    left: `${placement.x * zoom}px`,
    top: `${placement.y * zoom}px`,
    transform: `rotate(${placement.rotationDeg}deg)`,
    transformOrigin: "center center",
    width: `${size.width * zoom}px`,
  };
}

function getInitialPlacement(field: FieldRow, index: number): Placement {
  return {
    rotationDeg: field.rotationDeg ?? 0,
    x: field.positionX ?? 24 + (index % 3) * 260,
    y: field.positionY ?? 24 + Math.floor(index / 3) * 130,
  };
}

function formatArea(areaM2: number | null) {
  return areaM2 != null
    ? `${areaM2.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} m²`
    : "Ingen yta";
}

function formatDimensions(field: FieldRow) {
  if (field.widthM == null || field.lengthM == null) return "Mått saknas";
  return `${field.widthM.toLocaleString("sv-SE", { maximumFractionDigits: 2 })} x ${field.lengthM.toLocaleString("sv-SE", { maximumFractionDigits: 2 })} m`;
}

function summarizeFieldCrops(cropTitles: string[]) {
  if (cropTitles.length === 0) return null;
  if (cropTitles.length === 1) return cropTitles[0];
  return `${cropTitles[0]} +${cropTitles.length - 1}`;
}

function getSectionColor(sectionId: string | null, sections: SectionRow[]) {
  if (!sectionId) return "#dfb14f";
  const sectionIndex = sections.findIndex((section) => section.id === sectionId);
  return sectionPalette[((sectionIndex >= 0 ? sectionIndex : 0) % sectionPalette.length)];
}

function FieldFormFields({
  field,
  sections,
  selectedSectionId,
  showCount = false,
}: {
  field?: FieldRow;
  sections: SectionRow[];
  selectedSectionId?: string | null;
  showCount?: boolean;
}) {
  return (
    <>
      {field ? <input name="fieldId" type="hidden" value={field.id} /> : null}
      <label className="grid gap-1 text-sm font-semibold">
        Namn
        <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]" defaultValue={field?.name} name="name" placeholder="Bädd 1" required />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Typ
        <select className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]" defaultValue={field?.type ?? "bed"} name="type">
          {fieldTypes.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">
          Bredd (m) X
          <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]" defaultValue={field?.widthM ?? ""} inputMode="decimal" name="widthM" placeholder="0,75" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Längd (m) Y
          <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]" defaultValue={field?.lengthM ?? ""} inputMode="decimal" name="lengthM" placeholder="12" />
        </label>
      </div>
      <div className="grid gap-2">
        <span className="text-sm font-semibold">Välj skifte</span>
        <div className="portal-section-chips">
          <label>
            <input defaultChecked={!field?.sectionId && !selectedSectionId} name="sectionId" type="radio" value="" />
            <span>Inget skifte</span>
          </label>
          {sections.map((section) => (
            <label key={section.id}>
              <input defaultChecked={(field?.sectionId ?? selectedSectionId) === section.id} name="sectionId" type="radio" value={section.id} />
              <span>{section.name}{section.family ? ` · ${section.family}` : ""}</span>
            </label>
          ))}
        </div>
      </div>
      {showCount ? (
        <label className="grid gap-1 text-sm font-semibold">
          Antal bäddar
          <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]" defaultValue="1" inputMode="numeric" min="1" name="fieldCount" type="number" />
        </label>
      ) : null}
    </>
  );
}

function SectionFormFields({ section, familyOptions }: { section?: SectionRow; familyOptions: string[] }) {
  return (
    <>
      {section ? <input name="sectionId" type="hidden" value={section.id} /> : null}
      <label className="grid gap-1 text-sm font-semibold">
        Namn
        <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]" defaultValue={section?.name} name="name" placeholder="Skifte 1" required />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Växtfamilj
        <select className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]" defaultValue={section?.family ?? ""} name="family">
          <option value="">Välj växtfamilj</option>
          {familyOptions.map((family) => (
            <option key={family} value={family}>{family}</option>
          ))}
        </select>
      </label>
      <label className="portal-checkbox-row text-sm font-semibold">
        <input name="rotationEnabled" type="checkbox" defaultChecked={section?.rotationEnabled ?? true} />
        Ingår i växtföljd
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Skiftesföljd
        <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]" defaultValue={section?.rotationOrder ?? ""} inputMode="numeric" name="rotationOrder" placeholder="1" />
      </label>
    </>
  );
}

export function FieldsWorkspace({
  sections,
  fields,
  crops,
  familyOptions,
  error,
  initialFieldId,
  initialSectionId,
  openNewFieldOnLoad = false,
  createFieldAction,
  createSectionAction,
  updateFieldAction,
  updateSectionAction,
  deleteFieldAction,
  deleteSectionAction,
  updateFieldPlacementAction,
}: FieldsWorkspaceProps) {
  const [selectedFieldId, setSelectedFieldId] = useState(initialFieldId ?? fields[0]?.id ?? null);
  const [selectedSectionId, setSelectedSectionId] = useState(initialSectionId ?? sections[0]?.id ?? null);
  const [zoom, setZoom] = useState(1);
  const [occupancyWeek, setOccupancyWeek] = useState(1);
  const [placements, setPlacements] = useState<Record<string, Placement>>(() =>
    Object.fromEntries(fields.map((field, index) => [field.id, getInitialPlacement(field, index)])),
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const mapWorkspaceRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const fieldDialogRef = useRef<HTMLDialogElement>(null);
  const sectionDialogRef = useRef<HTMLDialogElement>(null);
  const editFieldDialogRef = useRef<HTMLDialogElement>(null);
  const editSectionDialogRef = useRef<HTMLDialogElement>(null);
  const helpDialogRef = useRef<HTMLDialogElement>(null);
  const dragRef = useRef<{
    fieldId: string;
    moved: boolean;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? fields[0] ?? null;
  const selectedSection = sections.find((section) => section.id === selectedSectionId) ?? sections[0] ?? null;
  const cropTitlesByFieldId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const crop of crops) {
      for (const cropField of crop.fields) {
        const cropTitles = map.get(cropField.fieldId) ?? [];
        cropTitles.push(crop.title);
        map.set(cropField.fieldId, cropTitles);
      }
    }
    return map;
  }, [crops]);
  const totalAreaM2 = useMemo(
    () => fields.reduce((sum, field) => sum + (field.areaM2 ?? 0), 0),
    [fields],
  );
  const fieldsWithoutSection = useMemo(
    () => fields.filter((field) => !field.sectionId),
    [fields],
  );
  const selectedFieldCropSummary = selectedField
    ? summarizeFieldCrops(cropTitlesByFieldId.get(selectedField.id) ?? [])
    : null;
  const selectedFieldSectionName = selectedField?.sectionId
    ? sections.find((section) => section.id === selectedField.sectionId)?.name ?? "Utan skifte"
    : "Utan skifte";
  const selectedFieldStatus = selectedFieldCropSummary
    ? `Planerad för ${selectedFieldCropSummary}`
    : "Ingen gröda planerad ännu.";

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === mapWorkspaceRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (openNewFieldOnLoad) {
      fieldDialogRef.current?.showModal();
    }
  }, [openNewFieldOnLoad]);

  useEffect(() => {
    if (!isFullscreen) return;
    const frame = requestAnimationFrame(() => {
      fitGardenToView();
    });
    return () => cancelAnimationFrame(frame);
  }, [isFullscreen]);

  useEffect(() => {
    if (fields.length === 0) return;
    const frame = requestAnimationFrame(() => {
      fitGardenToView();
    });
    return () => cancelAnimationFrame(frame);
  }, [fields.length]);

  function persistPlacement(fieldId: string, placement: Placement) {
    const formData = new FormData();
    formData.set("fieldId", fieldId);
    formData.set("positionX", String(Math.round(placement.x)));
    formData.set("positionY", String(Math.round(placement.y)));
    formData.set("rotationDeg", String(placement.rotationDeg));

    startTransition(async () => {
      await updateFieldPlacementAction(formData);
    });
  }

  function rotateSelectedField(delta: number) {
    if (!selectedField) return;
    const currentPlacement = placements[selectedField.id] ?? getInitialPlacement(selectedField, 0);
    const nextPlacement = {
      ...currentPlacement,
      rotationDeg: (((currentPlacement.rotationDeg + delta) % 360) + 360) % 360,
    };
    setPlacements((current) => ({ ...current, [selectedField.id]: nextPlacement }));
    persistPlacement(selectedField.id, nextPlacement);
  }

  function updateZoom(nextZoom: number) {
    setZoom(Math.min(Math.max(nextZoom, 0.5), 1.75));
  }

  function fitGardenToView() {
    if (!mapRef.current || fields.length === 0) {
      updateZoom(1);
      return;
    }
    const bounds = fields.reduce(
      (currentBounds, field, index) => {
        const placement = placements[field.id] ?? getInitialPlacement(field, index);
        const size = getFieldSize(field);
        return {
          maxX: Math.max(currentBounds.maxX, placement.x + size.width),
          maxY: Math.max(currentBounds.maxY, placement.y + size.height),
          minX: Math.min(currentBounds.minX, placement.x),
          minY: Math.min(currentBounds.minY, placement.y),
        };
      },
      { maxX: 1, maxY: 1, minX: Number.POSITIVE_INFINITY, minY: Number.POSITIVE_INFINITY },
    );
    const padding = 80;
    const spanX = Math.max(bounds.maxX - bounds.minX, 1);
    const spanY = Math.max(bounds.maxY - bounds.minY, 1);
    const nextZoom = Math.min(
      (mapRef.current.clientWidth - padding) / spanX,
      (mapRef.current.clientHeight - padding) / spanY,
      1.75,
    );
    updateZoom(nextZoom);
    requestAnimationFrame(() => {
      const scaledMinX = bounds.minX * nextZoom;
      const scaledMinY = bounds.minY * nextZoom;
      const scaledSpanX = spanX * nextZoom;
      const scaledSpanY = spanY * nextZoom;
      mapRef.current?.scrollTo({
        left: Math.max(0, scaledMinX - (mapRef.current.clientWidth - scaledSpanX) / 2),
        top: Math.max(0, scaledMinY - (mapRef.current.clientHeight - scaledSpanY) / 2),
      });
    });
  }

  async function toggleFullscreen() {
    if (!mapWorkspaceRef.current) return;
    if (document.fullscreenElement === mapWorkspaceRef.current) {
      await document.exitFullscreen();
      return;
    }
    await mapWorkspaceRef.current.requestFullscreen();
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, field: FieldRow) {
    if (event.button !== 0) return;
    setSelectedFieldId(field.id);
    const placement = placements[field.id] ?? getInitialPlacement(field, 0);
    dragRef.current = {
      fieldId: field.id,
      moved: false,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: placement.x,
      startY: placement.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (Math.abs(event.clientX - drag.startClientX) > 3 || Math.abs(event.clientY - drag.startClientY) > 3) {
      drag.moved = true;
    }

    const nextX = Math.max(0, drag.startX + (event.clientX - drag.startClientX) / zoom);
    const nextY = Math.max(0, drag.startY + (event.clientY - drag.startClientY) / zoom);
    setPlacements((current) => ({
      ...current,
      [drag.fieldId]: {
        ...(current[drag.fieldId] ?? { rotationDeg: 0, x: 0, y: 0 }),
        x: nextX,
        y: nextY,
      },
    }));
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const moved = drag.moved;

    const placement = {
      ...(placements[drag.fieldId] ?? { rotationDeg: 0, x: drag.startX, y: drag.startY }),
      x: Math.max(0, drag.startX + (event.clientX - drag.startClientX) / zoom),
      y: Math.max(0, drag.startY + (event.clientY - drag.startClientY) / zoom),
    };
    dragRef.current = null;
    setPlacements((current) => ({ ...current, [drag.fieldId]: placement }));
    if (moved) {
      persistPlacement(drag.fieldId, placement);
    } else {
      const field = fields.find((item) => item.id === drag.fieldId);
      if (field) {
        openFieldEditor(field);
      }
    }
  }

  function confirmDelete(event: FormEvent<HTMLFormElement>, label: string) {
    if (!window.confirm(`Ta bort ${label}?`)) {
      event.preventDefault();
    }
  }

  function openFieldEditor(field: FieldRow) {
    setSelectedFieldId(field.id);
    editFieldDialogRef.current?.showModal();
  }

  function openSectionEditor(section: SectionRow) {
    setSelectedSectionId(section.id);
    editSectionDialogRef.current?.showModal();
  }

  return (
    <section className={`portal-fields-layout grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px] ${isFullscreen ? "is-fullscreen" : ""}`} ref={mapWorkspaceRef}>
      <section className="portal-fields-surface min-w-0 rounded-[22px] border border-[var(--border)] bg-white/90 p-5 shadow-[0_18px_40px_rgba(22,58,54,0.06)]">
        <div className="portal-fields-head">
          <div>
            <div className="portal-fields-title-row">
              <h2 className="mt-1 text-2xl font-light tracking-[-0.04em] text-[var(--foreground)]">Översikt</h2>
              <button aria-label="Hjälp om odlingsytor" className="portal-help-button" onClick={() => helpDialogRef.current?.showModal()} type="button">?</button>
            </div>
          </div>
          <div className="portal-fields-head__stats" aria-label="Sammanfattning av odlingsytor">
            <span>{sections.length} skiften</span>
            <span>{fields.length} ytor</span>
            <span>{formatArea(totalAreaM2)}</span>
          </div>
        </div>

        {error ? <p className="mt-4 rounded-xl border border-[var(--harvest)] bg-[#fff0ef] px-4 py-3 text-sm">{error}</p> : null}

        <div className="portal-field-actions-row">
          <button className="portal-button-secondary" onClick={() => sectionDialogRef.current?.showModal()} type="button">Lägg till skifte</button>
          <button className="portal-button-primary" onClick={() => fieldDialogRef.current?.showModal()} type="button">Lägg till yta</button>
        </div>

        <div className="portal-field-map-toolbar">
          <label className="portal-field-time-slider">
            <span>Beläggning vecka {occupancyWeek}</span>
            <input max="52" min="1" onChange={(event) => setOccupancyWeek(Number(event.target.value))} step="1" type="range" value={occupancyWeek} />
          </label>
          <button className="portal-button-secondary" onClick={() => updateZoom(zoom - 0.1)} type="button">-</button>
          <span className="portal-zoom-label">{Math.round(zoom * 100)}%</span>
          <button className="portal-button-secondary" onClick={() => updateZoom(zoom + 0.1)} type="button">+</button>
          <button className="portal-button-secondary" onClick={() => updateZoom(1)} type="button">Återställ</button>
          <button className="portal-button-secondary" onClick={fitGardenToView} type="button">Till odlingen</button>
          <button className="portal-button-secondary" onClick={toggleFullscreen} type="button">{isFullscreen ? "Lämna helskärm" : "Helskärm"}</button>
          {isPending ? <span className="text-xs text-[var(--ink-muted)]">Sparar placering...</span> : null}
        </div>

        <div className="portal-field-map" ref={mapRef}>
          {fields.length > 0 ? (
            <div className="portal-field-map__canvas" style={{ height: `${1100 * zoom}px`, width: `${1600 * zoom}px` }}>
              {fields.map((field, index) => {
                const placement = placements[field.id] ?? getInitialPlacement(field, index);
                const cropSummary = summarizeFieldCrops(cropTitlesByFieldId.get(field.id) ?? []);
                const isSelected = field.id === selectedField?.id;
                const sectionColor = getSectionColor(field.sectionId, sections);
                const fieldStyle = {
                  ...getFieldStyle(field, placement, zoom),
                  ["--section-color" as string]: sectionColor,
                } as CSSProperties;
                return (
                  <button
                    aria-current={isSelected ? "true" : undefined}
                    className={`portal-field-plot-link ${isSelected ? "is-selected" : ""}`}
                    key={field.id}
                    onPointerDown={(event) => handlePointerDown(event, field)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={fieldStyle}
                    type="button"
                  >
                    <div className={getPlotClasses(field.type)}>
                      <span className="portal-field-plot__surface" aria-hidden="true" />
                      <div className="portal-field-plot__content relative z-10 flex min-w-0 items-center justify-between gap-2">
                        <span className="min-w-0 truncate rounded-full bg-white/75 px-2 py-1 text-xs font-semibold text-[var(--primary-strong)]">{field.name}</span>
                      </div>
                      {cropSummary ? <span className="portal-field-plot__content relative z-10 max-w-full truncate rounded-full bg-white/65 px-2 py-1 text-[0.72rem] text-[var(--ink-muted)]">{cropSummary}</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid min-h-[420px] place-content-center text-center">
              <strong className="text-xl font-medium text-[var(--primary)]">Ingen odlingsyta än</strong>
            </div>
          )}
          <span className="portal-field-map-note">Dra ytor för att flytta dem</span>
        </div>
      </section>

      <aside className="portal-fields-sidebar grid min-w-0 content-start gap-4">
        <section className="portal-fields-sidebar-card rounded-[22px] border border-[var(--border)] bg-white/90 p-5 shadow-[0_18px_40px_rgba(22,58,54,0.06)]">
          <div className="portal-fields-sidebar-head">
            <div>
              <p className="section-kicker">Skiften</p>
              <h3 className="text-xl font-light tracking-[-0.03em]">Bäddlista</h3>
            </div>
            <p className="portal-fields-sidebar-meta">
              {fields.length} ytor
              {fieldsWithoutSection.length > 0 ? ` · ${fieldsWithoutSection.length} utan skifte` : ""}
            </p>
          </div>
          {false && selectedField ? (
            <div className="portal-selected-field-card mt-4" style={{ ["--section-color" as string]: getSectionColor(selectedField.sectionId, sections) } as CSSProperties}>
              <strong>{selectedField.name}</strong>
              <span>{getFieldTypeLabel(selectedField.type)} · {formatArea(selectedField.areaM2)} · {formatDimensions(selectedField)}</span>
              <span>{selectedFieldSectionName}{selectedFieldCropSummary ? ` · ${selectedFieldCropSummary}` : ""}</span>
            </div>
          ) : null}
          <div className="portal-bed-list mt-4">
            {sections.map((section) => {
              const sectionFields = fields.filter((field) => field.sectionId === section.id);
              return (
                <details className="portal-bed-section" key={section.id} open style={{ ["--section-color" as string]: getSectionColor(section.id, sections) } as CSSProperties}>
                  <summary onClick={() => setSelectedSectionId(section.id)}>
                    <span className="portal-bed-section__summary">
                      <span className="portal-bed-section__title">
                        <span className="portal-bed-dot" />
                        <strong>{section.name}{section.family ? ` · ${section.family}` : ""}</strong>
                        <span className="portal-bed-toggle">▸</span>
                      </span>
                      <span className="portal-bed-section__meta">
                        {sectionFields.length} bäddar · {section.rotationEnabled ? `följd ${section.rotationOrder ?? "-"}` : "ingår inte"}
                      </span>
                      <span className="portal-bed-section__buttons">
                        <button className="portal-bed-button" onClick={(event) => { event.preventDefault(); openSectionEditor(section); }} type="button">Redigera</button>
                        <form action={deleteSectionAction} onSubmit={(event) => confirmDelete(event, section.name)}>
                          <input name="sectionId" type="hidden" value={section.id} />
                          <button className="portal-bed-button portal-bed-button--danger" onClick={(event) => event.stopPropagation()} type="submit">Ta bort</button>
                        </form>
                      </span>
                    </span>
                  </summary>
                  <div className="portal-bed-section__beds">
                    {sectionFields.length > 0 ? (
                      sectionFields.map((field) => (
                        <div className={`portal-bed-row ${field.id === selectedField?.id ? "is-selected" : ""}`} key={field.id} style={{ ["--section-color" as string]: getSectionColor(section.id, sections) } as CSSProperties}>
                          <button onClick={() => { setSelectedFieldId(field.id); openFieldEditor(field); }} type="button">
                            <span className="portal-bed-dot" />
                            <strong>{field.name}</strong>
                            <span>{getFieldTypeLabel(field.type)} · {formatArea(field.areaM2)}</span>
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="portal-bed-empty">Inga bäddar i skiftet.</span>
                    )}
                  </div>
                </details>
              );
            })}
            <details className="portal-bed-section" open style={{ ["--section-color" as string]: getSectionColor(null, sections) } as CSSProperties}>
              <summary>
                <span className="portal-bed-section__summary">
                  <span className="portal-bed-section__title">
                    <span className="portal-bed-dot" />
                    <strong>Utan skifte</strong>
                    <span className="portal-bed-toggle">▸</span>
                  </span>
                  <span className="portal-bed-section__meta">{fieldsWithoutSection.length} bäddar</span>
                </span>
              </summary>
              <div className="portal-bed-section__beds">
                {fieldsWithoutSection.map((field) => (
                  <div className={`portal-bed-row ${field.id === selectedField?.id ? "is-selected" : ""}`} key={field.id} style={{ ["--section-color" as string]: getSectionColor(null, sections) } as CSSProperties}>
                    <button onClick={() => { setSelectedFieldId(field.id); openFieldEditor(field); }} type="button">
                      <span className="portal-bed-dot" />
                      <strong>{field.name}</strong>
                      <span>{getFieldTypeLabel(field.type)} · {formatArea(field.areaM2)}</span>
                    </button>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </section>
      </aside>

      <dialog className="portal-dialog" ref={fieldDialogRef}>
        <form action={createFieldAction} className="portal-dialog__card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">Ytor</p>
            <h3 className="mt-1 text-2xl font-light tracking-[-0.04em]">Ny odlingsyta</h3>
          </div>
          <FieldFormFields sections={sections} selectedSectionId={selectedSectionId} showCount />
          <div className="flex justify-end gap-2">
            <button className="portal-button-secondary" onClick={() => fieldDialogRef.current?.close()} type="button">Avbryt</button>
            <button className="portal-button-primary" type="submit">Spara yta</button>
          </div>
        </form>
      </dialog>

      <dialog className="portal-dialog" ref={sectionDialogRef}>
        <form action={createSectionAction} className="portal-dialog__card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">Skiften</p>
            <h3 className="mt-1 text-2xl font-light tracking-[-0.04em]">Nytt skifte</h3>
          </div>
          <SectionFormFields familyOptions={familyOptions} />
          <div className="flex justify-end gap-2">
            <button className="portal-button-secondary" onClick={() => sectionDialogRef.current?.close()} type="button">Avbryt</button>
            <button className="portal-button-primary" type="submit">Spara skifte</button>
          </div>
        </form>
      </dialog>

      <dialog className="portal-dialog" ref={editSectionDialogRef}>
        {selectedSection ? (
          <form action={updateSectionAction} className="portal-dialog__card">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">Skiften</p>
              <h3 className="mt-1 text-2xl font-light tracking-[-0.04em]">{selectedSection.name}</h3>
            </div>
            <SectionFormFields familyOptions={familyOptions} section={selectedSection} />
            <div className="flex justify-end gap-2">
              <button className="portal-button-secondary" onClick={() => editSectionDialogRef.current?.close()} type="button">Avbryt</button>
              <button className="portal-button-primary" type="submit">Spara skifte</button>
            </div>
          </form>
        ) : null}
      </dialog>

      <dialog className="portal-dialog" ref={editFieldDialogRef}>
        {selectedField ? (
          <form action={updateFieldAction} className="portal-dialog__card">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">Bäddinfo</p>
              <h3 className="mt-1 text-2xl font-light tracking-[-0.04em]">{selectedField.name}</h3>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">{getFieldTypeLabel(selectedField.type)} · {formatArea(selectedField.areaM2)} · {formatDimensions(selectedField)}</p>
            </div>
            <div className="portal-field-info-meta">
              <div>
                <strong>Skifte</strong>
                <span>{selectedFieldSectionName}</span>
              </div>
              <div>
                <strong>Status</strong>
                <span>{selectedFieldStatus}</span>
              </div>
            </div>
            <FieldFormFields field={selectedField} sections={sections} selectedSectionId={selectedSectionId} />
            <label className="grid gap-2 text-sm font-semibold">
              Rotation
              <div className="portal-field-rotation-controls">
                <button className="portal-button-secondary" onClick={() => rotateSelectedField(-90)} type="button">Rotera -90°</button>
                <button className="portal-button-secondary" onClick={() => rotateSelectedField(90)} type="button">Rotera +90°</button>
              </div>
            </label>
            <div className="flex justify-end gap-2">
              <button className="portal-button-secondary portal-button-danger" formAction={deleteFieldAction} formNoValidate onClick={(event) => {
                if (!window.confirm(`Ta bort ${selectedField.name}?`)) {
                  event.preventDefault();
                }
              }} type="submit">Ta bort</button>
              <button className="portal-button-secondary" onClick={() => editFieldDialogRef.current?.close()} type="button">Avbryt</button>
              <button className="portal-button-primary" type="submit">Spara yta</button>
            </div>
          </form>
        ) : null}
      </dialog>

      <dialog className="portal-dialog" ref={helpDialogRef}>
        <form className="portal-dialog__card portal-help-card" method="dialog">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">Hjälp</p>
            <h3 className="mt-1 text-2xl font-light tracking-[-0.04em]">Odlingsytor</h3>
          </div>
          <div className="portal-help-grid">
            <article className="portal-help-item">
              <strong>Kartan</strong>
              <p>Kartan visar hela odlingen. Du kan panorera, zooma och flytta ytor för att bygga upp din layout.</p>
            </article>
            <article className="portal-help-item">
              <strong>Skiften och bäddar</strong>
              <p>Skiften håller ihop växtföljd och struktur. När du lägger till flera bäddar samtidigt placeras de i följd med mellanrum.</p>
            </article>
            <article className="portal-help-item">
              <strong>Till odlingen</strong>
              <p>Knappen zoomar och flyttar vyn så att hela den aktuella odlingen får plats i kartfönstret.</p>
            </article>
          </div>
          <div className="flex justify-end">
            <button className="portal-button-primary" type="submit">Stäng</button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
