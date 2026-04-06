import { Timestamp } from "firebase-admin/firestore";
import { nowTimestamp } from "../../firebase/timestamps";
import {
  bookingDoc,
  customerDoc,
  paymentDoc,
  paymentModesCol,
  paymentStatusesCol,
  paymentsCol,
  workersCol,
} from "../collections";
import { db } from "../../firebase/firestore";
import { docsToArrayWithId } from "../utils";
import type { PaymentDoc } from "../types";
import type { CreatePaymentInput, UpdatePaymentInput } from "../../schemas";

export async function getAllPayments(): Promise<
  Array<PaymentDoc & { id: string }>
> {
  const snap = await paymentsCol().get();
  return docsToArrayWithId(snap);
}

export async function getPendingPayments(): Promise<
  Array<PaymentDoc & { id: string }>
> {
  const snap = await paymentsCol().where("followUpRequired", "==", true).get();
  return docsToArrayWithId(snap);
}

export async function createPaymentFromInput(
  input: CreatePaymentInput,
): Promise<string> {
  const now = nowTimestamp();

  // Look up display names
  const [bookingSnap, modeSnap, statusSnap, workerSnap] = await Promise.all([
    bookingDoc(input.booking_id).get(),
    input.payment_mode_id
      ? paymentModesCol().doc(input.payment_mode_id).get()
      : null,
    input.payment_status_id
      ? paymentStatusesCol().doc(input.payment_status_id).get()
      : null,
    input.collected_by_worker_id
      ? workersCol().doc(input.collected_by_worker_id).get()
      : null,
  ]);

  const booking = bookingSnap.data();
  const customer = booking ? await customerDoc(booking.customerId).get() : null;
  const customerData = customer?.data();
  const mode = modeSnap?.data();
  const status = statusSnap?.data();
  const worker = workerSnap?.data();

  const newRef = paymentsCol().doc();

  const payData: Omit<PaymentDoc, "createdAt" | "updatedAt"> = {
    bookingId: input.booking_id,
    customerId: booking?.customerId ?? "",
    customerName: customerData?.fullName ?? "",
    serviceDate: booking?.serviceDate ?? "",
    finalPrice: booking?.pricing.finalPrice ?? 0,
    amountReceived: input.amount_received,
    paymentDate: input.payment_date
      ? Timestamp.fromDate(new Date(input.payment_date))
      : null,
    paymentModeId: input.payment_mode_id,
    paymentModeName: mode?.name ?? "",
    paymentStatusId: input.payment_status_id,
    paymentStatusName: status?.name ?? "",
    collectedByWorkerId: input.collected_by_worker_id ?? null,
    collectedByWorkerName: worker?.workerName ?? null,
    followUpRequired: input.follow_up_required ?? false,
    upiTransactionRef: input.upi_transaction_ref ?? null,
    notes: input.notes ?? "",
  };

  const bkgRef = bookingDoc(input.booking_id);

  await db.runTransaction(async (tx) => {
    const bookingSnap2 = await tx.get(bkgRef);
    if (!bookingSnap2.exists)
      throw new Error(`Booking ${input.booking_id} not found`);

    const bkg = bookingSnap2.data()!;
    const newAmountPaid = bkg.payment.amountPaid + input.amount_received;
    const newAmountDue = Math.max(0, bkg.pricing.finalPrice - newAmountPaid);

    tx.set(newRef, { ...payData, createdAt: now, updatedAt: now });
    tx.update(bkgRef, {
      "payment.amountPaid": newAmountPaid,
      "payment.amountDue": newAmountDue,
      "payment.followUpRequired": newAmountDue > 0,
      updatedAt: now,
    });
  });

  return newRef.id;
}

export async function updatePaymentFromInput(
  id: string,
  patch: UpdatePaymentInput,
): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: nowTimestamp() };
  if (patch.payment_date !== undefined) {
    updates.paymentDate = patch.payment_date
      ? Timestamp.fromDate(new Date(patch.payment_date))
      : null;
  }
  if (patch.amount_received !== undefined)
    updates.amountReceived = patch.amount_received;
  if (patch.payment_mode_id !== undefined)
    updates.paymentModeId = patch.payment_mode_id;
  if (patch.payment_status_id !== undefined)
    updates.paymentStatusId = patch.payment_status_id;
  if (patch.upi_transaction_ref !== undefined)
    updates.upiTransactionRef = patch.upi_transaction_ref ?? null;
  if (patch.collected_by_worker_id !== undefined)
    updates.collectedByWorkerId = patch.collected_by_worker_id ?? null;
  if (patch.follow_up_required !== undefined)
    updates.followUpRequired = patch.follow_up_required;
  if (patch.notes !== undefined) updates.notes = patch.notes;
  const ref = paymentDoc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Payment not found: ${id}`);
  await ref.update(updates);
}

export async function deletePayment(id: string): Promise<void> {
  const ref = paymentDoc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Payment not found: ${id}`);
  await ref.delete();
}
