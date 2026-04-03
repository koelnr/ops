import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockWorkers } from "@/test/fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: mockToastSuccess, error: mockToastError } }));

vi.mock("@/lib/mutate", () => ({ mutate: vi.fn() }));

import { WorkersView } from "@/components/views/workers-view";
import * as mutateModule from "@/lib/mutate";

beforeEach(() => vi.clearAllMocks());

// Find a table data row that has a dropdown button (i.e. the main table rows, not summary)
function findWorkerTableRow(name: string) {
  return screen
    .getAllByRole("row")
    .find((r) => within(r).queryByText(name) && within(r).queryByRole("button"));
}

describe("WorkersView — table rendering", () => {
  it("renders worker names in the table", () => {
    render(<WorkersView workers={mockWorkers} />);
    // Both workers appear (possibly multiple times due to summary) — check at least one exists
    expect(screen.getAllByText("Raju").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Suresh").length).toBeGreaterThanOrEqual(1);
  });

  it("shows correct workers and records count", () => {
    render(<WorkersView workers={mockWorkers} />);
    expect(screen.getByText(/2 workers/)).toBeInTheDocument();
    expect(screen.getByText(/2 daily ops records/)).toBeInTheDocument();
  });

  it("displays payout and area data in rows", () => {
    render(<WorkersView workers={mockWorkers} />);
    expect(screen.getByText("Sector 12, Sector 15")).toBeInTheDocument();
    expect(screen.getByText("Green Park")).toBeInTheDocument();
  });
});

describe("WorkersView — search and date filter", () => {
  it("filters by worker name", async () => {
    const user = userEvent.setup();
    render(<WorkersView workers={mockWorkers} />);
    await user.type(screen.getByPlaceholderText("Search worker name…"), "Raju");
    // After filtering, Suresh should not appear (not even in summary which would be filtered too)
    expect(screen.queryByText("Green Park")).not.toBeInTheDocument();
  });

  it("shows empty state when name doesn't match", async () => {
    const user = userEvent.setup();
    render(<WorkersView workers={mockWorkers} />);
    await user.type(screen.getByPlaceholderText("Search worker name…"), "Unknown");
    expect(screen.getByText("No worker records match your filters.")).toBeInTheDocument();
  });

  it("date filter narrows records", async () => {
    const user = userEvent.setup();
    render(<WorkersView workers={mockWorkers} />);
    await user.selectOptions(screen.getByDisplayValue("All dates"), "2026-03-05");
    // Only Raju's date is 2026-03-05
    expect(screen.queryByText("Green Park")).not.toBeInTheDocument();
    expect(screen.getByText("Sector 12, Sector 15")).toBeInTheDocument();
  });
});

describe("WorkersView — edit dialog", () => {
  it("opens edit dialog with pre-populated values", async () => {
    const user = userEvent.setup();
    render(<WorkersView workers={mockWorkers} />);
    const rajuRow = findWorkerTableRow("Raju");
    await user.click(within(rajuRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /edit record/i }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Raju/)).toBeInTheDocument();
    // Payout due pre-filled as 800
    const payoutInputs = within(dialog).getAllByRole("spinbutton");
    expect(payoutInputs[0]).toHaveValue(800);
  });

  it("calls mutate with updated values on save", async () => {
    vi.mocked(mutateModule.mutate).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<WorkersView workers={mockWorkers} />);

    const rajuRow = findWorkerTableRow("Raju");
    await user.click(within(rajuRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /edit record/i }));

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mutateModule.mutate).toHaveBeenCalledWith("/api/workers/WRK-001", expect.objectContaining({
        payoutDue: 800,
        payoutPaid: 800,
      }));
      expect(mockToastSuccess).toHaveBeenCalledWith("Worker record updated for Raju");
    });
  });

  it("shows error toast when update fails", async () => {
    vi.mocked(mutateModule.mutate).mockResolvedValue({ ok: false, error: "Update failed" });
    const user = userEvent.setup();
    render(<WorkersView workers={mockWorkers} />);

    const rajuRow = findWorkerTableRow("Raju");
    await user.click(within(rajuRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /edit record/i }));

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Update failed");
    });
  });

  it("closes dialog on cancel", async () => {
    const user = userEvent.setup();
    render(<WorkersView workers={mockWorkers} />);

    const rajuRow = findWorkerTableRow("Raju");
    await user.click(within(rajuRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /edit record/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
