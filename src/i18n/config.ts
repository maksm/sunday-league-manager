export const locales = ['en', 'sl'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export function getLocale(): Locale {
  const locale = process.env.NEXT_PUBLIC_LOCALE;
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale;
  }
  return defaultLocale;
}
