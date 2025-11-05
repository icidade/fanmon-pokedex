'use client';

import { useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

type GenerationOption = {
  id: string;
  name: string;
  number: number;
};

type TypeOption = {
  id: string;
  name: string;
};

type PokemonMedia = {
  id: string;
  kind: 'IMAGE' | 'AUDIO';
  url: string;
  title?: string | null;
  isPrimary: boolean;
};

type PokemonListItem = {
  id: string;
  name: string;
  slug: string;
  indexNumber: number;
  generation: { id: string; name: string; number: number };
  classification?: string | null;
  description?: string | null;
  heightMeters?: number | null;
  weightKilograms?: number | null;
  isLegendary: boolean;
  isMythical: boolean;
  types: { id: string; name: string; slot: number }[];
  baseStats: {
    hp: number | null;
    attack: number | null;
    defense: number | null;
    spAttack: number | null;
    spDefense: number | null;
    speed: number | null;
  };
  media: PokemonMedia[];
  primaryImageMedia?: { id: string; url: string | null; title?: string | null } | null;
  primaryAudioMedia?: { id: string; url: string | null; title?: string | null } | null;
};

type PokemonResponse = {
  total: number;
  page: number;
  pageSize: number;
  results: PokemonListItem[];
};

type PokemonFormValues = {
  id?: string;
  name: string;
  slug?: string;
  generationId: string;
  indexNumber: number;
  classification?: string;
  description?: string;
  heightMeters?: number;
  weightKilograms?: number;
  isLegendary: boolean;
  isMythical: boolean;
  typeIds: string[];
  baseHp?: number;
  baseAttack?: number;
  baseDefense?: number;
  baseSpAttack?: number;
  baseSpDefense?: number;
  baseSpeed?: number;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { message: string; issues?: unknown };
};

const normalizeNumber = (value?: number | null) =>
  value === undefined || value === null || Number.isNaN(value) ? undefined : value;

const fetchGenerations = async (): Promise<GenerationOption[]> => {
  const response = await fetch('/api/generations', { cache: 'no-store' });
  const body = (await response.json()) as ApiResponse<GenerationOption[]>;
  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error?.message ?? 'Falha ao carregar gerações');
  }
  return body.data;
};

const fetchTypes = async (): Promise<TypeOption[]> => {
  const response = await fetch('/api/types', { cache: 'no-store' });
  const body = (await response.json()) as ApiResponse<
    (TypeOption & {
      strengths: unknown[];
      weaknesses: unknown[];
      resistances: unknown[];
      immunities: unknown[];
    })[]
  >;
  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error?.message ?? 'Falha ao carregar tipos');
  }
  return body.data.map((type) => ({ id: type.id, name: type.name }));
};

const fetchPokemons = async (): Promise<PokemonResponse> => {
  const response = await fetch('/api/pokemons?pageSize=100', { cache: 'no-store' });
  const body = (await response.json()) as ApiResponse<PokemonResponse>;
  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error?.message ?? 'Falha ao carregar Pokémon');
  }
  return body.data;
};

export function PokemonsManager(): JSX.Element {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PokemonListItem | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageTitle, setImageTitle] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioTitle, setAudioTitle] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isAudioUploading, setIsAudioUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<PokemonFormValues>({
    defaultValues: {
      name: '',
      slug: '',
      generationId: '',
      indexNumber: 1,
      classification: '',
      description: '',
      heightMeters: undefined,
      weightKilograms: undefined,
      isLegendary: false,
      isMythical: false,
      typeIds: [],
      baseHp: undefined,
      baseAttack: undefined,
      baseDefense: undefined,
      baseSpAttack: undefined,
      baseSpDefense: undefined,
      baseSpeed: undefined,
    },
  });

  const generationsQuery = useQuery({
    queryKey: ['generations'],
    queryFn: fetchGenerations,
  });

  const typesQuery = useQuery({
    queryKey: ['types'],
    queryFn: fetchTypes,
  });

  const pokemonsQuery = useQuery({
    queryKey: ['pokemons'],
    queryFn: fetchPokemons,
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: PokemonFormValues) => {
      const mediaPayload: Array<{
        url: string;
        kind: 'IMAGE' | 'AUDIO';
        title?: string;
        isPrimary?: boolean;
      }> = [];

      if (imageUrl) {
        mediaPayload.push({
          url: imageUrl,
          kind: 'IMAGE',
          isPrimary: true,
          title: imageTitle ?? undefined,
        });
      }

      if (audioUrl) {
        mediaPayload.push({
          url: audioUrl,
          kind: 'AUDIO',
          isPrimary: true,
          title: audioTitle ?? undefined,
        });
      }

      const payload: {
        name: string;
        slug?: string;
        indexNumber: number;
        generationId: string;
        classification?: string;
        description?: string;
        heightMeters?: number;
        weightKilograms?: number;
        isLegendary: boolean;
        isMythical: boolean;
        typeIds: string[];
        baseStats: {
          hp?: number;
          attack?: number;
          defense?: number;
          spAttack?: number;
          spDefense?: number;
          speed?: number;
        };
        media?: typeof mediaPayload;
      } = {
        name: values.name,
        slug: values.slug?.trim() || undefined,
        indexNumber: Number(values.indexNumber),
        generationId: values.generationId,
        classification: values.classification?.trim() || undefined,
        description: values.description?.trim() || undefined,
        heightMeters: normalizeNumber(values.heightMeters),
        weightKilograms: normalizeNumber(values.weightKilograms),
        isLegendary: values.isLegendary,
        isMythical: values.isMythical,
        typeIds: values.typeIds,
        baseStats: {
          hp: normalizeNumber(values.baseHp),
          attack: normalizeNumber(values.baseAttack),
          defense: normalizeNumber(values.baseDefense),
          spAttack: normalizeNumber(values.baseSpAttack),
          spDefense: normalizeNumber(values.baseSpDefense),
          speed: normalizeNumber(values.baseSpeed),
        },
      };

      if (mediaPayload.length > 0) {
        payload.media = mediaPayload;
      }

      const endpoint = values.id ? `/api/pokemons/${values.id}` : '/api/pokemons';
      const method = values.id ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as ApiResponse<PokemonListItem>;
      if (!response.ok || !body.success || !body.data) {
        throw new Error(body.error?.message ?? 'Não foi possível salvar.');
      }

      return body.data;
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['pokemons'] });
      reset({
        name: '',
        slug: '',
        generationId: '',
        indexNumber: 1,
        classification: '',
        description: '',
        heightMeters: undefined,
        weightKilograms: undefined,
        isLegendary: false,
        isMythical: false,
        typeIds: [],
        baseHp: undefined,
        baseAttack: undefined,
        baseDefense: undefined,
        baseSpAttack: undefined,
        baseSpDefense: undefined,
        baseSpeed: undefined,
      });
      setEditing(null);
      setImageUrl(null);
      setImageTitle(null);
      setAudioUrl(null);
      setAudioTitle(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/pokemons/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const body = (await response.json()) as ApiResponse<never>;
        throw new Error(body.error?.message ?? 'Não foi possível excluir.');
      }
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['pokemons'] });
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!values.typeIds?.length) {
      alert('Selecione ao menos um tipo.');
      return;
    }

    if (!values.generationId) {
      alert('Selecione uma geração.');
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        ...values,
        indexNumber: Number(values.indexNumber),
      });
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  });

  const startEdit = (pokemon: PokemonListItem) => {
    setEditing(pokemon);
    reset({
      id: pokemon.id,
      name: pokemon.name,
      slug: pokemon.slug,
      generationId: pokemon.generation.id,
      indexNumber: pokemon.indexNumber,
      classification: pokemon.classification ?? undefined,
      description: pokemon.description ?? undefined,
      heightMeters: normalizeNumber(pokemon.heightMeters) ?? undefined,
      weightKilograms: normalizeNumber(pokemon.weightKilograms) ?? undefined,
      isLegendary: pokemon.isLegendary,
      isMythical: pokemon.isMythical,
      typeIds: pokemon.types.map((type) => type.id),
      baseHp: normalizeNumber(pokemon.baseStats.hp) ?? undefined,
      baseAttack: normalizeNumber(pokemon.baseStats.attack) ?? undefined,
      baseDefense: normalizeNumber(pokemon.baseStats.defense) ?? undefined,
      baseSpAttack: normalizeNumber(pokemon.baseStats.spAttack) ?? undefined,
      baseSpDefense: normalizeNumber(pokemon.baseStats.spDefense) ?? undefined,
      baseSpeed: normalizeNumber(pokemon.baseStats.speed) ?? undefined,
    });

    const primaryImage = pokemon.primaryImageMedia?.url
      ? pokemon.primaryImageMedia
      : pokemon.media.find((media) => media.kind === 'IMAGE' && media.isPrimary);
    const primaryAudio = pokemon.primaryAudioMedia?.url
      ? pokemon.primaryAudioMedia
      : pokemon.media.find((media) => media.kind === 'AUDIO' && media.isPrimary);

    setImageUrl(primaryImage?.url ?? null);
    setImageTitle(primaryImage?.title ?? null);
    setAudioUrl(primaryAudio?.url ?? null);
    setAudioTitle(primaryAudio?.title ?? null);
  };

  const cancelEdit = () => {
    setEditing(null);
    reset({
      name: '',
      slug: '',
      generationId: '',
      indexNumber: 1,
      classification: '',
      description: '',
      heightMeters: undefined,
      weightKilograms: undefined,
      isLegendary: false,
      isMythical: false,
      typeIds: [],
      baseHp: undefined,
      baseAttack: undefined,
      baseDefense: undefined,
      baseSpAttack: undefined,
      baseSpDefense: undefined,
      baseSpeed: undefined,
    });
    setImageUrl(null);
    setImageTitle(null);
    setAudioUrl(null);
    setAudioTitle(null);
  };

  const typeOptions = useMemo(() => typesQuery.data ?? [], [typesQuery.data]);
  const generationOptions = useMemo(() => generationsQuery.data ?? [], [generationsQuery.data]);
  const selectedTypeIds = watch('typeIds');

  const uploadMediaFile = async (file: File, purpose: 'POKEMON_IMAGE' | 'POKEMON_AUDIO') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);

    const response = await fetch('/api/uploads', {
      method: 'POST',
      body: formData,
    });

    const body = (await response.json()) as ApiResponse<{
      url: string;
      originalName: string;
    }>;

    if (!response.ok || !body.success || !body.data) {
      throw new Error(body.error?.message ?? 'Não foi possível enviar o arquivo.');
    }

    return body.data;
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">
          {editing ? 'Editar Pokémon' : 'Cadastrar Pokémon'}
        </h2>
        <form className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2" onSubmit={onSubmit}>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-700">Nome</span>
            <input
              type="text"
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900"
              {...register('name', { required: true })}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-700">Slug</span>
            <input
              type="text"
              placeholder="opcional"
              className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900"
              {...register('slug')}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-700">Número</span>
            <input
              type="number"
              min={1}
              className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900"
              required
              {...register('indexNumber', { valueAsNumber: true, required: true })}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-700">Geração</span>
            <select
              className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900"
              required
              {...register('generationId', { required: true })}
            >
              <option value="">Selecione…</option>
              {generationOptions.map((generation) => (
                <option key={generation.id} value={generation.id}>
                  {generation.number}ª — {generation.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm lg:col-span-2">
            <span className="font-medium text-zinc-700">Tipos</span>
            <select
              multiple
              size={Math.min(8, typeOptions.length || 4)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              {...register('typeIds')}
            >
              {typeOptions.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-zinc-500">
              Selecione 1 ou 2 tipos. Tipos selecionados: {selectedTypeIds?.length ?? 0}.
            </span>
          </label>

          <div className="grid grid-cols-1 gap-4 lg:col-span-2 lg:grid-cols-2">
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-zinc-700">Imagem principal</span>
              {imageUrl ? (
                <div className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 text-xs text-zinc-600">
                  <span>
                    <span className="font-medium text-zinc-700">Atual:</span>{' '}
                    <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-900 underline">
                      abrir imagem
                    </a>
                  </span>
                  {imageTitle ? <span>Título: {imageTitle}</span> : null}
                  <button
                    type="button"
                    className="self-start rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setImageUrl(null);
                      setImageTitle(null);
                    }}
                  >
                    Remover imagem
                  </button>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">Nenhuma imagem enviada.</p>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    setIsImageUploading(true);
                    const result = await uploadMediaFile(file, 'POKEMON_IMAGE');
                    setImageUrl(result.url);
                    setImageTitle(result.originalName);
                  } catch (err) {
                    if (err instanceof Error) {
                      alert(err.message);
                    }
                  } finally {
                    setIsImageUploading(false);
                    event.target.value = '';
                  }
                }}
              />
              {isImageUploading ? <span className="text-xs text-zinc-500">Enviando imagem…</span> : null}
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-zinc-700">Áudio principal</span>
              {audioUrl ? (
                <div className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 text-xs text-zinc-600">
                  <span>
                    <span className="font-medium text-zinc-700">Atual:</span>{' '}
                    <a href={audioUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-900 underline">
                      ouvir áudio
                    </a>
                  </span>
                  {audioTitle ? <span>Título: {audioTitle}</span> : null}
                  <button
                    type="button"
                    className="self-start rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setAudioUrl(null);
                      setAudioTitle(null);
                    }}
                  >
                    Remover áudio
                  </button>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">Nenhum áudio enviado.</p>
              )}
              <input
                type="file"
                accept="audio/mpeg,audio/ogg,audio/wav"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    setIsAudioUploading(true);
                    const result = await uploadMediaFile(file, 'POKEMON_AUDIO');
                    setAudioUrl(result.url);
                    setAudioTitle(result.originalName);
                  } catch (err) {
                    if (err instanceof Error) {
                      alert(err.message);
                    }
                  } finally {
                    setIsAudioUploading(false);
                    event.target.value = '';
                  }
                }}
              />
              {isAudioUploading ? <span className="text-xs text-zinc-500">Enviando áudio…</span> : null}
            </div>
          </div>

          <label className="flex flex-col gap-2 text-sm lg:col-span-2">
            <span className="font-medium text-zinc-700">Descrição</span>
            <textarea
              rows={3}
              className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900"
              {...register('description')}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-700">Classificação</span>
            <input
              type="text"
              className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900"
              {...register('classification')}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-700">Altura (m)</span>
            <input
              type="number"
              step="0.01"
              min={0}
              className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900"
              {...register('heightMeters', { valueAsNumber: true })}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-700">Peso (kg)</span>
            <input
              type="number"
              step="0.01"
              min={0}
              className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900"
              {...register('weightKilograms', { valueAsNumber: true })}
            />
          </label>

          <fieldset className="flex items-center gap-6 text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" {...register('isLegendary')} />
              Lendário
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" {...register('isMythical')} />
              Mítico
            </label>
          </fieldset>

          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-zinc-700">HP</span>
              <input type="number" min={1} max={300} {...register('baseHp', { valueAsNumber: true })} className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-zinc-700">Ataque</span>
              <input type="number" min={1} max={300} {...register('baseAttack', { valueAsNumber: true })} className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-zinc-700">Defesa</span>
              <input type="number" min={1} max={300} {...register('baseDefense', { valueAsNumber: true })} className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-zinc-700">Ataque Especial</span>
              <input type="number" min={1} max={300} {...register('baseSpAttack', { valueAsNumber: true })} className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-zinc-700">Defesa Especial</span>
              <input type="number" min={1} max={300} {...register('baseSpDefense', { valueAsNumber: true })} className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-zinc-700">Velocidade</span>
              <input type="number" min={1} max={300} {...register('baseSpeed', { valueAsNumber: true })} className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900" />
            </label>
          </div>

          <div className="flex items-end gap-2 lg:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting || upsertMutation.isPending}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {editing ? 'Salvar alterações' : 'Cadastrar Pokémon'}
            </button>
            {editing ? (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900">Pokémon cadastrados</h2>
          {pokemonsQuery.isFetching ? (
            <span className="text-xs text-zinc-500">Atualizando…</span>
          ) : null}
        </div>

        {pokemonsQuery.isLoading ? (
          <p className="mt-6 text-sm text-zinc-500">Carregando…</p>
        ) : pokemonsQuery.isError ? (
          <p className="mt-6 text-sm text-red-600">{(pokemonsQuery.error as Error).message}</p>
        ) : pokemonsQuery.data?.results.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-100 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                <tr>
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">Geração</th>
                  <th className="px-4 py-2">Tipos</th>
                  <th className="px-4 py-2">Slug</th>
                  <th className="px-4 py-2">Marcas</th>
                  <th className="px-4 py-2">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {pokemonsQuery.data.results.map((pokemon) => (
                  <tr key={pokemon.id}>
                    <td className="px-4 py-3 font-medium text-zinc-800">
                      #{pokemon.indexNumber.toString().padStart(4, '0')} — {pokemon.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {pokemon.generation.number}ª ({pokemon.generation.name})
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {pokemon.types
                        .sort((a, b) => a.slot - b.slot)
                        .map((type) => type.name)
                        .join(', ')}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{pokemon.slug}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {[pokemon.isLegendary ? 'Lendário' : null, pokemon.isMythical ? 'Mítico' : null]
                        .filter(Boolean)
                        .join(' • ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                          onClick={() => startEdit(pokemon)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          onClick={async () => {
                            if (confirm(`Excluir ${pokemon.name}?`)) {
                              try {
                                await deleteMutation.mutateAsync(pokemon.id);
                              } catch (err) {
                                if (err instanceof Error) {
                                  alert(err.message);
                                }
                              }
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 text-sm text-zinc-500">Nenhum Pokémon cadastrado.</p>
        )}
      </section>
    </div>
  );
}


