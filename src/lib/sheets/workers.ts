import { getSheetsClient } from "./client";
import { SPREADSHEET_ID, RANGES } from "./config";
import { rowsToObjects, parseNumber } from "./utils";
import { WorkerDailyOpsSchema, type WorkerDailyOps } from "./types";

// Workers column order: A=Worker Name, B=Date, C=Assigned Bookings,
// D=Completed Bookings, E=First Job Time, F=Last Job Time, G=Area Covered,
// H=Late Arrival Count, I=Complaint Count, J=Rewash Count, K=Avg Rating,
// L=Payout Due, M=Payout Paid, N=On-Time %, O=Notes

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
