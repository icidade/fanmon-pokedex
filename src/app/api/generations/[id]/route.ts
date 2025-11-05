import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/auth/guards';
import { generationUpdateSchema } from '@/lib/validators/generation';
import { handleRouteError, jsonError, jsonSuccess } from '@/lib/http/responses';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const generation = await prisma.generation.findUniqueOrThrow({ where: { id: params.id } });
    return jsonSuccess(generation);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdminRole();
    const payload = await request.json();
    const input = generationUpdateSchema.parse({ ...payload, id: params.id });

    const generation = await prisma.generation.update({
      where: { id: params.id },
      data: {
        name: input.name,
        number: input.number,
        description: input.description,
        releasedAt: input.releasedAt,
      },
    });

    return jsonSuccess(generation);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdminRole();

    const usageCount = await prisma.pokemon.count({ where: { generationId: params.id } });
    if (usageCount > 0) {
      return jsonError('Generation is associated with Pokémon and cannot be deleted', 409);
    }

    await prisma.generation.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
}

