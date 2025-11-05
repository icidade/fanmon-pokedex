import { z } from 'zod';

export const generationBaseSchema = {
  name: z.string().min(2),
  number: z.coerce.number().int().min(1),
  description: z.string().optional(),
  releasedAt: z.coerce.date().optional(),
};

export const generationCreateSchema = z.object(generationBaseSchema);

export const generationUpdateSchema = z.object({
  id: z.string().uuid(),
  ...generationBaseSchema,
}).partial({
  name: true,
  number: true,
  description: true,
  releasedAt: true,
});

export type GenerationCreateInput = z.infer<typeof generationCreateSchema>;
export type GenerationUpdateInput = z.infer<typeof generationUpdateSchema>;

