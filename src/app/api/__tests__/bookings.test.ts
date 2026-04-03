import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/sheets/bookings", () => ({
  getBookings: vi.fn(),
  createBooking: vi.fn(),
}));

vi.mock("@/lib/sheets/mutations/customers", () => ({
  upsertCustomerFromBooking: vi.fn(),
}));

vi.mock("@/lib/sheets/mutations/payments", () => ({
  createPayment: vi.fn(),
}));

import { GET, POST } from "@/app/api/bookings/route";
import { getBookings, createBooking } from "@/lib/sheets/bookings";
import { upsertCustomerFromBooking } from "@/lib/sheets/mutations/customers";
import { createPayment } from "@/lib/sheets/mutations/payments";
import { mockBookings } from "@/test/fixtures";

function makeRequest(body?: unknown): Request {
  return new Request("http://localhost/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const validBody = {
  bookingDate: "2026-04-04",
  serviceDate: "2026-04-07",
  timeSlot: "10am-12pm",
  customerName: "Test Customer",
  phoneNumber: "9999999999",
  areaSociety: "Test Area",
  fullAddress: "123 Test St",
  carModel: "Maruti Swift",
  vehicleType: "Hatchback",
  servicePackage: "Exterior Wash",
  price: 500,
  paymentStatus: "Pending",
  paymentMode: "Cash",
  bookingSource: "WhatsApp",
  bookingStatus: "Confirmed",
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET /api/bookings ────────────────────────────────────────────────────────

describe("GET /api/bookings", () => {
  it("returns bookings array on success", async () => {
    vi.mocked(getBookings).mockResolvedValue(mockBookings);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.bookings).toHaveLength(mockBookings.length);
  });

  it("returns 500 when getBookings throws", async () => {
    vi.mocked(getBookings).mockRejectedValue(new Error("Sheets error"));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/bookings ───────────────────────────────────────────────────────

describe("POST /api/bookings", () => {
  it("returns 400 on invalid body", async () => {
    const res = await POST(makeRequest({ customerName: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 201 and creates booking", async () => {
    vi.mocked(createBooking).mockResolvedValue(mockBookings[0]);
    vi.mocked(upsertCustomerFromBooking).mockResolvedValue(undefined);
    vi.mocked(createPayment).mockResolvedValue(undefined as never);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.booking).toBeDefined();
  });

  it("calls createPayment with correct args after creating booking", async () => {
    vi.mocked(createBooking).mockResolvedValue(mockBookings[0]);
    vi.mocked(upsertCustomerFromBooking).mockResolvedValue(undefined);
    vi.mocked(createPayment).mockResolvedValue(undefined as never);

    await POST(makeRequest(validBody));

    expect(createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: mockBookings[0].bookingId,
        customerName: validBody.customerName,
        serviceDate: validBody.serviceDate,
        amountDue: validBody.price,
        amountReceived: 0,
        paymentStatus: "Pending",
        paymentMode: validBody.paymentMode,
        followUpRequired: "Yes",
      }),
    );
  });

  it("returns 201 even when createPayment throws (best-effort)", async () => {
    vi.mocked(createBooking).mockResolvedValue(mockBookings[0]);
    vi.mocked(upsertCustomerFromBooking).mockResolvedValue(undefined);
    vi.mocked(createPayment).mockRejectedValue(new Error("Sheets error"));

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
  });

  it("returns 201 even when upsertCustomerFromBooking throws (best-effort)", async () => {
    vi.mocked(createBooking).mockResolvedValue(mockBookings[0]);
    vi.mocked(upsertCustomerFromBooking).mockRejectedValue(new Error("Customer upsert error"));
    vi.mocked(createPayment).mockResolvedValue(undefined as never);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
  });
});
