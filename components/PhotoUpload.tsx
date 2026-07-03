'use client';

import { useRef, useState } from 'react';

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
};

export default function PhotoUpload({ file, onChange, required }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(f: File | null) {
    onChange(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  return (
    <div>
      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-moss/70">
        Photo
        {required && <span className="text-clay"> *</span>}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {!preview && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line bg-white px-3 py-8 text-sm text-ink/60 transition hover:border-moss hover:text-moss"
        >
          <span className="font-medium">Tap to take or choose a photo</span>
          <span className="text-xs">JPG or PNG</span>
        </button>
      )}

      {preview && (
        <div className="relative overflow-hidden rounded-md border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Selected photo preview" className="max-h-64 w-full object-cover" />
          <button
            type="button"
            onClick={() => {
              handleFile(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="absolute right-2 top-2 rounded-md bg-ink/80 px-2.5 py-1 text-xs font-medium text-paper hover:bg-ink"
          >
            Remove
          </button>
        </div>
      )}

      {file && (
        <p className="mt-1 truncate font-mono text-xs text-ink/50">{file.name}</p>
      )}
    </div>
  );
}
