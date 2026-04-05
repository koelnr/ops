import { NextRequest, NextResponse } from "next/server";
import { getBookings } from "@/lib/db/adapters";
import { createBookingFromInput } from "@/lib/db/modules/bookings";
import { CreateBookingSchema } from "@/lib/schemas";
import { requireSignedIn } from "@/lib/auth";

export async function GET() {
  try {
    await requireSignedIn();
    const bookings = await getBookings();
    return NextResponse.json({ bookings });
  } catch (err) {
    console.error("[GET /api/bookings]", err);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 },
    );
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

    const id = await createBookingFromInput(parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}
