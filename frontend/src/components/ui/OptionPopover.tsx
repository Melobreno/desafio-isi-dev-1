import React, { useCallback, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';

export interface OptionPopoverItem<V extends string | number> {
  value: V;
  label: string;
}

interface OptionPopoverProps<V extends string | number> {
  /** Text shown on the trigger button. */
  triggerLabel: React.ReactNode;
  triggerIcon?: React.ReactNode;
  title: string;
  options: OptionPopoverItem<V>[];
  value: V;
  onChange: (value: V) => void;
  align?: 'left' | 'right';
  width?: number;
  /** Highlights the trigger when a non-default option is selected. */
  isActive?: boolean;
}

/**
 * Single-choice popover (sort order, player filter) with outside-click closing.
 * Shared by the clubs list and the club transaction history.
 */
export function OptionPopover<V extends string | number>({
  triggerLabel,
  triggerIcon,
  title,
  options,
  value,
  onChange,
  align = 'left',
  width = 240,
  isActive = false,
}: OptionPopoverProps<V>) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const close = useCallback(() => setIsOpen(false), []);
  useClickOutside(anchorRef, close, isOpen);

  return (
    <div className="filter-popover-anchor" ref={anchorRef}>
      <button
        type="button"
        className={`filter-pill-btn${isActive ? ' active' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {triggerIcon}
        <span>{triggerLabel}</span>
        <ChevronDown size={13} className="filter-pill-chevron" />
      </button>

      {isOpen && (
        <div
          className={`filter-popover-panel${align === 'right' ? ' is-right' : ''}`}
          style={{ width }}
        >
          <div className="filter-popover-title">{title}</div>
          <div className="filter-popover-list" role="listbox">
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`filter-popover-option${selected ? ' selected' : ''}`}
                  onClick={() => {
                    onChange(option.value);
                    close();
                  }}
                >
                  <span>{option.label}</span>
                  {selected && <Check size={14} color="var(--primary)" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
