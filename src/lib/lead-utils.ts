/** Classifies a lead status string into one of four canonical buckets. */
export function classifyLeadStatus(
  status: string,
): "contacted" | "converted" | "pending" | "other" {
  const s = status.toLowerCase();
  if (s.includes("convert") || s === "closed" || s === "won")
    return "converted";
  if (s.includes("contact") || s === "reached" || s === "called")
    return "contacted";
  if (
    s === "pending" ||
    s === "new" ||
    s === "fresh" ||
    s === "follow" ||
    s.includes("follow")
  )
    return "pending";
  return "other";
}

/** Returns true if the lead status maps to the "pending follow-up" bucket. */
export function isLeadPending(status: string): boolean {
  return classifyLeadStatus(status) === "pending";
}
