import { getSheetsClient } from "../client";
import { SPREADSHEET_ID } from "../config";

/**
 * Appends a new row to the given sheet.
 */
export async function appendRow(
  sheetName: string,
  values: string[],
): Promise<void> {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

/**
 * Deletes a single row by its 1-based sheet row number.
 * Looks up the numeric sheetId from the spreadsheet metadata.
 */
export async function deleteRow(
  sheetName: string,
  rowIndex: number,
): Promise<void> {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = meta.data.sheets?.find(
    (s) => s.properties?.title === sheetName,
  );
  if (!sheet?.properties?.sheetId) {
    throw new Error(`Sheet not found: ${sheetName}`);
  }
  const sheetId = sheet.properties.sheetId;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex - 1, // 0-based
              endIndex: rowIndex, // exclusive
            },
          },
        },
      ],
    },
  });
}

/**
 * Scans column A of the sheet for IDs matching `${prefix}-NNN` and returns
 * the next sequential ID. Defaults to `${prefix}-001` if none found.
 */
export async function generateNextId(
  sheetName: string,
  prefix: string,
): Promise<string> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`,
  });
  const values = (res.data.values as string[][] | undefined) ?? [];
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 0;
  for (const row of values) {
    const match = row[0]?.match(pattern);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

/**
 * Finds the 1-based sheet row number for the row whose given column matches the value.
 * Defaults to searching column A (for ID-based lookups).
 * Pass a different column letter for sheets without an ID column (e.g. "C" for Prospect Name in Leads).
 * Returns null if not found.
 */
export async function findRowIndex(
  sheetName: string,
  value: string,
  searchColumn = "A",
): Promise<number | null> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${searchColumn}:${searchColumn}`,
  });

  const values = (res.data.values as string[][] | undefined) ?? [];
  // Row 0 is the header; data starts at row 1 (0-indexed), sheet row 2 (1-based)
  for (let i = 1; i < values.length; i++) {
    if (values[i]?.[0] === value) {
      return i + 1; // 1-based sheet row number
    }
  }

  return null;
}

/**
 * Updates a single cell range in the spreadsheet.
 * e.g. updateCell("Bookings!G5", "completed")
 */
export async function updateCell(range: string, value: string): Promise<void> {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });
}

/**
 * Updates multiple cells in a single row.
 * cells is an array of [columnLetter, value] pairs.
 * Uses batchUpdate to minimize API calls.
 */
export async function updateRowCells(
  sheetName: string,
  row: number,
  cells: [string, string][]
): Promise<void> {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: cells.map(([col, value]) => ({
        range: `${sheetName}!${col}${row}`,
        values: [[value]],
      })),
    },
  });
}
