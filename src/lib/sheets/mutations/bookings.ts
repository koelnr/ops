import type { UpdateBookingInput } from "../types";
import { findRowIndex, updateRowCells, deleteRow } from "./helpers";

// Bookings column map: A=Booking ID, B=Booking Date, C=Service Date,
// D=Time Slot, E=Customer Name, F=Phone Number, G=Area / Society,
// H=Full Address, I=Car Model, J=Vehicle Type, K=Service Package,
// L=Add-Ons, M=Price, N=Payment Status, O=Payment Mode,
// P=Assigned Worker, Q=Booking Source, R=Booking Status,
// S=Service Start Time, T=Service End Time, U=Completion Status,
// V=Customer Rating, W=Complaint Flag, X=Repeat Customer,
// Y=Notes, Z=Duration (mins)

export async function updateBooking(
  id: string,
  patch: UpdateBookingInput,
): Promise<void> {
  const row = await findRowIndex("Bookings", id);
  if (row === null) throw new Error(`Booking not found: ${id}`);

  const cells: [string, string][] = [];
  if (patch.bookingDate !== undefined) cells.push(["B", patch.bookingDate]);
  if (patch.serviceDate !== undefined) cells.push(["C", patch.serviceDate]);
  if (patch.timeSlot !== undefined) cells.push(["D", patch.timeSlot]);
  if (patch.customerName !== undefined) cells.push(["E", patch.customerName]);
  if (patch.phoneNumber !== undefined) cells.push(["F", patch.phoneNumber]);
  if (patch.areaSociety !== undefined) cells.push(["G", patch.areaSociety]);
  if (patch.fullAddress !== undefined) cells.push(["H", patch.fullAddress]);
  if (patch.carModel !== undefined) cells.push(["I", patch.carModel]);
  if (patch.vehicleType !== undefined) cells.push(["J", patch.vehicleType]);
  if (patch.servicePackage !== undefined) cells.push(["K", patch.servicePackage]);
  if (patch.addOns !== undefined) cells.push(["L", patch.addOns]);
  if (patch.price !== undefined) cells.push(["M", String(patch.price)]);
  if (patch.paymentStatus !== undefined) cells.push(["N", patch.paymentStatus]);
  if (patch.paymentMode !== undefined) cells.push(["O", patch.paymentMode]);
  if (patch.assignedWorker !== undefined) cells.push(["P", patch.assignedWorker]);
  if (patch.bookingSource !== undefined) cells.push(["Q", patch.bookingSource]);
  if (patch.bookingStatus !== undefined) cells.push(["R", patch.bookingStatus]);
  if (patch.serviceStartTime !== undefined) cells.push(["S", patch.serviceStartTime]);
  if (patch.serviceEndTime !== undefined) cells.push(["T", patch.serviceEndTime]);
  if (patch.completionStatus !== undefined) cells.push(["U", patch.completionStatus]);
  if (patch.customerRating !== undefined) cells.push(["V", String(patch.customerRating)]);
  if (patch.complaintFlag !== undefined) cells.push(["W", patch.complaintFlag]);
  if (patch.repeatCustomer !== undefined) cells.push(["X", patch.repeatCustomer]);
  if (patch.notes !== undefined) cells.push(["Y", patch.notes]);

  if (cells.length > 0) {
    await updateRowCells("Bookings", row, cells);
  }
}

export async function deleteBooking(id: string): Promise<void> {
  const row = await findRowIndex("Bookings", id);
  if (row === null) throw new Error(`Booking not found: ${id}`);
  await deleteRow("Bookings", row);
}
