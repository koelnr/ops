import { getCustomersResolved, getLookupContext } from "@/lib/db/adapters";
import { serializeLookupContext } from "@/lib/domain";
import { buildSelectOptions } from "@/lib/options";
import { CustomersView } from "@/components/views/customers-view";

export default async function CustomersPage() {
  const [resolvedCustomers, ctx] = await Promise.all([
    getCustomersResolved().catch((err) => {
      console.error("[customers page]", err);
      return [];
    }),
    getLookupContext().catch((err) => {
      console.error("[customers page] lookups", err);
      return null;
    }),
  ]);

  const serializedCtx = ctx ? serializeLookupContext(ctx) : null;
  const options = ctx ? buildSelectOptions(serializeLookupContext(ctx)) : null;

  return (
    <CustomersView
      resolvedCustomers={resolvedCustomers}
      serializedCtx={serializedCtx}
      options={options}
    />
  );
}
