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

vi.mock("@/lib/mutate", () => ({ mutate: vi.fn(), create: vi.fn(), remove: vi.fn() }));

// Default: non-admin user
vi.mock("@clerk/nextjs", () => ({
  useUser: vi.fn(() => ({ user: { publicMetadata: { role: "member" } } })),
}));

import { WorkersView } from "@/components/views/workers-view";
import * as mutateModule from "@/lib/mutate";
import { useUser } from "@clerk/nextjs";

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
  function asAdmin() {
    vi.mocked(useUser).mockReturnValue({
      user: { publicMetadata: { role: "admin" } },
    } as ReturnType<typeof useUser>);
  }

  it("non-admin does not see Edit Record in dropdown", async () => {
    // Default mock is non-admin (member)
    const user = userEvent.setup();
    render(<WorkersView workers={mockWorkers} />);
    const rajuRow = findWorkerTableRow("Raju");
    await user.click(within(rajuRow!).getByRole("button"));
    expect(screen.queryByRole("menuitem", { name: /edit record/i })).not.toBeInTheDocument();
  });

  it("opens edit dialog with pre-populated values (admin)", async () => {
    asAdmin();
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

  it("calls mutate with updated values on save (admin)", async () => {
    asAdmin();
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

  it("shows error toast when update fails (admin)", async () => {
    asAdmin();
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

  it("closes dialog on cancel (admin)", async () => {
    asAdmin();
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

describe("WorkersView — admin actions", () => {
  function asAdmin() {
    vi.mocked(useUser).mockReturnValue({
      user: { publicMetadata: { role: "admin" } },
    } as ReturnType<typeof useUser>);
  }

  function asNonAdmin() {
    vi.mocked(useUser).mockReturnValue({
      user: { publicMetadata: { role: "member" } },
    } as ReturnType<typeof useUser>);
  }

  it("shows New Record button for admin", () => {
    asAdmin();
    render(<WorkersView workers={mockWorkers} />);
    expect(screen.getByRole("button", { name: /new record/i })).toBeInTheDocument();
  });

  it("hides New Record button for non-admin", () => {
    asNonAdmin();
    render(<WorkersView workers={mockWorkers} />);
    expect(screen.queryByRole("button", { name: /new record/i })).not.toBeInTheDocument();
  });

  it("shows delete option in dropdown for admin", async () => {
    asAdmin();
    const user = userEvent.setup();
    render(<WorkersView workers={mockWorkers} />);

    const rajuRow = findWorkerTableRow("Raju");
    await user.click(within(rajuRow!).getByRole("button"));
    expect(screen.getByRole("menuitem", { name: /delete record/i })).toBeInTheDocument();
  });

  it("hides delete option in dropdown for non-admin", async () => {
    asNonAdmin();
    const user = userEvent.setup();
    render(<WorkersView workers={mockWorkers} />);

    const rajuRow = findWorkerTableRow("Raju");
    await user.click(within(rajuRow!).getByRole("button"));
    expect(screen.queryByRole("menuitem", { name: /delete record/i })).not.toBeInTheDocument();
  });

  it("opens create dialog when admin clicks New Record", async () => {
    asAdmin();
    const user = userEvent.setup();
    render(<WorkersView workers={mockWorkers} />);
    await user.click(screen.getByRole("button", { name: /new record/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("New Worker Record")).toBeInTheDocument();
  });

  it("calls create and shows success toast on valid create", async () => {
    asAdmin();
    vi.mocked(mutateModule.create).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<WorkersView workers={mockWorkers} />);

    await user.click(screen.getByRole("button", { name: /new record/i }));

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("e.g. Raju"), "Vikram");
    // Date input is the first empty-value input after name is filled
    const emptyInputs = within(dialog).getAllByDisplayValue("");
    await user.type(emptyInputs[0], "2026-04-03");

    await user.click(within(dialog).getByRole("button", { name: /create record/i }));

    await waitFor(() => {
      expect(mutateModule.create).toHaveBeenCalledWith(
        "/api/workers",
        expect.objectContaining({ workerName: "Vikram" }),
      );
      expect(mockToastSuccess).toHaveBeenCalledWith("Worker record created for Vikram");
    });
  });

  it("shows delete confirmation dialog when admin clicks Delete Record", async () => {
    asAdmin();
    const user = userEvent.setup();
    render(<WorkersView workers={mockWorkers} />);

    const rajuRow = findWorkerTableRow("Raju");
    await user.click(within(rajuRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /delete record/i }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/permanently delete/i)).toBeInTheDocument();
  });

  it("calls remove and shows success toast on delete confirmation", async () => {
    asAdmin();
    vi.mocked(mutateModule.remove).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<WorkersView workers={mockWorkers} />);

    const rajuRow = findWorkerTableRow("Raju");
    await user.click(within(rajuRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /delete record/i }));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(mutateModule.remove).toHaveBeenCalledWith("/api/workers/WRK-001");
      expect(mockToastSuccess).toHaveBeenCalledWith("Worker record deleted for Raju");
    });
  });
});
