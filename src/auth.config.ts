import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).userId;
        token.role = (user as any).role;
        token.customerId = (user as any).customerId;
        token.driverId = (user as any).driverId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).userId = token.userId;
        (session.user as any).role = token.role;
        (session.user as any).customerId = token.customerId;
        (session.user as any).driverId = token.driverId;
      }
      return session;
    },
  },
  providers: [],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  trustHost: true,
};
