'use client';

import { useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

type Generation = {
  id: string;
  name: string;
  number: number;
  description?: string | null;
  releasedAt?: string | null;
};

type GenerationFormValues = {
  id?: string;
  name: string;
  number: number;
  description?: string;
  releasedAt?: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { message: string; issues?: unknown };
};

const fetchGenerations = async (): Promise<Generation[]> => {
  const response = await fetch('/api/generations', { cache: 'no-store' });
  const payload = (await response.json()) as ApiResponse<Generation[]>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error?.message ?? 'Falha ao carregar gerações');
  }

  return payload.data;
};

export function GenerationsManager(): JSX.Element {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Generation | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<GenerationFormValues>({
    defaultValues: {
      name: '',
      number: 1,
      description: '',
      releasedAt: '',
    },
  });

  const generationsQuery = useQuery({
    queryKey: ['generations'],
    queryFn: fetchGenerations,
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: GenerationFormValues) => {
      const payload = {
        name: values.name,
        number: Number(values.number),
        description: values.description?.trim() || undefined,
        releasedAt: values.releasedAt ? new Date(values.releasedAt).toISOString() : undefined,
      };

      const response = await fetch(
        values.id ? `/api/generations/${values.id}` : '/api/generations',
        {
          method: values.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      const body = (await response.json()) as ApiResponse<Generation>;
      if (!response.ok || !body.success || !body.data) {
        throw new Error(body.error?.message ?? 'Não foi possível salvar.');
      }

      return body.data;
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['generations'] });
      reset();
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/generations/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const body = (await response.json()) as ApiResponse<never>;
        throw new Error(body.error?.message ?? 'Não foi possível excluir.');
      }
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['generations'] });
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await upsertMutation.mutateAsync({
        ...values,
        number: Number(values.number),
      });
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  });

  const startEdit = (generation: Generation) => {
    setEditing(generation);
    reset({
      id: generation.id,
      name: generation.name,
      number: generation.number,
      description: generation.description ?? undefined,
      releasedAt: generation.releasedAt ? generation.releasedAt.substring(0, 10) : undefined,
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    reset();
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">
          {editing ? 'Editar geração' : 'Criar nova geração'}
        </h2>
        <form className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-700">Nome</span>
            <input
              type="text"
              className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900"
              required
              {...register('name', { required: true })}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-700">Número</span>
            <input
              type="number"
              min={1}
              className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900"
              required
              {...register('number', { valueAsNumber: true, required: true })}
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
            <span className="font-medium text-zinc-700">Data de lançamento</span>
            <input
              type="date"
              className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900"
              {...register('releasedAt')}
            />
          </label>

          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting || upsertMutation.isPending}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {editing ? 'Salvar alterações' : 'Criar geração'}
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
          <h2 className="text-lg font-medium text-zinc-900">Gerações cadastradas</h2>
          {generationsQuery.isFetching ? (
            <span className="text-xs text-zinc-500">Atualizando…</span>
          ) : null}
        </div>

        {generationsQuery.isLoading ? (
          <p className="mt-6 text-sm text-zinc-500">Carregando…</p>
        ) : generationsQuery.isError ? (
          <p className="mt-6 text-sm text-red-600">
            {(generationsQuery.error as Error).message}
          </p>
        ) : generationsQuery.data?.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-100 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                <tr>
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">Número</th>
                  <th className="px-4 py-2">Lançamento</th>
                  <th className="px-4 py-2">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {generationsQuery.data.map((generation) => (
                  <tr key={generation.id}>
                    <td className="px-4 py-3 font-medium text-zinc-800">{generation.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{generation.number}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {generation.releasedAt
                        ? new Date(generation.releasedAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                          onClick={() => startEdit(generation)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          onClick={async () => {
                            if (confirm(`Excluir ${generation.name}?`)) {
                              try {
                                await deleteMutation.mutateAsync(generation.id);
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
          <p className="mt-6 text-sm text-zinc-500">Nenhuma geração cadastrada ainda.</p>
        )}
      </section>
    </div>
  );
}


