import { getWorkers } from "@/lib/sheets/workers"
import { WorkersView } from "@/components/views/workers-view"

export default async function WorkersPage() {
  const workers = await getWorkers().catch(() => [])
  return <WorkersView workers={workers} />
}
