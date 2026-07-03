import 'server-only';

const dictionaries = {
  th: () => import('./dictionaries/th.json').then((module) => module.default),
  en: () => import('./dictionaries/en.json').then((module) => module.default),
};

export type Locale = keyof typeof dictionaries;

export const hasLocale = (locale: string): locale is Locale => {
  return locale in dictionaries;
};

export const getDictionary = async (locale: Locale) => {
  if (!hasLocale(locale)) return dictionaries['th']();
  return dictionaries[locale]();
};

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
