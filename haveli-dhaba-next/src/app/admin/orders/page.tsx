import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import { updateOrder } from "./actions";

const STATUSES = ["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];
const PAYMENTS = ["unpaid", "pending", "paid", "failed"];
const label = (value: string) => value.replaceAll("_", " ");

export default async function OrdersAdmin() {
  const admin = await requireAdmin(); if (!admin) redirect("/admin/login");
  const { data, error } = await admin.sb.from("orders").select("*,order_items(item_name,quantity,unit_price,line_total)").order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  return <div><h1>Food orders</h1><p>Update status only after the kitchen or delivery team confirms the change. UPI orders are paid only after server-side signature verification.</p>
    {(data ?? []).length === 0 && <p>No food orders yet.</p>}
    {(data ?? []).map((order) => <form action={updateOrder} key={order.id} style={{ border: "1px solid #C6A15B55", borderRadius: 14, padding: 14, margin: "10px 0" }}>
      <input type="hidden" name="id" value={order.id} /><b>{order.order_number}</b> · {order.customer_name} · <a href={`tel:+91${order.phone}`}>{order.phone}</a><br />
      {order.order_type} · ₹{Number(order.total).toFixed(2)} · {new Date(order.created_at).toLocaleString("en-IN")}<br />
      <small>{(order.order_items ?? []).map((item: { item_name: string; quantity: number }) => `${item.item_name} × ${item.quantity}`).join(" · ")}</small>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}><select name="status" defaultValue={order.status}>{STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select><select name="payment_status" defaultValue={order.payment_status}>{PAYMENTS.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select><button>Save order</button></div>
    </form>)}</div>;
}
