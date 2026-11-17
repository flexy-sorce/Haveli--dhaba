"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/server";
const S = z.object({ table: z.enum(["table_bookings", "venue_enquiries"]), id: z.string().uuid(),
  status: z.enum(["pending", "contacted", "confirmed", "rejected", "cancelled", "completed"]), internal_notes: z.string().max(2000).optional() });
export async function updateBooking(fd: FormData) {
  const a = await requireAdmin(); if (!a) throw new Error("Unauthorized"); // server check; RLS is the second check
  const fields: Record<string, string> = {};
  fd.forEach((value, key) => { if (typeof value === "string") fields[key] = value; });
  const v = S.parse(fields);
  const { error } = await a.sb.from(v.table).update({ status: v.status, internal_notes: v.internal_notes ?? null }).eq("id", v.id);
  if (error) throw new Error("Update failed");
  revalidatePath("/admin/bookings");
}
