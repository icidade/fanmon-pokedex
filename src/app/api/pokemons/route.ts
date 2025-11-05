import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { handleRouteError, jsonSuccess } from '@/lib/http/responses';
import { pokemonCreateSchema, pokemonQuerySchema } from '@/lib/validators/pokemon';
import { slugify } from '@/lib/slugify';
import { requireAdminRole } from '@/lib/auth/guards';

type PokemonWithRelations = Prisma.PokemonGetPayload<{
  include: {
    generation: true;
    types: { include: { type: true } };
    media: true;
    primaryImageMedia: true;
    primaryAudioMedia: true;
    evolutionsFrom: {
      include: { toPokemon: { select: { id: true, name: true, slug: true } } };
    };
    evolutionsTo: {
      include: { fromPokemon: { select: { id: true, name: true, slug: true } } };
    };
  };
}>;

const mapPokemon = (pokemon: PokemonWithRelations) => {
  const baseStats = {
    hp: pokemon.baseHp ?? null,
    attack: pokemon.baseAttack ?? null,
    defense: pokemon.baseDefense ?? null,
    spAttack: pokemon.baseSpAttack ?? null,
    spDefense: pokemon.baseSpDefense ?? null,
    speed: pokemon.baseSpeed ?? null,
  };

  return {
    id: pokemon.id,
    name: pokemon.name,
    slug: pokemon.slug,
    indexNumber: pokemon.indexNumber,
    generation: pokemon.generation,
    classification: pokemon.classification,
    description: pokemon.description,
    heightMeters: pokemon.heightMeters,
    weightKilograms: pokemon.weightKilograms,
    isLegendary: pokemon.isLegendary,
    isMythical: pokemon.isMythical,
    types: pokemon.types
      .map((pt) => ({
        id: pt.type.id,
        name: pt.type.name,
        slug: pt.type.slug,
        colorHex: pt.type.colorHex,
        slot: pt.slot,
      }))
      .sort((a, b) => a.slot - b.slot),
    media: pokemon.media,
    primaryImageMedia: pokemon.primaryImageMedia,
    primaryAudioMedia: pokemon.primaryAudioMedia,
    baseStats,
    preEvolution: pokemon.evolutionsTo[0]?.fromPokemon ?? null,
    evolutions: pokemon.evolutionsFrom.map((evo) => evo.toPokemon).filter(Boolean),
    createdAt: pokemon.createdAt,
    updatedAt: pokemon.updatedAt,
  };
};

const buildWhere = (query: Prisma.PokemonWhereInput[]): Prisma.PokemonWhereInput =>
  query.length > 0 ? { AND: query } : {};

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const parsed = pokemonQuerySchema.parse(query);

    const filters: Prisma.PokemonWhereInput[] = [];

    if (parsed.search) {
      filters.push({ name: { contains: parsed.search, mode: 'insensitive' } });
    }

    if (parsed.generationId) {
      filters.push({ generationId: parsed.generationId });
    }

    if (parsed.typeId) {
      filters.push({ types: { some: { typeId: parsed.typeId } } });
    }

    if (parsed.weakToTypeId) {
      filters.push({
        types: {
          some: {
            type: {
              relationshipsTo: {
                some: {
                  relation: 'STRONG_AGAINST',
                  sourceTypeId: parsed.weakToTypeId,
                },
              },
            },
          },
        },
      });
    }

    if (parsed.strongAgainstTypeId) {
      filters.push({
        types: {
          some: {
            type: {
              relationshipsFrom: {
                some: {
                  relation: 'STRONG_AGAINST',
                  targetTypeId: parsed.strongAgainstTypeId,
                },
              },
            },
          },
        },
      });
    }

    const where = buildWhere(filters);
    const page = parsed.page ?? 1;
    const take = parsed.pageSize ?? 20;
    const skip = (page - 1) * take;

    const [total, pokemons] = await prisma.$transaction([
      prisma.pokemon.count({ where }),
      prisma.pokemon.findMany({
        where,
        orderBy: [{ generation: { number: 'asc' } }, { indexNumber: 'asc' }],
        include: {
          generation: true,
          types: { include: { type: true } },
          media: true,
          primaryImageMedia: true,
          primaryAudioMedia: true,
          evolutionsFrom: {
            include: {
              toPokemon: { select: { id: true, name: true, slug: true } },
            },
          },
          evolutionsTo: {
            include: {
              fromPokemon: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        skip,
        take,
      }),
    ]);

    return jsonSuccess({
      total,
      page,
      pageSize: take,
      results: pokemons.map(mapPokemon),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdminRole();
    const payload = await request.json();
    const input = pokemonCreateSchema.parse(payload);

    const slug = slugify(input.slug ?? input.name);

    const pokemonId = await prisma.$transaction(async (tx) => {
      const pokemon = await tx.pokemon.create({
        data: {
          name: input.name,
          slug,
          indexNumber: input.indexNumber,
          generationId: input.generationId,
          classification: input.classification,
          description: input.description,
          heightMeters: input.heightMeters,
          weightKilograms: input.weightKilograms,
          isLegendary: input.isLegendary ?? false,
          isMythical: input.isMythical ?? false,
          baseHp: input.baseStats?.hp ?? null,
          baseAttack: input.baseStats?.attack ?? null,
          baseDefense: input.baseStats?.defense ?? null,
          baseSpAttack: input.baseStats?.spAttack ?? null,
          baseSpDefense: input.baseStats?.spDefense ?? null,
          baseSpeed: input.baseStats?.speed ?? null,
          createdById: user.id,
          updatedById: user.id,
          types: {
            create: input.typeIds.map((typeId, index) => ({
              typeId,
              slot: index + 1,
            })),
          },
        },
      });

      let primaryImageId: string | null = null;
      let primaryAudioId: string | null = null;

      if (input.media?.length) {
        for (const media of input.media) {
          const createdMedia = await tx.pokemonMedia.create({
            data: {
              pokemonId: pokemon.id,
              kind: media.kind,
              url: media.url,
              title: media.title,
              isPrimary: media.isPrimary ?? false,
            },
          });

          if (media.kind === 'IMAGE') {
            if (media.isPrimary || primaryImageId === null) {
              primaryImageId = createdMedia.id;
            }
          }

          if (media.kind === 'AUDIO') {
            if (media.isPrimary || primaryAudioId === null) {
              primaryAudioId = createdMedia.id;
            }
          }
        }
      }

      if (primaryImageId || primaryAudioId) {
        await tx.pokemon.update({
          where: { id: pokemon.id },
          data: {
            primaryImageMediaId: primaryImageId ?? undefined,
            primaryAudioMediaId: primaryAudioId ?? undefined,
          },
        });
      }

      const evolutionOps: Prisma.PokemonEvolutionCreateManyInput[] = [];
      if (input.preEvolutionId) {
        evolutionOps.push({
          fromPokemonId: input.preEvolutionId,
          toPokemonId: pokemon.id,
        });
      }

      if (input.nextEvolutionIds?.length) {
        for (const nextId of input.nextEvolutionIds) {
          evolutionOps.push({
            fromPokemonId: pokemon.id,
            toPokemonId: nextId,
          });
        }
      }

      if (evolutionOps.length > 0) {
        await tx.pokemonEvolution.createMany({ data: evolutionOps, skipDuplicates: true });
      }

      return pokemon.id;
    });

    const created = await prisma.pokemon.findUniqueOrThrow({
      where: { id: pokemonId },
      include: {
        generation: true,
        types: { include: { type: true } },
        media: true,
        primaryImageMedia: true,
        primaryAudioMedia: true,
        evolutionsFrom: {
          include: {
            toPokemon: { select: { id: true, name: true, slug: true } },
          },
        },
        evolutionsTo: {
          include: {
            fromPokemon: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    return jsonSuccess(mapPokemon(created), { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}

