import type { CreateBookingServiceInput } from "../../schemas";
import type { BookingService } from "../../domain";
import { findRowIndex, generateNextId, appendRow, deleteRow } from "./helpers";

// BookingServices column map (A=booking_service_id, B=booking_id,
// C=service_id, D=quantity, E=unit_price, F=line_total)

export async function createBookingService(
  input: CreateBookingServiceInput,
): Promise<BookingService> {
  const booking_service_id = await generateNextId("BookingServices", "BSV");

  await appendRow("BookingServices", [
    booking_service_id,
    input.booking_id,
    input.service_id,
    String(input.quantity ?? 1),
    String(input.unit_price),
    String(input.line_total),
  ]);

  return {
    booking_service_id,
    booking_id: input.booking_id,
    service_id: input.service_id,
    quantity: input.quantity ?? 1,
    unit_price: input.unit_price,
    line_total: input.line_total,
  };
}

export async function deleteBookingService(id: string): Promise<void> {
  const row = await findRowIndex("BookingServices", id);
  if (row === null) throw new Error(`BookingService not found: ${id}`);
  await deleteRow("BookingServices", row);
}
