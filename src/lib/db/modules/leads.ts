import { nowTimestamp } from '../../firebase/timestamps'
import { leadsCol } from '../collections'
import { docsToArray } from '../utils'
import type { LeadDoc } from '../types'

export async function getLeadsNeedingFollowUp(): Promise<LeadDoc[]> {
  const snap = await leadsCol().where('followUpStatus', '==', 'follow_up_needed').get()
  return docsToArray(snap)
}

export async function createLead(
  data: Omit<LeadDoc, 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const now = nowTimestamp()
  const ref = leadsCol().doc()
  await ref.set({ ...data, createdAt: now, updatedAt: now })
  return ref.id
}
