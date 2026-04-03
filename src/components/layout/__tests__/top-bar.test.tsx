import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

function renderTopBar(defaultOpen = true) {
  return render(
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <TopBar />
    </SidebarProvider>,
  );
}

describe("TopBar — sidebar trigger", () => {
  it("renders the sidebar toggle button", () => {
    renderTopBar();
    expect(screen.getByRole("button", { name: /toggle sidebar/i })).toBeInTheDocument();
  });

  it("renders the page title", () => {
    renderTopBar();
    expect(screen.getByText("Internal Operations")).toBeInTheDocument();
  });

  it("collapses the sidebar when toggle is clicked while open", async () => {
    const user = userEvent.setup();
    const { container } = renderTopBar(true);
    const sidebar = container.querySelector("[data-slot='sidebar']");
    expect(sidebar).toHaveAttribute("data-state", "expanded");
    await user.click(screen.getByRole("button", { name: /toggle sidebar/i }));
    expect(sidebar).toHaveAttribute("data-state", "collapsed");
  });

  it("expands the sidebar when toggle is clicked while collapsed", async () => {
    const user = userEvent.setup();
    const { container } = renderTopBar(false);
    const sidebar = container.querySelector("[data-slot='sidebar']");
    expect(sidebar).toHaveAttribute("data-state", "collapsed");
    await user.click(screen.getByRole("button", { name: /toggle sidebar/i }));
    expect(sidebar).toHaveAttribute("data-state", "expanded");
  });
});
