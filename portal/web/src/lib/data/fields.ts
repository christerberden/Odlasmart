import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SectionRow = {
  id: string;
  name: string;
  description: string;
  family: string;
  rotationEnabled: boolean;
  rotationOrder: number | null;
};

export type FieldRow = {
  id: string;
  sectionId: string | null;
  name: string;
  type: string;
  description: string;
  widthM: number | null;
  lengthM: number | null;
  areaM2: number | null;
  rotationDeg: number;
  positionX: number | null;
  positionY: number | null;
};

type SectionQueryRow = {
  id: string;
  name: string;
  description: string;
  family: string;
  rotation_enabled: boolean;
  rotation_order: number | null;
};

type FieldQueryRow = {
  id: string;
  section_id: string | null;
  name: string;
  type: string;
  description: string;
  width_m: number | null;
  length_m: number | null;
  rotation_deg: number;
  position_x: number | null;
  position_y: number | null;
};

export async function getSections(workspaceId: string): Promise<SectionRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sections")
    .select("id, name, description, family, rotation_enabled, rotation_order")
    .eq("workspace_id", workspaceId)
    .order("rotation_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    return [];
  }

  return ((data ?? []) as SectionQueryRow[]).map((section) => ({
    id: section.id,
    name: section.name,
    description: section.description,
    family: section.family,
    rotationEnabled: section.rotation_enabled,
    rotationOrder: section.rotation_order,
  }));
}

export async function getFields(workspaceId: string): Promise<FieldRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("fields")
    .select("id, section_id, name, type, description, width_m, length_m, rotation_deg, position_x, position_y")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) {
    return [];
  }

  return ((data ?? []) as FieldQueryRow[]).map((field) => ({
    id: field.id,
    sectionId: field.section_id,
    name: field.name,
    type: field.type,
    description: field.description,
    widthM: field.width_m,
    lengthM: field.length_m,
    rotationDeg: field.rotation_deg,
    positionX: field.position_x,
    positionY: field.position_y,
    areaM2:
      field.width_m != null && field.length_m != null
        ? field.width_m * field.length_m
        : null,
  }));
}
