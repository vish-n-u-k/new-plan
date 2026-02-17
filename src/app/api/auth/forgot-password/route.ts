import { NextResponse } from 'next/server';

import { forgotPasswordSchema } from '@/schemas';
import { authService } from '@/server/services';
import { handleError } from '@/server/errors';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const data = forgotPasswordSchema.parse(body);

    await authService.forgotPassword(data);

    return NextResponse.json({
      success: true,
      data: { message: 'If an account with that email exists, a reset link has been sent' },
    });
  } catch (error) {
    return handleError(error);
  }
}
