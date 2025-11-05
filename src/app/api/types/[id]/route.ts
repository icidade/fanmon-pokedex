import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/auth/guards';
import { handleRouteError, jsonError, jsonSuccess } from '@/lib/http/responses';
import { typeUpdateSchema } from '@/lib/validators/type';
import { slugify } from '@/lib/slugify';

type TypeWithRelations = Prisma.TypeGetPayload<{
  include: {
    relationshipsFrom: { include: { targetType: true } };
    relationshipsTo: { include: { sourceType: true } };
  };
}>;

const normalizeColor = (color?: string | null) => {
  if (!color) return null;
  return color.startsWith('#') ? color.toUpperCase() : `#${color.toUpperCase()}`;
};

const loadType = async (id: string): Promise<TypeWithRelations> =>
  prisma.type.findUniqueOrThrow({
    where: { id },
    include: {
      relationshipsFrom: { include: { targetType: true } },
      relationshipsTo: { include: { sourceType: true } },
    },
  });

const mapType = (type: TypeWithRelations) => {
  const strengths = type.relationshipsFrom
    .filter((rel) => rel.relation === 'STRONG_AGAINST')
    .map((rel) => rel.targetType);

  const weaknesses = type.relationshipsTo
    .filter((rel) => rel.relation === 'STRONG_AGAINST')
    .map((rel) => rel.sourceType);

  const resistances = type.relationshipsTo
    .filter((rel) => rel.relation === 'WEAK_AGAINST')
    .map((rel) => rel.sourceType);

  const immunities = type.relationshipsTo
    .filter((rel) => rel.relation === 'IMMUNE_TO')
    .map((rel) => rel.sourceType);

  return {
    id: type.id,
    name: type.name,
    slug: type.slug,
    description: type.description,
    colorHex: type.colorHex,
    createdAt: type.createdAt,
    updatedAt: type.updatedAt,
    strengths,
    weaknesses,
    resistances,
    immunities,
  };
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const type = await loadType(params.id);
    return jsonSuccess(mapType(type));
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
    const input = typeUpdateSchema.parse(payload);

    const updatedSlug = input.slug
      ? slugify(input.slug)
      : input.name
        ? slugify(input.name)
        : undefined;
    const colorHex =
      input.colorHex === undefined ? undefined : normalizeColor(input.colorHex ?? null);

    await prisma.$transaction(async (tx) => {
      await tx.type.update({
        where: { id: params.id },
        data: {
          name: input.name,
          slug: updatedSlug,
          description: input.description,
          colorHex,
        },
      });

      if (input.relations) {
        await tx.typeRelationship.deleteMany({ where: { sourceTypeId: params.id } });

        const relationPayload = [
          ...input.relations.strongAgainst?.map((targetTypeId) => ({
            relation: 'STRONG_AGAINST' as const,
            targetTypeId,
          })) ?? [],
          ...input.relations.weakAgainst?.map((targetTypeId) => ({
            relation: 'WEAK_AGAINST' as const,
            targetTypeId,
          })) ?? [],
          ...input.relations.immuneTo?.map((targetTypeId) => ({
            relation: 'IMMUNE_TO' as const,
            targetTypeId,
          })) ?? [],
        ];

        if (relationPayload.length > 0) {
          await tx.typeRelationship.createMany({
            data: relationPayload.map((rel) => ({
              sourceTypeId: params.id,
              targetTypeId: rel.targetTypeId,
              relation: rel.relation,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    const type = await loadType(params.id);
    return jsonSuccess(mapType(type));
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

    const usageCount = await prisma.pokemonType.count({ where: { typeId: params.id } });
    if (usageCount > 0) {
      return jsonError('Type is in use by Pokémon and cannot be deleted', 409);
    }

    await prisma.$transaction(async (tx) => {
      await tx.typeRelationship.deleteMany({ where: { OR: [{ sourceTypeId: params.id }, { targetTypeId: params.id }] } });
      await tx.type.delete({ where: { id: params.id } });
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
}

