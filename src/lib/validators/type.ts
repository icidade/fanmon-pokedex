import { z } from 'zod';

const relationsBaseSchema = z.object({
  strongAgainst: z.array(z.string().uuid()).optional().default([]),
  weakAgainst: z.array(z.string().uuid()).optional().default([]),
  immuneTo: z.array(z.string().uuid()).optional().default([]),
});

export const typeRelationsSchema = relationsBaseSchema.optional().default({
  strongAgainst: [],
  weakAgainst: [],
  immuneTo: [],
});

export const typeCreateSchema = z.object({
  name: z.string().min(2, 'Name must have at least 2 characters'),
  description: z.string().optional(),
  colorHex: z
    .string()
    .regex(/^#?[0-9a-fA-F]{6}$/)
    .optional(),
  slug: z.string().optional(),
  relations: typeRelationsSchema,
});

export const typeUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  colorHex: z
    .string()
    .regex(/^#?[0-9a-fA-F]{6}$/)
    .optional(),
  slug: z.string().optional(),
  relations: relationsBaseSchema.optional(),
});

export type TypeCreateInput = z.infer<typeof typeCreateSchema>;
export type TypeUpdateInput = z.infer<typeof typeUpdateSchema>;

