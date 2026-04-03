import { getSheetsClient } from "./client";
import { SPREADSHEET_ID, RANGES } from "./config";
import { rowsToObjects } from "./utils";
import { DashboardMetricSchema, type DashboardMetric } from "./types";

export async function getDashboardMetrics(): Promise<DashboardMetric[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGES.dashboardMetrics,
  });

  const rows = rowsToObjects((res.data.values as string[][] | undefined) ?? []);
  const metrics: DashboardMetric[] = [];

  for (const row of rows) {
    const parsed = DashboardMetricSchema.safeParse({
      key: row.key,
      value: row.value,
      label: row.label,
      updatedAt: row.updatedAt,
    });

    if (parsed.success) {
      metrics.push(parsed.data);
    } else {
      console.warn("[sheets/metrics] Invalid row skipped:", row.key, parsed.error.flatten());
    }
  }

  return metrics;
}
