import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockLeads } from "@/test/fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/leads",
}));

// Use vi.hoisted so these refs are available when vi.mock factory runs
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

import { LeadsView } from "@/components/views/leads-view";
import * as mutateModule from "@/lib/mutate";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LeadsView — table rendering", () => {
  it("renders all lead rows", () => {
    render(<LeadsView leads={mockLeads} />);
    expect(screen.getByText("Arjun Sharma")).toBeInTheDocument();
    expect(screen.getByText("Priya Nair")).toBeInTheDocument();
    expect(screen.getByText("Rohit Verma")).toBeInTheDocument();
  });

  it("shows correct total and pending count in header", () => {
    render(<LeadsView leads={mockLeads} />);
    // LED-001: New (pending), LED-003: Follow-Up Pending (pending) → 2 pending
    expect(screen.getByText(/3 total/)).toBeInTheDocument();
    expect(screen.getByText(/2 pending/)).toBeInTheDocument();
  });

  it("shows empty state when no leads match filter", async () => {
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);
    const search = screen.getByPlaceholderText("Search name, phone, area…");
    await user.type(search, "zzznomatch");
    expect(screen.getByText("No leads match your filters.")).toBeInTheDocument();
  });
});

describe("LeadsView — search", () => {
  it("filters by prospect name", async () => {
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);
    const search = screen.getByPlaceholderText("Search name, phone, area…");
    await user.type(search, "arjun");
    expect(screen.getByText("Arjun Sharma")).toBeInTheDocument();
    expect(screen.queryByText("Priya Nair")).not.toBeInTheDocument();
  });

  it("filters by area/society", async () => {
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);
    const search = screen.getByPlaceholderText("Search name, phone, area…");
    await user.type(search, "Green Park");
    expect(screen.getByText("Priya Nair")).toBeInTheDocument();
    expect(screen.queryByText("Arjun Sharma")).not.toBeInTheDocument();
  });

  it("filters by phone number", async () => {
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);
    await user.type(screen.getByPlaceholderText("Search name, phone, area…"), "9988");
    expect(screen.getByText("Rohit Verma")).toBeInTheDocument();
    expect(screen.queryByText("Arjun Sharma")).not.toBeInTheDocument();
  });
});

describe("LeadsView — filters", () => {
  it("follow-up filter narrows results", async () => {
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);
    const followUpSelect = screen.getByDisplayValue("Follow-up status");
    await user.selectOptions(followUpSelect, "New");
    expect(screen.getByText("Arjun Sharma")).toBeInTheDocument();
    expect(screen.queryByText("Priya Nair")).not.toBeInTheDocument();
    expect(screen.queryByText("Rohit Verma")).not.toBeInTheDocument();
  });

  it("conversion filter narrows results", async () => {
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);
    const conversionSelect = screen.getByDisplayValue("Conversion status");
    await user.selectOptions(conversionSelect, "Converted");
    expect(screen.getByText("Priya Nair")).toBeInTheDocument();
    expect(screen.queryByText("Arjun Sharma")).not.toBeInTheDocument();
  });
});

describe("LeadsView — create dialog", () => {
  it("opens create dialog when New Lead is clicked", async () => {
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);
    await user.click(screen.getByRole("button", { name: /new lead/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByPlaceholderText("Name")).toBeInTheDocument();
  });

  it("blocks submit when prospect name is empty", async () => {
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);
    await user.click(screen.getByRole("button", { name: /new lead/i }));
    await user.click(screen.getByRole("button", { name: /create lead/i }));
    expect(mockToastError).toHaveBeenCalledWith("Prospect name is required");
    expect(mutateModule.create).not.toHaveBeenCalled();
  });

  it("calls create and shows success toast on valid submit", async () => {
    vi.mocked(mutateModule.create).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);
    await user.click(screen.getByRole("button", { name: /new lead/i }));

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("Name"), "New Prospect");
    await user.click(within(dialog).getByRole("button", { name: /create lead/i }));

    await waitFor(() => {
      expect(mutateModule.create).toHaveBeenCalledWith("/api/leads", expect.objectContaining({ prospectName: "New Prospect" }));
      expect(mockToastSuccess).toHaveBeenCalledWith("Lead created");
    });
  });

  it("shows error toast when create fails", async () => {
    vi.mocked(mutateModule.create).mockResolvedValue({ ok: false, error: "Server error" });
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);
    await user.click(screen.getByRole("button", { name: /new lead/i }));

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("Name"), "New Prospect");
    await user.click(within(dialog).getByRole("button", { name: /create lead/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Server error");
    });
  });

  it("requires first booking date when conversion status is Converted", async () => {
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);
    await user.click(screen.getByRole("button", { name: /new lead/i }));

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("Name"), "Prospect");
    // Change conversion status to Converted
    await user.selectOptions(within(dialog).getByDisplayValue("Not Converted"), "Converted");
    // Don't fill first booking date
    await user.click(within(dialog).getByRole("button", { name: /create lead/i }));

    expect(mockToastError).toHaveBeenCalledWith("First booking date is required when lead is converted");
    expect(mutateModule.create).not.toHaveBeenCalled();
  });
});

describe("LeadsView — edit dialog", () => {
  it("opens edit dialog with pre-populated values", async () => {
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);

    // Open dropdown for LED-001 row
    const rows = screen.getAllByRole("row");
    const arjunRow = rows.find((r) => within(r).queryByText("Arjun Sharma"));
    const menuButton = within(arjunRow!).getByRole("button");
    await user.click(menuButton);
    await user.click(screen.getByRole("menuitem", { name: /edit/i }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByDisplayValue("Arjun Sharma")).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("9876543210")).toBeInTheDocument();
  });

  it("calls mutate on edit submit", async () => {
    vi.mocked(mutateModule.mutate).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);

    const rows = screen.getAllByRole("row");
    const arjunRow = rows.find((r) => within(r).queryByText("Arjun Sharma"));
    await user.click(within(arjunRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /edit/i }));

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mutateModule.mutate).toHaveBeenCalledWith("/api/leads/LED-001", expect.any(Object));
      expect(mockToastSuccess).toHaveBeenCalledWith("Lead updated");
    });
  });
});

describe("LeadsView — delete flow", () => {
  it("shows delete confirmation dialog", async () => {
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);

    const rows = screen.getAllByRole("row");
    const arjunRow = rows.find((r) => within(r).queryByText("Arjun Sharma"));
    await user.click(within(arjunRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));

    const alertDialog = screen.getByRole("alertdialog");
    expect(alertDialog).toBeInTheDocument();
    expect(within(alertDialog).getByText(/Arjun Sharma/)).toBeInTheDocument();
  });

  it("calls remove and shows success toast on confirm", async () => {
    vi.mocked(mutateModule.remove).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);

    const rows = screen.getAllByRole("row");
    const arjunRow = rows.find((r) => within(r).queryByText("Arjun Sharma"));
    await user.click(within(arjunRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(mutateModule.remove).toHaveBeenCalledWith("/api/leads/LED-001");
      expect(mockToastSuccess).toHaveBeenCalledWith("Lead for Arjun Sharma deleted");
    });
  });
});

describe("LeadsView — quick actions", () => {
  it("mark contacted calls mutate with correct payload", async () => {
    vi.mocked(mutateModule.mutate).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);

    const rows = screen.getAllByRole("row");
    const arjunRow = rows.find((r) => within(r).queryByText("Arjun Sharma"));
    await user.click(within(arjunRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /mark contacted/i }));

    await waitFor(() => {
      expect(mutateModule.mutate).toHaveBeenCalledWith("/api/leads/LED-001", { followUpStatus: "Contacted" });
    });
  });

  it("mark converted calls mutate with correct payload", async () => {
    vi.mocked(mutateModule.mutate).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<LeadsView leads={mockLeads} />);

    const rows = screen.getAllByRole("row");
    const arjunRow = rows.find((r) => within(r).queryByText("Arjun Sharma"));
    await user.click(within(arjunRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /mark converted/i }));

    await waitFor(() => {
      expect(mutateModule.mutate).toHaveBeenCalledWith("/api/leads/LED-001", { conversionStatus: "Converted" });
    });
  });
});
