import { getBookings } from "@/lib/sheets/bookings";
import { getWorkers } from "@/lib/sheets/workers";
import { getVehicles } from "@/lib/sheets/vehicles";
import { getCustomers } from "@/lib/sheets/customers";
import { getLookupContext } from "@/lib/sheets/lookups";
import { serializeLookupContext } from "@/lib/domain";
import { buildSelectOptions } from "@/lib/options";
import { BookingsView } from "@/components/views/bookings-view";

export default async function BookingsPage() {
  const [bookings, workers, vehicles, customers, ctx] = await Promise.all([
    getBookings().catch((err) => { console.error("[bookings page]", err); return []; }),
    getWorkers().catch((err) => { console.error("[bookings page] workers", err); return []; }),
    getVehicles().catch((err) => { console.error("[bookings page] vehicles", err); return []; }),
    getCustomers().catch((err) => { console.error("[bookings page] customers", err); return []; }),
    getLookupContext().catch((err) => { console.error("[bookings page] lookups", err); return null; }),
  ]);

  const serializedCtx = ctx ? serializeLookupContext(ctx) : null;
  const options = ctx ? buildSelectOptions(serializeLookupContext(ctx)) : null;

  return (
    <BookingsView
      bookings={bookings}
      workers={workers}
      vehicles={vehicles}
      customers={customers}
      serializedCtx={serializedCtx}
      options={options}
    />
  );
}
