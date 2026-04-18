"use client";

import { useLocale, useTranslations } from "next-intl";
import { setLocaleCookie, type AppLocale } from "@/lib/locale";

export default function LanguageToggle() {
  const locale = useLocale();
  const t = useTranslations("nav");

  function switchLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return;
    setLocaleCookie(nextLocale);
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-1 rounded border border-gray-200 p-1">
      <span className="px-1 text-xs text-gray-500">{t("language")}</span>
      <button
        type="button"
        onClick={() => switchLocale("en")}
        className={
          locale === "en"
            ? "rounded bg-gray-900 px-2 py-1 text-xs text-white"
            : "rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
        }
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchLocale("ar")}
        className={
          locale === "ar"
            ? "rounded bg-gray-900 px-2 py-1 text-xs text-white"
            : "rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
        }
      >
        AR
      </button>
    </div>
  );
}
