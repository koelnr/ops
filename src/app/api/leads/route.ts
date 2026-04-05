import { NextRequest, NextResponse } from "next/server";
import { getLeads } from "@/lib/sheets/leads";
import { CreateLeadSchema } from "@/lib/schemas";
import { createLead } from "@/lib/sheets/mutations/leads";
import { requireSignedIn } from "@/lib/auth";

export async function GET() {
  try {
    await requireSignedIn();
    const leads = await getLeads();
    return NextResponse.json({ leads });
  } catch (err) {
    console.error("[GET /api/leads]", err);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSignedIn();
    const body: unknown = await req.json();
    const parsed = CreateLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const lead = await createLead(parsed.data);
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/leads]", err);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 },
    );
  }
}
