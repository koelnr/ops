import type { UpdateLeadInput } from "../types";
import { findRowIndex, updateRowCells } from "./helpers";

// Leads column map: A=id, B=name, C=phone, D=source,
// E=status, F=createdAt, G=notes

export async function updateLead(
  id: string,
  patch: UpdateLeadInput
): Promise<void> {
  const row = await findRowIndex("Leads", id);
  if (row === null) {
    throw new Error(`Lead not found: ${id}`);
  }

  const cells: [string, string][] = [["E", patch.status]];
  if (patch.notes !== undefined) cells.push(["G", patch.notes]);

  await updateRowCells("Leads", row, cells);
}
