import { NextResponse } from "next/server";
import { getLookupContext } from "@/lib/sheets/lookups";
import { serializeLookupContext } from "@/lib/domain";
import { requireSignedIn } from "@/lib/auth";

export async function GET() {
  try {
    await requireSignedIn();
    const ctx = await getLookupContext();
    return NextResponse.json(serializeLookupContext(ctx));
  } catch (err) {
    console.error("[GET /api/lookups]", err);
    return NextResponse.json({ error: "Failed to fetch lookups" }, { status: 500 });
  }
}
