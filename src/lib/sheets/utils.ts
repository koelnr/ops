import { getSheetsClient } from "./client";
import { SPREADSHEET_ID } from "./config";

/** Converts a 2D array of strings into objects using the first row as header keys. */
export function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const [headers, ...dataRows] = rows;
  return dataRows.map((row) =>
    Object.fromEntries(headers.map((header, i) => [header, row[i] ?? ""]))
  );
}

/** Parses a string to a number, returning 0 for empty/NaN values.
 *  Strips leading currency symbols (₹, $, £) and trailing % before parsing. */
export function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/^[₹$£]/, "").replace(/%$/, "").trim();
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}

/** Returns undefined for empty strings, otherwise returns the value. */
export function normalizeEmpty(val: string | undefined): string | undefined {
  return val === "" || val === undefined ? undefined : val;
}

/** Reads multiple ranges from the spreadsheet in a single API call. */
export async function batchReadRanges(
  ranges: string[]
): Promise<Record<string, string>[][]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SPREADSHEET_ID,
    ranges,
  });

  return (res.data.valueRanges ?? []).map((vr) =>
    rowsToObjects((vr.values as string[][] | undefined) ?? [])
  );
}
