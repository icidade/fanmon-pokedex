import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/auth/guards';
import { handleRouteError, jsonSuccess } from '@/lib/http/responses';
import { typeCreateSchema } from '@/lib/validators/type';
import { slugify } from '@/lib/slugify';

const normalizeColor = (color?: string | null) => {
  if (!color) return null;
  return color.startsWith('#') ? color.toUpperCase() : `#${color.toUpperCase()}`;
};

type TypeWithRelations = Prisma.TypeGetPayload<{
  include: {
    relationshipsFrom: { include: { targetType: true } };
    relationshipsTo: { include: { sourceType: true } };
  };
}>;

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

const loadType = async (id: string): Promise<TypeWithRelations> =>
  prisma.type.findUniqueOrThrow({
    where: { id },
    include: {
      relationshipsFrom: { include: { targetType: true } },
      relationshipsTo: { include: { sourceType: true } },
    },
  });

export async function GET() {
  try {
    const types = await prisma.type.findMany({
      orderBy: { name: 'asc' },
      include: {
        relationshipsFrom: { include: { targetType: true } },
        relationshipsTo: { include: { sourceType: true } },
      },
    });

    return jsonSuccess(types.map(mapType));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminRole();
    const payload = await request.json();
    const input = typeCreateSchema.parse(payload);

    const colorHex = normalizeColor(input.colorHex ?? null);
    const slug = slugify(input.slug ?? input.name);

    const created = await prisma.$transaction(async (tx) => {
      const type = await tx.type.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          colorHex,
        },
      });

      const relationsInput = input.relations ?? {
        strongAgainst: [],
        weakAgainst: [],
        immuneTo: [],
      };

      const relationPayload = [
        ...relationsInput.strongAgainst.map((targetTypeId) => ({
          relation: 'STRONG_AGAINST' as const,
          targetTypeId,
        })),
        ...relationsInput.weakAgainst.map((targetTypeId) => ({
          relation: 'WEAK_AGAINST' as const,
          targetTypeId,
        })),
        ...relationsInput.immuneTo.map((targetTypeId) => ({
          relation: 'IMMUNE_TO' as const,
          targetTypeId,
        })),
      ];

      if (relationPayload.length > 0) {
        await tx.typeRelationship.createMany({
          data: relationPayload.map((rel) => ({
            sourceTypeId: type.id,
            targetTypeId: rel.targetTypeId,
            relation: rel.relation,
          })),
          skipDuplicates: true,
        });
      }

      return type.id;
    });

    const createdType = await loadType(created);
    return jsonSuccess(mapType(createdType), { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}

