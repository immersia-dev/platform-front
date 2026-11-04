import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';

type FilterSelectOption = {
  value: string;
  label: string;
};

type FilterSelectProps = {
  value: string;
  options: FilterSelectOption[];
  ariaLabel: string;
  onChange: (value: string) => void;
};

export default function FilterSelect({
  value,
  options,
  ariaLabel,
  onChange,
}: FilterSelectProps) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? '';

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="table-filter-trigger" aria-label={ariaLabel}>
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="h-4 w-4 text-white/45" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content sideOffset={10} align="end" className="table-filter-menu">
          {options.map((option) => {
            const isActive = option.value === value;

            return (
              <DropdownMenu.Item
                key={option.value}
                onSelect={() => {
                  onChange(option.value);
                }}
                className={[
                  'table-filter-option',
                  isActive ? 'table-filter-option-active' : '',
                ].join(' ')}
              >
                <span className="truncate">{option.label}</span>
                {isActive ? <Check className="h-4 w-4" /> : null}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
