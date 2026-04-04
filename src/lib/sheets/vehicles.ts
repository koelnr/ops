import type { Vehicle } from "../domain";
import { getSheetsClient } from "./client";
import { RANGES } from "./config";
import { rowsToObjects } from "./utils";

// Column order (row 1 headers must match exactly):
// vehicle_id, customer_id, registration_number, car_model, brand,
// vehicle_type_id, color, parking_notes, is_primary_vehicle, created_at

export async function getVehicles(): Promise<Vehicle[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: RANGES.vehicles,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  return rows
    .map(
      (row): Vehicle => ({
        vehicle_id: row.vehicle_id ?? "",
        customer_id: row.customer_id ?? "",
        registration_number: row.registration_number ?? "",
        car_model: row.car_model ?? "",
        brand: row.brand ?? "",
        vehicle_type_id: row.vehicle_type_id ?? "",
        color: row.color ?? "",
        parking_notes: row.parking_notes ?? "",
        is_primary_vehicle: row.is_primary_vehicle === "true",
        created_at: row.created_at ?? "",
      }),
    )
    .filter((v) => v.vehicle_id !== "");
}
