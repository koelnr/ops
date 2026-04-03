type MutateResult = { ok: boolean; error?: string };

async function request(
  url: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<MutateResult> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
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

/** PATCH — update existing record */
export function mutate(
  url: string,
  body: Record<string, unknown>,
): Promise<MutateResult> {
  return request(url, "PATCH", body);
}

/** POST — create new record */
export function create(
  url: string,
  body: Record<string, unknown>,
): Promise<MutateResult> {
  return request(url, "POST", body);
}

/** DELETE — remove record */
export function remove(url: string): Promise<MutateResult> {
  return request(url, "DELETE");
}
