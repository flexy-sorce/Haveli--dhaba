import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS } from "@/data/defaults";
import { saveSettings } from "./actions";

export default async function SettingsAdmin() {
  const a = await requireAdmin(); if (!a) redirect("/admin/login");
  const { data } = await a.sb.from("site_settings").select("key,value");
  const s: Record<string, any> = { ...DEFAULT_SETTINGS }; (data ?? []).forEach((r) => (s[r.key] = r.value));
  const F = (label: string, name: string, extra: object = {}) => (<label style={{ display: "grid", gap: 4 }}>{label}<input name={name} defaultValue={String(s[name] ?? "")} required {...extra} /></label>);
  return (<div style={{ maxWidth: 560 }}><h1>Website settings</h1>
    <form action={saveSettings} style={{ display: "grid", gap: 12 }}>
      {F("Hero headline", "hero_headline", { maxLength: 80 })}{F("Hero text", "hero_text", { maxLength: 300 })}
      {F("Phone (shown on site)", "phone")}{F("Address", "address")}{F("Opening hours", "hours")}{F("Instagram link (https://…)", "instagram", { type: "url" })}
      {F("Google rating (0–5)", "rating", { type: "number", step: "0.1", min: 0, max: 5 })}{F("Number of Google reviews", "review_count", { type: "number", min: 0 })}{F("Delivery fee (₹)", "delivery_fee", { type: "number", min: 0, step: "0.01" })}
      <button>Save settings</button></form></div>);
}
