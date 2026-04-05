import type { CreateWorkerInput, UpdateWorkerInput } from "../../schemas";
import type { Worker } from "../../domain";
import { findRowIndex, updateRowCells, generateNextId, appendRow, deleteRow } from "./helpers";

// Workers column map (A=worker_id, B=worker_name, C=phone,
// D=primary_area_id, E=joining_date, F=status,
// G=default_payout_type, H=default_payout_rate, I=notes)

export async function createWorker(input: CreateWorkerInput): Promise<Worker> {
  const worker_id = await generateNextId("workers", "WRK");

  await appendRow("workers", [
    worker_id,
    input.worker_name,
    input.phone ?? "",
    input.primary_area_id ?? "",
    input.joining_date ?? "",
    input.status ?? "Active",
    input.default_payout_type ?? "",
    String(input.default_payout_rate ?? 0),
    input.notes ?? "",
  ]);

  return {
    worker_id,
    worker_name: input.worker_name,
    phone: input.phone ?? "",
    primary_area_id: input.primary_area_id ?? "",
    joining_date: input.joining_date ?? "",
    status: input.status ?? "Active",
    default_payout_type: input.default_payout_type ?? "",
    default_payout_rate: input.default_payout_rate ?? 0,
    notes: input.notes ?? "",
  };
}

export async function updateWorker(id: string, patch: UpdateWorkerInput): Promise<void> {
  const row = await findRowIndex("workers", id);
  if (row === null) throw new Error(`Worker not found: ${id}`);

  const cells: [string, string][] = [];
  if (patch.worker_name !== undefined) cells.push(["B", patch.worker_name]);
  if (patch.phone !== undefined) cells.push(["C", patch.phone]);
  if (patch.primary_area_id !== undefined) cells.push(["D", patch.primary_area_id]);
  if (patch.joining_date !== undefined) cells.push(["E", patch.joining_date]);
  if (patch.status !== undefined) cells.push(["F", patch.status]);
  if (patch.default_payout_type !== undefined) cells.push(["G", patch.default_payout_type]);
  if (patch.default_payout_rate !== undefined) cells.push(["H", String(patch.default_payout_rate)]);
  if (patch.notes !== undefined) cells.push(["I", patch.notes]);

  if (cells.length > 0) {
    await updateRowCells("workers", row, cells);
  }
}

export async function deleteWorker(id: string): Promise<void> {
  const row = await findRowIndex("workers", id);
  if (row === null) throw new Error(`Worker not found: ${id}`);
  await deleteRow("workers", row);
}
