import { getSheetsClient } from "./client";
import { SPREADSHEET_ID, RANGES } from "./config";
import { rowsToObjects, parseNumber, normalizeEmpty } from "./utils";
import { PaymentSchema, type Payment } from "./types";

export async function getPayments(): Promise<Payment[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGES.payments,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  const payments: Payment[] = [];

  for (const row of rows) {
    const parsed = PaymentSchema.safeParse({
      id: row.id,
      bookingId: row.bookingId,
      customerId: row.customerId,
      amount: parseNumber(row.amount),
      mode: row.mode,
      status: row.status,
      date: row.date,
      reference: normalizeEmpty(row.reference),
    });

    if (parsed.success) {
      payments.push(parsed.data);
    } else {
      console.warn("[sheets/payments] Invalid row skipped:", row.id, parsed.error.flatten());
    }
  }

  return payments;
}
