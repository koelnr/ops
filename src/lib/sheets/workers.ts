import { getSheetsClient } from "./client";
import { SPREADSHEET_ID, RANGES } from "./config";
import { rowsToObjects, parseNumber } from "./utils";
import { WorkerDailyOpsSchema, type WorkerDailyOps } from "./types";

// Workers column order: A=Worker ID, B=Worker Name, C=Date, D=Assigned Bookings,
// E=Completed Bookings, F=First Job Time, G=Last Job Time, H=Area Covered,
// I=Late Arrival Count, J=Complaint Count, K=Rewash Count, L=Avg Rating,
// M=Payout Due, N=Payout Paid, O=On-Time %, P=Notes

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
      workerId: row["Worker ID"] ?? "",
      workerName: row["Worker Name"] ?? "",
      date: row["Date"] ?? "",
      assignedBookings: parseNumber(row["Assigned Bookings"]),
      completedBookings: parseNumber(row["Completed Bookings"]),
      firstJobTime: row["First Job Time"] ?? "",
      lastJobTime: row["Last Job Time"] ?? "",
      areaCovered: row["Area Covered"] ?? "",
      lateArrivalCount: parseNumber(row["Late Arrival Count"]),
      complaintCount: parseNumber(row["Complaint Count"]),
      rewashCount: parseNumber(row["Rewash Count"]),
      avgRating: parseNumber(row["Avg Rating"]),
      payoutDue: parseNumber(row["Payout Due"]),
      payoutPaid: parseNumber(row["Payout Paid"]),
      onTimePercentage: parseNumber(row["On-Time %"]),
      notes: row["Notes"] ?? "",
    });

    if (parsed.success) {
      workers.push(parsed.data);
    } else {
      console.warn(
        "[sheets/workers] Invalid row skipped:",
        row["Worker Name"],
        parsed.error.flatten(),
      );
    }
  }

  return workers;
}
