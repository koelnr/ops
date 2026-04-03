import type { UpdateComplaintInput } from "../types";
import { findRowIndex, updateRowCells } from "./helpers";

// Complaints column map: A=id, B=bookingId, C=customerId, D=description,
// E=flag, F=createdAt, G=resolvedAt

export async function updateComplaint(
  id: string,
  patch: UpdateComplaintInput
): Promise<void> {
  const row = await findRowIndex("Complaints", id);
  if (row === null) {
    throw new Error(`Complaint not found: ${id}`);
  }

  const cells: [string, string][] = [["E", patch.flag]];
  if (patch.resolvedAt !== undefined) cells.push(["G", patch.resolvedAt]);

  await updateRowCells("Complaints", row, cells);
}
