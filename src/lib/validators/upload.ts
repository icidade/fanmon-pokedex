import { z } from 'zod';

const maxSizeMb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB ?? '10');
const maxSizeBytes = maxSizeMb * 1024 * 1024;

export const uploadRequestSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.coerce.number().int().min(1).max(maxSizeBytes),
  purpose: z.enum(['POKEMON_IMAGE', 'POKEMON_AUDIO']),
});

export type UploadRequestInput = z.infer<typeof uploadRequestSchema>;

