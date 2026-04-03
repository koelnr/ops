import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/sheets/customers", () => ({
  getCustomers: vi.fn(),
}));

vi.mock("@/lib/sheets/mutations/customers", () => ({
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  upsertCustomerFromBooking: vi.fn(),
}));

import { GET, POST } from "@/app/api/customers/route";
import { getCustomers } from "@/lib/sheets/customers";
import { createCustomer } from "@/lib/sheets/mutations/customers";
import { mockCustomers } from "@/test/fixtures";

function makeRequest(body?: unknown): Request {
  return new Request("http://localhost/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const validBody = {
  customerName: "New Customer",
  phoneNumber: "9000000001",
  primaryArea: "Test Area",
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET /api/customers ───────────────────────────────────────────────────────

describe("GET /api/customers", () => {
  it("returns customers array on success", async () => {
    vi.mocked(getCustomers).mockResolvedValue(mockCustomers);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.customers).toHaveLength(mockCustomers.length);
  });

  it("returns 500 when getCustomers throws", async () => {
    vi.mocked(getCustomers).mockRejectedValue(new Error("Sheets error"));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/customers ──────────────────────────────────────────────────────

describe("POST /api/customers", () => {
  it("returns 400 when customerName is missing", async () => {
    const res = await POST(makeRequest({ phoneNumber: "9000000001" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when phoneNumber is missing", async () => {
    const res = await POST(makeRequest({ customerName: "Test" }));
    expect(res.status).toBe(400);
  });

  it("returns 201 and creates customer on valid body", async () => {
    vi.mocked(createCustomer).mockResolvedValue(mockCustomers[0]);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.customer).toBeDefined();
  });

  it("calls createCustomer with validated data", async () => {
    vi.mocked(createCustomer).mockResolvedValue(mockCustomers[0]);
    await POST(makeRequest(validBody));
    expect(createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: validBody.customerName,
        phoneNumber: validBody.phoneNumber,
        primaryArea: validBody.primaryArea,
      }),
    );
  });

  it("returns 500 when createCustomer throws", async () => {
    vi.mocked(createCustomer).mockRejectedValue(new Error("Sheets error"));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
  });
});
