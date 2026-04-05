import { NextRequest, NextResponse } from "next/server";
import { getCustomers } from "@/lib/db/adapters";
import { createCustomerFromInput } from "@/lib/db/modules/customers";
import { CreateCustomerSchema } from "@/lib/schemas";
import { requireSignedIn } from "@/lib/auth";

export async function GET() {
  try {
    await requireSignedIn();
    const customers = await getCustomers();
    return NextResponse.json({ customers });
  } catch (err) {
    console.error("[GET /api/customers]", err);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSignedIn();
    const body: unknown = await req.json();
    const parsed = CreateCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const id = await createCustomerFromInput(parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/customers]", err);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 },
    );
  }
}
