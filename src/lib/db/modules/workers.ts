import { Timestamp } from "firebase-admin/firestore";
import { nowTimestamp } from "../../firebase/timestamps";
import { workerDoc, workersCol } from "../collections";
import { docsToArrayWithId } from "../utils";
import type { WorkerDoc } from "../types";
import type { CreateWorkerInput, UpdateWorkerInput } from "../../schemas";

export async function getAllWorkers(): Promise<
  Array<WorkerDoc & { id: string }>
> {
  const snap = await workersCol().get();
  return docsToArrayWithId(snap);
}

export async function getActiveWorkers(): Promise<
  Array<WorkerDoc & { id: string }>
> {
  const snap = await workersCol().where("status", "==", "active").get();
  return docsToArrayWithId(snap);
}

export async function createWorkerFromInput(
  input: CreateWorkerInput,
): Promise<string> {
  const now = nowTimestamp();
  const ref = workersCol().doc();
  const data: Omit<WorkerDoc, "createdAt" | "updatedAt"> = {
    workerName: input.worker_name,
    phone: input.phone ?? "",
    primaryAreaId: input.primary_area_id ?? "",
    primaryAreaName: "",
    joiningDate: input.joining_date
      ? Timestamp.fromDate(new Date(input.joining_date))
      : null,
    status: (input.status?.toLowerCase() as "active" | "inactive") ?? "active",
    payout: {
      type:
        (input.default_payout_type as "per_job" | "daily" | "monthly") ??
        "per_job",
      rate: input.default_payout_rate ?? 0,
    },
    notes: input.notes ?? "",
  };
  await ref.set({ ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateWorkerFromInput(
  id: string,
  patch: UpdateWorkerInput,
): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: nowTimestamp() };
  if (patch.worker_name !== undefined) updates.workerName = patch.worker_name;
  if (patch.phone !== undefined) updates.phone = patch.phone;
  if (patch.primary_area_id !== undefined)
    updates.primaryAreaId = patch.primary_area_id;
  if (patch.joining_date !== undefined) {
    updates.joiningDate = patch.joining_date
      ? Timestamp.fromDate(new Date(patch.joining_date))
      : null;
  }
  if (patch.status !== undefined) updates.status = patch.status.toLowerCase();
  if (patch.default_payout_type !== undefined)
    updates["payout.type"] = patch.default_payout_type;
  if (patch.default_payout_rate !== undefined)
    updates["payout.rate"] = patch.default_payout_rate;
  if (patch.notes !== undefined) updates.notes = patch.notes;
  const ref = workerDoc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Worker not found: ${id}`);
  await ref.update(updates);
}

export async function deleteWorker(id: string): Promise<void> {
  const ref = workerDoc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Worker not found: ${id}`);
  await ref.delete();
}
