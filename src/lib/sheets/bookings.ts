import { getSheetsClient } from "./client";
import { SPREADSHEET_ID, RANGES } from "./config";
import { rowsToObjects, parseNumber } from "./utils";
import {
  BookingSchema,
  CreateBookingSchema,
  type Booking,
  type CreateBookingInput,
} from "./types";

// Bookings column order: A=Booking ID, B=Booking Date, C=Service Date,
// D=Time Slot, E=Customer Name, F=Phone Number, G=Area / Society,
// H=Full Address, I=Car Model, J=Vehicle Type, K=Service Package,
// L=Add-Ons, M=Price, N=Payment Status, O=Payment Mode,
// P=Assigned Worker, Q=Booking Source, R=Booking Status,
// S=Service Start Time, T=Service End Time, U=Completion Status,
// V=Customer Rating, W=Complaint Flag, X=Repeat Customer,
// Y=Notes, Z=Duration (mins)

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
      bookingId: row["Booking ID"] ?? "",
      bookingDate: row["Booking Date"] ?? "",
      serviceDate: row["Service Date"] ?? "",
      timeSlot: row["Time Slot"] ?? "",
      customerName: row["Customer Name"] ?? "",
      phoneNumber: row["Phone Number"] ?? "",
      areaSociety: row["Area / Society"] ?? "",
      fullAddress: row["Full Address"] ?? "",
      carModel: row["Car Model"] ?? "",
      vehicleType: row["Vehicle Type"] ?? "",
      servicePackage: row["Service Package"] ?? "",
      addOns: row["Add-Ons"] ?? "",
      price: parseNumber(row["Price"]),
      paymentStatus: row["Payment Status"] ?? "",
      paymentMode: row["Payment Mode"] ?? "",
      assignedWorker: row["Assigned Worker"] ?? "",
      bookingSource: row["Booking Source"] ?? "",
      bookingStatus: row["Booking Status"] ?? "",
      serviceStartTime: row["Service Start Time"] ?? "",
      serviceEndTime: row["Service End Time"] ?? "",
      completionStatus: row["Completion Status"] ?? "",
      customerRating: row["Customer Rating"]
        ? parseNumber(row["Customer Rating"])
        : undefined,
      complaintFlag: row["Complaint Flag"] ?? "",
      repeatCustomer: row["Repeat Customer"] ?? "",
      notes: row["Notes"] ?? "",
      durationMins: row["Duration (mins)"]
        ? parseNumber(row["Duration (mins)"])
        : undefined,
    });

    if (parsed.success) {
      bookings.push(parsed.data);
    } else {
      console.warn(
        "[sheets/bookings] Invalid row skipped:",
        row["Booking ID"],
        parsed.error.flatten(),
      );
    }
  }

  console.info("[bookings]:", bookings);
  return bookings;
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<Booking> {
  const validated = CreateBookingSchema.parse(input);
  const bookingId = `BK-${Date.now()}`;

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGES.bookings,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          bookingId,
          validated.bookingDate,
          validated.serviceDate,
          validated.timeSlot,
          validated.customerName,
          validated.phoneNumber,
          validated.areaSociety,
          validated.fullAddress,
          validated.carModel,
          validated.vehicleType,
          validated.servicePackage,
          validated.addOns ?? "",
          validated.price,
          validated.paymentStatus,
          validated.paymentMode,
          validated.assignedWorker ?? "",
          validated.bookingSource,
          validated.bookingStatus,
          "", // Service Start Time
          "", // Service End Time
          "", // Completion Status
          "", // Customer Rating
          "", // Complaint Flag
          "", // Repeat Customer
          validated.notes ?? "",
          "", // Duration (mins)
        ],
      ],
    },
  });

  // Return a complete Booking object; optional fields default to empty/undefined
  return {
    bookingId,
    bookingDate: validated.bookingDate,
    serviceDate: validated.serviceDate,
    timeSlot: validated.timeSlot,
    customerName: validated.customerName,
    phoneNumber: validated.phoneNumber,
    areaSociety: validated.areaSociety,
    fullAddress: validated.fullAddress,
    carModel: validated.carModel,
    vehicleType: validated.vehicleType,
    servicePackage: validated.servicePackage,
    addOns: validated.addOns ?? "",
    price: validated.price,
    paymentStatus: validated.paymentStatus,
    paymentMode: validated.paymentMode,
    assignedWorker: validated.assignedWorker ?? "",
    bookingSource: validated.bookingSource,
    bookingStatus: validated.bookingStatus,
    serviceStartTime: "",
    serviceEndTime: "",
    completionStatus: "",
    complaintFlag: "",
    repeatCustomer: "",
    notes: validated.notes ?? "",
  };
}
