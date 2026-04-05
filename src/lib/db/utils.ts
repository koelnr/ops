import type { DocumentReference, QuerySnapshot } from 'firebase-admin/firestore'

export function docsToArray<T>(snapshot: QuerySnapshot<T>): T[] {
  return snapshot.docs.map((doc) => doc.data())
}

export function docsToArrayWithId<T>(snapshot: QuerySnapshot<T>): Array<T & { id: string }> {
  return snapshot.docs.map((doc) => ({ ...(doc.data() as object), id: doc.id } as T & { id: string }))
}

export async function getDocOrNull<T>(ref: DocumentReference<T>): Promise<T | null> {
  const snap = await ref.get()
  return snap.exists ? snap.data() ?? null : null
}
