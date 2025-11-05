import { prisma } from '@/lib/prisma';

export default async function DashboardHomePage() {
  const [generations, types, pokemons] = await Promise.all([
    prisma.generation.count(),
    prisma.type.count(),
    prisma.pokemon.count(),
  ]);

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold text-zinc-900">Visão geral</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Resumo rápido dos dados do Pokédex.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Gerações</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{generations}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Tipos</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{types}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Pokémon</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{pokemons}</p>
        </div>
      </div>
    </section>
  );
}


