import type { UpdatePaymentInput } from "../types";
import { findRowIndex, updateRowCells } from "./helpers";

// Payments column map: A=id, B=bookingId, C=customerId, D=amount,
// E=mode, F=status, G=date, H=reference

export async function updatePayment(
  id: string,
  patch: UpdatePaymentInput
): Promise<void> {
  const row = await findRowIndex("Payments", id);
  if (row === null) {
    throw new Error(`Payment not found: ${id}`);
  }

  const cells: [string, string][] = [["F", patch.status]];
  if (patch.reference !== undefined) cells.push(["H", patch.reference]);

  await updateRowCells("Payments", row, cells);
}
