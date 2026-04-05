import type {
  Booking,
  Customer,
  Complaint,
  Lead,
  Payment,
  LookupContext,
} from "../domain";

// ─── Booking Label Resolution ─────────────────────────────────────────────────

export interface BookingLabels {
  areaName: string;
  timeSlotLabel: string;
  bookingStatusLabel: string;
  bookingStatusColor: string;
  sourceLabel: string;
}

export function resolveBookingLabels(
  booking: Booking,
  ctx: LookupContext,
): BookingLabels {
  const area = ctx.areas.get(booking.area_id);
  const slot = ctx.timeSlots.get(booking.time_slot_id);
  const status = ctx.bookingStatuses.get(booking.booking_status_id);
  const source = ctx.leadSources.get(booking.source_id);

  return {
    areaName: area?.area_name ?? booking.area_id,
    timeSlotLabel: slot?.label ?? booking.time_slot_id,
    bookingStatusLabel: status?.label ?? booking.booking_status_id,
    bookingStatusColor: status?.color ?? "",
    sourceLabel: source?.label ?? booking.source_id,
  };
}

// ─── Customer Label Resolution ────────────────────────────────────────────────

export interface CustomerLabels {
  areaName: string;
  acquisitionSourceLabel: string;
}

export function resolveCustomerLabels(
  customer: Customer,
  ctx: LookupContext,
): CustomerLabels {
  const area = ctx.areas.get(customer.area_id);
  const source = ctx.leadSources.get(customer.acquisition_source_id);

  return {
    areaName: area?.area_name ?? customer.area_id,
    acquisitionSourceLabel: source?.label ?? customer.acquisition_source_id,
  };
}

// ─── Complaint Label Resolution ───────────────────────────────────────────────

export interface ComplaintLabels {
  complaintTypeLabel: string;
}

export function resolveComplaintLabels(
  complaint: Complaint,
  ctx: LookupContext,
): ComplaintLabels {
  const type = ctx.complaintTypes.get(complaint.complaint_type_id);
  return {
    complaintTypeLabel: type?.label ?? complaint.complaint_type_id,
  };
}

// ─── Lead Label Resolution ────────────────────────────────────────────────────

export interface LeadLabels {
  areaName: string;
  interestedServiceName: string;
  sourceLabel: string;
}

export function resolveLeadLabels(lead: Lead, ctx: LookupContext): LeadLabels {
  const area = ctx.areas.get(lead.area_id);
  const service = ctx.services.get(lead.interested_service_id);
  const source = ctx.leadSources.get(lead.source_id);

  return {
    areaName: area?.area_name ?? lead.area_id,
    interestedServiceName: service?.name ?? lead.interested_service_id,
    sourceLabel: source?.label ?? lead.source_id,
  };
}

// ─── Payment Label Resolution ─────────────────────────────────────────────────

export interface PaymentLabels {
  paymentStatusLabel: string;
  paymentStatusColor: string;
  paymentModeLabel: string;
}

export function resolvePaymentLabels(
  payment: Payment,
  ctx: LookupContext,
): PaymentLabels {
  const status = ctx.paymentStatuses.get(payment.payment_status_id);
  const mode = ctx.paymentModes.get(payment.payment_mode_id);

  return {
    paymentStatusLabel: status?.label ?? payment.payment_status_id,
    paymentStatusColor: status?.color ?? "",
    paymentModeLabel: mode?.label ?? payment.payment_mode_id,
  };
}
