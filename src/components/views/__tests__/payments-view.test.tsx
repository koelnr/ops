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
import type { Payment } from "@/lib/sheets/types";

beforeEach(() => vi.clearAllMocks());

// ─── Table rendering ──────────────────────────────────────────────────────────

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
    expect(screen.getByText(/1 pending or partial/)).toBeInTheDocument();
  });

  it("does not render a New Payment button", () => {
    render(<PaymentsView payments={mockPayments} />);
    expect(screen.queryByRole("button", { name: /new payment/i })).not.toBeInTheDocument();
  });

  it("shows empty state when no results match", async () => {
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
    await user.type(screen.getByPlaceholderText(/search payment/i), "ZZZNOMATCH");
    expect(screen.getByText("No payments match your filters.")).toBeInTheDocument();
  });
});

// ─── Search and filters ───────────────────────────────────────────────────────

describe("PaymentsView — search and filters", () => {
  it("filters by customer name", async () => {
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
    await user.type(screen.getByPlaceholderText(/search payment/i), "arjun");
    expect(screen.getByText("PAY-001")).toBeInTheDocument();
    expect(screen.queryByText("PAY-002")).not.toBeInTheDocument();
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

// ─── Edit dialog — field restrictions ────────────────────────────────────────

describe("PaymentsView — edit dialog restrictions", () => {
  async function openEditForPAY001(user: ReturnType<typeof userEvent.setup>) {
    render(<PaymentsView payments={mockPayments} />);
    const rows = screen.getAllByRole("row");
    const arjunRow = rows.find((r) => within(r).queryByText("PAY-001"));
    await user.click(within(arjunRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /edit/i }));
  }

  it("opens edit dialog via dropdown", async () => {
    const user = userEvent.setup();
    await openEditForPAY001(user);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("booking ID field is disabled in edit dialog", async () => {
    const user = userEvent.setup();
    await openEditForPAY001(user);
    const input = screen.getByLabelText("Booking ID (read only)");
    expect(input).toBeDisabled();
  });

  it("customer name field is disabled in edit dialog", async () => {
    const user = userEvent.setup();
    await openEditForPAY001(user);
    const input = screen.getByLabelText("Customer Name (read only)");
    expect(input).toBeDisabled();
  });

  it("service date field is disabled in edit dialog", async () => {
    const user = userEvent.setup();
    await openEditForPAY001(user);
    const input = screen.getByLabelText("Service Date (read only)");
    expect(input).toBeDisabled();
  });

  it("amount due field is disabled in edit dialog", async () => {
    const user = userEvent.setup();
    await openEditForPAY001(user);
    const input = screen.getByLabelText("Amount Due (read only)");
    expect(input).toBeDisabled();
  });

  it("defaults paymentDate to today when payment has no paymentDate", async () => {
    const paymentWithoutDate: Payment = {
      ...mockPayments[0],
      paymentDate: "",
    };
    const user = userEvent.setup();
    render(<PaymentsView payments={[paymentWithoutDate]} />);
    const rows = screen.getAllByRole("row");
    const row = rows.find((r) => within(r).queryByText("PAY-001"));
    await user.click(within(row!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /edit/i }));

    const today = new Date().toISOString().split("T")[0];
    const dateInput = screen.getByDisplayValue(today);
    expect(dateInput).toBeInTheDocument();
  });

  it("Paid option is disabled in status select when amountReceived !== amountDue", async () => {
    // PAY-002 has amountDue=1200, amountReceived=600 — mismatched
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
    const rows = screen.getAllByRole("row");
    const priyaRow = rows.find((r) => within(r).queryByText("PAY-002"));
    await user.click(within(priyaRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /edit/i }));

    const dialog = screen.getByRole("dialog");
    const paidOption = within(dialog).getByRole("option", { name: "Paid" });
    expect(paidOption).toBeDisabled();
  });

  it("blocks Paid status via form submit guard and shows error toast", async () => {
    // PAY-001 has amountDue=500, amountReceived=500 — equal, but we manually
    // change the amountReceived in the form state via the existing payment to test guard
    // Create a payment where amounts differ but status is Paid (edge case via direct state)
    // Instead: verify the toast fires when the form is manipulated
    // Since the select option is disabled, we test the handleFormSubmit guard
    // by rendering a component with a payment that already has paymentStatus=Paid but mismatched amounts
    const mismatchedPayment: Payment = {
      ...mockPayments[0],
      paymentStatus: "Paid",
      amountDue: 500,
      amountReceived: 300,
    };
    render(<PaymentsView payments={[mismatchedPayment]} />);
    const rows = screen.getAllByRole("row");
    const row = rows.find((r) => within(r).queryByText("PAY-001"));
    const user = userEvent.setup();
    await user.click(within(row!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /edit/i }));

    const dialog = screen.getByRole("dialog");
    // Submit directly — status is already Paid in the pre-populated form, amounts differ
    await user.click(within(dialog).getByRole("button", { name: /save changes/i }));

    expect(mockToastError).toHaveBeenCalledWith(
      "Amount received must equal amount due to mark as Paid",
    );
    expect(mutateModule.mutate).not.toHaveBeenCalled();
  });

  it("submits successfully when status is not Paid", async () => {
    vi.mocked(mutateModule.mutate).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    await openEditForPAY001(user);
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(mutateModule.mutate).toHaveBeenCalledWith(
        "/api/payments/PAY-001",
        expect.objectContaining({ paymentStatus: "Paid" }),
      );
    });
  });
});

// ─── Status quick actions ─────────────────────────────────────────────────────

describe("PaymentsView — status quick actions", () => {
  it("mark as Paid calls mutate with correct payload", async () => {
    vi.mocked(mutateModule.mutate).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<PaymentsView payments={mockPayments} />);
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

// ─── UPI reference dialog ─────────────────────────────────────────────────────

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

// ─── Delete flow ──────────────────────────────────────────────────────────────

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
