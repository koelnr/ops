import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase/firestore";
import { nowTimestamp } from "@/lib/firebase/timestamps";

const VALID_COLLECTIONS = new Set([
  "areas",
  "services",
  "vehicleTypes",
  "timeSlots",
  "bookingStatuses",
  "paymentStatuses",
  "paymentModes",
  "leadSources",
  "complaintTypes",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> },
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { collection, id } = await params;
  if (!VALID_COLLECTIONS.has(collection)) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
  }

  const body: unknown = await req.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const ref = db.collection(collection).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await ref.update({ ...(body as object), updatedAt: nowTimestamp() });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[PATCH /api/lookups/${collection}/${id}]`, err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> },
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { collection, id } = await params;
  if (!VALID_COLLECTIONS.has(collection)) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
  }

  try {
    const ref = db.collection(collection).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[DELETE /api/lookups/${collection}/${id}]`, err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
