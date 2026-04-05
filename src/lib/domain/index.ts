// ─── Transactional Entities ──────────────────────────────────────────────────

export interface Customer {
  customer_id: string;
  full_name: string;
  phone: string;
  secondary_phone: string;
  area_id: string;
  full_address: string;
  google_maps_link: string;
  landmark: string;
  created_at: string;
  acquisition_source_id: string;
  notes: string;
}

export interface Vehicle {
  vehicle_id: string;
  customer_id: string;
  registration_number: string;
  car_model: string;
  brand: string;
  vehicle_type_id: string;
  color: string;
  parking_notes: string;
  is_primary_vehicle: boolean;
  created_at: string;
}

export interface Worker {
  worker_id: string;
  worker_name: string;
  phone: string;
  primary_area_id: string;
  joining_date: string;
  status: string;
  default_payout_type: string;
  default_payout_rate: number;
  notes: string;
}

export interface Booking {
  booking_id: string;
  customer_id: string;
  vehicle_id: string;
  service_date: string;
  time_slot_id: string;
  booking_status_id: string;
  source_id: string;
  created_at: string;
  scheduled_start_at: string;
  actual_start_at: string;
  actual_end_at: string;
  assigned_worker_id: string;
  area_id: string;
  base_price: number;
  discount_amount: number;
  addon_total: number;
  final_price: number;
  notes: string;
}

export interface BookingService {
  booking_service_id: string;
  booking_id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Payment {
  payment_id: string;
  booking_id: string;
  payment_date: string;
  amount_received: number;
  payment_mode_id: string;
  payment_status_id: string;
  upi_transaction_ref: string;
  collected_by_worker_id: string;
  follow_up_required: boolean;
  notes: string;
}

export interface Complaint {
  complaint_id: string;
  booking_id: string;
  complaint_date: string;
  complaint_type_id: string;
  details: string;
  assigned_worker_id: string;
  resolution_type: string;
  resolution_notes: string;
  resolution_status: string;
  follow_up_complete: boolean;
  root_cause: string;
  created_at: string;
}

export interface Lead {
  lead_id: string;
  lead_date: string;
  prospect_name: string;
  phone: string;
  area_id: string;
  interested_service_id: string;
  source_id: string;
  follow_up_status: string;
  conversion_status: string;
  converted_customer_id: string;
  converted_booking_id: string;
  notes: string;
}

// ─── Lookup Tables (read-only) ────────────────────────────────────────────────

export interface Area {
  area_id: string;
  name: string;
}

export interface Service {
  service_id: string;
  name: string;
  base_price: number;
  category: string;
}

export interface VehicleType {
  vehicle_type_id: string;
  name: string;
}

export interface TimeSlot {
  time_slot_id: string;
  label: string;
  start_time: string;
  end_time: string;
}

export interface BookingStatus {
  booking_status_id: string;
  label: string;
  color: string;
}

export interface PaymentStatus {
  payment_status_id: string;
  label: string;
  color: string;
}

export interface PaymentMode {
  payment_mode_id: string;
  label: string;
}

export interface LeadSource {
  source_id: string;
  label: string;
}

export interface ComplaintType {
  complaint_type_id: string;
  label: string;
}

// ─── Lookup Context ───────────────────────────────────────────────────────────
// Loaded once per request; passed to mappers and selectors.

export interface LookupContext {
  areas: Map<string, Area>;
  services: Map<string, Service>;
  vehicleTypes: Map<string, VehicleType>;
  timeSlots: Map<string, TimeSlot>;
  bookingStatuses: Map<string, BookingStatus>;
  paymentStatuses: Map<string, PaymentStatus>;
  paymentModes: Map<string, PaymentMode>;
  leadSources: Map<string, LeadSource>;
  complaintTypes: Map<string, ComplaintType>;
}

// Serializable version for passing through Next.js RSC → Client Component boundary
export type SerializedLookupContext = {
  areas: Area[];
  services: Service[];
  vehicleTypes: VehicleType[];
  timeSlots: TimeSlot[];
  bookingStatuses: BookingStatus[];
  paymentStatuses: PaymentStatus[];
  paymentModes: PaymentMode[];
  leadSources: LeadSource[];
  complaintTypes: ComplaintType[];
};

export function serializeLookupContext(
  ctx: LookupContext,
): SerializedLookupContext {
  return {
    areas: [...ctx.areas.values()],
    services: [...ctx.services.values()],
    vehicleTypes: [...ctx.vehicleTypes.values()],
    timeSlots: [...ctx.timeSlots.values()],
    bookingStatuses: [...ctx.bookingStatuses.values()],
    paymentStatuses: [...ctx.paymentStatuses.values()],
    paymentModes: [...ctx.paymentModes.values()],
    leadSources: [...ctx.leadSources.values()],
    complaintTypes: [...ctx.complaintTypes.values()],
  };
}

export function deserializeLookupContext(
  s: SerializedLookupContext,
): LookupContext {
  return {
    areas: new Map(s.areas.map((a) => [a.area_id, a as Area])),
    services: new Map(s.services.map((sv) => [sv.service_id, sv])),
    vehicleTypes: new Map(s.vehicleTypes.map((vt) => [vt.vehicle_type_id, vt])),
    timeSlots: new Map(s.timeSlots.map((ts) => [ts.time_slot_id, ts])),
    bookingStatuses: new Map(
      s.bookingStatuses.map((bs) => [bs.booking_status_id, bs]),
    ),
    paymentStatuses: new Map(
      s.paymentStatuses.map((ps) => [ps.payment_status_id, ps]),
    ),
    paymentModes: new Map(s.paymentModes.map((pm) => [pm.payment_mode_id, pm])),
    leadSources: new Map(s.leadSources.map((ls) => [ls.source_id, ls])),
    complaintTypes: new Map(
      s.complaintTypes.map((ct) => [ct.complaint_type_id, ct]),
    ),
  };
}

// ─── View Models ──────────────────────────────────────────────────────────────
// Derived types used only in the UI layer. Never stored.

export type ResolvedBookingService = BookingService & { serviceName: string };

export interface BookingResolvedView {
  booking: Booking;
  customer: Customer | null;
  vehicle: Vehicle | null;
  worker: Worker | null;
  areaName: string;
  timeSlotLabel: string;
  bookingStatusLabel: string;
  bookingStatusColor: string;
  services: ResolvedBookingService[];
  payments: Payment[];
  amountPaid: number;
  amountDue: number;
}

export interface CustomerWithSummary extends Customer {
  totalBookings: number;
  totalRevenue: number;
  lastVisit: string | null;
  isRepeat: boolean;
  areaName: string;
  acquisitionSourceLabel: string;
}

export interface WorkerWithSummary extends Worker {
  assignedCount: number;
  completionRate: number;
  areaName: string;
}

export interface PaymentWithContext extends Payment {
  paymentStatusLabel: string;
  paymentStatusColor: string;
  paymentModeLabel: string;
  customerName: string;
  serviceDate: string;
  finalPrice: number;
}

export interface LeadWithContext extends Lead {
  areaName: string;
  interestedServiceName: string;
  sourceLabel: string;
}

export interface ComplaintWithContext extends Complaint {
  complaintTypeLabel: string;
  customerName: string;
  workerName: string;
  bookingServiceDate: string;
}

export interface TodayJobView {
  booking: Booking;
  customerName: string;
  customerPhone: string;
  areaName: string;
  timeSlotLabel: string;
  workerName: string;
  bookingStatusLabel: string;
  bookingStatusColor: string;
  finalPrice: number;
  amountPaid: number;
  amountDue: number;
  hasOpenComplaint: boolean;
}

export interface PendingPaymentView {
  booking: Booking;
  customerName: string;
  customerPhone: string;
  serviceDate: string;
  finalPrice: number;
  amountPaid: number;
  amountDue: number;
  followUpRequired: boolean;
  paymentStatusLabel: string;
}

// ─── Resolved Read Models ─────────────────────────────────────────────────────
// Fetched from pre-resolved Sheets tabs (bookings_resolved, etc.).
// Used for list/detail display only. Never written back to Sheets.

/** Row from bookings_resolved. Includes raw IDs (for edit forms) + resolved labels (for display). */
export interface ResolvedBooking {
  booking_id: string;
  service_date: string;
  customer_id: string;
  customer_name: string;
  phone: string;
  vehicle_id: string;
  worker_id: string; // = assigned_worker_id in raw Bookings sheet
  worker_name: string;
  area_id: string;
  area_name: string;
  time_slot_id: string; // raw — needed for edit form dropdown
  time_slot_label: string;
  booking_status_id: string;
  booking_status_name: string;
  source_id: string; // raw — needed for edit form dropdown
  source_name: string;
  base_price: number;
  discount_amount: number;
  addon_total: number;
  final_price: number;
  amount_paid: number;
  amount_due: number;
  complaint_count: number;
  notes: string;
}

/** Row from customers_resolved. */
export interface ResolvedCustomer {
  customer_id: string;
  full_name: string;
  phone: string;
  secondary_phone: string;
  area_id: string;
  area_name: string;
  full_address: string;
  google_maps_link: string;
  landmark: string;
  created_at: string;
  acquisition_source_id: string;
  acquisition_source_label: string;
  notes: string;
  total_bookings: number;
  total_revenue: number;
  last_visit: string;
  is_repeat: boolean;
}

/** Row from payments_resolved. */
export interface ResolvedPayment {
  payment_id: string;
  booking_id: string;
  payment_date: string;
  amount_received: number;
  payment_mode_id: string;
  payment_mode_name: string;
  payment_status_id: string;
  payment_status_name: string;
  payment_status_color: string;
  upi_transaction_ref: string;
  collected_by_worker_id: string;
  worker_name: string;
  follow_up_required: boolean;
  customer_name: string;
  service_date: string;
  final_price: number;
  notes: string;
}

/** Row from complaints_resolved. */
export interface ResolvedComplaint {
  complaint_id: string;
  booking_id: string;
  complaint_date: string;
  complaint_type_id: string;
  complaint_type_name: string;
  details: string;
  assigned_worker_id: string;
  worker_name: string;
  resolution_type: string;
  resolution_notes: string;
  resolution_status: string;
  follow_up_complete: boolean;
  root_cause: string;
  created_at: string;
  customer_name: string;
  booking_service_date: string;
}

// ─── Shared select option type ────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}
