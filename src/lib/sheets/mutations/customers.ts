import type { UpdateCustomerInput } from "../types";
import { findRowIndex, updateRowCells } from "./helpers";

// Customers column map: A=Customer ID, B=Customer Name, C=Phone Number,
// D=Primary Area, E=First Booking Date, F=Total Bookings,
// G=Last Booking Date, H=Preferred Time Slot, I=Preferred Services,
// J=Total Revenue, K=Subscription Status, L=Referral Source,
// M=Referred Others, N=Complaint History, O=Notes

export async function updateCustomer(
  id: string,
  patch: UpdateCustomerInput,
): Promise<void> {
  const row = await findRowIndex("Customers", id);
  if (row === null) throw new Error(`Customer not found: ${id}`);

  const cells: [string, string][] = [];
  if (patch.preferredTimeSlot !== undefined) cells.push(["H", patch.preferredTimeSlot]);
  if (patch.preferredServices !== undefined) cells.push(["I", patch.preferredServices]);
  if (patch.subscriptionStatus !== undefined) cells.push(["K", patch.subscriptionStatus]);
  if (patch.referralSource !== undefined) cells.push(["L", patch.referralSource]);
  if (patch.notes !== undefined) cells.push(["O", patch.notes]);

  if (cells.length > 0) {
    await updateRowCells("Customers", row, cells);
  }
}
