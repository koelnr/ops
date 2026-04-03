import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn(),
  requireSignedIn: vi.fn(),
}));

vi.mock("@/lib/sheets/workers", () => ({
  getWorkers: vi.fn(),
}));

vi.mock("@/lib/sheets/mutations/workers", () => ({
  createWorker: vi.fn(),
  updateWorker: vi.fn(),
  deleteWorker: vi.fn(),
}));

import { GET, POST } from "@/app/api/workers/route";
import { PATCH, DELETE } from "@/app/api/workers/[id]/route";
import { requireAdmin } from "@/lib/auth";
import { getWorkers } from "@/lib/sheets/workers";
import { createWorker, updateWorker, deleteWorker } from "@/lib/sheets/mutations/workers";
import { mockWorkers } from "@/test/fixtures";

function makeRequest(body?: unknown, method = "POST"): Request {
  return new Request("http://localhost/api/workers", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function makeIdRequest(
  id: string,
  body?: unknown,
  method = "PATCH",
): [Request, { params: Promise<{ id: string }> }] {
  const req = new Request(`http://localhost/api/workers/${id}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const params = Promise.resolve({ id });
  return [req, { params }];
}

const adminOk = () => vi.mocked(requireAdmin).mockResolvedValue(null);
const adminForbidden = () =>
  vi.mocked(requireAdmin).mockResolvedValue(
    NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  );

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET /api/workers ─────────────────────────────────────────────────────────

describe("GET /api/workers", () => {
  it("returns workers array on success", async () => {
    vi.mocked(getWorkers).mockResolvedValue(mockWorkers);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.workers).toHaveLength(mockWorkers.length);
  });

  it("returns 500 when getWorkers throws", async () => {
    vi.mocked(getWorkers).mockRejectedValue(new Error("Sheets API error"));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/workers ────────────────────────────────────────────────────────

describe("POST /api/workers", () => {
  const validBody = { workerName: "Raju", date: "2026-04-03" };

  it("returns 403 for non-admin user", async () => {
    adminForbidden();
    const req = makeRequest(validBody);
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(createWorker).not.toHaveBeenCalled();
  });

  it("returns 201 when admin creates a worker record", async () => {
    adminOk();
    vi.mocked(createWorker).mockResolvedValue({
      ...mockWorkers[0],
      workerId: "WRK-003",
      workerName: "Raju",
      date: "2026-04-03",
    });
    const req = makeRequest(validBody);
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.worker.workerName).toBe("Raju");
    expect(createWorker).toHaveBeenCalledOnce();
  });

  it("returns 400 for missing required fields", async () => {
    adminOk();
    const req = makeRequest({ workerName: "Raju" }); // missing date
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(createWorker).not.toHaveBeenCalled();
  });

  it("returns 500 when createWorker throws", async () => {
    adminOk();
    vi.mocked(createWorker).mockRejectedValue(new Error("Sheets write error"));
    const req = makeRequest(validBody);
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

// ─── PATCH /api/workers/[id] ──────────────────────────────────────────────────

describe("PATCH /api/workers/[id]", () => {
  it("returns 403 for non-admin user", async () => {
    adminForbidden();
    const [req, ctx] = makeIdRequest("WRK-001", { notes: "updated" });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(403);
    expect(updateWorker).not.toHaveBeenCalled();
  });

  it("returns { ok: true } when admin updates a record", async () => {
    adminOk();
    vi.mocked(updateWorker).mockResolvedValue(undefined);
    const [req, ctx] = makeIdRequest("WRK-001", { notes: "updated" });
    const res = await PATCH(req, ctx);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(updateWorker).toHaveBeenCalledWith("WRK-001", { notes: "updated" });
  });

  it("returns 400 for empty patch body", async () => {
    adminOk();
    const [req, ctx] = makeIdRequest("WRK-001", {});
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(400);
    expect(updateWorker).not.toHaveBeenCalled();
  });

  it("returns 404 when worker not found", async () => {
    adminOk();
    vi.mocked(updateWorker).mockRejectedValue(new Error("WRK-999 not found"));
    const [req, ctx] = makeIdRequest("WRK-999", { notes: "test" });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/workers/[id] ─────────────────────────────────────────────────

describe("DELETE /api/workers/[id]", () => {
  it("returns 403 for non-admin user", async () => {
    adminForbidden();
    const req = new Request("http://localhost/api/workers/WRK-001", { method: "DELETE" });
    const ctx = { params: Promise.resolve({ id: "WRK-001" }) };
    const res = await DELETE(req, ctx);
    expect(res.status).toBe(403);
    expect(deleteWorker).not.toHaveBeenCalled();
  });

  it("returns { ok: true } when admin deletes a record", async () => {
    adminOk();
    vi.mocked(deleteWorker).mockResolvedValue(undefined);
    const req = new Request("http://localhost/api/workers/WRK-001", { method: "DELETE" });
    const ctx = { params: Promise.resolve({ id: "WRK-001" }) };
    const res = await DELETE(req, ctx);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(deleteWorker).toHaveBeenCalledWith("WRK-001");
  });

  it("returns 404 when worker record not found", async () => {
    adminOk();
    vi.mocked(deleteWorker).mockRejectedValue(new Error("WRK-999 not found"));
    const req = new Request("http://localhost/api/workers/WRK-999", { method: "DELETE" });
    const ctx = { params: Promise.resolve({ id: "WRK-999" }) };
    const res = await DELETE(req, ctx);
    expect(res.status).toBe(404);
  });
});
