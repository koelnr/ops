import { NextRequest, NextResponse } from "next/server";
import { UpdateComplaintSchema } from "@/lib/sheets/types";
import { updateComplaint } from "@/lib/sheets/mutations/complaints";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: unknown = await req.json();
    const parsed = UpdateComplaintSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await updateComplaint(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update complaint";
    console.error("[PATCH /api/complaints/[id]]", err);
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update complaint" }, { status: 500 });
  }
}
