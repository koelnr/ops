import { nowTimestamp } from '../../firebase/timestamps'
import { bookingDoc, paymentDoc, paymentsCol } from '../collections'
import { db } from '../../firebase/firestore'
import { docsToArray } from '../utils'
import type { PaymentDoc } from '../types'

export async function getPendingPayments(): Promise<PaymentDoc[]> {
  const snap = await paymentsCol().where('followUpRequired', '==', true).get()
  return docsToArray(snap)
}

export async function createPayment(
  id: string,
  data: Omit<PaymentDoc, 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const now = nowTimestamp()
  const payRef = paymentDoc(id)
  const bkgRef = bookingDoc(data.bookingId)

  await db.runTransaction(async (tx) => {
    const bookingSnap = await tx.get(bkgRef)
    if (!bookingSnap.exists) throw new Error(`Booking ${data.bookingId} not found`)

    const booking = bookingSnap.data()!
    const newAmountPaid = booking.payment.amountPaid + data.amountReceived
    const newAmountDue = Math.max(0, booking.pricing.finalPrice - newAmountPaid)
    const followUpRequired = newAmountDue > 0

    tx.set(payRef, { ...data, createdAt: now, updatedAt: now })
    tx.update(bkgRef, {
      'payment.amountPaid': newAmountPaid,
      'payment.amountDue': newAmountDue,
      'payment.followUpRequired': followUpRequired,
      updatedAt: now,
    })
  })
}
