import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import { menuAction } from "./actions";

const box = { border: "1px solid #C6A15B55", borderRadius: 14, padding: 14, margin: "12px 0" } as const;
export default async function MenuAdmin() {
  const a = await requireAdmin(); if (!a) redirect("/admin/login");
  const [{ data: cats }, { data: items }] = await Promise.all([a.sb.from("menu_categories").select("*").order("sort_order"), a.sb.from("menu_items").select("*").order("sort_order")]);
  return (<div><h1>Menu</h1><p>Leave price empty to show no price. Prices appear on the site only when you enter one.</p>
    {(cats ?? []).length === 0 && <p>No categories yet. Run <code>0002_seed_menu.sql</code> to load the dish names, or add categories below.</p>}
    <form action={menuAction} style={{ ...box, display: "flex", gap: 8, flexWrap: "wrap" }}><input type="hidden" name="intent" value="addCategory" /><input name="name" placeholder="New category" required /><input name="sort_order" type="number" defaultValue={(cats?.length ?? 0)} style={{ width: 80 }} /><button>Add category</button></form>
    {(cats ?? []).map((c) => (<section key={c.id} style={box}>
      <form action={menuAction} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}><input type="hidden" name="intent" value="saveCategory" /><input type="hidden" name="id" value={c.id} />
        <input name="name" defaultValue={c.name} required /><input name="sort_order" type="number" defaultValue={c.sort_order} style={{ width: 80 }} aria-label="Order" /><label><input type="checkbox" name="is_active" defaultChecked={c.is_active} /> Visible</label><button>Save</button></form>
      <form action={menuAction}><input type="hidden" name="intent" value="deleteCategory" /><input type="hidden" name="id" value={c.id} /><button>Delete category and its dishes</button></form>
      {(items ?? []).filter((i) => i.category_id === c.id).map((i) => (<div key={i.id} style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "6px 0" }}>
        <form action={menuAction} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><input type="hidden" name="intent" value="saveItem" /><input type="hidden" name="id" value={i.id} />
          <input name="name" defaultValue={i.name} required /><input name="price" type="number" step="1" min="0" defaultValue={i.price ?? ""} placeholder="Price ₹" style={{ width: 90 }} /><input name="image_url" type="url" defaultValue={i.image_url ?? ""} placeholder="Photo URL (optional)" style={{ width: 180 }} /><input name="sort_order" type="number" defaultValue={i.sort_order} style={{ width: 70 }} aria-label="Order" />
          <label><input type="checkbox" name="is_active" defaultChecked={i.is_active} /> On</label><button>Save</button></form>
        <form action={menuAction}><input type="hidden" name="intent" value="deleteItem" /><input type="hidden" name="id" value={i.id} /><button>Delete</button></form></div>))}
      <form action={menuAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}><input type="hidden" name="intent" value="addItem" /><input type="hidden" name="category_id" value={c.id} /><input type="hidden" name="sort_order" value={999} />
        <input name="name" placeholder="New dish" required /><input name="price" type="number" min="0" placeholder="Price ₹ (optional)" style={{ width: 130 }} /><input name="image_url" type="url" placeholder="Photo URL (optional)" style={{ width: 180 }} /><button>Add dish</button></form>
    </section>))}</div>);
}
