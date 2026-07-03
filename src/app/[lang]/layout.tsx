import { notFound } from 'next/navigation';
import { getDictionary, hasLocale, type Locale } from './dictionaries';
import { DictionaryProvider } from '@/lib/i18n/dictionary-context';

export async function generateStaticParams() {
  return [{ lang: 'th' }, { lang: 'en' }];
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang as Locale);

  return (
    <DictionaryProvider dict={dict} lang={lang as Locale}>
      {children}
    </DictionaryProvider>
  );
}
