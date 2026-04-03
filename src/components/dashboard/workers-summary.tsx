import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Complaint, WorkerDailyOps } from "@/lib/sheets/types"

interface WorkerAggregate {
  name: string
  assigned: number
  completed: number
  completionPct: number
  complaintCount: number
}

function aggregateWorkers(workers: WorkerDailyOps[], complaints: Complaint[]): WorkerAggregate[] {
  const map = new Map<string, { assigned: number; completed: number }>()

  for (const w of workers) {
    const existing = map.get(w.name) ?? { assigned: 0, completed: 0 }
    map.set(w.name, {
      assigned: existing.assigned + w.bookingsAssigned,
      completed: existing.completed + w.bookingsCompleted,
    })
  }

  return Array.from(map.entries()).map(([name, data]) => {
    const completionPct = data.assigned > 0
      ? Math.round((data.completed / data.assigned) * 100)
      : 0

    // Count complaints linked via worker name on bookings (best-effort)
    const complaintCount = complaints.filter(
      (c) => c.description.toLowerCase().includes(name.toLowerCase())
    ).length

    return { name, ...data, completionPct, complaintCount }
  }).sort((a, b) => b.completed - a.completed)
}

interface WorkersSummaryProps {
  workers: WorkerDailyOps[]
  complaints: Complaint[]
}

export function WorkersSummary({ workers, complaints }: WorkersSummaryProps) {
  const aggregated = aggregateWorkers(workers, complaints)

  if (aggregated.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No worker data available.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Worker</TableHead>
            <TableHead className="text-right">Assigned</TableHead>
            <TableHead className="text-right">Completed</TableHead>
            <TableHead className="text-right">Completion %</TableHead>
            <TableHead className="text-right">Complaints</TableHead>
            <TableHead className="text-right">Payout Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {aggregated.map((worker) => (
            <TableRow key={worker.name}>
              <TableCell className="font-medium text-sm">{worker.name}</TableCell>
              <TableCell className="text-right tabular-nums">{worker.assigned}</TableCell>
              <TableCell className="text-right tabular-nums">{worker.completed}</TableCell>
              <TableCell className="text-right tabular-nums">
                <span
                  className={
                    worker.completionPct >= 90
                      ? "text-green-700 dark:text-green-400 font-medium"
                      : worker.completionPct >= 70
                      ? "text-yellow-700 dark:text-yellow-400"
                      : "text-red-700 dark:text-red-400"
                  }
                >
                  {worker.completionPct}%
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {worker.complaintCount}
              </TableCell>
              <TableCell className="text-right text-muted-foreground text-sm">—</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
