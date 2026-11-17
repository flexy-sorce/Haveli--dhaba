import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
// First gate only (login redirect). Admin role is re-checked in pages, server actions and RLS.
export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => req.cookies.getAll(), setAll: (l: { name: string; value: string; options: CookieOptions }[]) => { l.forEach(({ name, value, options }) => res.cookies.set(name, value, options)); } },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user && req.nextUrl.pathname !== "/admin/login") return NextResponse.redirect(new URL("/admin/login", req.url));
  return res;
}
export const config = { matcher: ["/admin/:path*"] };
