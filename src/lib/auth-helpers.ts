import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export type AuthenticatedUser = {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  customerId: string | null;
  driverId: string | null;
};

/**
 * Get the authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getAuthUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as AuthenticatedUser;
}

/**
 * Require authentication. Returns 401 if not authenticated.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new AuthError('Authentication required', 401);
  }
  return user;
}

/**
 * Require specific roles. Returns 403 if not authorized.
 */
export async function requireRole(...roles: string[]): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new AuthError('Insufficient permissions', 403);
  }
  return user;
}

/**
 * Custom error class for auth errors with HTTP status codes.
 */
export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'AuthError';
  }
}

/**
 * Custom error class for business logic errors.
 */
export class BusinessError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.status = status;
    this.name = 'BusinessError';
  }
}

/**
 * Handle API errors and return appropriate JSON response.
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  if (error instanceof BusinessError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  console.error('Unhandled error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
