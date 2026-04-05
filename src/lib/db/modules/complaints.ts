import { nowTimestamp } from '../../firebase/timestamps'
import { bookingDoc, complaintDoc, complaintsCol } from '../collections'
import { db } from '../../firebase/firestore'
import { docsToArray } from '../utils'
import type { ComplaintDoc } from '../types'

export async function getOpenComplaints(): Promise<ComplaintDoc[]> {
  const snap = await complaintsCol()
    .where('resolutionStatus', 'in', ['open', 'in_progress'])
    .get()
  return docsToArray(snap)
}

export async function createComplaint(
  id: string,
  data: Omit<ComplaintDoc, 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const now = nowTimestamp()
  const cmpRef = complaintDoc(id)
  const bkgRef = bookingDoc(data.bookingId)

  await db.runTransaction(async (tx) => {
    const bookingSnap = await tx.get(bkgRef)
    if (!bookingSnap.exists) throw new Error(`Booking ${data.bookingId} not found`)

    const booking = bookingSnap.data()!
    const newCount = booking.complaint.count + 1
    const hasOpenComplaint = data.resolutionStatus !== 'resolved'

    tx.set(cmpRef, { ...data, createdAt: now, updatedAt: now })
    tx.update(bkgRef, {
      'complaint.count': newCount,
      'complaint.hasOpenComplaint': hasOpenComplaint,
      updatedAt: now,
    })
  })
}
