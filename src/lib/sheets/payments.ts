import type { Payment, ResolvedPayment } from "../domain";
import { getSheetsClient } from "./client";
import { RANGES } from "./config";
import { rowsToObjects, parseNumber } from "./utils";

// Column order (row 1 headers must match exactly):
// payment_id, booking_id, payment_date, amount_received, payment_mode_id,
// payment_status_id, upi_transaction_ref, collected_by_worker_id,
// follow_up_required, notes

export async function getPayments(): Promise<Payment[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: RANGES.payments,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  return rows
    .map(
      (row): Payment => ({
        payment_id: row.payment_id ?? "",
        booking_id: row.booking_id ?? "",
        payment_date: row.payment_date ?? "",
        amount_received: parseNumber(row.amount_received),
        payment_mode_id: row.payment_mode_id ?? "",
        payment_status_id: row.payment_status_id ?? "",
        upi_transaction_ref: row.upi_transaction_ref ?? "",
        collected_by_worker_id: row.collected_by_worker_id ?? "",
        follow_up_required: row.follow_up_required === "true",
        notes: row.notes ?? "",
      }),
    )
    .filter((p) => p.payment_id !== "");
}

export async function getPaymentsResolved(): Promise<ResolvedPayment[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: RANGES.resolvedPayments,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  return rows
    .map(
      (row): ResolvedPayment => ({
        payment_id: row.payment_id ?? "",
        booking_id: row.booking_id ?? "",
        payment_date: row.payment_date ?? "",
        amount_received: parseNumber(row.amount_received),
        payment_mode_id: row.payment_mode_id ?? "",
        payment_mode_name: row.payment_mode_name ?? "",
        payment_status_id: row.payment_status_id ?? "",
        payment_status_name: row.payment_status_name ?? "",
        payment_status_color: row.payment_status_color ?? "",
        upi_transaction_ref: row.upi_transaction_ref ?? "",
        collected_by_worker_id: row.collected_by_worker_id ?? "",
        worker_name: row.worker_name ?? "",
        follow_up_required: row.follow_up_required === "true",
        customer_name: row.customer_name ?? "",
        service_date: row.service_date ?? "",
        final_price: parseNumber(row.final_price),
        notes: row.notes ?? "",
      }),
    )
    .filter((p) => p.payment_id !== "");
}
