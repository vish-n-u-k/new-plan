import { NextResponse } from 'next/server';

import { authService } from '@/server/services';
import { handleError } from '@/server/errors';
import { getAuthenticatedUser } from '@/server/auth';

export async function GET() {
  try {
    const sessionUser = await getAuthenticatedUser(['SELLER', 'BUYER']);

    const user = await authService.getCurrentUser(sessionUser.id);

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return handleError(error);
  }
}
