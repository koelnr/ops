import { z } from "zod";

// ─── Customer ─────────────────────────────────────────────────────────────────

export const CreateCustomerSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  secondary_phone: z.string().optional().default(""),
  area_id: z.string().optional().default(""),
  full_address: z.string().optional().default(""),
  google_maps_link: z.string().optional().default(""),
  landmark: z.string().optional().default(""),
  acquisition_source_id: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export const UpdateCustomerSchema = z
  .object({
    full_name: z.string().optional(),
    phone: z.string().optional(),
    secondary_phone: z.string().optional(),
    area_id: z.string().optional(),
    full_address: z.string().optional(),
    google_maps_link: z.string().optional(),
    landmark: z.string().optional(),
    acquisition_source_id: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

// ─── Vehicle ──────────────────────────────────────────────────────────────────

export const CreateVehicleSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  registration_number: z.string().optional().default(""),
  car_model: z.string().min(1, "Car model is required"),
  brand: z.string().optional().default(""),
  vehicle_type_id: z.string().min(1, "Vehicle type is required"),
  color: z.string().optional().default(""),
  parking_notes: z.string().optional().default(""),
  is_primary_vehicle: z.boolean().optional().default(false),
});

export const UpdateVehicleSchema = z
  .object({
    registration_number: z.string().optional(),
    car_model: z.string().optional(),
    brand: z.string().optional(),
    vehicle_type_id: z.string().optional(),
    color: z.string().optional(),
    parking_notes: z.string().optional(),
    is_primary_vehicle: z.boolean().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

// ─── Worker ───────────────────────────────────────────────────────────────────

export const CreateWorkerSchema = z.object({
  worker_name: z.string().min(1, "Name is required"),
  phone: z.string().optional().default(""),
  primary_area_id: z.string().optional().default(""),
  joining_date: z.string().optional().default(""),
  status: z.string().optional().default("Active"),
  default_payout_type: z.string().optional().default(""),
  default_payout_rate: z.coerce.number().min(0).optional().default(0),
  notes: z.string().optional().default(""),
});

export const UpdateWorkerSchema = z
  .object({
    worker_name: z.string().optional(),
    phone: z.string().optional(),
    primary_area_id: z.string().optional(),
    joining_date: z.string().optional(),
    status: z.string().optional(),
    default_payout_type: z.string().optional(),
    default_payout_rate: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

// ─── Booking ──────────────────────────────────────────────────────────────────

export const CreateBookingSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  vehicle_id: z.string().min(1, "Vehicle is required"),
  service_date: z.string().min(1, "Service date is required"),
  time_slot_id: z.string().min(1, "Time slot is required"),
  booking_status_id: z.string().min(1, "Status is required"),
  source_id: z.string().optional().default(""),
  scheduled_start_at: z.string().optional().default(""),
  assigned_worker_id: z.string().optional().default(""),
  area_id: z.string().optional().default(""),
  base_price: z.coerce.number().min(0),
  discount_amount: z.coerce.number().min(0).optional().default(0),
  addon_total: z.coerce.number().min(0).optional().default(0),
  final_price: z.coerce.number().min(0),
  notes: z.string().optional().default(""),
});

export const UpdateBookingSchema = z
  .object({
    customer_id: z.string().optional(),
    vehicle_id: z.string().optional(),
    service_date: z.string().optional(),
    time_slot_id: z.string().optional(),
    booking_status_id: z.string().optional(),
    source_id: z.string().optional(),
    scheduled_start_at: z.string().optional(),
    actual_start_at: z.string().optional(),
    actual_end_at: z.string().optional(),
    assigned_worker_id: z.string().optional(),
    area_id: z.string().optional(),
    base_price: z.coerce.number().min(0).optional(),
    discount_amount: z.coerce.number().min(0).optional(),
    addon_total: z.coerce.number().min(0).optional(),
    final_price: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

// ─── Booking Service ──────────────────────────────────────────────────────────

export const CreateBookingServiceSchema = z.object({
  booking_id: z.string().min(1, "Booking is required"),
  service_id: z.string().min(1, "Service is required"),
  quantity: z.coerce.number().int().min(1).optional().default(1),
  unit_price: z.coerce.number().min(0),
  line_total: z.coerce.number().min(0),
});

// ─── Payment ──────────────────────────────────────────────────────────────────

export const CreatePaymentSchema = z.object({
  booking_id: z.string().min(1, "Booking is required"),
  payment_date: z.string().optional().default(""),
  amount_received: z.coerce.number().min(0),
  payment_mode_id: z.string().min(1, "Payment mode is required"),
  payment_status_id: z.string().min(1, "Payment status is required"),
  upi_transaction_ref: z.string().optional().default(""),
  collected_by_worker_id: z.string().optional().default(""),
  follow_up_required: z.boolean().optional().default(false),
  notes: z.string().optional().default(""),
});

export const UpdatePaymentSchema = z
  .object({
    payment_date: z.string().optional(),
    amount_received: z.coerce.number().min(0).optional(),
    payment_mode_id: z.string().optional(),
    payment_status_id: z.string().optional(),
    upi_transaction_ref: z.string().optional(),
    collected_by_worker_id: z.string().optional(),
    follow_up_required: z.boolean().optional(),
    notes: z.string().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

// ─── Complaint ────────────────────────────────────────────────────────────────

export const CreateComplaintSchema = z.object({
  booking_id: z.string().min(1, "Booking is required"),
  complaint_date: z.string().min(1, "Date is required"),
  complaint_type_id: z.string().min(1, "Type is required"),
  details: z.string().min(1, "Details are required"),
  assigned_worker_id: z.string().optional().default(""),
  resolution_type: z.string().optional().default(""),
  resolution_notes: z.string().optional().default(""),
  resolution_status: z.string().optional().default("Open"),
  follow_up_complete: z.boolean().optional().default(false),
  root_cause: z.string().optional().default(""),
});

export const UpdateComplaintSchema = z
  .object({
    complaint_date: z.string().optional(),
    complaint_type_id: z.string().optional(),
    details: z.string().optional(),
    assigned_worker_id: z.string().optional(),
    resolution_type: z.string().optional(),
    resolution_notes: z.string().optional(),
    resolution_status: z.string().optional(),
    follow_up_complete: z.boolean().optional(),
    root_cause: z.string().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

// ─── Lead ─────────────────────────────────────────────────────────────────────

export const CreateLeadSchema = z.object({
  lead_date: z.string().min(1, "Date is required"),
  prospect_name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  area_id: z.string().optional().default(""),
  interested_service_id: z.string().optional().default(""),
  source_id: z.string().optional().default(""),
  follow_up_status: z.string().optional().default("New"),
  conversion_status: z.string().optional().default("Not Converted"),
  converted_customer_id: z.string().optional().default(""),
  converted_booking_id: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export const UpdateLeadSchema = z
  .object({
    lead_date: z.string().optional(),
    prospect_name: z.string().optional(),
    phone: z.string().optional(),
    area_id: z.string().optional(),
    interested_service_id: z.string().optional(),
    source_id: z.string().optional(),
    follow_up_status: z.string().optional(),
    conversion_status: z.string().optional(),
    converted_customer_id: z.string().optional(),
    converted_booking_id: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

// ─── Inferred input types ─────────────────────────────────────────────────────

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema>;
export type CreateWorkerInput = z.infer<typeof CreateWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof UpdateWorkerSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>;
export type CreateBookingServiceInput = z.infer<
  typeof CreateBookingServiceSchema
>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof UpdatePaymentSchema>;
export type CreateComplaintInput = z.infer<typeof CreateComplaintSchema>;
export type UpdateComplaintInput = z.infer<typeof UpdateComplaintSchema>;
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
