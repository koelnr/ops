import type { Lead } from "../domain";
import { getSheetsClient } from "./client";
import { RANGES } from "./config";
import { rowsToObjects } from "./utils";

// Column order (row 1 headers must match exactly):
// lead_id, lead_date, prospect_name, phone, area_id, interested_service_id,
// source_id, follow_up_status, conversion_status, converted_customer_id,
// converted_booking_id, notes

export async function getLeads(): Promise<Lead[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: RANGES.leads,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  return rows
    .map(
      (row): Lead => ({
        lead_id: row.lead_id ?? "",
        lead_date: row.lead_date ?? "",
        prospect_name: row.prospect_name ?? "",
        phone: row.phone ?? "",
        area_id: row.area_id ?? "",
        interested_service_id: row.interested_service_id ?? "",
        source_id: row.source_id ?? "",
        follow_up_status: row.follow_up_status ?? "",
        conversion_status: row.conversion_status ?? "",
        converted_customer_id: row.converted_customer_id ?? "",
        converted_booking_id: row.converted_booking_id ?? "",
        notes: row.notes ?? "",
      }),
    )
    .filter((l) => l.lead_id !== "");
}
