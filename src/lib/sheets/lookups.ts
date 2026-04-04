import type {
  LookupContext,
  Area,
  Service,
  VehicleType,
  TimeSlot,
  BookingStatus,
  PaymentStatus,
  PaymentMode,
  LeadSource,
  ComplaintType,
} from "../domain";
import { batchReadRanges } from "./utils";
import { parseNumber } from "./utils";
import { LOOKUP_RANGES } from "./config";

// LOOKUP_RANGES order:
// [0] Areas, [1] Services, [2] VehicleTypes, [3] TimeSlots,
// [4] BookingStatuses, [5] PaymentStatuses, [6] PaymentModes,
// [7] LeadSources, [8] ComplaintTypes

export async function getLookupContext(): Promise<LookupContext> {
  const results = await batchReadRanges([...LOOKUP_RANGES]);

  const areas = new Map<string, Area>(
    results[0]
      .filter((r) => r.area_id)
      .map((r) => [r.area_id, { area_id: r.area_id, name: r.name ?? "" }]),
  );

  const services = new Map<string, Service>(
    results[1]
      .filter((r) => r.service_id)
      .map((r) => [
        r.service_id,
        {
          service_id: r.service_id,
          name: r.name ?? "",
          base_price: parseNumber(r.base_price),
          category: r.category ?? "",
        },
      ]),
  );

  const vehicleTypes = new Map<string, VehicleType>(
    results[2]
      .filter((r) => r.vehicle_type_id)
      .map((r) => [
        r.vehicle_type_id,
        { vehicle_type_id: r.vehicle_type_id, name: r.name ?? "" },
      ]),
  );

  const timeSlots = new Map<string, TimeSlot>(
    results[3]
      .filter((r) => r.time_slot_id)
      .map((r) => [
        r.time_slot_id,
        {
          time_slot_id: r.time_slot_id,
          label: r.label ?? "",
          start_time: r.start_time ?? "",
          end_time: r.end_time ?? "",
        },
      ]),
  );

  const bookingStatuses = new Map<string, BookingStatus>(
    results[4]
      .filter((r) => r.booking_status_id)
      .map((r) => [
        r.booking_status_id,
        {
          booking_status_id: r.booking_status_id,
          label: r.label ?? "",
          color: r.color ?? "",
        },
      ]),
  );

  const paymentStatuses = new Map<string, PaymentStatus>(
    results[5]
      .filter((r) => r.payment_status_id)
      .map((r) => [
        r.payment_status_id,
        {
          payment_status_id: r.payment_status_id,
          label: r.label ?? "",
          color: r.color ?? "",
        },
      ]),
  );

  const paymentModes = new Map<string, PaymentMode>(
    results[6]
      .filter((r) => r.payment_mode_id)
      .map((r) => [
        r.payment_mode_id,
        { payment_mode_id: r.payment_mode_id, label: r.label ?? "" },
      ]),
  );

  const leadSources = new Map<string, LeadSource>(
    results[7]
      .filter((r) => r.source_id)
      .map((r) => [
        r.source_id,
        { source_id: r.source_id, label: r.label ?? "" },
      ]),
  );

  const complaintTypes = new Map<string, ComplaintType>(
    results[8]
      .filter((r) => r.complaint_type_id)
      .map((r) => [
        r.complaint_type_id,
        { complaint_type_id: r.complaint_type_id, label: r.label ?? "" },
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
