import { PokemonsManager } from '@/components/dashboard/pokemons/PokemonsManager';

export default function PokemonsPage() {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900">Pokémon</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Cadastre, edite e remova entradas do Pokédex.
        </p>
      </header>
      <PokemonsManager />
    </section>
  );
}


