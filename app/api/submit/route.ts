export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const REQUIRED = ['region', 'soHq', 'soName', 'drName', 'brand'] as const;
const BUCKET = 'visit-photos';
const MAX_FILE_MB = 10;

type SubmissionInsert = {
  region: string;
  so_hq: string;
  so_name: string;
  dr_name: string;
  brand: string;
  photo_path: string;
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const values: Record<string, string> = {};
    for (const key of REQUIRED) {
      const v = formData.get(key);
      if (!v || typeof v !== 'string' || !v.trim()) {
        return NextResponse.json(
          { error: `Missing required field: ${key}` },
          { status: 400 }
        );
      }
      values[key] = v.trim();
    }

    const photoFile = formData.get('photo');
    if (!photoFile || !(photoFile instanceof File)) {
      return NextResponse.json({ error: 'Photo is required' }, { status: 400 });
    }
    if (photoFile.size > MAX_FILE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Photo must be under ${MAX_FILE_MB}MB` },
        { status: 400 }
      );
    }

    const sb = supabaseAdmin();

    const ext = photoFile.name.split('.').pop() ?? 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await photoFile.arrayBuffer());

    const { error: uploadError } = await sb.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: photoFile.type || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Photo upload failed. Please try again.' },
        { status: 500 }
      );
    }

    const row: SubmissionInsert = {
      region: values.region,
      so_hq: values.soHq,
      so_name: values.soName,
      dr_name: values.drName,
      brand: values.brand,
      photo_path: path,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await sb.from('submissions').insert(row as any);

    if (insertError) {
      console.error('DB insert error:', insertError);
      await sb.storage.from(BUCKET).remove([path]);
      return NextResponse.json(
        { error: 'Could not save record. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Unexpected error in /api/submit:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
