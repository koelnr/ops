import { NextRequest, NextResponse } from "next/server";
import { requireSignedIn } from "@/lib/auth";
import { createCustomer } from "@/lib/sheets/mutations/customers";
import { createVehicle } from "@/lib/sheets/mutations/vehicles";
import { createBooking } from "@/lib/sheets/mutations/bookings";
import { updateLead } from "@/lib/sheets/mutations/leads";
import { getLookupContext } from "@/lib/sheets/lookups";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Props) {
  const authError = await requireSignedIn();
  if (authError) return authError;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { customer, vehicle, booking } = body as {
    customer?: { existing_customer_id?: string; full_name?: string; phone?: string; area_id?: string; full_address?: string };
    vehicle?: { existing_vehicle_id?: string; car_model?: string; brand?: string; vehicle_type_id?: string; registration_number?: string; color?: string };
    booking?: { service_date?: string; time_slot_id?: string; booking_status_id?: string; assigned_worker_id?: string; base_price?: number; final_price?: number; area_id?: string };
  };

  if (!customer) {
    return NextResponse.json({ error: "customer is required" }, { status: 400 });
  }

  try {
    // 1. Resolve or create customer
    let customerId: string;
    if (customer.existing_customer_id) {
      customerId = customer.existing_customer_id;
    } else {
      if (!customer.full_name || !customer.phone) {
        return NextResponse.json({ error: "full_name and phone are required for new customer" }, { status: 400 });
      }
      const created = await createCustomer({
        full_name: customer.full_name,
        phone: customer.phone,
        area_id: customer.area_id ?? "",
        full_address: customer.full_address ?? "",
        secondary_phone: "",
        google_maps_link: "",
        landmark: "",
        acquisition_source_id: "",
        notes: "",
      });
      customerId = created.customer_id;
    }

    // 2. Optionally resolve or create vehicle
    let vehicleId = "";
    if (vehicle) {
      if (vehicle.existing_vehicle_id) {
        vehicleId = vehicle.existing_vehicle_id;
      } else if (vehicle.car_model && vehicle.vehicle_type_id) {
        const created = await createVehicle({
          customer_id: customerId,
          car_model: vehicle.car_model,
          brand: vehicle.brand ?? "",
          vehicle_type_id: vehicle.vehicle_type_id,
          registration_number: vehicle.registration_number ?? "",
          color: vehicle.color ?? "",
          parking_notes: "",
          is_primary_vehicle: false,
        });
        vehicleId = created.vehicle_id;
      }
    }

    // 3. Optionally create booking
    let bookingId = "";
    if (booking && booking.service_date && booking.time_slot_id && booking.booking_status_id) {
      // Need a vehicleId to create booking — use a placeholder if not provided
      const ctx = await getLookupContext().catch(() => null);
      const effectiveVehicleId = vehicleId || "";
      if (!effectiveVehicleId) {
        // Booking requires vehicle — skip silently if none
      } else {
        const created = await createBooking({
          customer_id: customerId,
          vehicle_id: effectiveVehicleId,
          service_date: booking.service_date,
          time_slot_id: booking.time_slot_id,
          booking_status_id: booking.booking_status_id,
          assigned_worker_id: booking.assigned_worker_id ?? "",
          area_id: booking.area_id ?? "",
          base_price: booking.base_price ?? 0,
          final_price: booking.final_price ?? booking.base_price ?? 0,
          source_id: "",
          scheduled_start_at: "",
          discount_amount: 0,
          addon_total: 0,
          notes: "",
        });
        bookingId = created.booking_id;
        void ctx; // suppress unused warning
      }
    }

    // 4. Update lead with conversion info
    await updateLead(id, {
      conversion_status: "Converted",
      follow_up_status: "Converted",
      converted_customer_id: customerId,
      converted_booking_id: bookingId,
    });

    return NextResponse.json({
      ok: true,
      customer_id: customerId,
      vehicle_id: vehicleId || null,
      booking_id: bookingId || null,
    });
  } catch (err) {
    console.error("[convert lead]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Conversion failed" },
      { status: 500 },
    );
  }
}
