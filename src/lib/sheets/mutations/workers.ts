import type { UpdateWorkerInput, CreateWorkerInput, WorkerDailyOps } from "../types";
import { findRowIndex, updateRowCells, generateNextId, appendRow, deleteRow } from "./helpers";

// Workers column map: A=Worker ID, B=Worker Name, C=Date,
// D=Assigned Bookings, E=Completed Bookings, F=First Job Time,
// G=Last Job Time, H=Area Covered, I=Late Arrival Count,
// J=Complaint Count, K=Rewash Count, L=Avg Rating,
// M=Payout Due, N=Payout Paid, O=On-Time %, P=Notes
//
// NOTE: The Workers sheet holds daily ops records (one row per worker per day),
// not a worker master table. workerId values should be unique per row. If a worker
// has multiple daily entries, each gets its own ID. Delete targets the specific
// row whose column A matches the given workerId exactly.

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

/**
 * Appends a new daily ops record to the Workers sheet.
 * Generates the next WRK-NNN ID automatically.
 */
export async function createWorker(input: CreateWorkerInput): Promise<WorkerDailyOps> {
  const workerId = await generateNextId("Workers", "WRK");
  await appendRow("Workers", [
    workerId,
    input.workerName,
    input.date,
    String(input.assignedBookings ?? 0),
    String(input.completedBookings ?? 0),
    input.firstJobTime ?? "",
    input.lastJobTime ?? "",
    input.areaCovered ?? "",
    String(input.lateArrivalCount ?? 0),
    String(input.complaintCount ?? 0),
    String(input.rewashCount ?? 0),
    String(input.avgRating ?? 0),
    String(input.payoutDue ?? 0),
    String(input.payoutPaid ?? 0),
    String(input.onTimePercentage ?? 0),
    input.notes ?? "",
  ]);

  return {
    workerId,
    workerName: input.workerName,
    date: input.date,
    assignedBookings: input.assignedBookings ?? 0,
    completedBookings: input.completedBookings ?? 0,
    firstJobTime: input.firstJobTime ?? "",
    lastJobTime: input.lastJobTime ?? "",
    areaCovered: input.areaCovered ?? "",
    lateArrivalCount: input.lateArrivalCount ?? 0,
    complaintCount: input.complaintCount ?? 0,
    rewashCount: input.rewashCount ?? 0,
    avgRating: input.avgRating ?? 0,
    payoutDue: input.payoutDue ?? 0,
    payoutPaid: input.payoutPaid ?? 0,
    onTimePercentage: input.onTimePercentage ?? 0,
    notes: input.notes ?? "",
  };
}

/**
 * Deletes the worker daily ops record whose column A matches the given workerId.
 * Since workerId is unique per row, this targets exactly one row.
 */
export async function deleteWorker(id: string): Promise<void> {
  const row = await findRowIndex("Workers", id);
  if (row === null) throw new Error(`Worker record not found: ${id}`);
  await deleteRow("Workers", row);
}
