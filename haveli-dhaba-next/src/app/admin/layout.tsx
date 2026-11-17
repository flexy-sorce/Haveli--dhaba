import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/server";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const a = await requireAdmin();
  if (!a) return <>{children}</>; // login page; protected pages redirect themselves
  return (<div className="admin-shell">
    <nav className="admin-nav"><Link className="admin-brand" href="/admin">Haveli Dhaba <span>Admin</span></Link>
      <div className="admin-links"><Link href="/admin/bookings">Bookings</Link><Link href="/admin/orders">Orders</Link><Link href="/admin/menu">Menu</Link><Link href="/admin/gallery">Gallery</Link><Link href="/admin/settings">Settings</Link><Link href="/" target="_blank">View site ↗</Link></div></nav><main className="admin-main">{children}</main></div>);
}
