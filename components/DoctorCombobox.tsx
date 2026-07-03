'use client';

import { useEffect, useId, useRef, useState } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  name: string;
};

export default function DoctorCombobox({ value, onChange, required, name }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = useId();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [value]);

  function search(q: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (q.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/doctors/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setHighlight(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }

  function commit(name: string) {
    onChange(name);
    setQuery(name);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[highlight]) commit(results[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery(value);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <label
        htmlFor="dr-name-input"
        className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-moss/70"
      >
        Dr name
        {required && <span className="text-clay"> *</span>}
      </label>

      <input
        id="dr-name-input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Start typing a doctor's name…"
        value={query}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          setOpen(true);
          search(v);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-[15px] text-ink shadow-sm outline-none transition focus:border-moss"
      />

      <input type="hidden" name={name} value={value} required={required} />

      {open && query.trim().length >= 2 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-line bg-white shadow-lg"
        >
          {loading && (
            <li className="px-3 py-2.5 text-sm text-ink/50">Searching…</li>
          )}
          {!loading && results.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-ink/50">No matches</li>
          )}
          {!loading &&
            results.map((option, i) => (
              <li
                key={option + i}
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
      {open && query.trim().length < 2 && (
        <ul className="absolute z-20 mt-1 w-full overflow-auto rounded-md border border-line bg-white shadow-lg">
          <li className="px-3 py-2.5 text-sm text-ink/50">
            Keep typing — at least 2 letters
          </li>
        </ul>
      )}
    </div>
  );
}
