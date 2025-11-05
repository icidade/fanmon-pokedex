import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { jsonError, jsonSuccess } from '@/lib/http/responses';

const maxSizeMb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB ?? '10');
const maxSizeBytes = maxSizeMb * 1024 * 1024;

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

const SUPPORTED_PURPOSES = {
  POKEMON_IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  POKEMON_AUDIO: ['audio/mpeg', 'audio/ogg', 'audio/wav'],
} as const;

type SupportedPurpose = keyof typeof SUPPORTED_PURPOSES;

const isSupportedPurpose = (value: string): value is SupportedPurpose =>
  Object.prototype.hasOwnProperty.call(SUPPORTED_PURPOSES, value);

const inferExtension = (filename: string, mimeType: string) => {
  const extFromName = path.extname(filename);
  if (extFromName) {
    return extFromName;
  }

  switch (mimeType) {
    case 'image/png':
      return '.png';
    case 'image/jpeg':
      return '.jpg';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    case 'audio/mpeg':
      return '.mp3';
    case 'audio/ogg':
      return '.ogg';
    case 'audio/wav':
      return '.wav';
    default:
      return '';
  }
};

const ensureUploadDir = async () => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const purposeValue = formData.get('purpose');

    if (!(file instanceof File)) {
      return jsonError('Arquivo não enviado.', 400);
    }

    if (typeof purposeValue !== 'string' || !isSupportedPurpose(purposeValue)) {
      return jsonError('Purpose inválido.', 400);
    }

    const purpose = purposeValue as SupportedPurpose;

    if (file.size > maxSizeBytes) {
      return jsonError(`Arquivo excede o limite de ${maxSizeMb}MB.`, 413);
    }

    const isValidType =
      (purpose === 'POKEMON_IMAGE' && SUPPORTED_PURPOSES.POKEMON_IMAGE.includes(file.type as (typeof SUPPORTED_PURPOSES.POKEMON_IMAGE)[number])) ||
      (purpose === 'POKEMON_AUDIO' && SUPPORTED_PURPOSES.POKEMON_AUDIO.includes(file.type as (typeof SUPPORTED_PURPOSES.POKEMON_AUDIO)[number]));

    if (!isValidType) {
      return jsonError('Tipo de arquivo não suportado para este propósito.', 415);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await ensureUploadDir();

    const ext = inferExtension(file.name, file.type);
    const filename = `${randomUUID()}${ext}`;
    const destination = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(destination, buffer);

    return jsonSuccess({
      url: `/uploads/${filename}`,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
    });
  } catch (err) {
    console.error(err);
    return jsonError('Falha ao processar upload.', 500);
  }
}


