/** Classifies a lead's followUpStatus into a canonical bucket for funnel display. */
export function classifyFollowUpStatus(
  status: string,
): "pending" | "contacted" | "other" {
  const s = status.toLowerCase().trim();
  if (!s) return "pending";
  if (s.includes("contact") || s === "reached" || s === "called")
    return "contacted";
  if (
    s === "pending" ||
    s === "new" ||
    s === "fresh" ||
    s.includes("follow")
  )
    return "pending";
  return "other";
}

/** Classifies a lead's conversionStatus into a canonical bucket. */
export function classifyConversionStatus(
  status: string,
): "converted" | "not_converted" | "unknown" {
  const s = status.toLowerCase().trim();
  if (s.includes("convert") || s === "closed" || s === "won" || s === "yes")
    return "converted";
  if (s === "no" || s === "lost" || s === "not interested")
    return "not_converted";
  return "unknown";
}

/** Returns true if the lead has a pending follow-up (not yet contacted or converted). */
export function isLeadPending(followUpStatus: string): boolean {
  return classifyFollowUpStatus(followUpStatus) === "pending";
}
