import type {
  Booking,
  BookingService,
  BookingResolvedView,
  Customer,
  CustomerWithSummary,
  Worker,
  WorkerWithSummary,
  Payment,
  PaymentWithContext,
  Lead,
  LeadWithContext,
  Complaint,
  ComplaintWithContext,
  LookupContext,
  ResolvedBookingService,
} from "../domain";
import {
  resolveBookingLabels,
  resolveCustomerLabels,
  resolvePaymentLabels,
  resolveLeadLabels,
  resolveComplaintLabels,
} from "../mappers";

// ─── Payment Selectors ────────────────────────────────────────────────────────

/** Sum of amount_received across a set of payments (pre-filtered to a booking). */
export function getBookingAmountPaid(payments: Payment[]): number {
  return payments.reduce((sum, p) => sum + p.amount_received, 0);
}

/** Amount still owed for a booking. */
export function getBookingAmountDue(booking: Booking, payments: Payment[]): number {
  const paid = getBookingAmountPaid(
    payments.filter((p) => p.booking_id === booking.booking_id),
  );
  return Math.max(0, booking.final_price - paid);
}

// ─── Customer Selectors ───────────────────────────────────────────────────────

/** Returns true if the customer has more than 1 booking with a "completed" status.
 *  Checks case-insensitively for any status label containing "complet". */
export function getRepeatCustomerFlag(
  customer: Customer,
  bookings: Booking[],
  ctx: LookupContext,
): boolean {
  const completed = bookings.filter((b) => {
    if (b.customer_id !== customer.customer_id) return false;
    const status = ctx.bookingStatuses.get(b.booking_status_id);
    return status?.label.toLowerCase().includes("complet") ?? false;
  });
  return completed.length > 1;
}

export function getCustomerSummary(
  customer: Customer,
  bookings: Booking[],
  payments: Payment[],
  ctx: LookupContext,
): { totalBookings: number; totalRevenue: number; lastVisit: string | null; isRepeat: boolean } {
  const customerBookings = bookings.filter(
    (b) => b.customer_id === customer.customer_id,
  );
  const customerPayments = payments.filter((p) =>
    customerBookings.some((b) => b.booking_id === p.booking_id),
  );

  const totalRevenue = getBookingAmountPaid(customerPayments);
  const lastVisit =
    customerBookings
      .map((b) => b.service_date)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

  return {
    totalBookings: customerBookings.length,
    totalRevenue,
    lastVisit,
    isRepeat: getRepeatCustomerFlag(customer, bookings, ctx),
  };
}

export function buildCustomerWithSummary(
  customer: Customer,
  bookings: Booking[],
  payments: Payment[],
  ctx: LookupContext,
): CustomerWithSummary {
  const summary = getCustomerSummary(customer, bookings, payments, ctx);
  const labels = resolveCustomerLabels(customer, ctx);
  return { ...customer, ...summary, ...labels };
}

// ─── Worker Selectors ─────────────────────────────────────────────────────────

export function getWorkerSummary(
  worker: Worker,
  bookings: Booking[],
  ctx: LookupContext,
): { assignedCount: number; completionRate: number } {
  const assigned = bookings.filter(
    (b) => b.assigned_worker_id === worker.worker_id,
  );
  const completed = assigned.filter((b) => {
    const status = ctx.bookingStatuses.get(b.booking_status_id);
    return status?.label.toLowerCase().includes("complet") ?? false;
  });

  return {
    assignedCount: assigned.length,
    completionRate: assigned.length > 0 ? completed.length / assigned.length : 0,
  };
}

export function buildWorkerWithSummary(
  worker: Worker,
  bookings: Booking[],
  ctx: LookupContext,
): WorkerWithSummary {
  const summary = getWorkerSummary(worker, bookings, ctx);
  const area = ctx.areas.get(worker.primary_area_id);
  return {
    ...worker,
    ...summary,
    areaName: area?.name ?? worker.primary_area_id,
  };
}

// ─── Booking Resolved View ────────────────────────────────────────────────────

export function getBookingResolvedView(
  booking: Booking,
  ctx: LookupContext,
  customers: Customer[],
  vehicles: import("../domain").Vehicle[],
  workers: Worker[],
  bookingServices: BookingService[],
  payments: Payment[],
): BookingResolvedView {
  const customer = customers.find((c) => c.customer_id === booking.customer_id) ?? null;
  const vehicle = vehicles.find((v) => v.vehicle_id === booking.vehicle_id) ?? null;
  const worker = workers.find((w) => w.worker_id === booking.assigned_worker_id) ?? null;

  const labels = resolveBookingLabels(booking, ctx);

  const bookingPayments = payments.filter((p) => p.booking_id === booking.booking_id);
  const amountPaid = getBookingAmountPaid(bookingPayments);
  const amountDue = Math.max(0, booking.final_price - amountPaid);

  const services: ResolvedBookingService[] = bookingServices
    .filter((bs) => bs.booking_id === booking.booking_id)
    .map((bs) => ({
      ...bs,
      serviceName: ctx.services.get(bs.service_id)?.name ?? bs.service_id,
    }));

  return {
    booking,
    customer,
    vehicle,
    worker,
    areaName: labels.areaName,
    timeSlotLabel: labels.timeSlotLabel,
    bookingStatusLabel: labels.bookingStatusLabel,
    bookingStatusColor: labels.bookingStatusColor,
    services,
    payments: bookingPayments,
    amountPaid,
    amountDue,
  };
}

// ─── Payment With Context ─────────────────────────────────────────────────────

export function buildPaymentWithContext(
  payment: Payment,
  bookings: Booking[],
  customers: Customer[],
  ctx: LookupContext,
): PaymentWithContext {
  const booking = bookings.find((b) => b.booking_id === payment.booking_id);
  const customer = booking
    ? customers.find((c) => c.customer_id === booking.customer_id)
    : undefined;
  const labels = resolvePaymentLabels(payment, ctx);

  return {
    ...payment,
    ...labels,
    customerName: customer?.full_name ?? "",
    serviceDate: booking?.service_date ?? "",
    finalPrice: booking?.final_price ?? 0,
  };
}

// ─── Lead With Context ────────────────────────────────────────────────────────

export function buildLeadWithContext(lead: Lead, ctx: LookupContext): LeadWithContext {
  const labels = resolveLeadLabels(lead, ctx);
  return { ...lead, ...labels };
}

// ─── Complaint With Context ───────────────────────────────────────────────────

export function buildComplaintWithContext(
  complaint: Complaint,
  bookings: Booking[],
  customers: Customer[],
  workers: Worker[],
  ctx: LookupContext,
): ComplaintWithContext {
  const booking = bookings.find((b) => b.booking_id === complaint.booking_id);
  const customer = booking
    ? customers.find((c) => c.customer_id === booking.customer_id)
    : undefined;
  const worker = workers.find((w) => w.worker_id === complaint.assigned_worker_id);
  const labels = resolveComplaintLabels(complaint, ctx);

  return {
    ...complaint,
    ...labels,
    customerName: customer?.full_name ?? "",
    workerName: worker?.worker_name ?? "",
    bookingServiceDate: booking?.service_date ?? "",
  };
}

// ─── Lead utils (replaces src/lib/lead-utils.ts) ─────────────────────────────

export function classifyFollowUpStatus(
  status: string,
): "pending" | "contacted" | "other" {
  const s = status.toLowerCase();
  if (s === "new" || s.includes("follow-up") || s.includes("follow up")) return "pending";
  if (s === "contacted") return "contacted";
  return "other";
}

export function classifyConversionStatus(
  status: string,
): "converted" | "not_converted" | "unknown" {
  const s = status.toLowerCase();
  if (s === "converted") return "converted";
  if (s.includes("not converted") || s === "lost") return "not_converted";
  return "unknown";
}

export function isLeadPending(status: string): boolean {
  return classifyFollowUpStatus(status) === "pending";
}
