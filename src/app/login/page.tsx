'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Shield,
  Users,
  Package,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Mail,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DemoUser {
  name: string;
  email: string;
  role: 'ADMIN' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER';
  roleDisplay: string;
  category: 'staff' | 'driver' | 'customer';
  detail: string;
  icon: typeof Shield;
  colorClass: string;
  bgClass: string;
}

const ALL_DEMO_USERS: DemoUser[] = [
  // Staff
  {
    name: 'Alice Admin',
    email: 'alice.admin@example.com',
    role: 'ADMIN',
    roleDisplay: 'Admin',
    category: 'staff',
    detail: 'Full system control, reports & analytics',
    icon: Shield,
    colorClass: 'text-violet-400',
    bgClass: 'bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20',
  },
  {
    name: 'Bob Dispatcher',
    email: 'bob.dispatcher@example.com',
    role: 'DISPATCHER',
    roleDisplay: 'Dispatcher',
    category: 'staff',
    detail: 'Fleet dispatch, assignments & vehicle routing',
    icon: Users,
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20',
  },
  // Drivers
  {
    name: 'Charlie Driver',
    email: 'charlie.driver@example.com',
    role: 'DRIVER',
    roleDisplay: 'Driver',
    category: 'driver',
    detail: 'Van deliveries (REG-101) • NYC Metro',
    icon: Truck,
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
  },
  {
    name: 'Dave Driver',
    email: 'dave.driver@example.com',
    role: 'DRIVER',
    roleDisplay: 'Driver',
    category: 'driver',
    detail: 'Truck logistics (REG-102) • Tri-State',
    icon: Truck,
    colorClass: 'text-teal-400',
    bgClass: 'bg-teal-500/10 border-teal-500/20 hover:bg-teal-500/20',
  },
  // Customers
  {
    name: 'Eve Customer',
    email: 'eve.customer@example.com',
    role: 'CUSTOMER',
    roleDisplay: 'Customer (CUST-001)',
    category: 'customer',
    detail: 'Acquired Tech • 100 Customer Lane, NY',
    icon: Package,
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20',
  },
  {
    name: 'Frank Customer',
    email: 'frank.customer@example.com',
    role: 'CUSTOMER',
    roleDisplay: 'Customer (CUST-002)',
    category: 'customer',
    detail: 'Apex Retail • 200 Commerce Blvd, NJ',
    icon: Package,
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20',
  },
  {
    name: 'Grace Customer',
    email: 'grace.customer@example.com',
    role: 'CUSTOMER',
    roleDisplay: 'Customer (CUST-003)',
    category: 'customer',
    detail: 'Global Logix • 300 Harbor Way, CT',
    icon: Package,
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20',
  },
];

type CategoryFilter = 'all' | 'customer' | 'driver' | 'staff';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggingInEmail, setLoggingInEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryFilter>('all');

  const executeSignIn = async (signInEmail: string, signInPass: string) => {
    setError('');
    setLoading(true);
    setLoggingInEmail(signInEmail);
    try {
      const result = await signIn('credentials', {
        email: signInEmail,
        password: signInPass,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Please make sure the database is seeded.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred during sign-in.');
    } finally {
      setLoading(false);
      setLoggingInEmail(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    await executeSignIn(email, password);
  };

  const handleDemoSelect = async (user: DemoUser) => {
    setEmail(user.email);
    setPassword('password123');
    await executeSignIn(user.email, 'password123');
  };

  const filteredUsers =
    activeTab === 'all'
      ? ALL_DEMO_USERS
      : ALL_DEMO_USERS.filter((u) => u.category === activeTab);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-background">
      {/* Dynamic ambient backgrounds */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Login Form */}
        <Card className="lg:col-span-5 flex flex-col justify-between border-border/60 shadow-xl backdrop-blur-sm bg-card/95">
          <div>
            <CardHeader className="text-center pb-4 pt-6">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20 text-primary shadow-inner">
                <Truck className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">FleetFlow</CardTitle>
              <CardDescription className="text-muted-foreground text-xs sm:text-sm">
                Logistics, Fleet & Delivery Management Platform
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-medium flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10 h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-9 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-start gap-2">
                    <span className="shrink-0 font-bold">!</span>
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full h-10 font-medium" disabled={loading}>
                  {loading && !loggingInEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in with Credentials
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </div>

          <div className="p-6 pt-0 border-t border-border/40 mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Universal Demo Password:</span>
              <code className="bg-muted px-2 py-0.5 rounded font-mono text-xs font-semibold text-foreground">
                password123
              </code>
            </div>
          </div>
        </Card>

        {/* Right Side: Quick One-Click Demo Logins for ALL users in mock_data.json */}
        <Card className="lg:col-span-7 flex flex-col justify-between border-border/60 shadow-xl backdrop-blur-sm bg-card/95">
          <CardHeader className="pb-3 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg font-semibold">One-Click Demo Accounts</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {ALL_DEMO_USERS.length} Seeded Accounts
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Click any customer, driver, or staff member to instantly log in as that user
            </CardDescription>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              <Button
                type="button"
                size="sm"
                variant={activeTab === 'all' ? 'default' : 'outline'}
                className="h-7 text-xs px-2.5 rounded-full"
                onClick={() => setActiveTab('all')}
              >
                All ({ALL_DEMO_USERS.length})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTab === 'customer' ? 'default' : 'outline'}
                className="h-7 text-xs px-2.5 rounded-full"
                onClick={() => setActiveTab('customer')}
              >
                Customers (3)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTab === 'driver' ? 'default' : 'outline'}
                className="h-7 text-xs px-2.5 rounded-full"
                onClick={() => setActiveTab('driver')}
              >
                Drivers (2)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTab === 'staff' ? 'default' : 'outline'}
                className="h-7 text-xs px-2.5 rounded-full"
                onClick={() => setActiveTab('staff')}
              >
                Staff (2)
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-2 pb-6 overflow-y-auto max-h-[380px] pr-1">
            {filteredUsers.map((user) => {
              const isCurrentLoggingIn = loggingInEmail === user.email;
              const Icon = user.icon;

              return (
                <button
                  key={user.email}
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoSelect(user)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between group ${user.bgClass} ${
                    isCurrentLoggingIn ? 'ring-2 ring-primary border-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-background/80 border border-border/50 flex items-center justify-center shrink-0 shadow-xs">
                      <Icon className={`h-4 w-4 ${user.colorClass}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground truncate">
                          {user.name}
                        </span>
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 shrink-0 font-medium">
                          {user.roleDisplay}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate font-mono mt-0.5">
                        {user.email}
                      </div>
                      <div className="text-[11px] text-muted-foreground/80 truncate">
                        {user.detail}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isCurrentLoggingIn ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-background/60 border border-border/40 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
