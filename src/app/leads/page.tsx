import { getLeads } from "@/lib/sheets/leads"
import { LeadsView } from "@/components/views/leads-view"

export default async function LeadsPage() {
  const leads = await getLeads().catch((err) => { console.error("[leads page]", err); return []; })
  return <LeadsView leads={leads} />
}
