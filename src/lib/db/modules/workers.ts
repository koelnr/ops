import { nowTimestamp } from '../../firebase/timestamps'
import { workersCol } from '../collections'
import { docsToArray } from '../utils'
import type { WorkerDoc } from '../types'

export async function getWorkers(): Promise<WorkerDoc[]> {
  const snap = await workersCol().where('status', '==', 'active').get()
  return docsToArray(snap)
}

export async function createWorker(
  data: Omit<WorkerDoc, 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const now = nowTimestamp()
  const ref = workersCol().doc()
  await ref.set({ ...data, createdAt: now, updatedAt: now })
  return ref.id
}
