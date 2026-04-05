import { db } from '../firebase/firestore'
import {
  areaConverter,
  bookingConverter,
  bookingServiceConverter,
  bookingStatusConverter,
  complaintConverter,
  complaintTypeConverter,
  customerConverter,
  leadConverter,
  leadSourceConverter,
  paymentConverter,
  paymentModeConverter,
  paymentStatusConverter,
  serviceConverter,
  timeSlotConverter,
  vehicleConverter,
  vehicleTypeConverter,
  workerConverter,
} from './converters'

// ─── Lookup Collections ───────────────────────────────────────────────────────

export const areasCol = () => db.collection('areas').withConverter(areaConverter)
export const areaDoc = (id: string) => areasCol().doc(id)

export const servicesCol = () => db.collection('services').withConverter(serviceConverter)
export const serviceDoc = (id: string) => servicesCol().doc(id)

export const vehicleTypesCol = () => db.collection('vehicleTypes').withConverter(vehicleTypeConverter)
export const vehicleTypeDoc = (id: string) => vehicleTypesCol().doc(id)

export const timeSlotsCol = () => db.collection('timeSlots').withConverter(timeSlotConverter)
export const timeSlotDoc = (id: string) => timeSlotsCol().doc(id)

export const bookingStatusesCol = () => db.collection('bookingStatuses').withConverter(bookingStatusConverter)
export const bookingStatusDoc = (id: string) => bookingStatusesCol().doc(id)

export const paymentStatusesCol = () => db.collection('paymentStatuses').withConverter(paymentStatusConverter)
export const paymentStatusDoc = (id: string) => paymentStatusesCol().doc(id)

export const paymentModesCol = () => db.collection('paymentModes').withConverter(paymentModeConverter)
export const paymentModeDoc = (id: string) => paymentModesCol().doc(id)

export const leadSourcesCol = () => db.collection('leadSources').withConverter(leadSourceConverter)
export const leadSourceDoc = (id: string) => leadSourcesCol().doc(id)

export const complaintTypesCol = () => db.collection('complaintTypes').withConverter(complaintTypeConverter)
export const complaintTypeDoc = (id: string) => complaintTypesCol().doc(id)

// ─── Transactional Collections ────────────────────────────────────────────────

export const customersCol = () => db.collection('customers').withConverter(customerConverter)
export const customerDoc = (id: string) => customersCol().doc(id)

export const vehiclesCol = () => db.collection('vehicles').withConverter(vehicleConverter)
export const vehicleDoc = (id: string) => vehiclesCol().doc(id)

export const workersCol = () => db.collection('workers').withConverter(workerConverter)
export const workerDoc = (id: string) => workersCol().doc(id)

export const bookingsCol = () => db.collection('bookings').withConverter(bookingConverter)
export const bookingDoc = (id: string) => bookingsCol().doc(id)

export const paymentsCol = () => db.collection('payments').withConverter(paymentConverter)
export const paymentDoc = (id: string) => paymentsCol().doc(id)

export const complaintsCol = () => db.collection('complaints').withConverter(complaintConverter)
export const complaintDoc = (id: string) => complaintsCol().doc(id)

export const leadsCol = () => db.collection('leads').withConverter(leadConverter)
export const leadDoc = (id: string) => leadsCol().doc(id)

export const bookingServicesCol = () => db.collection('bookingServices').withConverter(bookingServiceConverter)
export const bookingServiceDoc = (id: string) => bookingServicesCol().doc(id)
