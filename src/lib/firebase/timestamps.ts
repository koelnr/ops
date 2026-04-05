import { Timestamp } from 'firebase-admin/firestore'

export function nowTimestamp(): Timestamp {
  return Timestamp.now()
}

export function toTimestamp(date: Date | string): Timestamp {
  const d = typeof date === 'string' ? new Date(date) : date
  return Timestamp.fromDate(d)
}

export function timestampToDate(ts: Timestamp): Date {
  return ts.toDate()
}
