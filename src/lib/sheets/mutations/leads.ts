import type { UpdateLeadInput } from "../types";
import { findRowIndex, updateRowCells } from "./helpers";

// Leads column map: A=Lead ID, B=Lead Date, C=Lead Source, D=Prospect Name,
// E=Phone Number, F=Area / Society, G=Interested Service,
// H=Follow-Up Status, I=Conversion Status, J=First Booking Date, K=Notes
//
// Lookup rows by Prospect Name (column D)
// Mutable: H=Follow-Up Status, I=Conversion Status, K=Notes

export async function updateLead(
  prospectName: string,
  patch: UpdateLeadInput,
): Promise<void> {
  const row = await findRowIndex("Leads", prospectName, "D");
  if (row === null) {
    throw new Error(`Lead not found: ${prospectName}`);
  }

  const cells: [string, string][] = [];
  if (patch.followUpStatus !== undefined)
    cells.push(["H", patch.followUpStatus]);
  if (patch.conversionStatus !== undefined)
    cells.push(["I", patch.conversionStatus]);
  if (patch.notes !== undefined) cells.push(["K", patch.notes]);

  if (cells.length > 0) {
    await updateRowCells("Leads", row, cells);
  }
}
