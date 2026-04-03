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

export const FollowUpStatus = z.enum([
  "New",
  "Contacted",
  "Follow-Up Pending",
  "Converted",
  "Closed",
]);

export const ConversionStatus = z.enum(["Not Converted", "Converted", "Lost"]);

export const ResolutionStatus = z.enum([
  "Open",
  "Monitoring",
  "Resolved",
  "Escalated",
  "Rewash Scheduled",
  "Closed",
]);

export const RefundOrRewash = z.enum(["None", "Refund", "Partial Refund", "Rewash"]);

export const ComplaintType = z.enum([
  "Service Quality",
  "Late Arrival",
  "Damage",
  "Attitude",
  "Incomplete Work",
  "Other",
]);

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
  vehicleType: VehicleType.or(z.string()),
  servicePackage: ServicePackage.or(z.string()),
  addOns: z.string(),
  price: z.number(),
  paymentStatus: PaymentStatus.or(z.string()),
  paymentMode: PaymentMode.or(z.string()),
  assignedWorker: z.string(),
  bookingSource: BookingSource.or(z.string()),
  bookingStatus: BookingStatus.or(z.string()),
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
  paymentStatus: PaymentStatus.or(z.string()),
  paymentMode: PaymentMode.or(z.string()),
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
    bookingDate: z.string().optional(),
    serviceDate: z.string().optional(),
    timeSlot: z.string().optional(),
    customerName: z.string().optional(),
    phoneNumber: z.string().optional(),
    areaSociety: z.string().optional(),
    fullAddress: z.string().optional(),
    carModel: z.string().optional(),
    vehicleType: VehicleType.optional(),
    servicePackage: ServicePackage.optional(),
    addOns: z.string().optional(),
    price: z.coerce.number().optional(),
    paymentMode: PaymentMode.optional(),
    bookingSource: BookingSource.optional(),
    serviceStartTime: z.string().optional(),
    serviceEndTime: z.string().optional(),
    customerRating: z.coerce.number().optional(),
    complaintFlag: ComplaintFlag.optional(),
    repeatCustomer: RepeatCustomer.optional(),
    notes: z.string().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export const UpdatePaymentSchema = z
  .object({
    paymentStatus: PaymentStatus.optional(),
    upiTransactionRef: z.string().optional(),
    bookingId: z.string().optional(),
    customerName: z.string().optional(),
    serviceDate: z.string().optional(),
    amountDue: z.coerce.number().optional(),
    amountReceived: z.coerce.number().optional(),
    paymentMode: PaymentMode.optional(),
    paymentDate: z.string().optional(),
    followUpRequired: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export const UpdateLeadSchema = z
  .object({
    followUpStatus: FollowUpStatus.or(z.string()).optional(),
    conversionStatus: ConversionStatus.or(z.string()).optional(),
    notes: z.string().optional(),
    leadDate: z.string().optional(),
    leadSource: z.string().optional(),
    prospectName: z.string().optional(),
    phoneNumber: z.string().optional(),
    areaSociety: z.string().optional(),
    interestedService: z.string().optional(),
    firstBookingDate: z.string().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export const UpdateComplaintSchema = z
  .object({
    resolutionStatus: ResolutionStatus.or(z.string()).optional(),
    resolutionGiven: z.string().optional(),
    refundOrRewash: RefundOrRewash.or(z.string()).optional(),
    followUpComplete: z.string().optional(),
    rootCause: z.string().optional(),
    bookingId: z.string().optional(),
    customerName: z.string().optional(),
    date: z.string().optional(),
    workerAssigned: z.string().optional(),
    complaintType: ComplaintType.or(z.string()).optional(),
    complaintDetails: z.string().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export const CreatePaymentSchema = z
  .object({
    bookingId: z.string(),
    customerName: z.string(),
    serviceDate: z.string(),
    amountDue: z.coerce.number(),
    amountReceived: z.coerce.number(),
    paymentStatus: PaymentStatus,
    paymentMode: PaymentMode,
    upiTransactionRef: z.string().optional(),
    paymentDate: z.string().optional(),
    followUpRequired: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((d) => d.amountReceived <= d.amountDue, {
    message: "Amount received cannot exceed amount due",
    path: ["amountReceived"],
  });

export const CreateLeadSchema = z.object({
  leadDate: z.string(),
  leadSource: z.string(),
  prospectName: z.string(),
  phoneNumber: z.string(),
  areaSociety: z.string().optional(),
  interestedService: z.string().optional(),
  followUpStatus: FollowUpStatus.or(z.string()),
  conversionStatus: ConversionStatus.or(z.string()),
  firstBookingDate: z.string().optional(),
  notes: z.string().optional(),
});

export const CreateComplaintSchema = z.object({
  bookingId: z.string(),
  customerName: z.string(),
  date: z.string(),
  workerAssigned: z.string().optional(),
  complaintType: ComplaintType.or(z.string()),
  complaintDetails: z.string(),
  resolutionStatus: ResolutionStatus.or(z.string()),
  resolutionGiven: z.string().optional(),
  refundOrRewash: RefundOrRewash.or(z.string()).optional(),
  followUpComplete: z.string().optional(),
  rootCause: z.string().optional(),
});

export const UpdateWorkerSchema = z
  .object({
    payoutDue: z.coerce.number().optional(),
    payoutPaid: z.coerce.number().optional(),
    notes: z.string().optional(),
    areaCovered: z.string().optional(),
    avgRating: z.coerce.number().min(0).max(5).optional(),
    lateArrivalCount: z.coerce.number().optional(),
    rewashCount: z.coerce.number().optional(),
    complaintCount: z.coerce.number().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  })
  .refine(
    (d) =>
      d.payoutPaid === undefined ||
      d.payoutDue === undefined ||
      d.payoutPaid <= d.payoutDue,
    { message: "Payout paid cannot exceed payout due", path: ["payoutPaid"] },
  );

export const UpdateCustomerSchema = z
  .object({
    notes: z.string().optional(),
    subscriptionStatus: z.string().optional(),
    preferredTimeSlot: z.string().optional(),
    preferredServices: z.string().optional(),
    referralSource: z.string().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export const CreateWorkerSchema = z.object({
  workerName: z.string().min(1, "Worker name is required"),
  date: z.string().min(1, "Date is required"),
  assignedBookings: z.coerce.number().int().min(0).optional(),
  completedBookings: z.coerce.number().int().min(0).optional(),
  firstJobTime: z.string().optional(),
  lastJobTime: z.string().optional(),
  areaCovered: z.string().optional(),
  lateArrivalCount: z.coerce.number().int().min(0).optional(),
  complaintCount: z.coerce.number().int().min(0).optional(),
  rewashCount: z.coerce.number().int().min(0).optional(),
  avgRating: z.coerce.number().min(0).max(5).optional(),
  payoutDue: z.coerce.number().min(0).optional(),
  payoutPaid: z.coerce.number().min(0).optional(),
  onTimePercentage: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
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
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type CreateComplaintInput = z.infer<typeof CreateComplaintSchema>;
export type UpdateWorkerInput = z.infer<typeof UpdateWorkerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type CreateWorkerInput = z.infer<typeof CreateWorkerSchema>;
