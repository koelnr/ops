/** Formats a number as Indian Rupee currency. e.g. 50000 → "₹50,000" */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Formats an ISO date string (YYYY-MM-DD) as a human-readable date.
 * e.g. "2024-01-15" → "15 Jan 2024"
 * Returns "—" for null/undefined/empty values.
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Formats a completion percentage. e.g. formatPercent(7, 10) → "70%" */
export function formatPercent(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}
