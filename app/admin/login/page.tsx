'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.replace('/admin');
    } else {
      const data = await res.json();
      setError(data.error ?? 'Incorrect password');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-moss/60">
            Admin Access
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink">
            Sign in
          </h1>
          <div className="mt-3 h-px w-10 bg-clay" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-line bg-white p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-moss/70"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-[15px] text-ink shadow-sm outline-none transition focus:border-moss"
              placeholder="Enter admin password"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-md bg-moss px-4 py-3 font-display text-[15px] font-bold text-white transition hover:bg-moss/90 disabled:opacity-40"
          >
            {loading ? 'Checking…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
