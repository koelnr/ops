import { nowTimestamp } from '../../firebase/timestamps'
import { vehiclesCol } from '../collections'
import { docsToArray } from '../utils'
import type { VehicleDoc } from '../types'

export async function getVehiclesByCustomerId(customerId: string): Promise<VehicleDoc[]> {
  const snap = await vehiclesCol().where('customerId', '==', customerId).get()
  return docsToArray(snap)
}

export async function createVehicle(
  data: Omit<VehicleDoc, 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const now = nowTimestamp()
  const ref = vehiclesCol().doc()
  await ref.set({ ...data, createdAt: now, updatedAt: now })
  return ref.id
}
