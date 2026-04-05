import type { CreateVehicleInput, UpdateVehicleInput } from "../../schemas";
import type { Vehicle } from "../../domain";
import {
  findRowIndex,
  updateRowCells,
  generateNextId,
  appendRow,
  deleteRow,
} from "./helpers";

// Vehicles column map (A=vehicle_id, B=customer_id, C=registration_number,
// D=car_model, E=brand, F=vehicle_type_id, G=color,
// H=parking_notes, I=is_primary_vehicle, J=created_at)

export async function createVehicle(
  input: CreateVehicleInput,
): Promise<Vehicle> {
  const vehicle_id = await generateNextId("vehicles", "VHC");
  const created_at = new Date().toISOString();

  await appendRow("vehicles", [
    vehicle_id,
    input.customer_id,
    input.registration_number ?? "",
    input.car_model,
    input.brand ?? "",
    input.vehicle_type_id,
    input.color ?? "",
    input.parking_notes ?? "",
    String(input.is_primary_vehicle ?? false),
    created_at,
  ]);

  return {
    vehicle_id,
    customer_id: input.customer_id,
    registration_number: input.registration_number ?? "",
    car_model: input.car_model,
    brand: input.brand ?? "",
    vehicle_type_id: input.vehicle_type_id,
    color: input.color ?? "",
    parking_notes: input.parking_notes ?? "",
    is_primary_vehicle: input.is_primary_vehicle ?? false,
    created_at,
  };
}

export async function updateVehicle(
  id: string,
  patch: UpdateVehicleInput,
): Promise<void> {
  const row = await findRowIndex("vehicles", id);
  if (row === null) throw new Error(`Vehicle not found: ${id}`);

  const cells: [string, string][] = [];
  if (patch.registration_number !== undefined)
    cells.push(["C", patch.registration_number]);
  if (patch.car_model !== undefined) cells.push(["D", patch.car_model]);
  if (patch.brand !== undefined) cells.push(["E", patch.brand]);
  if (patch.vehicle_type_id !== undefined)
    cells.push(["F", patch.vehicle_type_id]);
  if (patch.color !== undefined) cells.push(["G", patch.color]);
  if (patch.parking_notes !== undefined) cells.push(["H", patch.parking_notes]);
  if (patch.is_primary_vehicle !== undefined)
    cells.push(["I", String(patch.is_primary_vehicle)]);

  if (cells.length > 0) {
    await updateRowCells("vehicles", row, cells);
  }
}

export async function deleteVehicle(id: string): Promise<void> {
  const row = await findRowIndex("vehicles", id);
  if (row === null) throw new Error(`Vehicle not found: ${id}`);
  await deleteRow("vehicles", row);
}
