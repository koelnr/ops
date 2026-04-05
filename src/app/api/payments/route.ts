import { NextRequest, NextResponse } from "next/server";
import { getPayments } from "@/lib/db/adapters";
import { createPaymentFromInput } from "@/lib/db/modules/payments";
import { CreatePaymentSchema } from "@/lib/schemas";
import { requireSignedIn } from "@/lib/auth";

export async function GET() {
  try {
    await requireSignedIn();
    const payments = await getPayments();
    return NextResponse.json({ payments });
  } catch (err) {
    console.error("[GET /api/payments]", err);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSignedIn();
    const body: unknown = await req.json();
    const parsed = CreatePaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const id = await createPaymentFromInput(parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/payments]", err);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 },
    );
  }
}
