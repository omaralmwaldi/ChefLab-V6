import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const SUPPORTED_LOCALES = ["en", "ar"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

export default getRequestConfig(async () => {
  const localeCookie = cookies().get("locale")?.value;
  const locale: Locale =
    localeCookie && SUPPORTED_LOCALES.includes(localeCookie as Locale)
      ? (localeCookie as Locale)
      : "en";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
