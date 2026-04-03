import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/sheets/mutations/payments", () => ({
  updatePayment: vi.fn(),
  deletePayment: vi.fn(),
  createPayment: vi.fn(),
}));

import { PATCH } from "@/app/api/payments/[id]/route";
import { updatePayment } from "@/lib/sheets/mutations/payments";

function makeIdRequest(
  id: string,
  body: unknown,
): [Request, { params: Promise<{ id: string }> }] {
  const req = new Request(`http://localhost/api/payments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return [req, { params: Promise.resolve({ id }) }];
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── PATCH /api/payments/[id] — Paid validation ───────────────────────────────

describe("PATCH /api/payments/[id] — Paid status validation", () => {
  it("returns 400 when paymentStatus is Paid and amountReceived !== amountDue", async () => {
    const [req, ctx] = makeIdRequest("PAY-001", {
      paymentStatus: "Paid",
      amountDue: 1200,
      amountReceived: 600,
    });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid request body");
  });

  it("returns 400 when paymentStatus is Paid but amountDue is missing", async () => {
    const [req, ctx] = makeIdRequest("PAY-001", {
      paymentStatus: "Paid",
      amountReceived: 500,
    });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(400);
  });

  it("returns 200 when paymentStatus is Paid and amountReceived === amountDue", async () => {
    vi.mocked(updatePayment).mockResolvedValue(undefined);

    const [req, ctx] = makeIdRequest("PAY-001", {
      paymentStatus: "Paid",
      amountDue: 500,
      amountReceived: 500,
    });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);
    expect(updatePayment).toHaveBeenCalledWith(
      "PAY-001",
      expect.objectContaining({ paymentStatus: "Paid", amountDue: 500, amountReceived: 500 }),
    );
  });

  it("allows Pending status without amount constraints", async () => {
    vi.mocked(updatePayment).mockResolvedValue(undefined);

    const [req, ctx] = makeIdRequest("PAY-001", {
      paymentStatus: "Pending",
    });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);
  });

  it("returns 400 on empty body", async () => {
    const [req, ctx] = makeIdRequest("PAY-001", {});
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(400);
  });
});
