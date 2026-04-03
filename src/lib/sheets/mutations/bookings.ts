import type { UpdateBookingInput } from "../types";
import { findRowIndex, updateRowCells } from "./helpers";

// Bookings column map: A=id, B=date, C=customerId, D=customerName,
// E=vehicleType, F=servicePackage, G=status, H=assignedWorker,
// I=timeSlot, J=amount, K=paymentStatus, L=notes

export async function updateBooking(
  id: string,
  patch: UpdateBookingInput
): Promise<void> {
  const row = await findRowIndex("Bookings", id);
  if (row === null) {
    throw new Error(`Booking not found: ${id}`);
  }

  const cells: [string, string][] = [];
  if (patch.status !== undefined) cells.push(["G", patch.status]);
  if (patch.assignedWorker !== undefined) cells.push(["H", patch.assignedWorker]);
  if (patch.paymentStatus !== undefined) cells.push(["K", patch.paymentStatus]);

  if (cells.length > 0) {
    await updateRowCells("Bookings", row, cells);
  }
}
