import type { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import type {
  AreaDoc,
  BookingDoc,
  BookingServiceDoc,
  BookingStatusDoc,
  ComplaintDoc,
  ComplaintTypeDoc,
  CustomerDoc,
  LeadDoc,
  LeadSourceDoc,
  PaymentDoc,
  PaymentModeDoc,
  PaymentStatusDoc,
  ServiceDoc,
  TimeSlotDoc,
  VehicleDoc,
  VehicleTypeDoc,
  WorkerDoc,
} from './types'

function makeConverter<T extends object>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data: T) {
      return data
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return snapshot.data() as T
    },
  }
}

export const bookingServiceConverter = makeConverter<BookingServiceDoc>()
export const areaConverter = makeConverter<AreaDoc>()
export const serviceConverter = makeConverter<ServiceDoc>()
export const vehicleTypeConverter = makeConverter<VehicleTypeDoc>()
export const timeSlotConverter = makeConverter<TimeSlotDoc>()
export const bookingStatusConverter = makeConverter<BookingStatusDoc>()
export const paymentStatusConverter = makeConverter<PaymentStatusDoc>()
export const paymentModeConverter = makeConverter<PaymentModeDoc>()
export const leadSourceConverter = makeConverter<LeadSourceDoc>()
export const complaintTypeConverter = makeConverter<ComplaintTypeDoc>()
export const customerConverter = makeConverter<CustomerDoc>()
export const vehicleConverter = makeConverter<VehicleDoc>()
export const workerConverter = makeConverter<WorkerDoc>()
export const bookingConverter = makeConverter<BookingDoc>()
export const paymentConverter = makeConverter<PaymentDoc>()
export const complaintConverter = makeConverter<ComplaintDoc>()
export const leadConverter = makeConverter<LeadDoc>()
