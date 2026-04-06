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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { collection } = await params;
  if (!VALID_COLLECTIONS.has(collection)) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
  }

  const body: unknown = await req.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const now = nowTimestamp();
    const ref = db.collection(collection).doc();
    await ref.set({
      ...(body as object),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (err) {
    console.error(`[POST /api/lookups/${collection}]`, err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
