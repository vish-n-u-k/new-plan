import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { authService } from '@/server/services';
import { handleError } from '@/server/errors';
import { SESSION_COOKIE_NAME } from '@/server/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      await authService.logout(sessionToken);
    }

    // Clear the session cookie
    cookieStore.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleError(error);
  }
}
