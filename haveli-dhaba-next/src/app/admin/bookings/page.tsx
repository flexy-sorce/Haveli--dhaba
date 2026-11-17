import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import { updateBooking } from "./actions";
const STATUSES = ["pending", "contacted", "confirmed", "rejected", "cancelled", "completed"];
export default async function Bookings({ searchParams }: { searchParams: Promise<{ t?: string; status?: string; q?: string }> }) {
  const a = await requireAdmin(); if (!a) redirect("/admin/login");
  const sp = await searchParams; const table = sp.t === "venue_enquiries" ? "venue_enquiries" : "table_bookings";
  let q = a.sb.from(table).select("*").order("created_at", { ascending: false }).limit(200);
  if (sp.status && STATUSES.includes(sp.status)) q = q.eq("status", sp.status);
  if (sp.q) { const s = sp.q.replace(/[^\w\s]/g, ""); q = q.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%`); }
  const { data } = await q; const rows: any[] = data ?? [];
  return (<div><h1>Booking requests</h1>
    <form style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
      <select name="t" defaultValue={table}><option value="table_bookings">Table bookings</option><option value="venue_enquiries">Venue enquiries</option></select>
      <select name="status" defaultValue={sp.status ?? ""}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
      <input name="q" placeholder="Name or phone" defaultValue={sp.q ?? ""} /><button>Filter</button></form>
    {rows.length === 0 && <p>No requests found.</p>}
    {rows.map((r) => (<form key={r.id} action={updateBooking} style={{ border: "1px solid #C6A15B55", borderRadius: 14, padding: 14, margin: "10px 0" }}>
      <input type="hidden" name="table" value={table} /><input type="hidden" name="id" value={r.id} />
      <b>{r.full_name}</b> · <a href={`tel:+91${r.phone}`}>{r.phone}</a> · {r.guests} guests<br />
      {table === "table_bookings" ? <>{r.booking_date} {r.preferred_time} · {r.seating}<br />{r.special_requests}</> :
        <>{r.event_type} · {r.preferred_date}{r.alternative_date ? ` (alt ${r.alternative_date})` : ""} · {r.duration}<br />{r.requirements} {r.message}</>}
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <select name="status" defaultValue={r.status}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <input name="internal_notes" defaultValue={r.internal_notes ?? ""} placeholder="Private notes" style={{ flex: 1, minWidth: 180 }} /><button>Save</button></div></form>))}
  </div>);
}
