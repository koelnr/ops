import type { Booking } from "../domain";
import { getSheetsClient } from "./client";
import { RANGES } from "./config";
import { rowsToObjects, parseNumber } from "./utils";

// Column order (row 1 headers must match exactly):
// booking_id, customer_id, vehicle_id, service_date, time_slot_id,
// booking_status_id, source_id, created_at, scheduled_start_at,
// scheduled_end_at, actual_start_at, actual_end_at, assigned_worker_id,
// area_id, base_price, discount_amount, addon_total, final_price, notes

export async function getBookings(): Promise<Booking[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: RANGES.bookings,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  return rows
    .map(
      (row): Booking => ({
        booking_id: row.booking_id ?? "",
        customer_id: row.customer_id ?? "",
        vehicle_id: row.vehicle_id ?? "",
        service_date: row.service_date ?? "",
        time_slot_id: row.time_slot_id ?? "",
        booking_status_id: row.booking_status_id ?? "",
        source_id: row.source_id ?? "",
        created_at: row.created_at ?? "",
        scheduled_start_at: row.scheduled_start_at ?? "",
        scheduled_end_at: row.scheduled_end_at ?? "",
        actual_start_at: row.actual_start_at ?? "",
        actual_end_at: row.actual_end_at ?? "",
        assigned_worker_id: row.assigned_worker_id ?? "",
        area_id: row.area_id ?? "",
        base_price: parseNumber(row.base_price),
        discount_amount: parseNumber(row.discount_amount),
        addon_total: parseNumber(row.addon_total),
        final_price: parseNumber(row.final_price),
        notes: row.notes ?? "",
      }),
    )
    .filter((b) => b.booking_id !== "");
}
