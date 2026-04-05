import { NextRequest, NextResponse } from "next/server";
import { deleteBookingService } from "@/lib/db/modules/booking-services";
import { requireSignedIn } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSignedIn();
    const { id } = await params;
    await deleteBookingService(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete booking service";
    console.error("[DELETE /api/booking-services/[id]]", err);
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete booking service" },
      { status: 500 },
    );
  }
}
