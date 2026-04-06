import { NextRequest, NextResponse } from "next/server";
import { UpdateCustomerSchema } from "@/lib/schemas";
import {
  updateCustomerFromInput,
  deleteCustomer,
} from "@/lib/db/modules/customers";
import { requireSignedIn } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSignedIn();
    const { id } = await params;
    const body: unknown = await req.json();
    const parsed = UpdateCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await updateCustomerFromInput(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update customer";
    console.error("[PATCH /api/customers/[id]]", err);
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update customer" },
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
    await deleteCustomer(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete customer";
    console.error("[DELETE /api/customers/[id]]", err);
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 },
    );
  }
}
