/**
 * Firestore → Domain type adapters.
 * Used by pages and GET API routes to return domain-typed data.
 */

// ─── Admin lookup types ───────────────────────────────────────────────────────

export type LookupEntryAdmin = {
  id: string
  isActive: boolean
  [key: string]: unknown
}

export type LookupsAdminData = {
  areas: LookupEntryAdmin[]
  services: LookupEntryAdmin[]
  vehicleTypes: LookupEntryAdmin[]
  timeSlots: LookupEntryAdmin[]
  bookingStatuses: LookupEntryAdmin[]
  paymentStatuses: LookupEntryAdmin[]
  paymentModes: LookupEntryAdmin[]
  leadSources: LookupEntryAdmin[]
  complaintTypes: LookupEntryAdmin[]
}

import type {
  Area,
  Booking,
  BookingService,
  BookingStatus,
  Complaint,
  ComplaintType,
  Customer,
  Lead,
  LeadSource,
  LookupContext,
  Payment,
  PaymentMode,
  PaymentStatus,
  ResolvedBooking,
  ResolvedComplaint,
  ResolvedCustomer,
  ResolvedPayment,
  Service,
  TimeSlot,
  Vehicle,
  VehicleType,
  Worker,
} from "../domain";
import { getAllBookingServices } from "./modules/booking-services";
import { getAllBookings } from "./modules/bookings";
import { getAllComplaints } from "./modules/complaints";
import { getAllCustomers } from "./modules/customers";
import { getAllLeads } from "./modules/leads";
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
} from "./collections";
import { docsToArrayWithId } from "./utils";
import { getAllPayments } from "./modules/payments";
import { getAllVehicles } from "./modules/vehicles";
import { db } from "../firebase/firestore";
import { getAllWorkers } from "./modules/workers";
import type {
  BookingDoc,
  BookingServiceDoc,
  ComplaintDoc,
  CustomerDoc,
  LeadDoc,
  PaymentDoc,
  VehicleDoc,
  WorkerDoc,
} from "./types";

// ─── Doc → Domain mappers ─────────────────────────────────────────────────────

function mapCustomer(doc: CustomerDoc & { id: string }): Customer {
  return {
    customer_id: doc.id,
    full_name: doc.fullName,
    phone: doc.phone,
    secondary_phone: doc.secondaryPhone ?? "",
    area_id: doc.areaId,
    full_address: doc.fullAddress,
    google_maps_link: doc.googleMapsLink ?? "",
    landmark: doc.landmark ?? "",
    created_at: doc.createdAt.toDate().toISOString(),
    acquisition_source_id: doc.acquisitionSourceId,
    notes: doc.notes,
  };
}

function mapVehicle(doc: VehicleDoc & { id: string }): Vehicle {
  return {
    vehicle_id: doc.id,
    customer_id: doc.customerId,
    registration_number: doc.registrationNumber,
    car_model: doc.carModel,
    brand: doc.brand,
    vehicle_type_id: doc.vehicleTypeId,
    color: doc.color,
    parking_notes: doc.parkingNotes,
    is_primary_vehicle: doc.isPrimaryVehicle,
    created_at: doc.createdAt.toDate().toISOString(),
  };
}

function mapWorker(doc: WorkerDoc & { id: string }): Worker {
  return {
    worker_id: doc.id,
    worker_name: doc.workerName,
    phone: doc.phone,
    primary_area_id: doc.primaryAreaId,
    joining_date: doc.joiningDate
      ? doc.joiningDate.toDate().toISOString().split("T")[0]
      : "",
    status: doc.status,
    default_payout_type: doc.payout.type,
    default_payout_rate: doc.payout.rate,
    notes: doc.notes,
  };
}

function mapBooking(doc: BookingDoc & { id: string }): Booking {
  return {
    booking_id: doc.id,
    customer_id: doc.customerId,
    vehicle_id: doc.vehicleId,
    service_date: doc.serviceDate,
    time_slot_id: doc.timeSlotId,
    booking_status_id: doc.bookingStatusId,
    source_id: doc.sourceId,
    created_at: doc.createdAt.toDate().toISOString(),
    scheduled_start_at:
      doc.times.scheduledStartAt?.toDate().toISOString() ?? "",
    actual_start_at: doc.times.actualStartAt?.toDate().toISOString() ?? "",
    actual_end_at: doc.times.actualEndAt?.toDate().toISOString() ?? "",
    assigned_worker_id: doc.assignedWorkerId,
    area_id: doc.areaId,
    base_price: doc.pricing.basePrice,
    discount_amount: doc.pricing.discountAmount,
    addon_total: doc.pricing.addonTotal,
    final_price: doc.pricing.finalPrice,
    notes: doc.notes,
  };
}

function mapPayment(doc: PaymentDoc & { id: string }): Payment {
  return {
    payment_id: doc.id,
    booking_id: doc.bookingId,
    payment_date: doc.paymentDate
      ? doc.paymentDate.toDate().toISOString().split("T")[0]
      : "",
    amount_received: doc.amountReceived,
    payment_mode_id: doc.paymentModeId,
    payment_status_id: doc.paymentStatusId,
    upi_transaction_ref: doc.upiTransactionRef ?? "",
    collected_by_worker_id: doc.collectedByWorkerId ?? "",
    follow_up_required: doc.followUpRequired,
    notes: doc.notes,
  };
}

function mapComplaint(doc: ComplaintDoc & { id: string }): Complaint {
  return {
    complaint_id: doc.id,
    booking_id: doc.bookingId,
    complaint_date: doc.complaintDate
      ? doc.complaintDate.toDate().toISOString().split("T")[0]
      : "",
    complaint_type_id: doc.complaintTypeId,
    details: doc.details,
    assigned_worker_id: doc.workerId ?? "",
    resolution_type: doc.resolutionType,
    resolution_notes: doc.resolutionNotes,
    resolution_status: doc.resolutionStatus,
    follow_up_complete: doc.followUpComplete,
    root_cause: doc.rootCause,
    created_at: doc.createdAt.toDate().toISOString(),
  };
}

function mapLead(doc: LeadDoc & { id: string }): Lead {
  return {
    lead_id: doc.id,
    lead_date: doc.leadDate
      ? doc.leadDate.toDate().toISOString().split("T")[0]
      : "",
    prospect_name: doc.prospectName,
    phone: doc.phone,
    area_id: doc.areaId,
    interested_service_id: doc.interestedServiceId,
    source_id: doc.sourceId,
    follow_up_status: doc.followUpStatus,
    conversion_status: doc.conversionStatus,
    converted_customer_id: doc.convertedCustomerId ?? "",
    converted_booking_id: doc.convertedBookingId ?? "",
    notes: doc.notes,
  };
}

function mapBookingService(
  doc: BookingServiceDoc & { id: string },
): BookingService {
  return {
    booking_service_id: doc.id,
    booking_id: doc.bookingId,
    service_id: doc.serviceId,
    quantity: doc.quantity,
    unit_price: doc.unitPrice,
    line_total: doc.lineTotal,
  };
}

// ─── Public read functions returning domain types ─────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  const docs = await getAllCustomers();
  return docs.map(mapCustomer);
}

export async function getVehicles(): Promise<Vehicle[]> {
  const docs = await getAllVehicles();
  return docs.map(mapVehicle);
}

export async function getWorkers(): Promise<Worker[]> {
  const docs = await getAllWorkers();
  return docs.map(mapWorker);
}

export async function getBookings(): Promise<Booking[]> {
  const docs = await getAllBookings();
  return docs.map(mapBooking);
}

export async function getPayments(): Promise<Payment[]> {
  const docs = await getAllPayments();
  return docs.map(mapPayment);
}

export async function getComplaints(): Promise<Complaint[]> {
  const docs = await getAllComplaints();
  return docs.map(mapComplaint);
}

export async function getLeads(): Promise<Lead[]> {
  const docs = await getAllLeads();
  return docs.map(mapLead);
}

export async function getBookingServices(): Promise<BookingService[]> {
  const docs = await getAllBookingServices();
  return docs.map(mapBookingService);
}

// ─── Resolved views ───────────────────────────────────────────────────────────

export async function getBookingsResolved(): Promise<ResolvedBooking[]> {
  const docs = await getAllBookings();
  return docs.map(
    (doc): ResolvedBooking => ({
      booking_id: doc.id,
      service_date: doc.serviceDate,
      customer_id: doc.customerId,
      customer_name: doc.customerName,
      phone: doc.customerPhone,
      vehicle_id: doc.vehicleId,
      worker_id: doc.assignedWorkerId,
      worker_name: doc.assignedWorkerName,
      area_id: doc.areaId,
      area_name: doc.areaName,
      time_slot_id: doc.timeSlotId,
      time_slot_label: doc.timeSlotLabel,
      booking_status_id: doc.bookingStatusId,
      booking_status_name: doc.bookingStatusName,
      source_id: doc.sourceId,
      source_name: doc.sourceName,
      base_price: doc.pricing.basePrice,
      discount_amount: doc.pricing.discountAmount,
      addon_total: doc.pricing.addonTotal,
      final_price: doc.pricing.finalPrice,
      amount_paid: doc.payment.amountPaid,
      amount_due: doc.payment.amountDue,
      complaint_count: doc.complaint.count,
      notes: doc.notes,
    }),
  );
}

export async function getCustomersResolved(): Promise<ResolvedCustomer[]> {
  const docs = await getAllCustomers();
  return docs.map(
    (doc): ResolvedCustomer => ({
      customer_id: doc.id,
      full_name: doc.fullName,
      phone: doc.phone,
      secondary_phone: doc.secondaryPhone ?? "",
      area_id: doc.areaId,
      area_name: doc.areaName,
      full_address: doc.fullAddress,
      google_maps_link: doc.googleMapsLink ?? "",
      landmark: doc.landmark ?? "",
      created_at: doc.createdAt.toDate().toISOString(),
      acquisition_source_id: doc.acquisitionSourceId,
      acquisition_source_label: doc.acquisitionSourceName,
      notes: doc.notes,
      total_bookings: 0,
      total_revenue: 0,
      last_visit: "",
      is_repeat: false,
    }),
  );
}

export async function getPaymentsResolved(): Promise<ResolvedPayment[]> {
  const docs = await getAllPayments();
  return docs.map(
    (doc): ResolvedPayment => ({
      payment_id: doc.id,
      booking_id: doc.bookingId,
      payment_date: doc.paymentDate
        ? doc.paymentDate.toDate().toISOString().split("T")[0]
        : "",
      amount_received: doc.amountReceived,
      payment_mode_id: doc.paymentModeId,
      payment_mode_name: doc.paymentModeName,
      payment_status_id: doc.paymentStatusId,
      payment_status_name: doc.paymentStatusName,
      payment_status_color: "",
      upi_transaction_ref: doc.upiTransactionRef ?? "",
      collected_by_worker_id: doc.collectedByWorkerId ?? "",
      worker_name: doc.collectedByWorkerName ?? "",
      follow_up_required: doc.followUpRequired,
      customer_name: doc.customerName,
      service_date: doc.serviceDate,
      final_price: doc.finalPrice,
      notes: doc.notes,
    }),
  );
}

export async function getComplaintsResolved(): Promise<ResolvedComplaint[]> {
  const docs = await getAllComplaints();
  return docs.map(
    (doc): ResolvedComplaint => ({
      complaint_id: doc.id,
      booking_id: doc.bookingId,
      complaint_date: doc.complaintDate
        ? doc.complaintDate.toDate().toISOString().split("T")[0]
        : "",
      complaint_type_id: doc.complaintTypeId,
      complaint_type_name: doc.complaintTypeName,
      details: doc.details,
      assigned_worker_id: doc.workerId ?? "",
      worker_name: doc.workerName ?? "",
      resolution_type: doc.resolutionType,
      resolution_notes: doc.resolutionNotes,
      resolution_status: doc.resolutionStatus,
      follow_up_complete: doc.followUpComplete,
      root_cause: doc.rootCause,
      created_at: doc.createdAt.toDate().toISOString(),
      customer_name: doc.customerName,
      booking_service_date: "",
    }),
  );
}

// ─── Lookup context ───────────────────────────────────────────────────────────

export async function getLookupContext(): Promise<LookupContext> {
  const [
    areaDocs,
    serviceDocs,
    vehicleTypeDocs,
    timeSlotDocs,
    bookingStatusDocs,
    paymentStatusDocs,
    paymentModeDocs,
    leadSourceDocs,
    complaintTypeDocs,
  ] = await Promise.all([
    docsToArrayWithId(await areasCol().where("isActive", "==", true).get()),
    docsToArrayWithId(await servicesCol().where("isActive", "==", true).get()),
    docsToArrayWithId(
      await vehicleTypesCol().where("isActive", "==", true).get(),
    ),
    docsToArrayWithId(await timeSlotsCol().where("isActive", "==", true).get()),
    docsToArrayWithId(
      await bookingStatusesCol()
        .where("isActive", "==", true)
        .orderBy("sortOrder")
        .get(),
    ),
    docsToArrayWithId(
      await paymentStatusesCol().where("isActive", "==", true).get(),
    ),
    docsToArrayWithId(
      await paymentModesCol().where("isActive", "==", true).get(),
    ),
    docsToArrayWithId(
      await leadSourcesCol().where("isActive", "==", true).get(),
    ),
    docsToArrayWithId(
      await complaintTypesCol().where("isActive", "==", true).get(),
    ),
  ]);

  const areas = new Map<string, Area>(
    areaDocs.map((doc) => [doc.id, { area_id: doc.id, name: doc.name }]),
  );

  const services = new Map<string, Service>(
    serviceDocs.map((doc) => [
      doc.id,
      {
        service_id: doc.id,
        name: doc.name,
        base_price: doc.pricing.sedan,
        category: doc.category,
      },
    ]),
  );

  const vehicleTypes = new Map<string, VehicleType>(
    vehicleTypeDocs.map((doc) => [
      doc.id,
      { vehicle_type_id: doc.id, name: doc.name },
    ]),
  );

  const timeSlots = new Map<string, TimeSlot>(
    timeSlotDocs.map((doc) => [
      doc.id,
      {
        time_slot_id: doc.id,
        label: doc.label,
        start_time: doc.startTime,
        end_time: doc.endTime,
      },
    ]),
  );

  const bookingStatuses = new Map<string, BookingStatus>(
    bookingStatusDocs.map((doc) => [
      doc.id,
      { booking_status_id: doc.id, label: doc.name, color: doc.color ?? "" },
    ]),
  );

  const paymentStatuses = new Map<string, PaymentStatus>(
    paymentStatusDocs.map((doc) => [
      doc.id,
      { payment_status_id: doc.id, label: doc.name, color: "" },
    ]),
  );

  const paymentModes = new Map<string, PaymentMode>(
    paymentModeDocs.map((doc) => [
      doc.id,
      { payment_mode_id: doc.id, label: doc.name },
    ]),
  );

  const leadSources = new Map<string, LeadSource>(
    leadSourceDocs.map((doc) => [
      doc.id,
      { source_id: doc.id, label: doc.name },
    ]),
  );

  const complaintTypes = new Map<string, ComplaintType>(
    complaintTypeDocs.map((doc) => [
      doc.id,
      { complaint_type_id: doc.id, label: doc.name },
    ]),
  );

  return {
    areas,
    services,
    vehicleTypes,
    timeSlots,
    bookingStatuses,
    paymentStatuses,
    paymentModes,
    leadSources,
    complaintTypes,
  };
}

// ─── Admin: all lookup entries (including inactive) ───────────────────────────

function serializeAdminDoc(snap: FirebaseFirestore.DocumentSnapshot): LookupEntryAdmin {
  const data = snap.data() ?? {}
  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (k === 'createdAt' || k === 'updatedAt') continue
    // Skip Firestore Timestamp objects — not serializable across RSC boundary
    if (v != null && typeof v === 'object' && typeof (v as { toDate?: unknown }).toDate === 'function') continue
    clean[k] = v
  }
  return { id: snap.id, isActive: (clean.isActive as boolean) ?? true, ...clean }
}

export async function getLookupsAdminData(): Promise<LookupsAdminData> {
  const [
    areaSnap,
    serviceSnap,
    vehicleTypeSnap,
    timeSlotSnap,
    bookingStatusSnap,
    paymentStatusSnap,
    paymentModeSnap,
    leadSourceSnap,
    complaintTypeSnap,
  ] = await Promise.all([
    db.collection('areas').get(),
    db.collection('services').get(),
    db.collection('vehicleTypes').get(),
    db.collection('timeSlots').get(),
    db.collection('bookingStatuses').orderBy('sortOrder').get(),
    db.collection('paymentStatuses').get(),
    db.collection('paymentModes').get(),
    db.collection('leadSources').get(),
    db.collection('complaintTypes').get(),
  ])

  return {
    areas: areaSnap.docs.map(serializeAdminDoc),
    services: serviceSnap.docs.map(serializeAdminDoc),
    vehicleTypes: vehicleTypeSnap.docs.map(serializeAdminDoc),
    timeSlots: timeSlotSnap.docs.map(serializeAdminDoc),
    bookingStatuses: bookingStatusSnap.docs.map(serializeAdminDoc),
    paymentStatuses: paymentStatusSnap.docs.map(serializeAdminDoc),
    paymentModes: paymentModeSnap.docs.map(serializeAdminDoc),
    leadSources: leadSourceSnap.docs.map(serializeAdminDoc),
    complaintTypes: complaintTypeSnap.docs.map(serializeAdminDoc),
  }
}
