import { getComplaints } from "@/lib/sheets/complaints";
import { getBookings } from "@/lib/sheets/bookings";
import { getWorkers } from "@/lib/sheets/workers";
import { getCustomers } from "@/lib/sheets/customers";
import { getLookupContext } from "@/lib/sheets/lookups";
import { buildComplaintWithContext } from "@/lib/selectors";
import { serializeLookupContext } from "@/lib/domain";
import { buildSelectOptions } from "@/lib/options";
import { ComplaintsView } from "@/components/views/complaints-view";

export default async function ComplaintsPage() {
  const [complaints, bookings, workers, customers, ctx] = await Promise.all([
    getComplaints().catch((err) => { console.error("[complaints page]", err); return []; }),
    getBookings().catch(() => []),
    getWorkers().catch((err) => { console.error("[complaints page] workers", err); return []; }),
    getCustomers().catch(() => []),
    getLookupContext().catch((err) => { console.error("[complaints page] lookups", err); return null; }),
  ]);

  const complaintsWithContext = ctx
    ? complaints.map((c) => buildComplaintWithContext(c, bookings, customers, workers, ctx))
    : complaints.map((c) => ({
        ...c,
        complaintTypeLabel: c.complaint_type_id,
        customerName: "",
        workerName: "",
        bookingServiceDate: "",
      }));

  const serializedCtx = ctx ? serializeLookupContext(ctx) : null;
  const options = ctx ? buildSelectOptions(serializeLookupContext(ctx)) : null;

  return (
    <ComplaintsView
      complaints={complaintsWithContext}
      workers={workers}
      serializedCtx={serializedCtx}
      options={options}
    />
  );
}
