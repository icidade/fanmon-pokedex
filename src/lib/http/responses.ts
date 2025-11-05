import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthenticationError, AuthorizationError } from '@/lib/auth/guards';

export const jsonSuccess = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json({ success: true, data }, init);

export const jsonError = (message: string, status: number, issues?: unknown) =>
  NextResponse.json(
    {
      success: false,
      error: { message, issues },
    },
    { status },
  );

export const handleRouteError = (err: unknown) => {
  if (err instanceof AuthenticationError) {
    return jsonError(err.message, err.status);
  }

  if (err instanceof AuthorizationError) {
    return jsonError(err.message, err.status);
  }

  if (err instanceof ZodError) {
    return jsonError('Validation failed', 422, err.flatten());
  }

  console.error(err);
  return jsonError('Unexpected server error', 500);
};

