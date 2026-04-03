import type { CreateLeadInput, UpdateLeadInput } from "../types";
import { findRowIndex, updateRowCells, appendRow, deleteRow, generateNextId } from "./helpers";

// Leads column map: A=Lead ID, B=Lead Date, C=Lead Source, D=Prospect Name,
// E=Phone Number, F=Area / Society, G=Interested Service,
// H=Follow-Up Status, I=Conversion Status, J=First Booking Date, K=Notes

export async function createLead(input: CreateLeadInput): Promise<void> {
  const leadId = await generateNextId("Leads", "LED");
  await appendRow("Leads", [
    leadId,
    input.leadDate,
    input.leadSource,
    input.prospectName,
    input.phoneNumber,
    input.areaSociety ?? "",
    input.interestedService ?? "",
    input.followUpStatus,
    input.conversionStatus,
    "", // First Booking Date
    input.notes ?? "",
  ]);
}

export async function updateLead(
  id: string,
  patch: UpdateLeadInput,
): Promise<void> {
  const row = await findRowIndex("Leads", id);
  if (row === null) throw new Error(`Lead not found: ${id}`);

  const cells: [string, string][] = [];
  if (patch.leadDate !== undefined) cells.push(["B", patch.leadDate]);
  if (patch.leadSource !== undefined) cells.push(["C", patch.leadSource]);
  if (patch.prospectName !== undefined) cells.push(["D", patch.prospectName]);
  if (patch.phoneNumber !== undefined) cells.push(["E", patch.phoneNumber]);
  if (patch.areaSociety !== undefined) cells.push(["F", patch.areaSociety]);
  if (patch.interestedService !== undefined) cells.push(["G", patch.interestedService]);
  if (patch.followUpStatus !== undefined) cells.push(["H", patch.followUpStatus]);
  if (patch.conversionStatus !== undefined) cells.push(["I", patch.conversionStatus]);
  if (patch.firstBookingDate !== undefined) cells.push(["J", patch.firstBookingDate]);
  if (patch.notes !== undefined) cells.push(["K", patch.notes]);

  if (cells.length > 0) {
    await updateRowCells("Leads", row, cells);
  }
}

export async function deleteLead(id: string): Promise<void> {
  const row = await findRowIndex("Leads", id);
  if (row === null) throw new Error(`Lead not found: ${id}`);
  await deleteRow("Leads", row);
}
