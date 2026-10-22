import { describe, expect, it } from "vitest";
import { formatIndianPhone, normalizeIndianPhone } from "./phone";

describe("normalizeIndianPhone", () => {
  it("accepts common ways of writing a mobile number", () => {
    for (const input of ["9876543210", "98765 43210", "+91 98765 43210", "91-9876543210", "09876543210", "(98765) 43210"]) {
      expect(normalizeIndianPhone(input)).toBe("+919876543210");
    }
  });

  it("rejects numbers that can't be Indian mobiles", () => {
    for (const input of ["", "12345", "5876543210", "98765432101", "+1 415 555 0100", "abcdefghij", "+91 12345 67890"]) {
      expect(normalizeIndianPhone(input)).toBeNull();
    }
  });

  it("formats for display", () => {
    expect(formatIndianPhone("+919876543210")).toBe("+91 98765 43210");
  });
});
