import { cookies } from 'next/headers';

import { authService } from '@/server/services';
import { AppError } from '@/server/errors';

import type { Role } from '@/schemas';

const SESSION_COOKIE_NAME = 'session_token';

export async function getAuthenticatedUser(allowedRoles?: Role[]) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    throw AppError.unauthorized('Authentication required');
  }

  const user = await authService.validateSession(sessionToken);

  if (!user) {
    throw AppError.unauthorized('Invalid or expired session');
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw AppError.forbidden('You do not have permission to access this resource');
  }

  return user;
}

export function getSessionToken(): string | undefined {
  // This is a sync helper for cases where you already have the cookie store
  // For route handlers, prefer using getAuthenticatedUser
  return undefined;
}

export { SESSION_COOKIE_NAME };
