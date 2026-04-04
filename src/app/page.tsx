import { getBookings } from "@/lib/sheets/bookings";
import { getComplaints } from "@/lib/sheets/complaints";
import { getLeads } from "@/lib/sheets/leads";
import { getPayments } from "@/lib/sheets/payments";
import { getWorkers } from "@/lib/sheets/workers";
import { formatCurrency } from "@/lib/format";
import { BookingsTable } from "@/components/dashboard/bookings-table";
import { ComplaintsTable } from "@/components/dashboard/complaints-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LeadsSummary } from "@/components/dashboard/leads-summary";
import { PaymentsTable } from "@/components/dashboard/payments-table";
import { SectionHeader } from "@/components/dashboard/section-header";
import { WorkersSummary } from "@/components/dashboard/workers-summary";
import { currentUser } from "@clerk/nextjs/server";
import { isAfter } from "date-fns";

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
  ] = await Promise.allSettled([
    getBookings(),
    getPayments(),
    getWorkers(),
    getLeads(),
    getComplaints(),
  ]);

  if (bookingsResult.status === "rejected")
    console.error("[page] bookings failed:", bookingsResult.reason);
  if (paymentsResult.status === "rejected")
    console.error("[page] payments failed:", paymentsResult.reason);
  if (workersResult.status === "rejected")
    console.error("[page] workers failed:", workersResult.reason);
  if (leadsResult.status === "rejected")
    console.error("[page] leads failed:", leadsResult.reason);
  if (complaintsResult.status === "rejected")
    console.error("[page] complaints failed:", complaintsResult.reason);

  const bookings =
    bookingsResult.status === "fulfilled" ? bookingsResult.value : [];
  const payments =
    paymentsResult.status === "fulfilled" ? paymentsResult.value : [];
  const workers =
    workersResult.status === "fulfilled" ? workersResult.value : [];
  const leads = leadsResult.status === "fulfilled" ? leadsResult.value : [];
  const complaints =
    complaintsResult.status === "fulfilled" ? complaintsResult.value : [];

  // KPI derivations from source sheets
  const confirmedBookings = bookings.filter(
    (b) => b.bookingStatus === "Confirmed",
  ).length;

  const completedJobs = bookings.filter(
    (b) =>
      b.bookingStatus === "Completed" ||
      b.completionStatus === "Completed Successfully",
  ).length;

  const revenueCollected = payments
    .filter((p) => p.paymentStatus === "Paid")
    .reduce((sum, p) => sum + p.amountReceived, 0);

  const pendingPaymentsAmount = payments
    .filter(
      (p) =>
        p.paymentStatus === "Pending" || p.paymentStatus === "Partially Paid",
    )
    .reduce((sum, p) => sum + (p.amountDue - p.amountReceived), 0);

  // Repeat customers: distinct customerNames from bookings with repeatCustomer = "Yes"
  const repeatCustomers = new Set(
    bookings
      .filter((b) => b.repeatCustomer === "Yes")
      .map((b) => b.customerName),
  ).size;

  const upcomingBookings = bookings.filter((b) =>
    isAfter(b.serviceDate, today),
  );
  const pendingPayments = payments.filter(
    (p) =>
      p.paymentStatus === "Pending" || p.paymentStatus === "Partially Paid",
  );

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
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {upcomingBookings.length} booking
              {upcomingBookings.length !== 1 ? "s" : ""} today
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <KpiCard
            label="Confirmed"
            value={confirmedBookings}
            sublabel="bookings"
          />
          <KpiCard label="Completed" value={completedJobs} sublabel="jobs" />
          <KpiCard label="Repeat Customers" value={repeatCustomers} />
          {isAdmin && (
            <>
              <KpiCard label="Total Inquiries" value={leads.length} />
              <KpiCard
                label="Revenue"
                value={formatCurrency(revenueCollected)}
                sublabel="collected"
              />
              <KpiCard
                label="Pending"
                value={formatCurrency(pendingPaymentsAmount)}
                sublabel="payments"
              />
              <KpiCard label="Complaints" value={complaints.length} />
            </>
          )}
        </div>

        {/* Upcoming Bookings */}
        <section className="space-y-3">
          <SectionHeader
            title="Upcoming Bookings"
            description={`${upcomingBookings.length} upcoming bookings`}
          />
          <BookingsTable bookings={upcomingBookings} />
        </section>

        {/* Admin-only sections */}
        {isAdmin && (
          <>
            {/* Pending Payments */}
            <section className="space-y-3">
              <SectionHeader
                title="Pending Payments"
                description={`${pendingPayments.length} unpaid or partial`}
              />
              <PaymentsTable payments={pendingPayments} />
            </section>

            {/* Worker Performance */}
            <section className="space-y-3">
              <SectionHeader
                title="Worker Performance"
                description="Aggregated across all recorded days"
              />
              <WorkersSummary workers={workers} />
            </section>

            {/* Leads Funnel */}
            <section className="space-y-3">
              <SectionHeader
                title="Leads Funnel"
                description={`${leads.length} total leads`}
              />
              <LeadsSummary leads={leads} />
            </section>

            {/* Complaints */}
            <section className="space-y-3">
              <SectionHeader
                title="Complaints"
                description={`${complaints.length} total — showing latest 10`}
              />
              <ComplaintsTable complaints={complaints} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
