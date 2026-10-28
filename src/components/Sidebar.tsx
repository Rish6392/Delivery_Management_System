'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Truck, Users, Car,
  ClipboardList, BarChart3, LogOut, ChevronLeft, ChevronRight,
  Menu, Shield,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface SidebarProps {
  items: NavItem[];
  user: { name: string; email: string; role: string };
}

/* ─── Desktop sidebar ──────────────────────────────────────────── */

function DesktopSidebar({ items, user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed inset-y-0 left-0 z-30 border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-sidebar-border">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 font-bold text-sidebar-foreground">
            <Truck className="h-5 w-5 text-primary" />
            <span>FleetFlow</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* User */}
      <div className={cn('flex items-center gap-3 px-3 py-3', collapsed && 'justify-center')}>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-medium truncate text-sidebar-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.role}</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const link = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger render={link} />
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }
          return link;
        })}
      </nav>

      {/* Sign out */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full justify-start gap-3 text-muted-foreground hover:text-destructive',
            collapsed && 'justify-center px-0'
          )}
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </div>
    </aside>
  );
}

/* ─── Mobile sidebar (Sheet) ───────────────────────────────────── */

function MobileSidebar({ items, user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden fixed top-3 left-3 z-40">
            <Menu className="h-5 w-5" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-60 p-0 bg-sidebar">
        <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2 font-bold text-sidebar-foreground">
            <Truck className="h-5 w-5 text-primary" />
            <span>FleetFlow</span>
          </Link>
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.role}</p>
          </div>
        </div>

        <Separator />

        <nav className="flex-1 py-2 px-2 space-y-0.5">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-sidebar-border mt-auto">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Combined export ──────────────────────────────────────────── */

export function AppSidebar(props: SidebarProps) {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
}

/* ─── Dashboard Shell (layout wrapper) ─────────────────────────── */

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* The sidebar is fixed, so main content gets a left margin on md+ */}
      <main className="md:ml-60 p-4 sm:p-6 lg:p-8 min-h-screen">{children}</main>
    </div>
  );
}

/* ─── Navigation configs ───────────────────────────────────────── */

export const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Shipments', href: '/dashboard/admin/shipments', icon: Package },
  { label: 'Assignments', href: '/dashboard/admin/assignments', icon: ClipboardList },
  { label: 'Drivers', href: '/dashboard/admin/drivers', icon: Users },
  { label: 'Vehicles', href: '/dashboard/admin/vehicles', icon: Car },
  { label: 'Customers', href: '/dashboard/admin/customers', icon: Shield },
  { label: 'Reports', href: '/dashboard/admin/reports', icon: BarChart3 },
];

export const driverNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/driver', icon: LayoutDashboard },
  { label: 'My Deliveries', href: '/dashboard/driver/deliveries', icon: Package },
];

export const customerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/customer', icon: LayoutDashboard },
  { label: 'My Shipments', href: '/dashboard/customer/shipments', icon: Package },
  { label: 'New Shipment', href: '/dashboard/customer/shipments/new', icon: ClipboardList },
];
