import { getComplaints } from "@/lib/sheets/complaints"
import { getWorkers } from "@/lib/sheets/workers"
import { ComplaintsView } from "@/components/views/complaints-view"

export default async function ComplaintsPage() {
  const [complaints, workers] = await Promise.all([
    getComplaints().catch((err) => { console.error("[complaints page]", err); return []; }),
    getWorkers().catch((err) => { console.error("[complaints page] workers", err); return []; }),
  ])
  return <ComplaintsView complaints={complaints} workers={workers} />
}
