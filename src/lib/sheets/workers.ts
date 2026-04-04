import type { Worker } from "../domain";
import { getSheetsClient } from "./client";
import { RANGES } from "./config";
import { rowsToObjects, parseNumber } from "./utils";

// Column order (row 1 headers must match exactly):
// worker_id, worker_name, phone, primary_area_id, joining_date,
// status, default_payout_type, default_payout_rate, notes

export async function getWorkers(): Promise<Worker[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: RANGES.workers,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  return rows
    .map(
      (row): Worker => ({
        worker_id: row.worker_id ?? "",
        worker_name: row.worker_name ?? "",
        phone: row.phone ?? "",
        primary_area_id: row.primary_area_id ?? "",
        joining_date: row.joining_date ?? "",
        status: row.status ?? "",
        default_payout_type: row.default_payout_type ?? "",
        default_payout_rate: parseNumber(row.default_payout_rate),
        notes: row.notes ?? "",
      }),
    )
    .filter((w) => w.worker_id !== "");
}
