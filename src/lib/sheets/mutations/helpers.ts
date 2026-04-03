import { getSheetsClient } from "../client";
import { SPREADSHEET_ID } from "../config";

/**
 * Finds the 1-based sheet row number for the row whose first column (id) matches the given id.
 * Returns null if not found.
 */
export async function findRowIndex(
  sheetName: string,
  id: string
): Promise<number | null> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`,
  });

  const values = (res.data.values as string[][] | undefined) ?? [];
  // Row 0 is the header; data starts at row 1 (0-indexed), sheet row 2 (1-based)
  for (let i = 1; i < values.length; i++) {
    if (values[i]?.[0] === id) {
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
