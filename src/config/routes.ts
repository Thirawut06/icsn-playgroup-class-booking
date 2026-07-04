import type { Locale } from '@/app/[lang]/dictionaries';

export function localizedRoute(lang: Locale | string, path: string) {
  return `/${lang}${path}`;
}

export const ROUTES = {
  HOME: (lang: string) => `/${lang}`,
  ADMIN: '/admin',
  LOGIN: (lang: string, tab?: 'login' | 'signup') => tab ? `/${lang}/login?tab=${tab}` : `/${lang}/login`,
  APPLY: (lang: string) => `/${lang}/apply`,
  APPLY_ADD_CHILD: (lang: string) => `/${lang}/apply?addChild=true`,
  BOOK: (lang: string) => `/${lang}/book`,
};
