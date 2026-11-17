import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function supabaseServer() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => jar.getAll(), setAll: (l: { name: string; value: string; options: CookieOptions }[]) => { try { l.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch { /* Server Components cannot mutate cookies. */ } } },
  });
}
/** Returns the user only if they have a row in admin_profiles. */
export async function requireAdmin() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("admin_profiles").select("id").eq("id", user.id).maybeSingle();
  return data ? { sb, user } : null;
}
