'use client';

import { useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

type TypeRelation = {
  id: string;
  name: string;
  slug: string;
};

type TypeItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  colorHex?: string | null;
  strengths: TypeRelation[];
  weaknesses: TypeRelation[];
  resistances: TypeRelation[];
  immunities: TypeRelation[];
};

type TypeFormValues = {
  id?: string;
  name: string;
  description?: string;
  slug?: string;
  colorHex?: string;
  strongAgainst: string[];
  weakAgainst: string[];
  immuneTo: string[];
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { message: string; issues?: unknown };
};

const fetchTypes = async (): Promise<TypeItem[]> => {
  const response = await fetch('/api/types', { cache: 'no-store' });
  const body = (await response.json()) as ApiResponse<TypeItem[]>;

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error?.message ?? 'Falha ao carregar tipos');
  }

  return body.data;
};

export function TypesManager(): JSX.Element {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<TypeItem | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<TypeFormValues>({
    defaultValues: {
      name: '',
      description: '',
      slug: '',
      colorHex: '',
      strongAgainst: [],
      weakAgainst: [],
      immuneTo: [],
    },
  });

  const typesQuery = useQuery({
    queryKey: ['types'],
    queryFn: fetchTypes,
  });

  const options = useMemo(() => typesQuery.data ?? [], [typesQuery.data]);
  const currentId = watch('id');
  const relationOptions = useMemo(
    () => options.filter((type) => type.id !== currentId),
    [options, currentId],
  );

  const upsertMutation = useMutation({
    mutationFn: async (values: TypeFormValues) => {
      const payload = {
        name: values.name,
        description: values.description?.trim() || undefined,
        slug: values.slug?.trim() || undefined,
        colorHex: values.colorHex?.trim() || undefined,
        relations: {
          strongAgainst: values.strongAgainst,
          weakAgainst: values.weakAgainst,
          immuneTo: values.immuneTo,
        },
      };

      const response = await fetch(values.id ? `/api/types/${values.id}` : '/api/types', {
        method: values.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as ApiResponse<TypeItem>;
      if (!response.ok || !body.success || !body.data) {
        throw new Error(body.error?.message ?? 'Não foi possível salvar.');
      }

      return body.data;
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['types'] });
      reset();
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/types/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        const body = (await response.json()) as ApiResponse<never>;
        throw new Error(body.error?.message ?? 'Não foi possível excluir.');
      }
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['types'] });
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await upsertMutation.mutateAsync(values);
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  });

  const startEdit = (type: TypeItem) => {
    setEditing(type);
    reset({
      id: type.id,
      name: type.name,
      description: type.description ?? undefined,
      slug: type.slug,
      colorHex: type.colorHex ?? undefined,
      strongAgainst: type.strengths.map((rel) => rel.id),
      weakAgainst: type.weaknesses.map((rel) => rel.id),
      immuneTo: type.immunities.map((rel) => rel.id),
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    reset();
  };

  const renderRelationSummary = (items: TypeRelation[]) =>
    items.length
      ? items
          .map((rel) => rel.name)
          .sort((a, b) => a.localeCompare(b))
          .join(', ')
      : '—';

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">
          {editing ? 'Editar tipo' : 'Criar novo tipo'}
        </h2>
        <form className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
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
            <span className="font-medium text-zinc-700">Cor (hex)</span>
            <input
              type="text"
              placeholder="#FF0000"
              className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900"
              {...register('colorHex')}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm sm:col-span-2">
            <span className="font-medium text-zinc-700">Descrição</span>
            <textarea
              rows={3}
              className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900"
              {...register('description')}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-700">Forte contra</span>
            <select
              multiple
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              size={6}
              {...register('strongAgainst')}
            >
              {relationOptions.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-700">Fraco contra</span>
            <select
              multiple
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              size={6}
              {...register('weakAgainst')}
            >
              {relationOptions.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-700">Imune a</span>
            <select
              multiple
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              size={6}
              {...register('immuneTo')}
            >
              {relationOptions.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting || upsertMutation.isPending}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {editing ? 'Salvar alterações' : 'Criar tipo'}
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
          <h2 className="text-lg font-medium text-zinc-900">Tipos cadastrados</h2>
          {typesQuery.isFetching ? <span className="text-xs text-zinc-500">Atualizando…</span> : null}
        </div>

        {typesQuery.isLoading ? (
          <p className="mt-6 text-sm text-zinc-500">Carregando…</p>
        ) : typesQuery.isError ? (
          <p className="mt-6 text-sm text-red-600">{(typesQuery.error as Error).message}</p>
        ) : typesQuery.data?.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-100 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                <tr>
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">Slug</th>
                  <th className="px-4 py-2">Cor</th>
                  <th className="px-4 py-2">Forte</th>
                  <th className="px-4 py-2">Fraco</th>
                  <th className="px-4 py-2">Imune</th>
                  <th className="px-4 py-2">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {typesQuery.data.map((type) => (
                  <tr key={type.id}>
                    <td className="px-4 py-3 font-medium text-zinc-800">{type.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{type.slug}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {type.colorHex ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: type.colorHex }} />
                          {type.colorHex}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{renderRelationSummary(type.strengths)}</td>
                    <td className="px-4 py-3 text-zinc-600">{renderRelationSummary(type.weaknesses)}</td>
                    <td className="px-4 py-3 text-zinc-600">{renderRelationSummary(type.immunities)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                          onClick={() => startEdit(type)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          onClick={async () => {
                            if (confirm(`Excluir ${type.name}?`)) {
                              try {
                                await deleteMutation.mutateAsync(type.id);
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
          <p className="mt-6 text-sm text-zinc-500">Nenhum tipo cadastrado.</p>
        )}
      </section>
    </div>
  );
}


