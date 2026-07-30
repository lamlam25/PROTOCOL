/**
 * Arabic numerals (0-9) even in the bn locale, matching standard Bangladeshi
 * digital-product convention (see CLAUDE.md / plan) — force numberingSystem
 * rather than relying on each locale's Intl default.
 */
const NUMBERING_SYSTEM = "latn";

export function formatDate(
  date: string | Date,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
) {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    numberingSystem: NUMBERING_SYSTEM,
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    numberingSystem: NUMBERING_SYSTEM,
  }).format(value);
}

export function formatCurrency(
  value: number,
  locale: string,
  currency = "BDT"
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    numberingSystem: NUMBERING_SYSTEM,
    maximumFractionDigits: 0,
  }).format(value);
}
