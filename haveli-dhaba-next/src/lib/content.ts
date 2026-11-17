import "server-only";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_GALLERY, DEFAULT_MENU, DEFAULT_SETTINGS, type GalleryImg, type MenuCat, type Settings } from "@/data/defaults";

const configured = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Loads public content from Supabase; falls back to bundled defaults if Supabase is unset, unreachable or empty. */
export async function getSiteContent(): Promise<{ settings: Settings; menu: MenuCat[]; gallery: GalleryImg[] }> {
  if (!configured()) return { settings: DEFAULT_SETTINGS, menu: DEFAULT_MENU, gallery: DEFAULT_GALLERY };
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } }); // anon key: RLS only exposes published content
    const [s, c, i, g] = await Promise.all([
      sb.from("site_settings").select("key,value"),
      sb.from("menu_categories").select("id,name").order("sort_order"),
      sb.from("menu_items").select("id,category_id,name,price,image_url").order("sort_order"),
      sb.from("gallery_images").select("storage_path,caption,alt_text").order("sort_order"),
    ]);
    const settings = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
    (s.data ?? []).forEach((r) => { settings[r.key] = r.value; });
    const menu: MenuCat[] = (c.data ?? []).map((cat) => ({ id: cat.id, name: cat.name,
      items: (i.data ?? []).filter((x) => x.category_id === cat.id).map((x) => ({ id: x.id, name: x.name, price: x.price === null ? null : Number(x.price), image_url: x.image_url })) })).filter((cat) => cat.items.length);
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const gallery: GalleryImg[] = (g.data ?? []).map((x) => ({ src: `${base}/storage/v1/object/public/gallery/${x.storage_path}`, alt: x.alt_text || x.caption || "Haveli Dhaba photo" }));
    return { settings: settings as Settings, menu: menu.length ? menu : DEFAULT_MENU, gallery: gallery.length ? gallery : DEFAULT_GALLERY };
  } catch { return { settings: DEFAULT_SETTINGS, menu: DEFAULT_MENU, gallery: DEFAULT_GALLERY }; }
}
