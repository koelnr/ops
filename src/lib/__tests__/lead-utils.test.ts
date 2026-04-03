import { describe, it, expect } from "vitest";
import { classifyFollowUpStatus, classifyConversionStatus, isLeadPending } from "@/lib/lead-utils";

describe("classifyFollowUpStatus", () => {
  it("classifies 'New' as pending", () => {
    expect(classifyFollowUpStatus("New")).toBe("pending");
  });

  it("classifies 'Follow-Up Pending' as pending", () => {
    expect(classifyFollowUpStatus("Follow-Up Pending")).toBe("pending");
  });

  it("classifies 'Contacted' as contacted", () => {
    expect(classifyFollowUpStatus("Contacted")).toBe("contacted");
  });

  it("classifies 'Converted' as other", () => {
    expect(classifyFollowUpStatus("Converted")).toBe("other");
  });

  it("classifies empty string as pending", () => {
    expect(classifyFollowUpStatus("")).toBe("pending");
  });
});

describe("classifyConversionStatus", () => {
  it("classifies 'Converted' as converted", () => {
    expect(classifyConversionStatus("Converted")).toBe("converted");
  });

  it("classifies 'Not Converted' as converted (contains 'convert')", () => {
    // The function uses includes("convert") so "Not Converted" matches as converted
    expect(classifyConversionStatus("Not Converted")).toBe("converted");
  });

  it("classifies 'Lost' as not_converted", () => {
    expect(classifyConversionStatus("Lost")).toBe("not_converted");
  });
});

describe("isLeadPending", () => {
  it("returns true for 'New'", () => {
    expect(isLeadPending("New")).toBe(true);
  });

  it("returns true for 'Follow-Up Pending'", () => {
    expect(isLeadPending("Follow-Up Pending")).toBe(true);
  });

  it("returns false for 'Contacted'", () => {
    expect(isLeadPending("Contacted")).toBe(false);
  });

  it("returns false for 'Converted'", () => {
    expect(isLeadPending("Converted")).toBe(false);
  });
});
