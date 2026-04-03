import type { CreateComplaintInput, UpdateComplaintInput } from "../types";
import { findRowIndex, updateRowCells, appendRow, deleteRow, generateNextId } from "./helpers";

// Complaints column map: A=Complaint ID, B=Booking ID, C=Customer Name,
// D=Date, E=Worker Assigned, F=Complaint Type, G=Complaint Details,
// H=Resolution Given, I=Refund / Rewash, J=Resolution Status,
// K=Follow-Up Complete, L=Root Cause

export async function createComplaint(input: CreateComplaintInput): Promise<void> {
  const complaintId = await generateNextId("Complaints", "CMP");
  await appendRow("Complaints", [
    complaintId,
    input.bookingId,
    input.customerName,
    input.date,
    input.workerAssigned ?? "",
    input.complaintType,
    input.complaintDetails,
    input.resolutionGiven ?? "",
    input.refundOrRewash ?? "",
    input.resolutionStatus,
    input.followUpComplete ?? "",
    input.rootCause ?? "",
  ]);
}

export async function updateComplaint(
  id: string,
  patch: UpdateComplaintInput,
): Promise<void> {
  const row = await findRowIndex("Complaints", id);
  if (row === null) throw new Error(`Complaint not found: ${id}`);

  const cells: [string, string][] = [];
  if (patch.bookingId !== undefined) cells.push(["B", patch.bookingId]);
  if (patch.customerName !== undefined) cells.push(["C", patch.customerName]);
  if (patch.date !== undefined) cells.push(["D", patch.date]);
  if (patch.workerAssigned !== undefined) cells.push(["E", patch.workerAssigned]);
  if (patch.complaintType !== undefined) cells.push(["F", patch.complaintType]);
  if (patch.complaintDetails !== undefined) cells.push(["G", patch.complaintDetails]);
  if (patch.resolutionGiven !== undefined) cells.push(["H", patch.resolutionGiven]);
  if (patch.refundOrRewash !== undefined) cells.push(["I", patch.refundOrRewash]);
  if (patch.resolutionStatus !== undefined) cells.push(["J", patch.resolutionStatus]);
  if (patch.followUpComplete !== undefined) cells.push(["K", patch.followUpComplete]);
  if (patch.rootCause !== undefined) cells.push(["L", patch.rootCause]);

  if (cells.length > 0) {
    await updateRowCells("Complaints", row, cells);
  }
}

export async function deleteComplaint(id: string): Promise<void> {
  const row = await findRowIndex("Complaints", id);
  if (row === null) throw new Error(`Complaint not found: ${id}`);
  await deleteRow("Complaints", row);
}
