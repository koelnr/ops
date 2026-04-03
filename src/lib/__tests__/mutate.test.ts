import { describe, it, expect, vi, beforeEach } from "vitest";
import { mutate, create, remove } from "@/lib/mutate";

function mockFetch(ok: boolean, body: unknown, status = ok ? 200 : 400) {
  const jsonFn = vi.fn().mockResolvedValue(body);
  return vi.fn().mockResolvedValue({ ok, status, json: jsonFn });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("mutate (PATCH)", () => {
  it("returns { ok: true } on successful response", async () => {
    vi.stubGlobal("fetch", mockFetch(true, {}));
    const result = await mutate("/api/leads/LED-001", { followUpStatus: "Contacted" });
    expect(result).toEqual({ ok: true });
  });

  it("sends PATCH with correct URL and body", async () => {
    const fetchMock = mockFetch(true, {});
    vi.stubGlobal("fetch", fetchMock);
    await mutate("/api/leads/LED-001", { followUpStatus: "Contacted" });
    expect(fetchMock).toHaveBeenCalledWith("/api/leads/LED-001", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followUpStatus: "Contacted" }),
    });
  });

  it("returns error from JSON response on failure", async () => {
    vi.stubGlobal("fetch", mockFetch(false, { error: "Lead not found" }, 404));
    const result = await mutate("/api/leads/LED-999", { followUpStatus: "Contacted" });
    expect(result).toEqual({ ok: false, error: "Lead not found" });
  });

  it("returns fallback error when response body is not JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await mutate("/api/leads/LED-001", { followUpStatus: "Contacted" });
    expect(result).toEqual({ ok: false, error: "Something went wrong" });
  });
});

describe("create (POST)", () => {
  it("returns { ok: true } on 201 response", async () => {
    vi.stubGlobal("fetch", mockFetch(true, { ok: true }, 201));
    const result = await create("/api/leads", { prospectName: "Arjun", leadSource: "WhatsApp" });
    expect(result).toEqual({ ok: true });
  });

  it("sends POST with correct method", async () => {
    const fetchMock = mockFetch(true, {});
    vi.stubGlobal("fetch", fetchMock);
    await create("/api/leads", { prospectName: "Arjun" });
    expect(fetchMock).toHaveBeenCalledWith("/api/leads", expect.objectContaining({ method: "POST" }));
  });

  it("returns error payload on 400", async () => {
    vi.stubGlobal("fetch", mockFetch(false, { error: "Invalid request body" }, 400));
    const result = await create("/api/leads", {});
    expect(result).toEqual({ ok: false, error: "Invalid request body" });
  });
});

describe("remove (DELETE)", () => {
  it("returns { ok: true } on successful delete", async () => {
    vi.stubGlobal("fetch", mockFetch(true, {}));
    const result = await remove("/api/leads/LED-001");
    expect(result).toEqual({ ok: true });
  });

  it("sends DELETE with no body", async () => {
    const fetchMock = mockFetch(true, {});
    vi.stubGlobal("fetch", fetchMock);
    await remove("/api/leads/LED-001");
    expect(fetchMock).toHaveBeenCalledWith("/api/leads/LED-001", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: undefined,
    });
  });

  it("returns network error message on fetch failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Failed to fetch")));
    const result = await remove("/api/leads/LED-001");
    expect(result).toEqual({ ok: false, error: "Network error. Please try again." });
  });
});
