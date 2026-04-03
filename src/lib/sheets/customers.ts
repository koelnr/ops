import { getSheetsClient } from "./client";
import { SPREADSHEET_ID, RANGES } from "./config";
import { rowsToObjects, parseNumber, normalizeEmpty } from "./utils";
import { CustomerSchema, type Customer } from "./types";

export async function getCustomers(): Promise<Customer[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGES.customers,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  const customers: Customer[] = [];

  for (const row of rows) {
    const parsed = CustomerSchema.safeParse({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: normalizeEmpty(row.email),
      address: normalizeEmpty(row.address),
      repeatCustomer: row.repeatCustomer,
      totalBookings: parseNumber(row.totalBookings),
      totalSpend: parseNumber(row.totalSpend),
    });

    if (parsed.success) {
      customers.push(parsed.data);
    } else {
      console.warn("[sheets/customers] Invalid row skipped:", row.id, parsed.error.flatten());
    }
  }

  return customers;
}
