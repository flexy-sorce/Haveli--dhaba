import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/service";

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD in IST
const phone = z.string().transform((s) => s.replace(/[\s-]/g, "").replace(/^(\+91|0)/, "")).refine((s) => /^[6-9]\d{9}$/.test(s));
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((d) => d >= today());
const name = z.string().trim().min(2).max(100);
const txt = (n: number) => z.string().trim().max(n).optional().transform((v) => v || null);
const hp = { website: z.string().max(0).optional() }; // honeypot: bots fill it, humans never see it

const table = z.object({ ...hp, kind: z.literal("table"), full_name: name, phone, booking_date: date, preferred_time: z.string().regex(/^\d{2}:\d{2}$/),
  guests: z.coerce.number().int().min(1).max(100), seating: z.enum(["Indoor", "Outdoor"]), special_requests: txt(500) });
const venue = z.object({ ...hp, kind: z.literal("venue"), full_name: name, phone,
  event_type: z.enum(["Birthday", "Wedding Function", "Family Gathering", "Corporate Event", "Private Party", "Other"]),
  preferred_date: date, alternative_date: date.optional().or(z.literal("").transform(() => undefined)), guests: z.coerce.number().int().min(1).max(100000),
  duration: z.string().trim().min(1).max(100), requirements: txt(1000), message: txt(1000) });
const schema = z.discriminatedUnion("kind", [table, venue]);

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const p = schema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "Please check your details and try again." }, { status: 422 });
  const { kind, website: _w, ...row } = p.data as any;
  const db = supabaseService();
  const tbl = kind === "table" ? "table_bookings" : "venue_enquiries";
  const dateCol = kind === "table" ? "booking_date" : "preferred_date";
  const since = new Date(Date.now() - 10 * 60_000).toISOString();

  const { count } = await db.from(tbl).select("id", { count: "exact", head: true }).eq("phone", row.phone).gte("created_at", since);
  if ((count ?? 0) >= 3) return NextResponse.json({ error: "Too many requests. Please call us on 077619 87706." }, { status: 429 });
  const { count: dup } = await db.from(tbl).select("id", { count: "exact", head: true }).eq("phone", row.phone).eq(dateCol, row[dateCol]).gte("created_at", since);
  if ((dup ?? 0) > 0) return NextResponse.json({ error: "We already received this request. We will contact you soon." }, { status: 409 });

  const { data, error } = await db.from(tbl).insert(row).select("id").single();
  if (error || !data) return NextResponse.json({ error: "Could not save your request. Please call us on 077619 87706." }, { status: 500 });
  // Success is returned only after the database confirmed the insert. Status is always pending.
  return NextResponse.json({ ok: true, reference: data.id.slice(0, 8).toUpperCase(), status: "pending" }, { status: 201 });
}
