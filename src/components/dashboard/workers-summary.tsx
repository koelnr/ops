import type { WorkerDailyOps } from "@/lib/sheets/types"
import { formatCurrency } from "@/lib/format"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface WorkerAggregate {
  workerName: string
  assigned: number
  completed: number
  completionPct: number
  complaintCount: number
  rewashCount: number
  avgRating: number
  payoutDue: number
  payoutPaid: number
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
    payoutPaid: number
    onTimePctSum: number
    onTimePctCount: number
  }>()

  for (const w of workers) {
    const existing = map.get(w.workerName) ?? {
      assigned: 0, completed: 0, complaintCount: 0, rewashCount: 0,
      ratingSum: 0, ratingCount: 0, payoutDue: 0, payoutPaid: 0,
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
      payoutPaid: existing.payoutPaid + w.payoutPaid,
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
      payoutPaid: data.payoutPaid,
      onTimePercentage,
    }
  }).sort((a, b) => b.completed - a.completed)
}

interface WorkersSummaryProps {
  workers: WorkerDailyOps[]
  complaints?: unknown[]
}

function StatChip({ label, value, highlight }: { label: string; value: string | number; highlight?: "green" | "yellow" | "red" }) {
  const colorClass = highlight === "green"
    ? "text-green-700 dark:text-green-400 font-medium"
    : highlight === "yellow"
    ? "text-yellow-700 dark:text-yellow-400"
    : highlight === "red"
    ? "text-red-700 dark:text-red-400"
    : "text-foreground"

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm tabular-nums font-medium ${colorClass}`}>{value}</span>
    </div>
  )
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {aggregated.map((worker) => {
        const completionHighlight = worker.completionPct >= 90 ? "green" : worker.completionPct >= 70 ? "yellow" : "red"
        return (
          <Card key={worker.workerName}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{worker.workerName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                <StatChip label="Assigned" value={worker.assigned} />
                <StatChip label="Completed" value={worker.completed} />
                <StatChip
                  label="Completion"
                  value={`${worker.completionPct}%`}
                  highlight={completionHighlight}
                />
                <StatChip
                  label="Avg Rating"
                  value={worker.avgRating > 0 ? worker.avgRating : "—"}
                />
                <StatChip
                  label="Complaints"
                  value={worker.complaintCount}
                />
                <StatChip
                  label="Rewashes"
                  value={worker.rewashCount}
                />
                <StatChip
                  label="Due (₹)"
                  value={worker.payoutDue > 0 ? formatCurrency(worker.payoutDue) : "—"}
                />
                <StatChip
                  label="Paid (₹)"
                  value={worker.payoutPaid > 0 ? formatCurrency(worker.payoutPaid) : "—"}
                />
                {worker.onTimePercentage > 0 && (
                  <StatChip
                    label="On-Time"
                    value={`${worker.onTimePercentage}%`}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
