import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDownIcon } from './icons';
import './AquaSelect.css';

export interface AquaSelectOption<T extends string> {
  value: T;
  label: string;
}

interface AquaSelectProps<T extends string> {
  value: T;
  options: AquaSelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A custom dropdown/listbox styled as part of the Aqua Lens system —
 * translucent glass, soft blur, aqua tint, rounded organic shape, no sharp
 * borders, and a smooth open/close animation. Replaces the browser's
 * native `<select>` popup for the app's own dropdowns (Progress's
 * commitment filter, Settings' reminder-frequency/daily-refresh-time
 * pickers) — native `<select>` popups are rendered by the OS/browser
 * itself and can't be restyled at all, which is exactly the "looks like a
 * generic system dialog" problem this replaces.
 *
 * Built from scratch with plain button/ul/li rather than a dependency:
 * this app already avoids adding UI libraries for a single control (see
 * AppContext's "keep it simple" note), and the required behavior (toggle
 * open state, arrow-key navigation, click-outside/Escape to close) is
 * small enough to keep transparent here.
 */
export default function AquaSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  disabled,
  className,
}: AquaSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];
  const selectedIndex = options.findIndex((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function selectAt(index: number) {
    const clamped = Math.max(0, Math.min(options.length - 1, index));
    onChange(options[clamped].value);
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) selectAt(selectedIndex - 1);
    }
  }

  return (
    <div className={`aqua-select ${className ?? ''}`} ref={rootRef}>
      <button
        type="button"
        className={`aqua-select-trigger${open ? ' open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="aqua-select-value">{selected?.label}</span>
        <span className="aqua-select-chevron" aria-hidden="true">
          <ChevronDownIcon width={14} height={14} />
        </span>
      </button>

      {open && (
        <ul className="aqua-select-panel" role="listbox" id={listboxId} aria-label={ariaLabel} tabIndex={-1}>
          {options.map((opt) => (
            <li key={opt.value} role="none">
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className={`aqua-select-option${opt.value === value ? ' selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
