import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getWorkers } from "@/lib/db/adapters";
import { createWorkerFromInput } from "@/lib/db/modules/workers";
import { CreateWorkerSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const workers = await getWorkers();
    return NextResponse.json({ workers });
  } catch (err) {
    console.error("[GET /api/workers]", err);
    return NextResponse.json(
      { error: "Failed to fetch workers" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body: unknown = await req.json();
    const parsed = CreateWorkerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const id = await createWorkerFromInput(parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/workers]", err);
    return NextResponse.json(
      { error: "Failed to create worker" },
      { status: 500 },
    );
  }
}
