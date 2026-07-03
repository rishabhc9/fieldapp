import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidAdminSession, ADMIN_COOKIE_NAME } from '@/lib/adminAuth';

const BUCKET = 'visit-photos';
const PAGE_SIZE = 25;

type Submission = {
  id: string;
  region: string;
  so_hq: string;
  so_name: string;
  dr_name: string;
  brand: string;
  photo_path: string | null;
  created_at: string;
};

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isValidAdminSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = req.nextUrl;
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const search = url.searchParams.get('search')?.trim() ?? '';
  const region = url.searchParams.get('region')?.trim() ?? '';

  const sb = supabaseAdmin();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = sb
    .from('submissions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`dr_name.ilike.%${search}%,so_name.ilike.%${search}%`);
  }
  if (region) {
    query = query.eq('region', region);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Submissions fetch error:', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  const rows = await Promise.all(
    ((data ?? []) as Submission[]).map(async (row) => {
      let photoUrl: string | null = null;
      if (row.photo_path) {
        const { data: signed } = await sb.storage
          .from(BUCKET)
          .createSignedUrl(row.photo_path, 60 * 60);
        photoUrl = signed?.signedUrl ?? null;
      }
      return { ...row, photoUrl };
    })
  );

  return NextResponse.json({ rows, total: count ?? 0, pageSize: PAGE_SIZE });
}