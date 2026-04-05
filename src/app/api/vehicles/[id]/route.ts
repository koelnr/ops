import { NextRequest, NextResponse } from "next/server";
import { UpdateVehicleSchema } from "@/lib/schemas";
import { updateVehicleFromInput, deleteVehicle } from "@/lib/db/modules/vehicles";
import { requireSignedIn } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSignedIn();
    const { id } = await params;
    const body: unknown = await req.json();
    const parsed = UpdateVehicleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await updateVehicleFromInput(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update vehicle";
    console.error("[PATCH /api/vehicles/[id]]", err);
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update vehicle" },
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
    await deleteVehicle(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete vehicle";
    console.error("[DELETE /api/vehicles/[id]]", err);
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete vehicle" },
      { status: 500 },
    );
  }
}
