import { nowTimestamp } from "../../firebase/timestamps";
import { customerDoc, customersCol } from "../collections";
import { docsToArrayWithId, getDocOrNull } from "../utils";
import type { CustomerDoc } from "../types";
import type { CreateCustomerInput, UpdateCustomerInput } from "../../schemas";

export async function getActiveCustomers(): Promise<
  Array<CustomerDoc & { id: string }>
> {
  const snap = await customersCol().where("status", "==", "active").get();
  return docsToArrayWithId(snap);
}

export async function getAllCustomers(): Promise<
  Array<CustomerDoc & { id: string }>
> {
  const snap = await customersCol().get();
  return docsToArrayWithId(snap);
}

export async function getCustomerById(id: string): Promise<CustomerDoc | null> {
  return getDocOrNull(customerDoc(id));
}

export async function createCustomerFromInput(
  input: CreateCustomerInput,
): Promise<string> {
  const now = nowTimestamp();
  const ref = customersCol().doc();
  const data: Omit<CustomerDoc, "createdAt" | "updatedAt"> = {
    fullName: input.full_name,
    phone: input.phone,
    secondaryPhone: input.secondary_phone ?? null,
    areaId: input.area_id ?? "",
    areaName: "",
    fullAddress: input.full_address ?? "",
    googleMapsLink: input.google_maps_link ?? "",
    landmark: input.landmark ?? "",
    acquisitionSourceId: input.acquisition_source_id ?? "",
    acquisitionSourceName: "",
    notes: input.notes ?? "",
    status: "active",
  };
  await ref.set({ ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateCustomerFromInput(
  id: string,
  patch: UpdateCustomerInput,
): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: nowTimestamp() };
  if (patch.full_name !== undefined) updates.fullName = patch.full_name;
  if (patch.phone !== undefined) updates.phone = patch.phone;
  if (patch.secondary_phone !== undefined)
    updates.secondaryPhone = patch.secondary_phone ?? null;
  if (patch.area_id !== undefined) updates.areaId = patch.area_id;
  if (patch.full_address !== undefined)
    updates.fullAddress = patch.full_address;
  if (patch.google_maps_link !== undefined)
    updates.googleMapsLink = patch.google_maps_link;
  if (patch.landmark !== undefined) updates.landmark = patch.landmark;
  if (patch.acquisition_source_id !== undefined)
    updates.acquisitionSourceId = patch.acquisition_source_id;
  if (patch.notes !== undefined) updates.notes = patch.notes;
  const ref = customerDoc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Customer not found: ${id}`);
  await ref.update(updates);
}

export async function deleteCustomer(id: string): Promise<void> {
  const ref = customerDoc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Customer not found: ${id}`);
  await ref.delete();
}
