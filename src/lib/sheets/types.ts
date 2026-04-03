import { z } from "zod";

// ─── Enums (exact values from Lists sheet) ────────────────────────────────────

export const BookingStatus = z.enum([
  "New Inquiry",
  "Confirmed",
  "Assigned",
  "In Progress",
  "Completed",
  "Cancelled",
  "Rescheduled",
  "Payment Pending",
]);

export const PaymentStatus = z.enum([
  "Paid",
  "Partially Paid",
  "Pending",
  "Failed",
  "Refunded",
]);

export const CompletionStatus = z.enum([
  "Completed Successfully",
  "Completed with Issue",
  "Rewash Needed",
  "Not Completed",
]);

export const VehicleType = z.enum(["Hatchback", "Sedan", "SUV", "Luxury"]);

export const ServicePackage = z.enum([
  "Exterior Wash",
  "Exterior + Interior Basic",
  "Monthly Plan",
]);

export const PaymentMode = z.enum(["UPI", "Cash"]);

export const BookingSource = z.enum([
  "WhatsApp",
  "Referral",
  "Society Outreach",
  "Flyer",
  "Office Contact",
  "Instagram",
]);

export const ComplaintFlag = z.enum(["Yes", "No"]);

export const RepeatCustomer = z.enum(["Yes", "No"]);

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const BookingSchema = z.object({
  bookingId: z.string(),
  bookingDate: z.string(),
  serviceDate: z.string(),
  timeSlot: z.string(),
  customerName: z.string(),
  phoneNumber: z.string(),
  areaSociety: z.string(),
  fullAddress: z.string(),
  carModel: z.string(),
  vehicleType: VehicleType,
  servicePackage: ServicePackage,
  addOns: z.string(),
  price: z.number(),
  paymentStatus: PaymentStatus,
  paymentMode: PaymentMode,
  assignedWorker: z.string(),
  bookingSource: BookingSource,
  bookingStatus: BookingStatus,
  serviceStartTime: z.string(),
  serviceEndTime: z.string(),
  completionStatus: CompletionStatus.or(z.literal("")),
  customerRating: z.number().optional(),
  complaintFlag: ComplaintFlag.or(z.literal("")),
  repeatCustomer: RepeatCustomer.or(z.literal("")),
  notes: z.string(),
  durationMins: z.number().optional(),
});

export const CreateBookingSchema = z.object({
  bookingDate: z.string(),
  serviceDate: z.string(),
  timeSlot: z.string(),
  customerName: z.string(),
  phoneNumber: z.string(),
  areaSociety: z.string(),
  fullAddress: z.string(),
  carModel: z.string(),
  vehicleType: VehicleType,
  servicePackage: ServicePackage,
  addOns: z.string().optional(),
  price: z.number(),
  paymentStatus: PaymentStatus,
  paymentMode: PaymentMode,
  assignedWorker: z.string().optional(),
  bookingSource: BookingSource,
  bookingStatus: BookingStatus,
  notes: z.string().optional(),
});

export const CustomerSchema = z.object({
  customerId: z.string(),
  customerName: z.string(),
  phoneNumber: z.string(),
  primaryArea: z.string(),
  firstBookingDate: z.string(),
  totalBookings: z.number(),
  lastBookingDate: z.string(),
  preferredTimeSlot: z.string(),
  preferredServices: z.string(),
  totalRevenue: z.number(),
  subscriptionStatus: z.string(),
  referralSource: z.string(),
  referredOthers: z.string(),
  complaintHistory: z.string(),
  notes: z.string(),
});

export const WorkerDailyOpsSchema = z.object({
  workerId: z.string(),
  workerName: z.string(),
  date: z.string(),
  assignedBookings: z.number(),
  completedBookings: z.number(),
  firstJobTime: z.string(),
  lastJobTime: z.string(),
  areaCovered: z.string(),
  lateArrivalCount: z.number(),
  complaintCount: z.number(),
  rewashCount: z.number(),
  avgRating: z.number(),
  payoutDue: z.number(),
  payoutPaid: z.number(),
  onTimePercentage: z.number(),
  notes: z.string(),
});

export const PaymentSchema = z.object({
  paymentId: z.string(),
  bookingId: z.string(),
  customerName: z.string(),
  serviceDate: z.string(),
  amountDue: z.number(),
  amountReceived: z.number(),
  paymentStatus: PaymentStatus,
  paymentMode: PaymentMode,
  upiTransactionRef: z.string(),
  paymentDate: z.string(),
  followUpRequired: z.string(),
  notes: z.string(),
});

export const LeadSchema = z.object({
  leadId: z.string(),
  leadDate: z.string(),
  leadSource: z.string(),
  prospectName: z.string(),
  phoneNumber: z.string(),
  areaSociety: z.string(),
  interestedService: z.string(),
  followUpStatus: z.string(),
  conversionStatus: z.string(),
  firstBookingDate: z.string(),
  notes: z.string(),
});

export const ComplaintSchema = z.object({
  complaintId: z.string(),
  bookingId: z.string(),
  customerName: z.string(),
  date: z.string(),
  workerAssigned: z.string(),
  complaintType: z.string(),
  complaintDetails: z.string(),
  resolutionGiven: z.string(),
  refundOrRewash: z.string(),
  resolutionStatus: z.string(),
  followUpComplete: z.string(),
  rootCause: z.string(),
});

export const DashboardMetricSchema = z.object({
  metric: z.string(),
  today: z.string(),
  thisWeek: z.string(),
  thisMonth: z.string(),
});

// ─── Mutation Schemas ─────────────────────────────────────────────────────────

export const UpdateBookingSchema = z
  .object({
    bookingStatus: BookingStatus.optional(),
    assignedWorker: z.string().optional(),
    paymentStatus: PaymentStatus.optional(),
    completionStatus: CompletionStatus.optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export const UpdatePaymentSchema = z.object({
  paymentStatus: PaymentStatus,
  upiTransactionRef: z.string().optional(),
});

export const UpdateLeadSchema = z
  .object({
    followUpStatus: z.string().optional(),
    conversionStatus: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export const UpdateComplaintSchema = z.object({
  resolutionStatus: z.string(),
  resolutionGiven: z.string().optional(),
  refundOrRewash: z.string().optional(),
  followUpComplete: z.string().optional(),
  rootCause: z.string().optional(),
});

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type Booking = z.infer<typeof BookingSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type WorkerDailyOps = z.infer<typeof WorkerDailyOpsSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type Lead = z.infer<typeof LeadSchema>;
export type Complaint = z.infer<typeof ComplaintSchema>;
export type DashboardMetric = z.infer<typeof DashboardMetricSchema>;
export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>;
export type UpdatePaymentInput = z.infer<typeof UpdatePaymentSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
export type UpdateComplaintInput = z.infer<typeof UpdateComplaintSchema>;
