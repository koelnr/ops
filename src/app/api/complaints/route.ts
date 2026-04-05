import { NextRequest, NextResponse } from "next/server";
import { getComplaints } from "@/lib/db/adapters";
import { createComplaintFromInput } from "@/lib/db/modules/complaints";
import { CreateComplaintSchema } from "@/lib/schemas";
import { requireSignedIn } from "@/lib/auth";

export async function GET() {
  try {
    await requireSignedIn();
    const complaints = await getComplaints();
    return NextResponse.json({ complaints });
  } catch (err) {
    console.error("[GET /api/complaints]", err);
    return NextResponse.json(
      { error: "Failed to fetch complaints" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSignedIn();
    const body: unknown = await req.json();
    const parsed = CreateComplaintSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const id = await createComplaintFromInput(parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/complaints]", err);
    return NextResponse.json(
      { error: "Failed to create complaint" },
      { status: 500 },
    );
  }
}
