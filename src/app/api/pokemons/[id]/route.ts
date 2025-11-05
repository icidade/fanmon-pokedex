import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/auth/guards';
import { handleRouteError, jsonSuccess } from '@/lib/http/responses';
import { pokemonUpdateSchema } from '@/lib/validators/pokemon';
import { slugify } from '@/lib/slugify';

const pokemonInclude = {
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
} satisfies Prisma.PokemonInclude;

const mapPokemon = async (id: string) => {
  const pokemon = await prisma.pokemon.findUniqueOrThrow({
    where: { id },
    include: pokemonInclude,
  });

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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const pokemon = await mapPokemon(params.id);
    return jsonSuccess(pokemon);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAdminRole();
    const payload = await request.json();
    const input = pokemonUpdateSchema.parse(payload);

    const updateData: Prisma.PokemonUpdateInput = {
      updatedById: user.id,
    };

    if (input.name) {
      updateData.name = input.name;
    }

    const slugSource = input.slug ?? input.name;
    if (slugSource) {
      updateData.slug = slugify(slugSource);
    }

    if (typeof input.indexNumber === 'number') {
      updateData.indexNumber = input.indexNumber;
    }

    if (input.generationId) {
      updateData.generation = { connect: { id: input.generationId } };
    }

    if (input.classification !== undefined) {
      updateData.classification = input.classification;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.heightMeters !== undefined) {
      updateData.heightMeters = input.heightMeters;
    }

    if (input.weightKilograms !== undefined) {
      updateData.weightKilograms = input.weightKilograms;
    }

    if (input.isLegendary !== undefined) {
      updateData.isLegendary = input.isLegendary;
    }

    if (input.isMythical !== undefined) {
      updateData.isMythical = input.isMythical;
    }

    if (input.baseStats) {
      if (input.baseStats.hp !== undefined) {
        updateData.baseHp = input.baseStats.hp ?? null;
      }
      if (input.baseStats.attack !== undefined) {
        updateData.baseAttack = input.baseStats.attack ?? null;
      }
      if (input.baseStats.defense !== undefined) {
        updateData.baseDefense = input.baseStats.defense ?? null;
      }
      if (input.baseStats.spAttack !== undefined) {
        updateData.baseSpAttack = input.baseStats.spAttack ?? null;
      }
      if (input.baseStats.spDefense !== undefined) {
        updateData.baseSpDefense = input.baseStats.spDefense ?? null;
      }
      if (input.baseStats.speed !== undefined) {
        updateData.baseSpeed = input.baseStats.speed ?? null;
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.pokemon.update({ where: { id: params.id }, data: updateData });

      if (input.typeIds) {
        await tx.pokemonType.deleteMany({ where: { pokemonId: params.id } });
        await tx.pokemonType.createMany({
          data: input.typeIds.map((typeId, index) => ({
            pokemonId: params.id,
            typeId,
            slot: index + 1,
          })),
        });
      }

      if (input.media) {
        await tx.pokemonMedia.deleteMany({ where: { pokemonId: params.id } });

        let primaryImageId: string | null = null;
        let primaryAudioId: string | null = null;

        for (const media of input.media) {
          const createdMedia = await tx.pokemonMedia.create({
            data: {
              pokemonId: params.id,
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

        await tx.pokemon.update({
          where: { id: params.id },
          data: {
            primaryImageMediaId: primaryImageId ?? undefined,
            primaryAudioMediaId: primaryAudioId ?? undefined,
          },
        });
      }

      if (input.preEvolutionId !== undefined || input.nextEvolutionIds !== undefined) {
        await tx.pokemonEvolution.deleteMany({
          where: {
            OR: [{ fromPokemonId: params.id }, { toPokemonId: params.id }],
          },
        });

        const evolutionOps: Prisma.PokemonEvolutionCreateManyInput[] = [];

        if (input.preEvolutionId) {
          evolutionOps.push({
            fromPokemonId: input.preEvolutionId,
            toPokemonId: params.id,
          });
        }

        if (input.preEvolutionId === null) {
          // Explicitly clear pre-evolution
        }

        if (input.nextEvolutionIds?.length) {
          for (const nextId of input.nextEvolutionIds) {
            evolutionOps.push({
              fromPokemonId: params.id,
              toPokemonId: nextId,
            });
          }
        }

        if (evolutionOps.length > 0) {
          await tx.pokemonEvolution.createMany({ data: evolutionOps, skipDuplicates: true });
        }
      }
    });

    const pokemon = await mapPokemon(params.id);
    return jsonSuccess(pokemon);
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

    await prisma.$transaction(async (tx) => {
      await tx.pokemonMedia.deleteMany({ where: { pokemonId: params.id } });
      await tx.pokemonType.deleteMany({ where: { pokemonId: params.id } });
      await tx.pokemonEvolution.deleteMany({
        where: {
          OR: [{ fromPokemonId: params.id }, { toPokemonId: params.id }],
        },
      });
      await tx.pokemon.delete({ where: { id: params.id } });
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
}

