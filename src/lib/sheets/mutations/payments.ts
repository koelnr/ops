import type { CreatePaymentInput, UpdatePaymentInput } from "../types";
import { findRowIndex, updateRowCells, appendRow, deleteRow, generateNextId } from "./helpers";

// Payments column map: A=Payment ID, B=Booking ID, C=Customer Name,
// D=Service Date, E=Amount Due, F=Amount Received, G=Payment Status,
// H=Payment Mode, I=UPI Transaction Ref, J=Payment Date,
// K=Follow-Up Required, L=Notes

export async function createPayment(input: CreatePaymentInput): Promise<void> {
  const paymentId = await generateNextId("Payments", "PAY");
  await appendRow("Payments", [
    paymentId,
    input.bookingId,
    input.customerName,
    input.serviceDate,
    String(input.amountDue),
    String(input.amountReceived),
    input.paymentStatus,
    input.paymentMode,
    input.upiTransactionRef ?? "",
    input.paymentDate ?? "",
    input.followUpRequired ?? "",
    input.notes ?? "",
  ]);
}

export async function updatePayment(
  id: string,
  patch: UpdatePaymentInput,
): Promise<void> {
  const row = await findRowIndex("Payments", id);
  if (row === null) throw new Error(`Payment not found: ${id}`);

  const cells: [string, string][] = [];
  if (patch.bookingId !== undefined) cells.push(["B", patch.bookingId]);
  if (patch.customerName !== undefined) cells.push(["C", patch.customerName]);
  if (patch.serviceDate !== undefined) cells.push(["D", patch.serviceDate]);
  if (patch.amountDue !== undefined) cells.push(["E", String(patch.amountDue)]);
  if (patch.amountReceived !== undefined) cells.push(["F", String(patch.amountReceived)]);
  if (patch.paymentStatus !== undefined) cells.push(["G", patch.paymentStatus]);
  if (patch.paymentMode !== undefined) cells.push(["H", patch.paymentMode]);
  if (patch.upiTransactionRef !== undefined) cells.push(["I", patch.upiTransactionRef]);
  if (patch.paymentDate !== undefined) cells.push(["J", patch.paymentDate]);
  if (patch.followUpRequired !== undefined) cells.push(["K", patch.followUpRequired]);
  if (patch.notes !== undefined) cells.push(["L", patch.notes]);

  if (cells.length > 0) {
    await updateRowCells("Payments", row, cells);
  }
}

export async function deletePayment(id: string): Promise<void> {
  const row = await findRowIndex("Payments", id);
  if (row === null) throw new Error(`Payment not found: ${id}`);
  await deleteRow("Payments", row);
}
