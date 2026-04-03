import type { UpdateCustomerInput, CreateBookingInput, CreateCustomerInput, Customer } from "../types";
import { getCustomers } from "../customers";
import { findRowIndex, updateRowCells, generateNextId, appendRow } from "./helpers";

// Customers column map: A=Customer ID, B=Customer Name, C=Phone Number,
// D=Primary Area, E=First Booking Date, F=Total Bookings,
// G=Last Booking Date, H=Preferred Time Slot, I=Preferred Services,
// J=Total Revenue, K=Subscription Status, L=Referral Source,
// M=Referred Others, N=Complaint History, O=Notes

/**
 * Creates a new customer row manually (not from a booking).
 * Initializes totalBookings and totalRevenue to 0.
 */
export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const customerId = await generateNextId("Customers", "CST");
  const today = new Date().toISOString().split("T")[0];
  await appendRow("Customers", [
    customerId,
    input.customerName,
    input.phoneNumber,
    input.primaryArea ?? "",
    today,           // E: First Booking Date
    "0",             // F: Total Bookings
    today,           // G: Last Booking Date
    input.preferredTimeSlot ?? "",
    input.preferredServices ?? "",
    "0",             // J: Total Revenue
    input.subscriptionStatus ?? "",
    input.referralSource ?? "",
    "",              // M: Referred Others
    "",              // N: Complaint History
    input.notes ?? "",
  ]);
  return {
    customerId,
    customerName: input.customerName,
    phoneNumber: input.phoneNumber,
    primaryArea: input.primaryArea ?? "",
    firstBookingDate: today,
    totalBookings: 0,
    lastBookingDate: today,
    preferredTimeSlot: input.preferredTimeSlot ?? "",
    preferredServices: input.preferredServices ?? "",
    totalRevenue: 0,
    subscriptionStatus: input.subscriptionStatus ?? "",
    referralSource: input.referralSource ?? "",
    referredOthers: "",
    complaintHistory: "",
    notes: input.notes ?? "",
  };
}

export async function updateCustomer(
  id: string,
  patch: UpdateCustomerInput,
): Promise<void> {
  const row = await findRowIndex("Customers", id);
  if (row === null) throw new Error(`Customer not found: ${id}`);

  const cells: [string, string][] = [];
  if (patch.preferredTimeSlot !== undefined) cells.push(["H", patch.preferredTimeSlot]);
  if (patch.preferredServices !== undefined) cells.push(["I", patch.preferredServices]);
  if (patch.subscriptionStatus !== undefined) cells.push(["K", patch.subscriptionStatus]);
  if (patch.referralSource !== undefined) cells.push(["L", patch.referralSource]);
  if (patch.notes !== undefined) cells.push(["O", patch.notes]);

  if (cells.length > 0) {
    await updateRowCells("Customers", row, cells);
  }
}

/**
 * Creates a new customer row from a booking. Called when no matching
 * customer exists for the booking's phone number.
 */
async function createCustomerFromBooking(booking: CreateBookingInput): Promise<void> {
  const customerId = await generateNextId("Customers", "CST");
  const date = booking.serviceDate || booking.bookingDate;
  await appendRow("Customers", [
    customerId,
    booking.customerName,
    booking.phoneNumber,
    booking.areaSociety,
    date,          // E: First Booking Date
    "1",           // F: Total Bookings
    date,          // G: Last Booking Date
    booking.timeSlot,
    booking.servicePackage,
    String(booking.price), // J: Total Revenue
    "",            // K: Subscription Status
    booking.bookingSource, // L: Referral Source
    "",            // M: Referred Others
    "",            // N: Complaint History
    "",            // O: Notes
  ]);
}

/**
 * Updates aggregate fields on an existing customer when a new booking is created.
 * Increments totalBookings, adds booking price to totalRevenue, updates last booking
 * date, preferred slot/service, and referral source. Preserves all other fields.
 */
async function updateCustomerFromBooking(
  existing: Customer,
  booking: CreateBookingInput,
): Promise<void> {
  const row = await findRowIndex("Customers", existing.customerId);
  if (row === null) return; // silently skip if row disappeared

  const date = booking.serviceDate || booking.bookingDate;
  const cells: [string, string][] = [
    ["B", booking.customerName],
    ["D", booking.areaSociety],
    ["F", String(existing.totalBookings + 1)],
    ["G", date],
    ["H", booking.timeSlot],
    ["I", booking.servicePackage],
    ["J", String(existing.totalRevenue + booking.price)],
    ["L", booking.bookingSource],
  ];

  await updateRowCells("Customers", row, cells);
}

/**
 * Upserts a customer from a booking.
 * - Matches on phoneNumber (column C).
 * - Creates a new customer row if no match is found.
 * - Updates aggregate fields if an existing customer is found.
 */
export async function upsertCustomerFromBooking(
  booking: CreateBookingInput,
): Promise<void> {
  const customers = await getCustomers();
  const existing = customers.find((c) => c.phoneNumber === booking.phoneNumber);

  if (existing) {
    await updateCustomerFromBooking(existing, booking);
  } else {
    await createCustomerFromBooking(booking);
  }
}
