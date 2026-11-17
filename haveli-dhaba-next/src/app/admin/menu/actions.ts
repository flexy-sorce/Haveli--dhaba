"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/server";

const price = z.string().optional().transform((v) => (v && v.trim() !== "" ? Number(v) : null)).refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v < 100000), "Invalid price");
const name = z.string().trim().min(1).max(120);
const num = z.coerce.number().int().min(0).max(100000);
const uuid = z.string().uuid();
const flag = z.string().optional().transform((v) => v === "on");
const imageUrl = z.string().trim().url().max(500).optional().or(z.literal(""));

export async function menuAction(fd: FormData) {
  const a = await requireAdmin(); if (!a) throw new Error("Unauthorized"); // RLS is a second check
  const f: Record<string, string> = {}; fd.forEach((value, key) => { if (typeof value === "string") f[key] = value; }); const sb = a.sb; let r;
  switch (f.intent) {
    case "addCategory": { const v = z.object({ name: name.max(80), sort_order: num }).parse(f); r = await sb.from("menu_categories").insert(v); break; }
    case "saveCategory": { const v = z.object({ id: uuid, name: name.max(80), sort_order: num, is_active: flag }).parse(f); r = await sb.from("menu_categories").update({ name: v.name, sort_order: v.sort_order, is_active: v.is_active }).eq("id", v.id); break; }
    case "deleteCategory": { const v = z.object({ id: uuid }).parse(f); r = await sb.from("menu_categories").delete().eq("id", v.id); break; }
    case "addItem": { const v = z.object({ category_id: uuid, name, price, sort_order: num, image_url: imageUrl }).parse(f); r = await sb.from("menu_items").insert({ ...v, image_url: v.image_url || null }); break; }
    case "saveItem": { const v = z.object({ id: uuid, name, price, sort_order: num, is_active: flag, image_url: imageUrl }).parse(f); r = await sb.from("menu_items").update({ name: v.name, price: v.price, sort_order: v.sort_order, is_active: v.is_active, image_url: v.image_url || null }).eq("id", v.id); break; }
    case "deleteItem": { const v = z.object({ id: uuid }).parse(f); r = await sb.from("menu_items").delete().eq("id", v.id); break; }
    default: throw new Error("Unknown action");
  }
  if (r.error) throw new Error(r.error.message);
  revalidatePath("/"); revalidatePath("/admin/menu");
}
