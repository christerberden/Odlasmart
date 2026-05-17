import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SeedStockBatchRow = {
  id: string;
  personalSeedId: string | null;
  name: string;
  crop: string;
  variety: string;
  quantity: number;
  purchaseYear: number | null;
  expirationYear: number | null;
  supplier: string;
  notes: string;
};

export type SeedStockUsageRow = {
  id: string;
  seedCount: number;
  note: string;
  usedAt: string;
  stockName: string;
  cropTitle: string;
};

type SeedStockBatchQueryRow = {
  id: string;
  personal_seed_id: string | null;
  name: string;
  crop: string;
  variety: string;
  quantity: number;
  purchase_year: number | null;
  expiration_year: number | null;
  supplier: string;
  notes: string;
};

type SeedStockUsageQueryRow = {
  id: string;
  seed_count: number;
  note: string;
  used_at: string;
  seed_stock_batches: {
    name: string;
    crop: string;
    variety: string;
  } | null;
  crops: {
    title: string;
  } | null;
};

export async function getSeedStockBatches(
  workspaceId: string,
): Promise<SeedStockBatchRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("seed_stock_batches")
    .select(
      "id, personal_seed_id, name, crop, variety, quantity, purchase_year, expiration_year, supplier, notes",
    )
    .eq("workspace_id", workspaceId)
    .order("crop", { ascending: true })
    .order("variety", { ascending: true });

  if (error) {
    return [];
  }

  return ((data ?? []) as SeedStockBatchQueryRow[]).map((batch) => ({
    id: batch.id,
    personalSeedId: batch.personal_seed_id,
    name: batch.name,
    crop: batch.crop,
    variety: batch.variety,
    quantity: batch.quantity,
    purchaseYear: batch.purchase_year,
    expirationYear: batch.expiration_year,
    supplier: batch.supplier,
    notes: batch.notes,
  }));
}

export async function getSeedStockUsages(
  workspaceId: string,
): Promise<SeedStockUsageRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("seed_stock_usages")
    .select("id, seed_count, note, used_at, seed_stock_batches(name, crop, variety), crops(title)")
    .eq("workspace_id", workspaceId)
    .order("used_at", { ascending: false })
    .limit(8);

  if (error) {
    return [];
  }

  return ((data ?? []) as unknown as SeedStockUsageQueryRow[]).map((usage) => {
    const stock = usage.seed_stock_batches;
    return {
      id: usage.id,
      seedCount: usage.seed_count,
      note: usage.note,
      usedAt: usage.used_at,
      stockName: stock?.name || [stock?.crop, stock?.variety].filter(Boolean).join(" - ") || "Okänd lagerpost",
      cropTitle: usage.crops?.title ?? "",
    };
  });
}
