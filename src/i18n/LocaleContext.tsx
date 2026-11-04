import {
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { LocaleContext, type LocaleContextValue } from './localeContextObject';
import { defaultLocale, localeOptions, translateCopy, type Locale } from './translations';

const STORAGE_KEY = 'platform-safety.locale';

function isLocale(value: string | null): value is Locale {
  return localeOptions.some((option) => option.code === value);
}

function readStoredLocale() {
  if (typeof window === 'undefined') return defaultLocale;

  const storedLocale = window.localStorage.getItem(STORAGE_KEY);
  return isLocale(storedLocale) ? storedLocale : defaultLocale;
}

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }

    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      localeOptions,
      setLocale: setLocaleState,
      t: (source) => translateCopy(source, locale),
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
