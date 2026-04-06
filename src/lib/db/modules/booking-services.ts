import { nowTimestamp } from "../../firebase/timestamps";
import {
  bookingServiceDoc,
  bookingServicesCol,
  servicesCol,
} from "../collections";
import { docsToArrayWithId } from "../utils";
import type { BookingServiceDoc } from "../types";
import type { CreateBookingServiceInput } from "../../schemas";

export async function getAllBookingServices(): Promise<
  Array<BookingServiceDoc & { id: string }>
> {
  const snap = await bookingServicesCol().get();
  return docsToArrayWithId(snap);
}

export async function getBookingServicesByBookingId(
  bookingId: string,
): Promise<Array<BookingServiceDoc & { id: string }>> {
  const snap = await bookingServicesCol()
    .where("bookingId", "==", bookingId)
    .get();
  return docsToArrayWithId(snap);
}

export async function createBookingServiceFromInput(
  input: CreateBookingServiceInput,
): Promise<string> {
  const now = nowTimestamp();
  const serviceSnap = await servicesCol().doc(input.service_id).get();
  const service = serviceSnap.data();

  const data: Omit<BookingServiceDoc, "createdAt" | "updatedAt"> = {
    bookingId: input.booking_id,
    serviceId: input.service_id,
    serviceName: service?.name ?? "",
    quantity: input.quantity ?? 1,
    unitPrice: input.unit_price,
    lineTotal: input.line_total,
  };

  const ref = bookingServicesCol().doc();
  await ref.set({ ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function deleteBookingService(id: string): Promise<void> {
  const ref = bookingServiceDoc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`BookingService not found: ${id}`);
  await ref.delete();
}
