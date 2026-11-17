"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
export default function Login() {
  const [err, setErr] = useState("");
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
    if (error) return setErr("Invalid email or password.");
    window.location.href = "/admin/bookings"; // non-admin accounts are bounced back here server-side
  }
  return (<form onSubmit={go} style={{ maxWidth: 360, margin: "15vh auto", display: "grid", gap: 12, color: "#F7F0E3", fontFamily: "Inter,sans-serif" }}>
    <h1 style={{ color: "#C6A15B" }}>Admin login</h1>
    <input name="email" type="email" required placeholder="Email" autoComplete="username" /><input name="password" type="password" required placeholder="Password" autoComplete="current-password" />
    <button>Sign in</button><p role="alert">{err}</p></form>);
}
