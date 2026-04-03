import { NextRequest, NextResponse } from "next/server";
import { UpdateBookingSchema } from "@/lib/sheets/types";
import { updateBooking } from "@/lib/sheets/mutations/bookings";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: unknown = await req.json();
    const parsed = UpdateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await updateBooking(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update booking";
    console.error("[PATCH /api/bookings/[id]]", err);
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
