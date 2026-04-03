import { vi } from "vitest";

export const mockPush = vi.fn();
export const mockRefresh = vi.fn();
export const mockReplace = vi.fn();

export const mockRouter = {
  push: mockPush,
  refresh: mockRefresh,
  replace: mockReplace,
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
