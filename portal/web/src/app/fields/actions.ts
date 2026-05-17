"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAuthState } from "@/lib/auth/workspaces";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type FieldType = Database["public"]["Enums"]["field_type"];

type SectionInsertClient = {
  from(table: "sections"): {
    insert(values: {
      workspace_id: string;
      name: string;
      description: string;
      family: string;
      rotation_enabled: boolean;
      rotation_order: number | null;
    }): {
      select(columns: "id"): {
        single(): Promise<{ data: { id: string } | null; error: { message: string } | null }>;
      };
    };
  };
};

type SectionUpdateClient = {
  from(table: "sections"): {
    update(values: {
      name: string;
      description: string;
      family: string;
      rotation_enabled: boolean;
      rotation_order: number | null;
    }): {
      eq(column: "id", value: string): {
        eq(column: "workspace_id", value: string): Promise<{ error: { message: string } | null }>;
      };
    };
  };
};

type DeleteClient = {
  from(table: "fields" | "sections"): {
    delete(): {
      eq(column: "id", value: string): {
        eq(column: "workspace_id", value: string): Promise<{ error: { message: string } | null }>;
      };
    };
  };
};

type FieldInsertClient = {
  from(table: "fields"): {
    insert(values: Array<{
      workspace_id: string;
      section_id: string | null;
      name: string;
      type: FieldType;
      description: string;
      width_m: number | null;
      length_m: number | null;
      position_x: number | null;
      position_y: number | null;
      rotation_deg: number;
    }>): Promise<{ error: { message: string } | null }>;
  };
};

type FieldUpdateClient = {
  from(table: "fields"): {
    update(values: {
      section_id: string | null;
      name: string;
      type: FieldType;
      description: string;
      width_m: number | null;
      length_m: number | null;
    }): {
      eq(column: "id", value: string): {
        eq(column: "workspace_id", value: string): Promise<{ error: { message: string } | null }>;
      };
    };
  };
};

type FieldPlacementUpdateClient = {
  from(table: "fields"): {
    update(values: {
      position_x: number | null;
      position_y: number | null;
      rotation_deg: number;
    }): {
      eq(column: "id", value: string): {
        eq(column: "workspace_id", value: string): Promise<{ error: { message: string } | null }>;
      };
    };
  };
};

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = getFormString(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function getOptionalInteger(formData: FormData, key: string) {
  const value = getOptionalNumber(formData, key);
  return value === null ? null : Math.max(0, Math.floor(value));
}

async function getActiveWorkspaceOrRedirect() {
  const authState = await getCurrentAuthState();
  const workspace = authState.workspaces[0];

  if (!authState.user) {
    redirect("/login");
  }

  if (!workspace) {
    redirect("/onboarding");
  }

  return workspace;
}

function getFieldType(formData: FormData) {
  const rawType = getFormString(formData, "type") || "bed";
  return [
    "bed",
    "greenhouse",
    "path",
    "tree",
    "house",
    "fence",
    "wall",
    "hedge",
    "other",
  ].includes(rawType)
    ? (rawType as FieldType)
    : "other";
}

function getFieldPreviewSize(widthM: number | null, lengthM: number | null) {
  return {
    width: Math.min(Math.max((widthM ?? 1) * 96, 54), 720),
    height: Math.min(Math.max((lengthM ?? 1) * 62, 54), 760),
  };
}

function overlaps(
  left: number,
  top: number,
  width: number,
  height: number,
  existing: { x: number; y: number; width: number; height: number }[],
  gap = 28,
) {
  return existing.some((item) => (
    left < item.x + item.width + gap &&
    left + width + gap > item.x &&
    top < item.y + item.height + gap &&
    top + height + gap > item.y
  ));
}

function findAvailablePlacement(
  width: number,
  height: number,
  existing: { x: number; y: number; width: number; height: number }[],
) {
  const startX = 24;
  const startY = 24;
  const maxWidth = 1600;
  const stepX = 36;
  const stepY = 36;

  for (let top = startY; top < 3000; top += stepY) {
    for (let left = startX; left < maxWidth; left += stepX) {
      if (!overlaps(left, top, width, height, existing)) {
        return { x: left, y: top };
      }
    }
  }

  return { x: startX, y: startY + existing.length * stepY };
}

export async function createSection(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const name = getFormString(formData, "name");

  if (!name) {
    redirect("/fields?error=Namn krävs");
  }

  const supabase = await createSupabaseServerClient();
  const sectionClient = supabase as unknown as SectionInsertClient;
  const { data, error } = await sectionClient.from("sections").insert({
    workspace_id: workspace.id,
    name,
    description: getFormString(formData, "description"),
    family: getFormString(formData, "family"),
    rotation_enabled: formData.get("rotationEnabled") === "on",
    rotation_order: getOptionalNumber(formData, "rotationOrder"),
  }).select("id").single();

  if (error) {
    redirect(`/fields?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/fields");
  redirect(`/fields?section=${data?.id ?? ""}&newField=1`);
}

export async function createField(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const name = getFormString(formData, "name");

  if (!name) {
    redirect("/fields?error=Namn krävs");
  }

  const type = getFieldType(formData);
  const fieldCount = Math.max(1, Math.min(getOptionalInteger(formData, "fieldCount") ?? 1, 50));
  const widthM = getOptionalNumber(formData, "widthM");
  const lengthM = getOptionalNumber(formData, "lengthM");
  const sectionId = getFormString(formData, "sectionId") || null;

  const supabase = await createSupabaseServerClient();
  const fieldClient = supabase as unknown as FieldInsertClient;
  const { data: existingFields, error: existingFieldsError } = await fieldClient
    .from("fields")
    .select("position_x, position_y, width_m, length_m")
    .eq("workspace_id", workspace.id);

  if (existingFieldsError) {
    redirect(`/fields?error=${encodeURIComponent(existingFieldsError.message)}`);
  }

  const size = getFieldPreviewSize(widthM, lengthM);
  const occupied = (existingFields ?? []).map((field) => ({
    x: field.position_x ?? 24,
    y: field.position_y ?? 24,
    width: getFieldPreviewSize(field.width_m, field.length_m).width,
    height: getFieldPreviewSize(field.width_m, field.length_m).height,
  }));

  const inserts = Array.from({ length: fieldCount }, (_, index) => {
    const placement = findAvailablePlacement(size.width, size.height, occupied);
    occupied.push({ x: placement.x, y: placement.y, width: size.width, height: size.height });

    return {
      workspace_id: workspace.id,
      section_id: sectionId,
      name: fieldCount > 1 ? `${name} ${index + 1}` : name,
      type,
      description: getFormString(formData, "description"),
      width_m: widthM,
      length_m: lengthM,
      position_x: placement.x,
      position_y: placement.y,
      rotation_deg: 0,
    };
  });

  const { error } = await fieldClient.from("fields").insert(inserts);

  if (error) {
    redirect(`/fields?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/fields");
  redirect("/fields");
}

export async function updateSection(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const sectionId = getFormString(formData, "sectionId");
  const name = getFormString(formData, "name");

  if (!sectionId) {
    redirect("/fields?error=Skifte saknas");
  }

  if (!name) {
    redirect(`/fields?error=${encodeURIComponent("Namn krävs")}`);
  }

  const supabase = await createSupabaseServerClient();
  const sectionClient = supabase as unknown as SectionUpdateClient;
  const { error } = await sectionClient
    .from("sections")
    .update({
      name,
      description: getFormString(formData, "description"),
      family: getFormString(formData, "family"),
      rotation_enabled: formData.get("rotationEnabled") === "on",
      rotation_order: getOptionalNumber(formData, "rotationOrder"),
    })
    .eq("id", sectionId)
    .eq("workspace_id", workspace.id);

  if (error) {
    redirect(`/fields?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/fields");
  redirect("/fields");
}

export async function deleteField(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const fieldId = getFormString(formData, "fieldId");

  if (!fieldId) {
    redirect("/fields?error=Yta saknas");
  }

  const supabase = await createSupabaseServerClient();
  const deleteClient = supabase as unknown as DeleteClient;
  const { error } = await deleteClient
    .from("fields")
    .delete()
    .eq("id", fieldId)
    .eq("workspace_id", workspace.id);

  if (error) {
    redirect(`/fields?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/fields");
  redirect("/fields");
}

export async function deleteSection(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const sectionId = getFormString(formData, "sectionId");

  if (!sectionId) {
    redirect("/fields?error=Skifte saknas");
  }

  const supabase = await createSupabaseServerClient();
  const deleteClient = supabase as unknown as DeleteClient;
  const { error } = await deleteClient
    .from("sections")
    .delete()
    .eq("id", sectionId)
    .eq("workspace_id", workspace.id);

  if (error) {
    redirect(`/fields?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/fields");
  redirect("/fields");
}

export async function updateField(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const fieldId = getFormString(formData, "fieldId");
  const name = getFormString(formData, "name");

  if (!fieldId) {
    redirect("/fields?error=Yta saknas");
  }

  if (!name) {
    redirect(`/fields?field=${fieldId}&error=${encodeURIComponent("Namn kr\u00e4vs")}`);
  }

  const supabase = await createSupabaseServerClient();
  const fieldClient = supabase as unknown as FieldUpdateClient;
  const { error } = await fieldClient
    .from("fields")
    .update({
      section_id: getFormString(formData, "sectionId") || null,
      name,
      type: getFieldType(formData),
      description: getFormString(formData, "description"),
      width_m: getOptionalNumber(formData, "widthM"),
      length_m: getOptionalNumber(formData, "lengthM"),
    })
    .eq("id", fieldId)
    .eq("workspace_id", workspace.id);

  if (error) {
    redirect(`/fields?field=${fieldId}&error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/fields");
  redirect(`/fields?field=${fieldId}`);
}

export async function updateFieldPlacement(formData: FormData) {
  const workspace = await getActiveWorkspaceOrRedirect();
  const fieldId = getFormString(formData, "fieldId");

  if (!fieldId) {
    return { ok: false, message: "Yta saknas" };
  }

  const supabase = await createSupabaseServerClient();
  const fieldClient = supabase as unknown as FieldPlacementUpdateClient;
  const { error } = await fieldClient
    .from("fields")
    .update({
      position_x: getOptionalNumber(formData, "positionX"),
      position_y: getOptionalNumber(formData, "positionY"),
      rotation_deg: getOptionalNumber(formData, "rotationDeg") ?? 0,
    })
    .eq("id", fieldId)
    .eq("workspace_id", workspace.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/fields");
  return { ok: true };
}
