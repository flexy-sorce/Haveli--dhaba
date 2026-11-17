import { getSiteContent } from "@/lib/content";
import SiteClient from "@/components/SiteClient";
export const revalidate = 60; // content edited in admin appears within a minute (admin actions also revalidate immediately)
export default async function Home() {
  const { settings, menu, gallery } = await getSiteContent();
  const ld = { "@context": "https://schema.org", "@type": "Restaurant", name: "Haveli Dhaba", telephone: settings.phone_tel, address: settings.address, openingHours: settings.hours, servesCuisine: "Indian" };
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} /><SiteClient settings={settings} menu={menu} gallery={gallery} /></>);
}
