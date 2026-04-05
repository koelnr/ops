import { Timestamp } from 'firebase-admin/firestore'
import { db } from '../../firebase/firestore'
import { nowTimestamp } from '../../firebase/timestamps'
import { bookingDoc, bookingsCol } from '../collections'
import { docsToArray } from '../utils'
import type { BookingDoc } from '../types'

export async function getBookingsByDate(serviceDate: string): Promise<BookingDoc[]> {
  const snap = await bookingsCol().where('serviceDate', '==', serviceDate).get()
  return docsToArray(snap)
}

export async function getBookingsByWorkerAndDate(
  workerId: string,
  serviceDate: string,
): Promise<BookingDoc[]> {
  const snap = await bookingsCol()
    .where('assignedWorkerId', '==', workerId)
    .where('serviceDate', '==', serviceDate)
    .get()
  return docsToArray(snap)
}

export async function createBooking(
  data: Omit<BookingDoc, 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const now = nowTimestamp()
  const ref = bookingsCol().doc()
  await ref.set({ ...data, createdAt: now, updatedAt: now })
  return ref.id
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
  })
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
  })
}

export async function markBookingStarted(bookingId: string): Promise<void> {
  await bookingDoc(bookingId).update({
    'times.actualStartAt': Timestamp.now(),
    updatedAt: nowTimestamp(),
  })
}

export async function markBookingCompleted(bookingId: string): Promise<void> {
  await bookingDoc(bookingId).update({
    'times.actualEndAt': Timestamp.now(),
    updatedAt: nowTimestamp(),
  })
}
