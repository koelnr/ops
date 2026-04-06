import { Timestamp } from "firebase-admin/firestore";
import { nowTimestamp } from "../../firebase/timestamps";
import {
  areasCol,
  leadDoc,
  leadSourcesCol,
  leadsCol,
  servicesCol,
} from "../collections";
import { docsToArrayWithId } from "../utils";
import type { LeadDoc } from "../types";
import type { CreateLeadInput, UpdateLeadInput } from "../../schemas";

export async function getAllLeads(): Promise<Array<LeadDoc & { id: string }>> {
  const snap = await leadsCol().get();
  return docsToArrayWithId(snap);
}

export async function getLeadsNeedingFollowUp(): Promise<
  Array<LeadDoc & { id: string }>
> {
  const snap = await leadsCol()
    .where("followUpStatus", "==", "follow_up_needed")
    .get();
  return docsToArrayWithId(snap);
}

export async function createLeadFromInput(
  input: CreateLeadInput,
): Promise<string> {
  const now = nowTimestamp();

  const [areaSnap, serviceSnap, sourceSnap] = await Promise.all([
    input.area_id ? areasCol().doc(input.area_id).get() : null,
    input.interested_service_id
      ? servicesCol().doc(input.interested_service_id).get()
      : null,
    input.source_id ? leadSourcesCol().doc(input.source_id).get() : null,
  ]);

  const area = areaSnap?.data();
  const service = serviceSnap?.data();
  const source = sourceSnap?.data();

  const followUpStatus = (input.follow_up_status
    ?.toLowerCase()
    .replace(/ /g, "_") ?? "new") as LeadDoc["followUpStatus"];
  const conversionStatus = (input.conversion_status
    ?.toLowerCase()
    .replace(/ /g, "_") ?? "unconverted") as LeadDoc["conversionStatus"];

  const data: Omit<LeadDoc, "createdAt" | "updatedAt"> = {
    leadDate: input.lead_date
      ? Timestamp.fromDate(new Date(input.lead_date))
      : null,
    prospectName: input.prospect_name,
    phone: input.phone,
    areaId: input.area_id ?? "",
    areaName: area?.name ?? "",
    interestedServiceId: input.interested_service_id ?? "",
    interestedServiceName: service?.name ?? "",
    sourceId: input.source_id ?? "",
    sourceName: source?.name ?? "",
    followUpStatus,
    conversionStatus,
    convertedCustomerId: input.converted_customer_id ?? null,
    convertedBookingId: input.converted_booking_id ?? null,
    notes: input.notes ?? "",
  };

  const ref = leadsCol().doc();
  await ref.set({ ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateLeadFromInput(
  id: string,
  patch: UpdateLeadInput,
): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: nowTimestamp() };
  if (patch.lead_date !== undefined) {
    updates.leadDate = patch.lead_date
      ? Timestamp.fromDate(new Date(patch.lead_date))
      : null;
  }
  if (patch.prospect_name !== undefined)
    updates.prospectName = patch.prospect_name;
  if (patch.phone !== undefined) updates.phone = patch.phone;
  if (patch.area_id !== undefined) updates.areaId = patch.area_id;
  if (patch.interested_service_id !== undefined)
    updates.interestedServiceId = patch.interested_service_id;
  if (patch.source_id !== undefined) updates.sourceId = patch.source_id;
  if (patch.follow_up_status !== undefined) {
    updates.followUpStatus = patch.follow_up_status
      .toLowerCase()
      .replace(/ /g, "_");
  }
  if (patch.conversion_status !== undefined) {
    updates.conversionStatus = patch.conversion_status
      .toLowerCase()
      .replace(/ /g, "_");
  }
  if (patch.converted_customer_id !== undefined)
    updates.convertedCustomerId = patch.converted_customer_id || null;
  if (patch.converted_booking_id !== undefined)
    updates.convertedBookingId = patch.converted_booking_id || null;
  if (patch.notes !== undefined) updates.notes = patch.notes;
  const ref = leadDoc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lead not found: ${id}`);
  await ref.update(updates);
}

export async function deleteLead(id: string): Promise<void> {
  const ref = leadDoc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lead not found: ${id}`);
  await ref.delete();
}
