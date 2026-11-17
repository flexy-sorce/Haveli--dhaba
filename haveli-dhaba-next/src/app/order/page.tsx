import { getSiteContent } from "@/lib/content";
import OrderClient from "./OrderClient";

export const revalidate = 60;

export default async function OrderPage() {
  const { menu } = await getSiteContent();
  return <OrderClient menu={menu} />;
}
