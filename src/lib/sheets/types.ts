import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const BookingStatus = z.enum([
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);

export const PaymentStatus = z.enum(["pending", "paid", "partial", "refunded"]);

export const ServicePackage = z.enum(["basic", "standard", "premium", "custom"]);

export const VehicleType = z.enum([
  "sedan",
  "suv",
  "hatchback",
  "van",
  "truck",
  "bike",
]);

export const PaymentMode = z.enum([
  "cash",
  "upi",
  "card",
  "bank_transfer",
  "online",
]);

export const ComplaintFlag = z.enum([
  "open",
  "resolved",
  "escalated",
  "ignored",
]);

export const RepeatCustomer = z.enum(["yes", "no"]);

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const BookingSchema = z.object({
  id: z.string(),
  date: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  vehicleType: VehicleType,
  servicePackage: ServicePackage,
  status: BookingStatus,
  assignedWorker: z.string().optional(),
  timeSlot: z.string().optional(),
  amount: z.number(),
  paymentStatus: PaymentStatus,
  notes: z.string().optional(),
});

export const CreateBookingSchema = BookingSchema.omit({ id: true }).partial({
  assignedWorker: true,
  timeSlot: true,
  notes: true,
});

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  address: z.string().optional(),
  repeatCustomer: RepeatCustomer,
  totalBookings: z.number(),
  totalSpend: z.number(),
});

export const WorkerDailyOpsSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  bookingsAssigned: z.number(),
  bookingsCompleted: z.number(),
  hoursWorked: z.number(),
  notes: z.string().optional(),
});

export const PaymentSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  customerId: z.string(),
  amount: z.number(),
  mode: PaymentMode,
  status: PaymentStatus,
  date: z.string(),
  reference: z.string().optional(),
});

export const LeadSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  source: z.string(),
  status: z.string(),
  createdAt: z.string(),
  notes: z.string().optional(),
});

export const ComplaintSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  customerId: z.string(),
  description: z.string(),
  flag: ComplaintFlag,
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
});

export const DashboardMetricSchema = z.object({
  key: z.string(),
  value: z.string(),
  label: z.string(),
  updatedAt: z.string(),
});

// ─── Mutation Schemas ─────────────────────────────────────────────────────────

export const UpdateBookingSchema = z.object({
  status: BookingStatus.optional(),
  assignedWorker: z.string().optional(),
  paymentStatus: PaymentStatus.optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
  message: "At least one field must be provided",
});

export const UpdatePaymentSchema = z.object({
  status: PaymentStatus,
  reference: z.string().optional(),
});

export const UpdateLeadSchema = z.object({
  status: z.string().min(1),
  notes: z.string().optional(),
});

export const UpdateComplaintSchema = z.object({
  flag: ComplaintFlag,
  resolvedAt: z.string().optional(),
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
