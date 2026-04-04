import type { WorkerWithSummary } from "@/lib/domain";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function StatChip({ label, value, highlight }: {
  label: string;
  value: string | number;
  highlight?: "green" | "yellow" | "red";
}) {
  const colorClass =
    highlight === "green"
      ? "text-green-700 dark:text-green-400 font-medium"
      : highlight === "yellow"
        ? "text-yellow-700 dark:text-yellow-400"
        : highlight === "red"
          ? "text-red-700 dark:text-red-400"
          : "text-foreground";

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm tabular-nums font-medium ${colorClass}`}>{value}</span>
    </div>
  );
}

interface WorkersSummaryProps {
  workers: WorkerWithSummary[];
}

export function WorkersSummary({ workers }: WorkersSummaryProps) {
  if (workers.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No worker data available.
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {workers.map((worker) => {
        const completionHighlight =
          worker.assignedCount === 0
            ? undefined
            : worker.completionRate >= 0.9
              ? "green"
              : worker.completionRate >= 0.7
                ? "yellow"
                : "red";

        return (
          <Card key={worker.worker_id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>{worker.worker_name}</span>
                <span className={`text-xs font-normal ${worker.status === "Active" ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
                  {worker.status}
                </span>
              </CardTitle>
              {worker.areaName && (
                <p className="text-xs text-muted-foreground">{worker.areaName}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                <StatChip label="Assigned" value={worker.assignedCount} />
                <StatChip
                  label="Completion"
                  value={worker.assignedCount > 0 ? `${Math.round(worker.completionRate * 100)}%` : "—"}
                  highlight={completionHighlight}
                />
                <StatChip
                  label="Payout Rate"
                  value={worker.default_payout_rate > 0 ? `₹${worker.default_payout_rate}` : "—"}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Compact version for the dashboard overview (just shows active count + stats)
export function WorkersSummaryCompact({ workers }: WorkersSummaryProps) {
  const activeCount = workers.filter((w) => w.status === "Active").length;
  const totalAssigned = workers.reduce((s, w) => s + w.assignedCount, 0);
  const workersWithAssigned = workers.filter((w) => w.assignedCount > 0);
  const avgCompletion =
    workersWithAssigned.length > 0
      ? workersWithAssigned.reduce((s, w) => s + w.completionRate, 0) / workersWithAssigned.length
      : 0;

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
      <span><span className="font-medium">{activeCount}</span> active</span>
      <span><span className="font-medium">{totalAssigned}</span> assigned</span>
      {avgCompletion > 0 && (
        <span><span className="font-medium">{Math.round(avgCompletion * 100)}%</span> avg completion</span>
      )}
    </div>
  );
}
