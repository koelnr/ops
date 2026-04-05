import { NextRequest, NextResponse } from "next/server";
import { getBookingServices } from "@/lib/db/adapters";
import { createBookingServiceFromInput } from "@/lib/db/modules/booking-services";
import { CreateBookingServiceSchema } from "@/lib/schemas";
import { requireSignedIn } from "@/lib/auth";

export async function GET() {
  try {
    await requireSignedIn();
    const bookingServices = await getBookingServices();
    return NextResponse.json({ bookingServices });
  } catch (err) {
    console.error("[GET /api/booking-services]", err);
    return NextResponse.json(
      { error: "Failed to fetch booking services" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSignedIn();
    const body: unknown = await req.json();
    const parsed = CreateBookingServiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const id = await createBookingServiceFromInput(parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/booking-services]", err);
    return NextResponse.json(
      { error: "Failed to create booking service" },
      { status: 500 },
    );
  }
}
