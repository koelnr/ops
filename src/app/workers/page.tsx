import { getWorkers } from "@/lib/sheets/workers";
import { getBookings } from "@/lib/sheets/bookings";
import { getLookupContext } from "@/lib/sheets/lookups";
import { buildWorkerWithSummary } from "@/lib/selectors";
import { serializeLookupContext } from "@/lib/domain";
import { buildSelectOptions } from "@/lib/options";
import { WorkersView } from "@/components/views/workers-view";

export default async function WorkersPage() {
  const [workers, bookings, ctx] = await Promise.all([
    getWorkers().catch((err) => { console.error("[workers page]", err); return []; }),
    getBookings().catch(() => []),
    getLookupContext().catch((err) => { console.error("[workers page] lookups", err); return null; }),
  ]);

  const workersWithSummary = ctx
    ? workers.map((w) => buildWorkerWithSummary(w, bookings, ctx))
    : workers.map((w) => ({
        ...w,
        assignedCount: 0,
        completionRate: 0,
        areaName: w.primary_area_id,
      }));

  const serializedCtx = ctx ? serializeLookupContext(ctx) : null;
  const options = ctx ? buildSelectOptions(serializeLookupContext(ctx)) : null;

  return (
    <WorkersView
      workers={workersWithSummary}
      serializedCtx={serializedCtx}
      options={options}
    />
  );
}
