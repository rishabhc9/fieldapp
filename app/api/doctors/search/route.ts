import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const sb = supabaseAdmin();

  // Uses the pg_trgm GIN index for fast fuzzy search across 14k+ rows.
  // ilike is simple and fast enough for prefix/contains; for even better
  // fuzzy matching, you can swap to a Postgres full-text search function.
  const { data, error } = await sb
    .from('doctors')
    .select('name')
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(30);

  if (error) {
    console.error('Doctor search error:', error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }

  return NextResponse.json({ results: (data ?? []).map((r) => r.name) });
}
