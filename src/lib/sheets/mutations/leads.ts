import type { UpdateLeadInput } from "../types";
import { findRowIndex, updateRowCells } from "./helpers";

// Leads column map: A=Lead Date, B=Lead Source, C=Prospect Name,
// D=Phone Number, E=Area / Society, F=Interested Service,
// G=Follow-Up Status, H=Conversion Status, I=First Booking Date, J=Notes
//
// No ID column — lookup rows by Prospect Name (column C)
// Mutable: G=Follow-Up Status, H=Conversion Status, J=Notes

export async function updateLead(
  prospectName: string,
  patch: UpdateLeadInput,
): Promise<void> {
  const row = await findRowIndex("Leads", prospectName, "C");
  if (row === null) {
    throw new Error(`Lead not found: ${prospectName}`);
  }

  const cells: [string, string][] = [];
  if (patch.followUpStatus !== undefined)
    cells.push(["G", patch.followUpStatus]);
  if (patch.conversionStatus !== undefined)
    cells.push(["H", patch.conversionStatus]);
  if (patch.notes !== undefined) cells.push(["J", patch.notes]);

  if (cells.length > 0) {
    await updateRowCells("Leads", row, cells);
  }
}
