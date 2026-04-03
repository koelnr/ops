import type { UpdateBookingInput } from "../types";
import { findRowIndex, updateRowCells } from "./helpers";

// Bookings column map: A=Booking ID, B=Booking Date, C=Service Date,
// D=Time Slot, E=Customer Name, F=Phone Number, G=Area / Society,
// H=Full Address, I=Car Model, J=Vehicle Type, K=Service Package,
// L=Add-Ons, M=Price, N=Payment Status, O=Payment Mode,
// P=Assigned Worker, Q=Booking Source, R=Booking Status,
// S=Service Start Time, T=Service End Time, U=Completion Status,
// V=Customer Rating, W=Complaint Flag, X=Repeat Customer,
// Y=Notes, Z=Duration (mins)
//
// Mutable: R=Booking Status, P=Assigned Worker, N=Payment Status, U=Completion Status

export async function updateBooking(
  id: string,
  patch: UpdateBookingInput,
): Promise<void> {
  const row = await findRowIndex("Bookings", id);
  if (row === null) {
    throw new Error(`Booking not found: ${id}`);
  }

  const cells: [string, string][] = [];
  if (patch.bookingStatus !== undefined) cells.push(["R", patch.bookingStatus]);
  if (patch.assignedWorker !== undefined) cells.push(["P", patch.assignedWorker]);
  if (patch.paymentStatus !== undefined) cells.push(["N", patch.paymentStatus]);
  if (patch.completionStatus !== undefined) cells.push(["U", patch.completionStatus]);

  if (cells.length > 0) {
    await updateRowCells("Bookings", row, cells);
  }
}
