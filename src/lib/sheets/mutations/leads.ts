import type { CreateLeadInput, UpdateLeadInput } from "../../schemas";
import type { Lead } from "../../domain";
import { findRowIndex, updateRowCells, appendRow, deleteRow, generateNextId } from "./helpers";

// Leads column map (A=lead_id, B=lead_date, C=prospect_name, D=phone,
// E=area_id, F=interested_service_id, G=source_id,
// H=follow_up_status, I=conversion_status,
// J=converted_customer_id, K=converted_booking_id, L=notes)

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const lead_id = await generateNextId("leads", "LED");

  await appendRow("leads", [
    lead_id,
    input.lead_date,
    input.prospect_name,
    input.phone,
    input.area_id ?? "",
    input.interested_service_id ?? "",
    input.source_id ?? "",
    input.follow_up_status ?? "New",
    input.conversion_status ?? "Not Converted",
    input.converted_customer_id ?? "",
    input.converted_booking_id ?? "",
    input.notes ?? "",
  ]);

  return {
    lead_id,
    lead_date: input.lead_date,
    prospect_name: input.prospect_name,
    phone: input.phone,
    area_id: input.area_id ?? "",
    interested_service_id: input.interested_service_id ?? "",
    source_id: input.source_id ?? "",
    follow_up_status: input.follow_up_status ?? "New",
    conversion_status: input.conversion_status ?? "Not Converted",
    converted_customer_id: input.converted_customer_id ?? "",
    converted_booking_id: input.converted_booking_id ?? "",
    notes: input.notes ?? "",
  };
}

export async function updateLead(id: string, patch: UpdateLeadInput): Promise<void> {
  const row = await findRowIndex("leads", id);
  if (row === null) throw new Error(`Lead not found: ${id}`);

  const cells: [string, string][] = [];
  if (patch.lead_date !== undefined) cells.push(["B", patch.lead_date]);
  if (patch.prospect_name !== undefined) cells.push(["C", patch.prospect_name]);
  if (patch.phone !== undefined) cells.push(["D", patch.phone]);
  if (patch.area_id !== undefined) cells.push(["E", patch.area_id]);
  if (patch.interested_service_id !== undefined) cells.push(["F", patch.interested_service_id]);
  if (patch.source_id !== undefined) cells.push(["G", patch.source_id]);
  if (patch.follow_up_status !== undefined) cells.push(["H", patch.follow_up_status]);
  if (patch.conversion_status !== undefined) cells.push(["I", patch.conversion_status]);
  if (patch.converted_customer_id !== undefined) cells.push(["J", patch.converted_customer_id]);
  if (patch.converted_booking_id !== undefined) cells.push(["K", patch.converted_booking_id]);
  if (patch.notes !== undefined) cells.push(["L", patch.notes]);

  if (cells.length > 0) {
    await updateRowCells("leads", row, cells);
  }
}

export async function deleteLead(id: string): Promise<void> {
  const row = await findRowIndex("leads", id);
  if (row === null) throw new Error(`Lead not found: ${id}`);
  await deleteRow("leads", row);
}
