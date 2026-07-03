export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const sb = supabaseAdmin();

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

  const results = (data as { name: string }[] ?? []).map((r) => r.name);
  return NextResponse.json({ results });
}
