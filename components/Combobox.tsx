'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

type Props = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  name: string;
};

export default function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = 'Type to search…',
  required,
  name,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Snap the visible text back to the last committed value
        setQuery(value);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [query, options]);

  function commit(option: string) {
    onChange(option);
    setQuery(option);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlight]) commit(filtered[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery(value);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <label
        htmlFor={`${name}-input`}
        className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-moss/70"
      >
        {label}
        {required && <span className="text-clay"> *</span>}
      </label>

      <input
        id={`${name}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-[15px] text-ink shadow-sm outline-none transition focus:border-moss"
      />

      {/* Hidden input carries the committed value for native form semantics / no-JS fallback */}
      <input type="hidden" name={name} value={value} required={required} />

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-line bg-white shadow-lg"
        >
          {filtered.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-ink/50">No matches</li>
          )}
          {filtered.slice(0, 200).map((option, i) => (
            <li
              key={option}
              role="option"
              aria-selected={option === value}
              onMouseDown={(e) => {
                e.preventDefault();
                commit(option);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`cursor-pointer px-3 py-2 text-[14px] ${
                i === highlight ? 'bg-moss/10' : ''
              } ${option === value ? 'font-medium text-moss' : 'text-ink'}`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
