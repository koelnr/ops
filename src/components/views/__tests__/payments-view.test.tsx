import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockPayments } from "@/test/fixtures";

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

import { PaymentsView } from "@/components/views/payments-view";
import * as mutateModule from "@/lib/mutate";

beforeEach(() => vi.clearAllMocks());

describe("PaymentsView — table rendering", () => {
  it("renders all payment rows", () => {
    render(<PaymentsView payments={mockPayments} />);
    expect(screen.getByText("PAY-001")).toBeInTheDocument();
    expect(screen.getByText("PAY-002")).toBeInTheDocument();
    expect(screen.getByText("Arjun Sharma")).toBeInTheDocument();
    expect(screen.getByText("Priya Nair")).toBeInTheDocument();
  });

  it("shows pending/partial count in header", () => {
    render(<PaymentsView payments={mockPayments} />);
    // PAY-002 is Partially Paid → 1 pending or partial
    expect(screen.getByText(/1 pending or partial/)).toBeInTheDocument();
  });

  it("shows empty state when no results match", async () => {
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
    await user.type(screen.getByPlaceholderText(/search payment/i), "ZZZNOMATCH");
    expect(screen.getByText("No payments match your filters.")).toBeInTheDocument();
  });
});

describe("PaymentsView — search and filters", () => {
  it("filters by customer name", async () => {
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
    await user.type(screen.getByPlaceholderText(/search payment/i), "arjun");
    expect(screen.getByText("PAY-001")).toBeInTheDocument();
    expect(screen.queryByText("PAY-002")).not.toBeInTheDocument();
  });

  it("filters by booking ID", async () => {
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
    await user.type(screen.getByPlaceholderText(/search payment/i), "BKG-002");
    expect(screen.getByText("PAY-002")).toBeInTheDocument();
    expect(screen.queryByText("PAY-001")).not.toBeInTheDocument();
  });

  it("status filter narrows results", async () => {
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
    await user.selectOptions(screen.getByDisplayValue("All statuses"), "Paid");
    expect(screen.getByText("PAY-001")).toBeInTheDocument();
    expect(screen.queryByText("PAY-002")).not.toBeInTheDocument();
  });

  it("mode filter narrows results", async () => {
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
    await user.selectOptions(screen.getByDisplayValue("All modes"), "Cash");
    expect(screen.getByText("PAY-002")).toBeInTheDocument();
    expect(screen.queryByText("PAY-001")).not.toBeInTheDocument();
  });
});

describe("PaymentsView — create dialog", () => {
  it("opens create dialog on New Payment click", async () => {
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
    await user.click(screen.getByRole("button", { name: /new payment/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("blocks submit when booking ID or customer name is empty", async () => {
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
    await user.click(screen.getByRole("button", { name: /new payment/i }));
    await user.click(screen.getByRole("button", { name: /create payment/i }));
    expect(mockToastError).toHaveBeenCalledWith("Booking ID and customer name are required");
    expect(mutateModule.create).not.toHaveBeenCalled();
  });

  it("blocks submit when amount received exceeds amount due", async () => {
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
    await user.click(screen.getByRole("button", { name: /new payment/i }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("BKG-001"), "BKG-003");
    await user.type(within(dialog).getByPlaceholderText("Name"), "Test Customer");
    // Set amount due to 100 and received to 200
    const [amountDueInput] = within(dialog).getAllByDisplayValue("") ;
    // Clear and type values via placeholder
    const inputs = within(dialog).getAllByRole("spinbutton");
    // amountDue input (placeholder "0")
    await user.clear(inputs[0]);
    await user.type(inputs[0], "100");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "200");
    await user.click(within(dialog).getByRole("button", { name: /create payment/i }));
    expect(mockToastError).toHaveBeenCalledWith("Amount received cannot exceed amount due");
  });

  it("calls create on valid form submit", async () => {
    vi.mocked(mutateModule.create).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
    await user.click(screen.getByRole("button", { name: /new payment/i }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("BKG-001"), "BKG-003");
    await user.type(within(dialog).getByPlaceholderText("Name"), "Test Customer");
    // Status is Pending by default so no paymentDate or UPI ref needed
    await user.selectOptions(within(dialog).getByDisplayValue("Pending"), "Pending");
    await user.click(within(dialog).getByRole("button", { name: /create payment/i }));
    await waitFor(() => {
      expect(mutateModule.create).toHaveBeenCalledWith("/api/payments", expect.objectContaining({
        bookingId: "BKG-003",
        customerName: "Test Customer",
      }));
    });
  });
});

describe("PaymentsView — status quick actions", () => {
  it("mark as Paid calls mutate with correct payload", async () => {
    vi.mocked(mutateModule.mutate).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
    // Open PAY-002 dropdown (Partially Paid, so Mark as Paid is enabled)
    const rows = screen.getAllByRole("row");
    const priyaRow = rows.find((r) => within(r).queryByText("PAY-002"));
    await user.click(within(priyaRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /mark as paid/i }));
    await waitFor(() => {
      expect(mutateModule.mutate).toHaveBeenCalledWith("/api/payments/PAY-002", { paymentStatus: "Paid" });
    });
  });

  it("mark as Pending calls mutate", async () => {
    vi.mocked(mutateModule.mutate).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
    const rows = screen.getAllByRole("row");
    const arjunRow = rows.find((r) => within(r).queryByText("PAY-001"));
    await user.click(within(arjunRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /mark as pending/i }));
    await waitFor(() => {
      expect(mutateModule.mutate).toHaveBeenCalledWith("/api/payments/PAY-001", { paymentStatus: "Pending" });
    });
  });
});

describe("PaymentsView — UPI reference dialog", () => {
  it("opens UPI ref dialog and saves reference", async () => {
    vi.mocked(mutateModule.mutate).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
    const rows = screen.getAllByRole("row");
    const arjunRow = rows.find((r) => within(r).queryByText("PAY-001"));
    await user.click(within(arjunRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /update upi reference/i }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Update UPI Reference")).toBeInTheDocument();

    const input = within(dialog).getByLabelText(/upi transaction reference/i);
    await user.clear(input);
    await user.type(input, "NEW-UPI-123");
    await user.click(within(dialog).getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mutateModule.mutate).toHaveBeenCalledWith("/api/payments/PAY-001", expect.objectContaining({
        upiTransactionRef: "NEW-UPI-123",
      }));
      expect(mockToastSuccess).toHaveBeenCalledWith("UPI reference updated");
    });
  });
});

describe("PaymentsView — delete flow", () => {
  it("shows delete confirmation and calls remove", async () => {
    vi.mocked(mutateModule.remove).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
    const rows = screen.getAllByRole("row");
    const arjunRow = rows.find((r) => within(r).queryByText("PAY-001"));
    await user.click(within(arjunRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));

    const alertDialog = screen.getByRole("alertdialog");
    expect(within(alertDialog).getByText(/PAY-001/)).toBeInTheDocument();
    await user.click(within(alertDialog).getByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(mutateModule.remove).toHaveBeenCalledWith("/api/payments/PAY-001");
      expect(mockToastSuccess).toHaveBeenCalledWith("Payment PAY-001 deleted");
    });
  });
});
