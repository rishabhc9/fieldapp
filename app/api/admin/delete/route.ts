export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidAdminSession, ADMIN_COOKIE_NAME } from '@/lib/adminAuth';

export async function DELETE(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isValidAdminSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, photoPath } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const sb = supabaseAdmin();

  if (photoPath) {
    await sb.storage.from('visit-photos').remove([photoPath]);
  }

  const { error } = await sb.from('submissions').delete().eq('id', id);
  if (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
