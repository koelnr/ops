import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockComplaints, mockWorkers } from "@/test/fixtures";

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

import { ComplaintsView } from "@/components/views/complaints-view";
import * as mutateModule from "@/lib/mutate";

beforeEach(() => vi.clearAllMocks());

describe("ComplaintsView — table rendering", () => {
  it("renders all complaint rows", () => {
    render(<ComplaintsView complaints={mockComplaints} workers={mockWorkers} />);
    expect(screen.getByText("Worker arrived 45 minutes late")).toBeInTheDocument();
    expect(screen.getByText("Missed spots on the hood")).toBeInTheDocument();
  });

  it("shows unresolved count in header", () => {
    render(<ComplaintsView complaints={mockComplaints} workers={mockWorkers} />);
    // CMP-002 is Open → 1 unresolved
    expect(screen.getByText(/1 unresolved/)).toBeInTheDocument();
  });

  it("shows empty state when no results match", async () => {
    const user = userEvent.setup();
    render(<ComplaintsView complaints={mockComplaints} workers={mockWorkers} />);
    await user.type(screen.getByPlaceholderText(/search/i), "zzznomatch");
    expect(screen.getByText("No complaints match your filters.")).toBeInTheDocument();
  });
});

describe("ComplaintsView — search and filters", () => {
  it("filters by customer name", async () => {
    const user = userEvent.setup();
    render(<ComplaintsView complaints={mockComplaints} workers={mockWorkers} />);
    await user.type(screen.getByPlaceholderText(/search/i), "Priya");
    expect(screen.getByText("Worker arrived 45 minutes late")).toBeInTheDocument();
    expect(screen.queryByText("Missed spots on the hood")).not.toBeInTheDocument();
  });

  it("status filter narrows results", async () => {
    const user = userEvent.setup();
    render(<ComplaintsView complaints={mockComplaints} workers={mockWorkers} />);
    await user.selectOptions(screen.getByDisplayValue("Resolution status"), "Resolved");
    expect(screen.getByText("Worker arrived 45 minutes late")).toBeInTheDocument();
    expect(screen.queryByText("Missed spots on the hood")).not.toBeInTheDocument();
  });

  it("type filter narrows results", async () => {
    const user = userEvent.setup();
    render(<ComplaintsView complaints={mockComplaints} workers={mockWorkers} />);
    await user.selectOptions(screen.getByDisplayValue("Complaint type"), "Service Quality");
    expect(screen.getByText("Missed spots on the hood")).toBeInTheDocument();
    expect(screen.queryByText("Worker arrived 45 minutes late")).not.toBeInTheDocument();
  });
});

describe("ComplaintsView — create dialog", () => {
  it("opens create dialog when New Complaint is clicked", async () => {
    const user = userEvent.setup();
    render(<ComplaintsView complaints={mockComplaints} workers={mockWorkers} />);
    await user.click(screen.getByRole("button", { name: /new complaint/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("blocks submit when required fields are empty", async () => {
    const user = userEvent.setup();
    render(<ComplaintsView complaints={mockComplaints} workers={mockWorkers} />);
    await user.click(screen.getByRole("button", { name: /new complaint/i }));
    await user.click(screen.getByRole("button", { name: /create complaint/i }));
    expect(mockToastError).toHaveBeenCalledWith("Customer name and complaint details are required");
    expect(mutateModule.create).not.toHaveBeenCalled();
  });

  it("calls create on valid submit", async () => {
    vi.mocked(mutateModule.create).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ComplaintsView complaints={mockComplaints} workers={mockWorkers} />);
    await user.click(screen.getByRole("button", { name: /new complaint/i }));

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("Name"), "New Customer");
    await user.type(within(dialog).getByPlaceholderText("Describe the complaint…"), "Water marks left");

    await user.click(within(dialog).getByRole("button", { name: /create complaint/i }));

    await waitFor(() => {
      expect(mutateModule.create).toHaveBeenCalledWith("/api/complaints", expect.objectContaining({
        customerName: "New Customer",
        complaintDetails: "Water marks left",
      }));
      expect(mockToastSuccess).toHaveBeenCalledWith("Complaint created");
    });
  });
});

describe("ComplaintsView — edit dialog", () => {
  it("opens edit dialog with pre-populated values", async () => {
    const user = userEvent.setup();
    render(<ComplaintsView complaints={mockComplaints} workers={mockWorkers} />);

    const rows = screen.getAllByRole("row");
    const priyaRow = rows.find((r) => within(r).queryByText("Worker arrived 45 minutes late"));
    await user.click(within(priyaRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /edit/i }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByDisplayValue("BKG-002")).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("Priya Nair")).toBeInTheDocument();
  });

  it("calls mutate on edit submit", async () => {
    vi.mocked(mutateModule.mutate).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ComplaintsView complaints={mockComplaints} workers={mockWorkers} />);

    const rows = screen.getAllByRole("row");
    const priyaRow = rows.find((r) => within(r).queryByText("Worker arrived 45 minutes late"));
    await user.click(within(priyaRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /edit/i }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mutateModule.mutate).toHaveBeenCalledWith("/api/complaints/CMP-001", expect.any(Object));
      expect(mockToastSuccess).toHaveBeenCalledWith("Complaint updated");
    });
  });
});

describe("ComplaintsView — quick actions", () => {
  it("mark resolved calls mutate with correct payload", async () => {
    vi.mocked(mutateModule.mutate).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ComplaintsView complaints={mockComplaints} workers={mockWorkers} />);

    const rows = screen.getAllByRole("row");
    const arjunRow = rows.find((r) => within(r).queryByText("Missed spots on the hood"));
    await user.click(within(arjunRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /mark resolved/i }));

    await waitFor(() => {
      expect(mutateModule.mutate).toHaveBeenCalledWith("/api/complaints/CMP-002", { resolutionStatus: "Resolved" });
    });
  });

  it("escalate calls mutate with Escalated status", async () => {
    vi.mocked(mutateModule.mutate).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ComplaintsView complaints={mockComplaints} workers={mockWorkers} />);

    const rows = screen.getAllByRole("row");
    const arjunRow = rows.find((r) => within(r).queryByText("Missed spots on the hood"));
    await user.click(within(arjunRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /escalate/i }));

    await waitFor(() => {
      expect(mutateModule.mutate).toHaveBeenCalledWith("/api/complaints/CMP-002", { resolutionStatus: "Escalated" });
    });
  });
});

describe("ComplaintsView — delete flow", () => {
  it("shows delete confirmation and calls remove", async () => {
    vi.mocked(mutateModule.remove).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ComplaintsView complaints={mockComplaints} workers={mockWorkers} />);

    const rows = screen.getAllByRole("row");
    const arjunRow = rows.find((r) => within(r).queryByText("Missed spots on the hood"));
    await user.click(within(arjunRow!).getByRole("button"));
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(mutateModule.remove).toHaveBeenCalledWith("/api/complaints/CMP-002");
    });
  });
});
