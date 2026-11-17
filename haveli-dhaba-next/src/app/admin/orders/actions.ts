"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/server";

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]),
  payment_status: z.enum(["unpaid", "pending", "paid", "failed"]),
});

export async function updateOrder(fd: FormData) {
  const admin = await requireAdmin(); if (!admin) throw new Error("Unauthorized");
  const fields: Record<string, string> = {};
  fd.forEach((entry, key) => { if (typeof entry === "string") fields[key] = entry; });
  const value = schema.parse(fields);
  const { error } = await admin.sb.from("orders").update({ status: value.status, payment_status: value.payment_status }).eq("id", value.id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
}
