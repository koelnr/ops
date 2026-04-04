import { getLeads } from "@/lib/sheets/leads";
import { getLookupContext } from "@/lib/sheets/lookups";
import { buildLeadWithContext } from "@/lib/selectors";
import { serializeLookupContext } from "@/lib/domain";
import { buildSelectOptions } from "@/lib/options";
import { LeadsView } from "@/components/views/leads-view";

export default async function LeadsPage() {
  const [leads, ctx] = await Promise.all([
    getLeads().catch((err) => { console.error("[leads page]", err); return []; }),
    getLookupContext().catch((err) => { console.error("[leads page] lookups", err); return null; }),
  ]);

  const leadsWithContext = ctx
    ? leads.map((l) => buildLeadWithContext(l, ctx))
    : leads.map((l) => ({
        ...l,
        areaName: l.area_id,
        interestedServiceName: l.interested_service_id,
        sourceLabel: l.source_id,
      }));

  const serializedCtx = ctx ? serializeLookupContext(ctx) : null;
  const options = ctx ? buildSelectOptions(serializeLookupContext(ctx)) : null;

  return (
    <LeadsView
      leads={leadsWithContext}
      serializedCtx={serializedCtx}
      options={options}
    />
  );
}
