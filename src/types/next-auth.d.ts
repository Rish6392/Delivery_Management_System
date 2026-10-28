import 'next-auth';

declare module 'next-auth' {
  interface User {
    userId: string;
    role: string;
    customerId: string | null;
    driverId: string | null;
  }

  interface Session {
    user: {
      id: string;
      userId: string;
      email: string;
      name: string;
      role: string;
      customerId: string | null;
      driverId: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    role: string;
    customerId: string | null;
    driverId: string | null;
  }
}
