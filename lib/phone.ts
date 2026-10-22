/**
 * Indian mobile numbers: 10 digits starting 6-9. Accepts "98765 43210", "+91 98765 43210",
 * "91-9876543210" or "09876543210" and returns E.164 ("+919876543210"), or null if invalid.
 */
export function normalizeIndianPhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  let national: string | null = null;
  if (/^\+91\d{10}$/.test(digits)) national = digits.slice(3);
  else if (/^91\d{10}$/.test(digits)) national = digits.slice(2);
  else if (/^0\d{10}$/.test(digits)) national = digits.slice(1);
  else if (/^\d{10}$/.test(digits)) national = digits;
  if (!national || !/^[6-9]\d{9}$/.test(national)) return null;
  return `+91${national}`;
}

/** "+919876543210" -> "+91 98765 43210" for display. */
export function formatIndianPhone(e164: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return m ? `+91 ${m[1]} ${m[2]}` : e164;
}
