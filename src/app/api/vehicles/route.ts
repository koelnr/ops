import { NextRequest, NextResponse } from "next/server";
import { getVehicles } from "@/lib/sheets/vehicles";
import { createVehicle } from "@/lib/sheets/mutations/vehicles";
import { CreateVehicleSchema } from "@/lib/schemas";
import { requireSignedIn } from "@/lib/auth";

export async function GET() {
  try {
    await requireSignedIn();
    const vehicles = await getVehicles();
    return NextResponse.json({ vehicles });
  } catch (err) {
    console.error("[GET /api/vehicles]", err);
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSignedIn();
    const body: unknown = await req.json();
    const parsed = CreateVehicleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const vehicle = await createVehicle(parsed.data);
    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/vehicles]", err);
    return NextResponse.json(
      { error: "Failed to create vehicle" },
      { status: 500 },
    );
  }
}
