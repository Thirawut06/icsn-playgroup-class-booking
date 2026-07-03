"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import type { Dictionary, Locale } from '@/app/[lang]/dictionaries';

interface DictionaryContextProps {
  dict: Dictionary;
  lang: Locale;
}

const DictionaryContext = createContext<DictionaryContextProps | undefined>(undefined);

export function DictionaryProvider({ children, dict, lang }: { children: ReactNode; dict: Dictionary; lang: Locale }) {
  return (
    <DictionaryContext.Provider value={{ dict, lang }}>
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDictionary() {
  const context = useContext(DictionaryContext);
  if (context === undefined) {
    throw new Error('useDictionary must be used within a DictionaryProvider');
  }
  return context;
}
