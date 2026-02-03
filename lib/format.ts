/**
 * Format cents as USD (e.g. 12345 -> "$123.45", -12345 -> "-$123.45")
 */
export function formatMoney(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Parse dollar input to cents. Returns null if invalid.
 * Handles: "20" => 2000, "20.5" => 2050, "20.50" => 2050, "$20.50" => 2050.
 * Rejects negatives, NaN, and empty.
 */
export function parseMoneyToCents(value: string): number | null {
  const cleaned = value.replace(/[$,]/g, "").trim();
  if (cleaned === "") return null;
  const num = parseFloat(cleaned);
  if (Number.isNaN(num) || num < 0) return null;
  return Math.round(num * 100);
}
