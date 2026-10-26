import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminRootPage() {
  const user = await getAuthenticatedUser('ADMIN');
  if (user && user.isStaff) {
    redirect('/admin/dashboard');
  } else {
    redirect('/admin/login');
  }
}
