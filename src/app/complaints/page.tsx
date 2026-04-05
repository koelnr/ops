import { getComplaintsResolved } from "@/lib/sheets/complaints";
import { getWorkers } from "@/lib/sheets/workers";
import { getLookupContext } from "@/lib/sheets/lookups";
import { serializeLookupContext } from "@/lib/domain";
import { buildSelectOptions } from "@/lib/options";
import { ComplaintsView } from "@/components/views/complaints-view";

export default async function ComplaintsPage() {
  const [resolvedComplaints, workers, ctx] = await Promise.all([
    getComplaintsResolved().catch((err) => {
      console.error("[complaints page]", err);
      return [];
    }),
    getWorkers().catch((err) => {
      console.error("[complaints page] workers", err);
      return [];
    }),
    getLookupContext().catch((err) => {
      console.error("[complaints page] lookups", err);
      return null;
    }),
  ]);

  const serializedCtx = ctx ? serializeLookupContext(ctx) : null;
  const options = ctx ? buildSelectOptions(serializeLookupContext(ctx)) : null;

  return (
    <ComplaintsView
      resolvedComplaints={resolvedComplaints}
      workers={workers}
      serializedCtx={serializedCtx}
      options={options}
    />
  );
}
