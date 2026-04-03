import { getSheetsClient } from "./client";
import { SPREADSHEET_ID, RANGES } from "./config";
import { rowsToObjects, normalizeEmpty } from "./utils";
import { ComplaintSchema, type Complaint } from "./types";

export async function getComplaints(): Promise<Complaint[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGES.complaints,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  const complaints: Complaint[] = [];

  for (const row of rows) {
    const parsed = ComplaintSchema.safeParse({
      id: row.id,
      bookingId: row.bookingId,
      customerId: row.customerId,
      description: row.description,
      flag: row.flag,
      createdAt: row.createdAt,
      resolvedAt: normalizeEmpty(row.resolvedAt),
    });

    if (parsed.success) {
      complaints.push(parsed.data);
    } else {
      console.warn("[sheets/complaints] Invalid row skipped:", row.id, parsed.error.flatten());
    }
  }

  return complaints;
}
