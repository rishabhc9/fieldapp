'use client';

import { useState } from 'react';
import Combobox from '@/components/Combobox';
import DoctorCombobox from '@/components/DoctorCombobox';
import PhotoUpload from '@/components/PhotoUpload';
import { BRANDS, REGIONS, SO_HQ, SO_NAMES } from '@/lib/constants';

type FormState = {
  region: string;
  soHq: string;
  soName: string;
  drName: string;
  brand: string;
};

const EMPTY: FormState = {
  region: '',
  soHq: '',
  soName: '',
  drName: '',
  brand: '',
};

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function FieldForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [photo, setPhoto] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function set(key: keyof FormState) {
    return (value: string) => setForm((f) => ({ ...f, [key]: value }));
  }

  function allFilled() {
    return (
      Object.values(form).every((v) => v.trim() !== '') && photo !== null
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allFilled()) return;

    setStatus('submitting');
    setErrorMsg('');

    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    if (photo) body.append('photo', photo);

    try {
      const res = await fetch('/api/submit', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Submission failed');
      setStatus('success');
      setForm(EMPTY);
      setPhoto(null);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4">
        <div className="w-full max-w-md rounded-xl border border-line bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-4xl">✓</div>
          <h2 className="font-display text-xl font-bold text-moss">
            Visit logged successfully
          </h2>
          <p className="mt-2 text-sm text-ink/60">
            Your Registration has been saved.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-6 rounded-md bg-moss px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-moss/90"
          >
            Register Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-10">
      {/* Header */}
      <div className="mx-auto mb-8 max-w-md">
        <p className="font-mono text-[11px] uppercase tracking-widest text-moss/60">
          
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">
          Ceramic Plate Photo Registration
        </h1>
        <div className="mt-3 h-px w-12 bg-clay" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-md space-y-5 rounded-xl border border-line bg-white p-6 shadow-sm"
      >
        {/* Region */}
        <Combobox
          label="Region"
          name="region"
          options={REGIONS}
          value={form.region}
          onChange={set('region')}
          required
        />

        {/* SO HQ */}
        <Combobox
          label="SO HQ"
          name="soHq"
          options={SO_HQ}
          value={form.soHq}
          onChange={set('soHq')}
          required
        />

        {/* SO Name */}
        <Combobox
          label="SO Name"
          name="soName"
          options={SO_NAMES}
          value={form.soName}
          onChange={set('soName')}
          required
        />

        {/* Dr Name — async type-ahead */}
        <DoctorCombobox
          name="drName"
          value={form.drName}
          onChange={set('drName')}
          required
        />

        {/* Brand */}
        <div>
          <label
            htmlFor="brand-select"
            className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-moss/70"
          >
            Brand <span className="text-clay">*</span>
          </label>
          <select
            id="brand-select"
            name="brand"
            value={form.brand}
            onChange={(e) => set('brand')(e.target.value)}
            required
            className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-[15px] text-ink shadow-sm outline-none transition focus:border-moss"
          >
            <option value="" disabled>
              Select a brand…
            </option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Photo */}
        <PhotoUpload file={photo} onChange={setPhoto} required />

        {/* Error */}
        {status === 'error' && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!allFilled() || status === 'submitting'}
          className="mt-2 w-full rounded-md bg-clay px-4 py-3 font-display text-[15px] font-bold text-white shadow-sm transition hover:bg-clay/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === 'submitting' ? 'Saving…' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
