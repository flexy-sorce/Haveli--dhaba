"use client";
import { useState } from "react";

const todayIST = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
type Kind = "table" | "venue";
const EVENTS = ["Birthday", "Wedding Function", "Family Gathering", "Corporate Event", "Private Party", "Other"];

export default function BookingForm({ kind, phoneDisplay, phoneTel }: { kind: Kind; phoneDisplay: string; phoneTel: string }) {
  const [err, setErr] = useState(""); const [done, setDone] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const v = kind === "venue"; const id = kind[0];
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); if (busy) return;
    const f = e.currentTarget; const d: Record<string, string> = {};
    new FormData(f).forEach((value, key) => { if (typeof value === "string") d[key] = value; });
    const ph = (d.phone || "").replace(/[\s-]/g, "").replace(/^(\+91|0)/, "");
    if (!/^[6-9]\d{9}$/.test(ph)) return setErr("Enter a valid 10-digit Indian mobile number.");
    if (!(+d.guests >= 1)) return setErr("Guests must be at least 1.");
    const main = v ? d.preferred_date : d.booking_date, t = todayIST();
    if (!main || main < t) return setErr("Please choose today or a future date.");
    if (d.alternative_date && d.alternative_date < t) return setErr("Alternative date cannot be in the past.");
    setBusy(true);
    try {
      const r = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, ...d, phone: ph }) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 201 && j.ok) { setDone(j.reference); f.reset(); }   // success ONLY after server confirms the DB insert
      else setErr(j.error || `Could not send your request. Please call us on ${phoneDisplay}.`);
    } catch { setErr(`Could not reach the server. Please call us on ${phoneDisplay}.`); }
    setBusy(false);
  }
  if (done) return (<div className="res" role="status"><strong className="gold">Request received (ref {done}).</strong> This is not a confirmed booking. The Haveli Dhaba team will review it and contact you to confirm or discuss options.<div className="row" style={{ marginTop: 12 }}><a className="btn s" href={`tel:${phoneTel}`}>Call Now</a><button className="btn s" type="button" onClick={() => setDone(null)}>Send another request</button></div></div>);
  const L = (l: string, n: string, p: React.InputHTMLAttributes<HTMLInputElement> = {}, cls = "") => (<div className={cls}><label htmlFor={id + n}>{l}</label><input id={id + n} name={n} required={!/optional/.test(l)} {...p} /></div>);
  return (
    <form className="fm" onSubmit={submit} noValidate>
      <div className="hp" aria-hidden="true"><label>Leave empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {L("Full name", "full_name", { autoComplete: "name" }, v ? "" : "f")}
      {L("Phone number", "phone", { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "10-digit mobile" }, v ? "" : "f")}
      {v ? (<>
        <div><label htmlFor="ve">Event type</label><select id="ve" name="event_type" required defaultValue=""><option value="" disabled>Select…</option>{EVENTS.map((x) => <option key={x}>{x}</option>)}</select></div>
        {L("Expected guests", "guests", { type: "number", min: 1, inputMode: "numeric" })}
        {L("Preferred event date", "preferred_date", { type: "date", min: todayIST() })}
        {L("Alternative date (optional)", "alternative_date", { type: "date", min: todayIST() })}
        {L("Event duration", "duration", { placeholder: "e.g. 4 hours" }, "f")}
        <div className="f"><label htmlFor="vr">Additional requirements</label><textarea id="vr" name="requirements" maxLength={1000} /></div>
        <div className="f"><label htmlFor="vm">Special message (optional)</label><textarea id="vm" name="message" maxLength={1000} /></div>
      </>) : (<>
        {L("Booking date", "booking_date", { type: "date", min: todayIST() })}
        {L("Preferred time", "preferred_time", { type: "time" })}
        {L("Guests", "guests", { type: "number", min: 1, max: 100, inputMode: "numeric" })}
        <div><label htmlFor="ts">Seating</label><select id="ts" name="seating" required defaultValue=""><option value="" disabled>Select…</option><option>Indoor</option><option>Outdoor</option></select></div>
        <div className="f"><label htmlFor="tr">Special requests (optional)</label><textarea id="tr" name="special_requests" maxLength={500} /></div>
      </>)}
      <div className="f err" role="alert">{err}</div>
      <div className="f row"><button className="btn p" type="submit" disabled={busy}>{busy ? "Sending…" : v ? "Enquire About Venue Booking" : "Send Booking Request"}</button>{v && <a className="btn s" href={`tel:${phoneTel}`}>Call Now · {phoneDisplay}</a>}</div>
    </form>);
}
