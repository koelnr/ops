import type { SerializedLookupContext, SelectOption } from "./domain";

// ─── Build options from live lookup context ───────────────────────────────────
// Called in RSC pages: buildSelectOptions(serializeLookupContext(ctx))

export interface SelectOptions {
  areas: SelectOption[];
  services: SelectOption[];
  vehicleTypes: SelectOption[];
  timeSlots: SelectOption[];
  bookingStatuses: SelectOption[];
  paymentStatuses: SelectOption[];
  paymentModes: SelectOption[];
  leadSources: SelectOption[];
  complaintTypes: SelectOption[];
}

export function buildSelectOptions(ctx: SerializedLookupContext): SelectOptions {
  return {
    areas: ctx.areas.map((a) => ({ value: a.area_id, label: a.name })),
    services: ctx.services.map((s) => ({ value: s.service_id, label: s.name })),
    vehicleTypes: ctx.vehicleTypes.map((vt) => ({ value: vt.vehicle_type_id, label: vt.name })),
    timeSlots: ctx.timeSlots.map((ts) => ({ value: ts.time_slot_id, label: ts.label })),
    bookingStatuses: ctx.bookingStatuses.map((bs) => ({
      value: bs.booking_status_id,
      label: bs.label,
    })),
    paymentStatuses: ctx.paymentStatuses.map((ps) => ({
      value: ps.payment_status_id,
      label: ps.label,
    })),
    paymentModes: ctx.paymentModes.map((pm) => ({
      value: pm.payment_mode_id,
      label: pm.label,
    })),
    leadSources: ctx.leadSources.map((ls) => ({ value: ls.source_id, label: ls.label })),
    complaintTypes: ctx.complaintTypes.map((ct) => ({
      value: ct.complaint_type_id,
      label: ct.label,
    })),
  };
}

// ─── Static fallback options ──────────────────────────────────────────────────
// Used in tests or when context is unavailable.
// IDs here are illustrative — real IDs come from the lookup sheets.

export const STATIC_OPTIONS: SelectOptions = {
  areas: [
    { value: "AREA-001", label: "Andheri West" },
    { value: "AREA-002", label: "Bandra" },
    { value: "AREA-003", label: "Juhu" },
  ],
  services: [
    { value: "SVC-001", label: "Exterior Wash" },
    { value: "SVC-002", label: "Exterior + Interior Basic" },
    { value: "SVC-003", label: "Full Detail" },
  ],
  vehicleTypes: [
    { value: "VT-001", label: "Hatchback" },
    { value: "VT-002", label: "Sedan" },
    { value: "VT-003", label: "SUV" },
    { value: "VT-004", label: "Luxury" },
  ],
  timeSlots: [
    { value: "TS-001", label: "7am–9am" },
    { value: "TS-002", label: "9am–11am" },
    { value: "TS-003", label: "11am–1pm" },
    { value: "TS-004", label: "2pm–4pm" },
    { value: "TS-005", label: "4pm–6pm" },
  ],
  bookingStatuses: [
    { value: "BS-001", label: "New Inquiry" },
    { value: "BS-002", label: "Confirmed" },
    { value: "BS-003", label: "Assigned" },
    { value: "BS-004", label: "In Progress" },
    { value: "BS-005", label: "Completed" },
    { value: "BS-006", label: "Cancelled" },
    { value: "BS-007", label: "Rescheduled" },
  ],
  paymentStatuses: [
    { value: "PS-001", label: "Pending" },
    { value: "PS-002", label: "Paid" },
    { value: "PS-003", label: "Partially Paid" },
    { value: "PS-004", label: "Failed" },
    { value: "PS-005", label: "Refunded" },
  ],
  paymentModes: [
    { value: "PM-001", label: "UPI" },
    { value: "PM-002", label: "Cash" },
  ],
  leadSources: [
    { value: "LS-001", label: "WhatsApp" },
    { value: "LS-002", label: "Referral" },
    { value: "LS-003", label: "Society Outreach" },
    { value: "LS-004", label: "Flyer" },
    { value: "LS-005", label: "Instagram" },
  ],
  complaintTypes: [
    { value: "CT-001", label: "Service Quality" },
    { value: "CT-002", label: "Late Arrival" },
    { value: "CT-003", label: "Damage" },
    { value: "CT-004", label: "Attitude" },
    { value: "CT-005", label: "Incomplete Work" },
    { value: "CT-006", label: "Other" },
  ],
};

// ─── Shared simple options (no FK, not from lookup sheets) ───────────────────

export const FOLLOW_UP_STATUS_OPTIONS: SelectOption[] = [
  { value: "New", label: "New" },
  { value: "Contacted", label: "Contacted" },
  { value: "Follow-Up Pending", label: "Follow-Up Pending" },
  { value: "Converted", label: "Converted" },
  { value: "Closed", label: "Closed" },
];

export const CONVERSION_STATUS_OPTIONS: SelectOption[] = [
  { value: "Not Converted", label: "Not Converted" },
  { value: "Converted", label: "Converted" },
  { value: "Lost", label: "Lost" },
];

export const RESOLUTION_STATUS_OPTIONS: SelectOption[] = [
  { value: "Open", label: "Open" },
  { value: "Monitoring", label: "Monitoring" },
  { value: "Resolved", label: "Resolved" },
  { value: "Escalated", label: "Escalated" },
  { value: "Rewash Scheduled", label: "Rewash Scheduled" },
  { value: "Closed", label: "Closed" },
];

export const WORKER_STATUS_OPTIONS: SelectOption[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "On Leave", label: "On Leave" },
];

export const PAYOUT_TYPE_OPTIONS: SelectOption[] = [
  { value: "Per Booking", label: "Per Booking" },
  { value: "Daily", label: "Daily" },
  { value: "Monthly", label: "Monthly" },
];
