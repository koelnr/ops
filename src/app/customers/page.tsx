import { getCustomers } from "@/lib/sheets/customers";
import { getBookings } from "@/lib/sheets/bookings";
import { getPayments } from "@/lib/sheets/payments";
import { getLookupContext } from "@/lib/sheets/lookups";
import { buildCustomerWithSummary } from "@/lib/selectors";
import { serializeLookupContext } from "@/lib/domain";
import { buildSelectOptions } from "@/lib/options";
import { CustomersView } from "@/components/views/customers-view";

export default async function CustomersPage() {
  const [customers, bookings, payments, ctx] = await Promise.all([
    getCustomers().catch((err) => { console.error("[customers page]", err); return []; }),
    getBookings().catch(() => []),
    getPayments().catch(() => []),
    getLookupContext().catch((err) => { console.error("[customers page] lookups", err); return null; }),
  ]);

  const customersWithSummary = ctx
    ? customers.map((c) => buildCustomerWithSummary(c, bookings, payments, ctx))
    : customers.map((c) => ({
        ...c,
        totalBookings: 0,
        totalRevenue: 0,
        lastVisit: null,
        isRepeat: false,
        areaName: c.area_id,
        acquisitionSourceLabel: c.acquisition_source_id,
      }));

  const serializedCtx = ctx ? serializeLookupContext(ctx) : null;
  const options = ctx ? buildSelectOptions(serializeLookupContext(ctx)) : null;

  return (
    <CustomersView
      customers={customersWithSummary}
      serializedCtx={serializedCtx}
      options={options}
    />
  );
}
