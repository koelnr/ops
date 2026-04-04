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
  bookings: "Bookings!A:Z",
  customers: "Customers!A:Z",
  vehicles: "Vehicles!A:Z",
  workers: "Workers!A:Z",
  bookingServices: "BookingServices!A:Z",
  payments: "Payments!A:Z",
  complaints: "Complaints!A:Z",
  leads: "Leads!A:Z",
} as const;

// Lookup ranges — fetched in a single batchGet call via getLookupContext()
export const LOOKUP_RANGES = [
  "Areas!A:Z",
  "Services!A:Z",
  "VehicleTypes!A:Z",
  "TimeSlots!A:Z",
  "BookingStatuses!A:Z",
  "PaymentStatuses!A:Z",
  "PaymentModes!A:Z",
  "LeadSources!A:Z",
  "ComplaintTypes!A:Z",
] as const;

// Sheet names used by mutations
export const SHEET_NAMES = {
  bookings: "Bookings",
  customers: "Customers",
  vehicles: "Vehicles",
  workers: "Workers",
  bookingServices: "BookingServices",
  payments: "Payments",
  complaints: "Complaints",
  leads: "Leads",
} as const;
