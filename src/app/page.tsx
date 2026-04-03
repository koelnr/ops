import { getBookings } from "@/lib/sheets/bookings"
import { getComplaints } from "@/lib/sheets/complaints"
import { getCustomers } from "@/lib/sheets/customers"
import { getLeads } from "@/lib/sheets/leads"
import { getPayments } from "@/lib/sheets/payments"
import { getWorkers } from "@/lib/sheets/workers"
import { BookingsTable } from "@/components/dashboard/bookings-table"
import { ComplaintsTable } from "@/components/dashboard/complaints-table"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { LeadsSummary } from "@/components/dashboard/leads-summary"
import { PaymentsTable } from "@/components/dashboard/payments-table"
import { SectionHeader } from "@/components/dashboard/section-header"
import { WorkersSummary } from "@/components/dashboard/workers-summary"

export default async function HomePage() {
  const today = new Date().toISOString().split("T")[0]

  const [
    bookingsResult,
    paymentsResult,
    workersResult,
    leadsResult,
    complaintsResult,
    customersResult,
  ] = await Promise.allSettled([
    getBookings(),
    getPayments(),
    getWorkers(),
    getLeads(),
    getComplaints(),
    getCustomers(),
  ])

  const bookings = bookingsResult.status === "fulfilled" ? bookingsResult.value : []
  const payments = paymentsResult.status === "fulfilled" ? paymentsResult.value : []
  const workers = workersResult.status === "fulfilled" ? workersResult.value : []
  const leads = leadsResult.status === "fulfilled" ? leadsResult.value : []
  const complaints = complaintsResult.status === "fulfilled" ? complaintsResult.value : []
  const customers = customersResult.status === "fulfilled" ? customersResult.value : []

  // KPI derivations
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length
  const completedJobs = bookings.filter((b) => b.status === "completed").length
  const revenueCollected = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingPaymentsAmount = payments
    .filter((p) => p.status === "pending" || p.status === "partial")
    .reduce((sum, p) => sum + p.amount, 0)
  const repeatCustomers = customers.filter((c) => c.repeatCustomer === "yes").length

  const todaysBookings = bookings.filter((b) => b.date === today)
  const pendingPayments = payments.filter(
    (p) => p.status === "pending" || p.status === "partial"
  )

  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Ops Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{dateLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {todaysBookings.length} booking{todaysBookings.length !== 1 ? "s" : ""} today
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <KpiCard label="Total Inquiries" value={leads.length} />
          <KpiCard label="Confirmed" value={confirmedBookings} sublabel="bookings" />
          <KpiCard label="Completed" value={completedJobs} sublabel="jobs" />
          <KpiCard
            label="Revenue"
            value={`₹${revenueCollected.toLocaleString("en-IN")}`}
            sublabel="collected"
          />
          <KpiCard
            label="Pending"
            value={`₹${pendingPaymentsAmount.toLocaleString("en-IN")}`}
            sublabel="payments"
          />
          <KpiCard label="Complaints" value={complaints.length} />
          <KpiCard label="Repeat Customers" value={repeatCustomers} />
        </div>

        {/* Today's Bookings */}
        <section className="space-y-3">
          <SectionHeader
            title="Today's Bookings"
            description={`${todaysBookings.length} scheduled for ${today}`}
          />
          <BookingsTable bookings={todaysBookings} />
        </section>

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
          <WorkersSummary workers={workers} complaints={complaints} />
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

      </div>
    </div>
  )
}
