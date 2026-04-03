import { getWorkers } from "@/lib/sheets/workers"
import { getComplaints } from "@/lib/sheets/complaints"
import { WorkersView } from "@/components/views/workers-view"

export default async function WorkersPage() {
  const [workers, complaints] = await Promise.all([
    getWorkers().catch(() => []),
    getComplaints().catch(() => []),
  ])
  return <WorkersView workers={workers} complaints={complaints} />
}
