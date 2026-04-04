import type { Complaint } from "../domain";
import { getSheetsClient } from "./client";
import { RANGES } from "./config";
import { rowsToObjects } from "./utils";

// Column order (row 1 headers must match exactly):
// complaint_id, booking_id, complaint_date, complaint_type_id, details,
// assigned_worker_id, resolution_type, resolution_notes, resolution_status,
// follow_up_complete, root_cause, created_at

export async function getComplaints(): Promise<Complaint[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: RANGES.complaints,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  return rows
    .map(
      (row): Complaint => ({
        complaint_id: row.complaint_id ?? "",
        booking_id: row.booking_id ?? "",
        complaint_date: row.complaint_date ?? "",
        complaint_type_id: row.complaint_type_id ?? "",
        details: row.details ?? "",
        assigned_worker_id: row.assigned_worker_id ?? "",
        resolution_type: row.resolution_type ?? "",
        resolution_notes: row.resolution_notes ?? "",
        resolution_status: row.resolution_status ?? "",
        follow_up_complete: row.follow_up_complete === "true",
        root_cause: row.root_cause ?? "",
        created_at: row.created_at ?? "",
      }),
    )
    .filter((c) => c.complaint_id !== "");
}
