export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    const role = (session.user as any).role;
    switch (role) {
      case 'ADMIN':
      case 'DISPATCHER':
        redirect('/dashboard/admin');
      case 'DRIVER':
        redirect('/dashboard/driver');
      case 'CUSTOMER':
        redirect('/dashboard/customer');
      default:
        redirect('/login');
    }
  }

  redirect('/login');
}
