/* eslint-disable @typescript-eslint/no-require-imports */
const locale = (process.env.NEXT_PUBLIC_LOCALE || 'en') as 'en' | 'sl';

// Import translations at build time based on locale
const translations =
  locale === 'sl' ? require('./locales/sl').default : require('./locales/en').default;
/* eslint-enable @typescript-eslint/no-require-imports */

export function useTranslations() {
  return translations;
}

export function t(key: string): string {
  const keys = key.split('.');
  let value: unknown = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
}
