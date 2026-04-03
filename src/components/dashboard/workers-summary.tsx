import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { WorkerDailyOps } from "@/lib/sheets/types"
import { formatCurrency } from "@/lib/format"

interface WorkerAggregate {
  workerName: string
  assigned: number
  completed: number
  completionPct: number
  complaintCount: number
  rewashCount: number
  avgRating: number
  payoutDue: number
  onTimePercentage: number
}

function aggregateWorkers(workers: WorkerDailyOps[]): WorkerAggregate[] {
  const map = new Map<string, {
    assigned: number
    completed: number
    complaintCount: number
    rewashCount: number
    ratingSum: number
    ratingCount: number
    payoutDue: number
    onTimePctSum: number
    onTimePctCount: number
  }>()

  for (const w of workers) {
    const existing = map.get(w.workerName) ?? {
      assigned: 0, completed: 0, complaintCount: 0, rewashCount: 0,
      ratingSum: 0, ratingCount: 0, payoutDue: 0,
      onTimePctSum: 0, onTimePctCount: 0,
    }
    map.set(w.workerName, {
      assigned: existing.assigned + w.assignedBookings,
      completed: existing.completed + w.completedBookings,
      complaintCount: existing.complaintCount + w.complaintCount,
      rewashCount: existing.rewashCount + w.rewashCount,
      ratingSum: existing.ratingSum + (w.avgRating > 0 ? w.avgRating : 0),
      ratingCount: existing.ratingCount + (w.avgRating > 0 ? 1 : 0),
      payoutDue: existing.payoutDue + w.payoutDue,
      onTimePctSum: existing.onTimePctSum + (w.onTimePercentage > 0 ? w.onTimePercentage : 0),
      onTimePctCount: existing.onTimePctCount + (w.onTimePercentage > 0 ? 1 : 0),
    })
  }

  return Array.from(map.entries()).map(([workerName, data]) => {
    const completionPct = data.assigned > 0
      ? Math.round((data.completed / data.assigned) * 100)
      : 0
    const avgRating = data.ratingCount > 0
      ? Math.round((data.ratingSum / data.ratingCount) * 10) / 10
      : 0
    const onTimePercentage = data.onTimePctCount > 0
      ? Math.round(data.onTimePctSum / data.onTimePctCount)
      : 0

    return {
      workerName,
      assigned: data.assigned,
      completed: data.completed,
      completionPct,
      complaintCount: data.complaintCount,
      rewashCount: data.rewashCount,
      avgRating,
      payoutDue: data.payoutDue,
      onTimePercentage,
    }
  }).sort((a, b) => b.completed - a.completed)
}

interface WorkersSummaryProps {
  workers: WorkerDailyOps[]
  complaints?: unknown[]
}

export function WorkersSummary({ workers }: WorkersSummaryProps) {
  const aggregated = aggregateWorkers(workers)

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
            <TableHead className="text-right">On-Time %</TableHead>
            <TableHead className="text-right">Avg Rating</TableHead>
            <TableHead className="text-right">Complaints</TableHead>
            <TableHead className="text-right">Rewashes</TableHead>
            <TableHead className="text-right">Payout Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {aggregated.map((worker) => (
            <TableRow key={worker.workerName}>
              <TableCell className="font-medium text-sm">{worker.workerName}</TableCell>
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
                {worker.onTimePercentage > 0 ? `${worker.onTimePercentage}%` : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {worker.avgRating > 0 ? worker.avgRating : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {worker.complaintCount}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {worker.rewashCount}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground text-sm">
                {worker.payoutDue > 0 ? formatCurrency(worker.payoutDue) : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
