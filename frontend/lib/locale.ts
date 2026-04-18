export const SUPPORTED_LOCALES = ["en", "ar"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export function isArabicLocale(locale?: string): boolean {
  return locale === "ar";
}

export function setLocaleCookie(locale: AppLocale) {
  document.cookie = `locale=${locale}; path=/; max-age=31536000; samesite=lax`;
}
