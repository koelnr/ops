import type { CreateComplaintInput, UpdateComplaintInput } from "../../schemas";
import type { Complaint } from "../../domain";
import { findRowIndex, updateRowCells, appendRow, deleteRow, generateNextId } from "./helpers";

// Complaints column map (A=complaint_id, B=booking_id, C=complaint_date,
// D=complaint_type_id, E=details, F=assigned_worker_id,
// G=resolution_type, H=resolution_notes, I=resolution_status,
// J=follow_up_complete, K=root_cause, L=created_at)

export async function createComplaint(input: CreateComplaintInput): Promise<Complaint> {
  const complaint_id = await generateNextId("complaints", "CMP");
  const created_at = new Date().toISOString();

  await appendRow("complaints", [
    complaint_id,
    input.booking_id,
    input.complaint_date,
    input.complaint_type_id,
    input.details,
    input.assigned_worker_id ?? "",
    input.resolution_type ?? "",
    input.resolution_notes ?? "",
    input.resolution_status ?? "Open",
    String(input.follow_up_complete ?? false),
    input.root_cause ?? "",
    created_at,
  ]);

  return {
    complaint_id,
    booking_id: input.booking_id,
    complaint_date: input.complaint_date,
    complaint_type_id: input.complaint_type_id,
    details: input.details,
    assigned_worker_id: input.assigned_worker_id ?? "",
    resolution_type: input.resolution_type ?? "",
    resolution_notes: input.resolution_notes ?? "",
    resolution_status: input.resolution_status ?? "Open",
    follow_up_complete: input.follow_up_complete ?? false,
    root_cause: input.root_cause ?? "",
    created_at,
  };
}

export async function updateComplaint(id: string, patch: UpdateComplaintInput): Promise<void> {
  const row = await findRowIndex("complaints", id);
  if (row === null) throw new Error(`Complaint not found: ${id}`);

  const cells: [string, string][] = [];
  if (patch.complaint_date !== undefined) cells.push(["C", patch.complaint_date]);
  if (patch.complaint_type_id !== undefined) cells.push(["D", patch.complaint_type_id]);
  if (patch.details !== undefined) cells.push(["E", patch.details]);
  if (patch.assigned_worker_id !== undefined) cells.push(["F", patch.assigned_worker_id]);
  if (patch.resolution_type !== undefined) cells.push(["G", patch.resolution_type]);
  if (patch.resolution_notes !== undefined) cells.push(["H", patch.resolution_notes]);
  if (patch.resolution_status !== undefined) cells.push(["I", patch.resolution_status]);
  if (patch.follow_up_complete !== undefined) cells.push(["J", String(patch.follow_up_complete)]);
  if (patch.root_cause !== undefined) cells.push(["K", patch.root_cause]);

  if (cells.length > 0) {
    await updateRowCells("complaints", row, cells);
  }
}

export async function deleteComplaint(id: string): Promise<void> {
  const row = await findRowIndex("complaints", id);
  if (row === null) throw new Error(`Complaint not found: ${id}`);
  await deleteRow("complaints", row);
}
