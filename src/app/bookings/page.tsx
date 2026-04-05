import {
  getBookingsResolved,
  getWorkers,
  getVehicles,
  getCustomers,
  getLookupContext,
} from "@/lib/db/adapters";
import { serializeLookupContext } from "@/lib/domain";
import { buildSelectOptions } from "@/lib/options";
import { BookingsView } from "@/components/views/bookings-view";

export default async function BookingsPage() {
  const [resolvedBookings, workers, vehicles, customers, ctx] =
    await Promise.all([
      getBookingsResolved().catch((err) => {
        console.error("[bookings page]", err);
        return [];
      }),
      getWorkers().catch((err) => {
        console.error("[bookings page] workers", err);
        return [];
      }),
      getVehicles().catch((err) => {
        console.error("[bookings page] vehicles", err);
        return [];
      }),
      getCustomers().catch((err) => {
        console.error("[bookings page] customers", err);
        return [];
      }),
      getLookupContext().catch((err) => {
        console.error("[bookings page] lookups", err);
        return null;
      }),
    ]);

  const serializedCtx = ctx ? serializeLookupContext(ctx) : null;
  const options = ctx ? buildSelectOptions(serializeLookupContext(ctx)) : null;

  return (
    <BookingsView
      resolvedBookings={resolvedBookings}
      workers={workers}
      vehicles={vehicles}
      customers={customers}
      serializedCtx={serializedCtx}
      options={options}
    />
  );
}
