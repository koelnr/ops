import { getSheetsClient } from "./client";
import { SPREADSHEET_ID, RANGES } from "./config";
import { rowsToObjects } from "./utils";
import { ComplaintSchema, type Complaint } from "./types";

// Complaints column order: A=Complaint ID, B=Booking ID, C=Customer Name,
// D=Date, E=Worker Assigned, F=Complaint Type, G=Complaint Details,
// H=Resolution Given, I=Refund / Rewash, J=Resolution Status,
// K=Follow-Up Complete, L=Root Cause

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
      complaintId: row["Complaint ID"] ?? "",
      bookingId: row["Booking ID"] ?? "",
      customerName: row["Customer Name"] ?? "",
      date: row["Date"] ?? "",
      workerAssigned: row["Worker Assigned"] ?? "",
      complaintType: row["Complaint Type"] ?? "",
      complaintDetails: row["Complaint Details"] ?? "",
      resolutionGiven: row["Resolution Given"] ?? "",
      refundOrRewash: row["Refund / Rewash"] ?? "",
      resolutionStatus: row["Resolution Status"] ?? "",
      followUpComplete: row["Follow-Up Complete"] ?? "",
      rootCause: row["Root Cause"] ?? "",
    });

    if (parsed.success) {
      complaints.push(parsed.data);
    } else {
      console.warn(
        "[sheets/complaints] Invalid row skipped:",
        row["Complaint ID"],
        parsed.error.flatten(),
      );
    }
  }

  return complaints;
}
