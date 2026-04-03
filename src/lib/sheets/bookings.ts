import { getSheetsClient } from "./client";
import { SPREADSHEET_ID, RANGES } from "./config";
import { rowsToObjects, parseNumber, normalizeEmpty } from "./utils";
import {
  BookingSchema,
  CreateBookingSchema,
  type Booking,
  type CreateBookingInput,
} from "./types";

export async function getBookings(): Promise<Booking[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGES.bookings,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  const bookings: Booking[] = [];

  for (const row of rows) {
    const parsed = BookingSchema.safeParse({
      id: row.id,
      date: row.date,
      customerId: row.customerId,
      customerName: row.customerName,
      vehicleType: row.vehicleType,
      servicePackage: row.servicePackage,
      status: row.status,
      assignedWorker: normalizeEmpty(row.assignedWorker),
      timeSlot: normalizeEmpty(row.timeSlot),
      amount: parseNumber(row.amount),
      paymentStatus: row.paymentStatus,
      notes: normalizeEmpty(row.notes),
    });

    if (parsed.success) {
      bookings.push(parsed.data);
    } else {
      console.warn("[sheets/bookings] Invalid row skipped:", row.id, parsed.error.flatten());
    }
  }

  return bookings;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  // Validate input before writing
  const validated = CreateBookingSchema.parse(input);
  const id = `BK-${Date.now()}`;

  const booking: Booking = { ...validated, id };

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGES.bookings,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        booking.id,
        booking.date,
        booking.customerId,
        booking.customerName,
        booking.vehicleType,
        booking.servicePackage,
        booking.status,
        booking.assignedWorker ?? "",
        booking.timeSlot ?? "",
        booking.amount,
        booking.paymentStatus,
        booking.notes ?? "",
      ]],
    },
  });

  return booking;
}
