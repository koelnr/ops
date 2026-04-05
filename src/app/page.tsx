import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BookingsTable } from "@/components/dashboard/bookings-table";
import { PaymentsTable } from "@/components/dashboard/payments-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SectionHeader } from "@/components/dashboard/section-header";
import { serializeLookupContext } from "@/lib/domain";
import { formatCurrency } from "@/lib/format";
import {
  buildTodayJobViews,
  buildPendingPaymentViews,
  classifyFollowUpStatus,
} from "@/lib/selectors";
import { getBookings } from "@/lib/sheets/bookings";
import { getComplaints } from "@/lib/sheets/complaints";
import { getCustomers } from "@/lib/sheets/customers";
import { getLeads } from "@/lib/sheets/leads";
import { getLookupContext } from "@/lib/sheets/lookups";
import { getPayments } from "@/lib/sheets/payments";
import { getWorkers } from "@/lib/sheets/workers";
import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const today = new Date().toISOString().split("T")[0];
  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  const [
    bookingsResult,
    paymentsResult,
    workersResult,
    leadsResult,
    complaintsResult,
    customersResult,
    ctxResult,
  ] = await Promise.allSettled([
    getBookings(),
    getPayments(),
    getWorkers(),
    getLeads(),
    getComplaints(),
    getCustomers(),
    getLookupContext(),
  ]);

  const bookings =
    bookingsResult.status === "fulfilled" ? bookingsResult.value : [];
  const payments =
    paymentsResult.status === "fulfilled" ? paymentsResult.value : [];
  const workers =
    workersResult.status === "fulfilled" ? workersResult.value : [];
  const leads = leadsResult.status === "fulfilled" ? leadsResult.value : [];
  const complaints =
    complaintsResult.status === "fulfilled" ? complaintsResult.value : [];
  const customers =
    customersResult.status === "fulfilled" ? customersResult.value : [];
  const ctx = ctxResult.status === "fulfilled" ? ctxResult.value : null;

  const serializedCtx = ctx ? serializeLookupContext(ctx) : null;

  // Today metrics
  const todayBookings = bookings.filter((b) => b.service_date === today);
  const todayRevenue = todayBookings.reduce((s, b) => s + b.final_price, 0);
  const todayCompleted = ctx
    ? todayBookings.filter((b) => {
        const status = ctx.bookingStatuses.get(b.booking_status_id);
        return status?.label.toLowerCase().includes("complet") ?? false;
      }).length
    : 0;

  const openComplaints = complaints.filter(
    (c) =>
      !c.resolution_status.toLowerCase().includes("resolv") &&
      !c.resolution_status.toLowerCase().includes("closed"),
  ).length;

  const pendingPaymentViews = ctx
    ? buildPendingPaymentViews(bookings, payments, customers, ctx)
    : [];
  const totalOutstanding = pendingPaymentViews.reduce(
    (s, v) => s + v.amountDue,
    0,
  );

  const activeWorkers = workers.filter(
    (w) => w.status.toLowerCase() === "active",
  ).length;

  const newLeadsCount = leads.filter(
    (l) => classifyFollowUpStatus(l.follow_up_status) === "pending",
  ).length;

  const todayJobsPreview = ctx
    ? buildTodayJobViews(
        bookings,
        payments,
        complaints,
        customers,
        workers,
        ctx,
      ).slice(0, 8)
    : [];

  const pendingPaymentsForTable = ctx
    ? payments.filter((p) => {
        const status = ctx.paymentStatuses.get(p.payment_status_id);
        const label = status?.label.toLowerCase() ?? "";
        return label === "pending" || label === "partially paid";
      })
    : [];

  const recentLeads = leads
    .slice()
    .sort((a, b) => b.lead_date.localeCompare(a.lead_date))
    .slice(0, 5);

  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-350 px-4 py-6 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Ops Dashboard
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{dateLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" asChild>
              <Link href="/jobs/today">Today&apos;s Jobs</Link>
            </Button>
            {isAdmin && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/payments/follow-up">Follow-up Queue</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Today KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <KpiCard
            label="Today's Jobs"
            value={todayBookings.length}
            sublabel="scheduled"
          />
          <KpiCard label="Completed" value={todayCompleted} sublabel="today" />
          <KpiCard
            label="Today's Revenue"
            value={formatCurrency(todayRevenue)}
          />
          {isAdmin && (
            <>
              <KpiCard
                label="Outstanding"
                value={formatCurrency(totalOutstanding)}
                sublabel="unpaid"
              />
              <KpiCard
                label="Follow-ups"
                value={
                  pendingPaymentViews.filter((v) => v.followUpRequired).length
                }
              />
              <KpiCard label="Open Complaints" value={openComplaints} />
              <KpiCard label="Active Workers" value={activeWorkers} />
              <KpiCard
                label="New Leads"
                value={newLeadsCount}
                sublabel="pending"
              />
            </>
          )}
        </div>

        {/* Today's Jobs snapshot */}
        {todayJobsPreview.length > 0 && (
          <section className="space-y-3">
            <SectionHeader
              title="Today's Jobs"
              description={`${todayBookings.length} scheduled`}
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/jobs/today" className="flex items-center gap-1">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            />
            <BookingsTable
              bookings={todayJobsPreview.map((j) => j.booking)}
              customers={customers}
              serializedCtx={serializedCtx}
            />
          </section>
        )}

        {/* Upcoming (non-today) */}
        {isAdmin && (
          <section className="space-y-3">
            <SectionHeader
              title="Upcoming"
              description="Next bookings after today"
            />
            <BookingsTable
              bookings={bookings
                .filter((b) => b.service_date > today)
                .sort((a, b) => a.service_date.localeCompare(b.service_date))
                .slice(0, 10)}
              customers={customers}
              serializedCtx={serializedCtx}
            />
          </section>
        )}

        {/* Payment follow-up preview */}
        {isAdmin && pendingPaymentsForTable.length > 0 && (
          <section className="space-y-3">
            <SectionHeader
              title="Pending Payments"
              description={`${pendingPaymentViews.length} bookings · ${formatCurrency(totalOutstanding)} outstanding`}
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href="/payments/follow-up"
                    className="flex items-center gap-1"
                  >
                    Full queue <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            />
            <PaymentsTable
              payments={pendingPaymentsForTable.slice(0, 5)}
              bookings={bookings}
              customers={customers}
              serializedCtx={serializedCtx}
            />
          </section>
        )}

        {/* Recent leads */}
        {isAdmin && recentLeads.length > 0 && (
          <section className="space-y-3">
            <SectionHeader
              title="Recent Leads"
              description={`${newLeadsCount} pending follow-up`}
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/leads" className="flex items-center gap-1">
                    All leads <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            />
            <div className="rounded-md border divide-y">
              {recentLeads.map((l) => {
                const area = ctx?.areas.get(l.area_id);
                const service = ctx?.services.get(l.interested_service_id);
                return (
                  <div
                    key={l.lead_id}
                    className="flex items-center justify-between px-3 py-2.5"
                  >
                    <div>
                      <Link
                        href={`/leads/${l.lead_id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {l.prospect_name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {[l.phone, area?.name, service?.name]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {l.follow_up_status}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
