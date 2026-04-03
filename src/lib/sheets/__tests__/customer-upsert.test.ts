import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/sheets/customers", () => ({
  getCustomers: vi.fn(),
}));

vi.mock("@/lib/sheets/mutations/helpers", () => ({
  generateNextId: vi.fn(),
  appendRow: vi.fn(),
  findRowIndex: vi.fn(),
  updateRowCells: vi.fn(),
  deleteRow: vi.fn(),
}));

import { upsertCustomerFromBooking } from "@/lib/sheets/mutations/customers";
import { getCustomers } from "@/lib/sheets/customers";
import {
  generateNextId,
  appendRow,
  findRowIndex,
  updateRowCells,
} from "@/lib/sheets/mutations/helpers";
import type { Customer, CreateBookingInput } from "@/lib/sheets/types";

const baseBooking: CreateBookingInput = {
  bookingDate: "2026-04-01",
  serviceDate: "2026-04-03",
  timeSlot: "10:00 AM",
  customerName: "Arjun Sharma",
  phoneNumber: "9876543210",
  areaSociety: "Sector 12",
  fullAddress: "House 45, Sector 12",
  carModel: "Maruti Swift",
  vehicleType: "Hatchback",
  servicePackage: "Exterior Wash",
  price: 500,
  paymentStatus: "Pending",
  paymentMode: "UPI",
  bookingSource: "WhatsApp",
  bookingStatus: "Confirmed",
};

const existingCustomer: Customer = {
  customerId: "CST-001",
  customerName: "Arjun Sharma",
  phoneNumber: "9876543210",
  primaryArea: "Sector 10",
  firstBookingDate: "2026-03-01",
  totalBookings: 2,
  lastBookingDate: "2026-03-15",
  preferredTimeSlot: "9:00 AM",
  preferredServices: "Exterior Wash",
  totalRevenue: 1000,
  subscriptionStatus: "Active",
  referralSource: "WhatsApp",
  referredOthers: "No",
  complaintHistory: "None",
  notes: "Regular customer",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("upsertCustomerFromBooking — new customer", () => {
  it("creates a new customer row when no phone match exists", async () => {
    vi.mocked(getCustomers).mockResolvedValue([]);
    vi.mocked(generateNextId).mockResolvedValue("CST-001");
    vi.mocked(appendRow).mockResolvedValue(undefined);

    await upsertCustomerFromBooking(baseBooking);

    expect(generateNextId).toHaveBeenCalledWith("Customers", "CST");
    expect(appendRow).toHaveBeenCalledOnce();
    const [sheetName, row] = vi.mocked(appendRow).mock.calls[0];
    expect(sheetName).toBe("Customers");
    expect(row[0]).toBe("CST-001");          // Customer ID
    expect(row[1]).toBe("Arjun Sharma");     // Customer Name
    expect(row[2]).toBe("9876543210");       // Phone Number
    expect(row[3]).toBe("Sector 12");        // Primary Area
    expect(row[4]).toBe("2026-04-03");       // First Booking Date (serviceDate)
    expect(row[5]).toBe("1");               // Total Bookings
    expect(row[6]).toBe("2026-04-03");       // Last Booking Date
    expect(row[7]).toBe("10:00 AM");         // Preferred Time Slot
    expect(row[8]).toBe("Exterior Wash");    // Preferred Services
    expect(row[9]).toBe("500");             // Total Revenue
    expect(row[11]).toBe("WhatsApp");        // Referral Source
  });

  it("uses bookingDate as fallback when serviceDate is empty", async () => {
    vi.mocked(getCustomers).mockResolvedValue([]);
    vi.mocked(generateNextId).mockResolvedValue("CST-001");
    vi.mocked(appendRow).mockResolvedValue(undefined);

    await upsertCustomerFromBooking({ ...baseBooking, serviceDate: "" });

    const [, row] = vi.mocked(appendRow).mock.calls[0];
    expect(row[4]).toBe("2026-04-01"); // falls back to bookingDate
  });
});

describe("upsertCustomerFromBooking — existing customer", () => {
  it("updates aggregate fields when phone number matches", async () => {
    vi.mocked(getCustomers).mockResolvedValue([existingCustomer]);
    vi.mocked(findRowIndex).mockResolvedValue(3);
    vi.mocked(updateRowCells).mockResolvedValue(undefined);

    await upsertCustomerFromBooking(baseBooking);

    expect(appendRow).not.toHaveBeenCalled();
    expect(findRowIndex).toHaveBeenCalledWith("Customers", "CST-001");
    expect(updateRowCells).toHaveBeenCalledOnce();
  });

  it("increments totalBookings by 1", async () => {
    vi.mocked(getCustomers).mockResolvedValue([existingCustomer]);
    vi.mocked(findRowIndex).mockResolvedValue(3);
    vi.mocked(updateRowCells).mockResolvedValue(undefined);

    await upsertCustomerFromBooking(baseBooking);

    const cells = vi.mocked(updateRowCells).mock.calls[0][2] as [string, string][];
    const totalBookingsCell = cells.find(([col]) => col === "F");
    expect(totalBookingsCell?.[1]).toBe("3"); // was 2, now 3
  });

  it("adds booking price to existing totalRevenue", async () => {
    vi.mocked(getCustomers).mockResolvedValue([existingCustomer]);
    vi.mocked(findRowIndex).mockResolvedValue(3);
    vi.mocked(updateRowCells).mockResolvedValue(undefined);

    await upsertCustomerFromBooking(baseBooking);

    const cells = vi.mocked(updateRowCells).mock.calls[0][2] as [string, string][];
    const revenueCell = cells.find(([col]) => col === "J");
    expect(revenueCell?.[1]).toBe("1500"); // 1000 + 500
  });

  it("updates lastBookingDate to the new serviceDate", async () => {
    vi.mocked(getCustomers).mockResolvedValue([existingCustomer]);
    vi.mocked(findRowIndex).mockResolvedValue(3);
    vi.mocked(updateRowCells).mockResolvedValue(undefined);

    await upsertCustomerFromBooking(baseBooking);

    const cells = vi.mocked(updateRowCells).mock.calls[0][2] as [string, string][];
    const lastBookingCell = cells.find(([col]) => col === "G");
    expect(lastBookingCell?.[1]).toBe("2026-04-03");
  });

  it("does not match on different phone number", async () => {
    vi.mocked(getCustomers).mockResolvedValue([existingCustomer]);
    vi.mocked(generateNextId).mockResolvedValue("CST-002");
    vi.mocked(appendRow).mockResolvedValue(undefined);

    // Different phone number — should create a new customer
    await upsertCustomerFromBooking({ ...baseBooking, phoneNumber: "9999999999" });

    expect(appendRow).toHaveBeenCalledOnce();
    expect(updateRowCells).not.toHaveBeenCalled();
  });

  it("silently skips update if row index is not found", async () => {
    vi.mocked(getCustomers).mockResolvedValue([existingCustomer]);
    vi.mocked(findRowIndex).mockResolvedValue(null); // row disappeared

    await upsertCustomerFromBooking(baseBooking);

    expect(updateRowCells).not.toHaveBeenCalled();
  });
});
