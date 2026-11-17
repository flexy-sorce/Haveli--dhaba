"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/server";

const S = z.object({
  phone: z.string().trim().min(8).max(20), address: z.string().trim().min(5).max(300), hours: z.string().trim().min(2).max(100),
  instagram: z.string().url().max(300).refine((u) => u.startsWith("https://")), hero_headline: z.string().trim().min(3).max(80), hero_text: z.string().trim().min(3).max(300),
  rating: z.coerce.number().min(0).max(5), review_count: z.coerce.number().int().min(0).max(10000000), delivery_fee: z.coerce.number().min(0).max(100000),
});
export async function saveSettings(fd: FormData) {
  const a = await requireAdmin(); if (!a) throw new Error("Unauthorized");
  const fields: Record<string, string> = {};
  fd.forEach((value, key) => { if (typeof value === "string") fields[key] = value; });
  const v = S.parse(fields);
  const digits = v.phone.replace(/\D/g, "").slice(-10);           // tel: link derived from the display number (Indian mobile/landline)
  const rows = Object.entries({ ...v, phone_tel: `+91${digits}` }).map(([key, value]) => ({ key, value }));
  const { error } = await a.sb.from("site_settings").upsert(rows); if (error) throw new Error(error.message);
  revalidatePath("/"); revalidatePath("/admin/settings");
}
