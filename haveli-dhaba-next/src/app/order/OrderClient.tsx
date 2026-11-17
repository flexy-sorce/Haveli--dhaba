"use client";
import { useEffect, useMemo, useState } from "react";
import type { MenuCat } from "@/data/defaults";

type Cart = Record<string, number>;
type OrderResult = { order_number: string; total: number; payment_status: string; subtotal: number; delivery_fee: number };
declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void }; } }

const money = (value: number) => `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function OrderClient({ menu }: { menu: MenuCat[] }) {
  const [cart, setCart] = useState<Cart>({});
  const [query, setQuery] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "takeaway">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi">("cod");
  const [result, setResult] = useState<OrderResult | null>(null);
  const [tracking, setTracking] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [cartReady, setCartReady] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("haveli-cart") || "{}") as Cart;
      setCart(saved);
    } catch { setCart({}); }
    setCartReady(true);
  }, []);
  useEffect(() => {
    if (cartReady) localStorage.setItem("haveli-cart", JSON.stringify(cart));
  }, [cart, cartReady]);
  const items = useMemo(() => menu.flatMap((category) => category.items.filter((item) => item.id && item.price !== null && item.name.toLowerCase().includes(query.toLowerCase())).map((item) => ({ ...item, category: category.name }))), [menu, query]);
  const selected = useMemo(() => menu.flatMap((c) => c.items.map((item) => ({ ...item, category: c.name }))).filter((item) => item.id && cart[item.id] && item.price !== null), [menu, cart]);
  const subtotal = selected.reduce((sum, item) => sum + Number(item.price) * cart[item.id!], 0);
  const change = (id: string, value: number) => setCart((current) => { const next = { ...current }; if (value <= 0) delete next[id]; else next[id] = Math.min(value, 50); return next; });

  async function submit(form: HTMLFormElement) {
    setError(""); setResult(null);
    const data = new FormData(form);
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        customerName: data.get("customerName"), phone: data.get("phone"), orderType, address: data.get("address") || undefined,
        instructions: data.get("instructions") || undefined, paymentMethod,
        items: selected.map((item) => ({ id: item.id, quantity: cart[item.id!] })),
      }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not place order");
      setResult(body.order);
      setCart({});
      if (paymentMethod === "upi") await startPayment(body.order.order_number, String(data.get("phone")), body.razorpayConfigured);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not place order"); }
  }
  async function startPayment(orderNumber: string, phone: string, configured: boolean) {
    if (!configured) { setError("UPI order created as payment pending. The owner must configure Razorpay before online payment can be completed."); return; }
    const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.async = true;
    await new Promise<void>((resolve, reject) => { script.onload = () => resolve(); script.onerror = () => reject(new Error("Could not load payment provider")); document.body.appendChild(script); });
    const response = await fetch("/api/orders/upi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber, phone }) });
    const body = await response.json(); if (!response.ok) throw new Error(body.error);
    new window.Razorpay!({ key: body.key, amount: body.paymentOrder.amount, currency: body.paymentOrder.currency, name: "Haveli Dhaba", description: `Order ${orderNumber}`,
      order_id: body.paymentOrder.id, handler: async (payment: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const verified = await fetch("/api/orders/upi", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber, phone, razorpayOrderId: payment.razorpay_order_id, razorpayPaymentId: payment.razorpay_payment_id, razorpaySignature: payment.razorpay_signature }) });
        if (!verified.ok) setError("Payment was not verified. Your order remains unpaid; contact the restaurant with your order number.");
        else setResult((current) => current ? { ...current, payment_status: "paid" } : current);
      }, modal: { ondismiss: () => setError("Payment was cancelled. Your order remains unpaid and can be tracked below.") },
    }).open();
  }
  async function track(form: HTMLFormElement) {
    const data = new FormData(form); setError(""); setTracking(null);
    const response = await fetch(`/api/orders?order=${encodeURIComponent(String(data.get("order")))}&phone=${encodeURIComponent(String(data.get("phone")))}`);
    const body = await response.json(); if (!response.ok) setError(body.error); else setTracking(body.order);
  }
  return <main className="order-page"><div className="order-wrap"><a href="/" className="order-back">← Back to Haveli Dhaba</a><h1>Order from <span>Haveli Dhaba</span></h1>
    <p className="order-lead">Choose from dishes whose prices have been confirmed by the restaurant. Prices are calculated again on the server when you place the order.</p>
    <div className="order-grid"><section><input className="order-search" placeholder="Search priced dishes…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="order-menu">{items.map((item) => <article className="order-item" key={item.id}><div>{item.image_url && <img src={item.image_url} alt="" />}</div><div><small>{item.category}</small><h3>{item.name}</h3><b>{money(Number(item.price))}</b></div><button type="button" onClick={() => change(item.id!, (cart[item.id!] || 0) + 1)}>Add</button></article>)}</div>
      {items.length === 0 && <p>No priced dishes match your search. Please ask the restaurant to add prices in the admin menu.</p>}</section>
      <aside id="cart" className="order-card"><h2>Your order</h2>{selected.length === 0 ? <p>Your cart is empty.</p> : selected.map((item) => <div className="cart-line" key={item.id}><span>{item.name}<small>{money(Number(item.price))} each</small></span><span><button type="button" onClick={() => change(item.id!, cart[item.id!] - 1)}>-</button> {cart[item.id!]} <button type="button" onClick={() => change(item.id!, cart[item.id!] + 1)}>+</button></span></div>)}<hr /><div className="cart-total"><span>Subtotal</span><b>{money(subtotal)}</b></div>
        <form onSubmit={(e) => { e.preventDefault(); void submit(e.currentTarget); }}><input name="customerName" required minLength={2} maxLength={100} placeholder="Your name" /><input name="phone" required pattern="[6-9][0-9]{9}" inputMode="numeric" placeholder="10-digit Indian mobile" /><div className="order-choice"><label><input type="radio" checked={orderType === "delivery"} onChange={() => setOrderType("delivery")} /> Delivery</label><label><input type="radio" checked={orderType === "takeaway"} onChange={() => setOrderType("takeaway")} /> Takeaway</label></div>{orderType === "delivery" && <textarea name="address" required minLength={10} maxLength={500} placeholder="Complete delivery address" />}<textarea name="instructions" maxLength={500} placeholder="Optional instructions" /><div className="order-choice"><label><input type="radio" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} /> Cash on Delivery</label><label><input type="radio" checked={paymentMethod === "upi"} onChange={() => setPaymentMethod("upi")} /> UPI</label></div><button className="order-submit" disabled={!selected.length}>Place order · {money(subtotal)} + delivery fee</button>{error && <p className="order-error" role="alert">{error}</p>}</form>
        {result && <div className="order-success"><h3>Order received</h3><p>Order <b>{result.order_number}</b> · {money(Number(result.total))}</p><p>Payment: {result.payment_status === "paid" ? "Verified" : "Not paid yet"}. Save your order number to track status.</p></div>}
      </aside></div>
    <section className="track-card"><h2>Track an order</h2><form onSubmit={(e) => { e.preventDefault(); void track(e.currentTarget); }}><input name="order" placeholder="Order number, e.g. HD-ABC12345" required /><input name="phone" placeholder="Phone used at checkout" pattern="[6-9][0-9]{9}" required /><button>Track</button></form>{tracking !== null && <pre>{JSON.stringify(tracking, null, 2)}</pre>}</section>
  </div></main>;
}
