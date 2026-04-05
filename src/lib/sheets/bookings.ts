import type { Booking, ResolvedBooking } from "../domain";
import { getSheetsClient } from "./client";
import { RANGES } from "./config";
import { rowsToObjects, parseNumber } from "./utils";

// Column order (row 1 headers must match exactly):
// booking_id, customer_id, vehicle_id, service_date, time_slot_id,
// booking_status_id, source_id, created_at, scheduled_start_at,
// actual_start_at, actual_end_at, assigned_worker_id,
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

export async function getBookingsResolved(): Promise<ResolvedBooking[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: RANGES.resolvedBookings,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  return rows
    .map(
      (row): ResolvedBooking => ({
        booking_id: row.booking_id ?? "",
        service_date: row.service_date ?? "",
        customer_id: row.customer_id ?? "",
        customer_name: row.customer_name ?? "",
        phone: row.phone ?? "",
        vehicle_id: row.vehicle_id ?? "",
        worker_id: row.worker_id ?? "",
        worker_name: row.worker_name ?? "",
        area_id: row.area_id ?? "",
        area_name: row.area_name ?? "",
        time_slot_id: row.time_slot_id ?? "",
        time_slot_label: row.time_slot_label ?? "",
        booking_status_id: row.booking_status_id ?? "",
        booking_status_name: row.booking_status_name ?? "",
        source_id: row.source_id ?? "",
        source_name: row.source_name ?? "",
        base_price: parseNumber(row.base_price),
        discount_amount: parseNumber(row.discount_amount),
        addon_total: parseNumber(row.addon_total),
        final_price: parseNumber(row.final_price),
        amount_paid: parseNumber(row.amount_paid),
        amount_due: parseNumber(row.amount_due),
        complaint_count: parseNumber(row.complaint_count),
        notes: row.notes ?? "",
      }),
    )
    .filter((b) => b.booking_id !== "");
}
