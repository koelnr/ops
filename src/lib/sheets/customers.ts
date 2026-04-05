import type { Customer, ResolvedCustomer } from "../domain";
import { getSheetsClient } from "./client";
import { RANGES } from "./config";
import { rowsToObjects, parseNumber } from "./utils";

// Column order (row 1 headers must match exactly):
// customer_id, full_name, phone, secondary_phone, area_id, full_address,
// google_maps_link, landmark, created_at, acquisition_source_id, notes

export async function getCustomers(): Promise<Customer[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: RANGES.customers,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  return rows
    .map(
      (row): Customer => ({
        customer_id: row.customer_id ?? "",
        full_name: row.customer_name ?? "",
        phone: row.phone ?? "",
        secondary_phone: row.secondary_phone ?? "",
        area_id: row.area_id ?? "",
        full_address: row.full_address ?? "",
        google_maps_link: row.google_maps_link ?? "",
        landmark: row.landmark ?? "",
        created_at: row.created_at ?? "",
        acquisition_source_id: row.acquisition_source_id ?? "",
        notes: row.notes ?? "",
      }),
    )
    .filter((c) => c.customer_id !== "");
}

export async function getCustomersResolved(): Promise<ResolvedCustomer[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: RANGES.resolvedCustomers,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  return rows
    .map(
      (row): ResolvedCustomer => ({
        customer_id: row.customer_id ?? "",
        full_name: row.customer_name ?? "",
        phone: row.phone ?? "",
        secondary_phone: row.secondary_phone ?? "",
        area_id: row.area_id ?? "",
        area_name: row.area_name ?? "",
        full_address: row.full_address ?? "",
        google_maps_link: row.google_maps_link ?? "",
        landmark: row.landmark ?? "",
        created_at: row.created_at ?? "",
        acquisition_source_id: row.acquisition_source_id ?? "",
        acquisition_source_label: row.acquisition_source_label ?? "",
        notes: row.notes ?? "",
        total_bookings: parseNumber(row.total_bookings),
        total_revenue: parseNumber(row.total_revenue),
        last_visit: row.last_visit ?? "",
        is_repeat: row.is_repeat === "true" || row.is_repeat === "TRUE",
      }),
    )
    .filter((c) => c.customer_id !== "");
}
