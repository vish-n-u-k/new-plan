import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { registerBuyerSchema } from '@/schemas';
import { authService } from '@/server/services';
import { handleError } from '@/server/errors';
import { SESSION_COOKIE_NAME } from '@/server/auth';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const data = registerBuyerSchema.parse(body);

    const { user, session } = await authService.registerBuyer(data);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: session.expiresAt,
    });

    return NextResponse.json(
      { success: true, data: { user } },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
