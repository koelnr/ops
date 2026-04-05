import { nowTimestamp } from '../../firebase/timestamps'
import { customerDoc, customersCol } from '../collections'
import { docsToArray, getDocOrNull } from '../utils'
import type { CustomerDoc } from '../types'

export async function getCustomers(): Promise<CustomerDoc[]> {
  const snap = await customersCol().where('status', '==', 'active').get()
  return docsToArray(snap)
}

export async function getCustomerById(id: string): Promise<CustomerDoc | null> {
  return getDocOrNull(customerDoc(id))
}

export async function createCustomer(
  data: Omit<CustomerDoc, 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const now = nowTimestamp()
  const ref = customersCol().doc()
  await ref.set({ ...data, createdAt: now, updatedAt: now })
  return ref.id
}
