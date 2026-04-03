import { getSheetsClient } from "./client";
import { SPREADSHEET_ID, RANGES } from "./config";
import { rowsToObjects, parseNumber } from "./utils";
import { CustomerSchema, type Customer } from "./types";

// Customers column order: A=Customer ID, B=Customer Name, C=Phone Number,
// D=Primary Area, E=First Booking Date, F=Total Bookings, G=Last Booking Date,
// H=Preferred Time Slot, I=Preferred Services, J=Total Revenue,
// K=Subscription Status, L=Referral Source, M=Referred Others,
// N=Complaint History, O=Notes

export async function getCustomers(): Promise<Customer[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGES.customers,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  const customers: Customer[] = [];

  for (const row of rows) {
    const parsed = CustomerSchema.safeParse({
      customerId: row["Customer ID"] ?? "",
      customerName: row["Customer Name"] ?? "",
      phoneNumber: row["Phone Number"] ?? "",
      primaryArea: row["Primary Area"] ?? "",
      firstBookingDate: row["First Booking Date"] ?? "",
      totalBookings: parseNumber(row["Total Bookings"]),
      lastBookingDate: row["Last Booking Date"] ?? "",
      preferredTimeSlot: row["Preferred Time Slot"] ?? "",
      preferredServices: row["Preferred Services"] ?? "",
      totalRevenue: parseNumber(row["Total Revenue"]),
      subscriptionStatus: row["Subscription Status"] ?? "",
      referralSource: row["Referral Source"] ?? "",
      referredOthers: row["Referred Others"] ?? "",
      complaintHistory: row["Complaint History"] ?? "",
      notes: row["Notes"] ?? "",
    });

    if (parsed.success) {
      customers.push(parsed.data);
    } else {
      console.warn(
        "[sheets/customers] Invalid row skipped:",
        row["Customer ID"],
        parsed.error.flatten(),
      );
    }
  }

  return customers;
}
