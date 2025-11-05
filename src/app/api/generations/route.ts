import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/auth/guards';
import { generationCreateSchema } from '@/lib/validators/generation';
import { handleRouteError, jsonSuccess } from '@/lib/http/responses';

export async function GET() {
  try {
    const generations = await prisma.generation.findMany({
      orderBy: { number: 'asc' },
    });
    return jsonSuccess(generations);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminRole();
    const payload = await request.json();
    const input = generationCreateSchema.parse(payload);

    const generation = await prisma.generation.create({
      data: {
        name: input.name,
        number: input.number,
        description: input.description,
        releasedAt: input.releasedAt,
      },
    });

    return jsonSuccess(generation, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}

