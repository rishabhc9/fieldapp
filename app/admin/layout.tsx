import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isValidAdminSession, ADMIN_COOKIE_NAME } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidAdminSession(session)) {
    redirect('/admin/login');
  }

  return <>{children}</>;
}
