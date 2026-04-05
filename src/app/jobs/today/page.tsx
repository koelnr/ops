import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TodayJobsTable } from "@/components/tables/today-jobs-table";
import { getBookings } from "@/lib/sheets/bookings";
import { getPayments } from "@/lib/sheets/payments";
import { getComplaints } from "@/lib/sheets/complaints";
import { getCustomers } from "@/lib/sheets/customers";
import { getWorkers } from "@/lib/sheets/workers";
import { getLookupContext } from "@/lib/sheets/lookups";
import { serializeLookupContext } from "@/lib/domain";
import { buildTodayJobViews } from "@/lib/selectors";
import { buildSelectOptions } from "@/lib/options";

export default async function TodayJobsPage() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const [bookings, payments, complaints, customers, workers, ctx] =
    await Promise.all([
      getBookings().catch(() => []),
      getPayments().catch(() => []),
      getComplaints().catch(() => []),
      getCustomers().catch(() => []),
      getWorkers().catch(() => []),
      getLookupContext().catch(() => null),
    ]);

  if (!ctx) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Failed to load lookup data.
      </div>
    );
  }

  const jobs = buildTodayJobViews(
    bookings,
    payments,
    complaints,
    customers,
    workers,
    ctx,
  );
  const serialized = serializeLookupContext(ctx);
  const options = buildSelectOptions(serialized);
  const workerOptions = workers.map((w) => ({
    value: w.worker_id,
    label: w.worker_name,
  }));

  const totalRevenue = jobs.reduce((s, j) => s + j.finalPrice, 0);
  const totalDue = jobs.reduce((s, j) => s + j.amountDue, 0);
  const completedCount = jobs.filter((j) =>
    j.bookingStatusLabel.toLowerCase().includes("complet"),
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Today&apos;s Jobs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="text-right">
            <div className="font-semibold">{jobs.length}</div>
            <div className="text-xs text-muted-foreground">total</div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{completedCount}</div>
            <div className="text-xs text-muted-foreground">done</div>
          </div>
          <div className="text-right">
            <div className="font-semibold tabular-nums">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-muted-foreground">scheduled</div>
          </div>
          {totalDue > 0 && (
            <div className="text-right">
              <div className="font-semibold tabular-nums text-orange-600 dark:text-orange-400">
                ₹{totalDue.toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-muted-foreground">outstanding</div>
            </div>
          )}
        </div>
      </div>

      <TodayJobsTable
        jobs={jobs}
        statusOptions={options.bookingStatuses}
        workerOptions={workerOptions}
        paymentModes={options.paymentModes}
        paymentStatuses={options.paymentStatuses}
        complaintTypes={options.complaintTypes}
      />
    </div>
  );
}
