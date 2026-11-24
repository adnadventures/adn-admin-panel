import { listCrmOrders } from "@/lib/data/crm";
import { OrdersView } from "./orders-view";

export const metadata = {
  title: "Orders Management | CRM",
};

export default async function OrdersPage() {
  const orders = await listCrmOrders();
  return <OrdersView initialOrders={orders} />;
}
