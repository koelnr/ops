import { Timestamp } from "firebase-admin/firestore";

// ─── Lookup Collection Documents ──────────────────────────────────────────────

export interface AreaDoc {
  name: string;
  city: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ServicePricing {
  sedan: number;
  suv: number;
}

export interface ServiceDoc {
  name: string;
  category: "one_time" | "monthly_plan";
  pricing: ServicePricing;
  isSubscription: boolean;
  washesIncluded?: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface VehicleTypeDoc {
  name: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TimeSlotDoc {
  label: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BookingStatusDoc {
  name: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PaymentStatusDoc {
  name: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PaymentModeDoc {
  name: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LeadSourceDoc {
  name: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ComplaintTypeDoc {
  name: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Embedded Helper Types ────────────────────────────────────────────────────

export interface BookingItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BookingPricing {
  basePrice: number;
  discountAmount: number;
  addonTotal: number;
  finalPrice: number;
}

export interface BookingTimes {
  scheduledStartAt: Timestamp | null;
  actualStartAt: Timestamp | null;
  actualEndAt: Timestamp | null;
}

export interface BookingPaymentSummary {
  amountPaid: number;
  amountDue: number;
  paymentStatusId: string;
  paymentStatusName: string;
  followUpRequired: boolean;
}

export interface BookingComplaintSummary {
  count: number;
  hasOpenComplaint: boolean;
}

export interface WorkerPayout {
  type: "per_job" | "daily" | "monthly";
  rate: number;
}

// ─── Transactional Collection Documents ──────────────────────────────────────

export interface CustomerDoc {
  fullName: string;
  phone: string;
  secondaryPhone: string | null;
  areaId: string;
  areaName: string;
  fullAddress: string;
  googleMapsLink: string;
  landmark: string;
  acquisitionSourceId: string;
  acquisitionSourceName: string;
  notes: string;
  status: "active" | "inactive";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface VehicleDoc {
  customerId: string;
  registrationNumber: string;
  carModel: string;
  brand: string;
  vehicleTypeId: string;
  vehicleTypeName: string;
  color: string;
  parkingNotes: string;
  isPrimaryVehicle: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkerDoc {
  workerName: string;
  phone: string;
  primaryAreaId: string;
  primaryAreaName: string;
  joiningDate: Timestamp | null;
  status: "active" | "inactive";
  payout: WorkerPayout;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BookingDoc {
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  vehicleLabel: string;
  serviceDate: string;
  timeSlotId: string;
  timeSlotLabel: string;
  bookingStatusId: string;
  bookingStatusName: string;
  sourceId: string;
  sourceName: string;
  assignedWorkerId: string;
  assignedWorkerName: string;
  areaId: string;
  areaName: string;
  pricing: BookingPricing;
  items: BookingItem[];
  times: BookingTimes;
  payment: BookingPaymentSummary;
  complaint: BookingComplaintSummary;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PaymentDoc {
  bookingId: string;
  customerId: string;
  customerName: string;
  serviceDate: string;
  finalPrice: number;
  amountReceived: number;
  paymentDate: Timestamp | null;
  paymentModeId: string;
  paymentModeName: string;
  paymentStatusId: string;
  paymentStatusName: string;
  collectedByWorkerId: string | null;
  collectedByWorkerName: string | null;
  followUpRequired: boolean;
  upiTransactionRef: string | null;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BookingServiceDoc {
  bookingId: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ComplaintDoc {
  bookingId: string;
  customerId: string;
  customerName: string;
  workerId: string | null;
  workerName: string | null;
  complaintDate: Timestamp | null;
  complaintTypeId: string;
  complaintTypeName: string;
  details: string;
  resolutionType: string;
  resolutionNotes: string;
  resolutionStatus: "open" | "in_progress" | "resolved";
  followUpComplete: boolean;
  rootCause: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LeadDoc {
  leadDate: Timestamp | null;
  prospectName: string;
  phone: string;
  areaId: string;
  areaName: string;
  interestedServiceId: string;
  interestedServiceName: string;
  sourceId: string;
  sourceName: string;
  followUpStatus: "new" | "contacted" | "follow_up_needed" | "closed";
  conversionStatus: "unconverted" | "converted" | "lost";
  convertedCustomerId: string | null;
  convertedBookingId: string | null;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
