import { getSheetsClient } from "./client";
import { SPREADSHEET_ID, RANGES } from "./config";
import { rowsToObjects, normalizeEmpty } from "./utils";
import { LeadSchema, type Lead } from "./types";

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
      id: row.id,
      name: row.name,
      phone: row.phone,
      source: row.source,
      status: row.status,
      createdAt: row.createdAt,
      notes: normalizeEmpty(row.notes),
    });

    if (parsed.success) {
      leads.push(parsed.data);
    } else {
      console.warn("[sheets/leads] Invalid row skipped:", row.id, parsed.error.flatten());
    }
  }

  return leads;
}
