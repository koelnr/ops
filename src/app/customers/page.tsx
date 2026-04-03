import { getCustomers } from "@/lib/sheets/customers";
import { CustomersView } from "@/components/views/customers-view";

export default async function CustomersPage() {
  const customers = await getCustomers().catch((err) => {
    console.error("[customers page]", err);
    return [];
  });
  return <CustomersView customers={customers} />;
}
