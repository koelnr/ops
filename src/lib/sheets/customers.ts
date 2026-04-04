import type { Customer } from "../domain";
import { getSheetsClient } from "./client";
import { RANGES } from "./config";
import { rowsToObjects } from "./utils";

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
        full_name: row.full_name ?? "",
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
