import { GenerationsManager } from '@/components/dashboard/generations/GenerationsManager';

export default function GenerationsPage() {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900">Gerações</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Cadastre e organize as gerações de Pokémon disponíveis.
        </p>
      </header>
      <GenerationsManager />
    </section>
  );
}


