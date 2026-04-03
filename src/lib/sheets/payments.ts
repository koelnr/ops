import { getSheetsClient } from "./client";
import { SPREADSHEET_ID, RANGES } from "./config";
import { rowsToObjects, parseNumber } from "./utils";
import { PaymentSchema, type Payment } from "./types";

// Payments column order: A=Payment ID, B=Booking ID, C=Customer Name,
// D=Service Date, E=Amount Due, F=Amount Received, G=Payment Status,
// H=Payment Mode, I=UPI Transaction Ref, J=Payment Date,
// K=Follow-Up Required, L=Notes

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
      paymentId: row["Payment ID"] ?? "",
      bookingId: row["Booking ID"] ?? "",
      customerName: row["Customer Name"] ?? "",
      serviceDate: row["Service Date"] ?? "",
      amountDue: parseNumber(row["Amount Due"]),
      amountReceived: parseNumber(row["Amount Received"]),
      paymentStatus: row["Payment Status"] ?? "",
      paymentMode: row["Payment Mode"] ?? "",
      upiTransactionRef: row["UPI Transaction Ref"] ?? "",
      paymentDate: row["Payment Date"] ?? "",
      followUpRequired: row["Follow-Up Required"] ?? "",
      notes: row["Notes"] ?? "",
    });

    if (parsed.success) {
      payments.push(parsed.data);
    } else {
      console.warn(
        "[sheets/payments] Invalid row skipped:",
        row["Payment ID"],
        parsed.error.flatten(),
      );
    }
  }

  return payments;
}
