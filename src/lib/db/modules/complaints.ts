import { Timestamp } from 'firebase-admin/firestore'
import { nowTimestamp } from '../../firebase/timestamps'
import { bookingDoc, complaintDoc, complaintTypesCol, complaintsCol, customersCol, workersCol } from '../collections'
import { db } from '../../firebase/firestore'
import { docsToArrayWithId } from '../utils'
import type { ComplaintDoc } from '../types'
import type { CreateComplaintInput, UpdateComplaintInput } from '../../schemas'

export async function getAllComplaints(): Promise<Array<ComplaintDoc & { id: string }>> {
  const snap = await complaintsCol().get()
  return docsToArrayWithId(snap)
}

export async function getOpenComplaints(): Promise<Array<ComplaintDoc & { id: string }>> {
  const snap = await complaintsCol()
    .where('resolutionStatus', 'in', ['open', 'in_progress'])
    .get()
  return docsToArrayWithId(snap)
}

export async function createComplaintFromInput(input: CreateComplaintInput): Promise<string> {
  const now = nowTimestamp()

  const [bookingSnap, typeSnap, workerSnap] = await Promise.all([
    bookingDoc(input.booking_id).get(),
    input.complaint_type_id ? complaintTypesCol().doc(input.complaint_type_id).get() : null,
    input.assigned_worker_id ? workersCol().doc(input.assigned_worker_id).get() : null,
  ])

  const booking = bookingSnap.data()
  const customer = booking ? await customersCol().doc(booking.customerId).get() : null
  const customerData = customer?.data()
  const type = typeSnap?.data()
  const worker = workerSnap?.data()

  const resStatus = (input.resolution_status?.toLowerCase() ?? 'open') as 'open' | 'in_progress' | 'resolved'

  const cmpData: Omit<ComplaintDoc, 'createdAt' | 'updatedAt'> = {
    bookingId: input.booking_id,
    customerId: booking?.customerId ?? '',
    customerName: customerData?.fullName ?? '',
    workerId: input.assigned_worker_id ?? null,
    workerName: worker?.workerName ?? null,
    complaintDate: input.complaint_date ? Timestamp.fromDate(new Date(input.complaint_date)) : null,
    complaintTypeId: input.complaint_type_id,
    complaintTypeName: type?.name ?? '',
    details: input.details,
    resolutionType: input.resolution_type ?? '',
    resolutionNotes: input.resolution_notes ?? '',
    resolutionStatus: resStatus,
    followUpComplete: input.follow_up_complete ?? false,
    rootCause: input.root_cause ?? '',
  }

  const newRef = complaintsCol().doc()
  const bkgRef = bookingDoc(input.booking_id)

  await db.runTransaction(async (tx) => {
    const bookingSnap2 = await tx.get(bkgRef)
    if (!bookingSnap2.exists) throw new Error(`Booking ${input.booking_id} not found`)

    const bkg = bookingSnap2.data()!
    const newCount = bkg.complaint.count + 1
    const hasOpenComplaint = resStatus !== 'resolved'

    tx.set(newRef, { ...cmpData, createdAt: now, updatedAt: now })
    tx.update(bkgRef, {
      'complaint.count': newCount,
      'complaint.hasOpenComplaint': hasOpenComplaint,
      updatedAt: now,
    })
  })

  return newRef.id
}

export async function updateComplaintFromInput(id: string, patch: UpdateComplaintInput): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: nowTimestamp() }
  if (patch.complaint_date !== undefined) {
    updates.complaintDate = patch.complaint_date
      ? Timestamp.fromDate(new Date(patch.complaint_date))
      : null
  }
  if (patch.complaint_type_id !== undefined) updates.complaintTypeId = patch.complaint_type_id
  if (patch.details !== undefined) updates.details = patch.details
  if (patch.assigned_worker_id !== undefined) updates.workerId = patch.assigned_worker_id ?? null
  if (patch.resolution_type !== undefined) updates.resolutionType = patch.resolution_type
  if (patch.resolution_notes !== undefined) updates.resolutionNotes = patch.resolution_notes
  if (patch.resolution_status !== undefined) updates.resolutionStatus = patch.resolution_status.toLowerCase()
  if (patch.follow_up_complete !== undefined) updates.followUpComplete = patch.follow_up_complete
  if (patch.root_cause !== undefined) updates.rootCause = patch.root_cause
  const ref = complaintDoc(id)
  const snap = await ref.get()
  if (!snap.exists) throw new Error(`Complaint not found: ${id}`)
  await ref.update(updates)
}

export async function deleteComplaint(id: string): Promise<void> {
  const ref = complaintDoc(id)
  const snap = await ref.get()
  if (!snap.exists) throw new Error(`Complaint not found: ${id}`)
  await ref.delete()
}
