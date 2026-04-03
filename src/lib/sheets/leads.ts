import { getSheetsClient } from "./client";
import { SPREADSHEET_ID, RANGES } from "./config";
import { rowsToObjects } from "./utils";
import { LeadSchema, type Lead } from "./types";

// Leads column order: A=Lead Date, B=Lead Source, C=Prospect Name,
// D=Phone Number, E=Area / Society, F=Interested Service,
// G=Follow-Up Status, H=Conversion Status, I=First Booking Date, J=Notes
//
// No ID column — mutations look up rows by Prospect Name (column C)

export async function getLeads(): Promise<Lead[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGES.leads,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  const leads: Lead[] = [];

  for (const row of rows) {
    const parsed = LeadSchema.safeParse({
      leadDate: row["Lead Date"] ?? "",
      leadSource: row["Lead Source"] ?? "",
      prospectName: row["Prospect Name"] ?? "",
      phoneNumber: row["Phone Number"] ?? "",
      areaSociety: row["Area / Society"] ?? "",
      interestedService: row["Interested Service"] ?? "",
      followUpStatus: row["Follow-Up Status"] ?? "",
      conversionStatus: row["Conversion Status"] ?? "",
      firstBookingDate: row["First Booking Date"] ?? "",
      notes: row["Notes"] ?? "",
    });

    if (parsed.success) {
      leads.push(parsed.data);
    } else {
      console.warn(
        "[sheets/leads] Invalid row skipped:",
        row["Prospect Name"],
        parsed.error.flatten(),
      );
    }
  }

  return leads;
}
