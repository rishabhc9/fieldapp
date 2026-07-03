import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isValidAdminSession, ADMIN_COOKIE_NAME } from '@/lib/adminAuth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  // If there's no valid session, send to the login page.
  // The login page itself is outside this layout (it's /admin/login),
  // so it is never blocked.
  if (!isValidAdminSession(session)) {
    redirect('/admin/login');
  }

  return <>{children}</>;
}
