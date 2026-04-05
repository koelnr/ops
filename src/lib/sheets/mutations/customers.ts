import type { CreateCustomerInput, UpdateCustomerInput } from "../../schemas";
import type { Customer } from "../../domain";
import { findRowIndex, updateRowCells, generateNextId, appendRow, deleteRow } from "./helpers";

// Customers column map (A=customer_id, B=full_name, C=phone,
// D=secondary_phone, E=area_id, F=full_address, G=google_maps_link,
// H=landmark, I=created_at, J=acquisition_source_id, K=notes)

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const customer_id = await generateNextId("customers", "CST");
  const created_at = new Date().toISOString();

  await appendRow("customers", [
    customer_id,
    input.full_name,
    input.phone,
    input.secondary_phone ?? "",
    input.area_id ?? "",
    input.full_address ?? "",
    input.google_maps_link ?? "",
    input.landmark ?? "",
    created_at,
    input.acquisition_source_id ?? "",
    input.notes ?? "",
  ]);

  return {
    customer_id,
    full_name: input.full_name,
    phone: input.phone,
    secondary_phone: input.secondary_phone ?? "",
    area_id: input.area_id ?? "",
    full_address: input.full_address ?? "",
    google_maps_link: input.google_maps_link ?? "",
    landmark: input.landmark ?? "",
    created_at,
    acquisition_source_id: input.acquisition_source_id ?? "",
    notes: input.notes ?? "",
  };
}

export async function updateCustomer(id: string, patch: UpdateCustomerInput): Promise<void> {
  const row = await findRowIndex("customers", id);
  if (row === null) throw new Error(`Customer not found: ${id}`);

  const cells: [string, string][] = [];
  if (patch.full_name !== undefined) cells.push(["B", patch.full_name]);
  if (patch.phone !== undefined) cells.push(["C", patch.phone]);
  if (patch.secondary_phone !== undefined) cells.push(["D", patch.secondary_phone]);
  if (patch.area_id !== undefined) cells.push(["E", patch.area_id]);
  if (patch.full_address !== undefined) cells.push(["F", patch.full_address]);
  if (patch.google_maps_link !== undefined) cells.push(["G", patch.google_maps_link]);
  if (patch.landmark !== undefined) cells.push(["H", patch.landmark]);
  if (patch.acquisition_source_id !== undefined) cells.push(["J", patch.acquisition_source_id]);
  if (patch.notes !== undefined) cells.push(["K", patch.notes]);

  if (cells.length > 0) {
    await updateRowCells("customers", row, cells);
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  const row = await findRowIndex("customers", id);
  if (row === null) throw new Error(`Customer not found: ${id}`);
  await deleteRow("customers", row);
}
