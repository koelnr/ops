import { NextRequest, NextResponse } from "next/server";
import { UpdateBookingSchema } from "@/lib/schemas";
import { updateBookingFromInput, deleteBooking } from "@/lib/db/modules/bookings";
import { requireSignedIn } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSignedIn();
    const { id } = await params;
    const body: unknown = await req.json();
    const parsed = UpdateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await updateBookingFromInput(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update booking";
    console.error("[PATCH /api/bookings/[id]]", err);
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSignedIn();
    const { id } = await params;
    await deleteBooking(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete booking";
    console.error("[DELETE /api/bookings/[id]]", err);
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 },
    );
  }
}
