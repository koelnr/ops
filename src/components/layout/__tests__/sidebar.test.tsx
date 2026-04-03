import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";

// matchMedia is not implemented in jsdom
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

const mockPathname = vi.fn(() => "/");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

function renderSidebar() {
  return render(
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>,
  );
}

describe("AppSidebar — nav items", () => {
  it("renders all navigation links", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /bookings/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /payments/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /customers/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /workers/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /leads/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /complaints/i })).toBeInTheDocument();
  });

  it("renders correct hrefs for each link", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /overview/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /bookings/i })).toHaveAttribute("href", "/bookings");
    expect(screen.getByRole("link", { name: /payments/i })).toHaveAttribute("href", "/payments");
    expect(screen.getByRole("link", { name: /customers/i })).toHaveAttribute("href", "/customers");
    expect(screen.getByRole("link", { name: /workers/i })).toHaveAttribute("href", "/workers");
    expect(screen.getByRole("link", { name: /leads/i })).toHaveAttribute("href", "/leads");
    expect(screen.getByRole("link", { name: /complaints/i })).toHaveAttribute("href", "/complaints");
  });

  it("renders the brand name", () => {
    renderSidebar();
    expect(screen.getByText("Koelnr")).toBeInTheDocument();
  });
});

describe("AppSidebar — active state", () => {
  it("marks the current route link as active", () => {
    mockPathname.mockReturnValue("/bookings");
    renderSidebar();
    expect(screen.getByRole("link", { name: /bookings/i })).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("does not mark other links as active", () => {
    mockPathname.mockReturnValue("/bookings");
    renderSidebar();
    expect(screen.getByRole("link", { name: /overview/i })).not.toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByRole("link", { name: /payments/i })).not.toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("marks overview as active on root path", () => {
    mockPathname.mockReturnValue("/");
    renderSidebar();
    expect(screen.getByRole("link", { name: /overview/i })).toHaveAttribute(
      "data-active",
      "true",
    );
  });
});
