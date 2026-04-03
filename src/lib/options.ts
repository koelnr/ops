// Centralized option arrays for all form selects.
// Values must match the Zod enums in src/lib/sheets/types.ts exactly.

type Option = { label: string; value: string };

function opts(values: readonly string[]): Option[] {
  return values.map((v) => ({ label: v, value: v }));
}

// ─── From Lists sheet ──────────────────────────────────────────────────────────

export const BOOKING_STATUS_OPTIONS = opts([
  "New Inquiry",
  "Confirmed",
  "Assigned",
  "In Progress",
  "Completed",
  "Cancelled",
  "Rescheduled",
  "Payment Pending",
]);

export const PAYMENT_STATUS_OPTIONS = opts([
  "Pending",
  "Paid",
  "Partially Paid",
  "Failed",
  "Refunded",
]);

export const COMPLETION_STATUS_OPTIONS = opts([
  "Completed Successfully",
  "Completed with Issue",
  "Rewash Needed",
  "Not Completed",
]);

export const VEHICLE_TYPE_OPTIONS = opts(["Hatchback", "Sedan", "SUV", "Luxury"]);

export const SERVICE_PACKAGE_OPTIONS = opts([
  "Exterior Wash",
  "Exterior + Interior Basic",
  "Monthly Plan",
]);

export const PAYMENT_MODE_OPTIONS = opts(["UPI", "Cash"]);

export const BOOKING_SOURCE_OPTIONS = opts([
  "WhatsApp",
  "Referral",
  "Society Outreach",
  "Flyer",
  "Office Contact",
  "Instagram",
]);

// ─── Not yet in Lists sheet — add these values there for full consistency ──────

export const FOLLOW_UP_STATUS_OPTIONS = opts([
  "New",
  "Contacted",
  "Follow-Up Pending",
  "Converted",
  "Closed",
]);

export const CONVERSION_STATUS_OPTIONS = opts([
  "Not Converted",
  "Converted",
  "Lost",
]);

export const RESOLUTION_STATUS_OPTIONS = opts([
  "Open",
  "Monitoring",
  "Resolved",
  "Escalated",
  "Rewash Scheduled",
  "Closed",
]);

export const REFUND_REWASH_OPTIONS = opts([
  "None",
  "Refund",
  "Partial Refund",
  "Rewash",
]);

export const COMPLAINT_TYPE_OPTIONS = opts([
  "Service Quality",
  "Late Arrival",
  "Damage",
  "Attitude",
  "Incomplete Work",
  "Other",
]);

export const YES_NO_OPTIONS = opts(["Yes", "No"]);

export const TIME_SLOT_OPTIONS = opts([
  "7am–9am",
  "8am–10am",
  "9am–11am",
  "10am–12pm",
  "11am–1pm",
  "2pm–4pm",
  "3pm–5pm",
  "4pm–6pm",
]);

export const SUBSCRIPTION_STATUS_OPTIONS = opts([
  "Active",
  "Inactive",
  "Trial",
  "Expired",
]);
