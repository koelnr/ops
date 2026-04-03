import { NextRequest, NextResponse } from "next/server";
import { getPayments } from "@/lib/sheets/payments";
import { CreatePaymentSchema } from "@/lib/sheets/types";
import { createPayment } from "@/lib/sheets/mutations/payments";

export async function GET() {
  try {
    const payments = await getPayments();
    return NextResponse.json({ payments });
  } catch (err) {
    console.error("[GET /api/payments]", err);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const parsed = CreatePaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await createPayment(parsed.data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/payments]", err);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
