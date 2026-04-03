import { getSheetsClient } from "./client";
import { SPREADSHEET_ID, RANGES } from "./config";
import { rowsToObjects } from "./utils";
import { DashboardMetricSchema, type DashboardMetric } from "./types";

// DashboardMetrics column order: A=Metric, B=Today, C=This Week, D=This Month

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
      metric: row["Metric"] ?? "",
      today: row["Today"] ?? "",
      thisWeek: row["This Week"] ?? "",
      thisMonth: row["This Month"] ?? "",
    });

    if (parsed.success) {
      metrics.push(parsed.data);
    } else {
      console.warn(
        "[sheets/metrics] Invalid row skipped:",
        row["Metric"],
        parsed.error.flatten(),
      );
    }
  }

  return metrics;
}
