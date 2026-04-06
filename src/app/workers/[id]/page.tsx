import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getWorkers,
  getBookings,
  getComplaints,
  getPayments,
  getCustomers,
  getLookupContext,
} from "@/lib/db/adapters";
import { getBookingAmountPaid, buildWorkerWithSummary } from "@/lib/selectors";
import { formatCurrency, formatDate } from "@/lib/format";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const TABS = ["schedule", "complaints"] as const;
type Tab = (typeof TABS)[number];

export default async function WorkerDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab: Tab = (TABS.includes(tab as Tab) ? tab : "schedule") as Tab;
  const today = new Date().toISOString().split("T")[0];

  const [workers, bookings, complaints, payments, customers, ctx] =
    await Promise.all([
      getWorkers().catch(() => []),
      getBookings().catch(() => []),
      getComplaints().catch(() => []),
      getPayments().catch(() => []),
      getCustomers().catch(() => []),
      getLookupContext().catch(() => null),
    ]);

  const worker = workers.find((w) => w.worker_id === id);
  if (!worker) notFound();
  if (!ctx)
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Failed to load lookups.
      </div>
    );

  const summary = buildWorkerWithSummary(worker, bookings, ctx);
  const workerBookings = bookings
    .filter((b) => b.assigned_worker_id === id)
    .sort((a, b) => b.service_date.localeCompare(a.service_date));
  const todayBookings = workerBookings.filter((b) => b.service_date === today);
  const workerComplaints = complaints.filter(
    (c) => c.assigned_worker_id === id,
  );

  const tabLinks = [
    {
      label: "Schedule",
      value: "schedule" as Tab,
      count: workerBookings.length,
    },
    {
      label: "Complaints",
      value: "complaints" as Tab,
      count: workerComplaints.length,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/workers">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{worker.worker_name}</h1>
            <StatusBadge status={worker.status} />
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {worker.worker_id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {worker.phone && (
              <a
                href={`tel:${worker.phone}`}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <Phone className="h-3 w-3" />
                {worker.phone}
              </a>
            )}
            <div className="text-muted-foreground">
              {summary.areaName || "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              Joined{" "}
              {worker.joining_date ? formatDate(worker.joining_date) : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">
              {todayBookings.length}
            </div>
            <div className="text-xs text-muted-foreground">jobs</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">
              {summary.assignedCount}
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.round(summary.completionRate * 100)}% completed
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Payout</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="font-medium">
              {worker.default_payout_type || "—"}
            </div>
            {worker.default_payout_rate > 0 && (
              <div className="text-muted-foreground">
                {formatCurrency(worker.default_payout_rate)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabLinks.map(({ label, value, count }) => (
          <Link
            key={value}
            href={`/workers/${id}?tab=${value}`}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === value
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            {count > 0 && (
              <span className="text-xs rounded-full bg-muted px-1.5">
                {count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {activeTab === "schedule" &&
        (workerBookings.length === 0 ? (
          <EmptyState message="No bookings assigned" />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workerBookings.slice(0, 50).map((b) => {
                  const customer = customers.find(
                    (c) => c.customer_id === b.customer_id,
                  );
                  const bPayments = payments.filter(
                    (p) => p.booking_id === b.booking_id,
                  );
                  const paid = getBookingAmountPaid(bPayments);
                  const status = ctx.bookingStatuses.get(b.booking_status_id);
                  const area = ctx.areas.get(b.area_id);
                  return (
                    <TableRow key={b.booking_id}>
                      <TableCell>
                        <Link
                          href={`/bookings/${b.booking_id}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {formatDate(b.service_date)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        {customer?.full_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {area?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={status?.label ?? b.booking_status_id}
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatCurrency(b.final_price)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                        {formatCurrency(paid)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ))}

      {activeTab === "complaints" &&
        (workerComplaints.length === 0 ? (
          <EmptyState message="No complaints assigned" />
        ) : (
          <div className="space-y-3">
            {workerComplaints.map((c) => {
              const type = ctx.complaintTypes.get(c.complaint_type_id);
              const booking = bookings.find(
                (b) => b.booking_id === c.booking_id,
              );
              const customer = booking
                ? customers.find((cu) => cu.customer_id === booking.customer_id)
                : null;
              return (
                <Card key={c.complaint_id}>
                  <CardContent className="pt-4 space-y-1.5 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">
                          {type?.label ?? c.complaint_type_id}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {customer?.full_name} · {formatDate(c.complaint_date)}
                        </div>
                      </div>
                      <StatusBadge status={c.resolution_status} />
                    </div>
                    {c.details && (
                      <p className="text-muted-foreground">{c.details}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
    </div>
  );
}
