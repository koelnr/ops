export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error("Missing env var: GOOGLE_SHEETS_SPREADSHEET_ID");
  return id;
}

// Keep SPREADSHEET_ID as a getter-compatible re-export for backwards compatibility
// with mutations/helpers.ts which imports it directly.
export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? (() => {
  if (typeof window === "undefined" && process.env.NODE_ENV !== "test") {
    // Only throw at runtime in server context, not during module evaluation in tests
  }
  return "";
})();

export const RANGES = {
  bookings: "bookings!A:Z",
  customers: "customers!A:Z",
  vehicles: "vehicles!A:Z",
  workers: "workers!A:Z",
  bookingServices: "booking_services!A:Z",
  payments: "payments!A:Z",
  complaints: "complaints!A:Z",
  leads: "leads!A:Z",
  // Resolved read-model tabs — used for list/detail display only
  resolvedBookings: "bookings_resolved!A:Z",
  resolvedCustomers: "customers_resolved!A:Z",
  resolvedPayments: "payments_resolved!A:Z",
  resolvedComplaints: "complaints_resolved!A:Z",
} as const;

// Lookup ranges — fetched in a single batchGet call via getLookupContext()
export const LOOKUP_RANGES = [
  "areas!A:Z",
  "services!A:Z",
  "vehicle_types!A:Z",
  "time_slots!A:Z",
  "booking_statuses!A:Z",
  "payment_statuses!A:Z",
  "payment_modes!A:Z",
  "lead_sources!A:Z",
  "complaint_types!A:Z",
] as const;

// Sheet names used by mutations
export const SHEET_NAMES = {
  bookings: "bookings",
  customers: "customers",
  vehicles: "vehicles",
  workers: "workers",
  bookingServices: "booking_services",
  payments: "payments",
  complaints: "complaints",
  leads: "leads",
} as const;
