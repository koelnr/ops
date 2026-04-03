import { getComplaints } from "@/lib/sheets/complaints"
import { ComplaintsView } from "@/components/views/complaints-view"

export default async function ComplaintsPage() {
  const complaints = await getComplaints().catch(() => [])
  return <ComplaintsView complaints={complaints} />
}
