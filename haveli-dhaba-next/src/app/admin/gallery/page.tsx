import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import { galleryAction } from "./actions";

export default async function GalleryAdmin() {
  const a = await requireAdmin(); if (!a) redirect("/admin/login");
  const { data } = await a.sb.from("gallery_images").select("*").order("sort_order");
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return (<div><h1>Gallery</h1><p>When this list is empty the website shows the built-in photos. Once you upload, only uploaded photos are shown.</p>
    <form action={galleryAction} style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}><input type="hidden" name="intent" value="upload" />
      <input type="file" name="file" accept="image/jpeg,image/png,image/webp" required /><input name="caption" placeholder="Caption (also used as alt text)" maxLength={200} /><button>Upload</button></form>
    {(data ?? []).map((g) => (<div key={g.id} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", border: "1px solid #C6A15B55", borderRadius: 14, padding: 10, margin: "8px 0" }}>
      <img src={`${base}/storage/v1/object/public/gallery/${g.storage_path}`} alt={g.alt_text ?? ""} width={110} height={80} style={{ objectFit: "cover", borderRadius: 8 }} />
      <form action={galleryAction} style={{ display: "flex", gap: 6 }}><input type="hidden" name="intent" value="caption" /><input type="hidden" name="id" value={g.id} /><input name="caption" defaultValue={g.caption ?? ""} maxLength={200} /><button>Save caption</button></form>
      <form action={galleryAction}><input type="hidden" name="intent" value="move" /><input type="hidden" name="id" value={g.id} /><button name="dir" value="up" aria-label="Move up">↑</button><button name="dir" value="down" aria-label="Move down">↓</button></form>
      <form action={galleryAction}><input type="hidden" name="intent" value="delete" /><input type="hidden" name="id" value={g.id} /><button>Delete</button></form></div>))}</div>);
}
