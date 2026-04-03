import type { UpdatePaymentInput } from "../types";
import { findRowIndex, updateRowCells } from "./helpers";

// Payments column map: A=Payment ID, B=Booking ID, C=Customer Name,
// D=Service Date, E=Amount Due, F=Amount Received, G=Payment Status,
// H=Payment Mode, I=UPI Transaction Ref, J=Payment Date,
// K=Follow-Up Required, L=Notes
//
// Mutable: G=Payment Status, I=UPI Transaction Ref

export async function updatePayment(
  id: string,
  patch: UpdatePaymentInput,
): Promise<void> {
  const row = await findRowIndex("Payments", id);
  if (row === null) {
    throw new Error(`Payment not found: ${id}`);
  }

  const cells: [string, string][] = [["G", patch.paymentStatus]];
  if (patch.upiTransactionRef !== undefined)
    cells.push(["I", patch.upiTransactionRef]);

  await updateRowCells("Payments", row, cells);
}
