import { z } from 'zod';

const statsSchema = z
  .object({
    hp: z.coerce.number().int().min(1).max(300).optional(),
    attack: z.coerce.number().int().min(1).max(300).optional(),
    defense: z.coerce.number().int().min(1).max(300).optional(),
    spAttack: z.coerce.number().int().min(1).max(300).optional(),
    spDefense: z.coerce.number().int().min(1).max(300).optional(),
    speed: z.coerce.number().int().min(1).max(300).optional(),
  })
  .optional();

export const pokemonMediaSchema = z.object({
  url: z.string().url(),
  kind: z.enum(['IMAGE', 'AUDIO']),
  title: z.string().max(120).optional(),
  isPrimary: z.boolean().optional(),
});

const sharedFields = {
  name: z.string().min(2),
  indexNumber: z.coerce.number().int().min(1),
  generationId: z.string().uuid(),
  classification: z.string().optional(),
  description: z.string().optional(),
  heightMeters: z.coerce.number().min(0).max(100).optional(),
  weightKilograms: z.coerce.number().min(0).max(1000).optional(),
  isLegendary: z.boolean().optional(),
  isMythical: z.boolean().optional(),
  typeIds: z.array(z.string().uuid()).min(1),
  baseStats: statsSchema,
  media: z.array(pokemonMediaSchema).optional(),
  preEvolutionId: z.string().uuid().nullable().optional(),
  nextEvolutionIds: z.array(z.string().uuid()).optional(),
  slug: z.string().optional(),
};

export const pokemonCreateSchema = z.object(sharedFields);

export const pokemonUpdateSchema = z
  .object({
    id: z.string().uuid(),
    ...sharedFields,
  })
  .partial({
    name: true,
    indexNumber: true,
    generationId: true,
    classification: true,
    description: true,
    heightMeters: true,
    weightKilograms: true,
    isLegendary: true,
    isMythical: true,
    typeIds: true,
    baseStats: true,
    media: true,
    preEvolutionId: true,
    nextEvolutionIds: true,
    slug: true,
  });

export const pokemonQuerySchema = z.object({
  search: z.string().optional(),
  generationId: z.string().uuid().optional(),
  typeId: z.string().uuid().optional(),
  weakToTypeId: z.string().uuid().optional(),
  strongAgainstTypeId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type PokemonCreateInput = z.infer<typeof pokemonCreateSchema>;
export type PokemonUpdateInput = z.infer<typeof pokemonUpdateSchema>;
export type PokemonQueryInput = z.infer<typeof pokemonQuerySchema>;

