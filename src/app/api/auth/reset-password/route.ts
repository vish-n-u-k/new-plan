import { NextResponse } from 'next/server';

import { resetPasswordSchema } from '@/schemas';
import { authService } from '@/server/services';
import { handleError } from '@/server/errors';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const data = resetPasswordSchema.parse(body);

    await authService.resetPassword(data);

    return NextResponse.json({
      success: true,
      data: { message: 'Password has been reset successfully' },
    });
  } catch (error) {
    return handleError(error);
  }
}
