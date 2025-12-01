import { Locale } from './config';

type Dictionary = Record<string, unknown>;

const dictionaries: Record<string, () => Promise<Dictionary>> = {
  en: () => import('./locales/en').then((module) => module.default),
  sl: () => import('./locales/sl').then((module) => module.default),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
