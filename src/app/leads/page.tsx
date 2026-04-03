import { getLeads } from "@/lib/sheets/leads"
import { LeadsView } from "@/components/views/leads-view"

export default async function LeadsPage() {
  const leads = await getLeads().catch(() => [])
  return <LeadsView leads={leads} />
}
