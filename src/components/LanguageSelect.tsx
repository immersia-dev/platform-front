import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';

import FlagIcon from './FlagIcon';
import { useLocale } from '../i18n/useLocale';
import type { Locale } from '../i18n/translations';

type LanguageSelectProps = {
  variant?: 'topbar' | 'login';
};

export default function LanguageSelect({ variant = 'topbar' }: LanguageSelectProps) {
  const { locale, localeOptions, setLocale } = useLocale();
  const currentLocale = localeOptions.find((option) => option.code === locale) ?? localeOptions[0];
  const isLoginVariant = variant === 'login';

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={isLoginVariant ? 'language-trigger language-trigger-login' : 'language-trigger'}
          aria-label="Selecionar idioma"
        >
          <FlagIcon code={currentLocale.flagCode} className="h-5 w-5 shrink-0" />
          <span
            className={[
              'min-w-0 truncate',
              isLoginVariant ? 'sm:hidden' : 'hidden',
            ].join(' ')}
            data-i18n-skip="true"
          >
            {currentLocale.nativeLabel}
          </span>
          <span className="hidden min-w-0 truncate sm:inline" data-i18n-skip="true">
            {currentLocale.label}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-white/45" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={10}
          align={isLoginVariant ? 'center' : 'end'}
          className="dropdown-panel"
        >
          <div className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
            Idioma
          </div>

          {localeOptions.map((option) => {
            const isActive = option.code === locale;

            return (
              <DropdownMenu.Item
                key={option.code}
                onSelect={() => setLocale(option.code as Locale)}
                className="dropdown-item justify-between"
              >
                <span className="flex items-center gap-3">
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/6"
                  >
                    <FlagIcon code={option.flagCode} className="h-6 w-6" />
                  </span>
                  <span data-i18n-skip="true">{option.label}</span>
                </span>
                {isActive ? <Check className="h-4 w-4 text-cyan-200" /> : null}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
