if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
  throw new Error("Missing env var: GOOGLE_SHEETS_SPREADSHEET_ID");
}

export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

export const RANGES = {
  bookings: "Bookings!A:Z",
  customers: "Customers!A:Z",
  workers: "Workers!A:Z",
  payments: "Payments!A:Z",
  dashboardMetrics: "DashboardMetrics!A:Z",
  leads: "Leads!A:Z",
  complaints: "Complaints!A:Z",
  lists: "Lists!A:Z",
} as const;
