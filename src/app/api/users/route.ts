import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { userService } from '@/server/services';
import { AppError } from '@/server/errors';
import { createUserSchema } from '@/schemas';

// GET /api/users
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 20;
    const offset = Number(searchParams.get('offset')) || 0;

    const users = await userService.findMany({ limit, offset });
    const total = await userService.count();

    return NextResponse.json({
      success: true,
      data: {
        items: users,
        meta: {
          total,
          limit,
          offset,
          hasMore: offset + users.length < total,
        },
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/users
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const data = createUserSchema.parse(body);

    // Check for duplicate email
    const existing = await userService.findByEmail(data.email);
    if (existing) {
      throw AppError.conflict('Email already in use');
    }

    const user = await userService.create(data);

    return NextResponse.json(
      { success: true, data: user },
      { status: 201 }
    );
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
