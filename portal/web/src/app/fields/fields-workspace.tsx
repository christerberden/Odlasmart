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
  const shortSide = Math.min(widthM, lengthM);
  const longSide = Math.max(widthM, lengthM);

  return {
    width: Math.min(Math.max(longSide * 58, 160), 720),
    height: Math.min(Math.max(shortSide * 86, 58), 170),
  };
}

function getFieldStyle(field: FieldRow, placement: Placement, zoom: number): CSSProperties {
  const size = getFieldSize(field);

  return {
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
      <label className="grid gap-1 text-sm font-semibold">
        Beskrivning
        <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]" defaultValue={field?.description} name="description" placeholder="Kålväxter, vårbädd eller växthus" />
      </label>
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
        Beskrivning
        <input className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--primary)]" defaultValue={section?.description} name="description" placeholder="Norra odlingen" />
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
      <label className="flex items-center gap-2 text-sm font-semibold">
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
  const dragRef = useRef<{
    fieldId: string;
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
          maxX: Math.max(currentBounds.maxX, placement.x + size.width + 80),
          maxY: Math.max(currentBounds.maxY, placement.y + size.height + 80),
        };
      },
      { maxX: 1, maxY: 1 },
    );
    const nextZoom = Math.min(mapRef.current.clientWidth / bounds.maxX, mapRef.current.clientHeight / bounds.maxY, 1.75);
    updateZoom(nextZoom);
    mapRef.current.scrollTo({ left: 0, top: 0 });
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

    const placement = {
      ...(placements[drag.fieldId] ?? { rotationDeg: 0, x: drag.startX, y: drag.startY }),
      x: Math.max(0, drag.startX + (event.clientX - drag.startClientX) / zoom),
      y: Math.max(0, drag.startY + (event.clientY - drag.startClientY) / zoom),
    };
    dragRef.current = null;
    setPlacements((current) => ({ ...current, [drag.fieldId]: placement }));
    persistPlacement(drag.fieldId, placement);
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
    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="min-w-0 rounded-[22px] border border-[var(--border)] bg-white/90 p-5 shadow-[0_18px_40px_rgba(22,58,54,0.06)]" ref={mapWorkspaceRef}>
        <p className="section-kicker">Odlingsytor</p>
        <h2 className="mt-1 text-2xl font-light tracking-[-0.04em] text-[var(--foreground)]">Översikt</h2>

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
                return (
                  <button
                    aria-current={isSelected ? "true" : undefined}
                    className={`portal-field-plot-link ${isSelected ? "is-selected" : ""}`}
                    key={field.id}
                    onClick={() => setSelectedFieldId(field.id)}
                    onPointerDown={(event) => handlePointerDown(event, field)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={getFieldStyle(field, placement, zoom)}
                    type="button"
                  >
                    <div className={getPlotClasses(field.type)}>
                      <div className="relative z-10 flex min-w-0 items-center justify-between gap-2">
                        <span className="min-w-0 truncate rounded-full bg-white/75 px-2 py-1 text-xs font-bold text-[var(--primary-strong)]">{field.name}</span>
                        {field.areaM2 != null ? <span className="shrink-0 rounded-full bg-white/55 px-2 py-1 text-[0.68rem] font-semibold text-[var(--ink-muted)]">{formatArea(field.areaM2)}</span> : null}
                      </div>
                      {cropSummary ? <span className="relative z-10 max-w-full truncate rounded-full bg-white/65 px-2 py-1 text-[0.72rem] text-[var(--ink-muted)]">{cropSummary}</span> : null}
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
          <span className="sticky bottom-3 left-3 inline-flex rounded-full border border-[#3b605e1a] bg-[#fffbf7db] px-3 py-1.5 text-xs text-[var(--ink-muted)]">Dra ytor för att flytta dem</span>
        </div>
      </section>

      <aside className="grid min-w-0 content-start gap-4">
        <section className="rounded-[22px] border border-[var(--border)] bg-white/90 p-5 shadow-[0_18px_40px_rgba(22,58,54,0.06)]">
          <h3 className="text-xl font-light tracking-[-0.03em]">Bäddlista</h3>
          <div className="portal-bed-list mt-4">
            {sections.map((section) => {
              const sectionFields = fields.filter((field) => field.sectionId === section.id);
              return (
                <details className="portal-bed-section" key={section.id} open>
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
                        <div className={`portal-bed-row ${field.id === selectedField?.id ? "is-selected" : ""}`} key={field.id}>
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
            <details className="portal-bed-section" open>
              <summary>
                <span className="portal-bed-section__summary">
                  <span className="portal-bed-section__title">
                    <span className="portal-bed-dot" />
                    <strong>Utan skifte</strong>
                    <span className="portal-bed-toggle">▸</span>
                  </span>
                  <span className="portal-bed-section__meta">{fields.filter((field) => !field.sectionId).length} bäddar</span>
                </span>
              </summary>
              <div className="portal-bed-section__beds">
                {fields.filter((field) => !field.sectionId).map((field) => (
                  <div className={`portal-bed-row ${field.id === selectedField?.id ? "is-selected" : ""}`} key={field.id}>
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
    </section>
  );
}
