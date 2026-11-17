"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/server";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const uuid = z.string().uuid(); const text = z.string().trim().max(200);

export async function galleryAction(fd: FormData) {
  const a = await requireAdmin(); if (!a) throw new Error("Unauthorized");
  const f: Record<string, string> = {}; fd.forEach((value, key) => { if (typeof value === "string") f[key] = value; }); const sb = a.sb;
  const done = () => { revalidatePath("/"); revalidatePath("/admin/gallery"); };
  if (f.intent === "upload") {
    const file = fd.get("file"); if (!(file instanceof File) || !file.size) throw new Error("Choose an image");
    const ext = TYPES[file.type]; if (!ext) throw new Error("Only JPG, PNG or WebP images");
    if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB");
    const path = `${crypto.randomUUID()}.${ext}`;
    const up = await sb.storage.from("gallery").upload(path, file, { contentType: file.type });
    if (up.error) throw new Error(up.error.message);
    const { data: last } = await sb.from("gallery_images").select("sort_order").order("sort_order", { ascending: false }).limit(1);
    const { error } = await sb.from("gallery_images").insert({ storage_path: path, caption: text.parse(f.caption ?? "") || null, alt_text: text.parse(f.caption ?? "") || null, sort_order: (last?.[0]?.sort_order ?? -1) + 1 });
    if (error) { await sb.storage.from("gallery").remove([path]); throw new Error(error.message); }
  } else if (f.intent === "caption") {
    const id = uuid.parse(f.id); const c = text.parse(f.caption ?? "");
    const { error } = await sb.from("gallery_images").update({ caption: c || null, alt_text: c || null }).eq("id", id); if (error) throw new Error(error.message);
  } else if (f.intent === "move") {
    const id = uuid.parse(f.id); const dir = f.dir === "up" ? -1 : 1;
    const { data } = await sb.from("gallery_images").select("id,sort_order").order("sort_order").order("created_at");
    const rows = data ?? []; const i = rows.findIndex((r) => r.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= rows.length) return;
    [rows[i], rows[j]] = [rows[j], rows[i]];                      // swap, then renumber so orders are always unique
    for (let k = 0; k < rows.length; k++) await sb.from("gallery_images").update({ sort_order: k }).eq("id", rows[k].id);
  } else if (f.intent === "delete") {
    const id = uuid.parse(f.id);
    const { data } = await sb.from("gallery_images").select("storage_path").eq("id", id).single();
    const { error } = await sb.from("gallery_images").delete().eq("id", id); if (error) throw new Error(error.message);
    if (data) await sb.storage.from("gallery").remove([data.storage_path]);
  } else throw new Error("Unknown action");
  done();
}
