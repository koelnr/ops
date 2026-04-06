import { nowTimestamp } from "../../firebase/timestamps";
import { vehicleDoc, vehiclesCol } from "../collections";
import { docsToArrayWithId } from "../utils";
import type { VehicleDoc } from "../types";
import type { CreateVehicleInput, UpdateVehicleInput } from "../../schemas";

export async function getAllVehicles(): Promise<
  Array<VehicleDoc & { id: string }>
> {
  const snap = await vehiclesCol().get();
  return docsToArrayWithId(snap);
}

export async function getVehiclesByCustomerId(
  customerId: string,
): Promise<Array<VehicleDoc & { id: string }>> {
  const snap = await vehiclesCol().where("customerId", "==", customerId).get();
  return docsToArrayWithId(snap);
}

export async function createVehicleFromInput(
  input: CreateVehicleInput,
): Promise<string> {
  const now = nowTimestamp();
  const ref = vehiclesCol().doc();
  const data: Omit<VehicleDoc, "createdAt" | "updatedAt"> = {
    customerId: input.customer_id,
    registrationNumber: input.registration_number ?? "",
    carModel: input.car_model,
    brand: input.brand ?? "",
    vehicleTypeId: input.vehicle_type_id,
    vehicleTypeName: "",
    color: input.color ?? "",
    parkingNotes: input.parking_notes ?? "",
    isPrimaryVehicle: input.is_primary_vehicle ?? false,
  };
  await ref.set({ ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateVehicleFromInput(
  id: string,
  patch: UpdateVehicleInput,
): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: nowTimestamp() };
  if (patch.registration_number !== undefined)
    updates.registrationNumber = patch.registration_number;
  if (patch.car_model !== undefined) updates.carModel = patch.car_model;
  if (patch.brand !== undefined) updates.brand = patch.brand;
  if (patch.vehicle_type_id !== undefined)
    updates.vehicleTypeId = patch.vehicle_type_id;
  if (patch.color !== undefined) updates.color = patch.color;
  if (patch.parking_notes !== undefined)
    updates.parkingNotes = patch.parking_notes;
  if (patch.is_primary_vehicle !== undefined)
    updates.isPrimaryVehicle = patch.is_primary_vehicle;
  const ref = vehicleDoc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Vehicle not found: ${id}`);
  await ref.update(updates);
}

export async function deleteVehicle(id: string): Promise<void> {
  const ref = vehicleDoc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Vehicle not found: ${id}`);
  await ref.delete();
}
