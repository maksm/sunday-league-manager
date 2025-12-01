/* eslint-disable @typescript-eslint/no-require-imports */
import { getLocale } from './config';

// Server-side translation helper for API routes
export async function getServerTranslations() {
  const locale = getLocale();
  const dict = locale === 'sl' ? require('./locales/sl').default : require('./locales/en').default;
  return dict;
}
/* eslint-enable @typescript-eslint/no-require-imports */

export function t(
  dict: Record<string, unknown>,
  key: string,
  replacements?: Record<string, string>
): string {
  const keys = key.split('.');
  let value: unknown = dict;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  let result = typeof value === 'string' ? value : key;

  // Handle replacements like {name}, {min}, etc.
  if (replacements) {
    Object.entries(replacements).forEach(([k, v]) => {
      result = result.replace(`{${k}}`, v);
    });
  }

  return result;
}
