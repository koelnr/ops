import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockCustomers } from "@/test/fixtures";

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

import { CustomersView } from "@/components/views/customers-view";
import * as mutateModule from "@/lib/mutate";

beforeEach(() => vi.clearAllMocks());

// ─── Table rendering ──────────────────────────────────────────────────────────

describe("CustomersView — table rendering", () => {
  it("renders customer rows", () => {
    render(<CustomersView customers={mockCustomers} />);
    expect(screen.getByText("Arjun Sharma")).toBeInTheDocument();
    expect(screen.getByText("Priya Nair")).toBeInTheDocument();
    expect(screen.getByText("CST-001")).toBeInTheDocument();
    expect(screen.getByText("CST-002")).toBeInTheDocument();
  });

  it("renders customer count in header", () => {
    render(<CustomersView customers={mockCustomers} />);
    expect(screen.getByText(/2 customers/)).toBeInTheDocument();
  });

  it("shows Create Customer button", () => {
    render(<CustomersView customers={mockCustomers} />);
    expect(screen.getByRole("button", { name: /create customer/i })).toBeInTheDocument();
  });

  it("shows empty state when no results match", async () => {
    const user = userEvent.setup();
    render(<CustomersView customers={mockCustomers} />);
    await user.type(screen.getByPlaceholderText(/search name/i), "ZZZNOMATCH");
    expect(screen.getByText("No customers match your filters.")).toBeInTheDocument();
  });
});

// ─── Search filter ────────────────────────────────────────────────────────────

describe("CustomersView — search filter", () => {
  it("filters by customer name", async () => {
    const user = userEvent.setup();
    render(<CustomersView customers={mockCustomers} />);
    await user.type(screen.getByPlaceholderText(/search name/i), "arjun");
    expect(screen.getByText("Arjun Sharma")).toBeInTheDocument();
    expect(screen.queryByText("Priya Nair")).not.toBeInTheDocument();
  });

  it("filters by phone number", async () => {
    const user = userEvent.setup();
    render(<CustomersView customers={mockCustomers} />);
    await user.type(screen.getByPlaceholderText(/search name/i), "9876543210");
    expect(screen.getByText("CST-001")).toBeInTheDocument();
    expect(screen.queryByText("CST-002")).not.toBeInTheDocument();
  });
});

// ─── Create customer dialog ───────────────────────────────────────────────────

describe("CustomersView — create customer dialog", () => {
  it("opens create dialog when Create Customer is clicked", async () => {
    const user = userEvent.setup();
    render(<CustomersView customers={mockCustomers} />);
    await user.click(screen.getByRole("button", { name: /create customer/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: /create customer/i })).toBeInTheDocument();
  });

  it("shows error toast when customerName is empty", async () => {
    const user = userEvent.setup();
    render(<CustomersView customers={mockCustomers} />);
    await user.click(screen.getByRole("button", { name: /create customer/i }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /create customer/i }));
    expect(mockToastError).toHaveBeenCalledWith("Customer name is required");
    expect(mutateModule.create).not.toHaveBeenCalled();
  });

  it("shows error toast when phoneNumber is empty", async () => {
    const user = userEvent.setup();
    render(<CustomersView customers={mockCustomers} />);
    await user.click(screen.getByRole("button", { name: /create customer/i }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText(/full name/i), "Test User");
    await user.click(within(dialog).getByRole("button", { name: /create customer/i }));
    expect(mockToastError).toHaveBeenCalledWith("Phone number is required");
    expect(mutateModule.create).not.toHaveBeenCalled();
  });

  it("calls create with correct payload on valid form submit", async () => {
    vi.mocked(mutateModule.create).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<CustomersView customers={mockCustomers} />);
    await user.click(screen.getByRole("button", { name: /create customer/i }));
    const dialog = screen.getByRole("dialog");

    await user.type(within(dialog).getByPlaceholderText(/full name/i), "New Customer");
    await user.type(within(dialog).getByPlaceholderText(/10-digit/i), "9999988888");

    await user.click(within(dialog).getByRole("button", { name: /create customer/i }));

    await waitFor(() => {
      expect(mutateModule.create).toHaveBeenCalledWith(
        "/api/customers",
        expect.objectContaining({
          customerName: "New Customer",
          phoneNumber: "9999988888",
        }),
      );
    });
  });

  it("shows success toast and closes dialog after successful create", async () => {
    vi.mocked(mutateModule.create).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<CustomersView customers={mockCustomers} />);
    await user.click(screen.getByRole("button", { name: /create customer/i }));
    const dialog = screen.getByRole("dialog");

    await user.type(within(dialog).getByPlaceholderText(/full name/i), "New Customer");
    await user.type(within(dialog).getByPlaceholderText(/10-digit/i), "9999988888");

    await user.click(within(dialog).getByRole("button", { name: /create customer/i }));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("Customer created");
    });
  });

  it("shows error toast on API failure", async () => {
    vi.mocked(mutateModule.create).mockResolvedValue({ ok: false, error: "Server error" });
    const user = userEvent.setup();
    render(<CustomersView customers={mockCustomers} />);
    await user.click(screen.getByRole("button", { name: /create customer/i }));
    const dialog = screen.getByRole("dialog");

    await user.type(within(dialog).getByPlaceholderText(/full name/i), "New Customer");
    await user.type(within(dialog).getByPlaceholderText(/10-digit/i), "9999988888");

    await user.click(within(dialog).getByRole("button", { name: /create customer/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Server error");
    });
  });
});

// ─── Edit customer dialog ─────────────────────────────────────────────────────

describe("CustomersView — edit customer dialog", () => {
  async function openEditForCST001(user: ReturnType<typeof userEvent.setup>) {
    render(<CustomersView customers={mockCustomers} />);
    const rows = screen.getAllByRole("row");
    const arjunRow = rows.find((r) => within(r).queryByText("CST-001"));
    await user.click(within(arjunRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /edit/i }));
  }

  it("opens edit dialog on row action", async () => {
    const user = userEvent.setup();
    await openEditForCST001(user);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Edit Customer/)).toBeInTheDocument();
  });

  it("calls mutate on save", async () => {
    vi.mocked(mutateModule.mutate).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    await openEditForCST001(user);
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(mutateModule.mutate).toHaveBeenCalledWith(
        "/api/customers/CST-001",
        expect.any(Object),
      );
    });
  });
});
