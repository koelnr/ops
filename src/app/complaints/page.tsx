import { getComplaints } from "@/lib/sheets/complaints"
import { ComplaintsView } from "@/components/views/complaints-view"

export default async function ComplaintsPage() {
  const complaints = await getComplaints().catch((err) => { console.error("[complaints page]", err); return []; })
  return <ComplaintsView complaints={complaints} />
}
