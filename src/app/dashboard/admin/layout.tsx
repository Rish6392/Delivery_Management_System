export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppSidebar, DashboardShell, adminNavItems } from '@/components/Sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const user = session.user as any;
  if (!['ADMIN', 'DISPATCHER'].includes(user.role)) redirect('/');

  return (
    <>
      <AppSidebar
        items={adminNavItems}
        user={{ name: user.name, email: user.email, role: user.role }}
      />
      <DashboardShell>{children}</DashboardShell>
    </>
  );
}
