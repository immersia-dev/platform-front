import { createContext } from 'react';

import type { Locale, localeOptions } from './translations';

export type LocaleContextValue = {
  locale: Locale;
  localeOptions: typeof localeOptions;
  setLocale: (locale: Locale) => void;
  t: (source: string) => string;
};

export const LocaleContext = createContext<LocaleContextValue | null>(null);
