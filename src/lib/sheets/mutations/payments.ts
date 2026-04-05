import type { CreatePaymentInput, UpdatePaymentInput } from "../../schemas";
import type { Payment } from "../../domain";
import {
  findRowIndex,
  updateRowCells,
  appendRow,
  deleteRow,
  generateNextId,
} from "./helpers";

// Payments column map (A=payment_id, B=booking_id, C=payment_date,
// D=amount_received, E=payment_mode_id, F=payment_status_id,
// G=upi_transaction_ref, H=collected_by_worker_id,
// I=follow_up_required, J=notes)

export async function createPayment(
  input: CreatePaymentInput,
): Promise<Payment> {
  const payment_id = await generateNextId("payments", "PAY");

  await appendRow("payments", [
    payment_id,
    input.booking_id,
    input.payment_date ?? "",
    String(input.amount_received),
    input.payment_mode_id,
    input.payment_status_id,
    input.upi_transaction_ref ?? "",
    input.collected_by_worker_id ?? "",
    String(input.follow_up_required ?? false),
    input.notes ?? "",
  ]);

  return {
    payment_id,
    booking_id: input.booking_id,
    payment_date: input.payment_date ?? "",
    amount_received: input.amount_received,
    payment_mode_id: input.payment_mode_id,
    payment_status_id: input.payment_status_id,
    upi_transaction_ref: input.upi_transaction_ref ?? "",
    collected_by_worker_id: input.collected_by_worker_id ?? "",
    follow_up_required: input.follow_up_required ?? false,
    notes: input.notes ?? "",
  };
}

export async function updatePayment(
  id: string,
  patch: UpdatePaymentInput,
): Promise<void> {
  const row = await findRowIndex("payments", id);
  if (row === null) throw new Error(`Payment not found: ${id}`);

  const cells: [string, string][] = [];
  if (patch.payment_date !== undefined) cells.push(["C", patch.payment_date]);
  if (patch.amount_received !== undefined)
    cells.push(["D", String(patch.amount_received)]);
  if (patch.payment_mode_id !== undefined)
    cells.push(["E", patch.payment_mode_id]);
  if (patch.payment_status_id !== undefined)
    cells.push(["F", patch.payment_status_id]);
  if (patch.upi_transaction_ref !== undefined)
    cells.push(["G", patch.upi_transaction_ref]);
  if (patch.collected_by_worker_id !== undefined)
    cells.push(["H", patch.collected_by_worker_id]);
  if (patch.follow_up_required !== undefined)
    cells.push(["I", String(patch.follow_up_required)]);
  if (patch.notes !== undefined) cells.push(["J", patch.notes]);

  if (cells.length > 0) {
    await updateRowCells("payments", row, cells);
  }
}

export async function deletePayment(id: string): Promise<void> {
  const row = await findRowIndex("payments", id);
  if (row === null) throw new Error(`Payment not found: ${id}`);
  await deleteRow("payments", row);
}
