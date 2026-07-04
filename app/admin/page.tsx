'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { REGIONS } from '@/lib/constants';

type Row = {
  id: string;
  region: string;
  so_hq: string;
  so_name: string;
  dr_name: string;
  brand: string;
  photo_path: string | null;
  photoUrl: string | null;
  created_at: string;
};

type ApiResp = {
  rows: Row[];
  total: number;
  pageSize: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), search, region: regionFilter });
    const res = await fetch(`/api/admin/submissions?${params}`);
    if (res.status === 401) { router.replace('/admin/login'); return; }
    if (!res.ok) { setError('Failed to load submissions'); setLoading(false); return; }
    setData(await res.json());
    setLoading(false);
  }, [page, search, regionFilter, router]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(row: Row) {
    setDeleting(row.id);
    const res = await fetch('/api/admin/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, photoPath: row.photo_path }),
    });
    if (res.ok) {
      setConfirmId(null);
      await load();
    } else {
      alert('Failed to delete. Please try again.');
    }
    setDeleting(null);
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
  }

  function exportCSV() {
    if (!data) return;
    const headers = ['ID', 'Submitted', 'Region', 'SO HQ', 'SO Name', 'Dr Name', 'Brand', 'Photo'];
    const rows = data.rows.map((r) => [
      r.id, new Date(r.created_at).toLocaleString(), r.region, r.so_hq,
      r.so_name, r.dr_name, r.brand, r.photoUrl ?? '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div className="min-h-screen bg-paper">
      {/* Confirm delete modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
          <div className="w-full max-w-sm rounded-xl border border-line bg-white p-6 shadow-xl">
            <h2 className="font-display text-lg font-bold text-ink">Delete submission?</h2>
            <p className="mt-2 text-sm text-ink/60">This will permanently remove the record and its photo. This cannot be undone.</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const row = data?.rows.find((r) => r.id === confirmId);
                  if (row) handleDelete(row);
                }}
                disabled={deleting === confirmId}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting === confirmId ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-10 border-b border-line bg-white px-4 py-3 shadow-sm md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-moss/60">Admin</p>
            <h1 className="font-display text-xl font-bold text-ink">Submissions</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-xs text-ink/50 md:block">{data ? `${data.total} total` : '—'}</span>
            <button onClick={exportCSV} disabled={!data || data.rows.length === 0}
              className="rounded-md border border-line bg-white px-3 py-1.5 font-mono text-xs text-ink transition hover:border-moss hover:text-moss disabled:opacity-40">
              Export CSV
            </button>
            <button onClick={logout}
              className="rounded-md bg-ink px-3 py-1.5 font-mono text-xs text-paper transition hover:bg-ink/80">
              Sign out
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input type="search" placeholder="Search Dr name or SO name…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="min-w-0 flex-1 rounded-md border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-moss" />
          <select value={regionFilter} onChange={(e) => { setRegionFilter(e.target.value); setPage(1); }}
            className="rounded-md border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-moss">
            <option value="">All regions</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </header>

      <main className="px-4 py-6 md:px-8">
        {loading && <p className="py-12 text-center font-mono text-sm text-ink/40">Loading…</p>}
        {error && <p className="py-12 text-center font-mono text-sm text-red-600">{error}</p>}
        {!loading && data && data.rows.length === 0 && (
          <p className="py-12 text-center font-mono text-sm text-ink/40">No submissions found.</p>
        )}

        {!loading && data && data.rows.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-line bg-white shadow-sm md:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line bg-paper/60">
                    {['Date', 'Region', 'SO HQ', 'SO Name', 'Dr Name', 'Brand', 'Photo', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-ink/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, i) => (
                    <tr key={row.id} className={`border-b border-line/60 transition hover:bg-paper/60 ${i % 2 === 0 ? '' : 'bg-paper/30'}`}>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink/60">
                        {new Date(row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <br /><span className="text-[10px]">{new Date(row.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-4 py-3">{row.region}</td>
                      <td className="px-4 py-3">{row.so_hq}</td>
                      <td className="px-4 py-3">{row.so_name}</td>
                      <td className="px-4 py-3 font-medium">{row.dr_name}</td>
                      <td className="px-4 py-3 text-sm text-ink/80">{row.brand}</td>
                      <td className="px-4 py-3">
                        {row.photoUrl ? (
                          <button onClick={() => setLightbox(row.photoUrl!)} className="block overflow-hidden rounded border border-line hover:border-clay">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={row.photoUrl} alt="Visit photo" className="h-12 w-16 object-cover" />
                          </button>
                        ) : <span className="text-xs text-ink/30">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setConfirmId(row.id)}
                          className="rounded-md border border-red-200 px-2.5 py-1 font-mono text-xs text-red-600 transition hover:bg-red-50 hover:border-red-400"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {data.rows.map((row) => (
                <div key={row.id} className="rounded-xl border border-line bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-moss">{row.dr_name}</p>
                      <p className="mt-0.5 text-sm text-ink/70">{row.so_name}</p>
                    </div>
                    {row.photoUrl && (
                      <button onClick={() => setLightbox(row.photoUrl!)} className="flex-shrink-0 overflow-hidden rounded border border-line">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={row.photoUrl} alt="Visit photo" className="h-14 w-20 object-cover" />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/60">
                    <span>{row.region}</span><span>{row.so_hq}</span>
                    <span>{row.brand}</span>
                    <span>{new Date(row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => setConfirmId(row.id)}
                      className="rounded-md border border-red-200 px-3 py-1 font-mono text-xs text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="font-mono text-xs text-ink/50">Page {page} of {totalPages} · {data.total} records</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="rounded-md border border-line px-3 py-1.5 font-mono text-xs disabled:opacity-40">← Prev</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="rounded-md border border-line px-3 py-1.5 font-mono text-xs disabled:opacity-40">Next →</button>
              </div>
            </div>
          </>
        )}
      </main>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Full size" className="max-h-[90vh] max-w-full rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setLightbox(null)} className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40">✕</button>
        </div>
      )}
    </div>
  );
}
