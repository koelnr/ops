import { Timestamp } from "firebase-admin/firestore";
import { db } from "../../firebase/firestore";
import { nowTimestamp } from "../../firebase/timestamps";
import {
  areaDoc,
  bookingDoc,
  bookingStatusDoc,
  bookingsCol,
  customerDoc,
  leadSourceDoc,
  timeSlotDoc,
  vehicleDoc,
  workerDoc,
} from "../collections";
import { docsToArrayWithId } from "../utils";
import type { BookingDoc } from "../types";
import type { CreateBookingInput, UpdateBookingInput } from "../../schemas";

export async function getAllBookings(): Promise<
  Array<BookingDoc & { id: string }>
> {
  const snap = await bookingsCol().get();
  return docsToArrayWithId(snap);
}

export async function getBookingsByDate(
  serviceDate: string,
): Promise<Array<BookingDoc & { id: string }>> {
  const snap = await bookingsCol()
    .where("serviceDate", "==", serviceDate)
    .get();
  return docsToArrayWithId(snap);
}

export async function createBookingFromInput(
  input: CreateBookingInput,
): Promise<string> {
  const now = nowTimestamp();

  // Look up display names for denormalized fields
  const [
    customerSnap,
    vehicleSnap,
    timeSlotSnap,
    statusSnap,
    workerSnap,
    areaSnap,
    sourceSnap,
  ] = await Promise.all([
    customerDoc(input.customer_id).get(),
    vehicleDoc(input.vehicle_id).get(),
    input.time_slot_id ? timeSlotDoc(input.time_slot_id).get() : null,
    input.booking_status_id
      ? bookingStatusDoc(input.booking_status_id).get()
      : null,
    input.assigned_worker_id ? workerDoc(input.assigned_worker_id).get() : null,
    input.area_id ? areaDoc(input.area_id).get() : null,
    input.source_id ? leadSourceDoc(input.source_id).get() : null,
  ]);

  const customer = customerSnap.data();
  const vehicle = vehicleSnap.data();
  const timeSlot = timeSlotSnap?.data();
  const status = statusSnap?.data();
  const worker = workerSnap?.data();
  const area = areaSnap?.data();
  const source = sourceSnap?.data();

  const finalPrice = input.final_price;

  const data: Omit<BookingDoc, "createdAt" | "updatedAt"> = {
    customerId: input.customer_id,
    customerName: customer?.fullName ?? "",
    customerPhone: customer?.phone ?? "",
    vehicleId: input.vehicle_id,
    vehicleLabel: vehicle
      ? `${vehicle.carModel}${vehicle.registrationNumber ? ` (${vehicle.registrationNumber})` : ""}`
      : "",
    serviceDate: input.service_date,
    timeSlotId: input.time_slot_id,
    timeSlotLabel: timeSlot?.label ?? "",
    bookingStatusId: input.booking_status_id,
    bookingStatusName: status?.name ?? "",
    sourceId: input.source_id ?? "",
    sourceName: source?.name ?? "",
    assignedWorkerId: input.assigned_worker_id ?? "",
    assignedWorkerName: worker?.workerName ?? "",
    areaId: input.area_id ?? "",
    areaName: area?.name ?? "",
    pricing: {
      basePrice: input.base_price,
      discountAmount: input.discount_amount ?? 0,
      addonTotal: input.addon_total ?? 0,
      finalPrice,
    },
    items: [],
    times: {
      scheduledStartAt: null,
      actualStartAt: null,
      actualEndAt: null,
    },
    payment: {
      amountPaid: 0,
      amountDue: finalPrice,
      paymentStatusId: "",
      paymentStatusName: "",
      followUpRequired: false,
    },
    complaint: {
      count: 0,
      hasOpenComplaint: false,
    },
    notes: input.notes ?? "",
  };

  const ref = bookingsCol().doc();
  await ref.set({ ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateBookingFromInput(
  id: string,
  patch: UpdateBookingInput,
): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: nowTimestamp() };
  if (patch.customer_id !== undefined) updates.customerId = patch.customer_id;
  if (patch.vehicle_id !== undefined) updates.vehicleId = patch.vehicle_id;
  if (patch.service_date !== undefined)
    updates.serviceDate = patch.service_date;
  if (patch.time_slot_id !== undefined) updates.timeSlotId = patch.time_slot_id;
  if (patch.booking_status_id !== undefined)
    updates.bookingStatusId = patch.booking_status_id;
  if (patch.source_id !== undefined) updates.sourceId = patch.source_id;
  if (patch.assigned_worker_id !== undefined)
    updates.assignedWorkerId = patch.assigned_worker_id;
  if (patch.area_id !== undefined) updates.areaId = patch.area_id;
  if (patch.base_price !== undefined)
    updates["pricing.basePrice"] = patch.base_price;
  if (patch.discount_amount !== undefined)
    updates["pricing.discountAmount"] = patch.discount_amount;
  if (patch.addon_total !== undefined)
    updates["pricing.addonTotal"] = patch.addon_total;
  if (patch.final_price !== undefined) {
    updates["pricing.finalPrice"] = patch.final_price;
    updates["payment.amountDue"] = patch.final_price;
  }
  if (patch.scheduled_start_at !== undefined) {
    updates["times.scheduledStartAt"] = patch.scheduled_start_at
      ? Timestamp.fromDate(new Date(patch.scheduled_start_at))
      : null;
  }
  if (patch.actual_start_at !== undefined) {
    updates["times.actualStartAt"] = patch.actual_start_at
      ? Timestamp.fromDate(new Date(patch.actual_start_at))
      : null;
  }
  if (patch.actual_end_at !== undefined) {
    updates["times.actualEndAt"] = patch.actual_end_at
      ? Timestamp.fromDate(new Date(patch.actual_end_at))
      : null;
  }
  if (patch.notes !== undefined) updates.notes = patch.notes;

  const ref = bookingDoc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Booking not found: ${id}`);
  await ref.update(updates);
}

export async function deleteBooking(id: string): Promise<void> {
  const ref = bookingDoc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Booking not found: ${id}`);
  await ref.delete();
}

export async function updateBookingStatus(
  bookingId: string,
  statusId: string,
  statusName: string,
): Promise<void> {
  await bookingDoc(bookingId).update({
    bookingStatusId: statusId,
    bookingStatusName: statusName,
    updatedAt: nowTimestamp(),
  });
}

export async function assignWorkerToBooking(
  bookingId: string,
  workerId: string,
  workerName: string,
): Promise<void> {
  await bookingDoc(bookingId).update({
    assignedWorkerId: workerId,
    assignedWorkerName: workerName,
    updatedAt: nowTimestamp(),
  });
}

export async function markBookingStarted(bookingId: string): Promise<void> {
  await bookingDoc(bookingId).update({
    "times.actualStartAt": Timestamp.now(),
    updatedAt: nowTimestamp(),
  });
}

export async function markBookingCompleted(bookingId: string): Promise<void> {
  await bookingDoc(bookingId).update({
    "times.actualEndAt": Timestamp.now(),
    updatedAt: nowTimestamp(),
  });
}
