import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@clerk/nextjs", () => ({
  UserButton: () => <div data-testid="user-button" />,
  useUser: vi.fn(() => ({ user: null })),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
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
    expect(
      screen.getByRole("button", { name: /toggle sidebar/i }),
    ).toBeInTheDocument();
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

describe("TopBar — dark mode toggle", () => {
  it("renders the dark mode toggle button", () => {
    renderTopBar();
    expect(
      screen.getByRole("button", { name: /toggle theme/i }),
    ).toBeInTheDocument();
  });

  it("clicking the dark mode toggle does not throw", async () => {
    const user = userEvent.setup();
    renderTopBar();
    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    // Toggle is still in the document after click
    expect(
      screen.getByRole("button", { name: /toggle theme/i }),
    ).toBeInTheDocument();
  });
});

describe("TopBar — user button", () => {
  it("renders the Clerk user button", () => {
    renderTopBar();
    expect(screen.getByTestId("user-button")).toBeInTheDocument();
  });
});
