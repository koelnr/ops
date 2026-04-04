import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockBookings, mockWorkers } from "@/test/fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: mockToastSuccess, error: mockToastError } }));

vi.mock("@/lib/mutate", () => ({
  mutate: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: vi.fn(() => ({ user: { publicMetadata: { role: "admin" } } })),
}));

import { BookingsView } from "@/components/views/bookings-view";
import * as mutateModule from "@/lib/mutate";

beforeEach(() => vi.clearAllMocks());

// Helper to find the table body row containing a specific text
function findTableRow(text: string) {
  const rows = screen.getAllByRole("row");
  return rows.find((r) => within(r).queryByText(text) && within(r).queryByRole("button"));
}

describe("BookingsView — table rendering", () => {
  it("renders all booking rows", () => {
    render(<BookingsView bookings={mockBookings} workers={mockWorkers} />);
    expect(screen.getByText("Arjun Sharma")).toBeInTheDocument();
    expect(screen.getByText("Priya Nair")).toBeInTheDocument();
    expect(screen.getByText("BKG-001")).toBeInTheDocument();
    expect(screen.getByText("BKG-002")).toBeInTheDocument();
  });

  it("shows total count in header", () => {
    render(<BookingsView bookings={mockBookings} workers={mockWorkers} />);
    expect(screen.getByText(/2 total/)).toBeInTheDocument();
  });

  it("shows empty state when no results match search", async () => {
    const user = userEvent.setup();
    render(<BookingsView bookings={mockBookings} workers={mockWorkers} />);
    await user.type(screen.getByPlaceholderText("Search ID, customer, phone, worker…"), "ZZZNOMATCH");
    expect(screen.getByText("No bookings match your filters.")).toBeInTheDocument();
  });
});

describe("BookingsView — search and filters", () => {
  it("filters by customer name", async () => {
    const user = userEvent.setup();
    render(<BookingsView bookings={mockBookings} workers={mockWorkers} />);
    await user.type(screen.getByPlaceholderText("Search ID, customer, phone, worker…"), "arjun");
    expect(screen.getByText("Arjun Sharma")).toBeInTheDocument();
    expect(screen.queryByText("Priya Nair")).not.toBeInTheDocument();
  });

  it("filters by booking ID", async () => {
    const user = userEvent.setup();
    render(<BookingsView bookings={mockBookings} workers={mockWorkers} />);
    await user.type(screen.getByPlaceholderText("Search ID, customer, phone, worker…"), "BKG-002");
    expect(screen.getByText("Priya Nair")).toBeInTheDocument();
    expect(screen.queryByText("Arjun Sharma")).not.toBeInTheDocument();
  });

  it("booking status filter narrows results", async () => {
    const user = userEvent.setup();
    render(<BookingsView bookings={mockBookings} workers={mockWorkers} />);
    await user.selectOptions(screen.getByDisplayValue("All statuses"), "Completed");
    expect(screen.getByText("Arjun Sharma")).toBeInTheDocument();
    expect(screen.queryByText("Priya Nair")).not.toBeInTheDocument();
  });

  it("payment status filter narrows results", async () => {
    const user = userEvent.setup();
    render(<BookingsView bookings={mockBookings} workers={mockWorkers} />);
    await user.selectOptions(screen.getByDisplayValue("Payment status"), "Pending");
    expect(screen.getByText("Priya Nair")).toBeInTheDocument();
    expect(screen.queryByText("Arjun Sharma")).not.toBeInTheDocument();
  });
});

describe("BookingsView — create dialog", () => {
  it("opens create dialog on New Booking click", async () => {
    const user = userEvent.setup();
    render(<BookingsView bookings={mockBookings} workers={mockWorkers} />);
    await user.click(screen.getByRole("button", { name: /new booking/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("blocks submit when customer name is empty", async () => {
    const user = userEvent.setup();
    render(<BookingsView bookings={mockBookings} workers={mockWorkers} />);
    await user.click(screen.getByRole("button", { name: /new booking/i }));
    await user.click(screen.getByRole("button", { name: /create booking/i }));
    expect(mockToastError).toHaveBeenCalledWith("Customer name and service date are required");
    expect(mutateModule.create).not.toHaveBeenCalled();
  });

  it("calls create with valid data", async () => {
    vi.mocked(mutateModule.create).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<BookingsView bookings={mockBookings} workers={mockWorkers} />);
    await user.click(screen.getByRole("button", { name: /new booking/i }));

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("Name"), "New Customer");
    // Use fireEvent.change for date inputs (more reliable than userEvent.type in jsdom)
    const dateInputs = within(dialog).getAllByDisplayValue("").filter(
      (el) => el.getAttribute("type") === "date"
    );
    // Service date is the second date input (after booking date)
    const serviceDateInput = dateInputs[1] ?? dateInputs[0];
    if (serviceDateInput) {
      fireEvent.change(serviceDateInput, { target: { value: "2026-04-01" } });
    }
    await user.click(within(dialog).getByRole("button", { name: /create booking/i }));

    await waitFor(() => {
      expect(mutateModule.create).toHaveBeenCalledWith("/api/bookings", expect.objectContaining({
        customerName: "New Customer",
      }));
      expect(mockToastSuccess).toHaveBeenCalledWith("Booking created");
    });
  });
});

describe("BookingsView — edit dialog", () => {
  it("opens edit dialog with pre-populated values", async () => {
    const user = userEvent.setup();
    render(<BookingsView bookings={mockBookings} workers={mockWorkers} />);

    const arjunRow = findTableRow("Arjun Sharma");
    await user.click(within(arjunRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /^edit$/i }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByDisplayValue("Arjun Sharma")).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("Maruti Swift")).toBeInTheDocument();
  });

  it("calls mutate on edit submit", async () => {
    vi.mocked(mutateModule.mutate).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<BookingsView bookings={mockBookings} workers={mockWorkers} />);

    const arjunRow = findTableRow("Arjun Sharma");
    await user.click(within(arjunRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /^edit$/i }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mutateModule.mutate).toHaveBeenCalledWith("/api/bookings/BKG-001", expect.any(Object));
      expect(mockToastSuccess).toHaveBeenCalledWith("Booking updated");
    });
  });
});

describe("BookingsView — assign worker", () => {
  it("opens assign worker dialog", async () => {
    const user = userEvent.setup();
    render(<BookingsView bookings={mockBookings} workers={mockWorkers} />);

    const priyaRow = findTableRow("Priya Nair");
    await user.click(within(priyaRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /assign worker/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Assign Worker")).toBeInTheDocument();
  });

  it("assigns worker and calls mutate", async () => {
    vi.mocked(mutateModule.mutate).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<BookingsView bookings={mockBookings} workers={mockWorkers} />);

    const priyaRow = findTableRow("Priya Nair");
    await user.click(within(priyaRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /assign worker/i }));

    const dialog = screen.getByRole("dialog");
    // Select via the native select rendered when workerNames exist
    await user.selectOptions(within(dialog).getByRole("combobox"), "Raju");
    await user.click(within(dialog).getByRole("button", { name: /assign/i }));

    await waitFor(() => {
      expect(mutateModule.mutate).toHaveBeenCalledWith("/api/bookings/BKG-002", { assignedWorker: "Raju" });
      expect(mockToastSuccess).toHaveBeenCalledWith("Worker assigned to BKG-002");
    });
  });
});

describe("BookingsView — delete flow", () => {
  it("shows delete confirmation and calls remove", async () => {
    vi.mocked(mutateModule.remove).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<BookingsView bookings={mockBookings} workers={mockWorkers} />);

    const arjunRow = findTableRow("Arjun Sharma");
    await user.click(within(arjunRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));

    const alertDialog = screen.getByRole("alertdialog");
    expect(within(alertDialog).getByText(/Arjun Sharma/)).toBeInTheDocument();
    await user.click(within(alertDialog).getByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(mutateModule.remove).toHaveBeenCalledWith("/api/bookings/BKG-001");
    });
  });
});
