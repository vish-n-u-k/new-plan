import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { userService } from '@/server/services';
import { AppError } from '@/server/errors';
import { updateUserSchema, userIdSchema } from '@/schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/users/:id
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { id: validId } = userIdSchema.parse({ id });

    const user = await userService.findById(validId);
    if (!user) {
      throw AppError.notFound('User');
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/users/:id
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { id: validId } = userIdSchema.parse({ id });

    const body: unknown = await request.json();
    const data = updateUserSchema.parse(body);

    // Check if user exists
    const existing = await userService.findById(validId);
    if (!existing) {
      throw AppError.notFound('User');
    }

    // Check for duplicate email if changing email
    if (data.email && data.email !== existing.email) {
      const emailTaken = await userService.findByEmail(data.email);
      if (emailTaken) {
        throw AppError.conflict('Email already in use');
      }
    }

    const user = await userService.update(validId, data);

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/users/:id
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { id: validId } = userIdSchema.parse({ id });

    const existing = await userService.findById(validId);
    if (!existing) {
      throw AppError.notFound('User');
    }

    await userService.delete(validId);

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode }
    );
  }

  console.error('Unhandled error:', error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  );
}
