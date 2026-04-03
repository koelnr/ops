import { getWorkers } from "@/lib/sheets/workers"
import { WorkersView } from "@/components/views/workers-view"

export default async function WorkersPage() {
  const workers = await getWorkers().catch((err) => { console.error("[workers page]", err); return []; })
  return <WorkersView workers={workers} />
}
