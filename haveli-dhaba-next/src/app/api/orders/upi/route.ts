import { NextResponse } from "next/server";
import { z } from "zod";
import { createHmac } from "crypto";
import { supabaseService } from "@/lib/supabase/service";

const schema = z.object({ orderNumber: z.string().regex(/^HD-[A-Z0-9]{8}$/), phone: z.string().regex(/^[6-9][0-9]{9}$/) });

export async function POST(request: Request) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return NextResponse.json({ error: "UPI payments are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server, or choose Cash on Delivery." }, { status: 503 });
  try {
    const { orderNumber, phone } = schema.parse(await request.json());
    const sb = supabaseService();
    const { data: order } = await sb.from("orders").select("id,total,payment_status").eq("order_number", orderNumber).eq("phone", phone).maybeSingle();
    if (!order || order.payment_status !== "pending") return NextResponse.json({ error: "Order is not available for UPI payment" }, { status: 400 });
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}` },
      body: JSON.stringify({ amount: Math.round(Number(order.total) * 100), currency: "INR", receipt: orderNumber, notes: { phone } }),
    });
    if (!response.ok) return NextResponse.json({ error: "Payment provider could not create a payment order" }, { status: 502 });
    const paymentOrder = await response.json() as { id: string; amount: number; currency: string };
    const { error: linkError } = await sb.from("orders").update({ razorpay_order_id: paymentOrder.id }).eq("id", order.id).eq("payment_status", "pending");
    if (linkError) {
      console.error("Could not link payment order", linkError);
      return NextResponse.json({ error: "Could not prepare payment for this order" }, { status: 500 });
    }
    return NextResponse.json({ key: process.env.RAZORPAY_KEY_ID, paymentOrder });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid payment request" }, { status: 400 });
    console.error("UPI order creation failed", error);
    return NextResponse.json({ error: "Could not start UPI payment" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!process.env.RAZORPAY_KEY_SECRET) return NextResponse.json({ error: "UPI payments are not configured" }, { status: 503 });
  const schemaWithPayment = schema.extend({ razorpayOrderId: z.string().min(1), razorpayPaymentId: z.string().min(1), razorpaySignature: z.string().min(1) });
  try {
    const body = schemaWithPayment.parse(await request.json());
    const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${body.razorpayOrderId}|${body.razorpayPaymentId}`).digest("hex");
    if (expected !== body.razorpaySignature) return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    const sb = supabaseService();
    const { data, error } = await sb.from("orders").update({ payment_status: "paid", payment_reference: body.razorpayPaymentId }).eq("order_number", body.orderNumber).eq("phone", body.phone).eq("payment_status", "pending").eq("razorpay_order_id", body.razorpayOrderId).select("order_number").maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Order payment could not be verified" }, { status: 400 });
    return NextResponse.json({ verified: true });
  } catch { return NextResponse.json({ error: "Invalid payment verification request" }, { status: 400 }); }
}
