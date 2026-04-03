import type { UpdateWorkerInput } from "../types";
import { findRowIndex, updateRowCells } from "./helpers";

// Workers column map: A=Worker ID, B=Worker Name, C=Date,
// D=Assigned Bookings, E=Completed Bookings, F=First Job Time,
// G=Last Job Time, H=Area Covered, I=Late Arrival Count,
// J=Complaint Count, K=Rewash Count, L=Avg Rating,
// M=Payout Due, N=Payout Paid, O=On-Time %, P=Notes

export async function updateWorker(
  id: string,
  patch: UpdateWorkerInput,
): Promise<void> {
  const row = await findRowIndex("Workers", id);
  if (row === null) throw new Error(`Worker record not found: ${id}`);

  const cells: [string, string][] = [];
  if (patch.areaCovered !== undefined) cells.push(["H", patch.areaCovered]);
  if (patch.lateArrivalCount !== undefined) cells.push(["I", String(patch.lateArrivalCount)]);
  if (patch.complaintCount !== undefined) cells.push(["J", String(patch.complaintCount)]);
  if (patch.rewashCount !== undefined) cells.push(["K", String(patch.rewashCount)]);
  if (patch.avgRating !== undefined) cells.push(["L", String(patch.avgRating)]);
  if (patch.payoutDue !== undefined) cells.push(["M", String(patch.payoutDue)]);
  if (patch.payoutPaid !== undefined) cells.push(["N", String(patch.payoutPaid)]);
  if (patch.notes !== undefined) cells.push(["P", patch.notes]);

  if (cells.length > 0) {
    await updateRowCells("Workers", row, cells);
  }
}
