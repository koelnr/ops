import type { UpdateBookingInput, CreateBookingInput } from "../../schemas";
import type { Booking } from "../../domain";
import { findRowIndex, updateRowCells, deleteRow, generateNextId, appendRow } from "./helpers";

// Bookings column map (A=booking_id, B=customer_id, C=vehicle_id,
// D=service_date, E=time_slot_id, F=booking_status_id, G=source_id,
// H=created_at, I=scheduled_start_at, J=actual_start_at,
// K=actual_end_at, L=assigned_worker_id, M=area_id,
// N=base_price, O=discount_amount, P=addon_total,
// Q=final_price, R=notes)

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const booking_id = await generateNextId("bookings", "BKG");
  const created_at = new Date().toISOString();

  await appendRow("bookings", [
    booking_id,
    input.customer_id,
    input.vehicle_id,
    input.service_date,
    input.time_slot_id,
    input.booking_status_id,
    input.source_id ?? "",
    created_at,
    input.scheduled_start_at ?? "",
    "", // actual_start_at
    "", // actual_end_at
    input.assigned_worker_id ?? "",
    input.area_id ?? "",
    String(input.base_price),
    String(input.discount_amount ?? 0),
    String(input.addon_total ?? 0),
    String(input.final_price),
    input.notes ?? "",
  ]);

  return {
    booking_id,
    customer_id: input.customer_id,
    vehicle_id: input.vehicle_id,
    service_date: input.service_date,
    time_slot_id: input.time_slot_id,
    booking_status_id: input.booking_status_id,
    source_id: input.source_id ?? "",
    created_at,
    scheduled_start_at: input.scheduled_start_at ?? "",
    actual_start_at: "",
    actual_end_at: "",
    assigned_worker_id: input.assigned_worker_id ?? "",
    area_id: input.area_id ?? "",
    base_price: input.base_price,
    discount_amount: input.discount_amount ?? 0,
    addon_total: input.addon_total ?? 0,
    final_price: input.final_price,
    notes: input.notes ?? "",
  };
}

export async function updateBooking(id: string, patch: UpdateBookingInput): Promise<void> {
  const row = await findRowIndex("bookings", id);
  if (row === null) throw new Error(`Booking not found: ${id}`);

  const cells: [string, string][] = [];
  if (patch.customer_id !== undefined) cells.push(["B", patch.customer_id]);
  if (patch.vehicle_id !== undefined) cells.push(["C", patch.vehicle_id]);
  if (patch.service_date !== undefined) cells.push(["D", patch.service_date]);
  if (patch.time_slot_id !== undefined) cells.push(["E", patch.time_slot_id]);
  if (patch.booking_status_id !== undefined) cells.push(["F", patch.booking_status_id]);
  if (patch.source_id !== undefined) cells.push(["G", patch.source_id]);
  if (patch.scheduled_start_at !== undefined) cells.push(["I", patch.scheduled_start_at]);
  if (patch.actual_start_at !== undefined) cells.push(["J", patch.actual_start_at]);
  if (patch.actual_end_at !== undefined) cells.push(["K", patch.actual_end_at]);
  if (patch.assigned_worker_id !== undefined) cells.push(["L", patch.assigned_worker_id]);
  if (patch.area_id !== undefined) cells.push(["M", patch.area_id]);
  if (patch.base_price !== undefined) cells.push(["N", String(patch.base_price)]);
  if (patch.discount_amount !== undefined) cells.push(["O", String(patch.discount_amount)]);
  if (patch.addon_total !== undefined) cells.push(["P", String(patch.addon_total)]);
  if (patch.final_price !== undefined) cells.push(["Q", String(patch.final_price)]);
  if (patch.notes !== undefined) cells.push(["R", patch.notes]);

  if (cells.length > 0) {
    await updateRowCells("bookings", row, cells);
  }
}

export async function deleteBooking(id: string): Promise<void> {
  const row = await findRowIndex("bookings", id);
  if (row === null) throw new Error(`Booking not found: ${id}`);
  await deleteRow("bookings", row);
}
