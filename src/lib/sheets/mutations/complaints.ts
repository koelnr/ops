import type { UpdateComplaintInput } from "../types";
import { findRowIndex, updateRowCells } from "./helpers";

// Complaints column map: A=Complaint ID, B=Booking ID, C=Customer Name,
// D=Date, E=Worker Assigned, F=Complaint Type, G=Complaint Details,
// H=Resolution Given, I=Refund / Rewash, J=Resolution Status,
// K=Follow-Up Complete, L=Root Cause
//
// Mutable: J=Resolution Status, H=Resolution Given, I=Refund / Rewash,
//          K=Follow-Up Complete, L=Root Cause

export async function updateComplaint(
  id: string,
  patch: UpdateComplaintInput,
): Promise<void> {
  const row = await findRowIndex("Complaints", id);
  if (row === null) {
    throw new Error(`Complaint not found: ${id}`);
  }

  const cells: [string, string][] = [["J", patch.resolutionStatus]];
  if (patch.resolutionGiven !== undefined)
    cells.push(["H", patch.resolutionGiven]);
  if (patch.refundOrRewash !== undefined)
    cells.push(["I", patch.refundOrRewash]);
  if (patch.followUpComplete !== undefined)
    cells.push(["K", patch.followUpComplete]);
  if (patch.rootCause !== undefined) cells.push(["L", patch.rootCause]);

  await updateRowCells("Complaints", row, cells);
}
