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

vi.mock("@clerk/nextjs", () => ({
  useUser: vi.fn(() => ({ user: null })),
}));

function renderSidebar() {
  return render(
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>,
  );
}

describe("AppSidebar — non-admin user", () => {
  it("shows only Overview and Bookings", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /bookings/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /payments/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /customers/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /workers/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /leads/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /complaints/i })).not.toBeInTheDocument();
  });
});

describe("AppSidebar — admin user", () => {
  beforeAll(async () => {
    const clerk = await import("@clerk/nextjs");
    vi.mocked(clerk.useUser).mockReturnValue({
      user: { publicMetadata: { role: "admin" } },
    } as ReturnType<typeof clerk.useUser>);
  });

  it("shows all navigation links", () => {
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
});

describe("AppSidebar — brand", () => {
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
