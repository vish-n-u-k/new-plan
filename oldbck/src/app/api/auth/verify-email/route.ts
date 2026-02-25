import { NextResponse } from 'next/server';

import { verifyEmailSchema } from '@/schemas';
import { authService } from '@/server/services';
import { handleError } from '@/server/errors';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const data = verifyEmailSchema.parse(body);

    await authService.verifyEmail(data);

    return NextResponse.json({
      success: true,
      data: { message: 'Email verified successfully' },
    });
  } catch (error) {
    return handleError(error);
  }
}
