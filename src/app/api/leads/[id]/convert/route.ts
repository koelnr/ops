import { NextRequest, NextResponse } from "next/server";
import { requireSignedIn } from "@/lib/auth";
import { createCustomerFromInput } from "@/lib/db/modules/customers";
import { createVehicleFromInput } from "@/lib/db/modules/vehicles";
import { createBookingFromInput } from "@/lib/db/modules/bookings";
import { updateLeadFromInput } from "@/lib/db/modules/leads";

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
    customer?: {
      existing_customer_id?: string;
      full_name?: string;
      phone?: string;
      area_id?: string;
      full_address?: string;
    };
    vehicle?: {
      existing_vehicle_id?: string;
      car_model?: string;
      brand?: string;
      vehicle_type_id?: string;
      registration_number?: string;
      color?: string;
    };
    booking?: {
      service_date?: string;
      time_slot_id?: string;
      booking_status_id?: string;
      assigned_worker_id?: string;
      base_price?: number;
      final_price?: number;
      area_id?: string;
    };
  };

  if (!customer) {
    return NextResponse.json(
      { error: "customer is required" },
      { status: 400 },
    );
  }

  try {
    // 1. Resolve or create customer
    let customerId: string;
    if (customer.existing_customer_id) {
      customerId = customer.existing_customer_id;
    } else {
      if (!customer.full_name || !customer.phone) {
        return NextResponse.json(
          { error: "full_name and phone are required for new customer" },
          { status: 400 },
        );
      }
      customerId = await createCustomerFromInput({
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
    }

    // 2. Optionally resolve or create vehicle
    let vehicleId = "";
    if (vehicle) {
      if (vehicle.existing_vehicle_id) {
        vehicleId = vehicle.existing_vehicle_id;
      } else if (vehicle.car_model && vehicle.vehicle_type_id) {
        vehicleId = await createVehicleFromInput({
          customer_id: customerId,
          car_model: vehicle.car_model,
          brand: vehicle.brand ?? "",
          vehicle_type_id: vehicle.vehicle_type_id,
          registration_number: vehicle.registration_number ?? "",
          color: vehicle.color ?? "",
          parking_notes: "",
          is_primary_vehicle: false,
        });
      }
    }

    // 3. Optionally create booking
    let bookingId = "";
    if (
      booking &&
      booking.service_date &&
      booking.time_slot_id &&
      booking.booking_status_id &&
      vehicleId
    ) {
      bookingId = await createBookingFromInput({
        customer_id: customerId,
        vehicle_id: vehicleId,
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
    }

    // 4. Update lead with conversion info
    await updateLeadFromInput(id, {
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
