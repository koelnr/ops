import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";

describe("formatCurrency", () => {
  it("formats whole rupee amounts", () => {
    expect(formatCurrency(500)).toBe("₹500");
  });

  it("formats amounts with thousands separator", () => {
    expect(formatCurrency(50000)).toMatch(/₹50,000/);
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("₹0");
  });
});

describe("formatDate", () => {
  it("formats ISO date string", () => {
    expect(formatDate("2026-03-05")).toMatch(/5 Mar 2026|Mar 5, 2026/);
  });

  it("returns em dash for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("returns em dash for undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });

  it("returns em dash for empty string", () => {
    expect(formatDate("")).toBe("—");
  });
});

describe("formatPercent", () => {
  it("calculates percentage correctly", () => {
    expect(formatPercent(7, 10)).toBe("70%");
  });

  it("handles 100%", () => {
    expect(formatPercent(10, 10)).toBe("100%");
  });

  it("handles 0%", () => {
    expect(formatPercent(0, 10)).toBe("0%");
  });
});
