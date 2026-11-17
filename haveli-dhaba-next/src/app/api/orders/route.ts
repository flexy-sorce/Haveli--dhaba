import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/service";

const requestSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit Indian mobile number"),
  orderType: z.enum(["delivery", "takeaway"]),
  address: z.string().trim().min(10).max(500).optional(),
  instructions: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["cod", "upi"]),
  items: z.array(z.object({ id: z.string().uuid(), quantity: z.number().int().min(1).max(50) })).min(1).max(50),
}).superRefine((v, ctx) => {
  if (v.orderType === "delivery" && !v.address) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["address"], message: "Delivery address is required" });
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const sb = supabaseService();
    const ids = [...new Set(body.items.map((item) => item.id))];
    const { data: menuItems, error: menuError } = await sb.from("menu_items").select("id,name,price,is_active").in("id", ids);
    if (menuError) throw menuError;
    const byId = new Map((menuItems ?? []).map((item) => [item.id, item]));
    const lines = body.items.map((item) => {
      const menuItem = byId.get(item.id);
      if (!menuItem || !menuItem.is_active || menuItem.price === null) throw new Error("One or more selected dishes are unavailable for online ordering");
      const unitPrice = Number(menuItem.price);
      return { menu_item_id: item.id, item_name: menuItem.name, unit_price: unitPrice, quantity: item.quantity, line_total: unitPrice * item.quantity };
    });
    const subtotal = lines.reduce((sum, line) => sum + line.line_total, 0);
    const { data: feeSetting } = await sb.from("site_settings").select("value").eq("key", "delivery_fee").maybeSingle();
    const configuredFee = Number(feeSetting?.value ?? 0);
    const deliveryFee = body.orderType === "delivery" && Number.isFinite(configuredFee) && configuredFee >= 0 ? configuredFee : 0;
    const total = subtotal + deliveryFee;
    const { data: order, error: orderError } = await sb.from("orders").insert({
      customer_name: body.customerName, phone: body.phone, order_type: body.orderType,
      address: body.orderType === "delivery" ? body.address : null, instructions: body.instructions || null,
      subtotal, delivery_fee: deliveryFee, total, payment_method: body.paymentMethod,
      payment_status: body.paymentMethod === "upi" ? "pending" : "unpaid",
    }).select("id,order_number,total,payment_status").single();
    if (orderError || !order) throw orderError ?? new Error("Could not create order");
    const { error: itemError } = await sb.from("order_items").insert(lines.map((line) => ({ ...line, order_id: order.id })));
    if (itemError) {
      await sb.from("orders").delete().eq("id", order.id);
      throw itemError;
    }
    return NextResponse.json({ order: { ...order, subtotal, delivery_fee: deliveryFee }, razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid order" }, { status: 400 });
    console.error("Order creation failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create order" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get("order");
  const phone = url.searchParams.get("phone");
  if (!orderNumber || !phone || !/^[6-9][0-9]{9}$/.test(phone)) return NextResponse.json({ error: "Order number and phone are required" }, { status: 400 });
  const sb = supabaseService();
  const { data, error } = await sb.from("orders").select("order_number,created_at,order_type,total,payment_method,payment_status,status,order_items(item_name,quantity,unit_price,line_total)").eq("order_number", orderNumber).eq("phone", phone).maybeSingle();
  if (error) { console.error("Order tracking failed", error); return NextResponse.json({ error: "Could not load order" }, { status: 500 }); }
  if (!data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order: data });
}
