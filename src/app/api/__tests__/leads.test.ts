import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the sheet modules before importing route handlers
vi.mock("@/lib/sheets/leads", () => ({
  getLeads: vi.fn(),
}));

vi.mock("@/lib/sheets/mutations/leads", () => ({
  createLead: vi.fn(),
  updateLead: vi.fn(),
  deleteLead: vi.fn(),
}));

import { GET, POST } from "@/app/api/leads/route";
import { PATCH, DELETE } from "@/app/api/leads/[id]/route";
import { getLeads } from "@/lib/sheets/leads";
import { createLead, updateLead, deleteLead } from "@/lib/sheets/mutations/leads";
import { mockLeads } from "@/test/fixtures";

function makeRequest(body?: unknown, method = "POST"): Request {
  return new Request("http://localhost/api/leads", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function makeIdRequest(id: string, body?: unknown, method = "PATCH"): [Request, { params: Promise<{ id: string }> }] {
  const req = new Request(`http://localhost/api/leads/${id}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const params = Promise.resolve({ id });
  return [req, { params }];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/leads", () => {
  it("returns leads array on success", async () => {
    vi.mocked(getLeads).mockResolvedValue(mockLeads);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.leads).toHaveLength(mockLeads.length);
    expect(data.leads[0].leadId).toBe("LED-001");
  });

  it("returns 500 when getLeads throws", async () => {
    vi.mocked(getLeads).mockRejectedValue(new Error("Sheets API error"));
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to fetch leads");
  });
});

describe("POST /api/leads", () => {
  const validBody = {
    leadDate: "2026-03-01",
    leadSource: "WhatsApp",
    prospectName: "Arjun Sharma",
    phoneNumber: "9876543210",
    areaSociety: "Sector 12",
    followUpStatus: "New",
    conversionStatus: "Not Converted",
  };

  it("returns 201 on valid create", async () => {
    vi.mocked(createLead).mockResolvedValue(undefined);
    const req = makeRequest(validBody);
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.ok).toBe(true);
    expect(createLead).toHaveBeenCalledOnce();
  });

  it("returns 400 when required fields are missing", async () => {
    const req = makeRequest({ prospectName: "Only Name" });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid request body");
    expect(data.details).toBeDefined();
    expect(createLead).not.toHaveBeenCalled();
  });

  it("returns 400 for empty body", async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(createLead).not.toHaveBeenCalled();
  });

  it("returns 500 when createLead throws", async () => {
    vi.mocked(createLead).mockRejectedValue(new Error("Sheets write error"));
    const req = makeRequest(validBody);
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to create lead");
  });
});

describe("PATCH /api/leads/[id]", () => {
  it("returns { ok: true } on valid update", async () => {
    vi.mocked(updateLead).mockResolvedValue(undefined);
    const [req, ctx] = makeIdRequest("LED-001", { followUpStatus: "Contacted" });
    const res = await PATCH(req, ctx);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(updateLead).toHaveBeenCalledWith("LED-001", { followUpStatus: "Contacted" });
  });

  it("returns 400 for empty patch body", async () => {
    const [req, ctx] = makeIdRequest("LED-001", {});
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(400);
    expect(updateLead).not.toHaveBeenCalled();
  });

  it("returns 404 when lead not found", async () => {
    vi.mocked(updateLead).mockRejectedValue(new Error("LED-999 not found"));
    const [req, ctx] = makeIdRequest("LED-999", { notes: "test" });
    const res = await PATCH(req, ctx);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(updateLead).mockRejectedValue(new Error("Internal error"));
    const [req, ctx] = makeIdRequest("LED-001", { notes: "test" });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/leads/[id]", () => {
  it("returns { ok: true } on successful delete", async () => {
    vi.mocked(deleteLead).mockResolvedValue(undefined);
    const req = new Request("http://localhost/api/leads/LED-001", { method: "DELETE" });
    const ctx = { params: Promise.resolve({ id: "LED-001" }) };
    const res = await DELETE(req, ctx);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(deleteLead).toHaveBeenCalledWith("LED-001");
  });

  it("returns 404 when lead not found", async () => {
    vi.mocked(deleteLead).mockRejectedValue(new Error("LED-999 not found"));
    const req = new Request("http://localhost/api/leads/LED-999", { method: "DELETE" });
    const ctx = { params: Promise.resolve({ id: "LED-999" }) };
    const res = await DELETE(req, ctx);
    expect(res.status).toBe(404);
  });
});
