import { getSheetsClient } from "./client";
import { SPREADSHEET_ID, RANGES } from "./config";
import { rowsToObjects, parseNumber, normalizeEmpty } from "./utils";
import { WorkerDailyOpsSchema, type WorkerDailyOps } from "./types";

export async function getWorkers(): Promise<WorkerDailyOps[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGES.workers,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  const workers: WorkerDailyOps[] = [];

  for (const row of rows) {
    const parsed = WorkerDailyOpsSchema.safeParse({
      id: row.id,
      name: row.name,
      date: row.date,
      bookingsAssigned: parseNumber(row.bookingsAssigned),
      bookingsCompleted: parseNumber(row.bookingsCompleted),
      hoursWorked: parseNumber(row.hoursWorked),
      notes: normalizeEmpty(row.notes),
    });

    if (parsed.success) {
      workers.push(parsed.data);
    } else {
      console.warn("[sheets/workers] Invalid row skipped:", row.id, parsed.error.flatten());
    }
  }

  return workers;
}
