import type { BookingService } from "../domain";
import { getSheetsClient } from "./client";
import { RANGES } from "./config";
import { rowsToObjects, parseNumber } from "./utils";

// Column order (row 1 headers must match exactly):
// booking_service_id, booking_id, service_id, quantity, unit_price, line_total

export async function getBookingServices(): Promise<BookingService[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: RANGES.bookingServices,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  return rows
    .map(
      (row): BookingService => ({
        booking_service_id: row.booking_service_id ?? "",
        booking_id: row.booking_id ?? "",
        service_id: row.service_id ?? "",
        quantity: parseNumber(row.quantity) || 1,
        unit_price: parseNumber(row.unit_price),
        line_total: parseNumber(row.line_total),
      }),
    )
    .filter((bs) => bs.booking_service_id !== "");
}
