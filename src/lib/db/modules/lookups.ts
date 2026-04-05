import {
  areasCol,
  bookingStatusesCol,
  complaintTypesCol,
  leadSourcesCol,
  paymentModesCol,
  paymentStatusesCol,
  servicesCol,
  timeSlotsCol,
  vehicleTypesCol,
} from '../collections'
import { docsToArray } from '../utils'
import type {
  AreaDoc,
  BookingStatusDoc,
  ComplaintTypeDoc,
  LeadSourceDoc,
  PaymentModeDoc,
  PaymentStatusDoc,
  ServiceDoc,
  TimeSlotDoc,
  VehicleTypeDoc,
} from '../types'

export async function getAreas(): Promise<AreaDoc[]> {
  const snap = await areasCol().where('isActive', '==', true).get()
  return docsToArray(snap)
}

export async function getServices(): Promise<ServiceDoc[]> {
  const snap = await servicesCol().where('isActive', '==', true).get()
  return docsToArray(snap)
}

export async function getVehicleTypes(): Promise<VehicleTypeDoc[]> {
  const snap = await vehicleTypesCol().where('isActive', '==', true).get()
  return docsToArray(snap)
}

export async function getTimeSlots(): Promise<TimeSlotDoc[]> {
  const snap = await timeSlotsCol().where('isActive', '==', true).get()
  return docsToArray(snap)
}

export async function getBookingStatuses(): Promise<BookingStatusDoc[]> {
  const snap = await bookingStatusesCol().where('isActive', '==', true).orderBy('sortOrder').get()
  return docsToArray(snap)
}

export async function getPaymentStatuses(): Promise<PaymentStatusDoc[]> {
  const snap = await paymentStatusesCol().where('isActive', '==', true).get()
  return docsToArray(snap)
}

export async function getPaymentModes(): Promise<PaymentModeDoc[]> {
  const snap = await paymentModesCol().where('isActive', '==', true).get()
  return docsToArray(snap)
}

export async function getLeadSources(): Promise<LeadSourceDoc[]> {
  const snap = await leadSourcesCol().where('isActive', '==', true).get()
  return docsToArray(snap)
}

export async function getComplaintTypes(): Promise<ComplaintTypeDoc[]> {
  const snap = await complaintTypesCol().where('isActive', '==', true).get()
  return docsToArray(snap)
}
