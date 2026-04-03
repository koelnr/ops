/**
 * Thin fetch wrapper for PATCH mutations.
 * Returns { ok: true } on success, { ok: false, error: string } on failure.
 */
export async function mutate(
  url: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) return { ok: true };

    const data = await res.json().catch(() => ({}));
    return {
      ok: false,
      error: (data as { error?: string }).error ?? "Something went wrong",
    };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
