import { NextRequest, NextResponse } from "next/server";
import { UpdatePaymentSchema } from "@/lib/sheets/types";
import { updatePayment } from "@/lib/sheets/mutations/payments";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: unknown = await req.json();
    const parsed = UpdatePaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await updatePayment(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update payment";
    console.error("[PATCH /api/payments/[id]]", err);
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}
