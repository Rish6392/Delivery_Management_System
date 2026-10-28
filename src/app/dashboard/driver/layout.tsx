export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppSidebar, DashboardShell, driverNavItems } from '@/components/Sidebar';

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const user = session.user as any;
  if (user.role !== 'DRIVER') redirect('/');

  return (
    <>
      <AppSidebar
        items={driverNavItems}
        user={{ name: user.name, email: user.email, role: user.role }}
      />
      <DashboardShell>{children}</DashboardShell>
    </>
  );
}
