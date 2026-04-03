import { NextRequest, NextResponse } from "next/server";
import { getComplaints } from "@/lib/sheets/complaints";
import { CreateComplaintSchema } from "@/lib/sheets/types";
import { createComplaint } from "@/lib/sheets/mutations/complaints";

export async function GET() {
  try {
    const complaints = await getComplaints();
    return NextResponse.json({ complaints });
  } catch (err) {
    console.error("[GET /api/complaints]", err);
    return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const parsed = CreateComplaintSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await createComplaint(parsed.data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/complaints]", err);
    return NextResponse.json({ error: "Failed to create complaint" }, { status: 500 });
  }
}
