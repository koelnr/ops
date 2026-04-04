import { NextRequest, NextResponse } from "next/server";
import { getBookings } from "@/lib/sheets/bookings";
import { createBooking } from "@/lib/sheets/mutations/bookings";
import { createPayment } from "@/lib/sheets/mutations/payments";
import { CreateBookingSchema } from "@/lib/schemas";
import { requireSignedIn } from "@/lib/auth";

export async function GET() {
  try {
    await requireSignedIn();
    const bookings = await getBookings();
    return NextResponse.json({ bookings });
  } catch (err) {
    console.error("[GET /api/bookings]", err);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSignedIn();
    const body: unknown = await req.json();
    const parsed = CreateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const booking = await createBooking(parsed.data);

    // Best-effort initial payment record — does not fail booking creation
    try {
      await createPayment({
        booking_id: booking.booking_id,
        payment_date: "",
        amount_received: 0,
        payment_mode_id: "",
        payment_status_id: "",
        upi_transaction_ref: "",
        collected_by_worker_id: "",
        follow_up_required: false,
        notes: "",
      });
    } catch (err) {
      console.error("[POST /api/bookings] Payment creation failed:", err);
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
