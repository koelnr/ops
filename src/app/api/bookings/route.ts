import { NextRequest, NextResponse } from "next/server";
import { getBookings, createBooking } from "@/lib/sheets/bookings";
import { upsertCustomerFromBooking } from "@/lib/sheets/mutations/customers";
import { createPayment } from "@/lib/sheets/mutations/payments";
import { CreateBookingSchema } from "@/lib/sheets/types";

export async function GET() {
  try {
    const bookings = await getBookings();
    return NextResponse.json({ bookings });
  } catch (err) {
    console.error("[GET /api/bookings]", err);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const parsed = CreateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const booking = await createBooking(parsed.data);

    // Best-effort customer upsert — does not fail booking creation on sync error
    try {
      await upsertCustomerFromBooking(parsed.data);
    } catch (upsertErr) {
      console.error("[POST /api/bookings] Customer upsert failed:", upsertErr);
    }

    // Best-effort payment creation — does not fail booking creation on error
    try {
      await createPayment({
        bookingId: booking.bookingId,
        customerName: parsed.data.customerName,
        serviceDate: parsed.data.serviceDate,
        amountDue: parsed.data.price,
        amountReceived: 0,
        paymentStatus: "Pending",
        paymentMode: parsed.data.paymentMode,
        upiTransactionRef: "",
        paymentDate: "",
        followUpRequired: "Yes",
        notes: "",
      });
    } catch (paymentErr) {
      console.error("[POST /api/bookings] Payment creation failed:", paymentErr);
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
