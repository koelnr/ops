import { getBookings } from "@/lib/sheets/bookings";
import { getComplaints } from "@/lib/sheets/complaints";
import { getLeads } from "@/lib/sheets/leads";
import { getPayments } from "@/lib/sheets/payments";
import { getWorkers } from "@/lib/sheets/workers";
import { getCustomers } from "@/lib/sheets/customers";
import { getLookupContext } from "@/lib/sheets/lookups";
import { formatCurrency } from "@/lib/format";
import {
  getBookingAmountPaid,
  buildWorkerWithSummary,
  classifyFollowUpStatus,
  classifyConversionStatus,
} from "@/lib/selectors";
import { serializeLookupContext } from "@/lib/domain";
import { BookingsTable } from "@/components/dashboard/bookings-table";
import { ComplaintsTable } from "@/components/dashboard/complaints-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LeadsSummary } from "@/components/dashboard/leads-summary";
import { PaymentsTable } from "@/components/dashboard/payments-table";
import { SectionHeader } from "@/components/dashboard/section-header";
import { WorkersSummary } from "@/components/dashboard/workers-summary";
import { currentUser } from "@clerk/nextjs/server";

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

  if (bookingsResult.status === "rejected") console.error("[page] bookings failed:", bookingsResult.reason);
  if (paymentsResult.status === "rejected") console.error("[page] payments failed:", paymentsResult.reason);
  if (workersResult.status === "rejected") console.error("[page] workers failed:", workersResult.reason);
  if (leadsResult.status === "rejected") console.error("[page] leads failed:", leadsResult.reason);
  if (complaintsResult.status === "rejected") console.error("[page] complaints failed:", complaintsResult.reason);
  if (ctxResult.status === "rejected") console.error("[page] lookups failed:", ctxResult.reason);

  const bookings = bookingsResult.status === "fulfilled" ? bookingsResult.value : [];
  const payments = paymentsResult.status === "fulfilled" ? paymentsResult.value : [];
  const workers = workersResult.status === "fulfilled" ? workersResult.value : [];
  const leads = leadsResult.status === "fulfilled" ? leadsResult.value : [];
  const complaints = complaintsResult.status === "fulfilled" ? complaintsResult.value : [];
  const customers = customersResult.status === "fulfilled" ? customersResult.value : [];
  const ctx = ctxResult.status === "fulfilled" ? ctxResult.value : null;

  const serializedCtx = ctx ? serializeLookupContext(ctx) : null;

  // KPI derivations — computed from relations
  const confirmedBookings = ctx
    ? bookings.filter((b) => {
        const status = ctx.bookingStatuses.get(b.booking_status_id);
        return status?.label.toLowerCase().includes("confirm") ?? false;
      }).length
    : 0;

  const completedJobs = ctx
    ? bookings.filter((b) => {
        const status = ctx.bookingStatuses.get(b.booking_status_id);
        return status?.label.toLowerCase().includes("complet") ?? false;
      }).length
    : 0;

  const revenueCollected = ctx
    ? payments
        .filter((p) => {
          const status = ctx.paymentStatuses.get(p.payment_status_id);
          return status?.label.toLowerCase() === "paid";
        })
        .reduce((sum, p) => sum + p.amount_received, 0)
    : 0;

  const pendingPaymentsAmount = ctx
    ? payments
        .filter((p) => {
          const status = ctx.paymentStatuses.get(p.payment_status_id);
          const label = status?.label.toLowerCase() ?? "";
          return label === "pending" || label === "partially paid";
        })
        .reduce((sum, p) => {
          const booking = bookings.find((b) => b.booking_id === p.booking_id);
          if (!booking) return sum;
          const bookingPayments = payments.filter(
            (bp) => bp.booking_id === p.booking_id,
          );
          return sum + Math.max(0, booking.final_price - getBookingAmountPaid(bookingPayments));
        }, 0)
    : 0;

  // Repeat customers: customers with >1 completed booking
  const repeatCustomersCount = ctx
    ? customers.filter((c) => {
        const completed = bookings.filter((b) => {
          if (b.customer_id !== c.customer_id) return false;
          const status = ctx.bookingStatuses.get(b.booking_status_id);
          return status?.label.toLowerCase().includes("complet") ?? false;
        });
        return completed.length > 1;
      }).length
    : 0;

  const upcomingBookings = bookings
    .filter((b) => b.service_date >= today)
    .sort((a, b) => a.service_date.localeCompare(b.service_date))
    .slice(0, 15);

  const pendingPayments = ctx
    ? payments.filter((p) => {
        const status = ctx.paymentStatuses.get(p.payment_status_id);
        const label = status?.label.toLowerCase() ?? "";
        return label === "pending" || label === "partially paid";
      })
    : [];

  const workersWithSummary = ctx
    ? workers.map((w) => buildWorkerWithSummary(w, bookings, ctx))
    : [];

  const leadsStats = {
    pending: leads.filter((l) => classifyFollowUpStatus(l.follow_up_status) === "pending").length,
    contacted: leads.filter((l) => classifyFollowUpStatus(l.follow_up_status) === "contacted").length,
    converted: leads.filter((l) => classifyConversionStatus(l.conversion_status) === "converted").length,
    lost: leads.filter((l) => classifyConversionStatus(l.conversion_status) === "not_converted").length,
  };

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
            <h1 className="text-lg font-semibold tracking-tight">Ops Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{dateLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {upcomingBookings.length} upcoming booking{upcomingBookings.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <KpiCard label="Confirmed" value={confirmedBookings} sublabel="bookings" />
          <KpiCard label="Completed" value={completedJobs} sublabel="jobs" />
          <KpiCard label="Repeat Customers" value={repeatCustomersCount} />
          {isAdmin && (
            <>
              <KpiCard label="Total Inquiries" value={leads.length} />
              <KpiCard label="Revenue" value={formatCurrency(revenueCollected)} sublabel="collected" />
              <KpiCard label="Pending" value={formatCurrency(pendingPaymentsAmount)} sublabel="payments" />
              <KpiCard label="Complaints" value={complaints.length} />
            </>
          )}
        </div>

        {/* Upcoming Bookings */}
        <section className="space-y-3">
          <SectionHeader
            title="Upcoming Bookings"
            description={`${upcomingBookings.length} upcoming`}
          />
          <BookingsTable
            bookings={upcomingBookings}
            customers={customers}
            serializedCtx={serializedCtx}
          />
        </section>

        {/* Admin-only sections */}
        {isAdmin && (
          <>
            <section className="space-y-3">
              <SectionHeader title="Pending Payments" description={`${pendingPayments.length} unpaid or partial`} />
              <PaymentsTable
                payments={pendingPayments}
                bookings={bookings}
                customers={customers}
                serializedCtx={serializedCtx}
              />
            </section>

            <section className="space-y-3">
              <SectionHeader title="Worker Performance" description="Computed from booking history" />
              <WorkersSummary workers={workersWithSummary} />
            </section>

            <section className="space-y-3">
              <SectionHeader title="Leads Funnel" description={`${leads.length} total leads`} />
              <LeadsSummary stats={leadsStats} total={leads.length} />
            </section>

            <section className="space-y-3">
              <SectionHeader title="Complaints" description={`${complaints.length} total`} />
              <ComplaintsTable
                complaints={complaints.slice(0, 10)}
                bookings={bookings}
                customers={customers}
                serializedCtx={serializedCtx}
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
